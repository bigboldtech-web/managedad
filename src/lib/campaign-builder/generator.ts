import { getAnthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import type { CampaignBlueprintData } from "./types";

/**
 * Build account context for the AI to understand the user's existing performance data
 */
async function buildAccountContext(userId: string): Promise<string> {
  const [campaigns, recentMetrics] = await Promise.all([
    prisma.campaign.findMany({
      where: { userId, status: { in: ["ACTIVE", "PAUSED"] } },
      select: {
        name: true, platform: true, status: true, dailyBudget: true,
        impressions: true, clicks: true, conversions: true, spend: true, revenue: true,
      },
      orderBy: { spend: "desc" },
      take: 10,
    }),
    prisma.dailyMetric.findMany({
      where: {
        campaign: { userId },
        date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      select: { spend: true, revenue: true, conversions: true },
    }),
  ]);

  if (campaigns.length === 0) {
    return "No existing campaigns. This is a new account.";
  }

  const totalSpend = recentMetrics.reduce((s, m) => s + Number(m.spend), 0);
  const totalRevenue = recentMetrics.reduce((s, m) => s + Number(m.revenue), 0);
  const totalConversions = recentMetrics.reduce((s, m) => s + m.conversions, 0);
  const avgRoas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : "N/A";
  const avgCpa = totalConversions > 0 ? (totalSpend / totalConversions).toFixed(0) : "N/A";

  const campaignLines = campaigns.map((c) => {
    const spend = Number(c.spend);
    const rev = Number(c.revenue);
    const roas = spend > 0 ? (rev / spend).toFixed(1) : "0";
    return `  - [${c.platform}] "${c.name}" | Budget: ₹${Number(c.dailyBudget || 0).toLocaleString("en-IN")}/day | ROAS: ${roas}x | Conv: ${c.conversions}`;
  });

  return `Existing account (last 30 days):
Total spend: ₹${totalSpend.toLocaleString("en-IN")} | Revenue: ₹${totalRevenue.toLocaleString("en-IN")} | ROAS: ${avgRoas}x | CPA: ₹${avgCpa}
Active campaigns:
${campaignLines.join("\n")}`;
}

/**
 * Generate a complete campaign blueprint from a natural language prompt
 */
export async function generateBlueprint(
  userId: string,
  prompt: string,
  platform: "GOOGLE_ADS" | "META_ADS"
): Promise<CampaignBlueprintData> {
  const accountContext = await buildAccountContext(userId);
  const anthropic = getAnthropic();

  const isGoogle = platform === "GOOGLE_ADS";

  const systemPrompt = `You are the world's best performance marketer building a campaign strategy. You think like a senior Google/Meta Ads specialist with 15+ years of experience managing ₹10Cr+ monthly budgets for Indian businesses.

ACCOUNT CONTEXT:
${accountContext}

YOUR TASK: Generate a COMPLETE campaign blueprint from the user's description. Think strategically:
- Research the intent behind the user's request
- Create a hierarchical keyword strategy (themed ad groups with 10-20 keywords each)
- Use all 3 match types strategically: EXACT for high-intent, PHRASE for medium, BROAD for discovery
- Include campaign-level negative keywords to prevent waste from day 1
- Write compelling ad copy that follows platform constraints
- Suggest smart targeting and budget allocation

${isGoogle ? `GOOGLE ADS CONSTRAINTS:
- Headlines: max 30 characters each (count carefully including spaces)
- Descriptions: max 90 characters each
- No exclamation marks in headlines
- Create 3-5 themed ad groups with 10-20 keywords each
- Each ad group needs 15 headlines and 4 descriptions for RSA
- Include negative keywords per ad group AND campaign level` : `META ADS CONSTRAINTS:
- Headline: max 40 characters
- Primary text: max 125 chars recommended, 500 max
- Create 2-3 ad sets (equivalent to ad groups) by audience segment
- Focus on audience targeting (interests, behaviors, demographics)`}

CURRENCY: All budgets in INR (₹). Use Indian number formatting.

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation, no code fences):
{
  "campaignName": "descriptive name",
  "platform": "${platform}",
  "objective": "CONVERSIONS|AWARENESS|TRAFFIC|LEADS",
  "dailyBudget": <number in INR>,
  "biddingStrategy": "MAXIMIZE_CONVERSIONS|TARGET_CPA|TARGET_ROAS|MAXIMIZE_CLICKS",
  "targetLocations": ["city/state names"],
  "demographics": { "ageRange": "18-65", "gender": "ALL", "devices": ["MOBILE","DESKTOP"] },
  "adGroups": [
    {
      "name": "group name",
      "theme": "theme description",
      "keywords": [{ "text": "keyword", "matchType": "EXACT|PHRASE|BROAD" }],
      "negativeKeywords": ["negative term"],
      "ads": [${isGoogle
    ? '{ "headlines": ["h1","h2",...up to 15], "descriptions": ["d1","d2",...up to 4], "finalUrl": "https://..." }'
    : '{ "metaTitle": "headline", "metaBody": "primary text", "headlines": [], "descriptions": [] }'}]
    }
  ],
  "negativeKeywords": ["campaign-level negatives"],
  "rationale": "2-3 sentence strategy explanation",
  "estimatedReach": "estimated monthly reach",
  "estimatedCpa": "estimated CPA in INR"
}`;

  const msg = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text.trim() : "{}";
  const cleaned = raw
    .replace(/^```(?:json)?\n?/, "")
    .replace(/\n?```$/, "")
    .trim();

  const blueprint: CampaignBlueprintData = JSON.parse(cleaned);

  // Enforce constraints
  if (isGoogle) {
    for (const ag of blueprint.adGroups) {
      for (const ad of ag.ads) {
        ad.headlines = (ad.headlines || []).map((h) => h.slice(0, 30)).slice(0, 15);
        ad.descriptions = (ad.descriptions || []).map((d) => d.slice(0, 90)).slice(0, 4);
      }
    }
  } else {
    for (const ag of blueprint.adGroups) {
      for (const ad of ag.ads) {
        if (ad.metaTitle) ad.metaTitle = ad.metaTitle.slice(0, 40);
        if (ad.metaBody) ad.metaBody = ad.metaBody.slice(0, 500);
      }
    }
  }

  return blueprint;
}

/**
 * Refine an existing blueprint based on user feedback
 */
export async function refineBlueprint(
  currentBlueprint: CampaignBlueprintData,
  feedback: string
): Promise<CampaignBlueprintData> {
  const anthropic = getAnthropic();

  const msg = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    system: `You are refining a campaign blueprint based on user feedback. Return the COMPLETE updated blueprint as valid JSON (same structure as input). Apply the user's changes while maintaining the overall strategy quality. No markdown, no code fences.`,
    messages: [
      { role: "user", content: `Current blueprint:\n${JSON.stringify(currentBlueprint, null, 2)}\n\nUser feedback: ${feedback}\n\nReturn the updated complete blueprint as JSON.` },
    ],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text.trim() : "{}";
  const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  return JSON.parse(cleaned);
}
