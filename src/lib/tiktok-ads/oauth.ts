/**
 * TikTok Business API OAuth flow.
 * Docs: https://business-api.tiktok.com/portal/docs?id=1738373164380162
 */

const TIKTOK_AUTH_URL = "https://business-api.tiktok.com/portal/auth";
const TIKTOK_TOKEN_URL = "https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/";

export function isTikTokConfigured(): boolean {
  return !!(process.env.TIKTOK_APP_ID && process.env.TIKTOK_APP_SECRET);
}

export function getTikTokAuthUrl(state: string): string {
  const clientId = process.env.TIKTOK_APP_ID!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/tiktok-ads/callback`;

  const params = new URLSearchParams({
    app_id: clientId,
    redirect_uri: redirectUri,
    state,
  });

  return `${TIKTOK_AUTH_URL}?${params}`;
}

export async function exchangeCodeForTokens(authCode: string): Promise<{
  access_token: string;
  refresh_token?: string;
  advertiser_ids?: string[];
}> {
  const response = await fetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: process.env.TIKTOK_APP_ID,
      secret: process.env.TIKTOK_APP_SECRET,
      auth_code: authCode,
    }),
  });

  if (!response.ok) {
    throw new Error(`TikTok token exchange failed: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(`TikTok API error: ${data.message || "Unknown error"}`);
  }

  return {
    access_token: data.data?.access_token,
    refresh_token: data.data?.refresh_token,
    advertiser_ids: data.data?.advertiser_ids || [],
  };
}

export async function listAdvertisers(accessToken: string): Promise<
  { advertiser_id: string; advertiser_name: string }[]
> {
  const url = `https://business-api.tiktok.com/open_api/v1.3/oauth2/advertiser/get/?app_id=${process.env.TIKTOK_APP_ID}&secret=${process.env.TIKTOK_APP_SECRET}`;

  const response = await fetch(url, {
    headers: {
      "Access-Token": accessToken,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) return [];

  const data = await response.json();
  return data.data?.list || [];
}
