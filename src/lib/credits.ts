import { prisma } from "@/lib/prisma";
import { getUserPlan } from "@/lib/plan-limits";
import type { SubscriptionPlan } from "@prisma/client";

/**
 * AI credit system.
 *
 * Model: Plan includes a monthly allowance per feature; topup credits
 * (purchased) cover overflow. Helios optimization is unlimited (it's
 * pure math, no LLM cost).
 *
 * Credit consumption order:
 *   1. If monthly allowance for this feature has remaining capacity → use it
 *   2. Else → deduct from creditBalance
 *   3. Else → return { ok: false, reason: "insufficient" }
 *
 * Every consumption is logged in CreditTransaction for audit/billing.
 */

export type CreditFeature = "CHAT" | "CREATIVE_BRIEF";

interface FeatureCost {
  credits: number;
  monthlyAllowanceField: "monthlyChatUsed" | "monthlyCreativeBriefUsed";
}

export const FEATURE_COSTS: Record<CreditFeature, FeatureCost> = {
  CHAT: { credits: 1, monthlyAllowanceField: "monthlyChatUsed" },
  CREATIVE_BRIEF: { credits: 5, monthlyAllowanceField: "monthlyCreativeBriefUsed" },
};

// Monthly included allowance per plan, by feature.
// Helios optimization is unlimited regardless of plan (no LLM cost).
export const PLAN_ALLOWANCES: Record<
  SubscriptionPlan,
  { chatMessages: number; creativeBriefs: number }
> = {
  FREE: { chatMessages: 10, creativeBriefs: 0 },
  STARTER: { chatMessages: 50, creativeBriefs: 5 },
  GROWTH: { chatMessages: 200, creativeBriefs: 20 },
  AGENCY: { chatMessages: 1000, creativeBriefs: 100 },
};

// 1 credit = ₹3 INR. Pricing in paise (₹ × 100) for Razorpay.
export const CREDIT_PRICE_PAISE = 300;

export const CREDIT_PACKS = [
  { credits: 100, amountPaise: 30000 },     // ₹300, no discount
  { credits: 500, amountPaise: 140000 },    // ₹1,400 (~7% off)
  { credits: 1000, amountPaise: 270000 },   // ₹2,700 (10% off)
  { credits: 5000, amountPaise: 1200000 },  // ₹12,000 (20% off)
] as const;

interface ConsumeResult {
  ok: boolean;
  reason?: "insufficient" | "user_not_found";
  required?: number;
  monthlyRemaining?: number;
  topupRemaining?: number;
  source?: "monthly_allowance" | "topup_balance";
}

/**
 * Try to consume credits for a feature use. Atomic on the DB:
 * either monthly counter increments OR topup balance decrements,
 * never both. Returns ok=false without side effects if insufficient.
 */
