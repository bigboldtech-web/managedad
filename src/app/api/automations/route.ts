import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("type") || "ALL";

  const where: Record<string, unknown> = {
    optimizationRun: { userId },
  };
  if (filter !== "ALL") {
    const actionTypeMap: Record<string, string[]> = {
      NEGATIVE_KEYWORD: ["ADD_NEGATIVE_KEYWORD"],
      BUDGET_OPTIMIZATION: ["INCREASE_BUDGET", "DECREASE_BUDGET"],
      BID_ADJUSTMENT: ["ADJUST_BID"],
      CREATIVE_REFRESH: ["CREATE_AD_VARIATION", "SUGGEST_AB_TEST"],
      PAUSE_AD: ["PAUSE_AD", "ENABLE_AD"],
    };
    const types = actionTypeMap[filter];
    if (types) where.actionType = { in: types };
  }

  const [actions, runs] = await Promise.all([
    prisma.optimizationAction.findMany({
      where,
      include: {
        optimizationRun: { select: { triggerType: true, createdAt: true } },
        campaign: { select: { name: true, platform: true } },
        keyword: { select: { text: true } },
        ad: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.optimizationRun.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, status: true, createdAt: true, completedAt: true, summary: true },
    }),
  ]);

  const formatted = actions.map((a) => ({
    id: a.id,
    actionType: a.actionType,
    platform: a.campaign?.platform || "GOOGLE_ADS",
    description: a.description,
    status: a.status,
    previousValue: a.previousValue,
    newValue: a.newValue,
    campaignName: a.campaign?.name || null,
    keywordText: a.keyword?.text || null,
    adName: a.ad?.name || null,
    appliedAt: a.appliedAt,
    createdAt: a.createdAt,
    runTrigger: a.optimizationRun.triggerType,
  }));

  // Stats
  const executed = formatted.filter((a) => a.status === "APPLIED").length;
  const pending = formatted.filter((a) => a.status === "PENDING").length;
  const totalActions = formatted.length;

  return NextResponse.json({
    actions: formatted,
    stats: { executed, pending, totalActions },
    recentRuns: runs,
    hasData: totalActions > 0,
  });
}
