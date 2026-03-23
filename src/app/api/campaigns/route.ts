import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { serializeBigInt } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  // Single campaign detail
  if (id) {
    try {
      const campaign = await prisma.campaign.findFirst({
        where: { id, userId: session.user.id },
        include: {
          ads: {
            select: {
              id: true,
              name: true,
              type: true,
              status: true,
              impressions: true,
              clicks: true,
              conversions: true,
              spend: true,
            },
          },
          keywords: {
            select: {
              id: true,
              text: true,
              matchType: true,
              status: true,
              qualityScore: true,
              impressions: true,
              clicks: true,
              conversions: true,
              spend: true,
            },
          },
          dailyMetrics: {
            select: {
              date: true,
              impressions: true,
              clicks: true,
              spend: true,
              conversions: true,
            },
            orderBy: { date: "asc" },
            take: 30,
          },
        },
      });

      if (!campaign) {
        return NextResponse.json(
          { error: "Campaign not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(serializeBigInt(campaign));
    } catch (error) {
      console.error("Error fetching campaign:", error);
      return NextResponse.json(
        { error: "Failed to fetch campaign" },
        { status: 500 }
      );
    }
  }

  // List all campaigns
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        platform: true,
        status: true,
        dailyBudget: true,
        impressions: true,
        clicks: true,
        conversions: true,
        spend: true,
        revenue: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(serializeBigInt(campaigns));
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

const createCampaignSchema = z.object({
  platform: z.enum(["GOOGLE_ADS", "META_ADS"]),
  name: z.string().min(1),
  objective: z.string(),
  dailyBudget: z.number().positive(),
  targetLocations: z.array(z.string()).optional(),
  targetAudiences: z.array(z.string()).optional(),
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

    const { platform, name, objective, dailyBudget, targetLocations, targetAudiences } =
      parsed.data;

    // Find a connection for the platform
    let connectionData: Record<string, string> = {};
    if (platform === "GOOGLE_ADS") {
      const connection = await prisma.googleAdsConnection.findFirst({
        where: { userId: session.user.id, isActive: true },
      });
      if (connection) {
        connectionData = { googleAdsConnectionId: connection.id };
      }
    } else {
      const connection = await prisma.metaAdsConnection.findFirst({
        where: { userId: session.user.id, isActive: true },
      });
      if (connection) {
        connectionData = { metaAdsConnectionId: connection.id };
      }
    }

    const campaign = await prisma.campaign.create({
      data: {
        userId: session.user.id,
        platform,
        name,
        objective,
        dailyBudget,
        targetLocations: targetLocations || [],
        targetAudiences: targetAudiences || [],
        status: "DRAFT",
        ...connectionData,
      },
    });

    return NextResponse.json(serializeBigInt(campaign), { status: 201 });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Campaign ID required" }, { status: 400 });
  }

  try {
    const body = await req.json();

    const campaign = await prisma.campaign.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.name && { name: body.name }),
        ...(body.dailyBudget && { dailyBudget: body.dailyBudget }),
      },
    });

    return NextResponse.json(serializeBigInt(updated));
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}
