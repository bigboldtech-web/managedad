import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateFingerprint, updateBenchmarks } from "@/lib/optimization/helios/fingerprint";

const LOOKBACK_DAYS = 30;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const updated: string[] = [];

  const googleConnections = await prisma.googleAdsConnection.findMany({
    where: { isActive: true },
    include: { user: { select: { id: true, vertical: true } } },
  });
  const metaConnections = await prisma.metaAdsConnection.findMany({
    where: { isActive: true },
    include: { user: { select: { id: true, vertical: true } } },
  });

  for (const conn of googleConnections) {
    await getOrCreateFingerprint({
      platform: "GOOGLE_ADS",
      accountId: conn.id,
      userId: conn.userId,
      vertical: conn.user.vertical,
    });
    const benchmarks = await computeBenchmarks(conn.userId, "GOOGLE_ADS", since);
    if (benchmarks) {
      await updateBenchmarks("GOOGLE_ADS", conn.id, benchmarks);
      updated.push(`GOOGLE_ADS:${conn.id}`);
    }
  }

  for (const conn of metaConnections) {
    await getOrCreateFingerprint({
      platform: "META_ADS",
      accountId: conn.id,
      userId: conn.userId,
      vertical: conn.user.vertical,
    });
    const benchmarks = await computeBenchmarks(conn.userId, "META_ADS", since);
    if (benchmarks) {
      await updateBenchmarks("META_ADS", conn.id, benchmarks);
      updated.push(`META_ADS:${conn.id}`);
    }
  }

  return NextResponse.json({
    message: "Fingerprint recompute completed",
    updated: updated.length,
    details: updated,
    timestamp: new Date().toISOString(),
  });
}

async function computeBenchmarks(
  userId: string,
  platform: "GOOGLE_ADS" | "META_ADS",
  since: Date
) {
  const metrics = await prisma.dailyMetric.aggregate({
    where: {
      campaign: { userId, platform },
      date: { gte: since },
    },
    _sum: {
      spend: true,
      revenue: true,
      clicks: true,
      conversions: true,
      impressions: true,
    },
  });

  const spend = Number(metrics._sum.spend ?? 0);
  const revenue = Number(metrics._sum.revenue ?? 0);
  const clicks = Number(metrics._sum.clicks ?? 0);
  const impressions = Number(metrics._sum.impressions ?? 0);
  const conversions = Number(metrics._sum.conversions ?? 0);

  if (spend === 0 && impressions === 0) return null;

  return {
    goodCpc: clicks > 0 ? spend / clicks : null,
    goodCpa: conversions > 0 ? spend / conversions : null,
    goodRoas: spend > 0 ? revenue / spend : null,
    goodCtr: impressions > 0 ? clicks / impressions : null,
  };
}

export const GET = POST;
