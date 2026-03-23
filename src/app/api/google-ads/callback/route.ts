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

    // Fetch accessible customer accounts using the new access token
    const listUrl = `https://googleads.googleapis.com/v18/customers:listAccessibleCustomers`;
    const listRes = await fetch(listUrl, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
      },
    });

    let customerIds: string[] = [];
    if (listRes.ok) {
      const listData = await listRes.json();
      customerIds = (listData.resourceNames || []).map((rn: string) =>
        rn.replace("customers/", "")
      );
    }

    // Fall back to placeholder if no customers found
    if (customerIds.length === 0) {
      customerIds = [req.nextUrl.searchParams.get("customer_id") || "0000000000"];
    }

    // Save each accessible customer account
    for (const rawId of customerIds) {
      const customerId = rawId.replace(/-/g, "");

      // Try to fetch account name
      let accountName: string | null = null;
      try {
        const detailRes = await fetch(
          `https://googleads.googleapis.com/v18/customers/${customerId}`,
          {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
            },
          }
        );
        if (detailRes.ok) {
          const detail = await detailRes.json();
          accountName = detail.descriptiveName || null;
        }
      } catch {
        // Account name is optional, continue without it
      }

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
          ...(accountName && { accountName }),
        },
        create: {
          userId: session.user.id,
          customerId,
          refreshToken: tokens.refresh_token,
          accessToken: tokens.access_token,
          tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          ...(accountName && { accountName }),
        },
      });
    }

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
