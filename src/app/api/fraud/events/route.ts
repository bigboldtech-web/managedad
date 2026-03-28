import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [blockedIPs, recentAlerts, trendData, kpis] = await Promise.all([
    // Blocked IPs with aggregates
    prisma.fraudBlock.findMany({
      where: { userId, isActive: true },
      orderBy: { blockedAt: "desc" },
      take: 50,
    }),

    // Recent high-fraud events for alerts
    prisma.clickEvent.findMany({
      where: { userId, isFraud: true, clickedAt: { gte: thirtyDaysAgo } },
      orderBy: { clickedAt: "desc" },
      take: 20,
      select: { ip: true, fraudScore: true, fraudReasons: true, country: true, clickedAt: true, campaignId: true },
    }),

    // Daily trend (last 14 days)
    prisma.$queryRaw<{ date: Date; total: bigint; fraud: bigint }[]>`
      SELECT
        DATE_TRUNC('day', "clickedAt") as date,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE "isFraud" = true) as fraud
      FROM "ClickEvent"
      WHERE "userId" = ${userId}
        AND "clickedAt" >= NOW() - INTERVAL '14 days'
      GROUP BY DATE_TRUNC('day', "clickedAt")
      ORDER BY date ASC
    `,

    // KPIs
    prisma.clickEvent.aggregate({
      where: { userId, isFraud: true, clickedAt: { gte: thirtyDaysAgo } },
      _count: { id: true },
    }),
  ]);

  const totalFraud = kpis._count.id;
  const uniqueIPsBlocked = blockedIPs.length;
  const fraudRate = totalFraud > 0
    ? await prisma.clickEvent.count({ where: { userId, clickedAt: { gte: thirtyDaysAgo } } }).then((total) =>
        total > 0 ? ((totalFraud / total) * 100).toFixed(1) : "0.0"
      )
    : "0.0";

  // Compute savings estimate: avg CPC ₹40 × fraud clicks
  const savingsEstimate = totalFraud * 40;

  // Build fraud signal breakdown from reasons
  const signalCounts: Record<string, number> = {};
  for (const event of recentAlerts) {
    const reasons = (event.fraudReasons as string[]) || [];
    for (const r of reasons) {
      const key = r.split(":")[0].trim();
      signalCounts[key] = (signalCounts[key] || 0) + 1;
    }
  }

  return NextResponse.json({
    kpis: {
      blockedThisMonth: totalFraud,
      savingsThisMonth: savingsEstimate,
      fraudRate,
      ipsBlocked: uniqueIPsBlocked,
    },
    blockedIPs: blockedIPs.map((b) => ({
      ip: b.ip,
      fraudScore: b.fraudScore,
      reason: b.reason || "Fraud detected",
      clickCount: b.clickCount,
      savings: b.clickCount * 40,
      blockedAt: b.blockedAt,
    })),
    alerts: recentAlerts.slice(0, 10).map((e) => ({
      ip: e.ip,
      fraudScore: e.fraudScore,
      reasons: e.fraudReasons as string[],
      country: e.country,
      clickedAt: e.clickedAt,
    })),
    trend: trendData.map((row) => ({
      date: row.date,
      clicks: Number(row.total),
      blocked: Number(row.fraud),
    })),
    signalBreakdown: signalCounts,
  });
}
