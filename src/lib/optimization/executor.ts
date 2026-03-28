import { prisma } from "@/lib/prisma";
import { createGoogleAdsClient } from "@/lib/google-ads/client";
import { createMetaAdsClient } from "@/lib/meta-ads/client";

interface ExecutionSummary {
  applied: number;
  failed: number;
  skipped: number;
  errors: string[];
}

/**
 * Executes all APPROVED optimization actions for a user.
 * Looks up the platform for each action's campaign, builds the
 * appropriate API client, and applies the change via the ad platform API.
 */
export async function executeApprovedActions(
  userId: string
): Promise<ExecutionSummary> {
  const summary: ExecutionSummary = {
    applied: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  // Fetch all approved actions for this user's optimization runs
  const actions = await prisma.optimizationAction.findMany({
    where: {
      status: "APPROVED",
      optimizationRun: { userId },
    },
    include: {
      campaign: true,
      ad: true,
      keyword: true,
    },
  });

  for (const action of actions) {
    try {
      // Skip advisory-only action types
      if (
        action.actionType === "CREATE_AD_VARIATION" ||
        action.actionType === "SUGGEST_AB_TEST"
      ) {
        summary.skipped++;
        continue;
      }

      const campaign = action.campaign;
      if (!campaign) {
        throw new Error(`No campaign found for action ${action.id}`);
      }

      if (campaign.platform === "GOOGLE_ADS") {
        await executeGoogleAction(action, campaign);
      } else if (campaign.platform === "META_ADS") {
        await executeMetaAction(action, campaign);
      } else {
        throw new Error(`Unknown platform: ${campaign.platform}`);
      }

      // Mark action as applied
      await prisma.optimizationAction.update({
        where: { id: action.id },
        data: {
          status: "APPLIED",
          appliedAt: new Date(),
        },
      });

      summary.applied++;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `Failed to execute action ${action.id} (${action.actionType}):`,
        errorMessage
      );

      await prisma.optimizationAction.update({
        where: { id: action.id },
        data: { status: "FAILED" },
      });

      summary.failed++;
      summary.errors.push(
        `${action.actionType} on campaign ${action.campaignId}: ${errorMessage}`
      );
    }
  }

  return summary;
}

// ---------------------------------------------------------------------------
// Google Ads execution
// ---------------------------------------------------------------------------

