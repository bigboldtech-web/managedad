import { prisma } from "@/lib/prisma";

export const PLAN_LIMITS = {
  FREE: { adAccounts: 1, campaigns: 5, features: [] as string[] },
  STARTER: { adAccounts: 2, campaigns: 25, features: ["negative_keywords", "budget_optimization", "daily_digest"] },
  GROWTH: { adAccounts: 4, campaigns: -1, features: ["negative_keywords", "budget_optimization", "daily_digest", "fraud_detection", "creative_generation", "chat", "competitor_intel", "slack_whatsapp", "weekly_report"] },
  AGENCY: { adAccounts: -1, campaigns: -1, features: ["negative_keywords", "budget_optimization", "daily_digest", "fraud_detection", "creative_generation", "chat", "competitor_intel", "slack_whatsapp", "weekly_report", "cross_platform_reallocation", "white_label", "api_access"] },
} as const;

export type PlanKey = keyof typeof PLAN_LIMITS;

/**
 * Resolve the user's current plan from their active subscription.
 * Returns "FREE" if no active subscription exists.
 */
export async function getUserPlan(userId: string): Promise<PlanKey> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true },
  });

  if (!sub || sub.status === "CANCELLED") return "FREE";
  return sub.plan as PlanKey;
}

/**
 * Check whether a user's plan includes a specific feature.
 */
export async function checkFeatureAccess(
  userId: string,
  feature: string
): Promise<{ allowed: boolean; plan: PlanKey; requiredPlan: PlanKey }> {
  const plan = await getUserPlan(userId);
  const limits = PLAN_LIMITS[plan];
  const allowed = (limits.features as readonly string[]).includes(feature);

  // Find the cheapest plan that includes this feature
  const requiredPlan = (Object.keys(PLAN_LIMITS) as PlanKey[]).find((p) =>
    (PLAN_LIMITS[p].features as readonly string[]).includes(feature)
  ) || "AGENCY";

  return { allowed, plan, requiredPlan };
}

/**
 * Check whether the user can connect another ad account.
 */
export async function checkAccountLimit(
  userId: string
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const plan = await getUserPlan(userId);
  const limit = PLAN_LIMITS[plan].adAccounts;

  if (limit === -1) return { allowed: true, current: 0, limit: -1 };

  const [googleCount, metaCount] = await Promise.all([
    prisma.googleAdsConnection.count({ where: { userId, isActive: true } }),
    prisma.metaAdsConnection.count({ where: { userId, isActive: true } }),
  ]);
  const current = googleCount + metaCount;

  return { allowed: current < limit, current, limit };
}

/**
 * Check whether the user can create another campaign.
 */
export async function checkCampaignLimit(
  userId: string
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const plan = await getUserPlan(userId);
  const limit = PLAN_LIMITS[plan].campaigns;

  if (limit === -1) return { allowed: true, current: 0, limit: -1 };

  const current = await prisma.campaign.count({ where: { userId } });

  return { allowed: current < limit, current, limit };
}
