import { prisma } from "@/lib/prisma";
import { getAnthropic, CLAUDE_MODEL } from "@/lib/anthropic";

export interface AuditCheck {
  id: string;
  name: string;
  status: "PASS" | "WARN" | "FAIL";
  score: number; // 0–100
  finding: string;
  recommendation: string;
}

export interface AuditResult {
  score: number;
  checks: AuditCheck[];
  summary: string;
}

export async function runAccountAudit(userId: string): Promise<AuditResult> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Pull all the data needed
  const [campaigns, allKeywords, allAds] = await Promise.all([
    prisma.campaign.findMany({
      where: { userId },
      include: {
        dailyMetrics: { where: { date: { gte: thirtyDaysAgo } }, orderBy: { date: "desc" } },
        adGroups: true,
        keywords: true,
        ads: true,
      },
    }),
    prisma.keyword.findMany({
      where: { campaign: { userId } },
    }),
    prisma.ad.findMany({
      where: { campaign: { userId } },
    }),
  ]);

  const checks: AuditCheck[] = [];

  // ── Check 1: Wasted spend (no-conversion keywords with high spend) ──
  const wastedKeywords = allKeywords.filter(
    (k) => !k.isNegative && Number(k.spend) > 500 && k.conversions === 0
  );
  const wastedSpend = wastedKeywords.reduce((s, k) => s + Number(k.spend), 0);
  checks.push({
    id: "wasted_spend",
    name: "Wasted Spend",
    status: wastedKeywords.length > 5 ? "FAIL" : wastedKeywords.length > 2 ? "WARN" : "PASS",
    score: wastedKeywords.length === 0 ? 100 : wastedKeywords.length > 5 ? 30 : 65,
    finding: wastedKeywords.length > 0
      ? `${wastedKeywords.length} keyword${wastedKeywords.length !== 1 ? "s" : ""} consuming ₹${Math.round(wastedSpend).toLocaleString("en-IN")} with 0 conversions`
      : "No wasted keyword spend detected",
    recommendation: wastedKeywords.length > 0
      ? "Add these keywords as negatives or pause them to stop budget drain"
      : "Great — keyword spend is well-targeted",
  });

  // ── Check 2: Negative keyword coverage ──
  const negativeCount = allKeywords.filter((k) => k.isNegative).length;
  const positiveCount = allKeywords.filter((k) => !k.isNegative).length;
  const negRatio = positiveCount > 0 ? negativeCount / positiveCount : 0;
  checks.push({
    id: "negative_keywords",
    name: "Negative Keyword Coverage",
    status: negRatio < 0.05 ? "FAIL" : negRatio < 0.15 ? "WARN" : "PASS",
    score: negRatio >= 0.15 ? 100 : negRatio >= 0.05 ? 60 : 25,
    finding: `${negativeCount} negative keywords vs ${positiveCount} positive (${(negRatio * 100).toFixed(1)}% ratio)`,
    recommendation: negRatio < 0.15
      ? "Increase negative keyword list to reduce irrelevant traffic. Aim for 15%+ ratio."
      : "Healthy negative keyword coverage",
  });

  // ── Check 3: Ad copy quality (single ads per ad group) ──
  const adGroupsWithSingleAd = campaigns.flatMap((c) =>
    c.adGroups.filter((ag) => {
      const adsInGroup = allAds.filter((a) => a.adGroupId === ag.id);
      return adsInGroup.length < 2;
    })
  );
  checks.push({
    id: "ad_copy_testing",
    name: "Ad Copy A/B Testing",
    status: adGroupsWithSingleAd.length > 3 ? "FAIL" : adGroupsWithSingleAd.length > 1 ? "WARN" : "PASS",
    score: adGroupsWithSingleAd.length === 0 ? 100 : adGroupsWithSingleAd.length > 3 ? 35 : 65,
    finding: adGroupsWithSingleAd.length > 0
      ? `${adGroupsWithSingleAd.length} ad group${adGroupsWithSingleAd.length !== 1 ? "s" : ""} have fewer than 2 active ads — no A/B testing`
      : "All ad groups have multiple ad variations",
    recommendation: adGroupsWithSingleAd.length > 0
      ? "Add a second ad variation to each ad group for proper split testing"
      : "Good — multiple ad variations in all groups",
  });

  // ── Check 4: Conversion tracking ──
  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE");
  const campaignsWithConversions = activeCampaigns.filter((c) => c.conversions > 0);
  checks.push({
    id: "conversion_tracking",
    name: "Conversion Tracking",
    status: campaignsWithConversions.length === 0 && activeCampaigns.length > 0 ? "FAIL"
      : campaignsWithConversions.length < activeCampaigns.length * 0.5 ? "WARN" : "PASS",
    score: activeCampaigns.length === 0 ? 50
      : campaignsWithConversions.length === activeCampaigns.length ? 100
      : campaignsWithConversions.length === 0 ? 0 : 55,
    finding: activeCampaigns.length === 0
      ? "No active campaigns found"
      : `${campaignsWithConversions.length} of ${activeCampaigns.length} active campaigns recording conversions`,
    recommendation: campaignsWithConversions.length < activeCampaigns.length
      ? "Ensure conversion tracking is set up on all active campaigns"
      : "Conversion tracking is healthy",
  });

  // ── Check 5: Bidding strategy ──
  const lowRoasCampaigns = campaigns.filter((c) => {
    const spend = Number(c.spend);
    const revenue = Number(c.revenue);
    return spend > 1000 && revenue > 0 && revenue / spend < 1.5;
  });
  checks.push({
    id: "bidding_strategy",
    name: "ROAS Performance",
    status: lowRoasCampaigns.length > 2 ? "FAIL" : lowRoasCampaigns.length > 0 ? "WARN" : "PASS",
    score: lowRoasCampaigns.length === 0 ? 100 : lowRoasCampaigns.length > 2 ? 40 : 65,
    finding: lowRoasCampaigns.length > 0
      ? `${lowRoasCampaigns.length} campaign${lowRoasCampaigns.length !== 1 ? "s" : ""} with ROAS below 1.5x`
      : "All campaigns meeting ROAS targets",
    recommendation: lowRoasCampaigns.length > 0
      ? "Review bid strategy on underperforming campaigns — consider Target ROAS bidding"
      : "ROAS performance is healthy",
  });

  // ── Check 6: Budget utilization ──
  const underBudgetCampaigns = campaigns.filter((c) => {
    if (!c.dailyBudget || c.status !== "ACTIVE") return false;
    const recentMetrics = c.dailyMetrics.slice(0, 7);
    if (recentMetrics.length === 0) return false;
    const avgDailySpend = recentMetrics.reduce((s, m) => s + Number(m.spend), 0) / recentMetrics.length;
    return avgDailySpend < Number(c.dailyBudget) * 0.5;
  });
  checks.push({
    id: "budget_utilization",
    name: "Budget Utilization",
    status: underBudgetCampaigns.length > 2 ? "WARN" : "PASS",
    score: underBudgetCampaigns.length === 0 ? 100 : 70,
    finding: underBudgetCampaigns.length > 0
      ? `${underBudgetCampaigns.length} campaign${underBudgetCampaigns.length !== 1 ? "s" : ""} spending less than 50% of daily budget`
      : "All campaigns utilizing budgets effectively",
    recommendation: underBudgetCampaigns.length > 0
      ? "Underutilized budgets may indicate low Quality Scores or restricted targeting — expand keywords or audiences"
      : "Budget utilization is optimal",
  });

  // ── Check 7: Ad schedule / dayparting ──
  const activeCampaignCount = activeCampaigns.length;
  checks.push({
    id: "dayparting",
    name: "Ad Scheduling",
    status: activeCampaignCount === 0 ? "WARN" : "PASS",
    score: activeCampaignCount > 0 ? 80 : 50,
    finding: activeCampaignCount > 0
      ? `${activeCampaignCount} active campaigns detected — review ad schedule for peak hours`
      : "No active campaigns to evaluate",
    recommendation: "Enable ad scheduling to concentrate spend during your highest-converting hours",
  });

  const totalScore = Math.round(checks.reduce((s, c) => s + c.score, 0) / checks.length);

  // Generate AI summary
  let summary = "";
  try {
    const anthropic = getAnthropic();
    const failCount = checks.filter((c) => c.status === "FAIL").length;
    const warnCount = checks.filter((c) => c.status === "WARN").length;
    const passCount = checks.filter((c) => c.status === "PASS").length;

    const checksSummary = checks
      .map((c) => `- [${c.status}] ${c.name}: ${c.finding}`)
      .join("\n");

    const msg = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `Write a 2-3 sentence executive summary of this ad account audit. Score: ${totalScore}/100. ${failCount} fails, ${warnCount} warnings, ${passCount} passes.\n\n${checksSummary}\n\nBe direct, specific, and actionable. No fluff.`,
        },
      ],
    });

    summary = (msg.content[0] as { type: string; text: string }).text || "";
  } catch {
    const failItems = checks.filter((c) => c.status === "FAIL").map((c) => c.name);
    summary = `Account score: ${totalScore}/100. ${failItems.length > 0 ? `Critical issues: ${failItems.join(", ")}.` : "No critical issues."} Review the findings below and implement recommendations to improve performance.`;
  }

  return { score: totalScore, checks, summary };
}
