import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptToken } from "@/lib/encryption";
import { MetaAdsClient } from "@/lib/meta-ads/client";

interface DiscoveredAdAccount {
  adAccountId: string;
  accountName: string | null;
  currency: string | null;
  accountStatus: number | null;
  businessId: string | null;
  businessName: string | null;
  alreadyConnected: boolean;
}

interface DiscoveryResult {
  state: "ready" | "no_accounts" | "no_pending" | "api_error";
  accounts: DiscoveredAdAccount[];
  errorCode?: string;
  errorDetail?: string;
}

/**
 * Discover Meta ad accounts accessible to the user's stored OAuth token.
 *
 * Strategy:
 *   1. Find the PENDING connection row (created by callback)
 *   2. Decrypt the long-lived access token
 *   3. Call /me/adaccounts via MetaAdsClient.listAdAccounts
 *   4. Flag accounts that are already connected so the picker can hide them
 */
export async function GET(): Promise<NextResponse<DiscoveryResult>> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { state: "api_error", accounts: [], errorCode: "unauthorized" },
      { status: 401 }
    );
  }

  const pending = await prisma.metaAdsConnection.findFirst({
    where: { userId: session.user.id, adAccountId: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  if (!pending) {
    return NextResponse.json({
      state: "no_pending",
      accounts: [],
      errorCode: "no_pending_connection",
      errorDetail:
        "No pending Meta connection found. Click 'Connect Meta Ads' first to start the OAuth flow.",
    });
  }

  let accessToken: string;
  try {
    accessToken = decryptToken(pending.accessToken);
  } catch (err) {
    return NextResponse.json({
      state: "api_error",
      accounts: [],
      errorCode: "decrypt_failed",
      errorDetail: err instanceof Error ? err.message : String(err),
    });
  }

  let adAccountsResponse;
  try {
    adAccountsResponse = await MetaAdsClient.listAdAccounts(accessToken);
  } catch (err) {
    return NextResponse.json({
      state: "api_error",
      accounts: [],
      errorCode: "meta_api_error",
      errorDetail: err instanceof Error ? err.message : String(err),
    });
  }

  if (!adAccountsResponse.data || adAccountsResponse.data.length === 0) {
    return NextResponse.json({
      state: "no_accounts",
      accounts: [],
      errorCode: "empty_response",
      errorDetail:
        "Meta returned 0 ad accounts for this Facebook sign-in. Usually means this Facebook user isn't assigned as an Admin or Advertiser on any Business Manager ad account.",
    });
  }

  // Flag which accounts are already connected so the picker can show them as such
  const existing = await prisma.metaAdsConnection.findMany({
    where: { userId: session.user.id, NOT: { adAccountId: "PENDING" } },
    select: { adAccountId: true },
  });
  const connectedSet = new Set(existing.map((c) => c.adAccountId));

  const discovered: DiscoveredAdAccount[] = adAccountsResponse.data.map((acc) => ({
    adAccountId: acc.account_id,
    accountName: acc.name ?? null,
    currency: acc.currency ?? null,
    accountStatus: acc.account_status ?? null,
    businessId: acc.business?.id ?? null,
    businessName: acc.business?.name ?? null,
    alreadyConnected: connectedSet.has(acc.account_id),
  }));

  return NextResponse.json({ state: "ready", accounts: discovered });
}
