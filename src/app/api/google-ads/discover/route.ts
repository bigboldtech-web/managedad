import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptToken } from "@/lib/encryption";
import { refreshAccessToken } from "@/lib/google-ads/oauth";

interface DiscoveredAccount {
  customerId: string;
  accountName: string | null;
  isManager: boolean;
  isAccessible: boolean;
}

interface DiscoveryResult {
  state: "ready" | "no_accounts" | "no_pending" | "api_error";
  accounts: DiscoveredAccount[];
  errorCode?: string;
  errorDetail?: string;
  diagnostic?: {
    httpStatus?: number;
    apiResponse?: unknown;
  };
}

/**
 * Discover ad accounts accessible to the user's stored OAuth token.
 *
 * Strategy:
 *   1. Find the PENDING connection row (created by OAuth callback)
 *   2. Decrypt the access token; refresh if expired
 *   3. Call listAccessibleCustomers
 *   4. For each returned customer, inspect customer.manager flag
 *   5. Return ranked list with diagnostic info on failure
 */
export async function GET(): Promise<NextResponse<DiscoveryResult>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { state: "api_error", accounts: [], errorCode: "unauthorized" },
      { status: 401 }
    );
  }

  const pending = await prisma.googleAdsConnection.findFirst({
    where: { userId: session.user.id, customerId: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  if (!pending) {
    return NextResponse.json({
      state: "no_pending",
      accounts: [],
      errorCode: "no_pending_connection",
      errorDetail:
        "No pending Google connection found. Click 'Connect Google Ads' first to start the OAuth flow.",
    });
  }

  let accessToken: string;
  try {
    accessToken = decryptToken(pending.accessToken ?? "");
  } catch (err) {
    return NextResponse.json({
      state: "api_error",
      accounts: [],
      errorCode: "decrypt_failed",
      errorDetail: err instanceof Error ? err.message : String(err),
    });
  }

  // Refresh the token if it's about to expire
  if (pending.tokenExpiresAt && pending.tokenExpiresAt.getTime() < Date.now() + 60_000) {
    try {
      const refreshToken = decryptToken(pending.refreshToken);
      const refreshed = await refreshAccessToken(refreshToken);
      accessToken = refreshed.access_token;
    } catch (err) {
      return NextResponse.json({
        state: "api_error",
        accounts: [],
        errorCode: "refresh_failed",
        errorDetail: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!developerToken) {
    return NextResponse.json({
      state: "api_error",
      accounts: [],
      errorCode: "missing_developer_token",
      errorDetail: "Server is misconfigured — GOOGLE_ADS_DEVELOPER_TOKEN is unset.",
    });
  }

  // 1. List accessible customers
  const listUrl = "https://googleads.googleapis.com/v20/customers:listAccessibleCustomers";
  const listRes = await fetch(listUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": developerToken,
    },
  });

  if (!listRes.ok) {
    const body = await listRes.text();
    return NextResponse.json({
      state: "api_error",
      accounts: [],
      errorCode: `google_api_${listRes.status}`,
      errorDetail: body.slice(0, 500),
      diagnostic: { httpStatus: listRes.status },
    });
  }

  const listData = (await listRes.json()) as { resourceNames?: string[] };
  const customerIds = (listData.resourceNames ?? []).map((rn) =>
    rn.replace("customers/", "")
  );

  if (customerIds.length === 0) {
    return NextResponse.json({
      state: "no_accounts",
      accounts: [],
      errorCode: "empty_response",
      errorDetail:
        "Google's API returned 0 accessible accounts for this Google sign-in. Usually means the signed-in Google account isn't an Admin or Standard user on any Google Ads account.",
    });
  }

  // 2. Inspect each customer to determine name + manager status
  const discovered: DiscoveredAccount[] = [];
  for (const cid of customerIds) {
    let accountName: string | null = null;
    let isManager = false;
    let isAccessible = true;

    try {
      const searchRes = await fetch(
        `https://googleads.googleapis.com/v20/customers/${cid}/googleAds:search`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "developer-token": developerToken,
            "login-customer-id": cid,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query:
              "SELECT customer.id, customer.descriptive_name, customer.manager FROM customer LIMIT 1",
          }),
        }
      );
      if (searchRes.ok) {
        const data = (await searchRes.json()) as {
          results?: { customer?: { descriptiveName?: string; manager?: boolean } }[];
        };
        const row = data.results?.[0]?.customer;
        accountName = row?.descriptiveName ?? null;
        isManager = row?.manager === true;
      } else {
        isAccessible = false;
      }
    } catch {
      isAccessible = false;
    }

    discovered.push({ customerId: cid, accountName, isManager, isAccessible });
  }

  return NextResponse.json({
    state: "ready",
    accounts: discovered,
  });
}
