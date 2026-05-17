import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exchangeCodeForTokens } from "@/lib/google-ads/oauth";
import { prisma } from "@/lib/prisma";
import { encryptToken } from "@/lib/encryption";
import { checkAccountLimit } from "@/lib/plan-limits";

/**
 * Google Ads OAuth callback.
 *
 * Flow:
 *   1. Exchange the authorization code for access + refresh tokens
 *   2. Store them encrypted in a PENDING connection row
 *   3. Redirect to /settings/connect-google, which discovers accessible
 *      accounts and lets the user pick which to link
 *
 * Account discovery + picker UI lives in /api/google-ads/discover and
 * /settings/connect-google so the user can re-run discovery without
 * re-doing OAuth.
 */
export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", baseUrl));
  }

  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(
      new URL("/settings?tab=connections&error=no_code", baseUrl)
    );
  }

  const limitCheck = await checkAccountLimit(session.user.id);
  if (!limitCheck.allowed) {
    return NextResponse.redirect(
      new URL(
        `/settings?tab=connections&error=plan_limit&current=${limitCheck.current}&limit=${limitCheck.limit}`,
        baseUrl
      )
    );
  }

  try {
    const rawTokens = await exchangeCodeForTokens(code);

    await prisma.googleAdsConnection.upsert({
      where: {
        userId_customerId: {
          userId: session.user.id,
          customerId: "PENDING",
        },
      },
      update: {
        refreshToken: encryptToken(rawTokens.refresh_token),
        accessToken: encryptToken(rawTokens.access_token),
        tokenExpiresAt: new Date(Date.now() + rawTokens.expires_in * 1000),
        isActive: false,
      },
      create: {
        userId: session.user.id,
        customerId: "PENDING",
        refreshToken: encryptToken(rawTokens.refresh_token),
        accessToken: encryptToken(rawTokens.access_token),
        tokenExpiresAt: new Date(Date.now() + rawTokens.expires_in * 1000),
        isActive: false,
      },
    });

    return NextResponse.redirect(new URL("/settings/connect-google", baseUrl));
  } catch (error) {
    console.error("Google Ads OAuth error:", error);
    return NextResponse.redirect(
      new URL("/settings?tab=connections&error=oauth_failed", baseUrl)
    );
  }
}
