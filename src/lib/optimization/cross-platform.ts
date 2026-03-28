import { prisma } from "@/lib/prisma";

// ─── Types ───────────────────────────────────────────────────

export interface PlatformPerformance {
  platform: "GOOGLE_ADS" | "META_ADS";
  totalSpend: number;
  totalRevenue: number;
  totalConversions: number;
  roas: number;
  cpa: number;
  activeCampaigns: number;
}

export interface ReallocationRecommendation {
  fromPlatform: "GOOGLE_ADS" | "META_ADS";
  toPlatform: "GOOGLE_ADS" | "META_ADS";
  fromCampaignId: string;
  toCampaignId: string;
  amount: number; // INR amount to shift
  reason: string;
  fromCurrentBudget: number;
  toCurrentBudget: number;
  fromNewBudget: number;
  toNewBudget: number;
  projectedRoasImprovement: number; // percentage
}

export interface CrossPlatformAnalysis {
  platforms: PlatformPerformance[];
  recommendations: ReallocationRecommendation[];
  isEligible: boolean;
  reason?: string;
}

// ─── Constants ───────────────────────────────────────────────

const LOOKBACK_DAYS = 14;
const ROAS_DIFF_THRESHOLD = 0.30; // 30% difference triggers reallocation
const MAX_SHIFT_PERCENT = 0.15; // shift up to 15% of underperformer's budget

// ─── Main Function ───────────────────────────────────────────

export async function analyzeCrossPlatformReallocation(
  userId: string
): Promise<CrossPlatformAnalysis> {
  // 1. Check subscription is AGENCY plan
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription || subscription.plan !== "AGENCY") {
    return {
      platforms: [],
      recommendations: [],
      isEligible: false,
      reason: "Cross-platform reallocation requires the Agency plan.",
    };
  }

  if (subscription.status !== "ACTIVE" && subscription.status !== "TRIALING") {
    return {
      platforms: [],
      recommendations: [],
      isEligible: false,
      reason: "Your subscription is not active.",
    };
  }

  // 2. Fetch last 14 days of DailyMetric grouped by platform
  const sinceDate = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const dailyMetrics = await prisma.dailyMetric.findMany({
    where: {
      date: { gte: sinceDate },
      campaign: { userId },
    },
    include: {
      campaign: {
        select: { id: true, platform: true },
      },
    },
  });

  // 3. Aggregate per-platform performance
  const platformAgg: Record<
    string,
    { spend: number; revenue: number; conversions: number; campaignIds: Set<string> }
  > = {
    GOOGLE_ADS: { spend: 0, revenue: 0, conversions: 0, campaignIds: new Set() },
    META_ADS: { spend: 0, revenue: 0, conversions: 0, campaignIds: new Set() },
  };

  for (const m of dailyMetrics) {
    const p = m.campaign.platform;
    platformAgg[p].spend += Number(m.spend);
    platformAgg[p].revenue += Number(m.revenue);
    platformAgg[p].conversions += m.conversions;
    platformAgg[p].campaignIds.add(m.campaign.id);
  }

  const platforms: PlatformPerformance[] = (["GOOGLE_ADS", "META_ADS"] as const).map(
    (platform) => {
      const agg = platformAgg[platform];
      return {
        platform,
        totalSpend: agg.spend,
        totalRevenue: agg.revenue,
        totalConversions: agg.conversions,
        roas: agg.spend > 0 ? agg.revenue / agg.spend : 0,
        cpa: agg.conversions > 0 ? agg.spend / agg.conversions : 0,
        activeCampaigns: agg.campaignIds.size,
      };
    }
  );

  // Need both platforms to have data for cross-platform analysis
  if (platforms.every((p) => p.totalSpend === 0)) {
    return {
      platforms,
      recommendations: [],
      isEligible: true,
      reason: "No spend data on either platform in the last 14 days.",
    };
  }

  if (platforms.some((p) => p.totalSpend === 0)) {
    return {
      platforms,
      recommendations: [],
      isEligible: true,
      reason: "Only one platform has spend data. Both platforms need active spend for reallocation.",
    };
  }

  // 4. Determine if one platform significantly outperforms the other
  const [google, meta] = platforms;
  const betterPlatform = google.roas >= meta.roas ? google : meta;
  const worsePlatform = google.roas >= meta.roas ? meta : google;

  const roasDiff =
    worsePlatform.roas > 0
      ? (betterPlatform.roas - worsePlatform.roas) / worsePlatform.roas
      : betterPlatform.roas > 0
        ? 1
        : 0;

  if (roasDiff < ROAS_DIFF_THRESHOLD) {
    return {
      platforms,
      recommendations: [],
      isEligible: true,
      reason: `ROAS difference is only ${(roasDiff * 100).toFixed(1)}%, below the 30% threshold for reallocation. Both platforms are performing similarly.`,
    };
  }

  // 5. Generate reallocation recommendations
  // Fetch active campaigns with daily budgets for both platforms
  const activeCampaigns = await prisma.campaign.findMany({
    where: {
      userId,
      status: "ACTIVE",
      dailyBudget: { not: null, gt: 0 },
    },
    orderBy: { spend: "desc" },
  });

  const fromCampaigns = activeCampaigns.filter(
    (c) => c.platform === worsePlatform.platform
  );
  const toCampaigns = activeCampaigns.filter(
    (c) => c.platform === betterPlatform.platform
  );

  if (fromCampaigns.length === 0 || toCampaigns.length === 0) {
    return {
      platforms,
      recommendations: [],
      isEligible: true,
      reason: "No active campaigns with daily budgets on one or both platforms.",
    };
  }

  const recommendations: ReallocationRecommendation[] = [];

  // Calculate total shift amount from the underperforming platform
  const totalUnderperformerBudget = fromCampaigns.reduce(
    (sum, c) => sum + Number(c.dailyBudget),
    0
  );
  const totalShiftAmount = totalUnderperformerBudget * MAX_SHIFT_PERCENT;

  // Distribute the shift: take proportionally from each underperformer,
  // give to the top-performing campaign on the better platform
  const bestToCampaign = toCampaigns[0]; // highest spend = most proven

  for (const fromCampaign of fromCampaigns) {
    const fromBudget = Number(fromCampaign.dailyBudget);
    const shiftAmount = Math.round(fromBudget * MAX_SHIFT_PERCENT);

    if (shiftAmount < 10) continue; // skip trivial amounts

    const fromLabel =
      worsePlatform.platform === "GOOGLE_ADS" ? "Google Ads" : "Meta Ads";
    const toLabel =
      betterPlatform.platform === "GOOGLE_ADS" ? "Google Ads" : "Meta Ads";

    // Project ROAS improvement: proportional to the ROAS gap
    const projectedImprovement = Math.min(
      roasDiff * MAX_SHIFT_PERCENT * 100,
      25
    );

    recommendations.push({
      fromPlatform: worsePlatform.platform,
      toPlatform: betterPlatform.platform,
      fromCampaignId: fromCampaign.id,
      toCampaignId: bestToCampaign.id,
      amount: shiftAmount,
      reason: `${toLabel} ROAS (${betterPlatform.roas.toFixed(2)}x) is ${(roasDiff * 100).toFixed(0)}% higher than ${fromLabel} (${worsePlatform.roas.toFixed(2)}x). Shift ${formatINR(shiftAmount)}/day from "${fromCampaign.name}" to "${bestToCampaign.name}".`,
      fromCurrentBudget: fromBudget,
      toCurrentBudget: Number(bestToCampaign.dailyBudget),
      fromNewBudget: fromBudget - shiftAmount,
      toNewBudget: Number(bestToCampaign.dailyBudget) + shiftAmount,
      projectedRoasImprovement: Math.round(projectedImprovement * 10) / 10,
    });
  }

  return {
    platforms,
    recommendations,
    isEligible: true,
  };
}

