import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGoogleAdsClient } from "@/lib/google-ads/client";

interface NegativeToApply {
  text: string;
  matchType: "EXACT" | "PHRASE";
  campaignResourceName: string;
  campaignId: string; // internal Google campaign ID (numeric string)
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { negatives }: { negatives: NegativeToApply[] } = await req.json();

  if (!Array.isArray(negatives) || negatives.length === 0) {
    return NextResponse.json({ error: "negatives array required" }, { status: 400 });
  }

  // Group by campaign resource name so we can batch per campaign
  const byCampaign = new Map<string, NegativeToApply[]>();
  for (const neg of negatives) {
    if (!byCampaign.has(neg.campaignResourceName)) {
      byCampaign.set(neg.campaignResourceName, []);
    }
    byCampaign.get(neg.campaignResourceName)!.push(neg);
  }

  const connections = await prisma.googleAdsConnection.findMany({
    where: { userId: session.user.id, isActive: true },
  });

  let applied = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const conn of connections) {
    // Find campaigns belonging to this connection that have negatives to apply
    const dbCampaigns = await prisma.campaign.findMany({
      where: {
        userId: session.user.id,
        googleAdsConnectionId: conn.id,
        externalId: { in: negatives.map((n) => n.campaignId) },
      },
      select: { id: true, externalId: true },
    });

    const externalToInternal = new Map(dbCampaigns.map((c) => [c.externalId, c.id]));

    const client = await createGoogleAdsClient(conn.id);

    for (const [campaignResourceName, items] of byCampaign.entries()) {
      // Check if this campaign belongs to this connection
      const campaignExternalId = items[0].campaignId;
      const internalCampaignId = externalToInternal.get(campaignExternalId);
      if (!internalCampaignId) continue; // belongs to a different connection

      try {
        await client.addNegativeKeywords(
          campaignResourceName,
          items.map((n) => ({ text: n.text, matchType: n.matchType }))
        );

        // Store in DB
        await prisma.keyword.createMany({
          data: items.map((n) => ({
            campaignId: internalCampaignId,
            text: n.text,
            matchType: n.matchType,
            isNegative: true,
            status: "ACTIVE",
          })),
          skipDuplicates: true,
        });

        applied += items.length;
      } catch (err) {
        failed += items.length;
        errors.push(`Campaign ${campaignResourceName}: ${String(err)}`);
        console.error("apply-negatives error:", err);
      }
    }
  }

  return NextResponse.json({ applied, failed, errors: errors.slice(0, 5) });
}
