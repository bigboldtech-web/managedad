import {
  CampaignAnalysis,
  OptimizationAction,
  OptimizationSettings,
} from "./types";

const DEFAULT_SETTINGS: OptimizationSettings = {
  isEnabled: true,
  autoApply: false,
  minImpressions: 100,
  lowPerformanceThreshold: 0.5,
  highPerformanceThreshold: 2.0,
  maxBudgetIncrease: 25,
  maxBudgetDecrease: 50,
};

/**
 * Rule 1: Pause low-performing ads
 * CTR < 50% of campaign average, 100+ impressions, 7+ days old
 */
export function pauseLowPerformingAds(
  analysis: CampaignAnalysis,
  settings: OptimizationSettings = DEFAULT_SETTINGS
): OptimizationAction[] {
  const actions: OptimizationAction[] = [];
  const ctrThreshold = analysis.avgCtr * settings.lowPerformanceThreshold;

  for (const ad of analysis.ads) {
    if (
      ad.status === "ACTIVE" &&
      ad.impressions >= settings.minImpressions &&
      ad.daysSinceCreated >= 7 &&
      ad.ctr < ctrThreshold
    ) {
      actions.push({
        campaignId: analysis.campaignId,
        adId: ad.adId,
        actionType: "PAUSE_AD",
        description: `Pause ad "${ad.name || ad.adId}" - CTR ${(ad.ctr * 100).toFixed(2)}% is below threshold ${(ctrThreshold * 100).toFixed(2)}% (campaign avg: ${(analysis.avgCtr * 100).toFixed(2)}%)`,
        previousValue: { status: "ACTIVE", ctr: ad.ctr },
        newValue: { status: "PAUSED" },
      });
    }
  }

  return actions;
}

/**
 * Rule 2: Increase budget on winners
 * ROAS > 2x high performance threshold
 */
export function increaseBudgetOnWinners(
  analysis: CampaignAnalysis,
  settings: OptimizationSettings = DEFAULT_SETTINGS
): OptimizationAction[] {
  const actions: OptimizationAction[] = [];

  if (
    analysis.status === "ACTIVE" &&
    analysis.avgRoas > settings.highPerformanceThreshold * 2 &&
    analysis.totalImpressions >= settings.minImpressions &&
    analysis.dailyBudget > 0
  ) {
    const increasePercent = Math.min(
      settings.maxBudgetIncrease,
      (analysis.avgRoas / settings.highPerformanceThreshold - 1) * 10
    );
    const newBudget = analysis.dailyBudget * (1 + increasePercent / 100);

    actions.push({
      campaignId: analysis.campaignId,
      actionType: "INCREASE_BUDGET",
      description: `Increase daily budget for "${analysis.campaignName}" by ${increasePercent.toFixed(0)}% - ROAS ${analysis.avgRoas.toFixed(1)}x exceeds threshold ${(settings.highPerformanceThreshold * 2).toFixed(1)}x`,
      previousValue: { dailyBudget: analysis.dailyBudget },
      newValue: { dailyBudget: Math.round(newBudget * 100) / 100 },
    });
  }

  return actions;
}

/**
 * Rule 3: Decrease budget on losers
 * ROAS < 1.0 after 14 days
 */
export function decreaseBudgetOnLosers(
  analysis: CampaignAnalysis,
  settings: OptimizationSettings = DEFAULT_SETTINGS
): OptimizationAction[] {
  const actions: OptimizationAction[] = [];

  if (
    analysis.status === "ACTIVE" &&
    analysis.avgRoas < 1.0 &&
    analysis.daysActive >= 14 &&
    analysis.totalSpend > 0 &&
    analysis.dailyBudget > 0
  ) {
    const decreasePercent = Math.min(
      settings.maxBudgetDecrease,
      (1 - analysis.avgRoas) * 50
    );
    const newBudget = analysis.dailyBudget * (1 - decreasePercent / 100);

    actions.push({
      campaignId: analysis.campaignId,
      actionType: "DECREASE_BUDGET",
      description: `Decrease daily budget for "${analysis.campaignName}" by ${decreasePercent.toFixed(0)}% - ROAS ${analysis.avgRoas.toFixed(1)}x is below 1.0 after ${analysis.daysActive} days`,
      previousValue: { dailyBudget: analysis.dailyBudget },
      newValue: { dailyBudget: Math.round(newBudget * 100) / 100 },
    });
  }

  return actions;
}

/**
 * Rule 4: Pause wasteful keywords
 * 50+ clicks, 0 conversions, $50+ spend
 */
export function pauseWastefulKeywords(
  analysis: CampaignAnalysis
): OptimizationAction[] {
  const actions: OptimizationAction[] = [];

  for (const kw of analysis.keywords) {
    if (
      !kw.isNegative &&
      kw.status === "ACTIVE" &&
      kw.clicks >= 50 &&
      kw.conversions === 0 &&
      kw.spend >= 50
    ) {
      actions.push({
        campaignId: analysis.campaignId,
        keywordId: kw.keywordId,
        actionType: "PAUSE_KEYWORD",
        description: `Pause keyword "${kw.text}" [${kw.matchType}] - ${kw.clicks} clicks, $${kw.spend.toFixed(2)} spend, 0 conversions`,
        previousValue: { status: "ACTIVE", clicks: kw.clicks, spend: kw.spend },
        newValue: { status: "PAUSED" },
      });
    }
  }

  return actions;
}

