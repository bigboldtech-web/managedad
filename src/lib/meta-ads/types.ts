export interface MetaAdsCredentials {
  accessToken: string;
  adAccountId: string;
  businessId?: string;
}

export type MetaCampaignStatus = "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED";

export type MetaCampaignObjective =
  | "OUTCOME_AWARENESS"
  | "OUTCOME_ENGAGEMENT"
  | "OUTCOME_LEADS"
  | "OUTCOME_SALES"
  | "OUTCOME_TRAFFIC"
  | "OUTCOME_APP_PROMOTION";

export interface MetaCampaign {
  id: string;
  name: string;
  status: MetaCampaignStatus;
  objective: MetaCampaignObjective;
  daily_budget?: string;
  lifetime_budget?: string;
  budget_remaining?: string;
  buying_type: string;
  created_time: string;
  updated_time: string;
  start_time?: string;
  stop_time?: string;
  special_ad_categories: string[];
}

export type MetaAdSetBillingEvent = "IMPRESSIONS" | "LINK_CLICKS" | "APP_INSTALLS";

export type MetaAdSetOptimizationGoal =
  | "REACH"
  | "IMPRESSIONS"
  | "LINK_CLICKS"
  | "LANDING_PAGE_VIEWS"
  | "CONVERSIONS"
  | "LEAD_GENERATION"
  | "APP_INSTALLS";

export interface MetaTargetingSpec {
  age_min?: number;
  age_max?: number;
  genders?: number[];
  geo_locations?: {
    countries?: string[];
    regions?: { key: string }[];
    cities?: { key: string; radius?: number; distance_unit?: string }[];
    zips?: { key: string }[];
  };
  interests?: { id: string; name: string }[];
  behaviors?: { id: string; name: string }[];
  custom_audiences?: { id: string; name: string }[];
  excluded_custom_audiences?: { id: string; name: string }[];
  publisher_platforms?: string[];
  facebook_positions?: string[];
  instagram_positions?: string[];
}

export interface MetaAdSet {
  id: string;
  name: string;
  campaign_id: string;
  status: MetaCampaignStatus;
  daily_budget?: string;
  lifetime_budget?: string;
  budget_remaining?: string;
  billing_event: MetaAdSetBillingEvent;
  optimization_goal: MetaAdSetOptimizationGoal;
  bid_amount?: string;
  bid_strategy?: string;
  targeting: MetaTargetingSpec;
  start_time?: string;
  end_time?: string;
  created_time: string;
  updated_time: string;
}

export interface MetaAdCreative {
  id: string;
  name?: string;
  title?: string;
  body?: string;
  image_url?: string;
  image_hash?: string;
  video_id?: string;
  link_url?: string;
  call_to_action_type?: string;
  object_story_spec?: Record<string, unknown>;
}

export interface MetaAd {
  id: string;
  name: string;
  adset_id: string;
  campaign_id: string;
  status: MetaCampaignStatus;
  creative: MetaAdCreative;
  created_time: string;
  updated_time: string;
}

export interface MetaInsight {
  date_start: string;
  date_stop: string;
  impressions: string;
  clicks: string;
  spend: string;
  reach: string;
  cpc: string;
  cpm: string;
  ctr: string;
  actions?: MetaInsightAction[];
  cost_per_action_type?: MetaInsightAction[];
  conversions?: MetaInsightAction[];
}

export interface MetaInsightAction {
  action_type: string;
  value: string;
}

export interface MetaAdAccount {
  id: string;
  account_id: string;
  name: string;
  account_status: number;
  currency: string;
  timezone_name: string;
  business?: {
    id: string;
    name: string;
  };
}

export interface MetaApiResponse<T> {
  data: T[];
  paging?: {
    cursors?: {
      before: string;
      after: string;
    };
    next?: string;
    previous?: string;
  };
}

export interface MetaApiError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}
