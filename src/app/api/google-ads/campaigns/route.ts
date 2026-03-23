import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGoogleAdsClient } from "@/lib/google-ads/client";
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
        platform: "GOOGLE_ADS",
      },
      include: {
        adGroups: { select: { id: true, name: true, status: true } },
        _count: { select: { keywords: true, ads: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

const createCampaignSchema = z.object({
  connectionId: z.string(),
  name: z.string().min(1),
  dailyBudget: z.number().positive(),
  objective: z.string().optional(),
  targetLocations: z.array(z.string()).optional(),
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

    const { connectionId, name, dailyBudget, objective, targetLocations } =
      parsed.data;

    // Create via Google Ads API
    const client = await createGoogleAdsClient(connectionId);
    const budgetMicros = (dailyBudget * 1_000_000).toString();

    const result = await client.createCampaign({
      name,
      budgetAmountMicros: budgetMicros,
    });

    // Store locally
    const campaign = await prisma.campaign.create({
      data: {
        userId: session.user.id,
        platform: "GOOGLE_ADS",
        googleAdsConnectionId: connectionId,
        name,
        dailyBudget,
        objective: objective || "SEARCH",
        targetLocations: targetLocations || [],
        status: "PAUSED",
        externalId: result?.mutateOperationResponses?.[1]?.campaignResult?.resourceName,
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
