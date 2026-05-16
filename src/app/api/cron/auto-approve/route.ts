import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const promoted = await prisma.optimizationAction.updateMany({
    where: {
      status: "PENDING",
      riskTier: "MED",
      autoApprovesAt: { lte: now },
    },
    data: { status: "APPROVED" },
  });

  return NextResponse.json({
    message: "Auto-approve sweep completed",
    promoted: promoted.count,
    timestamp: now.toISOString(),
  });
}

export const GET = POST;
