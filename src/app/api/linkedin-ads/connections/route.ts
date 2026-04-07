import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connections = await prisma.linkedInAdsConnection.findMany({
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
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Connection ID required" }, { status: 400 });
  }

  const connection = await prisma.linkedInAdsConnection.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!connection || connection.userId !== session.user.id) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  await prisma.linkedInAdsConnection.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
