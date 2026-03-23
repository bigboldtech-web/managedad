import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncGoogleAdsData } from "@/lib/sync/google-ads-sync";
import { syncMetaAdsData } from "@/lib/sync/meta-ads-sync";

export async function POST(req: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: {
    googleAds: { success: number; failed: number };
    metaAds: { success: number; failed: number };
  } = {
    googleAds: { success: 0, failed: 0 },
    metaAds: { success: 0, failed: 0 },
  };

  try {
    // Sync all active Google Ads connections
    const googleConnections = await prisma.googleAdsConnection.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    for (const connection of googleConnections) {
      try {
        await syncGoogleAdsData(connection.id);
        results.googleAds.success++;
      } catch (error) {
        console.error(
          `Failed to sync Google Ads connection ${connection.id}:`,
          error
        );
        results.googleAds.failed++;
      }
    }

    // Sync all active Meta Ads connections
    const metaConnections = await prisma.metaAdsConnection.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    for (const connection of metaConnections) {
      try {
        await syncMetaAdsData(connection.id);
        results.metaAds.success++;
      } catch (error) {
        console.error(
          `Failed to sync Meta Ads connection ${connection.id}:`,
          error
        );
        results.metaAds.failed++;
      }
    }

    return NextResponse.json({
      message: "Sync completed",
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron sync-ads failed:", error);
    return NextResponse.json(
      { error: "Sync failed", details: String(error) },
      { status: 500 }
    );
  }
}
