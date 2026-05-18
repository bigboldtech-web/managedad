import { prisma } from "@/lib/prisma";
import { getPlaybook } from "./playbooks";
import { computeSignals } from "./signals";
import { computeScore, normalizeWeights } from "./score";
import { generateCandidates } from "./candidates";
import { applyBiasCorrection, computeRiskAdjustment, isSuppressed, lookupFingerprint } from "./fingerprint";
import { checkGuardrails } from "./guardrails";
import type { ActionCandidate, WeightedObjective } from "./types";
import type { CampaignAnalysis } from "../types";
import type { OptimizationSettings as OptSettings, DailyPoint } from "../types";
import type { Vertical, AdPlatform, ActionType } from "@prisma/client";

const DEFAULT_WEIGHTS: WeightedObjective = {
  roasWeight: 0.6,
  cpaWeight: 0.3,
  volumeWeight: 0.1,
};

// Hard ceiling on actions per Helios run per account.
// A real performance marketer makes maybe 5-15 changes per week on a healthy
// account. Beyond that we're either noise-chasing or there's an account-wide
// problem that's structural (not solved by per-keyword tweaks).
const MAX_ACTIONS_PER_ACCOUNT_PER_RUN = 25;

export interface HeliosRunResult {
  candidates: ActionCandidate[];
  applied: ActionCandidate[];
  queued: ActionCandidate[];
  blocked: { candidate: ActionCandidate; reasonCode: string; message: string }[];
}

export async function runHelios(params: {
  userId: string;
  analyses: CampaignAnalysis[];
  settings: OptSettings;
  weights?: WeightedObjective;
  vertical?: Vertical;
  scopeTiers?: ("LOW" | "MED" | "HIGH")[];
}): Promise<HeliosRunResult> {
  const weights = normalizeWeights(params.weights ?? DEFAULT_WEIGHTS);
  const vertical = params.vertical ?? "D2C";
  const playbook = getPlaybook(vertical);
  const scopeTiers = params.scopeTiers ?? ["LOW", "MED", "HIGH"];

  const candidates: ActionCandidate[] = [];

  for (const analysis of params.analyses) {
    const signals = computeSignals(analysis.daily ?? [], analysis.dailyBudget);
    const { score, confidence: baseConfidence } = computeScore(
      {
        roas: analysis.avgRoas,
        cpa: analysis.avgCpa,
        conversions: analysis.totalConversions,
        impressions: analysis.totalImpressions,
        daysActive: analysis.daysActive,
      },
      playbook,
      weights
    );

    const generated = generateCandidates({
      analysis,
      signals,
      score,
      confidence: baseConfidence,
      playbook,
      settings: params.settings,
    });

    const accountId =
      analysis.googleAdsConnectionId || analysis.metaAdsConnectionId || null;
    const platform: AdPlatform | null =
      analysis.platform === "GOOGLE_ADS"
        ? "GOOGLE_ADS"
        : analysis.platform === "META_ADS"
          ? "META_ADS"
          : null;

    const fp =
      platform && accountId
        ? await lookupFingerprint(platform, accountId)
        : null;
    const errors = (fp?.predictionErrors as Parameters<typeof applyBiasCorrection>[1]) || undefined;
    const { aggressiveness } = computeRiskAdjustment(fp);

    const survivors: typeof generated = [];
    for (const c of generated) {
      // Drop suppressed action types (silent-rejection history)
      if (isSuppressed(fp, c.type)) continue;

      const corr = applyBiasCorrection(c.expectedDelta, errors, c.type);
      c.expectedDelta = corr.adjustedDelta;
      c.confidence = c.confidence * corr.confidenceMultiplier;

      // Account-level risk adjustment: cautious users get borderline LOW→MED,
      // MED→HIGH bumps; rubber-stamp users get the reverse.
      if (aggressiveness < 0.8 && c.riskTier === "LOW") c.riskTier = "MED";
      else if (aggressiveness < 0.7 && c.riskTier === "MED") c.riskTier = "HIGH";
      else if (aggressiveness > 1.2 && c.riskTier === "HIGH") c.riskTier = "MED";
      else if (aggressiveness > 1.3 && c.riskTier === "MED") c.riskTier = "LOW";

      survivors.push(c);
    }

    candidates.push(...survivors);
  }

  let resolved = resolveConflicts(candidates);

  // Hard cap. Keep the highest-rank actions; drop the rest.
  // resolveConflicts already returns sorted descending by rankScore.
  if (resolved.length > MAX_ACTIONS_PER_ACCOUNT_PER_RUN) {
    resolved = resolved.slice(0, MAX_ACTIONS_PER_ACCOUNT_PER_RUN);
  }

  const result: HeliosRunResult = {
    candidates: resolved,
    applied: [],
    queued: [],
    blocked: [],
  };

  for (const candidate of resolved) {
    if (!scopeTiers.includes(candidate.riskTier)) continue;

    const guard = await checkGuardrails(candidate, { userId: params.userId });
    if (!guard.allowed) {
      result.blocked.push({
        candidate,
        reasonCode: guard.reasonCode ?? "GUARDRAIL_UNKNOWN",
        message: guard.message ?? "blocked",
      });
      continue;
    }

    if (candidate.riskTier === "LOW") {
      result.applied.push(candidate);
    } else {
      result.queued.push(candidate);
    }
  }

  return result;
}

