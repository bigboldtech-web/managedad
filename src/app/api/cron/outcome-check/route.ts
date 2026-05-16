import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordActionOutcome, recordSilentRejection } from "@/lib/optimization/helios/fingerprint";
import type { AdPlatform } from "@prisma/client";

const OUTCOME_WINDOW_DAYS = 14;
const SILENT_REJECTION_WINDOW_DAYS = 7;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dueBefore = new Date(Date.now() - OUTCOME_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const actions = await prisma.optimizationAction.findMany({
    where: {
      status: "APPLIED",
      appliedAt: { lte: dueBefore },
      actualDelta: null,
      expectedDelta: { not: null },
    },
    include: {
      campaign: {
        select: {
          id: true,
          platform: true,
          googleAdsConnectionId: true,
          metaAdsConnectionId: true,
        },
      },
    },
    take: 200,
  });

  let recorded = 0;
  const skipped: string[] = [];

  for (const action of actions) {
    const campaign = action.campaign;
    if (!campaign || !action.appliedAt) {
      skipped.push(action.id);
      continue;
    }

    const platform = campaign.platform as AdPlatform;
    const accountId =
      platform === "GOOGLE_ADS"
        ? campaign.googleAdsConnectionId
        : campaign.metaAdsConnectionId;

    if (!accountId) {
      skipped.push(action.id);
      continue;
    }

    const before = await prisma.dailyMetric.aggregate({
      where: {
        campaignId: campaign.id,
        date: {
          gte: new Date(action.appliedAt.getTime() - 14 * 24 * 60 * 60 * 1000),
          lt: action.appliedAt,
        },
      },
      _sum: { spend: true, revenue: true },
    });

    const after = await prisma.dailyMetric.aggregate({
      where: {
        campaignId: campaign.id,
        date: {
          gte: action.appliedAt,
          lte: new Date(action.appliedAt.getTime() + 14 * 24 * 60 * 60 * 1000),
        },
      },
      _sum: { spend: true, revenue: true },
    });

    const beforeRoas =
      Number(before._sum.spend ?? 0) > 0
        ? Number(before._sum.revenue ?? 0) / Number(before._sum.spend ?? 1)
        : 0;
    const afterRoas =
      Number(after._sum.spend ?? 0) > 0
        ? Number(after._sum.revenue ?? 0) / Number(after._sum.spend ?? 1)
        : 0;

    const actualDelta =
      beforeRoas > 0 ? (afterRoas - beforeRoas) / beforeRoas : afterRoas - beforeRoas;

    await prisma.optimizationAction.update({
      where: { id: action.id },
      data: { actualDelta, outcomeCheckAt: new Date() },
    });

    await recordActionOutcome({
      platform,
      accountId,
      actionType: action.actionType,
      predictedDelta: Number(action.expectedDelta),
      actualDelta,
    });

    recorded += 1;
  }

  // Silent rejection scan: look for applied actions in the last 7 days where
  // the campaign's current state has reverted to the previous value.
  // Heuristic: budget actions check current dailyBudget vs newValue.dailyBudget.
  const silentSince = new Date(Date.now() - SILENT_REJECTION_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const recentBudgetActions = await prisma.optimizationAction.findMany({
    where: {
      status: "APPLIED",
      appliedAt: { gte: silentSince },
      actionType: { in: ["INCREASE_BUDGET", "DECREASE_BUDGET"] },
    },
    include: {
      campaign: {
        select: {
          dailyBudget: true,
          platform: true,
          googleAdsConnectionId: true,
          metaAdsConnectionId: true,
        },
      },
    },
    take: 500,
  });

  let silentRejections = 0;
  for (const action of recentBudgetActions) {
    if (!action.campaign?.dailyBudget) continue;
    const intended = (action.newValue as { dailyBudget?: number } | null)?.dailyBudget;
    const previous = (action.previousValue as { dailyBudget?: number } | null)?.dailyBudget;
    if (intended == null || previous == null) continue;
    const current = Number(action.campaign.dailyBudget);

    // User reverted if current is closer to previous than to intended
    const distFromIntended = Math.abs(current - intended);
    const distFromPrevious = Math.abs(current - previous);
    if (distFromPrevious < distFromIntended * 0.5) {
      const platform = action.campaign.platform as AdPlatform;
      const accountId =
        platform === "GOOGLE_ADS"
          ? action.campaign.googleAdsConnectionId
          : action.campaign.metaAdsConnectionId;
      if (!accountId) continue;

      await recordSilentRejection({
        platform,
        accountId,
        actionType: action.actionType,
      });
      silentRejections += 1;
    }
  }

  return NextResponse.json({
    message: "Outcome check completed",
    candidatesFound: actions.length,
    recorded,
    skipped: skipped.length,
    silentRejections,
    timestamp: new Date().toISOString(),
  });
}

export const GET = POST;
