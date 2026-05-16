import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fingerprints = await prisma.accountFingerprint.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  const summary = fingerprints.map((fp) => {
    const ageDays = Math.floor(
      (Date.now() - fp.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    // Adaptive activates at 30 days OR 50 measured actions, per spec §14.4
    const benchmarksActive = ageDays >= 30 || fp.totalActionsApplied >= 50;
    const behavioralActive = fp.totalActionsApplied >= 10;
    const progressPct = Math.min(
      100,
      Math.max((ageDays / 30) * 100, (fp.totalActionsApplied / 50) * 100)
    );

    return {
      platform: fp.platform,
      accountId: fp.accountId,
      vertical: fp.vertical,
      ageDays,
      totalActionsApplied: fp.totalActionsApplied,
      benchmarksActive,
      behavioralActive,
      progressPct: Math.round(progressPct),
    };
  });

  return NextResponse.json({ accounts: summary });
}
