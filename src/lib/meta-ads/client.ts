import { prisma } from "@/lib/prisma";
import type {
  MetaAdAccount,
  MetaAdSet,
  MetaAd,
  MetaApiResponse,
  MetaCampaign,
  MetaCampaignObjective,
  MetaCampaignStatus,
  MetaInsight,
  MetaTargetingSpec,
  MetaAdSetBillingEvent,
  MetaAdSetOptimizationGoal,
} from "./types";

const API_VERSION = "v22.0";
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

export class MetaAdsClient {
  private accessToken: string;
  private connectionId: string;

  constructor(params: { accessToken: string; connectionId: string }) {
    this.accessToken = params.accessToken;
    this.connectionId = params.connectionId;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const separator = endpoint.includes("?") ? "&" : "?";
    const url = `${BASE_URL}${endpoint}${separator}access_token=${this.accessToken}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      const errorMessage =
        error.error?.message || `Meta API error: ${response.statusText}`;
      const errorCode = error.error?.code;

      // Handle expired token
      if (response.status === 401 || errorCode === 190) {
        await this.markTokenExpired();
        throw new Error(`Meta Ads token expired: ${errorMessage}`);
      }

      // Handle rate limiting
      if (response.status === 429 || errorCode === 32) {
        throw new Error(`Meta Ads rate limit reached: ${errorMessage}`);
      }

      throw new Error(errorMessage);
    }

    return response.json();
  }

  private async markTokenExpired(): Promise<void> {
    await prisma.metaAdsConnection.update({
      where: { id: this.connectionId },
      data: { isActive: false },
    });
  }

  async isTokenValid(): Promise<boolean> {
    try {
      await this.request<{ data: { is_valid: boolean } }>(
        `/debug_token?input_token=${this.accessToken}`
      );
      return true;
    } catch {
      return false;
    }
  }

  // ============================================================
  // CAMPAIGNS
  // ============================================================

  async listCampaigns(
    adAccountId: string
  ): Promise<MetaApiResponse<MetaCampaign>> {
    const fields = [
      "id",
      "name",
      "status",
      "objective",
      "daily_budget",
      "lifetime_budget",
      "budget_remaining",
      "buying_type",
      "created_time",
      "updated_time",
      "start_time",
      "stop_time",
      "special_ad_categories",
    ].join(",");

    return this.request<MetaApiResponse<MetaCampaign>>(
      `/act_${adAccountId}/campaigns?fields=${fields}&limit=100`
    );
  }

  async createCampaign(
    adAccountId: string,
    params: {
      name: string;
      objective: MetaCampaignObjective;
      status?: MetaCampaignStatus;
      daily_budget?: string;
      lifetime_budget?: string;
      special_ad_categories?: string[];
    }
  ): Promise<{ id: string }> {
    return this.request<{ id: string }>(
      `/act_${adAccountId}/campaigns`,
      {
        method: "POST",
        body: JSON.stringify({
          name: params.name,
          objective: params.objective,
          status: params.status || "PAUSED",
          daily_budget: params.daily_budget,
          lifetime_budget: params.lifetime_budget,
          special_ad_categories: params.special_ad_categories || [],
        }),
      }
    );
  }

  // ============================================================
  // AD SETS
  // ============================================================

  async listAdSets(
    adAccountId: string
  ): Promise<MetaApiResponse<MetaAdSet>> {
    const fields = [
      "id",
      "name",
      "campaign_id",
      "status",
      "daily_budget",
      "lifetime_budget",
      "budget_remaining",
      "billing_event",
      "optimization_goal",
      "bid_amount",
      "bid_strategy",
      "targeting",
      "start_time",
      "end_time",
      "created_time",
      "updated_time",
    ].join(",");

    return this.request<MetaApiResponse<MetaAdSet>>(
      `/act_${adAccountId}/adsets?fields=${fields}&limit=100`
    );
  }

  async createAdSet(
    adAccountId: string,
    params: {
      name: string;
      campaign_id: string;
      status?: MetaCampaignStatus;
      daily_budget?: string;
      lifetime_budget?: string;
      billing_event: MetaAdSetBillingEvent;
      optimization_goal: MetaAdSetOptimizationGoal;
      bid_amount?: string;
      bid_strategy?: string;
      targeting: MetaTargetingSpec;
      start_time?: string;
      end_time?: string;
    }
  ): Promise<{ id: string }> {
    return this.request<{ id: string }>(
      `/act_${adAccountId}/adsets`,
      {
        method: "POST",
        body: JSON.stringify({
          name: params.name,
          campaign_id: params.campaign_id,
          status: params.status || "PAUSED",
          daily_budget: params.daily_budget,
          lifetime_budget: params.lifetime_budget,
          billing_event: params.billing_event,
          optimization_goal: params.optimization_goal,
          bid_amount: params.bid_amount,
          bid_strategy: params.bid_strategy,
          targeting: params.targeting,
          start_time: params.start_time,
          end_time: params.end_time,
        }),
      }
    );
  }

  // ============================================================
  // ADS
  // ============================================================

  async createAd(
    adAccountId: string,
    params: {
      name: string;
      adset_id: string;
      status?: MetaCampaignStatus;
      creative: {
        creative_id?: string;
        name?: string;
        object_story_spec?: Record<string, unknown>;
        asset_feed_spec?: Record<string, unknown>;
      };
    }
  ): Promise<{ id: string }> {
    return this.request<{ id: string }>(
      `/act_${adAccountId}/ads`,
      {
        method: "POST",
        body: JSON.stringify({
          name: params.name,
          adset_id: params.adset_id,
          status: params.status || "PAUSED",
          creative: params.creative,
        }),
      }
    );
  }

  // ============================================================
  // INSIGHTS
  // ============================================================

  async getInsights(
    objectId: string,
    dateRange: { since: string; until: string }
  ): Promise<MetaApiResponse<MetaInsight>> {
    const fields = [
      "impressions",
      "clicks",
      "spend",
      "reach",
      "cpc",
      "cpm",
      "ctr",
      "actions",
      "cost_per_action_type",
      "conversions",
    ].join(",");

    return this.request<MetaApiResponse<MetaInsight>>(
      `/${objectId}/insights?fields=${fields}&time_range={"since":"${dateRange.since}","until":"${dateRange.until}"}&time_increment=1`
    );
  }

  // ============================================================
  // AD ACCOUNTS
  // ============================================================

  static async listAdAccounts(
    accessToken: string
  ): Promise<MetaApiResponse<MetaAdAccount>> {
    const fields = [
      "id",
      "account_id",
      "name",
      "account_status",
      "currency",
      "timezone_name",
      "business{id,name}",
    ].join(",");

    const response = await fetch(
      `${BASE_URL}/me/adaccounts?fields=${fields}&access_token=${accessToken}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Failed to list ad accounts: ${error.error?.message || response.statusText}`
      );
    }

    return response.json();
  }
}

export async function createMetaAdsClient(
  connectionId: string
): Promise<MetaAdsClient> {
  const connection = await prisma.metaAdsConnection.findUnique({
    where: { id: connectionId },
  });

  if (!connection) throw new Error("Meta Ads connection not found");

  if (
    connection.tokenExpiresAt &&
    connection.tokenExpiresAt < new Date()
  ) {
    throw new Error(
      "Meta Ads access token has expired. Please reconnect your account."
    );
  }

  return new MetaAdsClient({
    accessToken: connection.accessToken,
    connectionId: connection.id,
  });
}
