import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createMetaAdsClient } from "@/lib/meta-ads/client";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const campaigns = await prisma.campaign.findMany({
      where: {
        userId: session.user.id,
        platform: "META_ADS",
      },
      include: {
        adGroups: { select: { id: true, name: true, status: true } },
        _count: { select: { ads: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Error fetching Meta campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

const createCampaignSchema = z.object({
  connectionId: z.string(),
  name: z.string().min(1),
  objective: z.enum([
    "OUTCOME_AWARENESS",
    "OUTCOME_ENGAGEMENT",
    "OUTCOME_LEADS",
    "OUTCOME_SALES",
    "OUTCOME_TRAFFIC",
    "OUTCOME_APP_PROMOTION",
  ]),
  dailyBudget: z.number().positive(),
  specialAdCategories: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createCampaignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const {
      connectionId,
      name,
      objective,
      dailyBudget,
      specialAdCategories,
    } = parsed.data;

    // Get the connection to find the ad account ID
    const connection = await prisma.metaAdsConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection || connection.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    // Create via Meta Ads API
    const client = await createMetaAdsClient(connectionId);

    // Meta API expects budget in cents
    const budgetCents = Math.round(dailyBudget * 100).toString();

    const result = await client.createCampaign(connection.adAccountId, {
      name,
      objective,
      daily_budget: budgetCents,
      special_ad_categories: specialAdCategories,
    });

    // Store locally
    const campaign = await prisma.campaign.create({
      data: {
        userId: session.user.id,
        platform: "META_ADS",
        metaAdsConnectionId: connectionId,
        name,
        objective,
        dailyBudget,
        status: "PAUSED",
        externalId: result.id,
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error("Error creating Meta campaign:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
