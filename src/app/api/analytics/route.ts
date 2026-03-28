import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const range = new URL(req.url).searchParams.get("range") || "30d";
  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Daily metrics by date
  const dailyRows = await prisma.dailyMetric.groupBy({
    by: ["date", "platform"],
    where: { campaign: { userId }, date: { gte: since } },
    _sum: { spend: true, clicks: true, conversions: true, revenue: true, impressions: true },
    orderBy: { date: "asc" },
  });

  // Build date map: date -> { google, meta, conversions, clicks, impressions }
  const dateMap = new Map<string, { google: number; meta: number; conversions: number; clicks: number; impressions: number; revenue: number }>();

  for (const row of dailyRows) {
    const key = new Date(row.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    const existing = dateMap.get(key) || { google: 0, meta: 0, conversions: 0, clicks: 0, impressions: 0, revenue: 0 };
    const spend = Number(row._sum.spend || 0);
    if (row.platform === "GOOGLE_ADS") existing.google += spend;
    else existing.meta += spend;
    existing.conversions += row._sum.conversions || 0;
    existing.clicks += Number(row._sum.clicks || 0);
    existing.impressions += Number(row._sum.impressions || 0);
    existing.revenue += Number(row._sum.revenue || 0);
    dateMap.set(key, existing);
  }

  const trend = Array.from(dateMap.entries()).map(([date, vals]) => ({
    date,
    google: Math.round(vals.google),
    meta: Math.round(vals.meta),
    conversions: vals.conversions,
    clicks: vals.clicks,
    impressions: vals.impressions,
    revenue: Math.round(vals.revenue),
    ctr: vals.impressions > 0 ? parseFloat(((vals.clicks / vals.impressions) * 100).toFixed(2)) : 0,
  }));

  // Totals
  const totalSpend = trend.reduce((s, d) => s + d.google + d.meta, 0);
  const totalConversions = trend.reduce((s, d) => s + d.conversions, 0);
  const totalClicks = trend.reduce((s, d) => s + d.clicks, 0);
  const totalRevenue = trend.reduce((s, d) => s + d.revenue, 0);
  const totalImpressions = trend.reduce((s, d) => s + d.impressions, 0);
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgCpa = totalConversions > 0 ? totalSpend / totalConversions : 0;
  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  // Previous period for % change
  const prevSince = new Date(since.getTime() - days * 24 * 60 * 60 * 1000);
  const prevRows = await prisma.dailyMetric.aggregate({
    where: { campaign: { userId }, date: { gte: prevSince, lt: since } },
    _sum: { spend: true, clicks: true, conversions: true, revenue: true },
  });
  const prevSpend = Number(prevRows._sum.spend || 0);
  const prevConversions = prevRows._sum.conversions || 0;
  const prevClicks = Number(prevRows._sum.clicks || 0);
  const prevRevenue = Number(prevRows._sum.revenue || 0);

  function pctChange(curr: number, prev: number) {
    if (prev === 0) return 0;
    return parseFloat((((curr - prev) / prev) * 100).toFixed(1));
  }

  // Top campaigns
  const topCampaigns = await prisma.campaign.findMany({
    where: { userId, status: "ACTIVE" },
    orderBy: { spend: "desc" },
    take: 5,
    select: { id: true, name: true, platform: true, spend: true, clicks: true, conversions: true, revenue: true },
  });

  return NextResponse.json({
    trend,
    totals: {
      spend: Math.round(totalSpend),
      conversions: totalConversions,
      clicks: totalClicks,
      impressions: totalImpressions,
      revenue: Math.round(totalRevenue),
      avgCtr: parseFloat(avgCtr.toFixed(2)),
      avgCpa: Math.round(avgCpa),
      roas: parseFloat(roas.toFixed(2)),
    },
    changes: {
      spend: pctChange(totalSpend, prevSpend),
      conversions: pctChange(totalConversions, prevConversions),
      clicks: pctChange(totalClicks, prevClicks),
      revenue: pctChange(totalRevenue, prevRevenue),
    },
    topCampaigns: topCampaigns.map((c) => ({
      id: c.id,
      name: c.name,
      platform: c.platform,
      spend: Number(c.spend),
      clicks: Number(c.clicks),
      conversions: c.conversions,
      roas: Number(c.spend) > 0 ? Number(c.revenue) / Number(c.spend) : 0,
    })),
    hasData: trend.length > 0,
  });
}
