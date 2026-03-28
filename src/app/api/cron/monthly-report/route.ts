import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMonthlyReportEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Get the month name for the previous month
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthName = lastMonth.toLocaleString("en-US", { month: "long", year: "numeric" });

  const results = { sent: 0, skipped: 0 };

  // Reuse weeklyReport setting for monthly reports
  const notifSettings = await prisma.notificationSettings.findMany({
    where: { weeklyReport: true, emailEnabled: true },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  for (const ns of notifSettings) {
    const user = ns.user;
    if (!user.email) continue;

    try {
      const [thisMonth, lastMonthMetrics, topCampaigns, actionCount] = await Promise.all([
        // Last 30 days aggregated metrics
        prisma.dailyMetric.aggregate({
          where: { campaign: { userId: user.id }, date: { gte: thirtyDaysAgo } },
          _sum: { spend: true, revenue: true, conversions: true },
        }),
        // Previous 30 days for comparison
        prisma.dailyMetric.aggregate({
          where: { campaign: { userId: user.id }, date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
          _sum: { spend: true, revenue: true, conversions: true },
        }),
        // Top 5 campaigns by spend
        prisma.campaign.findMany({
          where: { userId: user.id, status: "ACTIVE" },
          orderBy: { spend: "desc" },
          take: 5,
          select: { name: true, spend: true, revenue: true },
        }),
        // Count of optimization actions applied this month
        prisma.optimizationAction.count({
          where: {
            optimizationRun: { userId: user.id },
            status: "APPLIED",
            appliedAt: { gte: thirtyDaysAgo },
          },
        }),
      ]);

      const totalSpend = Number(thisMonth._sum.spend || 0);
      const totalRevenue = Number(thisMonth._sum.revenue || 0);
      const totalConversions = thisMonth._sum.conversions || 0;
      const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
      const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0;

      // Skip users with no spend
      if (totalSpend === 0) {
        results.skipped++;
        continue;
      }

      // Previous month values
      const prevSpend = Number(lastMonthMetrics._sum.spend || 0);
      const prevRevenue = Number(lastMonthMetrics._sum.revenue || 0);
      const prevConversions = lastMonthMetrics._sum.conversions || 0;
      const prevRoas = prevSpend > 0 ? prevRevenue / prevSpend : 0;
      const prevCpa = prevConversions > 0 ? prevSpend / prevConversions : 0;

      // Month-over-month changes
      const vsLastMonthSpend = prevSpend > 0 ? ((totalSpend - prevSpend) / prevSpend) * 100 : 0;
      const vsLastMonthRevenue = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
      const vsLastMonthConversions = prevConversions > 0 ? ((totalConversions - prevConversions) / prevConversions) * 100 : 0;
      const vsLastMonthRoas = prevRoas > 0 ? ((roas - prevRoas) / prevRoas) * 100 : 0;
      const vsLastMonthCpa = prevCpa > 0 ? ((cpa - prevCpa) / prevCpa) * 100 : 0;

      await sendMonthlyReportEmail(user.email, user.name ?? "there", {
        monthName,
        totalSpend,
        totalRevenue,
        totalConversions,
        roas,
        cpa,
        vsLastMonthSpend,
        vsLastMonthRevenue,
        vsLastMonthConversions,
        vsLastMonthRoas,
        vsLastMonthCpa,
        topCampaigns: topCampaigns.map((c) => ({
          name: c.name,
          spend: Number(c.spend),
          roas: Number(c.spend) > 0 ? Number(c.revenue) / Number(c.spend) : 0,
        })),
        optimizationActions: actionCount,
      });

      results.sent++;
    } catch (err) {
      console.error(`Monthly report failed for ${user.id}:`, err);
    }
  }

  return NextResponse.json({
    message: "Monthly reports sent",
    results,
    timestamp: new Date().toISOString(),
  });
}
