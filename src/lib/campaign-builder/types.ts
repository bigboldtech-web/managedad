export interface KeywordBlueprint {
  text: string;
  matchType: "EXACT" | "PHRASE" | "BROAD";
}

export interface AdBlueprint {
  headlines: string[];       // Google RSA: max 15, each ≤30 chars
  descriptions: string[];   // Google RSA: max 4, each ≤90 chars
  metaTitle?: string;        // Meta: ≤40 chars
  metaBody?: string;         // Meta: ≤125 chars recommended
  finalUrl?: string;
}

export interface AdGroupBlueprint {
  name: string;
  theme: string;
  keywords: KeywordBlueprint[];
  negativeKeywords: string[];
  ads: AdBlueprint[];
}

export interface CampaignBlueprintData {
  campaignName: string;
  platform: "GOOGLE_ADS" | "META_ADS";
  objective: string;
  dailyBudget: number;        // INR
  biddingStrategy: string;
  targetLocations: string[];
  demographics: {
    ageRange?: string;
    gender?: string;
    devices?: string[];
  };
  adGroups: AdGroupBlueprint[];
  negativeKeywords: string[]; // campaign-level negatives
  rationale: string;          // AI explanation of the strategy
  estimatedReach?: string;
  estimatedCpa?: string;
}
