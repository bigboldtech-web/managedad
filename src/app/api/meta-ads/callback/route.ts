import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  exchangeCodeForToken,
  exchangeLongLivedToken,
} from "@/lib/meta-ads/oauth";
import { prisma } from "@/lib/prisma";
import { encryptToken } from "@/lib/encryption";
import { checkAccountLimit } from "@/lib/plan-limits";

/**
 * Meta Ads OAuth callback.
 *
 * Flow:
 *   1. Validate CSRF state
 *   2. Exchange short-lived → long-lived access token (60-day expiry)
 *   3. Store the encrypted token in a PENDING connection row
 *   4. Redirect to /settings/connect-meta, which discovers accessible
 *      ad accounts and lets the user pick which to link
 */
export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", baseUrl));
  }

  // CSRF state validation
  const stateParam = req.nextUrl.searchParams.get("state");
  const stateCookie = req.cookies.get("meta_oauth_state")?.value;

  if (!stateParam || !stateCookie || stateParam !== stateCookie) {
    return NextResponse.redirect(
      new URL("/settings?tab=connections&error=invalid_state", baseUrl)
    );
  }

  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(
      new URL("/settings?tab=connections&error=no_code", baseUrl)
    );
  }

  const errorParam = req.nextUrl.searchParams.get("error");
  if (errorParam) {
    return NextResponse.redirect(
      new URL(`/settings?tab=connections&error=${errorParam}`, baseUrl)
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
    const shortLivedTokens = await exchangeCodeForToken(code);
    const longLivedTokens = await exchangeLongLivedToken(
      shortLivedTokens.access_token
    );

    await prisma.metaAdsConnection.upsert({
      where: {
        userId_adAccountId: {
          userId: session.user.id,
          adAccountId: "PENDING",
        },
      },
      update: {
        accessToken: encryptToken(longLivedTokens.access_token),
        tokenExpiresAt: new Date(Date.now() + longLivedTokens.expires_in * 1000),
        isActive: false,
        accountName: null,
        businessId: null,
      },
      create: {
        userId: session.user.id,
        adAccountId: "PENDING",
        accessToken: encryptToken(longLivedTokens.access_token),
        tokenExpiresAt: new Date(Date.now() + longLivedTokens.expires_in * 1000),
        isActive: false,
      },
    });

    const successResponse = NextResponse.redirect(
      new URL("/settings/connect-meta", baseUrl)
    );
    successResponse.cookies.delete("meta_oauth_state");
    return successResponse;
  } catch (error) {
    console.error("Meta Ads OAuth error:", error);
    const errorResponse = NextResponse.redirect(
      new URL("/settings?tab=connections&error=oauth_failed", baseUrl)
    );
    errorResponse.cookies.delete("meta_oauth_state");
    return errorResponse;
  }
}
