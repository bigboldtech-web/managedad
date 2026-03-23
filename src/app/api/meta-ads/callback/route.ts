import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  exchangeCodeForToken,
  exchangeLongLivedToken,
} from "@/lib/meta-ads/oauth";
import { MetaAdsClient } from "@/lib/meta-ads/client";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(
      new URL("/meta-ads?error=no_code", req.url)
    );
  }

  const errorParam = req.nextUrl.searchParams.get("error");
  if (errorParam) {
    return NextResponse.redirect(
      new URL(`/meta-ads?error=${errorParam}`, req.url)
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
        new URL("/meta-ads?error=no_ad_accounts", req.url)
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
          accessToken: longLivedTokens.access_token,
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
          accessToken: longLivedTokens.access_token,
          tokenExpiresAt: new Date(
            Date.now() + longLivedTokens.expires_in * 1000
          ),
          accountName: account.name,
          businessId: account.business?.id || null,
        },
      });
    }

    return NextResponse.redirect(
      new URL("/meta-ads?connected=true", req.url)
    );
  } catch (error) {
    console.error("Meta Ads OAuth error:", error);
    return NextResponse.redirect(
      new URL("/meta-ads?error=oauth_failed", req.url)
    );
  }
}
