import { prisma } from "@/lib/prisma";
import type { ReviewType, ReviewResult } from "./types";

/**
 * Get the start of the current ISO week (Monday)
 */
export function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Get end of current ISO week (Sunday 23:59:59)
 */
export function getWeekEnd(): Date {
  const start = getWeekStart();
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Store a review result in the database
 */
export async function storeReview(
  userId: string,
  result: ReviewResult
): Promise<string> {
  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();

  const review = await prisma.weeklyReview.upsert({
    where: {
      userId_reviewType_weekStart: {
        userId,
        reviewType: result.reviewType as any,
        weekStart,
      },
    },
    create: {
      userId,
      reviewType: result.reviewType as any,
      weekStart,
      weekEnd,
      data: JSON.parse(JSON.stringify({
        findings: result.findings,
        actions: result.actions,
        score: result.score,
      })),
      summary: result.summary,
      actionsTaken: result.actions.filter((a) => a.applied).length,
    },
    update: {
      data: JSON.parse(JSON.stringify({
        findings: result.findings,
        actions: result.actions,
        score: result.score,
      })),
      summary: result.summary,
      actionsTaken: result.actions.filter((a) => a.applied).length,
    },
  });

  return review.id;
}

/**
 * Create action items from review findings
 */
export async function createActionItems(
  userId: string,
  reviewType: ReviewType,
  result: ReviewResult
): Promise<void> {
  const highPriorityFindings = result.findings.filter(
    (f) => f.impact === "HIGH" && (f.type === "WASTE" || f.type === "OPPORTUNITY")
  );

  if (highPriorityFindings.length === 0) return;

  const items = highPriorityFindings.slice(0, 5).map((f) => ({
    userId,
    type: reviewType,
    title: f.title,
    description: f.description,
    priority: f.impact,
    status: "PENDING",
    link: f.campaignId ? `/campaigns/${f.campaignId}` : `/reviews`,
    metadata: { campaignName: f.campaignName, metric: f.metric },
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expire in 7 days
  }));

  await prisma.actionItem.createMany({ data: items });
}

/**
 * Get all users who have autonomous mode or optimization enabled
 */
export async function getActiveUsers(): Promise<
  { id: string; autonomousMode: boolean; email: string; name: string | null }[]
> {
  return prisma.user.findMany({
    where: {
      OR: [
        { autonomousMode: true },
        { optimizationSettings: { isEnabled: true } },
      ],
    },
    select: { id: true, autonomousMode: true, email: true, name: true },
  });
}

/**
 * Get user's campaign data for the last N days
 */
export async function getUserCampaignData(userId: string, days: number = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [campaigns, metrics, keywords, ads] = await Promise.all([
    prisma.campaign.findMany({
      where: { userId, status: { in: ["ACTIVE", "PAUSED"] } },
      include: {
        adGroups: { select: { id: true, name: true, impressions: true, clicks: true, conversions: true, spend: true } },
      },
    }),
    prisma.dailyMetric.findMany({
      where: { campaign: { userId }, date: { gte: since } },
      orderBy: { date: "asc" },
    }),
    prisma.keyword.findMany({
      where: { campaign: { userId }, isNegative: false, status: "ACTIVE" },
      select: {
        id: true, text: true, matchType: true, impressions: true, clicks: true,
        conversions: true, spend: true, qualityScore: true, campaignId: true, adGroupId: true,
      },
    }),
    prisma.ad.findMany({
      where: { campaign: { userId }, status: { in: ["ACTIVE", "PAUSED"] } },
      select: {
        id: true, name: true, type: true, status: true, headlines: true, descriptions: true,
        impressions: true, clicks: true, conversions: true, spend: true, campaignId: true,
      },
    }),
  ]);

  return { campaigns, metrics, keywords, ads };
}
