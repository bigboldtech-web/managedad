import { getUserCampaignData } from "./base";
import type { ReviewResult, ReviewFinding, ReviewAction } from "./types";

export async function runBudgetReview(userId: string): Promise<ReviewResult> {
  const { campaigns, metrics } = await getUserCampaignData(userId, 7);
  const findings: ReviewFinding[] = [];
  const actions: ReviewAction[] = [];

  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE");
  if (activeCampaigns.length === 0) {
    return { reviewType: "BUDGET_REVIEW", findings: [], actions: [], summary: "No active campaigns to review budgets for." };
  }

  // Calculate ROAS per campaign over last 7 days
  const campaignPerformance = activeCampaigns.map((campaign) => {
    const campaignMetrics = metrics.filter((m) => m.campaignId === campaign.id);
    const spend = campaignMetrics.reduce((s, m) => s + Number(m.spend), 0);
    const revenue = campaignMetrics.reduce((s, m) => s + Number(m.revenue), 0);
    const conversions = campaignMetrics.reduce((s, m) => s + m.conversions, 0);
    const roas = spend > 0 ? revenue / spend : 0;
    const dailyBudget = Number(campaign.dailyBudget || 0);
    const avgDailySpend = spend / 7;
    const utilization = dailyBudget > 0 ? (avgDailySpend / dailyBudget) * 100 : 0;

    return { campaign, spend, revenue, conversions, roas, dailyBudget, avgDailySpend, utilization };
  });

  // Average ROAS
  const totalSpend = campaignPerformance.reduce((s, p) => s + p.spend, 0);
  const totalRevenue = campaignPerformance.reduce((s, p) => s + p.revenue, 0);
  const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  for (const perf of campaignPerformance) {
    // High ROAS — suggest budget increase
    if (perf.roas > avgRoas * 1.5 && perf.roas > 2 && perf.spend > 500) {
      findings.push({
        type: "OPPORTUNITY", impact: "HIGH",
        title: `Scale "${perf.campaign.name}" — ${perf.roas.toFixed(1)}x ROAS`,
        description: `This campaign returns ₹${perf.roas.toFixed(1)} for every ₹1 spent. Increase daily budget from ₹${perf.dailyBudget.toLocaleString("en-IN")} to capture more conversions.`,
        campaignId: perf.campaign.id, campaignName: perf.campaign.name,
        metric: `${perf.roas.toFixed(1)}x ROAS`,
      });
      actions.push({
        actionType: "INCREASE_BUDGET",
        description: `Increase budget for "${perf.campaign.name}" by 25% — ROAS ${perf.roas.toFixed(1)}x`,
        campaignId: perf.campaign.id, applied: false,
      });
    }

    // Low ROAS — suggest budget decrease
    if (perf.roas < 1 && perf.spend > 1000) {
      findings.push({
        type: "WASTE", impact: "HIGH",
        title: `"${perf.campaign.name}" is losing money (${perf.roas.toFixed(1)}x ROAS)`,
        description: `Spent ₹${perf.spend.toLocaleString("en-IN")} but only earned ₹${perf.revenue.toLocaleString("en-IN")}. Reduce budget or pause.`,
        campaignId: perf.campaign.id, campaignName: perf.campaign.name,
        metric: `₹${(perf.spend - perf.revenue).toLocaleString("en-IN")} loss`,
      });
      actions.push({
        actionType: "DECREASE_BUDGET",
        description: `Decrease budget for "${perf.campaign.name}" — ROAS only ${perf.roas.toFixed(1)}x`,
        campaignId: perf.campaign.id, applied: false,
      });
    }

    // Under-utilizing budget
    if (perf.utilization < 50 && perf.dailyBudget > 0) {
      findings.push({
        type: "WARNING", impact: "LOW",
        title: `"${perf.campaign.name}" only using ${perf.utilization.toFixed(0)}% of budget`,
        description: `Daily budget is ₹${perf.dailyBudget.toLocaleString("en-IN")} but only spending ₹${perf.avgDailySpend.toFixed(0)}/day. Check targeting or bid strategy.`,
        campaignId: perf.campaign.id, campaignName: perf.campaign.name,
      });
    }
  }

  const summary = `Reviewed budgets for ${activeCampaigns.length} campaigns. Overall ROAS: ${avgRoas.toFixed(1)}x. Found ${findings.filter(f => f.type === "OPPORTUNITY").length} campaigns to scale and ${findings.filter(f => f.type === "WASTE").length} losing money.`;

  return { reviewType: "BUDGET_REVIEW", findings, actions, summary };
}
