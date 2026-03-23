import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exchangeCodeForTokens } from "@/lib/google-ads/oauth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", baseUrl));
  }

  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(
      new URL("/google-ads?error=no_code", baseUrl)
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    // For now, use a placeholder customer ID
    // In production, we'd query accessible customers and let the user choose
    const customerId = req.nextUrl.searchParams.get("customer_id") || "000-000-0000";

    await prisma.googleAdsConnection.upsert({
      where: {
        userId_customerId: {
          userId: session.user.id,
          customerId,
        },
      },
      update: {
        refreshToken: tokens.refresh_token,
        accessToken: tokens.access_token,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        isActive: true,
      },
      create: {
        userId: session.user.id,
        customerId,
        refreshToken: tokens.refresh_token,
        accessToken: tokens.access_token,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });

    return NextResponse.redirect(
      new URL("/google-ads?connected=true", baseUrl)
    );
  } catch (error) {
    console.error("Google Ads OAuth error:", error);
    return NextResponse.redirect(
      new URL("/google-ads?error=oauth_failed", baseUrl)
    );
  }
}
