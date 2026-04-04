import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAnthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { success: rlOk } = rateLimit(`comp-analyze:${session.user.id}`, 10, 15 * 60_000);
  if (!rlOk) {
    return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
  }

  const { competitors } = await req.json();
  if (!competitors?.length) return NextResponse.json({ analysis: "" });

  try {
    const anthropic = getAnthropic();

    const competitorSummary = competitors
      .slice(0, 5)
      .map(
        (c: { domain: string; overlapRate: number; posAbove: number; impressionShare: number }) =>
          `- ${c.domain}: ${c.overlapRate}% overlap, beats you ${c.posAbove}% of time, ${c.impressionShare}% imp share`
      )
      .join("\n");

    const msg = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: `You are a Google Ads strategist. Analyze these competitor auction insights and give 3 specific, actionable recommendations to improve competitive position. Be direct and tactical.\n\nCompetitors:\n${competitorSummary}\n\nReturn exactly 3 bullet points (•), each under 60 words.`,
        },
      ],
    });

    const analysis = (msg.content[0] as { type: string; text: string }).text || "";
    return NextResponse.json({ analysis });
  } catch (err) {
    console.error("Competitor analysis failed:", err);
    return NextResponse.json({ analysis: "" });
  }
}
