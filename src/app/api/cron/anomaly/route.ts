import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifySpendAnomaly } from "@/lib/notifications";

// Runs every 30 min — detects spend spikes vs 7-day avg
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const results = { anomalies: 0, checked: 0 };

  // Get all active campaigns with recent metrics
  const activeCampaigns = await prisma.campaign.findMany({
    where: { status: "ACTIVE" },
    include: {
      dailyMetrics: {
        where: { date: { gte: sevenDaysAgo } },
        orderBy: { date: "desc" },
      },
    },
  });

  results.checked = activeCampaigns.length;

  for (const campaign of activeCampaigns) {
    if (campaign.dailyMetrics.length < 3) continue;

    // Recent (last 2 days) vs historical (3–7 days ago)
    const recent = campaign.dailyMetrics.slice(0, 2);
    const historical = campaign.dailyMetrics.slice(2);

    const recentAvgSpend = recent.reduce((s, m) => s + Number(m.spend), 0) / recent.length;
    const historicalAvgSpend = historical.reduce((s, m) => s + Number(m.spend), 0) / historical.length;

    if (historicalAvgSpend === 0) continue;

    const spendChange = (recentAvgSpend - historicalAvgSpend) / historicalAvgSpend;

    // Alert if spend increased by more than 200% or dropped by more than 80%
    if (spendChange > 2.0) {
      results.anomalies++;
      notifySpendAnomaly({
        userId: campaign.userId,
        campaignName: campaign.name,
        metric: "Daily Spend",
        change: `+${(spendChange * 100).toFixed(0)}% spend spike`,
        value: `₹${Math.round(recentAvgSpend).toLocaleString("en-IN")}/day avg`,
      }).catch(() => {});
    } else if (spendChange < -0.8 && historicalAvgSpend > 1000) {
      results.anomalies++;
      notifySpendAnomaly({
        userId: campaign.userId,
        campaignName: campaign.name,
        metric: "Daily Spend",
        change: `${(spendChange * 100).toFixed(0)}% spend drop`,
        value: `₹${Math.round(recentAvgSpend).toLocaleString("en-IN")}/day avg (was ₹${Math.round(historicalAvgSpend).toLocaleString("en-IN")})`,
      }).catch(() => {});
    }

    // CTR anomaly: drop by more than 50%
    const recentAvgCtr = recent.reduce((s, m) => s + Number(m.ctr || 0), 0) / recent.length;
    const historicalAvgCtr = historical.reduce((s, m) => s + Number(m.ctr || 0), 0) / historical.length;
    if (historicalAvgCtr > 0 && recentAvgCtr < historicalAvgCtr * 0.5) {
      results.anomalies++;
      notifySpendAnomaly({
        userId: campaign.userId,
        campaignName: campaign.name,
        metric: "Click-Through Rate",
        change: `-${(((historicalAvgCtr - recentAvgCtr) / historicalAvgCtr) * 100).toFixed(0)}% CTR drop`,
        value: `${(recentAvgCtr * 100).toFixed(2)}% (was ${(historicalAvgCtr * 100).toFixed(2)}%)`,
      }).catch(() => {});
    }
  }

  return NextResponse.json({
    message: "Anomaly check completed",
    results,
    timestamp: new Date().toISOString(),
  });
}
