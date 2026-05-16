import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInsights } from "@/lib/optimization/helios/cross-platform-learning";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only users with both Google AND Meta connections benefit from cross-platform mining
  const eligibleUsers = await prisma.user.findMany({
    where: {
      AND: [
        { googleAdsConnections: { some: { isActive: true } } },
        { metaAdsConnections: { some: { isActive: true } } },
      ],
    },
    select: { id: true },
  });

  const results: { userId: string; created: number }[] = [];
  for (const u of eligibleUsers) {
    try {
      const r = await generateInsights(u.id);
      results.push({ userId: u.id, created: r.created });
    } catch (err) {
      console.error(`Cross-platform mining failed for ${u.id}:`, err);
    }
  }

  return NextResponse.json({
    message: "Cross-platform mining completed",
    eligibleUsers: eligibleUsers.length,
    results,
    timestamp: new Date().toISOString(),
  });
}

export const GET = POST;
