import { getAnthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import { getWeekStart } from "@/lib/reviews/base";

export interface Recommendation {
  category: "NEW_CAMPAIGN" | "AUDIENCE_EXPANSION" | "BUDGET_SCALING" | "TARGETING" | "CREATIVE_REFRESH" | "COMPETITOR_DEFENSE" | "OPTIMIZATION";
  title: string;
  description: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  effort: "HIGH" | "MEDIUM" | "LOW";
  steps: string[];
}

/**
 * Generate weekly growth recommendations for a user based on their actual data
 */
export async function generateGrowthRecommendations(userId: string): Promise<{
  recommendations: Recommendation[];
  summary: string;
}> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [campaigns, last30Metrics, last7Metrics, latestAudit, recentReviews] = await Promise.all([
    prisma.campaign.findMany({
      where: { userId, status: { in: ["ACTIVE", "PAUSED"] } },
      select: {
        id: true, name: true, platform: true, status: true,
        dailyBudget: true, impressions: true, clicks: true,
        conversions: true, spend: true, revenue: true,
      },
      orderBy: { spend: "desc" },
      take: 15,
    }),
    prisma.dailyMetric.findMany({
      where: { campaign: { userId }, date: { gte: thirtyDaysAgo } },
      select: { date: true, spend: true, revenue: true, conversions: true, clicks: true, impressions: true },
    }),
    prisma.dailyMetric.findMany({
      where: { campaign: { userId }, date: { gte: sevenDaysAgo } },
      select: { spend: true, revenue: true, conversions: true },
    }),
    prisma.auditReport.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { score: true, summary: true },
    }),
    prisma.weeklyReview.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { reviewType: true, summary: true, actionsTaken: true },
    }),
  ]);

  if (campaigns.length === 0) {
    return {
      recommendations: [{
        category: "NEW_CAMPAIGN",
        title: "Create your first campaign",
        description: "Connect your ad accounts and create a campaign to get started. Use the AI Builder for the fastest setup.",
        impact: "HIGH", effort: "LOW",
        steps: ["Go to Campaigns → New Campaign", "Use AI Builder tab", "Describe your campaign goal", "Review and launch"],
      }],
      summary: "No active campaigns yet. Start by creating your first campaign using the AI Builder.",
    };
  }

  // Calculate metrics
  const total30Spend = last30Metrics.reduce((s, m) => s + Number(m.spend), 0);
  const total30Revenue = last30Metrics.reduce((s, m) => s + Number(m.revenue), 0);
  const total30Conversions = last30Metrics.reduce((s, m) => s + m.conversions, 0);
  const roas30 = total30Spend > 0 ? (total30Revenue / total30Spend).toFixed(2) : "0";
  const cpa30 = total30Conversions > 0 ? (total30Spend / total30Conversions).toFixed(0) : "N/A";

  const total7Spend = last7Metrics.reduce((s, m) => s + Number(m.spend), 0);
  const total7Revenue = last7Metrics.reduce((s, m) => s + Number(m.revenue), 0);
  const total7Conversions = last7Metrics.reduce((s, m) => s + m.conversions, 0);
  const roas7 = total7Spend > 0 ? (total7Revenue / total7Spend).toFixed(2) : "0";

  // Week-over-week change
  const prev7Spend = total30Spend - total7Spend;
  const prev7Conversions = total30Conversions - total7Conversions;
  const spendChange = prev7Spend > 0 ? ((total7Spend - prev7Spend / 3) / (prev7Spend / 3) * 100).toFixed(0) : "N/A";

  // Build campaign summary for AI
  const campaignLines = campaigns.slice(0, 10).map((c) => {
    const spend = Number(c.spend);
    const rev = Number(c.revenue);
    const roas = spend > 0 ? (rev / spend).toFixed(1) : "0";
    return `- [${c.platform}] "${c.name}" | Status: ${c.status} | Budget: ₹${Number(c.dailyBudget || 0).toLocaleString("en-IN")}/day | Spend: ₹${spend.toLocaleString("en-IN")} | ROAS: ${roas}x | Conv: ${c.conversions}`;
  }).join("\n");

  const reviewSummaries = recentReviews.map((r) => `${r.reviewType}: ${r.summary}`).join("\n");

  const anthropic = getAnthropic();

  const msg = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2000,
    system: `You are the world's best performance marketing strategist analyzing an Indian business's ad account to provide weekly growth recommendations.

Your job is to identify 4-6 specific, data-driven recommendations to help the business GROW. Think like a CMO:
- What new campaigns should they launch?
- Where should they increase investment?
- What audience segments are they missing?
- How can they improve conversion rates?
- What competitors are they losing to?

Every recommendation must reference specific numbers from the data. Be concrete — "Increase Mumbai Search budget by 30%" not "Consider increasing budget".

Return ONLY a valid JSON object with this structure (no markdown, no code fences):
{
  "recommendations": [
    {
      "category": "NEW_CAMPAIGN|AUDIENCE_EXPANSION|BUDGET_SCALING|TARGETING|CREATIVE_REFRESH|COMPETITOR_DEFENSE|OPTIMIZATION",
      "title": "short actionable title with numbers",
      "description": "2-3 sentences with specific data points and reasoning",
      "impact": "HIGH|MEDIUM|LOW",
      "effort": "HIGH|MEDIUM|LOW",
      "steps": ["step 1", "step 2", "step 3"]
    }
  ],
  "summary": "2-3 sentence executive summary for the business owner"
}`,
    messages: [{
      role: "user",
      content: `Weekly Growth Analysis:

Last 30 days: ₹${total30Spend.toLocaleString("en-IN")} spent | ${total30Conversions} conversions | ROAS: ${roas30}x | CPA: ₹${cpa30}
Last 7 days: ₹${total7Spend.toLocaleString("en-IN")} spent | ${total7Conversions} conversions | ROAS: ${roas7}x

Campaigns:
${campaignLines}

${latestAudit ? `Account health score: ${latestAudit.score}/100 — ${latestAudit.summary}` : "No audit data."}

Recent review findings:
${reviewSummaries || "No recent reviews."}

Generate 4-6 growth recommendations.`,
    }],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text.trim() : "{}";
  const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      recommendations: parsed.recommendations || [],
      summary: parsed.summary || `Analyzed ${campaigns.length} campaigns with ₹${total30Spend.toLocaleString("en-IN")} monthly spend.`,
    };
  } catch {
    return {
      recommendations: [],
      summary: `Analyzed ${campaigns.length} campaigns with ₹${total30Spend.toLocaleString("en-IN")} monthly spend. Unable to generate specific recommendations.`,
    };
  }
}

/**
 * Run recommendations for all active users
 */
export async function runWeeklyRecommendations(): Promise<number> {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { autonomousMode: true },
        { optimizationSettings: { isEnabled: true } },
      ],
    },
    select: { id: true },
  });

  const weekStart = getWeekStart();

  for (const user of users) {
    try {
      const { recommendations, summary } = await generateGrowthRecommendations(user.id);

      await prisma.growthRecommendation.upsert({
        where: {
          id: `${user.id}-${weekStart.toISOString().slice(0, 10)}`,
        },
        create: {
          userId: user.id,
          weekStart,
          recommendations: JSON.parse(JSON.stringify(recommendations)),
          summary,
          status: "ACTIVE",
        },
        update: {
          recommendations: JSON.parse(JSON.stringify(recommendations)),
          summary,
        },
      });
    } catch (err) {
      console.error(`Recommendations failed for user ${user.id}:`, err);
    }
  }

  return users.length;
}
