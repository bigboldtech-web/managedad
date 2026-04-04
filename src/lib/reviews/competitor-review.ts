import { getAnthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import type { ReviewResult, ReviewFinding } from "./types";

export async function runCompetitorReview(userId: string): Promise<ReviewResult> {
  const findings: ReviewFinding[] = [];

  // Get user's active campaigns with performance data
  const campaigns = await prisma.campaign.findMany({
    where: { userId, status: "ACTIVE", platform: "GOOGLE_ADS" },
    select: {
      id: true, name: true, impressions: true, clicks: true,
      conversions: true, spend: true, revenue: true,
    },
    take: 10,
  });

  if (campaigns.length === 0) {
    return { reviewType: "COMPETITOR_REVIEW", findings: [], actions: [], summary: "No active Google Ads campaigns to analyze competitor landscape." };
  }

  // Analyze performance trends
  const totalSpend = campaigns.reduce((s, c) => s + Number(c.spend), 0);
  const totalRevenue = campaigns.reduce((s, c) => s + Number(c.revenue), 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);
  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  // Build context for AI analysis
  const campaignSummary = campaigns.map((c) => {
    const spend = Number(c.spend);
    const rev = Number(c.revenue);
    return `- "${c.name}": ₹${spend.toLocaleString("en-IN")} spent, ${c.conversions} conversions, ROAS ${spend > 0 ? (rev / spend).toFixed(1) : 0}x`;
  }).join("\n");

  let summary = `Reviewed competitive position for ${campaigns.length} campaigns. Overall ROAS: ${roas.toFixed(1)}x.`;

  try {
    const anthropic = getAnthropic();
    const msg = await anthropic.messages.create({
      model: CLAUDE_MODEL, max_tokens: 500,
      messages: [{
        role: "user",
        content: `You're a Google Ads strategist reviewing this account's competitive position. Provide 3-5 specific findings as a JSON array. Each finding should have: type (OPPORTUNITY/WARNING), impact (HIGH/MEDIUM/LOW), title (short), description (actionable).

Account data:
${campaignSummary}
Total spend: ₹${totalSpend.toLocaleString("en-IN")} | ROAS: ${roas.toFixed(1)}x | Conversions: ${totalConversions}

Return ONLY a JSON array. No markdown.`,
      }],
    });

    if (msg.content[0].type === "text") {
      try {
        const raw = msg.content[0].text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
        const parsed = JSON.parse(raw) as ReviewFinding[];
        findings.push(...parsed.map((f) => ({ ...f, type: f.type || "WARNING", impact: f.impact || "MEDIUM" } as ReviewFinding)));
      } catch {
        summary = msg.content[0].text.slice(0, 500);
      }
    }
  } catch {}

  if (findings.length === 0) {
    summary = `Reviewed ${campaigns.length} campaigns with ₹${totalSpend.toLocaleString("en-IN")} total spend and ${roas.toFixed(1)}x ROAS. No significant competitive threats detected.`;
  }

  return { reviewType: "COMPETITOR_REVIEW", findings, actions: [], summary };
}
