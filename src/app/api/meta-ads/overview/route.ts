import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";

const RANGE_DAYS: Record<string, number> = {
  "7d": 7,
  "14d": 14,
  "30d": 30,
  "90d": 90,
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const range = req.nextUrl.searchParams.get("range") || "7d";
  const days = RANGE_DAYS[range] || 7;

  const now = new Date();
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const prevEndDate = new Date(startDate);
  prevEndDate.setMilliseconds(-1);
  const prevStartDate = new Date(prevEndDate);
  prevStartDate.setDate(prevStartDate.getDate() - days);
  prevStartDate.setHours(0, 0, 0, 0);

  try {
    // Get all Meta campaigns for this user
    const campaigns = await prisma.campaign.findMany({
      where: { userId: session.user.id, platform: "META_ADS" },
      select: {
        id: true,
        name: true,
        status: true,
        objective: true,
        dailyBudget: true,
        externalId: true,
      },
    });

    const campaignIds = campaigns.map((c) => c.id);

    // Fetch daily metrics for current and previous periods in one query
    const allMetrics = await prisma.dailyMetric.findMany({
      where: {
        campaignId: { in: campaignIds },
        date: { gte: prevStartDate, lte: endDate },
      },
      select: {
        campaignId: true,
        date: true,
        impressions: true,
        clicks: true,
        reach: true,
        conversions: true,
        spend: true,
        revenue: true,
        ctr: true,
        cpc: true,
      },
    });

    // Split into current and previous period
    const currentMetrics = allMetrics.filter(
      (m) => m.date >= startDate && m.date <= endDate
    );
    const previousMetrics = allMetrics.filter(
      (m) => m.date >= prevStartDate && m.date < startDate
    );

    // Aggregate summary for current period
    const summary = aggregateMetrics(currentMetrics);
    const previousPeriod = aggregateMetrics(previousMetrics);

    // Build daily trend
    const trendMap = new Map<
      string,
      {
        spend: number;
        impressions: number;
        clicks: number;
        conversions: number;
        reach: number;
        revenue: number;
      }
    >();

    for (const m of currentMetrics) {
      const dateKey = new Date(m.date).toISOString().split("T")[0];
      const entry = trendMap.get(dateKey) || {
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        reach: 0,
        revenue: 0,
      };
      entry.spend += Number(m.spend);
      entry.impressions += Number(m.impressions);
      entry.clicks += Number(m.clicks);
      entry.conversions += m.conversions;
      entry.reach += Number(m.reach);
      entry.revenue += Number(m.revenue);
      trendMap.set(dateKey, entry);
    }

    const dailyTrend = Array.from(trendMap.entries())
      .map(([date, data]) => ({
        date,
        ...data,
        ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
        cpc: data.clicks > 0 ? data.spend / data.clicks : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Per-campaign metrics for the selected period
    const campaignMetricsMap = new Map<
      string,
      {
        impressions: number;
        clicks: number;
        reach: number;
        conversions: number;
        spend: number;
        revenue: number;
      }
    >();

    for (const m of currentMetrics) {
      const entry = campaignMetricsMap.get(m.campaignId) || {
        impressions: 0,
        clicks: 0,
        reach: 0,
        conversions: 0,
        spend: 0,
        revenue: 0,
      };
      entry.impressions += Number(m.impressions);
      entry.clicks += Number(m.clicks);
      entry.reach += Number(m.reach);
      entry.conversions += m.conversions;
      entry.spend += Number(m.spend);
      entry.revenue += Number(m.revenue);
      campaignMetricsMap.set(m.campaignId, entry);
    }

    const campaignsWithMetrics = campaigns.map((c) => {
      const metrics = campaignMetricsMap.get(c.id) || {
        impressions: 0,
        clicks: 0,
        reach: 0,
        conversions: 0,
        spend: 0,
        revenue: 0,
      };
      return {
        id: c.id,
        name: c.name,
        status: c.status,
        objective: c.objective,
        dailyBudget: Number(c.dailyBudget || 0),
        ...metrics,
        ctr:
          metrics.impressions > 0
            ? (metrics.clicks / metrics.impressions) * 100
            : 0,
        cpc: metrics.clicks > 0 ? metrics.spend / metrics.clicks : 0,
        cpa:
          metrics.conversions > 0
            ? metrics.spend / metrics.conversions
            : 0,
        roas: metrics.spend > 0 ? metrics.revenue / metrics.spend : 0,
        costPerResult:
          metrics.conversions > 0
            ? metrics.spend / metrics.conversions
            : 0,
      };
    });

    return NextResponse.json(
      serializeBigInt({
        summary,
        previousPeriod,
        dailyTrend,
        campaigns: campaignsWithMetrics,
      })
    );
  } catch (error) {
    console.error("Error fetching Meta Ads overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch overview" },
      { status: 500 }
    );
  }
}

function aggregateMetrics(
  metrics: {
    impressions: bigint;
    clicks: bigint;
    reach: bigint;
    conversions: number;
    spend: any;
    revenue: any;
  }[]
) {
  let totalSpend = 0;
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalReach = 0;
  let totalConversions = 0;
  let totalRevenue = 0;

  for (const m of metrics) {
    totalSpend += Number(m.spend);
    totalImpressions += Number(m.impressions);
    totalClicks += Number(m.clicks);
    totalReach += Number(m.reach);
    totalConversions += m.conversions;
    totalRevenue += Number(m.revenue);
  }

  return {
    totalSpend,
    totalImpressions,
    totalClicks,
    totalReach,
    totalConversions,
    totalRevenue,
    avgCtr:
      totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
    avgCpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
    costPerResult:
      totalConversions > 0 ? totalSpend / totalConversions : 0,
    avgRoas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
  };
}
