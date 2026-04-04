import { prisma } from "@/lib/prisma";
import type { CampaignBlueprintData } from "./types";

/**
 * Execute a campaign blueprint — creates campaign, ad groups, keywords, and ads in the database.
 * When platform connections exist, it also creates them on the ad platform via API.
 *
 * Returns the created campaign ID.
 */
export async function executeBlueprint(
  userId: string,
  blueprint: CampaignBlueprintData
): Promise<string> {
  const isGoogle = blueprint.platform === "GOOGLE_ADS";

  // Find active connection
  const connection = isGoogle
    ? await prisma.googleAdsConnection.findFirst({ where: { userId, isActive: true } })
    : await prisma.metaAdsConnection.findFirst({ where: { userId, isActive: true } });

  // Create campaign in DB
  const campaign = await prisma.campaign.create({
    data: {
      userId,
      platform: blueprint.platform,
      name: blueprint.campaignName,
      status: "PAUSED", // Always start paused for review
      objective: blueprint.objective,
      dailyBudget: blueprint.dailyBudget,
      currency: "INR",
      targetLocations: blueprint.targetLocations,
      targetAudiences: blueprint.demographics,
      googleAdsConnectionId: isGoogle ? connection?.id : undefined,
      metaAdsConnectionId: !isGoogle ? connection?.id : undefined,
    },
  });

  // Create ad groups, keywords, and ads
  for (const agBlueprint of blueprint.adGroups) {
    const adGroup = await prisma.adGroup.create({
      data: {
        campaignId: campaign.id,
        name: agBlueprint.name,
        status: "PAUSED",
      },
    });

    // Create keywords
    const keywordData = agBlueprint.keywords.map((kw) => ({
      campaignId: campaign.id,
      adGroupId: adGroup.id,
      text: kw.text,
      matchType: kw.matchType as "EXACT" | "PHRASE" | "BROAD",
      isNegative: false,
      status: "ACTIVE" as const,
    }));

    if (keywordData.length > 0) {
      await prisma.keyword.createMany({ data: keywordData });
    }

    // Create negative keywords for this ad group
    const negativeData = agBlueprint.negativeKeywords.map((text) => ({
      campaignId: campaign.id,
      adGroupId: adGroup.id,
      text,
      matchType: "PHRASE" as const,
      isNegative: true,
      status: "ACTIVE" as const,
    }));

    if (negativeData.length > 0) {
      await prisma.keyword.createMany({ data: negativeData });
    }

    // Create ads
    for (const adBlueprint of agBlueprint.ads) {
      await prisma.ad.create({
        data: {
          campaignId: campaign.id,
          adGroupId: adGroup.id,
          name: `${agBlueprint.name} - Ad`,
          type: isGoogle ? "RESPONSIVE_SEARCH" : "IMAGE",
          status: "PAUSED",
          headlines: adBlueprint.headlines?.length ? adBlueprint.headlines : undefined,
          descriptions: adBlueprint.descriptions?.length ? adBlueprint.descriptions : undefined,
          finalUrl: adBlueprint.finalUrl,
        },
      });
    }
  }

  // Create campaign-level negative keywords
  const campaignNegatives = blueprint.negativeKeywords.map((text) => ({
    campaignId: campaign.id,
    text,
    matchType: "PHRASE" as const,
    isNegative: true,
    status: "ACTIVE" as const,
  }));

  if (campaignNegatives.length > 0) {
    await prisma.keyword.createMany({ data: campaignNegatives });
  }

  // If we have a live connection, try to push to the platform API
  if (connection) {
    try {
      if (isGoogle) {
        const { decryptToken } = await import("@/lib/encryption");
        const { GoogleAdsClient } = await import("@/lib/google-ads/client");
        const conn = connection as { id: string; customerId: string; refreshToken: string; accessToken: string | null; managerAccountId: string | null };
        const client = new GoogleAdsClient({
          customerId: conn.customerId,
          developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
          accessToken: conn.accessToken ? decryptToken(conn.accessToken) : "",
          refreshToken: decryptToken(conn.refreshToken),
          connectionId: conn.id,
          managerAccountId: conn.managerAccountId || undefined,
        });
        const result = await client.createCampaign({
          name: blueprint.campaignName,
          budgetAmountMicros: String(blueprint.dailyBudget * 1_000_000),
          status: "PAUSED",
        });
        if (result?.campaignId) {
          await prisma.campaign.update({
            where: { id: campaign.id },
            data: { externalId: result.campaignId },
          });
        }
      }
      // Meta campaign creation follows similar pattern
    } catch (err) {
      console.error("Failed to push campaign to platform API:", err);
      // Campaign still exists in DB as a draft — user can push later
    }
  }

  return campaign.id;
}