async function executeGoogleAction(
  action: {
    id: string;
    actionType: string;
    newValue: unknown;
    adId: string | null;
    keywordId: string | null;
  },
  campaign: {
    externalId: string | null;
    googleAdsConnectionId: string | null;
  }
) {
  if (!campaign.googleAdsConnectionId) {
    throw new Error("Campaign missing googleAdsConnectionId");
  }
  if (!campaign.externalId) {
    throw new Error("Campaign missing externalId");
  }

  const client = await createGoogleAdsClient(campaign.googleAdsConnectionId);
  const newValue = (action.newValue ?? {}) as Record<string, unknown>;

  // We need the customer ID from the connection to build resource names
  const connection = await prisma.googleAdsConnection.findUniqueOrThrow({
    where: { id: campaign.googleAdsConnectionId },
  });
  const customerId = connection.customerId.replace(/-/g, "");

  switch (action.actionType) {
    case "INCREASE_BUDGET":
    case "DECREASE_BUDGET": {
      // Budget is set on the campaign's budget resource.
      // First, query for the campaign's budget resource name.
      const results = await client.search(
        `SELECT campaign.campaign_budget FROM campaign WHERE campaign.id = ${campaign.externalId}`
      );
      if (!results.length || !results[0].campaign?.campaignBudget) {
        throw new Error("Could not find campaign budget resource");
      }
      const budgetResourceName = results[0].campaign.campaignBudget;
      const dailyBudget = newValue.dailyBudget as number;
      // Google Ads budgets are in micros (1 unit = 1,000,000 micros)
      const amountMicros = Math.round(dailyBudget * 1_000_000).toString();

      await client.mutate([
        {
          campaignBudgetOperation: {
            updateMask: "amount_micros",
            update: {
              resourceName: budgetResourceName,
              amountMicros,
            },
          },
        },
      ]);
      break;
    }

    case "PAUSE_AD":
    case "ENABLE_AD": {
      if (!action.adId) throw new Error("PAUSE_AD/ENABLE_AD requires adId");
      const ad = await prisma.ad.findUniqueOrThrow({
        where: { id: action.adId },
        include: { adGroup: true },
      });
      if (!ad.externalId) throw new Error("Ad missing externalId");
      if (!ad.adGroup?.externalId) throw new Error("Ad missing adGroup externalId");

      const adGroupResourceName = `customers/${customerId}/adGroups/${ad.adGroup.externalId}`;
      const adResourceName = `${adGroupResourceName}/ads/${ad.externalId}`;
      const status = action.actionType === "PAUSE_AD" ? "PAUSED" : "ENABLED";

      await client.mutate([
        {
          adGroupAdOperation: {
            updateMask: "status",
            update: {
              resourceName: `customers/${customerId}/adGroupAds/${ad.adGroup.externalId}~${ad.externalId}`,
              status,
            },
          },
        },
      ]);
      break;
    }

    case "PAUSE_KEYWORD": {
      if (!action.keywordId)
        throw new Error("PAUSE_KEYWORD requires keywordId");
      const keyword = await prisma.keyword.findUniqueOrThrow({
        where: { id: action.keywordId },
        include: { adGroup: true },
      });
      if (!keyword.externalId) throw new Error("Keyword missing externalId");
      if (!keyword.adGroup?.externalId)
        throw new Error("Keyword missing adGroup externalId");

      await client.mutate([
        {
          adGroupCriterionOperation: {
            updateMask: "status",
            update: {
              resourceName: `customers/${customerId}/adGroupCriteria/${keyword.adGroup.externalId}~${keyword.externalId}`,
              status: "PAUSED",
            },
          },
        },
      ]);
      break;
    }

    case "ADD_NEGATIVE_KEYWORD": {
      const keywordText = newValue.keyword as string;
      const matchType = (newValue.matchType as string) || "BROAD";
      const campaignResourceName = `customers/${customerId}/campaigns/${campaign.externalId}`;

      await client.addNegativeKeywords(campaignResourceName, [
        { text: keywordText, matchType },
      ]);
      break;
    }

    case "ADJUST_BID": {
      if (!action.keywordId) throw new Error("ADJUST_BID requires keywordId");
      const keyword = await prisma.keyword.findUniqueOrThrow({
        where: { id: action.keywordId },
        include: { adGroup: true },
      });
      if (!keyword.externalId) throw new Error("Keyword missing externalId");
      if (!keyword.adGroup?.externalId)
        throw new Error("Keyword missing adGroup externalId");

      const bidMicros = (newValue.bidMicros as number).toString();

      await client.mutate([
        {
          adGroupCriterionOperation: {
            updateMask: "cpc_bid_micros",
            update: {
              resourceName: `customers/${customerId}/adGroupCriteria/${keyword.adGroup.externalId}~${keyword.externalId}`,
              cpcBidMicros: bidMicros,
            },
          },
        },
      ]);
      break;
    }

    default:
      throw new Error(
        `Unsupported Google Ads action type: ${action.actionType}`
      );
  }
}

// ---------------------------------------------------------------------------
// Meta Ads execution
// ---------------------------------------------------------------------------

async function executeMetaAction(
  action: {
    id: string;
    actionType: string;
    newValue: unknown;
    adId: string | null;
    keywordId: string | null;
  },
  campaign: {
    externalId: string | null;
    metaAdsConnectionId: string | null;
  }
) {
  if (!campaign.metaAdsConnectionId) {
    throw new Error("Campaign missing metaAdsConnectionId");
  }
  if (!campaign.externalId) {
    throw new Error("Campaign missing externalId");
  }

  const client = await createMetaAdsClient(campaign.metaAdsConnectionId);
  const newValue = (action.newValue ?? {}) as Record<string, unknown>;

  switch (action.actionType) {
    case "INCREASE_BUDGET":
    case "DECREASE_BUDGET": {
      const dailyBudget = newValue.dailyBudget as number;
      // Meta API expects budget in cents (smallest currency unit)
      const budgetCents = Math.round(dailyBudget * 100).toString();

      await client.request(`/${campaign.externalId}`, {
        method: "POST",
        body: JSON.stringify({ daily_budget: budgetCents }),
      });
      break;
    }

    case "PAUSE_AD":
    case "ENABLE_AD": {
      if (!action.adId) throw new Error("PAUSE_AD/ENABLE_AD requires adId");
      const ad = await prisma.ad.findUniqueOrThrow({
        where: { id: action.adId },
      });
      if (!ad.externalId) throw new Error("Ad missing externalId");

      const status = action.actionType === "PAUSE_AD" ? "PAUSED" : "ACTIVE";

      await client.request(`/${ad.externalId}`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
      break;
    }

    case "PAUSE_KEYWORD":
    case "ADD_NEGATIVE_KEYWORD":
    case "ADJUST_BID":
      // Keywords and bids are not applicable to Meta Ads
      throw new Error(
        `${action.actionType} is not supported on META_ADS platform`
      );

    default:
      throw new Error(
        `Unsupported Meta Ads action type: ${action.actionType}`
      );
  }
}
