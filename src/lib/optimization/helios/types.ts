import type { ActionType, RiskTier } from "@prisma/client";
import type { CampaignAnalysis } from "../types";

export interface WeightedObjective {
  roasWeight: number;
  cpaWeight: number;
  volumeWeight: number;
}

export interface CampaignSignals {
  trend7d: number;
  velocity: number;
  volatility: number;
  saturation: number;
}

export type ReasonCode =
  | "ROAS_DECAY"
  | "ROAS_GROWTH"
  | "BUDGET_SATURATION"
  | "KEYWORD_WASTE"
  | "KEYWORD_PROVEN"
  | "FATIGUE"
  | "ANOMALY_SPEND"
  | "ANOMALY_CPA"
  | "CROSS_PLATFORM_SHIFT"
  | "MATCH_TYPE_TIGHTEN"
  | "AB_TEST_GAP";

export interface ActionCandidate {
  id: string;
  type: ActionType;
  campaignId: string;
  adId?: string;
  keywordId?: string;
  magnitude: number;
  expectedDelta: number;
  confidence: number;
  riskTier: RiskTier;
  reasonCode: ReasonCode;
  description: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  conflictsWith?: string[];
}

export interface HeliosRunContext {
  userId: string;
  vertical: import("@prisma/client").Vertical;
  weights: WeightedObjective;
  analyses: CampaignAnalysis[];
}
