import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDailyDigestEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const results = { sent: 0, skipped: 0 };

  // Get all users with dailyDigest enabled
  const notifSettings = await prisma.notificationSettings.findMany({
    where: { dailyDigest: true, emailEnabled: true },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  for (const ns of notifSettings) {
    const user = ns.user;
    if (!user.email) continue;

    try {
      // Pull yesterday's metrics
      const [metrics, actionsApplied, fraudBlocked] = await Promise.all([
        prisma.dailyMetric.aggregate({
          where: {
            campaign: { userId: user.id },
            date: { gte: yesterday },
          },
          _sum: { spend: true, clicks: true, conversions: true, revenue: true },
        }),
        prisma.optimizationAction.count({
          where: {
            optimizationRun: { userId: user.id, createdAt: { gte: yesterday } },
            status: "APPLIED",
          },
        }),
        prisma.clickEvent.count({
          where: { userId: user.id, isFraud: true, clickedAt: { gte: yesterday } },
        }),
      ]);

      const spend = Number(metrics._sum.spend || 0);
      const clicks = Number(metrics._sum.clicks || 0);
      const conversions = metrics._sum.conversions || 0;
      const revenue = Number(metrics._sum.revenue || 0);

      if (spend === 0 && actionsApplied === 0) {
        results.skipped++;
        continue;
      }

      const topCampaign = await prisma.campaign.findFirst({
        where: { userId: user.id, status: "ACTIVE" },
        orderBy: { spend: "desc" },
        select: { name: true },
      });

      await sendDailyDigestEmail(user.email, user.name ?? "there", {
        totalSpend: spend,
        totalClicks: clicks,
        totalConversions: conversions,
        totalRevenue: revenue,
        roas: spend > 0 ? revenue / spend : 0,
        topCampaign: topCampaign?.name || "—",
        actionsApplied,
        fraudBlocked,
      });

      results.sent++;
    } catch (err) {
      console.error(`Daily digest failed for ${user.id}:`, err);
    }
  }

  return NextResponse.json({ message: "Daily digests sent", results, timestamp: new Date().toISOString() });
}
