import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncGoogleAdsData } from "@/lib/sync/google-ads-sync";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connections = await prisma.googleAdsConnection.findMany({
    where: { userId: session.user.id, isActive: true, customerId: { not: "PENDING" } },
    select: { id: true, customerId: true, accountName: true },
  });

  if (connections.length === 0) {
    return NextResponse.json({ error: "No active Google Ads connections found" }, { status: 404 });
  }

  const results: { connectionId: string; customerId: string; success: boolean; error?: string; campaigns?: number }[] = [];

  for (const conn of connections) {
    try {
      await syncGoogleAdsData(conn.id);
      const campaignCount = await prisma.campaign.count({
        where: { googleAdsConnectionId: conn.id },
      });
      results.push({ connectionId: conn.id, customerId: conn.customerId, success: true, campaigns: campaignCount });
    } catch (error) {
      console.error(`Sync failed for ${conn.customerId}:`, error);
      results.push({ connectionId: conn.id, customerId: conn.customerId, success: false, error: String(error) });
    }
  }

  return NextResponse.json({ results, timestamp: new Date().toISOString() });
}
