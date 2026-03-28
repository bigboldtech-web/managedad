import { prisma } from "@/lib/prisma";
import { createGoogleAdsClient } from "@/lib/google-ads/client";

export async function syncGoogleAdsData(connectionId: string) {
  const client = await createGoogleAdsClient(connectionId);
  const connection = await prisma.googleAdsConnection.findUnique({
    where: { id: connectionId },
  });

  if (!connection) throw new Error("Connection not found");

  const statusMap: Record<string, string> = {
    ENABLED: "ACTIVE",
    PAUSED: "PAUSED",
    REMOVED: "REMOVED",
  };

  // Sync campaigns
  const campaignResults = await client.listCampaigns();

  for (const result of campaignResults) {
    const c = result.campaign;
    const m = result.metrics;
    const budget = result.campaignBudget;

    await prisma.campaign.upsert({
      where: { externalId: c.resourceName },
      update: {
        name: c.name,
        status: (statusMap[c.status] || "DRAFT") as any,
        dailyBudget: budget
          ? Number(budget.amountMicros) / 1_000_000
          : undefined,
        impressions: Number(m.impressions || 0),
        clicks: Number(m.clicks || 0),
        conversions: Number(m.conversions || 0),
        spend: Number(m.costMicros || 0) / 1_000_000,
        revenue: Number(m.conversionsValue || 0),
      },
      create: {
        userId: connection.userId,
        platform: "GOOGLE_ADS",
        googleAdsConnectionId: connectionId,
        externalId: c.resourceName,
        name: c.name,
        status: (statusMap[c.status] || "DRAFT") as any,
        dailyBudget: budget
          ? Number(budget.amountMicros) / 1_000_000
          : null,
        impressions: Number(m.impressions || 0),
        clicks: Number(m.clicks || 0),
        conversions: Number(m.conversions || 0),
        spend: Number(m.costMicros || 0) / 1_000_000,
      },
    });
  }

  // Sync ad groups for each campaign
  for (const result of campaignResults) {
    const campaignResourceName = result.campaign.resourceName;
    const campaign = await prisma.campaign.findFirst({
      where: { externalId: campaignResourceName },
    });
    if (!campaign) continue;

    try {
      const adGroupResults = await client.listAdGroups(result.campaign.id);
      for (const agResult of adGroupResults) {
        const ag = agResult.adGroup;
        const agMetrics = agResult.metrics;
        await prisma.adGroup.upsert({
          where: { externalId: ag.resourceName },
          update: {
            name: ag.name,
            status: (statusMap[ag.status] || "DRAFT") as any,
            bidAmount: ag.cpcBidMicros ? Number(ag.cpcBidMicros) / 1_000_000 : undefined,
            impressions: Number(agMetrics?.impressions || 0),
            clicks: Number(agMetrics?.clicks || 0),
            conversions: Number(agMetrics?.conversions || 0),
            spend: Number(agMetrics?.costMicros || 0) / 1_000_000,
          },
          create: {
            campaignId: campaign.id,
            externalId: ag.resourceName,
            name: ag.name,
            status: (statusMap[ag.status] || "DRAFT") as any,
            bidAmount: ag.cpcBidMicros ? Number(ag.cpcBidMicros) / 1_000_000 : null,
            impressions: Number(agMetrics?.impressions || 0),
            clicks: Number(agMetrics?.clicks || 0),
            conversions: Number(agMetrics?.conversions || 0),
            spend: Number(agMetrics?.costMicros || 0) / 1_000_000,
          },
        });
      }
    } catch (err) {
      console.error(`Ad group sync failed for campaign ${campaign.id}:`, err);
    }
  }

  // Sync keywords
  const matchTypeMap: Record<string, string> = {
    EXACT: "EXACT",
    PHRASE: "PHRASE",
    BROAD: "BROAD",
  };

  try {
    const keywordResults = await client.listKeywords();
    for (const kwResult of keywordResults) {
      const criterion = kwResult.adGroupCriterion;
      const kwMetrics = kwResult.metrics;

      // Find the campaign via the ad group's campaign resource name
      const campaignResourceName = kwResult.adGroup?.campaign;
      const campaign = campaignResourceName
        ? await prisma.campaign.findFirst({
            where: { externalId: campaignResourceName },
          })
        : null;
      if (!campaign) continue;

      // Find the ad group by matching on the ad_group.id in the externalId
      const adGroup = kwResult.adGroup?.id
        ? await prisma.adGroup.findFirst({
            where: {
              externalId: { endsWith: `/${kwResult.adGroup.id}` },
              campaignId: campaign.id,
            },
          })
        : null;

      // Use the criterion resource name as externalId
      const externalId = criterion.resourceName || `criterion_${criterion.criterionId}`;

      await prisma.keyword.upsert({
        where: { externalId },
        update: {
          text: criterion.keyword.text,
          matchType: (matchTypeMap[criterion.keyword.matchType] || "BROAD") as any,
          status: (statusMap[criterion.status] || "ACTIVE") as any,
          qualityScore: criterion.qualityInfo?.qualityScore
            ? Number(criterion.qualityInfo.qualityScore)
            : undefined,
          impressions: Number(kwMetrics?.impressions || 0),
          clicks: Number(kwMetrics?.clicks || 0),
          conversions: Number(kwMetrics?.conversions || 0),
          spend: Number(kwMetrics?.costMicros || 0) / 1_000_000,
          adGroupId: adGroup?.id || undefined,
        },
        create: {
          campaignId: campaign.id,
          adGroupId: adGroup?.id || null,
          externalId,
          text: criterion.keyword.text,
          matchType: (matchTypeMap[criterion.keyword.matchType] || "BROAD") as any,
          status: (statusMap[criterion.status] || "ACTIVE") as any,
          qualityScore: criterion.qualityInfo?.qualityScore
            ? Number(criterion.qualityInfo.qualityScore)
            : null,
          impressions: Number(kwMetrics?.impressions || 0),
          clicks: Number(kwMetrics?.clicks || 0),
          conversions: Number(kwMetrics?.conversions || 0),
          spend: Number(kwMetrics?.costMicros || 0) / 1_000_000,
        },
      });
    }
  } catch (err) {
    console.error("Keyword sync failed:", err);
  }

  // Sync daily metrics (last 7 days)
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const reportResults = await client.getPerformanceReport(startDate, endDate);

  for (const result of reportResults) {
    const campaignResourceName = result.campaign?.resourceName;
    if (!campaignResourceName) continue;

    const campaign = await prisma.campaign.findFirst({
      where: { externalId: campaignResourceName },
    });
    if (!campaign) continue;

    const date = new Date(result.segments.date);
    const impressions = Number(result.metrics.impressions || 0);
    const clicks = Number(result.metrics.clicks || 0);
    const spend = Number(result.metrics.costMicros || 0) / 1_000_000;
    const conversions = Number(result.metrics.conversions || 0);
    const revenue = Number(result.metrics.conversionsValue || 0);

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
        conversions,
        revenue,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpc: clicks > 0 ? spend / clicks : 0,
        cpa: conversions > 0 ? spend / conversions : 0,
        roas: spend > 0 ? revenue / spend : 0,
      },
      create: {
        campaignId: campaign.id,
        platform: "GOOGLE_ADS",
        date,
        impressions,
        clicks,
        spend,
        conversions,
        revenue,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpc: clicks > 0 ? spend / clicks : 0,
        cpa: conversions > 0 ? spend / conversions : 0,
        roas: spend > 0 ? revenue / spend : 0,
      },
    });
  }

  // Update last sync timestamp
  await prisma.googleAdsConnection.update({
    where: { id: connectionId },
    data: { lastSyncAt: new Date() },
  });
}