export async function consumeCredits(
  userId: string,
  feature: CreditFeature
): Promise<ConsumeResult> {
  const cost = FEATURE_COSTS[feature];
  const plan = await getUserPlan(userId);
  const allowance =
    feature === "CHAT"
      ? PLAN_ALLOWANCES[plan].chatMessages
      : PLAN_ALLOWANCES[plan].creativeBriefs;

  // Atomic: re-read + write in a transaction, with a monthly-reset check
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        creditBalance: true,
        monthlyChatUsed: true,
        monthlyCreativeBriefUsed: true,
        monthlyUsageResetAt: true,
      },
    });

    if (!user) {
      return { ok: false, reason: "user_not_found" } satisfies ConsumeResult;
    }

    // Auto-reset monthly counters on the first call after the reset date
    const now = new Date();
    let resetThisCall = false;
    if (!user.monthlyUsageResetAt || user.monthlyUsageResetAt < now) {
      resetThisCall = true;
      user.monthlyChatUsed = 0;
      user.monthlyCreativeBriefUsed = 0;
    }

    const currentMonthlyUsage =
      feature === "CHAT" ? user.monthlyChatUsed : user.monthlyCreativeBriefUsed;
    const monthlyRemaining = allowance - currentMonthlyUsage;

    // Path 1: monthly allowance covers it (one full feature-use)
    if (monthlyRemaining >= 1) {
      const update: Record<string, unknown> = {
        [cost.monthlyAllowanceField]: { increment: 1 },
      };
      if (resetThisCall) {
        update.monthlyChatUsed = feature === "CHAT" ? 1 : 0;
        update.monthlyCreativeBriefUsed = feature === "CREATIVE_BRIEF" ? 1 : 0;
        update.monthlyUsageResetAt = nextMonthStart(now);
      }
      await tx.user.update({ where: { id: userId }, data: update });

      return {
        ok: true,
        monthlyRemaining: monthlyRemaining - 1,
        topupRemaining: user.creditBalance,
        source: "monthly_allowance",
      } satisfies ConsumeResult;
    }

    // Path 2: deduct from topup balance
    if (user.creditBalance >= cost.credits) {
      const newBalance = user.creditBalance - cost.credits;
      const update: Record<string, unknown> = { creditBalance: newBalance };
      if (resetThisCall) {
        update.monthlyChatUsed = 0;
        update.monthlyCreativeBriefUsed = 0;
        update.monthlyUsageResetAt = nextMonthStart(now);
      }
      await tx.user.update({ where: { id: userId }, data: update });

      await tx.creditTransaction.create({
        data: {
          userId,
          type: "CONSUME",
          feature,
          amount: -cost.credits,
          balanceAfter: newBalance,
        },
      });

      return {
        ok: true,
        monthlyRemaining: 0,
        topupRemaining: newBalance,
        source: "topup_balance",
      } satisfies ConsumeResult;
    }

    // Path 3: insufficient — no side effects
    return {
      ok: false,
      reason: "insufficient",
      required: cost.credits,
      monthlyRemaining: 0,
      topupRemaining: user.creditBalance,
    } satisfies ConsumeResult;
  });
}

/**
 * Refund credits that were consumed but the underlying AI call errored.
 * Restores either the monthly counter or the topup balance based on what
 * was originally deducted.
 */
export async function refundCredits(
  userId: string,
  feature: CreditFeature,
  source: "monthly_allowance" | "topup_balance"
): Promise<void> {
  const cost = FEATURE_COSTS[feature];
  if (source === "monthly_allowance") {
    await prisma.user.update({
      where: { id: userId },
      data: { [cost.monthlyAllowanceField]: { decrement: 1 } },
    });
  } else {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { creditBalance: true },
      });
      if (!user) return;
      const newBalance = user.creditBalance + cost.credits;
      await tx.user.update({
        where: { id: userId },
        data: { creditBalance: newBalance },
      });
      await tx.creditTransaction.create({
        data: {
          userId,
          type: "REFUND",
          feature,
          amount: cost.credits,
          balanceAfter: newBalance,
        },
      });
    });
  }
}

/**
 * Returns the user's current credit state for UI display.
 */
export async function getCreditState(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      creditBalance: true,
      monthlyChatUsed: true,
      monthlyCreativeBriefUsed: true,
      monthlyUsageResetAt: true,
    },
  });
  if (!user) {
    return null;
  }

  const plan = await getUserPlan(userId);
  const allowance = PLAN_ALLOWANCES[plan];

  // If we're past the reset date, the user is effectively at 0 monthly usage
  const now = new Date();
  const stale = !user.monthlyUsageResetAt || user.monthlyUsageResetAt < now;
  const chatUsed = stale ? 0 : user.monthlyChatUsed;
  const briefUsed = stale ? 0 : user.monthlyCreativeBriefUsed;

  return {
    topupBalance: user.creditBalance,
    monthly: {
      chat: { used: chatUsed, limit: allowance.chatMessages },
      creativeBrief: {
        used: briefUsed,
        limit: allowance.creativeBriefs,
      },
    },
    resetsAt: user.monthlyUsageResetAt ?? nextMonthStart(now),
    plan,
  };
}

function nextMonthStart(d: Date): Date {
  const next = new Date(d);
  next.setUTCDate(1);
  next.setUTCHours(0, 0, 0, 0);
  next.setUTCMonth(next.getUTCMonth() + 1);
  return next;
}
