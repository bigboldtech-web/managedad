import type { CampaignAnalysis } from "../types";
import type { OptimizationSettings } from "../types";
import type { PlaybookConstants } from "./playbooks";
import type { ActionCandidate, CampaignSignals } from "./types";
import type { RiskTier } from "@prisma/client";

interface GenInput {
  analysis: CampaignAnalysis;
  signals: CampaignSignals;
  score: number;
  confidence: number;
  playbook: PlaybookConstants;
  settings: OptimizationSettings;
}

let candidateCounter = 0;
function cid(prefix: string): string {
  candidateCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${candidateCounter}`;
}

export function generateCandidates(input: GenInput): ActionCandidate[] {
  return [
    ...budgetCandidates(input),
    ...bidCandidates(input),
    ...keywordCandidates(input),
    ...creativeCandidates(input),
  ];
}

function budgetCandidates(input: GenInput): ActionCandidate[] {
  const { analysis, signals, score, confidence, settings } = input;
  const out: ActionCandidate[] = [];
  if (analysis.dailyBudget <= 0) return out;

  if (signals.saturation > 0.95 && score > 70 && signals.trend7d >= 0) {
    const pct = clamp(10 + 20 * (score / 100 - 0.7), 5, Number(settings.maxBudgetIncrease));
    const newBudget = round2(analysis.dailyBudget * (1 + pct / 100));
    out.push({
      id: cid("BUD_UP"),
      type: "INCREASE_BUDGET",
      campaignId: analysis.campaignId,
      magnitude: pct,
      expectedDelta: (pct / 100) * 0.6,
      confidence,
      riskTier: classifyBudgetTier(pct),
      reasonCode: "BUDGET_SATURATION",
      description: `Increase budget for "${analysis.campaignName}" by ${pct.toFixed(0)}% — saturated (${(signals.saturation * 100).toFixed(0)}%) with score ${score.toFixed(0)}`,
      previousValue: { dailyBudget: analysis.dailyBudget },
      newValue: { dailyBudget: newBudget },
    });
  }

  if (score < 30 && analysis.daysActive >= 14 && signals.trend7d <= 0) {
    const pct = clamp(10 + 30 * (0.3 - score / 100), 10, Number(settings.maxBudgetDecrease));
    const newBudget = round2(analysis.dailyBudget * (1 - pct / 100));
    out.push({
      id: cid("BUD_DOWN"),
      type: "DECREASE_BUDGET",
      campaignId: analysis.campaignId,
      magnitude: pct,
      expectedDelta: (pct / 100) * 0.4,
      confidence,
      riskTier: classifyBudgetTier(pct),
      reasonCode: "ROAS_DECAY",
      description: `Decrease budget for "${analysis.campaignName}" by ${pct.toFixed(0)}% — score ${score.toFixed(0)} with declining 7d trend`,
      previousValue: { dailyBudget: analysis.dailyBudget },
      newValue: { dailyBudget: newBudget },
    });
  }

  return out;
}

function bidCandidates(input: GenInput): ActionCandidate[] {
  const { analysis, playbook, confidence } = input;
  const out: ActionCandidate[] = [];

  if (analysis.platform !== "GOOGLE_ADS") return out;

  for (const kw of analysis.keywords) {
    if (kw.isNegative || kw.status !== "ACTIVE") continue;
    if (kw.conversions < 5) continue;

    const kwCpa = kw.spend / kw.conversions;
    const ratio = kwCpa / playbook.goodCpa;

    if (ratio > 1.3 && kw.cpc > 0) {
      const pct = clamp(10 * (ratio - 1), 5, 25);
      const newCpc = round2(kw.cpc * (1 - pct / 100));
      out.push({
        id: cid("BID_DOWN"),
        type: "ADJUST_BID",
        campaignId: analysis.campaignId,
        keywordId: kw.keywordId,
        magnitude: -pct,
        expectedDelta: 0.05 + 0.1 * (ratio - 1),
        confidence,
        riskTier: pct < 15 ? "LOW" : "MED",
        reasonCode: "KEYWORD_WASTE",
        description: `Decrease bid for "${kw.text}" by ${pct.toFixed(0)}% — CPA ₹${kwCpa.toFixed(2)} vs target ₹${playbook.goodCpa.toFixed(2)}`,
        previousValue: { cpc: kw.cpc, cpa: kwCpa },
        newValue: { cpc: newCpc, bidMicros: Math.round(newCpc * 1_000_000) },
      });
    } else if (ratio < 0.7 && kw.cpc > 0) {
      const pct = clamp(10 * (1 - ratio), 5, 20);
      const newCpc = round2(kw.cpc * (1 + pct / 100));
      out.push({
        id: cid("BID_UP"),
        type: "ADJUST_BID",
        campaignId: analysis.campaignId,
        keywordId: kw.keywordId,
        magnitude: pct,
        expectedDelta: 0.08 + 0.1 * (1 - ratio),
        confidence,
        riskTier: pct < 15 ? "LOW" : "MED",
        reasonCode: "KEYWORD_PROVEN",
        description: `Increase bid for "${kw.text}" by ${pct.toFixed(0)}% — CPA ₹${kwCpa.toFixed(2)} well below target ₹${playbook.goodCpa.toFixed(2)}`,
        previousValue: { cpc: kw.cpc, cpa: kwCpa },
        newValue: { cpc: newCpc, bidMicros: Math.round(newCpc * 1_000_000) },
      });
    }
  }

  return out;
}

function keywordCandidates(input: GenInput): ActionCandidate[] {
  const { analysis, confidence } = input;
  const out: ActionCandidate[] = [];
  if (analysis.platform !== "GOOGLE_ADS") return out;

  for (const kw of analysis.keywords) {
    if (kw.isNegative || kw.status !== "ACTIVE") continue;

    if (
      kw.matchType === "BROAD" &&
      kw.spend >= 30 &&
      kw.clicks >= 20 &&
      kw.conversions === 0
    ) {
      out.push({
        id: cid("NEG_ADD"),
        type: "ADD_NEGATIVE_KEYWORD",
        campaignId: analysis.campaignId,
        keywordId: kw.keywordId,
        magnitude: kw.spend,
        expectedDelta: kw.spend / Math.max(analysis.totalSpend, 1),
        confidence,
        riskTier: "LOW",
        reasonCode: "KEYWORD_WASTE",
        description: `Add "${kw.text}" as negative — broad match spent ₹${kw.spend.toFixed(2)} with 0 conversions`,
        previousValue: { isNegative: false, matchType: kw.matchType },
        newValue: { keyword: kw.text, matchType: "EXACT" },
      });
    }

    if (kw.spend >= 50 && kw.clicks >= 50 && kw.conversions === 0) {
      out.push({
        id: cid("KW_PAUSE"),
        type: "PAUSE_KEYWORD",
        campaignId: analysis.campaignId,
        keywordId: kw.keywordId,
        magnitude: kw.spend,
        expectedDelta: kw.spend / Math.max(analysis.totalSpend, 1),
        confidence,
        riskTier: "LOW",
        reasonCode: "KEYWORD_WASTE",
        description: `Pause "${kw.text}" — ${kw.clicks} clicks, ₹${kw.spend.toFixed(2)} spend, 0 conversions`,
        previousValue: { status: "ACTIVE", clicks: kw.clicks, spend: kw.spend },
        newValue: { status: "PAUSED" },
      });
    }
  }

  return out;
}

function creativeCandidates(input: GenInput): ActionCandidate[] {
  const { analysis, confidence } = input;
  const out: ActionCandidate[] = [];

  const adGroupBuckets = new Map<string, typeof analysis.ads>();
  for (const ad of analysis.ads) {
    const k = ad.adGroupId || "_";
    if (!adGroupBuckets.has(k)) adGroupBuckets.set(k, []);
    adGroupBuckets.get(k)!.push(ad);
  }

  for (const [groupId, ads] of adGroupBuckets) {
    if (groupId === "_") continue;
    const active = ads.filter((a) => a.status === "ACTIVE");
    if (active.length === 1 && active[0].daysSinceCreated >= 7) {
      out.push({
        id: cid("AB_GAP"),
        type: "SUGGEST_AB_TEST",
        campaignId: analysis.campaignId,
        adId: active[0].adId,
        magnitude: 0,
        expectedDelta: 0.1,
        confidence: confidence * 0.5,
        riskTier: "LOW",
        reasonCode: "AB_TEST_GAP",
        description: `Ad group has only one active ad ("${active[0].name || active[0].adId}") — consider an A/B variation`,
        previousValue: { activeAdCount: 1 },
        newValue: { suggestedActiveAdCount: 2 },
      });
    }
  }

  for (const ad of analysis.ads) {
    if (ad.status !== "ACTIVE") continue;
    if (ad.daysSinceCreated < 14) continue;
    if (ad.impressions < 200) continue;

    // Explicit fatigue signal wins over the generic low-CTR check
    if (ad.fatigueScore >= 70) {
      out.push({
        id: cid("FATIGUE"),
        type: "PAUSE_AD",
        campaignId: analysis.campaignId,
        adId: ad.adId,
        magnitude: ad.fatigueScore,
        expectedDelta: 0.08,
        confidence: confidence * (ad.fatigueScore / 100),
        riskTier: ad.conversions > 0 ? "MED" : "LOW",
        reasonCode: "FATIGUE",
        description: `Pause "${ad.name || ad.adId}" — creative is fatigued (score ${ad.fatigueScore}/100). CTR trending down over 7d. Consider rotating in a fresh variant.`,
        previousValue: { status: "ACTIVE", fatigueScore: ad.fatigueScore },
        newValue: { status: "PAUSED" },
      });
      continue;
    }

    if (ad.ctr >= analysis.avgCtr * 0.6) continue;

    out.push({
      id: cid("UNDERPERF"),
      type: "PAUSE_AD",
      campaignId: analysis.campaignId,
      adId: ad.adId,
      magnitude: 0,
      expectedDelta: 0.05,
      confidence,
      riskTier: ad.conversions > 0 ? "MED" : "LOW",
      reasonCode: "FATIGUE",
      description: `Pause "${ad.name || ad.adId}" — CTR ${(ad.ctr * 100).toFixed(2)}% well below campaign avg ${(analysis.avgCtr * 100).toFixed(2)}% after ${ad.daysSinceCreated}d`,
      previousValue: { status: "ACTIVE", ctr: ad.ctr },
      newValue: { status: "PAUSED" },
    });
  }

  return out;
}

function classifyBudgetTier(pct: number): RiskTier {
  if (pct < 10) return "LOW";
  if (pct <= 25) return "MED";
  return "HIGH";
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
