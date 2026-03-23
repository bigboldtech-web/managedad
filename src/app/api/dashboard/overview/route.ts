import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch all campaigns for the user
    const campaigns = await prisma.campaign.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        platform: true,
        status: true,
        impressions: true,
        clicks: true,
        conversions: true,
        spend: true,
        revenue: true,
      },
    });

    // Aggregate totals
    let totalSpend = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    let totalRevenue = 0;
    let googleSpend = 0;
    let metaSpend = 0;

    for (const c of campaigns) {
      const spend = Number(c.spend);
      const impressions = Number(c.impressions);
      const clicks = Number(c.clicks);
      const revenue = Number(c.revenue);

      totalSpend += spend;
      totalImpressions += impressions;
      totalClicks += clicks;
      totalConversions += c.conversions;
      totalRevenue += revenue;

      if (c.platform === "GOOGLE_ADS") {
        googleSpend += spend;
      } else {
        metaSpend += spend;
      }
    }

    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    // Fetch daily metrics for the spend trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyMetrics = await prisma.dailyMetric.findMany({
      where: {
        campaign: { userId: session.user.id },
        date: { gte: thirtyDaysAgo },
      },
      select: {
        date: true,
        platform: true,
        spend: true,
      },
      orderBy: { date: "asc" },
    });

    // Build spend trend
    const trendMap = new Map<
      string,
      { google: number; meta: number; total: number }
    >();
    for (const m of dailyMetrics) {
      const dateKey = new Date(m.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (!trendMap.has(dateKey)) {
        trendMap.set(dateKey, { google: 0, meta: 0, total: 0 });
      }
      const entry = trendMap.get(dateKey)!;
      const spend = Number(m.spend);
      if (m.platform === "GOOGLE_ADS") {
        entry.google += spend;
      } else {
        entry.meta += spend;
      }
      entry.total += spend;
    }

    const spendTrend = Array.from(trendMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));

    // Platform breakdown
    const platformBreakdown = [
      { name: "Google Ads", value: googleSpend },
      { name: "Meta Ads", value: metaSpend },
    ];

    // Top campaigns by ROAS
    const topCampaigns = campaigns
      .filter((c) => Number(c.spend) > 0)
      .map((c) => ({
        id: c.id,
        name: c.name,
        platform: c.platform,
        spend: Number(c.spend),
        conversions: c.conversions,
        roas: Number(c.spend) > 0 ? Number(c.revenue) / Number(c.spend) : 0,
        status: c.status,
      }))
      .sort((a, b) => b.roas - a.roas)
      .slice(0, 5);

    return NextResponse.json({
      totalSpend,
      totalImpressions,
      totalClicks,
      totalConversions,
      avgCtr,
      avgRoas,
      spendTrend,
      platformBreakdown,
      topCampaigns,
    });
  } catch (error) {
    console.error("Error fetching dashboard overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard overview" },
      { status: 500 }
    );
  }
}
