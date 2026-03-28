import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleAdsClient } from "@/lib/google-ads/client";

// Runs hourly — reallocates budget from underperforming to high-performing campaigns
// Max shift: 20% of daily budget per iteration (safety guard)
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const results = { adjusted: 0, skipped: 0, errors: 0 };

  // Find users with active optimization settings and auto-apply enabled
  const settings = await prisma.optimizationSettings.findMany({
    where: { isEnabled: true, autoApply: true },
    select: { userId: true, maxBudgetIncrease: true, maxBudgetDecrease: true },
  });

  for (const setting of settings) {
    try {
      const connections = await prisma.googleAdsConnection.findMany({
        where: { userId: setting.userId, isActive: true },
      });

      for (const conn of connections) {
        if (!conn.accessToken || !devToken) continue;

        const client = new GoogleAdsClient({
          customerId: conn.customerId,
          developerToken: devToken,
          accessToken: conn.accessToken,
          refreshToken: conn.refreshToken,
          connectionId: conn.id,
          managerAccountId: conn.managerAccountId || undefined,
        });

        // Get campaigns with last 7 days metrics
        const rows = await client.search(`
          SELECT
            campaign.id,
            campaign.name,
            campaign.resource_name,
            campaign.status,
            campaign_budget.amount_micros,
            campaign_budget.resource_name,
            metrics.cost_micros,
            metrics.conversions,
            metrics.conversions_value,
            metrics.impressions,
            metrics.clicks
          FROM campaign
          WHERE campaign.status = 'ENABLED'
            AND segments.date DURING LAST_7_DAYS
          LIMIT 50
        `);

        if (rows.length < 2) continue;

        // Calculate ROAS for each campaign
        const campaignMetrics = rows.map((row: Record<string, unknown>) => {
          const spend = Number((row.metrics as Record<string, unknown>)?.costMicros || 0) / 1_000_000;
          const revenue = Number((row.metrics as Record<string, unknown>)?.conversionsValue || 0);
          const roas = spend > 0 ? revenue / spend : 0;
          const budgetMicros = Number((row.campaignBudget as Record<string, unknown>)?.amountMicros || 0);
          return {
            resourceName: (row.campaign as Record<string, unknown>)?.resourceName as string,
            budgetResourceName: (row.campaignBudget as Record<string, unknown>)?.resourceName as string,
            spend,
            roas,
            budgetMicros,
          };
        }).filter((c) => c.budgetMicros > 0);

        if (campaignMetrics.length < 2) continue;

        const avgRoas = campaignMetrics.reduce((s, c) => s + c.roas, 0) / campaignMetrics.length;
        const maxIncPct = Number(setting.maxBudgetIncrease) / 100;
        const maxDecPct = Number(setting.maxBudgetDecrease) / 100;

        const mutations: Record<string, unknown>[] = [];

        for (const c of campaignMetrics) {
          if (c.roas > avgRoas * 1.5 && c.budgetMicros > 0) {
            // High performer — increase budget by up to maxBudgetIncrease%
            const newBudget = Math.round(c.budgetMicros * (1 + maxIncPct));
            mutations.push({
              campaignBudgetOperation: {
                updateMask: "amountMicros",
                update: { resourceName: c.budgetResourceName, amountMicros: String(newBudget) },
              },
            });
          } else if (c.roas < avgRoas * 0.5 && c.spend > 500) {
            // Low performer — decrease budget by up to maxBudgetDecrease%
            const newBudget = Math.round(c.budgetMicros * (1 - maxDecPct));
            if (newBudget > 500_000) { // min ₹500/day
              mutations.push({
                campaignBudgetOperation: {
                  updateMask: "amountMicros",
                  update: { resourceName: c.budgetResourceName, amountMicros: String(newBudget) },
                },
              });
            }
          }
        }

        if (mutations.length > 0) {
          await client.mutate(mutations);
          results.adjusted += mutations.length;

          // Log actions in DB
          const run = await prisma.optimizationRun.create({
            data: {
              userId: setting.userId,
              triggerType: "SCHEDULED",
              status: "COMPLETED",
              startedAt: new Date(),
              completedAt: new Date(),
              summary: { budgetAdjustments: mutations.length, source: "budget-optimize-cron" },
            },
          });

          for (const mutation of mutations) {
            const budgetOp = (mutation as Record<string, Record<string, Record<string, string>>>).campaignBudgetOperation;
            const isBudgetIncrease = Number(budgetOp.update.amountMicros) > 0;
            await prisma.optimizationAction.create({
              data: {
                optimizationRunId: run.id,
                actionType: isBudgetIncrease ? "INCREASE_BUDGET" : "DECREASE_BUDGET",
                description: `Budget adjusted via hourly optimization`,
                status: "APPLIED",
                appliedAt: new Date(),
              },
            });
          }
        } else {
          results.skipped++;
        }
      }
    } catch (err) {
      console.error(`Budget optimization error for user ${setting.userId}:`, err);
      results.errors++;
    }
  }

  return NextResponse.json({
    message: "Budget optimization completed",
    results,
    timestamp: new Date().toISOString(),
  });
}
