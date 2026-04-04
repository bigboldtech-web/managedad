export type ReviewType =
  | "KEYWORD_REVIEW"
  | "CREATIVE_REVIEW"
  | "BID_REVIEW"
  | "BUDGET_REVIEW"
  | "COMPETITOR_REVIEW"
  | "MONTHLY_DEEP_AUDIT";

export interface ReviewFinding {
  type: "OPPORTUNITY" | "WASTE" | "WARNING" | "SUCCESS";
  title: string;
  description: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  metric?: string;
  campaignId?: string;
  campaignName?: string;
}

export interface ReviewAction {
  actionType: string;
  description: string;
  campaignId?: string;
  applied: boolean;
}

export interface ReviewResult {
  reviewType: ReviewType;
  findings: ReviewFinding[];
  actions: ReviewAction[];
  summary: string;
  score?: number;
}