/**
 * Rule 5: Add negative keywords
 * High spend, zero conversion search terms
 */
export function addNegativeKeywords(
  analysis: CampaignAnalysis
): OptimizationAction[] {
  const actions: OptimizationAction[] = [];

  for (const kw of analysis.keywords) {
    if (
      !kw.isNegative &&
      kw.status === "ACTIVE" &&
      kw.matchType === "BROAD" &&
      kw.spend >= 30 &&
      kw.conversions === 0 &&
      kw.clicks >= 20
    ) {
      actions.push({
        campaignId: analysis.campaignId,
        keywordId: kw.keywordId,
        actionType: "ADD_NEGATIVE_KEYWORD",
        description: `Add "${kw.text}" as negative keyword - broad match with $${kw.spend.toFixed(2)} spend and 0 conversions`,
        previousValue: { isNegative: false, matchType: kw.matchType },
        newValue: { isNegative: true, matchType: "EXACT" },
      });
    }
  }

  return actions;
}

/**
 * Rule 6: Adjust keyword bids
 * CPA-based bid adjustments
 */
export function adjustKeywordBids(
  analysis: CampaignAnalysis
): OptimizationAction[] {
  const actions: OptimizationAction[] = [];
  const targetCpa = analysis.avgCpa > 0 ? analysis.avgCpa : null;

  if (!targetCpa) return actions;

  for (const kw of analysis.keywords) {
    if (
      !kw.isNegative &&
      kw.status === "ACTIVE" &&
      kw.conversions > 0 &&
      kw.clicks >= 20
    ) {
      const kwCpa = kw.spend / kw.conversions;
      const deviation = (kwCpa - targetCpa) / targetCpa;

      if (Math.abs(deviation) > 0.2) {
        const adjustment = deviation > 0 ? "decrease" : "increase";
        const adjustPercent = Math.min(Math.abs(deviation) * 50, 30);
        const newCpc =
          adjustment === "decrease"
            ? kw.cpc * (1 - adjustPercent / 100)
            : kw.cpc * (1 + adjustPercent / 100);

        actions.push({
          campaignId: analysis.campaignId,
          keywordId: kw.keywordId,
          actionType: "ADJUST_BID",
          description: `${adjustment === "increase" ? "Increase" : "Decrease"} bid for "${kw.text}" by ${adjustPercent.toFixed(0)}% - CPA $${kwCpa.toFixed(2)} vs target $${targetCpa.toFixed(2)}`,
          previousValue: { cpc: kw.cpc, cpa: kwCpa },
          newValue: { cpc: Math.round(newCpc * 100) / 100 },
        });
      }
    }
  }

  return actions;
}

/**
 * Rule 7: Suggest A/B tests
 * Single ad in ad group
 */
export function suggestABTests(
  analysis: CampaignAnalysis
): OptimizationAction[] {
  const actions: OptimizationAction[] = [];

  // Group ads by ad group
  const adGroupMap = new Map<string, typeof analysis.ads>();
  for (const ad of analysis.ads) {
    const groupId = ad.adGroupId || "ungrouped";
    if (!adGroupMap.has(groupId)) {
      adGroupMap.set(groupId, []);
    }
    adGroupMap.get(groupId)!.push(ad);
  }

  for (const [groupId, ads] of adGroupMap) {
    const activeAds = ads.filter((a) => a.status === "ACTIVE");
    if (activeAds.length === 1 && groupId !== "ungrouped") {
      const ad = activeAds[0];
      actions.push({
        campaignId: analysis.campaignId,
        adId: ad.adId,
        actionType: "SUGGEST_AB_TEST",
        description: `Ad group has only 1 active ad ("${ad.name || ad.adId}"). Consider creating a variation to A/B test performance.`,
        previousValue: { activeAdCount: 1, adGroupId: groupId },
        newValue: { suggestedActiveAdCount: 2 },
      });
    }
  }

  return actions;
}

/**
 * Rule 8: Create ad variations
 * Suggest variations for top-performing ads
 */
export function createAdVariations(
  analysis: CampaignAnalysis
): OptimizationAction[] {
  const actions: OptimizationAction[] = [];

  const activeAds = analysis.ads.filter(
    (a) => a.status === "ACTIVE" && a.impressions >= 200
  );

  // Sort by CTR descending to find top performers
  const sorted = [...activeAds].sort((a, b) => b.ctr - a.ctr);
  const topPerformers = sorted.slice(0, 3);

  for (const ad of topPerformers) {
    if (ad.ctr > analysis.avgCtr * 1.2) {
      actions.push({
        campaignId: analysis.campaignId,
        adId: ad.adId,
        actionType: "CREATE_AD_VARIATION",
        description: `Create variation of top-performing ad "${ad.name || ad.adId}" - CTR ${(ad.ctr * 100).toFixed(2)}% is ${((ad.ctr / analysis.avgCtr - 1) * 100).toFixed(0)}% above average`,
        previousValue: {
          ctr: ad.ctr,
          impressions: ad.impressions,
          clicks: ad.clicks,
        },
        newValue: { action: "create_variation" },
      });
    }
  }

  return actions;
}

export const ALL_RULES = [
  pauseLowPerformingAds,
  increaseBudgetOnWinners,
  decreaseBudgetOnLosers,
  pauseWastefulKeywords,
  addNegativeKeywords,
  adjustKeywordBids,
  suggestABTests,
  createAdVariations,
] as const;
