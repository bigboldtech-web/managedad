import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGoogleAdsClient } from "@/lib/google-ads/client";
import type { GeneratedVariant } from "@/app/api/creatives/generate/route";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { adId, variant } = await req.json() as { adId: string; variant: GeneratedVariant };
  if (!adId || !variant) {
    return NextResponse.json({ error: "adId and variant required" }, { status: 400 });
  }

  // Load the source ad with its ad group and campaign
  const ad = await prisma.ad.findFirst({
    where: { id: adId, campaign: { userId: session.user.id } },
    include: {
      adGroup: { select: { id: true, externalId: true } },
      campaign: {
        select: {
          id: true,
          platform: true,
          googleAdsConnectionId: true,
          externalId: true,
        },
      },
    },
  });

  if (!ad) {
    return NextResponse.json({ error: "Ad not found" }, { status: 404 });
  }

  if (ad.campaign.platform !== "GOOGLE_ADS") {
    // Meta push — store as draft in DB only (Meta API requires Business Manager setup)
    const draft = await prisma.ad.create({
      data: {
        campaignId: ad.campaignId,
        adGroupId: ad.adGroupId,
        name: `${ad.name ?? "Ad"} — AI Draft`,
        type: ad.type,
        status: "DRAFT",
        headlines: variant.metaTitle ? [variant.metaTitle] : (ad.headlines ?? undefined),
        descriptions: variant.metaBody ? [variant.metaBody] : (ad.descriptions ?? undefined),
        finalUrl: ad.finalUrl,
        displayUrl: ad.displayUrl,
        callToAction: ad.callToAction,
      },
    });
    return NextResponse.json({ pushed: false, savedAsDraft: true, draftId: draft.id, message: "Saved as draft. Connect Meta Business Manager to push live." });
  }

  // Google Ads push
  if (!ad.campaign.googleAdsConnectionId || !ad.adGroup?.externalId) {
    return NextResponse.json({ error: "No Google Ads connection or ad group found" }, { status: 400 });
  }

  const googleCampaignId = ad.campaign.externalId;
  if (!googleCampaignId) {
    return NextResponse.json({ error: "Campaign not synced with Google Ads" }, { status: 400 });
  }

  const client = await createGoogleAdsClient(ad.campaign.googleAdsConnectionId);

  // Build ad group resource name from the connection's customerId
  const connection = await prisma.googleAdsConnection.findUnique({
    where: { id: ad.campaign.googleAdsConnectionId },
    select: { customerId: true },
  });
  if (!connection) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  const customerId = connection.customerId.replace(/-/g, "");
  const adGroupResourceName = `customers/${customerId}/adGroups/${ad.adGroup.externalId}`;

  try {
    const result = await client.mutate([
      {
        adGroupAdOperation: {
          create: {
            adGroup: adGroupResourceName,
            status: "PAUSED",
            ad: {
              responsiveSearchAd: {
                headlines: variant.headlines.slice(0, 15).map((text) => ({ text })),
                descriptions: variant.descriptions.slice(0, 4).map((text) => ({ text })),
              },
              finalUrls: ad.finalUrl ? [ad.finalUrl] : [],
            },
          },
        },
      },
    ]);

    // Extract the new ad's resource name
    const newAdResourceName: string = result?.mutateOperationResponses?.[0]?.adGroupAdResult?.resourceName ?? "";
    const externalAdId = newAdResourceName.split("/").pop() ?? null;

    // Store in DB
    const draft = await prisma.ad.create({
      data: {
        campaignId: ad.campaignId,
        adGroupId: ad.adGroupId,
        externalId: externalAdId,
        name: `${ad.name ?? "Ad"} — AI Draft`,
        type: "RESPONSIVE_SEARCH",
        status: "PAUSED",
        headlines: variant.headlines,
        descriptions: variant.descriptions,
        finalUrl: ad.finalUrl,
      },
    });

    return NextResponse.json({ pushed: true, draftId: draft.id, resourceName: newAdResourceName });
  } catch (err) {
    console.error("Push draft error:", err);
    return NextResponse.json({ error: `Failed to push to Google Ads: ${String(err)}` }, { status: 500 });
  }
}
