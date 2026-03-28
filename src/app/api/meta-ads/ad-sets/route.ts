import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const adGroups = await prisma.adGroup.findMany({
    where: {
      campaign: {
        userId,
        platform: "META_ADS",
      },
    },
    select: {
      id: true,
      name: true,
      status: true,
      bidAmount: true,
      bidStrategy: true,
      targeting: true,
      impressions: true,
      clicks: true,
      conversions: true,
      spend: true,
      campaign: {
        select: { id: true, name: true },
      },
    },
    orderBy: { spend: "desc" },
  });

  return NextResponse.json(
    adGroups.map((ag) => ({
      id: ag.id,
      name: ag.name,
      status: ag.status,
      bidAmount: ag.bidAmount ? Number(ag.bidAmount) : null,
      bidStrategy: ag.bidStrategy,
      targeting: ag.targeting,
      impressions: Number(ag.impressions),
      clicks: Number(ag.clicks),
      conversions: ag.conversions,
      spend: Number(ag.spend),
      campaign: { id: ag.campaign.id, name: ag.campaign.name },
    }))
  );
}
