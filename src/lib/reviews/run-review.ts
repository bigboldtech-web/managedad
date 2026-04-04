import { getActiveUsers, storeReview, createActionItems } from "./base";
import { runKeywordReview } from "./keyword-review";
import { runCreativeReview } from "./creative-review";
import { runBidReview } from "./bid-review";
import { runBudgetReview } from "./budget-review";
import { runCompetitorReview } from "./competitor-review";
import type { ReviewType, ReviewResult } from "./types";

const REVIEW_RUNNERS: Record<string, (userId: string) => Promise<ReviewResult>> = {
  KEYWORD_REVIEW: runKeywordReview,
  CREATIVE_REVIEW: runCreativeReview,
  BID_REVIEW: runBidReview,
  BUDGET_REVIEW: runBudgetReview,
  COMPETITOR_REVIEW: runCompetitorReview,
};

/**
 * Run a specific review type for all active users
 */
export async function runReviewForAllUsers(reviewType: ReviewType): Promise<{
  usersProcessed: number;
  totalFindings: number;
  totalActions: number;
}> {
  const runner = REVIEW_RUNNERS[reviewType];
  if (!runner) throw new Error(`Unknown review type: ${reviewType}`);

  const users = await getActiveUsers();
  let totalFindings = 0;
  let totalActions = 0;

  for (const user of users) {
    try {
      const result = await runner(user.id);
      await storeReview(user.id, result);
      await createActionItems(user.id, reviewType, result);
      totalFindings += result.findings.length;
      totalActions += result.actions.length;
    } catch (err) {
      console.error(`Review ${reviewType} failed for user ${user.id}:`, err);
    }
  }

  return { usersProcessed: users.length, totalFindings, totalActions };
}
