import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkAccountLimit } from "@/lib/plan-limits";
import { getTikTokAuthUrl, isTikTokConfigured } from "@/lib/tiktok-ads/oauth";
import crypto from "crypto";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Graceful "Coming Soon" when credentials not yet configured
  if (!isTikTokConfigured()) {
    return NextResponse.json(
      {
        error: "TikTok Ads integration coming soon. Our team is working on it.",
        comingSoon: true,
      },
      { status: 501 }
    );
  }

  const { allowed, current, limit } = await checkAccountLimit(session.user.id);
  if (!allowed) {
    return NextResponse.json(
      { error: `Ad account limit reached (${current}/${limit}). Upgrade your plan to connect more accounts.` },
      { status: 403 }
    );
  }

  const state = crypto.randomUUID();
  const authUrl = getTikTokAuthUrl(state);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("tiktok_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
