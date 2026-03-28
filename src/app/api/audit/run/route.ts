import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runAccountAudit } from "@/lib/audit/engine";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

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
