import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json();
  const { actionId } = body as { actionId?: string };

  if (!actionId) {
    return NextResponse.json({ error: "actionId is required" }, { status: 400 });
  }

  // Find the action and verify ownership
  const action = await prisma.optimizationAction.findUnique({
    where: { id: actionId },
    include: {
      optimizationRun: { select: { userId: true } },
      campaign: { select: { id: true, externalId: true, googleAdsConnectionId: true, metaAdsConnectionId: true } },
      ad: { select: { id: true } },
      keyword: { select: { id: true } },
    },
  });

  if (!action) {
    return NextResponse.json({ error: "Action not found" }, { status: 404 });
  }

  if (action.optimizationRun.userId !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (action.status !== "APPLIED") {
    return NextResponse.json(
      { error: "Only APPLIED actions can be rolled back" },
      { status: 400 }
    );
  }

  try {
    const previousValue = action.previousValue as Record<string, unknown> | null;
    const newValue = action.newValue as Record<string, unknown> | null;

    switch (action.actionType) {
      case "INCREASE_BUDGET":
      case "DECREASE_BUDGET": {
        if (!action.campaignId || !previousValue?.dailyBudget) {
          return NextResponse.json({ error: "Missing campaign or previous budget data" }, { status: 400 });
        }
        await prisma.campaign.update({
          where: { id: action.campaignId },
          data: { dailyBudget: previousValue.dailyBudget as number },
        });
        break;
      }

      case "PAUSE_AD": {
        if (!action.adId) {
          return NextResponse.json({ error: "Missing ad reference" }, { status: 400 });
        }
        await prisma.ad.update({
          where: { id: action.adId },
          data: { status: "ACTIVE" },
        });
        break;
      }

      case "ENABLE_AD": {
        if (!action.adId) {
          return NextResponse.json({ error: "Missing ad reference" }, { status: 400 });
        }
        await prisma.ad.update({
          where: { id: action.adId },
          data: { status: "PAUSED" },
        });
        break;
      }

      case "PAUSE_KEYWORD": {
        if (!action.keywordId) {
          return NextResponse.json({ error: "Missing keyword reference" }, { status: 400 });
        }
        await prisma.keyword.update({
          where: { id: action.keywordId },
          data: { status: "ACTIVE" },
        });
        break;
      }

      case "ADD_NEGATIVE_KEYWORD": {
        if (!action.campaignId || !newValue?.text) {
          return NextResponse.json({ error: "Missing campaign or keyword text" }, { status: 400 });
        }
        const negativeKeyword = await prisma.keyword.findFirst({
          where: {
            campaignId: action.campaignId,
            text: newValue.text as string,
            isNegative: true,
          },
        });
        if (negativeKeyword) {
          await prisma.keyword.delete({ where: { id: negativeKeyword.id } });
        }
        break;
      }

      case "ADJUST_BID": {
        if (!action.keywordId || !previousValue?.maxCpcBid) {
          return NextResponse.json({ error: "Missing keyword or previous bid data" }, { status: 400 });
        }
        await prisma.keyword.update({
          where: { id: action.keywordId },
          data: { maxCpcBid: previousValue.maxCpcBid as number },
        });
        break;
      }

      default:
        return NextResponse.json(
          { error: `Rollback not supported for action type: ${action.actionType}` },
          { status: 400 }
        );
    }

    // Mark the action as rolled back
    await prisma.optimizationAction.update({
      where: { id: actionId },
      data: { status: "ROLLED_BACK" },
    });

    return NextResponse.json({ success: true, actionId });
  } catch (err) {
    console.error("Rollback error:", err);
    return NextResponse.json({ error: "Rollback failed" }, { status: 500 });
  }
}
