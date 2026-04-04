import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAnthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { checkFeatureAccess } from "@/lib/plan-limits";
import { rateLimit } from "@/lib/rate-limit";

export interface GeneratedVariant {
  headlines: string[];    // Google RSA: up to 15, max 30 chars each
  descriptions: string[]; // Google RSA: up to 4, max 90 chars each
  metaBody?: string;      // Meta: primary text, max 125 chars recommended
  metaTitle?: string;     // Meta: headline, max 40 chars
  platform: "GOOGLE_ADS" | "META_ADS";
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success: rlOk } = rateLimit(`creative-gen:${session.user.id}`, 10, 15 * 60_000);
  if (!rlOk) {
    return NextResponse.json({ error: "Too many generation requests. Please wait." }, { status: 429 });
  }

  // Plan limit check — "creative_generation" feature required
  const { allowed, requiredPlan } = await checkFeatureAccess(session.user.id, "creative_generation");
  if (!allowed) {
    return NextResponse.json(
      { error: `Upgrade to ${requiredPlan} plan to access Creative Generation`, requiredPlan },
      { status: 403 }
    );
  }

  const { adId, count = 5 } = await req.json() as { adId: string; count?: number };
  if (!adId) {
    return NextResponse.json({ error: "adId required" }, { status: 400 });
  }

  // Load the ad with its campaign context
  const ad = await prisma.ad.findFirst({
    where: { id: adId, campaign: { userId: session.user.id } },
    include: {
      campaign: {
        select: {
          name: true,
          platform: true,
          impressions: true,
          clicks: true,
          conversions: true,
          spend: true,
          revenue: true,
        },
      },
    },
  });

  if (!ad) {
    return NextResponse.json({ error: "Ad not found" }, { status: 404 });
  }

  const platform = ad.campaign.platform;
  const campaign = ad.campaign;
  const spend = Number(campaign.spend);
  const revenue = Number(campaign.revenue);
  const roas = spend > 0 ? (revenue / spend).toFixed(2) : "N/A";
  const ctr = Number(campaign.impressions) > 0
    ? ((Number(campaign.clicks) / Number(campaign.impressions)) * 100).toFixed(2)
    : "0";

  // Build context from the existing ad
  const existingAd = {
    name: ad.name,
    type: ad.type,
    headlines: ad.headlines,
    descriptions: ad.descriptions,
    finalUrl: ad.finalUrl,
    ctr: `${ctr}%`,
    roas: `${roas}x`,
    conversions: campaign.conversions,
  };

  const isGoogle = platform === "GOOGLE_ADS";

  const systemPrompt = isGoogle
    ? `You are an expert Google Ads copywriter specialising in Responsive Search Ads (RSAs) for Indian businesses. All prices are in INR.

HARD CONSTRAINTS (violations will be rejected by Google Ads):
- Each headline: max 30 characters (including spaces). Count carefully.
- Each description: max 90 characters (including spaces). Count carefully.
- No exclamation marks in headlines.
- No superlatives (best, #1, etc.) without proof claims.
- No URLs in ad copy.

BEST PRACTICES:
- Include keywords naturally in headlines
- Lead with value proposition in first 2 headlines
- Use numbers/prices where possible (₹, EMI amounts, discount %)
- Include a clear CTA in at least one description
- Vary the angle across headlines (price, quality, urgency, features, trust)

Generate ${count} distinct RSA variations. Each must have exactly 15 headlines and 4 descriptions.`
    : `You are an expert Meta Ads copywriter for Indian businesses. All prices are in INR.

CONSTRAINTS:
- Primary text (body): max 125 characters recommended, max 500 hard limit
- Headline: max 40 characters
- No misleading claims, no before/after health claims.

BEST PRACTICES:
- Hook in first 3 words — scroll-stopping opening
- Problem → Agitation → Solution structure
- Social proof where possible
- Clear CTA
- Use emojis sparingly and only where natural

Generate ${count} distinct ad copy variations. Each must have a headline and primary body text.`;

  const userPrompt = `Campaign: "${campaign.name}" on ${platform}
Current performance: CTR ${existingAd.ctr} | ROAS ${existingAd.roas} | ${existingAd.conversions} conversions
Existing ad name: ${existingAd.name ?? "unnamed"}
Existing headlines: ${JSON.stringify(existingAd.headlines)}
Existing descriptions: ${JSON.stringify(existingAd.descriptions)}
Landing page: ${existingAd.finalUrl ?? "not set"}

Generate ${count} improved variations that outperform the existing ad.
Return ONLY a valid JSON array. No markdown, no explanation.

${isGoogle ? `Format:
[
  {
    "headlines": ["<30char>", "...", ... up to 15],
    "descriptions": ["<90char>", "...", up to 4]
  }
]` : `Format:
[
  {
    "metaTitle": "<40char headline>",
    "metaBody": "<primary text body>"
  }
]`}`;

  try {
    const response = await getAnthropic().messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "[]";
    const json = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const parsed: Record<string, unknown>[] = JSON.parse(json);

    const variants: GeneratedVariant[] = parsed.map((v) => {
      if (isGoogle) {
        const headlines = (v.headlines as string[] ?? []).map((h) => h.slice(0, 30));
        const descriptions = (v.descriptions as string[] ?? []).map((d) => d.slice(0, 90));
        return { platform: "GOOGLE_ADS", headlines, descriptions };
      } else {
        return {
          platform: "META_ADS",
          headlines: [],
          descriptions: [],
          metaTitle: (v.metaTitle as string ?? "").slice(0, 40),
          metaBody: (v.metaBody as string ?? "").slice(0, 500),
        };
      }
    });

    return NextResponse.json({ variants, adId, platform });
  } catch (err) {
    console.error("Creative generation error:", err);
    return NextResponse.json({ error: "Failed to generate creative variations" }, { status: 500 });
  }
}
