import { prisma } from "@/lib/prisma";
import { createMetaAdsClient } from "@/lib/meta-ads/client";

const RATE_LIMIT_DELAY_MS = 500;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function syncMetaAdsData(connectionId: string) {
  const client = await createMetaAdsClient(connectionId);
  const connection = await prisma.metaAdsConnection.findUnique({
    where: { id: connectionId },
  });

  if (!connection) throw new Error("Connection not found");

  const adAccountId = connection.adAccountId;

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
  const campaigns = await prisma.campaign.findMany({
    where: {
      metaAdsConnectionId: connectionId,
      externalId: { not: null },
    },
    include: { adGroups: true },
  });

  for (const campaign of campaigns) {
    if (!campaign.externalId) continue;

    // Get insights for each campaign (last 7 days)
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    try {
      const insightsResponse = await client.getInsights(
        campaign.externalId,
        { since: startDate, until: endDate }
      );

      for (const insight of insightsResponse.data) {
        const date = new Date(insight.date_start);
        const impressions = Number(insight.impressions || 0);
        const clicks = Number(insight.clicks || 0);
        const spend = Number(insight.spend || 0);

        const conversions =
          insight.actions?.find(
            (a) =>
              a.action_type === "offsite_conversion" ||
              a.action_type === "lead"
          );
        const conversionCount = conversions ? Number(conversions.value) : 0;

        const purchaseValue =
          insight.actions?.find(
            (a) => a.action_type === "offsite_conversion.fb_pixel_purchase"
          );
        const revenue = purchaseValue ? Number(purchaseValue.value) : 0;

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
      const totalInsights = await client.getInsights(
        campaign.externalId,
        { since: startDate, until: endDate }
      );

      if (totalInsights.data.length > 0) {
        let totalImpressions = 0;
        let totalClicks = 0;
        let totalSpend = 0;
        let totalConversions = 0;
        let totalRevenue = 0;

        for (const insight of totalInsights.data) {
          totalImpressions += Number(insight.impressions || 0);
          totalClicks += Number(insight.clicks || 0);
          totalSpend += Number(insight.spend || 0);

          const conv = insight.actions?.find(
            (a) =>
              a.action_type === "offsite_conversion" ||
              a.action_type === "lead"
          );
          totalConversions += conv ? Number(conv.value) : 0;

          const pv = insight.actions?.find(
            (a) =>
              a.action_type ===
              "offsite_conversion.fb_pixel_purchase"
          );
          totalRevenue += pv ? Number(pv.value) : 0;
        }

        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            impressions: totalImpressions,
            clicks: totalClicks,
            spend: totalSpend,
            conversions: totalConversions,
            revenue: totalRevenue,
          },
        });
      }
    } catch (error) {
      // Log but continue syncing other campaigns
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
