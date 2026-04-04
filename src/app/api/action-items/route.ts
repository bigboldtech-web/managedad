import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.actionItem.findMany({
    where: {
      userId: session.user.id,
      status: "PENDING",
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } },
      ],
    },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    take: 10,
  });

  return NextResponse.json({ items });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, status } = await req.json();
  if (!id || !["DONE", "DISMISSED"].includes(status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await prisma.actionItem.updateMany({
    where: { id, userId: session.user.id },
    data: { status },
  });

  return NextResponse.json({ success: true });
}
