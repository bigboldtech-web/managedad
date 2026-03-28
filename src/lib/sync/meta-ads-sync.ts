import { prisma } from "@/lib/prisma";
import { createMetaAdsClient } from "@/lib/meta-ads/client";
import type { MetaApiResponse } from "@/lib/meta-ads/types";

const RATE_LIMIT_DELAY_MS = 500;
const DEFAULT_SYNC_DAYS = 30;
const BACKFILL_DAYS = 90;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function syncMetaAdsData(
  connectionId: string,
  options?: { backfill?: boolean }
) {
  const client = await createMetaAdsClient(connectionId);
  const connection = await prisma.metaAdsConnection.findUnique({
    where: { id: connectionId },
  });

  if (!connection) throw new Error("Connection not found");

  const adAccountId = connection.adAccountId;

  // Get ad account currency
  let accountCurrency = "USD";
  try {
    const accountInfo = await client.request<{ currency: string }>(
      `/act_${adAccountId}?fields=currency`
    );
    accountCurrency = accountInfo.currency || "USD";
  } catch (error) {
    console.error("Failed to fetch account currency:", error);
  }

  // Sync campaigns
  const campaignResponse = await client.listCampaigns(adAccountId);

  const statusMap: Record<string, string> = {
    ACTIVE: "ACTIVE",
    PAUSED: "PAUSED",
    DELETED: "REMOVED",
    ARCHIVED: "ENDED",
  };

  for (const campaign of campaignResponse.data) {
    await prisma.campaign.upsert({
      where: { externalId: campaign.id },
      update: {
        name: campaign.name,
        status: (statusMap[campaign.status] || "DRAFT") as any,
        objective: campaign.objective,
        currency: accountCurrency,
        dailyBudget: campaign.daily_budget
          ? Number(campaign.daily_budget) / 100
          : undefined,
        totalBudget: campaign.lifetime_budget
          ? Number(campaign.lifetime_budget) / 100
          : undefined,
        startDate: campaign.start_time
          ? new Date(campaign.start_time)
          : undefined,
        endDate: campaign.stop_time
          ? new Date(campaign.stop_time)
          : undefined,
      },
      create: {
        userId: connection.userId,
        platform: "META_ADS",
        metaAdsConnectionId: connectionId,
        externalId: campaign.id,
        name: campaign.name,
        status: (statusMap[campaign.status] || "DRAFT") as any,
        objective: campaign.objective,
        currency: accountCurrency,
        dailyBudget: campaign.daily_budget
          ? Number(campaign.daily_budget) / 100
          : null,
        totalBudget: campaign.lifetime_budget
          ? Number(campaign.lifetime_budget) / 100
          : null,
        startDate: campaign.start_time
          ? new Date(campaign.start_time)
          : null,
        endDate: campaign.stop_time
          ? new Date(campaign.stop_time)
          : null,
      },
    });

    await delay(RATE_LIMIT_DELAY_MS);
  }

  // Sync ad sets
  const adSetResponse = await client.listAdSets(adAccountId);

  for (const adSet of adSetResponse.data) {
    const parentCampaign = await prisma.campaign.findFirst({
      where: { externalId: adSet.campaign_id },
    });
    if (!parentCampaign) continue;

    await prisma.adGroup.upsert({
      where: { externalId: adSet.id },
      update: {
        name: adSet.name,
        status: (statusMap[adSet.status] || "DRAFT") as any,
        bidAmount: adSet.bid_amount
          ? Number(adSet.bid_amount) / 100
          : undefined,
        bidStrategy: adSet.bid_strategy || adSet.optimization_goal,
        targeting: adSet.targeting as any,
      },
      create: {
        campaignId: parentCampaign.id,
        externalId: adSet.id,
        name: adSet.name,
        status: (statusMap[adSet.status] || "DRAFT") as any,
        bidAmount: adSet.bid_amount
          ? Number(adSet.bid_amount) / 100
          : null,
        bidStrategy: adSet.bid_strategy || adSet.optimization_goal,
        targeting: adSet.targeting as any,
      },
    });

    await delay(RATE_LIMIT_DELAY_MS);
  }

  // Sync ads
  type MetaAdResponse = {
    id: string;
    name: string;
    status: string;
    adset_id: string;
    effective_status: string;
    creative?: { id: string };
  };

  try {
    const adsResponse = await client.request<MetaApiResponse<MetaAdResponse>>(
      `/act_${adAccountId}/ads?fields=id,name,status,adset_id,creative,effective_status&limit=100`
    );

    for (const ad of adsResponse.data) {
      // Find parent ad set to get the campaign
      const parentAdGroup = await prisma.adGroup.findFirst({
        where: { externalId: ad.adset_id },
      });
      if (!parentAdGroup) continue;

      await prisma.ad.upsert({
        where: { externalId: ad.id },
        update: {
          name: ad.name,
          status: (statusMap[ad.status] || "DRAFT") as any,
          adGroupId: parentAdGroup.id,
        },
        create: {
          campaignId: parentAdGroup.campaignId,
          adGroupId: parentAdGroup.id,
          externalId: ad.id,
          name: ad.name,
          type: "IMAGE" as any,
          status: (statusMap[ad.status] || "DRAFT") as any,
        },
      });

      await delay(RATE_LIMIT_DELAY_MS);
    }
  } catch (err) {
    console.error("Meta ads sync failed:", err);
  }

  // Determine sync window
  const syncDays = options?.backfill ? BACKFILL_DAYS : DEFAULT_SYNC_DAYS;

  // Sync insights for each campaign
  const campaigns = await prisma.campaign.findMany({
    where: {
      metaAdsConnectionId: connectionId,
      externalId: { not: null },
    },
  });

  for (const campaign of campaigns) {
    if (!campaign.externalId) continue;

    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - syncDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    try {
      const insightsResponse = await client.getInsights(
        campaign.externalId,
        { since: startDate, until: endDate }
      );

      // Log action types for debugging
      if (insightsResponse.data.length > 0 && insightsResponse.data[0].actions) {
        console.log(
          `Campaign ${campaign.externalId} action types:`,
          insightsResponse.data[0].actions.map((a) => `${a.action_type}=${a.value}`)
        );
      }

      let totalImpressions = 0;
      let totalClicks = 0;
      let totalReach = 0;
      let totalSpend = 0;
      let totalConversions = 0;
      let totalRevenue = 0;

      for (const insight of insightsResponse.data) {
        const date = new Date(insight.date_start);
        const impressions = Number(insight.impressions || 0);
        const clicks = Number(insight.clicks || 0);
        const reach = Number(insight.reach || 0);
        const spend = Number(insight.spend || 0);

        // Count results from all relevant action types
        const resultActionTypes = [
          "lead",
          "leadgen_grouped",
          "onsite_conversion.lead_grouped",
          "onsite_conversion.messaging_first_reply",
          "offsite_conversion",
          "offsite_conversion.fb_pixel_purchase",
          "offsite_conversion.fb_pixel_lead",
          "offsite_conversion.fb_pixel_complete_registration",
          "offsite_conversion.custom",
          "app_install",
          "landing_page_view",
          "link_click",
          "omni_purchase",
          "purchase",
        ];

        let conversionCount = 0;
        if (insight.actions) {
          for (const action of insight.actions) {
            if (resultActionTypes.includes(action.action_type)) {
              conversionCount += Number(action.value);
              break; // Take the first matching result type (most relevant)
            }
          }
          // If no specific match, try the generic "results" metric
          if (conversionCount === 0) {
            const genericResult = insight.actions.find(
              (a) => a.action_type === "page_engagement" ||
                     a.action_type === "post_engagement" ||
                     a.action_type === "video_view"
            );
            if (genericResult) conversionCount = Number(genericResult.value);
          }
        }

        const purchaseAction = insight.actions?.find(
          (a) => a.action_type === "offsite_conversion.fb_pixel_purchase" ||
                 a.action_type === "omni_purchase" ||
                 a.action_type === "purchase"
        );
        const revenue = purchaseAction ? Number(purchaseAction.value) : 0;

        totalImpressions += impressions;
        totalClicks += clicks;
        totalReach += reach;
        totalSpend += spend;
        totalConversions += conversionCount;
        totalRevenue += revenue;

        await prisma.dailyMetric.upsert({
          where: {
            campaignId_date: {
              campaignId: campaign.id,
              date,
            },
          },
          update: {
            impressions,
            clicks,
            reach,
            spend,
            conversions: conversionCount,
            revenue,
            ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
            cpc: clicks > 0 ? spend / clicks : 0,
            cpa: conversionCount > 0 ? spend / conversionCount : 0,
            roas: spend > 0 ? revenue / spend : 0,
          },
          create: {
            campaignId: campaign.id,
            platform: "META_ADS",
            date,
            impressions,
            clicks,
            reach,
            spend,
            conversions: conversionCount,
            revenue,
            ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
            cpc: clicks > 0 ? spend / clicks : 0,
            cpa: conversionCount > 0 ? spend / conversionCount : 0,
            roas: spend > 0 ? revenue / spend : 0,
          },
        });
      }

      // Update campaign aggregate metrics
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          impressions: totalImpressions,
          clicks: totalClicks,
          reach: totalReach,
          spend: totalSpend,
          conversions: totalConversions,
          revenue: totalRevenue,
        },
      });
    } catch (error) {
      console.error(
        `Failed to sync insights for campaign ${campaign.externalId}:`,
        error
      );
    }

    await delay(RATE_LIMIT_DELAY_MS);
  }

  // Update last sync timestamp
  await prisma.metaAdsConnection.update({
    where: { id: connectionId },
    data: { lastSyncAt: new Date() },
  });
}
