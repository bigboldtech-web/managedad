import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleAdsClient } from "@/lib/google-ads/client";
import { checkFeatureAccess } from "@/lib/plan-limits";

export interface CompetitorData {
  domain: string;
  impressionShare: number;
  overlapRate: number;
  posAbove: number;
  topPageRate: number;
  absTopPageRate: number;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  // Plan limit check — "competitor_intel" feature required
  const { allowed, requiredPlan } = await checkFeatureAccess(userId, "competitor_intel");
  if (!allowed) {
    return NextResponse.json(
      { error: `Upgrade to ${requiredPlan} plan to access Competitor Intelligence`, requiredPlan },
      { status: 403 }
    );
  }

  const connections = await prisma.googleAdsConnection.findMany({
    where: { userId, isActive: true },
    select: {
      id: true, customerId: true, accessToken: true, refreshToken: true,
      managerAccountId: true, accountName: true,
    },
  });

  if (connections.length === 0) {
    return NextResponse.json({ competitors: [], hasData: false });
  }

  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!devToken) return NextResponse.json({ competitors: [], hasData: false });

  const allCompetitors: Map<string, CompetitorData> = new Map();

  for (const conn of connections) {
    if (!conn.accessToken) continue;
    try {
      const client = new GoogleAdsClient({
        customerId: conn.customerId,
        developerToken: devToken,
        accessToken: conn.accessToken,
        refreshToken: conn.refreshToken,
        connectionId: conn.id,
        managerAccountId: conn.managerAccountId || undefined,
      });

      // Google Ads Auction Insights GAQL
      const rows = await client.search(`
        SELECT
          auction_insight.domain,
          metrics.auction_insight_search_impression_share,
          metrics.auction_insight_search_overlap_rate,
          metrics.auction_insight_search_position_above_rate,
          metrics.auction_insight_search_top_impression_percentage,
          metrics.auction_insight_search_absolute_top_impression_percentage
        FROM campaign
        WHERE segments.date DURING LAST_30_DAYS
          AND campaign.status = 'ENABLED'
          AND auction_insight.domain != ''
        LIMIT 50
      `);

      for (const row of rows) {
        const domain: string = row.auctionInsight?.domain || "";
        if (!domain) continue;

        const existing = allCompetitors.get(domain) || {
          domain,
          impressionShare: 0,
          overlapRate: 0,
          posAbove: 0,
          topPageRate: 0,
          absTopPageRate: 0,
        };

        // Average across connections
        existing.impressionShare = Math.max(
          existing.impressionShare,
          Math.round((row.metrics?.auctionInsightSearchImpressionShare || 0) * 100)
        );
        existing.overlapRate = Math.max(
          existing.overlapRate,
          Math.round((row.metrics?.auctionInsightSearchOverlapRate || 0) * 100)
        );
        existing.posAbove = Math.max(
          existing.posAbove,
          Math.round((row.metrics?.auctionInsightSearchPositionAboveRate || 0) * 100)
        );
        existing.topPageRate = Math.max(
          existing.topPageRate,
          Math.round((row.metrics?.auctionInsightSearchTopImpressionPercentage || 0) * 100)
        );
        existing.absTopPageRate = Math.max(
          existing.absTopPageRate,
          Math.round((row.metrics?.auctionInsightSearchAbsoluteTopImpressionPercentage || 0) * 100)
        );

        allCompetitors.set(domain, existing);
      }
    } catch (err) {
      console.error(`Auction insights failed for ${conn.customerId}:`, err);
    }
  }

  const competitors = Array.from(allCompetitors.values())
    .sort((a, b) => b.overlapRate - a.overlapRate)
    .slice(0, 20)
    .map((c) => ({
      ...c,
      threat: c.overlapRate >= 50 ? "HIGH" : c.overlapRate >= 25 ? "MEDIUM" : "LOW",
    }));

  return NextResponse.json({ competitors, hasData: competitors.length > 0 });
}
