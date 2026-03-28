import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scoreFraud } from "@/lib/fraud/detector";

// Public endpoint — called by the JS tracking snippet
// POST /api/fraud/report?uid=USER_ID&cid=CAMPAIGN_ID
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("uid");
    const campaignId = searchParams.get("cid") || undefined;

    if (!userId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return NextResponse.json({ ok: false }, { status: 400 });

    const body = await req.json().catch(() => ({}));

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || body.ua || "";
    const referer = req.headers.get("referer") || body.ref || "";
    const country = req.headers.get("cf-ipcountry") || body.country || "";

    // Count recent clicks from this IP (last 60 min)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await prisma.clickEvent.count({
      where: {
        userId,
        ip,
        clickedAt: { gte: oneHourAgo },
      },
    });

    // Get campaign target countries for geo-mismatch check
    let targetCountries: string[] = [];
    if (campaignId) {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { targetLocations: true },
      });
      const locs = campaign?.targetLocations as { country?: string }[] | null;
      if (locs) targetCountries = locs.map((l) => l.country).filter(Boolean) as string[];
    }

    const result = scoreFraud(
      { ip, userAgent, referer, country, campaignTargetCountries: targetCountries },
      recentCount
    );

    // Store event
    const event = await prisma.clickEvent.create({
      data: {
        userId,
        campaignId: campaignId || null,
        ip,
        userAgent,
        referer,
        country,
        isBot: result.isBot,
        isFraud: result.isFraud,
        fraudScore: result.score,
        fraudReasons: result.reasons,
      },
    });

    // Auto-block if fraud score high
    if (result.isFraud) {
      await prisma.fraudBlock.upsert({
        where: { userId_ip: { userId, ip } },
        update: {
          clickCount: { increment: 1 },
          fraudScore: result.score,
          reason: result.reasons[0] || "Fraud detected",
          isActive: true,
        },
        create: {
          userId,
          ip,
          reason: result.reasons[0] || "Fraud detected",
          fraudScore: result.score,
          clickCount: 1,
        },
      });
    }

    return NextResponse.json({ ok: true, fraud: result.isFraud, score: result.score, eventId: event.id });
  } catch (error) {
    console.error("Fraud report error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
