import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PLAN_PRICES: Record<string, number> = {
  FREE: 0,
  STARTER: 2999,
  GROWTH: 7999,
  AGENCY: 19999,
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const [totalUsers, totalCampaigns, subscriptions, recentUsers] =
      await Promise.all([
        prisma.user.count(),
        prisma.campaign.count(),
        prisma.subscription.findMany({
          select: { plan: true, status: true },
        }),
        prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            subscription: { select: { plan: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ]);

    const activeSubscriptions = subscriptions.filter(
      (s) => s.status === "ACTIVE" && s.plan !== "FREE"
    ).length;

    const mrr = subscriptions.reduce((sum, s) => {
      if (s.status === "ACTIVE") {
        return sum + (PLAN_PRICES[s.plan] ?? 0);
      }
      return sum;
    }, 0);

    // Plan distribution
    const planCounts: Record<string, number> = {
      FREE: 0,
      STARTER: 0,
      GROWTH: 0,
      AGENCY: 0,
    };

    for (const sub of subscriptions) {
      planCounts[sub.plan] = (planCounts[sub.plan] ?? 0) + 1;
    }

    // Count users without subscriptions as FREE
    const usersWithoutSub = totalUsers - subscriptions.length;
    planCounts["FREE"] += usersWithoutSub;

    const planDistribution = Object.entries(planCounts)
      .filter(([, count]) => count > 0)
      .map(([name, value]) => ({ name, value }));

    const recentSignups = recentUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      createdAt: u.createdAt.toISOString(),
      plan: u.subscription?.plan ?? "FREE",
    }));

    return NextResponse.json({
      totalUsers,
      activeSubscriptions,
      mrr,
      totalCampaigns,
      recentSignups,
      planDistribution,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
