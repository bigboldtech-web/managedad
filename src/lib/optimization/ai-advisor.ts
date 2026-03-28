import { getAnthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { CampaignAnalysis, OptimizationAction, OptimizationSettings } from "./types";

/**
 * Uses Claude to generate optimization recommendations for a set of campaigns.
 * Returns structured OptimizationAction[] that can be merged with rules-engine output.
 */
export async function getAIOptimizationActions(
  analyses: CampaignAnalysis[],
  settings: OptimizationSettings
): Promise<OptimizationAction[]> {
  if (analyses.length === 0) return [];

  const campaignSummaries = analyses.map((a) => ({
    id: a.campaignId,
    name: a.campaignName,
    platform: a.platform,
    status: a.status,
    dailyBudget: a.dailyBudget,
    spend: a.totalSpend,
    revenue: a.totalRevenue,
    roas: Number(a.avgRoas.toFixed(2)),
    ctr: Number((a.avgCtr * 100).toFixed(3)),
    cpc: Number(a.avgCpc.toFixed(2)),
    cpa: Number(a.avgCpa.toFixed(2)),
    conversions: a.totalConversions,
    impressions: a.totalImpressions,
    daysActive: a.daysActive,
    adCount: a.ads.length,
    keywordCount: a.keywords.length,
    topWastefulKeywords: a.keywords
      .filter((k) => !k.isNegative && k.spend > 500 && k.conversions === 0)
      .slice(0, 5)
      .map((k) => ({ text: k.text, spend: k.spend, clicks: k.clicks })),
  }));

  const systemPrompt = `You are an expert performance marketing AI managing Google Ads and Meta Ads accounts for Indian businesses. All currency is INR.

User's optimization settings:
- Auto-apply: ${settings.autoApply}
- Min impressions before acting: ${settings.minImpressions}
- Low performance ROAS threshold: ${settings.lowPerformanceThreshold}x
- High performance ROAS threshold: ${settings.highPerformanceThreshold}x
- Max budget increase: ${settings.maxBudgetIncrease}%
- Max budget decrease: ${settings.maxBudgetDecrease}%

You will be given campaign data. Respond ONLY with a valid JSON array of optimization actions. Each action must have:
{
  "campaignId": "<id from input>",
  "actionType": "<one of: INCREASE_BUDGET | DECREASE_BUDGET | PAUSE_AD | PAUSE_KEYWORD | ADD_NEGATIVE_KEYWORD | ADJUST_BID | CREATE_AD_VARIATION | SUGGEST_AB_TEST>",
  "description": "<clear, specific 1-sentence explanation with numbers>",
  "previousValue": { ... },
  "newValue": { ... }
}

Rules:
- Only recommend actions that are clearly supported by the data
- Be conservative — do not recommend actions for campaigns with insufficient data
- For budget changes, stay within the user's max increase/decrease settings
- Prefer pausing over deleting
- If a campaign is performing well, recommend scaling it
- Return [] if no actions are warranted
- Return at most 3 actions per campaign`;

  const userPrompt = `Campaign data (${analyses.length} campaigns):\n${JSON.stringify(campaignSummaries, null, 2)}\n\nReturn optimization actions as JSON array only. No explanation, no markdown.`;

  try {
    const response = await getAnthropic().messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      messages: [{ role: "user", content: userPrompt }],
      system: systemPrompt,
    });

    const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    // Strip any markdown code fences if present
    const json = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(json);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (a: unknown) =>
        typeof a === "object" &&
        a !== null &&
        "campaignId" in a &&
        "actionType" in a &&
        "description" in a
    ) as OptimizationAction[];
  } catch (err) {
    console.error("AI advisor error:", err);
    return [];
  }
}
