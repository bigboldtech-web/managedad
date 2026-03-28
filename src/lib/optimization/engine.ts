import { prisma } from "@/lib/prisma";
import {
  CampaignAnalysis,
  AdAnalysis,
  KeywordAnalysis,
  OptimizationAction,
  OptimizationSettings,
  OptimizationRunSummary,
} from "./types";
import { ALL_RULES } from "./rules";
import { getAIOptimizationActions } from "./ai-advisor";
import { executeApprovedActions } from "./executor";

const DEFAULT_SETTINGS: OptimizationSettings = {
  isEnabled: true,
  autoApply: false,
  minImpressions: 100,
  lowPerformanceThreshold: 0.5,
  highPerformanceThreshold: 2.0,
  maxBudgetIncrease: 25,
  maxBudgetDecrease: 50,
};

async function getUserSettings(
  userId: string
): Promise<OptimizationSettings> {
  const settings = await prisma.optimizationSettings.findUnique({
    where: { userId },
  });

  if (!settings) return DEFAULT_SETTINGS;

  return {
    isEnabled: settings.isEnabled,
    autoApply: settings.autoApply,
    minImpressions: settings.minImpressions,
    lowPerformanceThreshold: Number(settings.lowPerformanceThreshold),
    highPerformanceThreshold: Number(settings.highPerformanceThreshold),
    maxBudgetIncrease: Number(settings.maxBudgetIncrease),
    maxBudgetDecrease: Number(settings.maxBudgetDecrease),
  };
}

async function buildCampaignAnalysis(
  campaignId: string
): Promise<CampaignAnalysis> {
  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: {
      ads: true,
      keywords: true,
      dailyMetrics: {
        where: {
          date: {
            gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { date: "asc" },
      },
    },
  });

  const totalImpressions = Number(campaign.impressions);
  const totalClicks = Number(campaign.clicks);
  const totalConversions = campaign.conversions;
  const totalSpend = Number(campaign.spend);
  const totalRevenue = Number(campaign.revenue);

  const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const avgCpa = totalConversions > 0 ? totalSpend / totalConversions : 0;
  const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  const daysActive = Math.floor(
    (Date.now() - new Date(campaign.createdAt).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const ads: AdAnalysis[] = campaign.ads.map((ad) => {
    const impressions = Number(ad.impressions);
    const clicks = Number(ad.clicks);
    return {
      adId: ad.id,
      adGroupId: ad.adGroupId,
      name: ad.name,
      status: ad.status,
      impressions,
      clicks,
      conversions: ad.conversions,
      spend: Number(ad.spend),
      ctr: impressions > 0 ? clicks / impressions : 0,
      daysSinceCreated: Math.floor(
        (Date.now() - new Date(ad.createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
    };
  });

  const keywords: KeywordAnalysis[] = campaign.keywords.map((kw) => {
    const impressions = Number(kw.impressions);
    const clicks = Number(kw.clicks);
    const spend = Number(kw.spend);
    return {
      keywordId: kw.id,
      text: kw.text,
      matchType: kw.matchType,
      isNegative: kw.isNegative,
      status: kw.status,
      impressions,
      clicks,
      conversions: kw.conversions,
      spend,
      qualityScore: kw.qualityScore,
      ctr: impressions > 0 ? clicks / impressions : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
      cpa: kw.conversions > 0 ? spend / kw.conversions : 0,
    };
  });

  return {
    campaignId: campaign.id,
    campaignName: campaign.name,
    platform: campaign.platform,
    status: campaign.status,
    dailyBudget: Number(campaign.dailyBudget || 0),
    totalImpressions,
    totalClicks,
    totalConversions,
    totalSpend,
    totalRevenue,
    avgCtr,
    avgCpc,
    avgCpa,
    avgRoas,
    daysActive,
    ads,
    keywords,
  };
}

export async function runOptimization(
  userId: string
): Promise<OptimizationRunSummary> {
  const settings = await getUserSettings(userId);

  // Create the optimization run record
  const run = await prisma.optimizationRun.create({
    data: {
      userId,
      triggerType: "MANUAL",
      status: "RUNNING",
      startedAt: new Date(),
    },
  });

  try {
    // Load user's active campaigns
    const campaigns = await prisma.campaign.findMany({
      where: {
        userId,
        status: { in: ["ACTIVE", "PAUSED"] },
      },
      select: { id: true },
    });

    const allActions: OptimizationAction[] = [];
    const allAnalyses: CampaignAnalysis[] = [];

    // Analyze each campaign and run deterministic rules
    for (const campaign of campaigns) {
      const analysis = await buildCampaignAnalysis(campaign.id);
      allAnalyses.push(analysis);

      for (const rule of ALL_RULES) {
        const ruleActions = rule(analysis, settings);
        allActions.push(...ruleActions);
      }
    }

    // Layer in AI advisor recommendations (non-blocking — fallback to rules-only on error)
    try {
      const aiActions = await getAIOptimizationActions(allAnalyses, settings);
      // Deduplicate: skip AI action if same campaignId + actionType already in rules output
      const ruleKeys = new Set(allActions.map((a) => `${a.campaignId}:${a.actionType}`));
      for (const aiAction of aiActions) {
        if (!ruleKeys.has(`${aiAction.campaignId}:${aiAction.actionType}`)) {
          allActions.push(aiAction);
        }
      }
    } catch {
      // AI advisor failure is non-fatal — rules engine output is sufficient
    }

    // Store actions in the database
    if (allActions.length > 0) {
      await prisma.optimizationAction.createMany({
        data: allActions.map((action) => ({
          optimizationRunId: run.id,
          campaignId: action.campaignId,
          adId: action.adId || null,
          keywordId: action.keywordId || null,
          actionType: action.actionType,
          description: action.description,
          previousValue: action.previousValue
            ? JSON.parse(JSON.stringify(action.previousValue))
            : undefined,
          newValue: action.newValue
            ? JSON.parse(JSON.stringify(action.newValue))
            : undefined,
          status: settings.autoApply ? "APPROVED" as const : "PENDING" as const,
        })),
      });

      // If auto-apply is on, execute approved actions immediately
      if (settings.autoApply && allActions.length > 0) {
        try {
          await executeApprovedActions(userId);
        } catch (execError) {
          console.error("Action execution failed:", execError);
        }
      }
    }

    // Compute summary
    const actionsByType: Record<string, number> = {};
    for (const action of allActions) {
      actionsByType[action.actionType] =
        (actionsByType[action.actionType] || 0) + 1;
    }

    const summary = {
      runId: run.id,
      totalActions: allActions.length,
      actionsByType,
      campaignsAnalyzed: campaigns.length,
      completedAt: new Date().toISOString(),
    };

    // Update run status
    await prisma.optimizationRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        summary,
      },
    });

    return summary;
  } catch (error) {
    await prisma.optimizationRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        errorLog: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}
