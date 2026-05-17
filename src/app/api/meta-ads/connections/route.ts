import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Finalize a Meta Ads connection.
 *
 * Body shape (picker flow, from /settings/connect-meta):
 *   { adAccountIds: [{ adAccountId, accountName?, businessId? }, ...] }
 *
 * Backwards-compatible body shape (single-account, legacy):
 *   { accessToken } — deprecated, no longer accepted
 *
 * Finds the PENDING row (created by callback), copies its encrypted token
 * onto a real row for each selected ad account, deletes the PENDING row.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const targets: { adAccountId: string; accountName?: string; businessId?: string | null }[] =
      Array.isArray(body.adAccountIds) ? body.adAccountIds : [];

    if (targets.length === 0) {
      return NextResponse.json(
        { error: "Provide adAccountIds (array of { adAccountId, accountName?, businessId? })" },
        { status: 400 }
      );
    }

    const pending = await prisma.metaAdsConnection.findFirst({
      where: { userId: session.user.id, adAccountId: "PENDING" },
      orderBy: { createdAt: "desc" },
    });

    if (!pending) {
      return NextResponse.json(
        { error: "No pending Meta connection found. Please reconnect via OAuth first." },
        { status: 404 }
      );
    }

    const saved: string[] = [];
    for (const target of targets) {
      const sanitized = target.adAccountId.replace(/[\s]/g, "");
      if (!sanitized) continue;

      await prisma.metaAdsConnection.upsert({
        where: {
          userId_adAccountId: {
            userId: session.user.id,
            adAccountId: sanitized,
          },
        },
        update: {
          accessToken: pending.accessToken,
          tokenExpiresAt: pending.tokenExpiresAt,
          isActive: true,
          ...(target.accountName && { accountName: target.accountName }),
          ...(target.businessId !== undefined && { businessId: target.businessId }),
        },
        create: {
          userId: session.user.id,
          adAccountId: sanitized,
          accessToken: pending.accessToken,
          tokenExpiresAt: pending.tokenExpiresAt,
          isActive: true,
          ...(target.accountName && { accountName: target.accountName }),
          ...(target.businessId !== undefined && { businessId: target.businessId }),
        },
      });
      saved.push(sanitized);
    }

    if (saved.length > 0) {
      await prisma.metaAdsConnection.delete({ where: { id: pending.id } });
    }

    return NextResponse.json({ success: true, adAccountIds: saved });
  } catch (error) {
    console.error("Error finalizing Meta Ads connection:", error);
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
      where: { userId: session.user.id, NOT: { adAccountId: "PENDING" } },
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
