import { prisma } from "@/lib/prisma";
import type { ActionCandidate } from "./types";

export interface GuardrailResult {
  allowed: boolean;
  reasonCode?: string;
  message?: string;
}

const MAX_ACTIONS_PER_24H = 20;
const SPEND_SHARE_HIGH_THRESHOLD = 0.05;
const ROAS_POSITIVE_THRESHOLD = 1.5;
const MAX_BUDGET_CUT_ON_WINNER = 0.30;
const RECENT_CHANGE_COOLDOWN_HOURS = 72;
const MIN_CONVERSIONS_FOR_MED_HIGH = 10;

export async function checkGuardrails(
  candidate: ActionCandidate,
  context: { userId: string }
): Promise<GuardrailResult> {
  const velocityCheck = await checkChangeVelocity(context.userId);
  if (!velocityCheck.allowed) return velocityCheck;

  const cooldownCheck = await checkRecentChangeCooldown(candidate);
  if (!cooldownCheck.allowed) return cooldownCheck;

  const conversionCheck = await checkConversionBlackout(
    context.userId,
    candidate.riskTier
  );
  if (!conversionCheck.allowed) return conversionCheck;

  if (candidate.type === "DECREASE_BUDGET") {
    const roasCheck = await checkRoasPositiveGuard(candidate);
    if (!roasCheck.allowed) return roasCheck;
  }

  if (candidate.riskTier === "HIGH") {
    const spendCheck = await checkSpendShareGuard(context.userId, candidate);
    if (!spendCheck.allowed) return spendCheck;
  }

  return { allowed: true };
}

async function checkChangeVelocity(userId: string): Promise<GuardrailResult> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentApplied = await prisma.optimizationAction.count({
    where: {
      status: "APPLIED",
      appliedAt: { gte: since },
      optimizationRun: { userId },
    },
  });
  if (recentApplied >= MAX_ACTIONS_PER_24H) {
    return {
      allowed: false,
      reasonCode: "GUARDRAIL_VELOCITY_CAP",
      message: `Daily action cap reached (${MAX_ACTIONS_PER_24H}/24h)`,
    };
  }
  return { allowed: true };
}

async function checkRecentChangeCooldown(
  candidate: ActionCandidate
): Promise<GuardrailResult> {
  const since = new Date(Date.now() - RECENT_CHANGE_COOLDOWN_HOURS * 60 * 60 * 1000);
  const axisTypes = sameAxisActionTypes(candidate.type);

  const recent = await prisma.optimizationAction.findFirst({
    where: {
      campaignId: candidate.campaignId,
      actionType: { in: axisTypes },
      status: "APPLIED",
      appliedAt: { gte: since },
    },
    orderBy: { appliedAt: "desc" },
  });

  if (recent) {
    return {
      allowed: false,
      reasonCode: "GUARDRAIL_COOLDOWN",
      message: `Same axis changed ${hoursSince(recent.appliedAt!)}h ago — cooldown ${RECENT_CHANGE_COOLDOWN_HOURS}h`,
    };
  }
  return { allowed: true };
}

async function checkConversionBlackout(
  userId: string,
  riskTier: ActionCandidate["riskTier"]
): Promise<GuardrailResult> {
  if (riskTier === "LOW") return { allowed: true };

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const result = await prisma.dailyMetric.aggregate({
    where: { campaign: { userId }, date: { gte: since } },
    _sum: { conversions: true },
  });
  const conversions = result._sum.conversions ?? 0;

  if (conversions < MIN_CONVERSIONS_FOR_MED_HIGH) {
    return {
      allowed: false,
      reasonCode: "GUARDRAIL_CONVERSION_BLACKOUT",
      message: `Only ${conversions} conversions in last 7d (need ${MIN_CONVERSIONS_FOR_MED_HIGH}+ for ${riskTier})`,
    };
  }
  return { allowed: true };
}

async function checkRoasPositiveGuard(
  candidate: ActionCandidate
): Promise<GuardrailResult> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: candidate.campaignId },
  });
  if (!campaign) return { allowed: true };

  const spend = Number(campaign.spend);
  const revenue = Number(campaign.revenue);
  if (spend === 0) return { allowed: true };

  const roas = revenue / spend;
  if (roas < ROAS_POSITIVE_THRESHOLD) return { allowed: true };

  const previousBudget = (candidate.previousValue?.dailyBudget as number) ?? Number(campaign.dailyBudget ?? 0);
  const newBudget = (candidate.newValue?.dailyBudget as number) ?? previousBudget;
  if (previousBudget === 0) return { allowed: true };

  const cutFraction = (previousBudget - newBudget) / previousBudget;
  if (cutFraction > MAX_BUDGET_CUT_ON_WINNER) {
    return {
      allowed: false,
      reasonCode: "GUARDRAIL_ROAS_POSITIVE",
      message: `Campaign ROAS ${roas.toFixed(2)}× — single-action cut limited to ${MAX_BUDGET_CUT_ON_WINNER * 100}%`,
    };
  }
  return { allowed: true };
}

async function checkSpendShareGuard(
  userId: string,
  candidate: ActionCandidate
): Promise<GuardrailResult> {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const [campaignSpend, totalSpend] = await Promise.all([
    prisma.dailyMetric.aggregate({
      where: { campaignId: candidate.campaignId, date: { gte: since } },
      _sum: { spend: true },
    }),
    prisma.dailyMetric.aggregate({
      where: { campaign: { userId }, date: { gte: since } },
      _sum: { spend: true },
    }),
  ]);

  const cSpend = Number(campaignSpend._sum.spend ?? 0);
  const tSpend = Number(totalSpend._sum.spend ?? 0);
  if (tSpend === 0) return { allowed: true };

  const share = cSpend / tSpend;
  if (share > SPEND_SHARE_HIGH_THRESHOLD) {
    return {
      allowed: false,
      reasonCode: "GUARDRAIL_SPEND_SHARE",
      message: `Campaign carries ${(share * 100).toFixed(1)}% of account spend — HIGH action requires manual approval only`,
    };
  }
  return { allowed: true };
}

function sameAxisActionTypes(type: ActionCandidate["type"]): ActionCandidate["type"][] {
  switch (type) {
    case "INCREASE_BUDGET":
    case "DECREASE_BUDGET":
      return ["INCREASE_BUDGET", "DECREASE_BUDGET"];
    case "ADJUST_BID":
      return ["ADJUST_BID"];
    case "PAUSE_AD":
    case "ENABLE_AD":
      return ["PAUSE_AD", "ENABLE_AD"];
    case "PAUSE_KEYWORD":
    case "ADD_NEGATIVE_KEYWORD":
      return ["PAUSE_KEYWORD", "ADD_NEGATIVE_KEYWORD"];
    default:
      return [type];
  }
}

function hoursSince(d: Date): number {
  return Math.floor((Date.now() - d.getTime()) / (60 * 60 * 1000));
}
