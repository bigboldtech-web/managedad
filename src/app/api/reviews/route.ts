import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reviews = await prisma.weeklyReview.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true, reviewType: true, weekStart: true, weekEnd: true,
      summary: true, actionsTaken: true, createdAt: true, data: true,
    },
  });

  return NextResponse.json({ reviews });
}
