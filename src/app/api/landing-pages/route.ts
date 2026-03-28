import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pages = await prisma.landingPage.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, slug: true, isPublished: true,
      visits: true, conversions: true, createdAt: true,
    },
  });

  return NextResponse.json({ pages });
}
