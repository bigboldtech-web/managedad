import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWeeklyReportEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const results = { sent: 0, skipped: 0 };

  const notifSettings = await prisma.notificationSettings.findMany({
    where: { weeklyReport: true, emailEnabled: true },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  for (const ns of notifSettings) {
    const user = ns.user;
    if (!user.email) continue;

    try {
      const [thisWeek, lastWeek, topCampaigns, latestAudit] = await Promise.all([
        prisma.dailyMetric.aggregate({
          where: { campaign: { userId: user.id }, date: { gte: sevenDaysAgo } },
          _sum: { spend: true, clicks: true, conversions: true, revenue: true },
        }),
        prisma.dailyMetric.aggregate({
          where: { campaign: { userId: user.id }, date: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
          _sum: { spend: true, revenue: true },
        }),
        prisma.campaign.findMany({
          where: { userId: user.id, status: "ACTIVE" },
          orderBy: { spend: "desc" },
          take: 5,
          select: { name: true, spend: true, revenue: true },
        }),
        prisma.auditReport.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          select: { score: true, summary: true },
        }),
      ]);

      const weekSpend = Number(thisWeek._sum.spend || 0);
      const weekRevenue = Number(thisWeek._sum.revenue || 0);
      const lastWeekSpend = Number(lastWeek._sum.spend || 0);
      const lastWeekRevenue = Number(lastWeek._sum.revenue || 0);

      if (weekSpend === 0) { results.skipped++; continue; }

      const vsLastWeekSpend = lastWeekSpend > 0 ? ((weekSpend - lastWeekSpend) / lastWeekSpend) * 100 : 0;
      const weekRoas = weekSpend > 0 ? weekRevenue / weekSpend : 0;
      const lastWeekRoas = lastWeekSpend > 0 ? lastWeekRevenue / lastWeekSpend : 0;
      const vsLastWeekRoas = lastWeekRoas > 0 ? ((weekRoas - lastWeekRoas) / lastWeekRoas) * 100 : 0;

      await sendWeeklyReportEmail(user.email, user.name ?? "there", {
        weekSpend,
        weekClicks: Number(thisWeek._sum.clicks || 0),
        weekConversions: thisWeek._sum.conversions || 0,
        weekRevenue,
        weekRoas,
        vsLastWeekSpend,
        vsLastWeekRoas,
        topCampaigns: topCampaigns.map((c) => ({
          name: c.name,
          spend: Number(c.spend),
          roas: Number(c.spend) > 0 ? Number(c.revenue) / Number(c.spend) : 0,
        })),
        auditScore: latestAudit?.score,
        auditSummary: latestAudit?.summary || undefined,
      });

      results.sent++;
    } catch (err) {
      console.error(`Weekly report failed for ${user.id}:`, err);
    }
  }

  return NextResponse.json({ message: "Weekly reports sent", results, timestamp: new Date().toISOString() });
}
