import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const connection = await prisma.googleAdsConnection.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    await prisma.googleAdsConnection.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting Google Ads connection:", error);
    return NextResponse.json(
      { error: "Failed to delete connection" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { customerId, accountName } = await req.json();
    if (!customerId) {
      return NextResponse.json({ error: "Missing customer ID" }, { status: 400 });
    }

    const sanitizedId = customerId.replace(/[-\s]/g, "");
    if (!/^\d{3,10}$/.test(sanitizedId)) {
      return NextResponse.json({ error: "Invalid customer ID format" }, { status: 400 });
    }

    // Find the pending connection
    const pending = await prisma.googleAdsConnection.findFirst({
      where: { userId: session.user.id, customerId: "PENDING" },
    });

    if (!pending) {
      return NextResponse.json(
        { error: "No pending connection found. Please reconnect via OAuth first." },
        { status: 404 }
      );
    }

    // Create real connection and delete pending
    await prisma.googleAdsConnection.upsert({
      where: {
        userId_customerId: {
          userId: session.user.id,
          customerId: sanitizedId,
        },
      },
      update: {
        refreshToken: pending.refreshToken,
        accessToken: pending.accessToken,
        tokenExpiresAt: pending.tokenExpiresAt,
        isActive: true,
        ...(accountName && { accountName }),
      },
      create: {
        userId: session.user.id,
        customerId: sanitizedId,
        refreshToken: pending.refreshToken,
        accessToken: pending.accessToken,
        tokenExpiresAt: pending.tokenExpiresAt,
        isActive: true,
        ...(accountName && { accountName }),
      },
    });

    // Delete the pending record
    await prisma.googleAdsConnection.delete({ where: { id: pending.id } });

    return NextResponse.json({ success: true, customerId: sanitizedId });
  } catch (error) {
    console.error("Error finalizing Google Ads connection:", error);
    return NextResponse.json(
      { error: "Failed to save connection" },
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
    const connections = await prisma.googleAdsConnection.findMany({
      where: { userId: session.user.id, NOT: { customerId: "PENDING" } },
      select: {
        id: true,
        customerId: true,
        accountName: true,
        isActive: true,
        lastSyncAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(connections);
  } catch (error) {
    console.error("Error fetching Google Ads connections:", error);
    return NextResponse.json(
      { error: "Failed to fetch connections" },
      { status: 500 }
    );
  }
}
