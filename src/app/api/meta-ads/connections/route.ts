import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MetaAdsClient } from "@/lib/meta-ads/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { accessToken } = await req.json();
    if (!accessToken) {
      return NextResponse.json({ error: "Missing access token" }, { status: 400 });
    }

    // Validate token and fetch ad accounts
    let adAccounts;
    try {
      adAccounts = await MetaAdsClient.listAdAccounts(accessToken);
    } catch (error) {
      console.error("Failed to list ad accounts:", error);
      return NextResponse.json(
        { error: "Invalid token or no ad accounts found. Make sure you granted ads_read permission." },
        { status: 400 }
      );
    }

    if (!adAccounts.data || adAccounts.data.length === 0) {
      return NextResponse.json(
        { error: "No ad accounts found for this token." },
        { status: 400 }
      );
    }

    // Store connections for each ad account
    const connections = [];
    for (const account of adAccounts.data) {
      const adAccountId = account.account_id;
      const connection = await prisma.metaAdsConnection.upsert({
        where: {
          userId_adAccountId: {
            userId: session.user.id,
            adAccountId,
          },
        },
        update: {
          accessToken,
          tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // ~60 days
          accountName: account.name,
          businessId: account.business?.id || null,
          isActive: true,
        },
        create: {
          userId: session.user.id,
          adAccountId,
          accessToken,
          tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          accountName: account.name,
          businessId: account.business?.id || null,
        },
      });
      connections.push(connection);
    }

    return NextResponse.json({
      success: true,
      count: connections.length,
      accounts: adAccounts.data.map((a: { account_id: string; name: string }) => ({
        id: a.account_id,
        name: a.name,
      })),
    });
  } catch (error) {
    console.error("Error saving Meta Ads connection:", error);
    return NextResponse.json(
      { error: "Failed to save connection" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing connection ID" }, { status: 400 });
  }

  try {
    const connection = await prisma.metaAdsConnection.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    await prisma.metaAdsConnection.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting Meta Ads connection:", error);
    return NextResponse.json(
      { error: "Failed to delete connection" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const connections = await prisma.metaAdsConnection.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        adAccountId: true,
        accountName: true,
        isActive: true,
        lastSyncAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(connections);
  } catch (error) {
    console.error("Error fetching Meta Ads connections:", error);
    return NextResponse.json(
      { error: "Failed to fetch connections" },
      { status: 500 }
    );
  }
}
