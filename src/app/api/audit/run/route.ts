import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runAccountAudit } from "@/lib/audit/engine";
import { rateLimit } from "@/lib/rate-limit";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const { success: rlOk } = rateLimit(`audit-run:${userId}`, 3, 15 * 60_000);
  if (!rlOk) {
    return NextResponse.json({ error: "Too many audit requests. Please wait 15 minutes." }, { status: 429 });
  }

  const result = await runAccountAudit(userId);

  const report = await prisma.auditReport.create({
    data: {
      userId,
      score: result.score,
      checks: JSON.parse(JSON.stringify(result.checks)),
      summary: result.summary,
    },
  });

  return NextResponse.json({ report: { ...report, checks: result.checks } });
}
