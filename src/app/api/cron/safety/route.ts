import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlaybook } from "@/lib/optimization/helios/playbooks";
import { notifySpendAnomaly } from "@/lib/notifications";

const SPEND_MULTIPLIER = 3;
const MIN_HOURLY_SPEND_FOR_ALERT = 500;
const CPA_MULTIPLIER = 5;
const MIN_CONVERSIONS_FOR_CPA_KILL = 3;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const activeCampaigns = await prisma.campaign.findMany({
    where: { status: "ACTIVE" },
    include: {
      user: { select: { id: true, vertical: true } },
      dailyMetrics: { where: { date: { gte: sevenDaysAgo } } },
    },
  });

  const killed: { campaignId: string; reason: string }[] = [];

  for (const campaign of activeCampaigns) {
    const recentMetric = campaign.dailyMetrics.find(
      (m) => m.date.getTime() >= oneHourAgo.getTime()
    );
    if (!recentMetric) continue;

    const hourlySpendNow = Number(recentMetric.spend);
    const sevenDayAvg =
      campaign.dailyMetrics.reduce((s, m) => s + Number(m.spend), 0) /
      Math.max(campaign.dailyMetrics.length, 1) /
      24;

    const playbook = getPlaybook(campaign.user.vertical);

    let killReason: string | null = null;

    if (
      hourlySpendNow > SPEND_MULTIPLIER * sevenDayAvg &&
      hourlySpendNow > MIN_HOURLY_SPEND_FOR_ALERT
    ) {
      killReason = `ANOMALY_SPEND: ₹${hourlySpendNow.toFixed(0)}/hr vs avg ₹${sevenDayAvg.toFixed(0)}/hr`;
    }

    if (!killReason && recentMetric.conversions >= MIN_CONVERSIONS_FOR_CPA_KILL) {
      const cpa = hourlySpendNow / recentMetric.conversions;
      if (cpa > CPA_MULTIPLIER * playbook.goodCpa) {
        killReason = `ANOMALY_CPA: ₹${cpa.toFixed(0)} vs target ₹${playbook.goodCpa}`;
      }
    }

    if (!killReason) continue;

    const run = await prisma.optimizationRun.create({
      data: {
        userId: campaign.userId,
        triggerType: "SAFETY",
        status: "RUNNING",
        startedAt: new Date(),
      },
    });

    try {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: "PAUSED" },
      });

      await prisma.optimizationAction.create({
        data: {
          optimizationRunId: run.id,
          campaignId: campaign.id,
          actionType: "PAUSE_AD",
          description: `Safety killswitch paused "${campaign.name}" — ${killReason}`,
          reasonCode: killReason.split(":")[0],
          riskTier: "HIGH",
          status: "APPLIED",
          appliedAt: new Date(),
          previousValue: { status: "ACTIVE" },
          newValue: { status: "PAUSED" },
        },
      });

      await prisma.optimizationRun.update({
        where: { id: run.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          summary: { type: "safety_kill", campaignId: campaign.id, reason: killReason },
        },
      });

      try {
        await notifySpendAnomaly({
          userId: campaign.userId,
          campaignName: campaign.name,
          metric: killReason.split(":")[0],
          change: "Auto-paused by safety system",
          value: killReason.split(":")[1]?.trim() ?? killReason,
        });
      } catch {
        // notification failure doesn't undo the kill
      }

      killed.push({ campaignId: campaign.id, reason: killReason });
    } catch (err) {
      await prisma.optimizationRun.update({
        where: { id: run.id },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          errorLog: err instanceof Error ? err.message : String(err),
        },
      });
    }
  }

  return NextResponse.json({
    message: "Safety check completed",
    scanned: activeCampaigns.length,
    killed: killed.length,
    details: killed,
    timestamp: new Date().toISOString(),
  });
}

export const GET = POST;
