import { refreshAccessToken } from "./oauth";
import { prisma } from "@/lib/prisma";

const API_VERSION = "v19";
const BASE_URL = `https://googleads.googleapis.com/${API_VERSION}`;

export class GoogleAdsClient {
  private customerId: string;
  private developerToken: string;
  private accessToken: string;
  private refreshToken: string;
  private connectionId: string;
  private managerAccountId?: string;

  constructor(params: {
    customerId: string;
    developerToken: string;
    accessToken: string;
    refreshToken: string;
    connectionId: string;
    managerAccountId?: string;
  }) {
    this.customerId = params.customerId.replace(/-/g, "");
    this.developerToken = params.developerToken;
    this.accessToken = params.accessToken;
    this.refreshToken = params.refreshToken;
    this.connectionId = params.connectionId;
    this.managerAccountId = params.managerAccountId?.replace(/-/g, "");
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.accessToken}`,
      "developer-token": this.developerToken,
      "Content-Type": "application/json",
    };
    if (this.managerAccountId) {
      headers["login-customer-id"] = this.managerAccountId;
    }
    return headers;
  }

  private async handleTokenRefresh(): Promise<void> {
    const { access_token, expires_in } = await refreshAccessToken(
      this.refreshToken
    );
    this.accessToken = access_token;

    await prisma.googleAdsConnection.update({
      where: { id: this.connectionId },
      data: {
        accessToken: access_token,
        tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
      },
    });
  }

  async search(query: string): Promise<any[]> {
    const url = `${BASE_URL}/customers/${this.customerId}/googleAds:search`;

    let response = await fetch(url, {
      method: "POST",
      headers: await this.getHeaders(),
      body: JSON.stringify({ query }),
    });

    if (response.status === 401) {
      await this.handleTokenRefresh();
      response = await fetch(url, {
        method: "POST",
        headers: await this.getHeaders(),
        body: JSON.stringify({ query }),
      });
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Google Ads API error: ${JSON.stringify(error)}`
      );
    }

    const data = await response.json();
    return data.results || [];
  }

  async mutate(operations: any[]): Promise<any> {
    const url = `${BASE_URL}/customers/${this.customerId}/googleAds:mutate`;

    let response = await fetch(url, {
      method: "POST",
      headers: await this.getHeaders(),
      body: JSON.stringify({ mutateOperations: operations }),
    });

    if (response.status === 401) {
      await this.handleTokenRefresh();
      response = await fetch(url, {
        method: "POST",
        headers: await this.getHeaders(),
        body: JSON.stringify({ mutateOperations: operations }),
      });
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Google Ads mutate error: ${JSON.stringify(error)}`
      );
    }

    return response.json();
  }

  // Convenience methods

  async listCampaigns() {
    return this.search(`
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        campaign_budget.amount_micros,
        campaign.bidding_strategy_type,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value
      FROM campaign
      WHERE campaign.status != 'REMOVED'
      ORDER BY metrics.cost_micros DESC
    `);
  }

  async listAdGroups(campaignId: string) {
    return this.search(`
      SELECT
        ad_group.id,
        ad_group.name,
        ad_group.status,
        ad_group.cpc_bid_micros,
        ad_group.campaign,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions
      FROM ad_group
      WHERE campaign.id = ${campaignId}
        AND ad_group.status != 'REMOVED'
    `);
  }

  async listKeywords(adGroupId?: string) {
    const whereClause = adGroupId
      ? `WHERE ad_group.id = ${adGroupId} AND ad_group_criterion.status != 'REMOVED'`
      : `WHERE ad_group_criterion.status != 'REMOVED'`;

    return this.search(`
      SELECT
        ad_group_criterion.criterion_id,
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        ad_group_criterion.status,
        ad_group_criterion.quality_info.quality_score,
        ad_group_criterion.effective_cpc_bid_micros,
        ad_group.id,
        ad_group.campaign,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions
      FROM keyword_view
      ${whereClause}
      ORDER BY metrics.cost_micros DESC
    `);
  }

  async createCampaign(params: {
    name: string;
    budgetAmountMicros: string;
    status?: string;
    advertisingChannelType?: string;
  }) {
    const tempBudgetId = "-1";
    return this.mutate([
      {
        campaignBudgetOperation: {
          create: {
            resourceName: `customers/${this.customerId}/campaignBudgets/${tempBudgetId}`,
            name: `${params.name} Budget`,
            amountMicros: params.budgetAmountMicros,
            deliveryMethod: "STANDARD",
          },
        },
      },
      {
        campaignOperation: {
          create: {
            name: params.name,
            status: params.status || "PAUSED",
            advertisingChannelType:
              params.advertisingChannelType || "SEARCH",
            campaignBudget: `customers/${this.customerId}/campaignBudgets/${tempBudgetId}`,
            manualCpc: {},
          },
        },
      },
    ]);
  }

  async updateCampaignStatus(
    campaignResourceName: string,
    status: "ENABLED" | "PAUSED" | "REMOVED"
  ) {
    return this.mutate([
      {
        campaignOperation: {
          updateMask: "status",
          update: {
            resourceName: campaignResourceName,
            status,
          },
        },
      },
    ]);
  }

  async addKeywords(
    adGroupResourceName: string,
    keywords: { text: string; matchType: string }[]
  ) {
    const operations = keywords.map((kw) => ({
      adGroupCriterionOperation: {
        create: {
          adGroup: adGroupResourceName,
          status: "ENABLED",
          keyword: {
            text: kw.text,
            matchType: kw.matchType,
          },
        },
      },
    }));

    return this.mutate(operations);
  }

  async addNegativeKeywords(
    campaignResourceName: string,
    keywords: { text: string; matchType: string }[]
  ) {
    const operations = keywords.map((kw) => ({
      campaignCriterionOperation: {
        create: {
          campaign: campaignResourceName,
          negative: true,
          keyword: {
            text: kw.text,
            matchType: kw.matchType,
          },
        },
      },
    }));

    return this.mutate(operations);
  }

  async removeKeyword(criterionResourceName: string) {
    return this.mutate([
      {
        adGroupCriterionOperation: {
          remove: criterionResourceName,
        },
      },
    ]);
  }

  async getPerformanceReport(startDate: string, endDate: string) {
    return this.search(`
      SELECT
        segments.date,
        campaign.id,
        campaign.name,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value
      FROM campaign
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
        AND campaign.status != 'REMOVED'
      ORDER BY segments.date ASC
    `);
  }

  async getAccessibleCustomers(): Promise<string[]> {
    const url = `${BASE_URL}/customers:listAccessibleCustomers`;
    const response = await fetch(url, {
      method: "GET",
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to list accessible customers");
    }

    const data = await response.json();
    return (data.resourceNames || []).map((rn: string) =>
      rn.replace("customers/", "")
    );
  }
}

export async function createGoogleAdsClient(connectionId: string) {
  const connection = await prisma.googleAdsConnection.findUnique({
    where: { id: connectionId },
  });

  if (!connection) throw new Error("Connection not found");

  return new GoogleAdsClient({
    customerId: connection.customerId,
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    accessToken: connection.accessToken || "",
    refreshToken: connection.refreshToken,
    connectionId: connection.id,
    managerAccountId: connection.managerAccountId || undefined,
  });
}
