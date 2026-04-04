import { getUserCampaignData } from "./base";
import type { ReviewResult, ReviewFinding, ReviewAction } from "./types";

export async function runBidReview(userId: string): Promise<ReviewResult> {
  const { keywords, campaigns } = await getUserCampaignData(userId, 7);
  const findings: ReviewFinding[] = [];
  const actions: ReviewAction[] = [];

  const convertingKeywords = keywords.filter((kw) => kw.conversions > 0 && Number(kw.spend) > 0);
  if (convertingKeywords.length === 0) {
    return { reviewType: "BID_REVIEW", findings: [], actions: [], summary: "No converting keywords to analyze bids for." };
  }

  // Calculate average CPA across all keywords
  const totalSpend = convertingKeywords.reduce((s, kw) => s + Number(kw.spend), 0);
  const totalConversions = convertingKeywords.reduce((s, kw) => s + kw.conversions, 0);
  const avgCpa = totalConversions > 0 ? totalSpend / totalConversions : 0;

  for (const kw of convertingKeywords) {
    const spend = Number(kw.spend);
    const cpa = spend / kw.conversions;
    const campaign = campaigns.find((c) => c.id === kw.campaignId);

    // CPA too high — suggest bid decrease
    if (cpa > avgCpa * 2 && kw.conversions >= 2) {
      findings.push({
        type: "WASTE", impact: "HIGH",
        title: `"${kw.text}" CPA is 2x above average`,
        description: `CPA: ₹${cpa.toFixed(0)} vs avg ₹${avgCpa.toFixed(0)}. Reduce bid by 15-20% to bring costs down.`,
        campaignId: kw.campaignId, campaignName: campaign?.name,
        metric: `₹${cpa.toFixed(0)} CPA`,
      });
      actions.push({
        actionType: "ADJUST_BID", description: `Decrease bid for "${kw.text}" — CPA ₹${cpa.toFixed(0)} vs avg ₹${avgCpa.toFixed(0)}`,
        campaignId: kw.campaignId, applied: false,
      });
    }

    // CPA very efficient — suggest bid increase to capture more volume
    if (cpa < avgCpa * 0.5 && kw.conversions >= 3) {
      findings.push({
        type: "OPPORTUNITY", impact: "MEDIUM",
        title: `"${kw.text}" is converting cheaply — scale up`,
        description: `CPA: ₹${cpa.toFixed(0)} (${((1 - cpa / avgCpa) * 100).toFixed(0)}% below avg). Increase bid to capture more impression share.`,
        campaignId: kw.campaignId, campaignName: campaign?.name,
        metric: `₹${cpa.toFixed(0)} CPA`,
      });
      actions.push({
        actionType: "ADJUST_BID", description: `Increase bid for "${kw.text}" — CPA only ₹${cpa.toFixed(0)}`,
        campaignId: kw.campaignId, applied: false,
      });
    }
  }

  const summary = `Reviewed bids on ${convertingKeywords.length} converting keywords. Avg CPA: ₹${avgCpa.toFixed(0)}. Found ${findings.filter(f => f.type === "WASTE").length} overbidding and ${findings.filter(f => f.type === "OPPORTUNITY").length} underbidding opportunities.`;

  return { reviewType: "BID_REVIEW", findings, actions, summary };
}
