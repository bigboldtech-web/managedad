import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Generates weekly summary buckets from DailyMetrics + enriches with audit scores
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const range = new URL(req.url).searchParams.get("range") || "90d";
  const days = range === "30d" ? 30 : range === "180d" ? 180 : 90;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [dailyRows, auditReports, optimizationRuns] = await Promise.all([
    prisma.dailyMetric.findMany({
      where: { campaign: { userId }, date: { gte: since } },
      select: {
        date: true,
        platform: true,
        spend: true,
        revenue: true,
        clicks: true,
        conversions: true,
        impressions: true,
      },
      orderBy: { date: "asc" },
    }),
    prisma.auditReport.findMany({
      where: { userId, createdAt: { gte: since } },
      select: { id: true, score: true, summary: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.optimizationRun.findMany({
      where: { userId, createdAt: { gte: since }, status: "COMPLETED" },
      select: {
        id: true, createdAt: true, summary: true,
        _count: { select: { actions: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  // Group daily metrics into ISO week buckets (Mon–Sun)
  const weekMap = new Map<
    string,
    { weekStart: Date; spend: number; revenue: number; clicks: number; conversions: number; impressions: number; google: number; meta: number }
  >();

  for (const row of dailyRows) {
    const d = new Date(row.date);
    // ISO week start = Monday
    const day = d.getUTCDay(); // 0=Sun, 1=Mon...
    const diff = (day === 0 ? -6 : 1 - day);
    const weekStart = new Date(d);
    weekStart.setUTCDate(d.getUTCDate() + diff);
    weekStart.setUTCHours(0, 0, 0, 0);
    const key = weekStart.toISOString();

    const existing = weekMap.get(key) || {
      weekStart,
      spend: 0, revenue: 0, clicks: 0, conversions: 0, impressions: 0,
      google: 0, meta: 0,
    };
    const spend = Number(row.spend);
    existing.spend += spend;
    existing.revenue += Number(row.revenue);
    existing.clicks += Number(row.clicks);
    existing.conversions += row.conversions;
    existing.impressions += Number(row.impressions);
    if (row.platform === "GOOGLE_ADS") existing.google += spend;
    else existing.meta += spend;
    weekMap.set(key, existing);
  }

  const weeks = Array.from(weekMap.values())
    .sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime())
    .map((w) => ({
      weekStart: w.weekStart.toISOString(),
      weekLabel: w.weekStart.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      spend: Math.round(w.spend),
      revenue: Math.round(w.revenue),
      clicks: w.clicks,
      conversions: w.conversions,
      impressions: w.impressions,
      roas: w.spend > 0 ? parseFloat((w.revenue / w.spend).toFixed(2)) : 0,
      ctr: w.impressions > 0 ? parseFloat(((w.clicks / w.impressions) * 100).toFixed(2)) : 0,
      cpa: w.conversions > 0 ? Math.round(w.spend / w.conversions) : 0,
      google: Math.round(w.google),
      meta: Math.round(w.meta),
    }));

  // Overall totals for the period
  const totalSpend = weeks.reduce((s, w) => s + w.spend, 0);
  const totalRevenue = weeks.reduce((s, w) => s + w.revenue, 0);
  const totalConversions = weeks.reduce((s, w) => s + w.conversions, 0);
  const totalClicks = weeks.reduce((s, w) => s + w.clicks, 0);

  return NextResponse.json({
    weeks,
    totals: {
      spend: totalSpend,
      revenue: totalRevenue,
      conversions: totalConversions,
      clicks: totalClicks,
      roas: totalSpend > 0 ? parseFloat((totalRevenue / totalSpend).toFixed(2)) : 0,
      cpa: totalConversions > 0 ? Math.round(totalSpend / totalConversions) : 0,
      weeksCount: weeks.length,
    },
    audits: auditReports.map((a) => ({
      id: a.id,
      score: a.score,
      summary: a.summary,
      createdAt: a.createdAt,
    })),
    optimizationRuns: optimizationRuns.map((r) => ({
      id: r.id,
      actionsCount: r._count.actions,
      summary: r.summary,
      createdAt: r.createdAt,
    })),
    hasData: weeks.length > 0,
  });
}
