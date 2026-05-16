import { prisma } from "@/lib/prisma";
import type { AdPlatform, Vertical, ActionType, RiskTier } from "@prisma/client";

export interface FingerprintBenchmarks {
  goodCpc: number | null;
  goodCpa: number | null;
  goodRoas: number | null;
  goodCtr: number | null;
}

export interface PredictionErrorRecord {
  n: number;
  rmse: number;
  bias: number;
}

export type PredictionErrorMap = Partial<Record<ActionType, PredictionErrorRecord>>;

const EMA_ALPHA = 0.2;
const BENCHMARK_ALPHA = 0.15;

export async function getOrCreateFingerprint(params: {
  platform: AdPlatform;
  accountId: string;
  userId: string;
  vertical: Vertical;
}) {
  return prisma.accountFingerprint.upsert({
    where: {
      platform_accountId: { platform: params.platform, accountId: params.accountId },
    },
    update: {},
    create: {
      platform: params.platform,
      accountId: params.accountId,
      userId: params.userId,
      vertical: params.vertical,
    },
  });
}

export async function lookupFingerprint(
  platform: AdPlatform,
  accountId: string
) {
  return prisma.accountFingerprint.findUnique({
    where: { platform_accountId: { platform, accountId } },
  });
}

export async function updateBenchmarks(
  platform: AdPlatform,
  accountId: string,
  observed: FingerprintBenchmarks
) {
  const current = await lookupFingerprint(platform, accountId);
  if (!current) return null;

  return prisma.accountFingerprint.update({
    where: { platform_accountId: { platform, accountId } },
    data: {
      observedGoodCpc: ema(current.observedGoodCpc, observed.goodCpc, BENCHMARK_ALPHA),
      observedGoodCpa: ema(current.observedGoodCpa, observed.goodCpa, BENCHMARK_ALPHA),
      observedGoodRoas: ema(current.observedGoodRoas, observed.goodRoas, BENCHMARK_ALPHA),
      observedGoodCtr: ema(current.observedGoodCtr, observed.goodCtr, BENCHMARK_ALPHA),
      lastRecomputedAt: new Date(),
    },
  });
}

export async function recordActionOutcome(params: {
  platform: AdPlatform;
  accountId: string;
  actionType: ActionType;
  predictedDelta: number;
  actualDelta: number;
}) {
  const fp = await lookupFingerprint(params.platform, params.accountId);
  if (!fp) return;

  const errors = (fp.predictionErrors as PredictionErrorMap) || {};
  const prev = errors[params.actionType] ?? { n: 0, rmse: 0, bias: 0 };
  const err = params.actualDelta - params.predictedDelta;
  const next: PredictionErrorRecord = {
    n: prev.n + 1,
    rmse: Math.sqrt(EMA_ALPHA * err * err + (1 - EMA_ALPHA) * prev.rmse * prev.rmse),
    bias: EMA_ALPHA * err + (1 - EMA_ALPHA) * prev.bias,
  };
  errors[params.actionType] = next;

  await prisma.accountFingerprint.update({
    where: {
      platform_accountId: { platform: params.platform, accountId: params.accountId },
    },
    data: {
      predictionErrors: errors as never,
      totalActionsApplied: { increment: 1 },
    },
  });
}

export async function recordUserDecision(params: {
  platform: AdPlatform;
  accountId: string;
  riskTier: RiskTier;
  approved: boolean;
}) {
  const fp = await lookupFingerprint(params.platform, params.accountId);
  if (!fp) return;

  const field =
    params.riskTier === "LOW"
      ? "approvalRateLow"
      : params.riskTier === "MED"
        ? "approvalRateMed"
        : "approvalRateHigh";

  const current = Number(fp[field]);
  const decision = params.approved ? 1 : 0;
  const next = EMA_ALPHA * decision + (1 - EMA_ALPHA) * current;

  await prisma.accountFingerprint.update({
    where: {
      platform_accountId: { platform: params.platform, accountId: params.accountId },
    },
    data: { [field]: next },
  });
}

export function applyBiasCorrection(
  predictedDelta: number,
  errors: PredictionErrorMap | undefined,
  actionType: ActionType
): { adjustedDelta: number; confidenceMultiplier: number } {
  const rec = errors?.[actionType];
  if (!rec || rec.n < 3) {
    return { adjustedDelta: predictedDelta, confidenceMultiplier: 1 };
  }
  return {
    adjustedDelta: predictedDelta - rec.bias,
    confidenceMultiplier: 1 / (1 + Math.abs(rec.rmse)),
  };
}

export interface SilentRejection {
  actionType: ActionType;
  suppressUntil: string; // ISO date
}

/**
 * Record a "silent rejection" — when the user manually reversed an action
 * we applied within 7 days. We suppress similar actionType for 30 days
 * on this account, then let it try again with downweighted confidence.
 */
export async function recordSilentRejection(params: {
  platform: AdPlatform;
  accountId: string;
  actionType: ActionType;
}): Promise<void> {
  const fp = await lookupFingerprint(params.platform, params.accountId);
  if (!fp) return;

  const list = ((fp.silentRejections as SilentRejection[] | null) || []).filter(
    (r) => new Date(r.suppressUntil).getTime() > Date.now()
  );

  list.push({
    actionType: params.actionType,
    suppressUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  await prisma.accountFingerprint.update({
    where: {
      platform_accountId: { platform: params.platform, accountId: params.accountId },
    },
    data: { silentRejections: list as never },
  });
}

export function isSuppressed(
  fp: { silentRejections: unknown } | null,
  actionType: ActionType
): boolean {
  if (!fp) return false;
  const list = (fp.silentRejections as SilentRejection[] | null) || [];
  return list.some(
    (r) =>
      r.actionType === actionType &&
      new Date(r.suppressUntil).getTime() > Date.now()
  );
}

/**
 * Compute dynamic risk tier thresholds for an account based on its
 * approval history. If a user consistently rejects HIGH-tier actions,
 * downshift more aggressively to MED. If they rubber-stamp everything,
 * relax thresholds.
 *
 * Returns multipliers applied to the base classification thresholds.
 *  - aggressivenessMultiplier > 1 = user is happy with big moves; allow more LOW/MED
 *  - aggressivenessMultiplier < 1 = user is cautious; demote borderline LOW→MED, MED→HIGH
 */
export function computeRiskAdjustment(fp: {
  approvalRateLow: { toString(): string } | number;
  approvalRateMed: { toString(): string } | number;
  approvalRateHigh: { toString(): string } | number;
} | null): { aggressiveness: number } {
  if (!fp) return { aggressiveness: 1.0 };

  const low = Number(fp.approvalRateLow);
  const med = Number(fp.approvalRateMed);
  const high = Number(fp.approvalRateHigh);

  // Weighted: HIGH approvals matter most as a signal of user trust.
  // Baseline expectation: low=1.0, med=0.5, high=0.25.
  const expected = 1.0 * 0.5 + 0.5 * 0.3 + 0.25 * 0.2;
  const observed = low * 0.5 + med * 0.3 + high * 0.2;

  // Clamp to [0.5, 1.5] so the system never goes completely permissive or strict.
  const ratio = observed / Math.max(expected, 0.01);
  return { aggressiveness: Math.max(0.5, Math.min(1.5, ratio)) };
}

function ema(
  oldValue: { toString(): string } | number | null,
  newValue: number | null,
  alpha: number
): number | null {
  if (newValue == null) return oldValue == null ? null : Number(oldValue);
  if (oldValue == null) return newValue;
  return alpha * newValue + (1 - alpha) * Number(oldValue);
}
