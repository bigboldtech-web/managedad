import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptToken } from "@/lib/encryption";
import { exchangeCodeForTokens, listAdvertisers } from "@/lib/tiktok-ads/oauth";

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", baseUrl));
  }

  // CSRF state check
  const stateParam = req.nextUrl.searchParams.get("state");
  const stateCookie = req.cookies.get("tiktok_oauth_state")?.value;
  if (!stateParam || stateParam !== stateCookie) {
    return NextResponse.redirect(new URL("/settings?tab=connections&error=invalid_state", baseUrl));
  }

  const authCode = req.nextUrl.searchParams.get("auth_code") || req.nextUrl.searchParams.get("code");
  if (!authCode) {
    return NextResponse.redirect(new URL("/settings?tab=connections&error=no_code", baseUrl));
  }

  try {
    const tokens = await exchangeCodeForTokens(authCode);
    const accessToken = tokens.access_token;

    // Get advertiser accounts
    let advertisers: { advertiser_id: string; advertiser_name: string }[] = [];

    if (tokens.advertiser_ids && tokens.advertiser_ids.length > 0) {
      // Use the returned advertiser_ids directly
      advertisers = tokens.advertiser_ids.map((id) => ({
        advertiser_id: id,
        advertiser_name: `TikTok Ads ${id}`,
      }));
    } else {
      // Fall back to explicit list API
      advertisers = await listAdvertisers(accessToken);
    }

    // Save each advertiser as a connection
    for (const adv of advertisers) {
      await prisma.tikTokAdsConnection.upsert({
        where: {
          userId_advertiserId: {
            userId: session.user.id,
            advertiserId: adv.advertiser_id,
          },
        },
        create: {
          userId: session.user.id,
          advertiserId: adv.advertiser_id,
          accessToken: encryptToken(accessToken),
          refreshToken: tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
          accountName: adv.advertiser_name,
          isActive: true,
        },
        update: {
          accessToken: encryptToken(accessToken),
          refreshToken: tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
          accountName: adv.advertiser_name,
          isActive: true,
        },
      });
    }

    const response = NextResponse.redirect(
      new URL("/settings?tab=connections&connected=tiktok", baseUrl)
    );
    response.cookies.delete("tiktok_oauth_state");
    return response;
  } catch (error) {
    console.error("TikTok OAuth error:", error);
    return NextResponse.redirect(
      new URL("/settings?tab=connections&error=oauth_failed", baseUrl)
    );
  }
}
