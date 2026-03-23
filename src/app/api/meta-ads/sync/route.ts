import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncMetaAdsData } from "@/lib/sync/meta-ads-sync";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const connections = await prisma.metaAdsConnection.findMany({
      where: { userId: session.user.id, isActive: true },
      select: { id: true, adAccountId: true, accountName: true },
    });

    if (connections.length === 0) {
      return NextResponse.json(
        { error: "No active Meta Ads connections" },
        { status: 400 }
      );
    }

    const results = [];
    for (const connection of connections) {
      try {
        await syncMetaAdsData(connection.id);
        results.push({
          id: connection.id,
          account: connection.accountName || connection.adAccountId,
          status: "success",
        });
      } catch (error) {
        console.error(
          `Failed to sync Meta Ads connection ${connection.id}:`,
          error
        );
        results.push({
          id: connection.id,
          account: connection.accountName || connection.adAccountId,
          status: "failed",
          error: String(error),
        });
      }
    }

    return NextResponse.json({
      message: "Sync completed",
      results,
    });
  } catch (error) {
    console.error("Meta Ads sync failed:", error);
    return NextResponse.json(
      { error: "Sync failed", details: String(error) },
      { status: 500 }
    );
  }
}
