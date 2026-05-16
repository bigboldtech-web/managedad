import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordUserDecision } from "@/lib/optimization/helios/fingerprint";
import type { AdPlatform } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actions = await prisma.optimizationAction.findMany({
    where: {
      status: { in: ["PENDING", "APPROVED"] },
      optimizationRun: { userId: session.user.id },
    },
    include: {
      campaign: {
        select: { id: true, name: true, platform: true, dailyBudget: true },
      },
      ad: { select: { id: true, name: true } },
      keyword: { select: { id: true, text: true, matchType: true } },
    },
    orderBy: [{ riskTier: "asc" }, { createdAt: "desc" }],
    take: 500,
  });

  const grouped = {
    LOW: actions.filter((a) => a.riskTier === "LOW"),
    MED: actions.filter((a) => a.riskTier === "MED"),
    HIGH: actions.filter((a) => a.riskTier === "HIGH"),
  };

  return NextResponse.json({ grouped, total: actions.length });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { actionIds, decision } = body as {
    actionIds: string[];
    decision: "approve" | "reject";
  };

  if (!Array.isArray(actionIds) || actionIds.length === 0) {
    return NextResponse.json({ error: "actionIds required" }, { status: 400 });
  }
  if (decision !== "approve" && decision !== "reject") {
    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  }

  const actions = await prisma.optimizationAction.findMany({
    where: {
      id: { in: actionIds },
      optimizationRun: { userId: session.user.id },
      status: "PENDING",
    },
    include: {
      campaign: {
        select: {
          platform: true,
          googleAdsConnectionId: true,
          metaAdsConnectionId: true,
        },
      },
    },
  });

  const newStatus = decision === "approve" ? "APPROVED" : "REJECTED";
  await prisma.optimizationAction.updateMany({
    where: { id: { in: actions.map((a) => a.id) } },
    data: { status: newStatus },
  });

  for (const action of actions) {
    const campaign = action.campaign;
    if (!campaign) continue;
    const platform = campaign.platform as AdPlatform;
    const accountId =
      platform === "GOOGLE_ADS"
        ? campaign.googleAdsConnectionId
        : campaign.metaAdsConnectionId;
    if (!accountId) continue;

    await recordUserDecision({
      platform,
      accountId,
      riskTier: action.riskTier,
      approved: decision === "approve",
    });
  }

  return NextResponse.json({
    message: `${actions.length} action(s) ${decision}d`,
    count: actions.length,
  });
}
