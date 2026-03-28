import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleAdsClient } from "@/lib/google-ads/client";
import { MetaAdsClient } from "@/lib/meta-ads/client";
import { checkCampaignLimit } from "@/lib/plan-limits";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const body = await req.json();

  const {
    platform,          // "GOOGLE_ADS" | "META_ADS"
    name,
    objective,         // "SEARCH" | "PERFORMANCE_MAX" | "AWARENESS" | "TRAFFIC" | "CONVERSIONS" | "LEADS"
    dailyBudget,       // number in INR (rupees)
    targetLocations,   // string[] of location names
    keywords,          // string[] (Google only)
    headline,          // string (Meta only — ad copy)
    description,       // string
    finalUrl,
    startDate,
    endDate,
  } = body;

  if (!platform || !name || !dailyBudget) {
    return NextResponse.json({ error: "platform, name, dailyBudget required" }, { status: 400 });
  }

  // Plan limit check — campaign limit
  const { allowed, current, limit } = await checkCampaignLimit(userId);
  if (!allowed) {
    return NextResponse.json(
      { error: `Campaign limit reached (${current}/${limit}). Upgrade your plan to create more campaigns.` },
      { status: 403 }
    );
  }

  try {
    if (platform === "GOOGLE_ADS") {
      const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
      const conn = await prisma.googleAdsConnection.findFirst({
        where: { userId, isActive: true },
      });

      if (!conn || !conn.accessToken || !devToken) {
        // Create DB record only (no live connection)
        const campaign = await prisma.campaign.create({
          data: {
            userId,
            platform: "GOOGLE_ADS",
            name,
            objective,
            status: "DRAFT",
            dailyBudget,
            currency: "INR",
            targetLocations: targetLocations ? targetLocations.map((l: string) => ({ name: l })) : undefined,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
          },
        });
        return NextResponse.json({ campaign, live: false });
      }

      const client = new GoogleAdsClient({
        customerId: conn.customerId,
        developerToken: devToken,
        accessToken: conn.accessToken,
        refreshToken: conn.refreshToken,
        connectionId: conn.id,
        managerAccountId: conn.managerAccountId || undefined,
      });

      // dailyBudget is INR — convert to micros (1 INR = 1,000,000 micros)
      const budgetMicros = String(Math.round(dailyBudget * 1_000_000));
      const channelType = (objective === "SEARCH" || !objective) ? "SEARCH"
        : objective === "PERFORMANCE_MAX" ? "PERFORMANCE_MAX"
        : "DISPLAY";

      const result = await client.createCampaign({
        name,
        budgetAmountMicros: budgetMicros,
        status: "PAUSED",
        advertisingChannelType: channelType,
      });

      // Extract campaign resource name from mutate result
      const campaignResult = result.mutateOperationResponses?.find(
        (r: Record<string, unknown>) => r.campaignResult
      );
      const resourceName = campaignResult?.campaignResult?.resourceName as string | undefined;
      const externalId = resourceName ? resourceName.split("/").pop() : undefined;

      // Create ad group if keywords provided
      let adGroupResourceName: string | undefined;
      if (keywords?.length > 0 && resourceName) {
        const adGroupResult = await client.mutate([
          {
            adGroupOperation: {
              create: {
                campaign: resourceName,
                name: `${name} — Ad Group 1`,
                status: "ENABLED",
                type: "SEARCH_STANDARD",
              },
            },
          },
        ]);
        const agResult = adGroupResult.mutateOperationResponses?.[0]?.adGroupResult;
        adGroupResourceName = agResult?.resourceName;

        if (adGroupResourceName) {
          await client.addKeywords(
            adGroupResourceName,
            keywords.slice(0, 20).map((kw: string) => ({ text: kw, matchType: "BROAD" }))
          );
        }
      }

      const campaign = await prisma.campaign.create({
        data: {
          userId,
          platform: "GOOGLE_ADS",
          googleAdsConnectionId: conn.id,
          name,
          objective,
          status: "PAUSED",
          dailyBudget,
          currency: "INR",
          externalId: externalId || undefined,
          targetLocations: targetLocations ? targetLocations.map((l: string) => ({ name: l })) : undefined,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
        },
      });

      return NextResponse.json({ campaign, live: true, resourceName });
    }

    if (platform === "META_ADS") {
      const conn = await prisma.metaAdsConnection.findFirst({
        where: { userId, isActive: true },
      });

      if (!conn) {
        const campaign = await prisma.campaign.create({
          data: {
            userId,
            platform: "META_ADS",
            name,
            objective,
            status: "DRAFT",
            dailyBudget,
            currency: "INR",
            targetLocations: targetLocations ? targetLocations.map((l: string) => ({ name: l })) : undefined,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
          },
        });
        return NextResponse.json({ campaign, live: false });
      }

      const client = new MetaAdsClient({ accessToken: conn.accessToken, connectionId: conn.id });

      // Map objective to Meta objective
      const metaObjectiveMap: Record<string, string> = {
        AWARENESS: "BRAND_AWARENESS",
        TRAFFIC: "LINK_CLICKS",
        CONVERSIONS: "CONVERSIONS",
        LEADS: "LEAD_GENERATION",
        VIDEO_VIEWS: "VIDEO_VIEWS",
      };
      const metaObjective = metaObjectiveMap[objective] || "LINK_CLICKS";

      // dailyBudget in INR → paise (Meta uses smallest currency unit)
      const budgetPaise = Math.round(dailyBudget * 100);

      const metaCampaign = await client.createCampaign(conn.adAccountId, {
        name,
        objective: metaObjective as Parameters<typeof client.createCampaign>[1]["objective"],
        status: "PAUSED",
        special_ad_categories: [],
      });

      const externalId = metaCampaign.id;

      const campaign = await prisma.campaign.create({
        data: {
          userId,
          platform: "META_ADS",
          metaAdsConnectionId: conn.id,
          name,
          objective,
          status: "PAUSED",
          dailyBudget,
          currency: "INR",
          externalId: externalId || undefined,
          targetLocations: targetLocations ? targetLocations.map((l: string) => ({ name: l })) : undefined,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
        },
      });

      return NextResponse.json({ campaign, live: true, metaCampaignId: externalId });
    }

    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  } catch (error) {
    console.error("Campaign creation failed:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
