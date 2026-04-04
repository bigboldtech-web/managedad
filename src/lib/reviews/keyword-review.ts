import { getAnthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { getUserCampaignData } from "./base";
import type { ReviewResult, ReviewFinding, ReviewAction } from "./types";

export async function runKeywordReview(userId: string): Promise<ReviewResult> {
  const { keywords, campaigns, metrics } = await getUserCampaignData(userId, 7);
  const findings: ReviewFinding[] = [];
  const actions: ReviewAction[] = [];

  if (keywords.length === 0) {
    return { reviewType: "KEYWORD_REVIEW", findings: [], actions: [], summary: "No active keywords to review." };
  }

  // Analyze each keyword
  for (const kw of keywords) {
    const clicks = Number(kw.clicks);
    const conversions = kw.conversions;
    const spend = Number(kw.spend);
    const impressions = Number(kw.impressions);
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const campaign = campaigns.find((c) => c.id === kw.campaignId);

    // Waste: high spend, zero conversions
    if (spend > 500 && conversions === 0 && clicks > 20) {
      findings.push({
        type: "WASTE", impact: "HIGH",
        title: `"${kw.text}" is wasting money`,
        description: `Spent ₹${spend.toLocaleString("en-IN")} with ${clicks} clicks but 0 conversions. Consider pausing or adding as negative.`,
        campaignId: kw.campaignId, campaignName: campaign?.name,
        metric: `₹${spend.toLocaleString("en-IN")} wasted`,
      });
      actions.push({ actionType: "PAUSE_KEYWORD", description: `Pause "${kw.text}" — ₹${spend.toFixed(0)} spent, 0 conversions`, campaignId: kw.campaignId, applied: false });
    }

    // Low CTR
    if (impressions > 500 && ctr < 1) {
      findings.push({
        type: "WARNING", impact: "MEDIUM",
        title: `"${kw.text}" has very low CTR (${ctr.toFixed(2)}%)`,
        description: `${impressions.toLocaleString()} impressions but only ${clicks} clicks. Ad copy may not match search intent.`,
        campaignId: kw.campaignId, campaignName: campaign?.name,
      });
    }

    // Low quality score
    if (kw.qualityScore && kw.qualityScore < 5 && impressions > 100) {
      findings.push({
        type: "WARNING", impact: "MEDIUM",
        title: `"${kw.text}" has low Quality Score (${kw.qualityScore}/10)`,
        description: `Low Quality Score increases your CPC. Improve ad relevance and landing page experience.`,
        campaignId: kw.campaignId, campaignName: campaign?.name,
      });
    }

    // Opportunity: broad match converting well → suggest exact
    if (kw.matchType === "BROAD" && conversions >= 3 && spend > 0) {
      const cpa = spend / conversions;
      findings.push({
        type: "OPPORTUNITY", impact: "MEDIUM",
        title: `Upgrade "${kw.text}" to Exact match`,
        description: `This broad match keyword is converting at ₹${cpa.toFixed(0)} CPA. Adding as exact match could lower costs.`,
        campaignId: kw.campaignId, campaignName: campaign?.name,
      });
    }
  }

  // Use Claude to generate summary
  let summary = `Reviewed ${keywords.length} keywords across ${campaigns.length} campaigns. Found ${findings.filter(f => f.type === "WASTE").length} wasteful keywords, ${findings.filter(f => f.type === "OPPORTUNITY").length} opportunities.`;

  try {
    const anthropic = getAnthropic();
    const msg = await anthropic.messages.create({
      model: CLAUDE_MODEL, max_tokens: 300,
      messages: [{ role: "user", content: `Summarize this keyword review in 2-3 sentences for a business owner. Be direct and actionable.\n\nFindings: ${JSON.stringify(findings.slice(0, 10))}` }],
    });
    if (msg.content[0].type === "text") summary = msg.content[0].text;
  } catch {}

  return { reviewType: "KEYWORD_REVIEW", findings, actions, summary };
}
