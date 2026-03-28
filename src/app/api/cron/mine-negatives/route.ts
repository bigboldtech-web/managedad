import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleAdsClient } from "@/lib/google-ads/client";
import { getAnthropic, CLAUDE_MODEL } from "@/lib/anthropic";

// Runs every 6 hours — mines negative keywords automatically for users with autoApply
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const results = { applied: 0, users: 0, errors: 0 };

  const settings = await prisma.optimizationSettings.findMany({
    where: { isEnabled: true, autoApply: true },
    select: { userId: true },
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

        // Get costly no-conversion search terms
        const rows = await client.search(`
          SELECT
            search_term_view.search_term,
            search_term_view.resource_name,
            campaign.resource_name,
            campaign.name,
            ad_group.resource_name,
            metrics.cost_micros,
            metrics.clicks,
            metrics.conversions
          FROM search_term_view
          WHERE segments.date DURING LAST_30_DAYS
            AND metrics.cost_micros > 20000000
            AND metrics.conversions = 0
          LIMIT 60
        `);

        if (rows.length === 0) continue;

        const terms = rows.map((row: Record<string, unknown>) => ({
          term: (row.searchTermView as Record<string, unknown>)?.searchTerm as string,
          spend: Number((row.metrics as Record<string, unknown>)?.costMicros || 0) / 1_000_000,
          clicks: Number((row.metrics as Record<string, unknown>)?.clicks || 0),
          campaignResourceName: (row.campaign as Record<string, unknown>)?.resourceName as string,
          campaignName: (row.campaign as Record<string, unknown>)?.name as string,
        })).filter((t) => t.term);

        if (terms.length === 0) continue;

        // Claude classifies which ones to add as negatives
        const anthropic = getAnthropic();
        const termsList = terms.map((t) => `"${t.term}" (₹${t.spend.toFixed(0)} spent, ${t.clicks} clicks)`).join("\n");

        const msg = await anthropic.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: 800,
          messages: [{
            role: "user",
            content: `These search terms have generated ad spend but zero conversions. Classify each as ADD_NEGATIVE or MONITOR.\nReturn JSON array: [{"term":"...","action":"ADD_NEGATIVE"|"MONITOR","reason":"..."}]\n\nTerms:\n${termsList}\n\nReturn ONLY the JSON array.`,
          }],
        });

        let classifications: { term: string; action: string; reason: string }[] = [];
        try {
          const raw = ((msg.content[0] as { type: string; text: string }).text || "")
            .replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
          classifications = JSON.parse(raw);
        } catch {
          // Fallback: mark all as negatives
          classifications = terms.map((t) => ({ term: t.term, action: "ADD_NEGATIVE", reason: "Zero conversions" }));
        }

        const toAdd = classifications.filter((c) => c.action === "ADD_NEGATIVE");
        if (toAdd.length === 0) continue;

        // Group by campaign
        const byCampaign = new Map<string, string[]>();
        for (const item of toAdd) {
          const termData = terms.find((t) => t.term === item.term);
          if (!termData?.campaignResourceName) continue;
          const existing = byCampaign.get(termData.campaignResourceName) || [];
          existing.push(item.term);
          byCampaign.set(termData.campaignResourceName, existing);
        }

        for (const [campaignResourceName, negTerms] of byCampaign) {
          await client.addNegativeKeywords(
            campaignResourceName,
            negTerms.map((t) => ({ text: t, matchType: "BROAD" }))
          );

          // Find campaign DB record
          const campaign = await prisma.campaign.findFirst({
            where: { userId: setting.userId, externalId: campaignResourceName.split("/").pop() },
          });

          if (campaign) {
            for (const t of negTerms) {
              await prisma.keyword.upsert({
                where: { externalId: `neg_auto_${campaign.id}_${t.replace(/\s+/g, "_")}` },
                update: {},
                create: {
                  campaignId: campaign.id,
                  externalId: `neg_auto_${campaign.id}_${t.replace(/\s+/g, "_")}`,
                  text: t,
                  matchType: "BROAD",
                  isNegative: true,
                  status: "ACTIVE",
                },
              });
            }
          }

          results.applied += negTerms.length;
        }
        results.users++;
      }
    } catch (err) {
      console.error(`Auto negative mining failed for user ${setting.userId}:`, err);
      results.errors++;
    }
  }

  return NextResponse.json({
    message: "Negative keyword mining completed",
    results,
    timestamp: new Date().toISOString(),
  });
}
