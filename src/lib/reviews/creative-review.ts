import { getAnthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { getUserCampaignData } from "./base";
import type { ReviewResult, ReviewFinding } from "./types";

export async function runCreativeReview(userId: string): Promise<ReviewResult> {
  const { ads, campaigns, metrics } = await getUserCampaignData(userId, 14);
  const findings: ReviewFinding[] = [];

  if (ads.length === 0) {
    return { reviewType: "CREATIVE_REVIEW", findings: [], actions: [], summary: "No active ads to review." };
  }

  for (const ad of ads) {
    const impressions = Number(ad.impressions);
    const clicks = Number(ad.clicks);
    const conversions = ad.conversions;
    const spend = Number(ad.spend);
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const campaign = campaigns.find((c) => c.id === ad.campaignId);

    // Ad fatigue: low CTR with significant impressions
    if (impressions > 1000 && ctr < 1) {
      findings.push({
        type: "WASTE", impact: "HIGH",
        title: `Ad "${ad.name || "Unnamed"}" shows fatigue (${ctr.toFixed(2)}% CTR)`,
        description: `${impressions.toLocaleString()} impressions but CTR below 1%. This ad needs fresh creative or should be paused.`,
        campaignId: ad.campaignId, campaignName: campaign?.name,
        metric: `${ctr.toFixed(2)}% CTR`,
      });
    }

    // High performer — flag for scaling
    if (conversions >= 5 && ctr > 3) {
      findings.push({
        type: "SUCCESS", impact: "HIGH",
        title: `"${ad.name || "Unnamed"}" is a top performer`,
        description: `CTR ${ctr.toFixed(1)}% with ${conversions} conversions. Consider increasing budget for this campaign.`,
        campaignId: ad.campaignId, campaignName: campaign?.name,
        metric: `${conversions} conversions`,
      });
    }

    // Zero conversions with significant spend
    if (spend > 1000 && conversions === 0) {
      findings.push({
        type: "WASTE", impact: "HIGH",
        title: `"${ad.name || "Unnamed"}" — ₹${spend.toLocaleString("en-IN")} spent, 0 conversions`,
        description: `This ad is consuming budget without results. Pause or refresh the creative.`,
        campaignId: ad.campaignId, campaignName: campaign?.name,
        metric: `₹${spend.toLocaleString("en-IN")} wasted`,
      });
    }
  }

  // Summary
  let summary = `Reviewed ${ads.length} ads. ${findings.filter(f => f.type === "WASTE").length} showing fatigue, ${findings.filter(f => f.type === "SUCCESS").length} performing well.`;

  try {
    const anthropic = getAnthropic();
    const msg = await anthropic.messages.create({
      model: CLAUDE_MODEL, max_tokens: 300,
      messages: [{ role: "user", content: `Summarize this creative review in 2-3 sentences. Be direct.\n\nFindings: ${JSON.stringify(findings.slice(0, 8))}` }],
    });
    if (msg.content[0].type === "text") summary = msg.content[0].text;
  } catch {}

  return { reviewType: "CREATIVE_REVIEW", findings, actions: [], summary };
}
