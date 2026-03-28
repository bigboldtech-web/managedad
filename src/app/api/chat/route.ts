import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAnthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { checkFeatureAccess } from "@/lib/plan-limits";

// Pull a compact account snapshot for the AI context
async function buildAccountContext(userId: string): Promise<string> {
  const [campaigns, recentMetrics, pendingActions] = await Promise.all([
    prisma.campaign.findMany({
      where: { userId, status: { in: ["ACTIVE", "PAUSED"] } },
      select: {
        id: true,
        name: true,
        platform: true,
        status: true,
        dailyBudget: true,
        impressions: true,
        clicks: true,
        conversions: true,
        spend: true,
        revenue: true,
        currency: true,
      },
      orderBy: { spend: "desc" },
      take: 20,
    }),
    prisma.dailyMetric.findMany({
      where: {
        campaign: { userId },
        date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      select: { campaignId: true, date: true, spend: true, revenue: true, conversions: true, clicks: true, impressions: true },
      orderBy: { date: "desc" },
      take: 100,
    }),
    prisma.optimizationAction.findMany({
      where: {
        optimizationRun: { userId },
        status: "PENDING",
      },
      select: { actionType: true, description: true, campaignId: true },
      take: 10,
    }),
  ]);

  if (campaigns.length === 0) {
    return "No campaigns found. The user has not connected any ad accounts yet.";
  }

  const campaignRows = campaigns.map((c) => {
    const spend = Number(c.spend);
    const revenue = Number(c.revenue);
    const roas = spend > 0 ? (revenue / spend).toFixed(2) : "N/A";
    const ctr = Number(c.impressions) > 0
      ? ((Number(c.clicks) / Number(c.impressions)) * 100).toFixed(2)
      : "0";
    return `- [${c.platform}] "${c.name}" | Status: ${c.status} | Budget: ₹${Number(c.dailyBudget || 0).toLocaleString("en-IN")}/day | Spend: ₹${spend.toLocaleString("en-IN")} | ROAS: ${roas}x | CTR: ${ctr}% | Conversions: ${c.conversions}`;
  });

  // Aggregate totals
  const totalSpend = campaigns.reduce((s, c) => s + Number(c.spend), 0);
  const totalRevenue = campaigns.reduce((s, c) => s + Number(c.revenue), 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);
  const overallRoas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : "0";

  // 7-day trend
  const last7Spend = recentMetrics.reduce((s, m) => s + Number(m.spend), 0);
  const last7Conversions = recentMetrics.reduce((s, m) => s + m.conversions, 0);

  const pendingStr = pendingActions.length > 0
    ? `\n\nPending AI actions (awaiting approval):\n${pendingActions.map((a) => `- ${a.actionType}: ${a.description}`).join("\n")}`
    : "";

  return `Account summary (${campaigns.length} campaigns):
Overall ROAS: ${overallRoas}x | Total Spend: ₹${totalSpend.toLocaleString("en-IN")} | Total Conversions: ${totalConversions}
Last 7 days: ₹${last7Spend.toLocaleString("en-IN")} spend, ${last7Conversions} conversions

Campaigns:
${campaignRows.join("\n")}${pendingStr}`;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Plan limit check — "chat" feature required
  const { allowed, requiredPlan } = await checkFeatureAccess(session.user.id, "chat");
  if (!allowed) {
    return NextResponse.json(
      { error: `Upgrade to ${requiredPlan} plan to access AI Chat`, requiredPlan },
      { status: 403 }
    );
  }

  try {
    const { messages } = await req.json() as { messages: ChatMessage[] };
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }

    const accountContext = await buildAccountContext(session.user.id);

    const systemPrompt = `You are ManagedAd's AI performance marketing assistant. You have real-time access to the user's ad account data shown below.

${accountContext}

Your role:
- Answer questions about campaign performance with specific numbers from the data above
- Identify problems, waste, and opportunities in their account
- Recommend concrete, actionable optimisations with quantified impact estimates
- Speak like a senior performance marketer — precise, direct, data-driven
- All currency is INR. Use Indian number formatting (lakhs, not millions)
- Keep responses concise but complete. Use bullet points for lists
- When recommending actions, format them clearly so they can be actioned

At the END of your response, if you have 1-4 concrete recommended actions, append them as a JSON block in this exact format (no markdown, just the block):
ACTION_BUTTONS:[{"label":"<short action label>","type":"<success|warning|danger>","action":"<INCREASE_BUDGET|DECREASE_BUDGET|PAUSE_AD|PAUSE_KEYWORD|ADD_NEGATIVE_KEYWORD|ADJUST_BID>","campaignId":"<id or null>"}]

Only append ACTION_BUTTONS if there are real actions to take. Do not append if just explaining data.`;

    const stream = await getAnthropic().messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.slice(-10), // keep last 10 turns for context
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          let fullText = "";

          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const text = event.delta.text;
              fullText += text;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: "delta", text })}\n\n`
                )
              );
            }
          }

          // Extract action buttons if present
          const actionMatch = fullText.match(/ACTION_BUTTONS:(\[[\s\S]*?\])$/);
          let content = fullText;
          let actions: { label: string; type: string; action: string; campaignId: string | null }[] = [];

          if (actionMatch) {
            content = fullText.slice(0, actionMatch.index).trim();
            try {
              actions = JSON.parse(actionMatch[1]);
            } catch {
              // malformed — ignore actions
            }
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "done", content, actions })}\n\n`
            )
          );
          controller.close();
        } catch (err) {
          console.error("Stream processing error:", err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", message: "Stream interrupted" })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Failed to get AI response" }, { status: 500 });
  }
}
