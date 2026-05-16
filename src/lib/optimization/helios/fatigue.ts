import { prisma } from "@/lib/prisma";
import { linearRegressionSlope } from "./signals";

const MIN_AGE_DAYS = 14;
const MIN_IMPRESSIONS = 200;
const FATIGUE_THRESHOLD = 70;

interface FatigueResult {
  adId: string;
  score: number;
  isFatigued: boolean;
}

/**
 * Compute a 0–100 fatigue score for an ad based on 7-day CTR decay.
 * Higher score = more fatigued. Score ≥ FATIGUE_THRESHOLD flips isFatigued.
 *
 * Algorithm:
 *  - For each of the last 7 days, compute CTR (clicks / impressions).
 *  - Fit an OLS slope. Negative slope = decay.
 *  - Score = clamp(-slope × 10000, 0, 100). 0.01 CTR drop per day ≈ score 100.
 *  - Only flag fatigued if ad is ≥ 14d old AND has ≥ 200 lifetime impressions.
 */
export async function computeAdFatigue(adId: string): Promise<FatigueResult> {
  const ad = await prisma.ad.findUnique({
    where: { id: adId },
    include: {
      campaign: {
        select: { id: true },
      },
    },
  });

  if (!ad || !ad.campaign) {
    return { adId, score: 0, isFatigued: false };
  }

  const ageDays = Math.floor(
    (Date.now() - new Date(ad.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (ageDays < MIN_AGE_DAYS || Number(ad.impressions) < MIN_IMPRESSIONS) {
    return { adId, score: 0, isFatigued: false };
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const daily = await prisma.dailyMetric.findMany({
    where: { campaignId: ad.campaign.id, date: { gte: since } },
    orderBy: { date: "asc" },
  });

  if (daily.length < 5) {
    return { adId, score: 0, isFatigued: false };
  }

  const ctrSeries = daily.map((d) => {
    const imp = Number(d.impressions);
    const clk = Number(d.clicks);
    return imp > 0 ? clk / imp : 0;
  });

  const slope = linearRegressionSlope(ctrSeries);

  // Slope is in CTR units per day (e.g. -0.005 = 0.5pp drop per day).
  // Multiply by 10000 to get a usable 0-100 scale: a slope of -0.01 → 100.
  const rawScore = Math.max(0, -slope * 10000);
  const score = Math.min(100, Math.round(rawScore));

  return {
    adId,
    score,
    isFatigued: score >= FATIGUE_THRESHOLD,
  };
}

export async function scanAndMarkFatigue(userId?: string) {
  const ads = await prisma.ad.findMany({
    where: {
      status: "ACTIVE",
      ...(userId ? { campaign: { userId } } : {}),
    },
    select: { id: true },
  });

  const updates: FatigueResult[] = [];
  for (const a of ads) {
    const result = await computeAdFatigue(a.id);
    if (result.score > 0 || result.isFatigued) {
      await prisma.ad.update({
        where: { id: a.id },
        data: {
          fatigueScore: result.score,
          isFatigued: result.isFatigued,
        },
      });
      updates.push(result);
    }
  }

  return updates;
}
