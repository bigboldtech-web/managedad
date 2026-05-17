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
 *   1. Validate CSRF state — clear cookie on any error
 *   2. Exchange short-lived → long-lived access token (60-day expiry)
 *   3. Store the encrypted token in a PENDING connection row (overwrites
 *      any stale PENDING from a previous failed attempt)
 *   4. Redirect to /settings/connect-meta
 *
 * Invariant: every exit path (success OR failure) must clear the
 * `meta_oauth_state` cookie so the next Connect attempt is clean.
 */
export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  const exit = (target: string) => {
    const response = NextResponse.redirect(new URL(target, baseUrl));
    response.cookies.delete("meta_oauth_state");
    return response;
  };

  const session = await auth();
  if (!session?.user?.id) {
    return exit("/login");
  }

  // CSRF state validation
  const stateParam = req.nextUrl.searchParams.get("state");
  const stateCookie = req.cookies.get("meta_oauth_state")?.value;

  if (!stateParam || !stateCookie || stateParam !== stateCookie) {
    return exit("/settings?tab=connections&error=invalid_state");
  }

  // Facebook returns error params when user denies / cancels OR something
  // upstream rejected the auth (app config issue, permissions issue, etc.).
  // Surface the human-readable reason if Facebook gave us one.
  const errorParam = req.nextUrl.searchParams.get("error");
  const errorReason = req.nextUrl.searchParams.get("error_reason");
  const errorDescription = req.nextUrl.searchParams.get("error_description");
  if (errorParam) {
    const code =
      errorReason === "user_denied"
        ? "user_denied"
        : errorParam === "access_denied"
          ? "access_denied"
          : errorParam;
    // Pass through Facebook's description if present so the banner can
    // show "you need ads_management permission" or similar.
    const url = errorDescription
      ? `/settings?tab=connections&error=${code}&detail=${encodeURIComponent(errorDescription.slice(0, 240))}`
      : `/settings?tab=connections&error=${code}`;
    return exit(url);
  }

  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return exit("/settings?tab=connections&error=no_code");
  }

  const limitCheck = await checkAccountLimit(session.user.id);
  if (!limitCheck.allowed) {
    return exit(
      `/settings?tab=connections&error=plan_limit&current=${limitCheck.current}&limit=${limitCheck.limit}`
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

    return exit("/settings/connect-meta");
  } catch (error) {
    console.error("Meta Ads OAuth error:", error);
    const detail =
      error instanceof Error ? encodeURIComponent(error.message.slice(0, 240)) : "";
    const url = detail
      ? `/settings?tab=connections&error=oauth_failed&detail=${detail}`
      : "/settings?tab=connections&error=oauth_failed";
    return exit(url);
  }
}
