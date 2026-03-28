import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGoogleAdsClient } from "@/lib/google-ads/client";
import { getAnthropic, CLAUDE_MODEL } from "@/lib/anthropic";

export interface NegativeSuggestion {
  text: string;
  clicks: number;
  spend: number; // INR
  impressions: number;
  campaignId: string;
  campaignName: string;
  campaignResourceName: string;
  reason: string;
  matchType: "EXACT" | "PHRASE";
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connections = await prisma.googleAdsConnection.findMany({
    where: { userId: session.user.id, isActive: true },
  });

  if (connections.length === 0) {
    return NextResponse.json({ suggestions: [], message: "No Google Ads accounts connected" });
  }

  const allTerms: {
    text: string;
    clicks: number;
    spend: number;
    impressions: number;
    campaignId: string;
    campaignName: string;
    campaignResourceName: string;
  }[] = [];

  for (const conn of connections) {
    try {
      const client = await createGoogleAdsClient(conn.id);

      // Pull zero-conversion search terms with meaningful spend in the last 30 days
      const results = await client.search(`
        SELECT
          search_term_view.search_term,
          search_term_view.status,
          campaign.id,
          campaign.name,
          campaign.resource_name,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions
        FROM search_term_view
        WHERE segments.date DURING LAST_30_DAYS
          AND metrics.cost_micros > 20000000
          AND metrics.conversions = 0
          AND search_term_view.status != 'EXCLUDED'
        ORDER BY metrics.cost_micros DESC
        LIMIT 80
      `);

      for (const row of results) {
        const term = row.searchTermView?.searchTerm;
        if (!term) continue;
        allTerms.push({
          text: term,
          clicks: Number(row.metrics?.clicks ?? 0),
          spend: Math.round(Number(row.metrics?.costMicros ?? 0) / 10000) / 100, // micros → INR
          impressions: Number(row.metrics?.impressions ?? 0),
          campaignId: String(row.campaign?.id ?? ""),
          campaignName: row.campaign?.name ?? "",
          campaignResourceName: row.campaign?.resourceName ?? "",
        });
      }
    } catch (err) {
      console.error(`SearchTermView failed for connection ${conn.id}:`, err);
    }
  }

  if (allTerms.length === 0) {
    return NextResponse.json({
      suggestions: [],
      message: "No wasteful search terms found (all terms have conversions or low spend)",
    });
  }

  // Send to Claude for classification
  const termsList = allTerms
    .slice(0, 60) // cap to avoid token overrun
    .map((t, i) => `${i + 1}. "${t.text}" | ₹${t.spend} spend | ${t.clicks} clicks | campaign: "${t.campaignName}"`)
    .join("\n");

  const systemPrompt = `You are a Google Ads negative keyword specialist for an Indian e-commerce/services business.
All search terms below had zero conversions and significant wasted spend.

Classify each term as:
- ADD_NEGATIVE: Clearly irrelevant (job searches, tutorials, free content, competitor research, geographic mismatch, unrelated topics)
- MONITOR: Could convert with more data, or might be relevant — do not block yet

Respond ONLY with a JSON array. Each item:
{
  "index": <number from input>,
  "recommendation": "ADD_NEGATIVE" | "MONITOR",
  "matchType": "EXACT" | "PHRASE",
  "reason": "<10-15 word specific reason>"
}

Use EXACT match for highly specific irrelevant terms. Use PHRASE for category-level waste (e.g., "free", "jobs", "tutorial").
Be aggressive on obvious waste. Be conservative on borderline cases.`;

  let suggestions: NegativeSuggestion[] = [];

  try {
    const response = await getAnthropic().messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: `Classify these zero-conversion search terms:\n\n${termsList}` }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "[]";
    const json = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const classifications: { index: number; recommendation: string; matchType: string; reason: string }[] = JSON.parse(json);

    for (const cls of classifications) {
      if (cls.recommendation !== "ADD_NEGATIVE") continue;
      const term = allTerms[cls.index - 1];
      if (!term) continue;
      suggestions.push({
        ...term,
        reason: cls.reason,
        matchType: cls.matchType === "PHRASE" ? "PHRASE" : "EXACT",
      });
    }
  } catch (err) {
    console.error("Claude classification error:", err);
    // Fallback: flag obvious patterns without AI
    suggestions = allTerms
      .filter((t) => /\b(free|job|hiring|tutorial|youtube|quora|reddit|how to|diy|repair|second.?hand|used|review)\b/i.test(t.text))
      .map((t) => ({ ...t, reason: "Matched common waste pattern", matchType: "EXACT" as const }));
  }

  // Deduplicate by text
  const seen = new Set<string>();
  suggestions = suggestions.filter((s) => {
    if (seen.has(s.text)) return false;
    seen.add(s.text);
    return true;
  });

  return NextResponse.json({ suggestions, total: allTerms.length });
}
