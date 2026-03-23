import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const campaignId = req.nextUrl.searchParams.get("campaignId");
  const matchType = req.nextUrl.searchParams.get("matchType");

  const where: any = { campaign: { userId: session.user.id, platform: "GOOGLE_ADS" } };
  if (campaignId) where.campaignId = campaignId;
  if (matchType) where.matchType = matchType;

  try {
    const keywords = await prisma.keyword.findMany({
      where,
      include: {
        campaign: { select: { name: true } },
        adGroup: { select: { name: true } },
      },
      orderBy: { spend: "desc" },
    });

    return NextResponse.json(keywords);
  } catch (error) {
    console.error("Error fetching keywords:", error);
    return NextResponse.json(
      { error: "Failed to fetch keywords" },
      { status: 500 }
    );
  }
}

const addKeywordsSchema = z.object({
  campaignId: z.string(),
  adGroupId: z.string().optional(),
  keywords: z.array(
    z.object({
      text: z.string().min(1),
      matchType: z.enum(["EXACT", "PHRASE", "BROAD"]),
      isNegative: z.boolean().optional(),
      maxCpcBid: z.number().optional(),
    })
  ),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = addKeywordsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { campaignId, adGroupId, keywords } = parsed.data;

    // Verify campaign ownership
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, userId: session.user.id },
    });
    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    const created = await prisma.keyword.createMany({
      data: keywords.map((kw) => ({
        campaignId,
        adGroupId,
        text: kw.text,
        matchType: kw.matchType,
        isNegative: kw.isNegative || false,
        maxCpcBid: kw.maxCpcBid,
        status: "ACTIVE",
      })),
    });

    return NextResponse.json(
      { count: created.count },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding keywords:", error);
    return NextResponse.json(
      { error: "Failed to add keywords" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keywordId = req.nextUrl.searchParams.get("id");
  if (!keywordId) {
    return NextResponse.json({ error: "Missing keyword ID" }, { status: 400 });
  }

  try {
    const keyword = await prisma.keyword.findFirst({
      where: { id: keywordId, campaign: { userId: session.user.id } },
    });
    if (!keyword) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.keyword.update({
      where: { id: keywordId },
      data: { status: "REMOVED" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing keyword:", error);
    return NextResponse.json(
      { error: "Failed to remove keyword" },
      { status: 500 }
    );
  }
}
