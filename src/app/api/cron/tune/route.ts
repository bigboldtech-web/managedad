import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runHeliosOptimization } from "@/lib/optimization/engine";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: {
      optimizationSettings: { isEnabled: true, autoApply: true },
    },
    select: { id: true },
  });

  const results: { userId: string; ok: boolean; error?: string }[] = [];

  for (const u of users) {
    try {
      await runHeliosOptimization({
        userId: u.id,
        triggerType: "TUNE",
        scopeTiers: ["LOW"],
      });
      results.push({ userId: u.id, ok: true });
    } catch (err) {
      results.push({
        userId: u.id,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({
    message: "Daily tune completed",
    processed: users.length,
    results,
    timestamp: new Date().toISOString(),
  });
}

export const GET = POST;
