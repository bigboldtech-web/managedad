import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const connections = await prisma.googleAdsConnection.findMany({
      where: { userId: session.user.id },
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
