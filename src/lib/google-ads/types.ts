export interface GoogleAdsCredentials {
  clientId: string;
  clientSecret: string;
  developerToken: string;
  refreshToken: string;
  customerId: string;
  managerAccountId?: string;
}

export interface GoogleAdsCampaign {
  id: string;
  name: string;
  status: "ENABLED" | "PAUSED" | "REMOVED";
  budgetAmountMicros: string;
  biddingStrategy: string;
  impressions: number;
  clicks: number;
  costMicros: string;
  conversions: number;
}

export interface GoogleAdsAdGroup {
  id: string;
  campaignId: string;
  name: string;
  status: string;
  cpcBidMicros: string;
}

export interface GoogleAdsKeyword {
  id: string;
  adGroupId: string;
  text: string;
  matchType: "EXACT" | "PHRASE" | "BROAD";
  status: string;
  qualityScore?: number;
  cpcBidMicros?: string;
  impressions: number;
  clicks: number;
  costMicros: string;
  conversions: number;
}

export interface GoogleAdsAd {
  id: string;
  adGroupId: string;
  type: string;
  headlines: string[];
  descriptions: string[];
  finalUrls: string[];
  status: string;
  impressions: number;
  clicks: number;
  costMicros: string;
  conversions: number;
}

export interface GoogleAdsReport {
  date: string;
  campaignId: string;
  impressions: number;
  clicks: number;
  costMicros: string;
  conversions: number;
  conversionValue: number;
}
