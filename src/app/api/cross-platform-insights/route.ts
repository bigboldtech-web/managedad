import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const insights = await prisma.crossPlatformInsight.findMany({
    where: { userId: session.user.id, status: { in: ["SUGGESTED", "APPLIED"] } },
    orderBy: [{ confidence: "desc" }, { createdAt: "desc" }],
    take: 30,
  });

  return NextResponse.json({ insights });
}
