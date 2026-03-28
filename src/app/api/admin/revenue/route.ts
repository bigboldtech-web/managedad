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
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalUsers, allSubscriptions, recentUsers7d, recentUsers30d] =
      await Promise.all([
        prisma.user.count(),
        prisma.subscription.findMany({
          select: {
            id: true,
            plan: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            user: { select: { name: true, email: true } },
          },
        }),
        prisma.user.count({
          where: { createdAt: { gte: sevenDaysAgo } },
        }),
        prisma.user.count({
          where: { createdAt: { gte: thirtyDaysAgo } },
        }),
      ]);

    // --- MRR ---
    const activeSubscriptions = allSubscriptions.filter(
      (s) => s.status === "ACTIVE" && s.plan !== "FREE"
    );

    const mrr = activeSubscriptions.reduce(
      (sum, s) => sum + (PLAN_PRICES[s.plan] ?? 0),
      0
    );

    // --- MRR Trend (last 6 months) ---
    const mrrTrend: { month: string; mrr: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const monthLabel = d.toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      });

      // Subscriptions active at that month-end:
      // created before month-end AND (still active OR cancelled after month-end)
      const monthMrr = allSubscriptions.reduce((sum, s) => {
        if (s.plan === "FREE") return sum;
        const createdBefore = s.createdAt <= monthEnd;
        const wasActive =
          s.status === "ACTIVE" ||
          (s.status === "CANCELLED" && s.updatedAt > monthEnd);
        if (createdBefore && wasActive) {
          return sum + (PLAN_PRICES[s.plan] ?? 0);
        }
        return sum;
      }, 0);

      mrrTrend.push({ month: monthLabel, mrr: monthMrr });
    }

    // --- Churn (last 30 days) ---
    const churnCount = allSubscriptions.filter(
      (s) =>
        s.status === "CANCELLED" &&
        s.updatedAt >= thirtyDaysAgo &&
        s.plan !== "FREE"
    ).length;

    // --- Trial count (users with no subscription) ---
    const trialCount = totalUsers - allSubscriptions.length;

    // --- Revenue by plan ---
    const revenueByPlan: { plan: string; count: number; revenue: number }[] = [];
    for (const plan of ["STARTER", "GROWTH", "AGENCY"] as const) {
      const subs = activeSubscriptions.filter((s) => s.plan === plan);
      revenueByPlan.push({
        plan,
        count: subs.length,
        revenue: subs.length * PLAN_PRICES[plan],
      });
    }

    // --- ARPU ---
    const paidActiveCount = activeSubscriptions.length;
    const arpu = paidActiveCount > 0 ? Math.round(mrr / paidActiveCount) : 0;

    // --- LTV estimate ---
    // Average subscription duration in months for active paid subs
    let avgDurationMonths = 0;
    if (paidActiveCount > 0) {
      const totalMonths = activeSubscriptions.reduce((sum, s) => {
        const months =
          (now.getTime() - s.createdAt.getTime()) / (30 * 24 * 60 * 60 * 1000);
        return sum + Math.max(months, 1);
      }, 0);
      avgDurationMonths = totalMonths / paidActiveCount;
    }
    const ltv = Math.round(arpu * Math.max(avgDurationMonths, 1));

    // --- Churn rate ---
    const totalPaidEver = allSubscriptions.filter(
      (s) => s.plan !== "FREE"
    ).length;
    const churnRate =
      totalPaidEver > 0
        ? Math.round((churnCount / totalPaidEver) * 10000) / 100
        : 0;

    // --- Recent subscription activity ---
    const recentActivity = allSubscriptions
      .filter((s) => s.plan !== "FREE")
      .sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
      )
      .slice(0, 20)
      .map((s) => ({
        id: s.id,
        name: s.user.name ?? "Unnamed",
        email: s.user.email,
        plan: s.plan,
        status: s.status,
        date: s.updatedAt.toISOString(),
        createdAt: s.createdAt.toISOString(),
      }));

    return NextResponse.json({
      mrr,
      mrrTrend,
      activeSubscriptions: paidActiveCount,
      churnCount,
      churnRate,
      trialCount,
      revenueByPlan,
      signups7d: recentUsers7d,
      signups30d: recentUsers30d,
      arpu,
      ltv,
      avgDurationMonths: Math.round(avgDurationMonths * 10) / 10,
      recentActivity,
    });
  } catch (error) {
    console.error("Error fetching revenue stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue stats" },
      { status: 500 }
    );
  }
}