export function resolveConflicts(candidates: ActionCandidate[]): ActionCandidate[] {
  const groups = new Map<string, ActionCandidate[]>();
  for (const c of candidates) {
    const key = conflictKey(c);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }

  const winners: ActionCandidate[] = [];
  for (const group of groups.values()) {
    if (group.length === 1) {
      winners.push(group[0]);
      continue;
    }
    const winner = group.reduce((best, cur) =>
      rankScore(cur) > rankScore(best) ? cur : best
    );
    winners.push(winner);
  }

  return winners.sort((a, b) => rankScore(b) - rankScore(a));
}

function conflictKey(c: ActionCandidate): string {
  if (c.type === "INCREASE_BUDGET" || c.type === "DECREASE_BUDGET") {
    return `BUDGET:${c.campaignId}`;
  }
  if (c.type === "ADJUST_BID") {
    return `BID:${c.campaignId}:${c.keywordId}`;
  }
  if (c.type === "PAUSE_AD" || c.type === "ENABLE_AD") {
    return `AD:${c.campaignId}:${c.adId}`;
  }
  if (c.type === "PAUSE_KEYWORD" || c.type === "ADD_NEGATIVE_KEYWORD") {
    return `KW:${c.campaignId}:${c.keywordId}`;
  }
  return `${c.type}:${c.campaignId}:${c.adId || ""}:${c.keywordId || ""}`;
}

function rankScore(c: ActionCandidate): number {
  const tierMult =
    c.riskTier === "LOW" ? 1.0 : c.riskTier === "MED" ? 0.85 : 0.6;
  return c.expectedDelta * c.confidence * tierMult;
}

export async function persistHeliosActions(params: {
  optimizationRunId: string;
  applied: ActionCandidate[];
  queued: ActionCandidate[];
}) {
  const all = [...params.applied, ...params.queued];
  if (all.length === 0) return;

  await prisma.optimizationAction.createMany({
    data: all.map((a) => ({
      optimizationRunId: params.optimizationRunId,
      campaignId: a.campaignId,
      adId: a.adId ?? null,
      keywordId: a.keywordId ?? null,
      actionType: a.type as ActionType,
      description: a.description,
      reasonCode: a.reasonCode,
      riskTier: a.riskTier,
      expectedDelta: a.expectedDelta,
      confidence: a.confidence,
      previousValue: a.previousValue ? JSON.parse(JSON.stringify(a.previousValue)) : undefined,
      newValue: a.newValue ? JSON.parse(JSON.stringify(a.newValue)) : undefined,
      status: a.riskTier === "LOW" ? ("APPROVED" as const) : ("PENDING" as const),
      autoApprovesAt:
        a.riskTier === "MED" ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
    })),
  });
}

export function buildDailyPoints(rows: {
  date: Date;
  spend: { toString(): string } | number;
  revenue: { toString(): string } | number;
  conversions: number;
  impressions: bigint | number;
  clicks: bigint | number;
}[]): DailyPoint[] {
  return rows.map((r) => ({
    date: r.date,
    spend: Number(r.spend),
    revenue: Number(r.revenue),
    conversions: r.conversions,
    impressions: Number(r.impressions),
    clicks: Number(r.clicks),
  }));
}
