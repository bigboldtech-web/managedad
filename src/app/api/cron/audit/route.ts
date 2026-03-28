import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runAccountAudit } from "@/lib/audit/engine";
import { sendOptimizationAlertEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { success: 0, failed: 0, skipped: 0 };

  // Run audit for all users with at least one active campaign
  const usersWithCampaigns = await prisma.campaign.findMany({
    where: { status: "ACTIVE" },
    select: { userId: true },
    distinct: ["userId"],
  });

  for (const { userId } of usersWithCampaigns) {
    try {
      const auditResult = await runAccountAudit(userId);

      await prisma.auditReport.create({
        data: {
          userId,
          score: auditResult.score,
          checks: JSON.parse(JSON.stringify(auditResult.checks)),
          summary: auditResult.summary,
        },
      });

      // Email if score is below 70 (issues found)
      if (auditResult.score < 70) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true },
        });

        if (user?.email) {
          const failedChecks = auditResult.checks
            .filter((c) => c.status === "FAIL" || c.status === "WARN")
            .map((c) => ({ actionType: c.name, description: c.finding }));

          sendOptimizationAlertEmail(
            user.email,
            user.name ?? "there",
            failedChecks.length,
            failedChecks
          ).catch(() => {});
        }
      }

      results.success++;
    } catch (err) {
      console.error(`Audit failed for user ${userId}:`, err);
      results.failed++;
    }
  }

  return NextResponse.json({
    message: "Weekly audit completed",
    results,
    timestamp: new Date().toISOString(),
  });
}