// ─── Apply a single recommendation ──────────────────────────

export async function applyReallocation(
  userId: string,
  recommendation: ReallocationRecommendation
): Promise<{ success: boolean; error?: string }> {
  // Verify campaigns belong to this user
  const [fromCampaign, toCampaign] = await Promise.all([
    prisma.campaign.findFirst({
      where: { id: recommendation.fromCampaignId, userId },
    }),
    prisma.campaign.findFirst({
      where: { id: recommendation.toCampaignId, userId },
    }),
  ]);

  if (!fromCampaign || !toCampaign) {
    return { success: false, error: "Campaign not found or not owned by user." };
  }

  // Create an optimization run for tracking
  const run = await prisma.optimizationRun.create({
    data: {
      userId,
      triggerType: "MANUAL",
      status: "RUNNING",
      startedAt: new Date(),
    },
  });

  try {
    // Update budgets in a transaction
    await prisma.$transaction([
      prisma.campaign.update({
        where: { id: recommendation.fromCampaignId },
        data: { dailyBudget: recommendation.fromNewBudget },
      }),
      prisma.campaign.update({
        where: { id: recommendation.toCampaignId },
        data: {
          dailyBudget: recommendation.toNewBudget,
        },
      }),
      // Log the decrease action
      prisma.optimizationAction.create({
        data: {
          optimizationRunId: run.id,
          campaignId: recommendation.fromCampaignId,
          actionType: "DECREASE_BUDGET",
          description: `Cross-platform reallocation: reduced daily budget by ${formatINR(recommendation.amount)}`,
          previousValue: { dailyBudget: recommendation.fromCurrentBudget },
          newValue: { dailyBudget: recommendation.fromNewBudget },
          status: "APPLIED",
          appliedAt: new Date(),
        },
      }),
      // Log the increase action
      prisma.optimizationAction.create({
        data: {
          optimizationRunId: run.id,
          campaignId: recommendation.toCampaignId,
          actionType: "INCREASE_BUDGET",
          description: `Cross-platform reallocation: increased daily budget by ${formatINR(recommendation.amount)}`,
          previousValue: { dailyBudget: recommendation.toCurrentBudget },
          newValue: { dailyBudget: recommendation.toNewBudget },
          status: "APPLIED",
          appliedAt: new Date(),
        },
      }),
      // Mark run as completed
      prisma.optimizationRun.update({
        where: { id: run.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          summary: {
            type: "cross_platform_reallocation",
            fromPlatform: recommendation.fromPlatform,
            toPlatform: recommendation.toPlatform,
            amount: recommendation.amount,
          },
        },
      }),
    ]);

    return { success: true };
  } catch (error) {
    await prisma.optimizationRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        errorLog: String(error),
      },
    });
    return { success: false, error: "Failed to update campaign budgets." };
  }
}

// ─── Helpers ─────────────────────────────────────────────────

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
