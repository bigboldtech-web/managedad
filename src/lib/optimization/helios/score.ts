import type { PlaybookConstants } from "./playbooks";
import type { WeightedObjective } from "./types";

export interface ScoreInput {
  roas: number;
  cpa: number;
  conversions: number;
  impressions: number;
  daysActive: number;
}

export interface ScoreResult {
  score: number;
  confidence: number;
}

export function computeScore(
  input: ScoreInput,
  playbook: PlaybookConstants,
  weights: WeightedObjective
): ScoreResult {
  const rNorm = clamp(input.roas / playbook.goodRoas, 0, 2) / 2;
  const cNorm =
    input.cpa > 0
      ? clamp(1 - input.cpa / playbook.goodCpa, -1, 1) * 0.5 + 0.5
      : 0.5;
  const vNorm = clamp(Math.log10(input.conversions + 1) / 3, 0, 1);

  const score =
    100 *
    (weights.roasWeight * rNorm +
      weights.cpaWeight * cNorm +
      weights.volumeWeight * vNorm);

  const confidence = Math.min(
    1.0,
    (input.impressions / 1000) * (input.daysActive / 14)
  );

  return { score, confidence };
}

export function normalizeWeights(w: WeightedObjective): WeightedObjective {
  const sum = w.roasWeight + w.cpaWeight + w.volumeWeight;
  if (sum <= 0) return { roasWeight: 0.6, cpaWeight: 0.3, volumeWeight: 0.1 };
  return {
    roasWeight: w.roasWeight / sum,
    cpaWeight: w.cpaWeight / sum,
    volumeWeight: w.volumeWeight / sum,
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
