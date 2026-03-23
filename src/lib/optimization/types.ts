export type ActionType =
  | "INCREASE_BUDGET"
  | "DECREASE_BUDGET"
  | "PAUSE_AD"
  | "ENABLE_AD"
  | "PAUSE_KEYWORD"
  | "ADD_NEGATIVE_KEYWORD"
  | "ADJUST_BID"
  | "CREATE_AD_VARIATION"
  | "SUGGEST_AB_TEST";

export type ActionStatus =
  | "PENDING"
  | "APPROVED"
  | "APPLIED"
  | "REJECTED"
  | "FAILED";

export interface OptimizationAction {
  campaignId: string;
  adId?: string;
  keywordId?: string;
  actionType: ActionType;
  description: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
}

export interface CampaignAnalysis {
  campaignId: string;
  campaignName: string;
  platform: "GOOGLE_ADS" | "META_ADS";
  status: string;
  dailyBudget: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalSpend: number;
  totalRevenue: number;
  avgCtr: number;
  avgCpc: number;
  avgCpa: number;
  avgRoas: number;
  daysActive: number;
  ads: AdAnalysis[];
  keywords: KeywordAnalysis[];
}

export interface AdAnalysis {
  adId: string;
  adGroupId: string | null;
  name: string | null;
  status: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  ctr: number;
  daysSinceCreated: number;
}

export interface KeywordAnalysis {
  keywordId: string;
  text: string;
  matchType: string;
  isNegative: boolean;
  status: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  qualityScore: number | null;
  ctr: number;
  cpc: number;
  cpa: number;
}

export interface OptimizationSettings {
  isEnabled: boolean;
  autoApply: boolean;
  minImpressions: number;
  lowPerformanceThreshold: number;
  highPerformanceThreshold: number;
  maxBudgetIncrease: number;
  maxBudgetDecrease: number;
}

export interface OptimizationRunSummary {
  runId: string;
  totalActions: number;
  actionsByType: Record<string, number>;
  campaignsAnalyzed: number;
  completedAt: string;
}
