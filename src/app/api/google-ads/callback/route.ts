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
      // Inspect each accessible customer: identify manager accounts vs client
      // accounts. Manager accounts have no campaigns of their own, so we skip
      // saving them as billable connections; instead they become the
      // login-customer-id for any sub-accounts under them.
      type Resolved = {
        customerId: string;
        accountName: string | null;
        isManager: boolean;
      };
      const resolved: Resolved[] = [];

      for (const rawId of customerIds) {
        const customerId = rawId.replace(/-/g, "");
        let accountName: string | null = null;
        let isManager = false;

        try {
          const searchRes = await fetch(
            `https://googleads.googleapis.com/v19/customers/${customerId}/googleAds:search`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${tokens.access_token}`,
                "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
                "login-customer-id": customerId,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                query:
                  "SELECT customer.id, customer.descriptive_name, customer.manager FROM customer LIMIT 1",
              }),
            }
          );
          if (searchRes.ok) {
            const data = await searchRes.json();
            const row = data.results?.[0]?.customer;
            accountName = row?.descriptiveName || null;
            isManager = row?.manager === true;
          } else {
            const errorBody = await searchRes.text();
            console.error(
              `Customer ${customerId} inspect failed:`,
              searchRes.status,
              errorBody
            );
          }
        } catch (err) {
          console.error(`Customer ${customerId} inspect error:`, err);
        }

        resolved.push({ customerId, accountName, isManager });
      }

      // Pick a manager account (if any) to use as login-customer-id for clients.
      // Prefer the explicitly configured MCC, otherwise the first manager seen.
      const envManager = process.env.GOOGLE_ADS_MANAGER_ID?.replace(/-/g, "");
      const managerCustomerId =
        resolved.find((r) => r.isManager && r.customerId === envManager)
          ?.customerId ||
        resolved.find((r) => r.isManager)?.customerId ||
        null;

      const clients = resolved.filter((r) => !r.isManager);

      for (const client of clients) {
        await prisma.googleAdsConnection.upsert({
          where: {
            userId_customerId: {
              userId: session.user.id,
              customerId: client.customerId,
            },
          },
          update: {
            refreshToken: tokens.refresh_token_encrypted,
            accessToken: tokens.access_token_encrypted,
            tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
            isActive: true,
            managerAccountId: managerCustomerId,
            ...(client.accountName && { accountName: client.accountName }),
          },
          create: {
            userId: session.user.id,
            customerId: client.customerId,
            refreshToken: tokens.refresh_token_encrypted,
            accessToken: tokens.access_token_encrypted,
            tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
            managerAccountId: managerCustomerId,
            ...(client.accountName && { accountName: client.accountName }),
          },
        });
      }

      // If only a manager account was returned (no clients yet), drop to manual
      // setup so the user can pick which sub-account to link.
      if (clients.length === 0) {
        return NextResponse.redirect(
          new URL("/settings?tab=connections&setup=google_manual", baseUrl)
        );
      }

      return NextResponse.redirect(
        new URL("/settings?tab=connections&connected=google", baseUrl)
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
      new URL("/settings?tab=connections&setup=google_manual", baseUrl)
    );
  } catch (error) {
    console.error("Google Ads OAuth error:", error);
    return NextResponse.redirect(
      new URL("/settings?tab=connections&error=oauth_failed", baseUrl)
    );
  }
}
