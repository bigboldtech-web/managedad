import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  exchangeCodeForToken,
  exchangeLongLivedToken,
} from "@/lib/meta-ads/oauth";
import { MetaAdsClient } from "@/lib/meta-ads/client";
import { prisma } from "@/lib/prisma";
import { encryptToken } from "@/lib/encryption";

export async function GET(req: NextRequest) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", baseUrl));
  }

  // CSRF state validation
  const stateParam = req.nextUrl.searchParams.get("state");
  const stateCookie = req.cookies.get("meta_oauth_state")?.value;

  if (!stateParam || !stateCookie || stateParam !== stateCookie) {
    return NextResponse.json(
      { error: "Invalid state parameter" },
      { status: 403 }
    );
  }

  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(
      new URL("/meta-ads?error=no_code", baseUrl)
    );
  }

  const errorParam = req.nextUrl.searchParams.get("error");
  if (errorParam) {
    return NextResponse.redirect(
      new URL(`/meta-ads?error=${errorParam}`, baseUrl)
    );
  }

  try {
    // Exchange code for short-lived token
    const shortLivedTokens = await exchangeCodeForToken(code);

    // Exchange for long-lived token (60 days)
    const longLivedTokens = await exchangeLongLivedToken(
      shortLivedTokens.access_token
    );

    // Get user's ad accounts
    const adAccountsResponse = await MetaAdsClient.listAdAccounts(
      longLivedTokens.access_token
    );

    if (adAccountsResponse.data.length === 0) {
      return NextResponse.redirect(
        new URL("/meta-ads?error=no_ad_accounts", baseUrl)
      );
    }

    // Store connections for each ad account
    for (const account of adAccountsResponse.data) {
      // account.id is in format "act_123456", extract just the number
      const adAccountId = account.account_id;

      await prisma.metaAdsConnection.upsert({
        where: {
          userId_adAccountId: {
            userId: session.user.id,
            adAccountId,
          },
        },
        update: {
          accessToken: encryptToken(longLivedTokens.access_token),
          tokenExpiresAt: new Date(
            Date.now() + longLivedTokens.expires_in * 1000
          ),
          accountName: account.name,
          businessId: account.business?.id || null,
          isActive: true,
        },
        create: {
          userId: session.user.id,
          adAccountId,
          accessToken: encryptToken(longLivedTokens.access_token),
          tokenExpiresAt: new Date(
            Date.now() + longLivedTokens.expires_in * 1000
          ),
          accountName: account.name,
          businessId: account.business?.id || null,
        },
      });
    }

    const successResponse = NextResponse.redirect(
      new URL("/meta-ads?connected=true", baseUrl)
    );
    successResponse.cookies.delete("meta_oauth_state");
    return successResponse;
  } catch (error) {
    console.error("Meta Ads OAuth error:", error);
    const errorResponse = NextResponse.redirect(
      new URL("/meta-ads?error=oauth_failed", baseUrl)
    );
    errorResponse.cookies.delete("meta_oauth_state");
    return errorResponse;
  }
}
