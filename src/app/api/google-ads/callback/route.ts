import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exchangeCodeForTokens } from "@/lib/google-ads/oauth";
import { prisma } from "@/lib/prisma";
import { encryptToken } from "@/lib/encryption";

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
    const rawTokens = await exchangeCodeForTokens(code);
    const tokens = {
      ...rawTokens,
      access_token_encrypted: encryptToken(rawTokens.access_token),
      refresh_token_encrypted: encryptToken(rawTokens.refresh_token),
    };

    // Try to fetch accessible customer accounts automatically
    let customerIds: string[] = [];
    try {
      const listUrl = `https://googleads.googleapis.com/v19/customers:listAccessibleCustomers`;
      const listRes = await fetch(listUrl, {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
        },
      });

      if (listRes.ok) {
        const listData = await listRes.json();
        console.log("Accessible customers response:", JSON.stringify(listData));
        customerIds = (listData.resourceNames || []).map((rn: string) =>
          rn.replace("customers/", "")
        );
      } else {
        const errorBody = await listRes.text();
        console.error("listAccessibleCustomers failed:", listRes.status, errorBody);
      }
    } catch (err) {
      console.error("listAccessibleCustomers error:", err);
    }

    if (customerIds.length > 0) {
      // Auto-save discovered accounts
      for (const rawId of customerIds) {
        const customerId = rawId.replace(/-/g, "");

        let accountName: string | null = null;
        try {
          const detailRes = await fetch(
            `https://googleads.googleapis.com/v19/customers/${customerId}`,
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
          // Account name is optional
        }

        await prisma.googleAdsConnection.upsert({
          where: {
            userId_customerId: {
              userId: session.user.id,
              customerId,
            },
          },
          update: {
            refreshToken: tokens.refresh_token_encrypted,
            accessToken: tokens.access_token_encrypted,
            tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
            isActive: true,
            ...(accountName && { accountName }),
          },
          create: {
            userId: session.user.id,
            customerId,
            refreshToken: tokens.refresh_token_encrypted,
            accessToken: tokens.access_token_encrypted,
            tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
            ...(accountName && { accountName }),
          },
        });
      }

      return NextResponse.redirect(
        new URL("/google-ads?connected=true", baseUrl)
      );
    }

    // API couldn't list accounts (test token) — store tokens temporarily
    // and redirect to manual entry page
    // Store tokens in a pending connection record
    await prisma.googleAdsConnection.upsert({
      where: {
        userId_customerId: {
          userId: session.user.id,
          customerId: "PENDING",
        },
      },
      update: {
        refreshToken: tokens.refresh_token_encrypted,
        accessToken: tokens.access_token_encrypted,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        isActive: false,
      },
      create: {
        userId: session.user.id,
        customerId: "PENDING",
        refreshToken: tokens.refresh_token_encrypted,
        accessToken: tokens.access_token_encrypted,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        isActive: false,
      },
    });

    return NextResponse.redirect(
      new URL("/google-ads?setup=enter_customer_id", baseUrl)
    );
  } catch (error) {
    console.error("Google Ads OAuth error:", error);
    return NextResponse.redirect(
      new URL("/google-ads?error=oauth_failed", baseUrl)
    );
  }
}
