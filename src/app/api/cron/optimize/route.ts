import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runOptimization } from "@/lib/optimization/engine";

export async function POST(req: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: {
    success: number;
    failed: number;
    skipped: number;
    details: { userId: string; status: string; error?: string }[];
  } = {
    success: 0,
    failed: 0,
    skipped: 0,
    details: [],
  };

  try {
    // Find all users with optimization enabled
    const settings = await prisma.optimizationSettings.findMany({
      where: { isEnabled: true },
      select: { userId: true },
    });

    for (const setting of settings) {
      try {
        // Check if user has any active campaigns
        const activeCampaigns = await prisma.campaign.count({
          where: {
            userId: setting.userId,
            status: "ACTIVE",
          },
        });

        if (activeCampaigns === 0) {
          results.skipped++;
          results.details.push({
            userId: setting.userId,
            status: "skipped",
            error: "No active campaigns",
          });
          continue;
        }

        await runOptimization(setting.userId);
        results.success++;
        results.details.push({
          userId: setting.userId,
          status: "success",
        });
      } catch (error) {
        console.error(
          `Optimization failed for user ${setting.userId}:`,
          error
        );
        results.failed++;
        results.details.push({
          userId: setting.userId,
          status: "failed",
          error: String(error),
        });
      }
    }

    return NextResponse.json({
      message: "Optimization run completed",
      results: {
        success: results.success,
        failed: results.failed,
        skipped: results.skipped,
        total: settings.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron optimize failed:", error);
    return NextResponse.json(
      { error: "Optimization run failed", details: String(error) },
      { status: 500 }
    );
  }
}
