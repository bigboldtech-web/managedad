import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptToken } from "@/lib/encryption";
import { exchangeCodeForTokens, listAdAccounts } from "@/lib/linkedin-ads/oauth";

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", baseUrl));
  }

  // CSRF state check
  const stateParam = req.nextUrl.searchParams.get("state");
  const stateCookie = req.cookies.get("linkedin_oauth_state")?.value;
  if (!stateParam || stateParam !== stateCookie) {
    return NextResponse.redirect(new URL("/settings?tab=connections&error=invalid_state", baseUrl));
  }

  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/settings?tab=connections&error=no_code", baseUrl));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const accounts = await listAdAccounts(tokens.access_token);

    if (accounts.length === 0) {
      // Create a placeholder connection so the user knows OAuth succeeded
      return NextResponse.redirect(
        new URL("/settings?tab=connections&error=no_accounts", baseUrl)
      );
    }

    for (const account of accounts) {
      await prisma.linkedInAdsConnection.upsert({
        where: {
          userId_adAccountId: {
            userId: session.user.id,
            adAccountId: account.id,
          },
        },
        create: {
          userId: session.user.id,
          adAccountId: account.id,
          accessToken: encryptToken(tokens.access_token),
          refreshToken: tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
          tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          accountName: account.name,
          isActive: true,
        },
        update: {
          accessToken: encryptToken(tokens.access_token),
          refreshToken: tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
          tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          accountName: account.name,
          isActive: true,
        },
      });
    }

    const response = NextResponse.redirect(
      new URL("/settings?tab=connections&connected=linkedin", baseUrl)
    );
    response.cookies.delete("linkedin_oauth_state");
    return response;
  } catch (error) {
    console.error("LinkedIn OAuth error:", error);
    return NextResponse.redirect(
      new URL("/settings?tab=connections&error=oauth_failed", baseUrl)
    );
  }
}
