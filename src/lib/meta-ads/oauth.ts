// Meta (Facebook) Ads OAuth
//
// Uses standard Facebook OAuth 2.0 with scope-based permissions, not the
// "Facebook Login for Business" config flow (which requires a specific
// config_id tied to a specific Meta App).
//
// Required permissions for Ads access:
//   - ads_management — read + write ads
//   - ads_read — read-only ad data (subset, included by ads_management)
//   - business_management — list ad accounts via /me/businesses
//
// Until the app is approved by Meta App Review, only emails listed as
// developers/testers on the app can grant these scopes.

const META_API_VERSION = "v22.0";
const META_SCOPES = ["ads_management", "ads_read", "business_management"].join(",");

export function getMetaAuthUrl(state: string): string {
  const clientId = process.env.META_APP_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!clientId) {
    throw new Error("META_APP_ID is not configured");
  }
  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured");
  }

  const redirectUri = `${appUrl}/api/meta-ads/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: META_SCOPES,
    response_type: "code",
    state,
  });

  return `https://www.facebook.com/${META_API_VERSION}/dialog/oauth?${params}`;
}

export async function exchangeCodeForToken(code: string) {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/meta-ads/callback`,
    code,
  });

  const tokenResponse = await fetch(
    `https://graph.facebook.com/${META_API_VERSION}/oauth/access_token?${params}`
  );

  if (!tokenResponse.ok) {
    const error = await tokenResponse.json();
    throw new Error(
      `Token exchange failed: ${error.error?.message || tokenResponse.statusText}`
    );
  }

  return tokenResponse.json() as Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
  }>;
}

export async function exchangeLongLivedToken(shortLivedToken: string) {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    fb_exchange_token: shortLivedToken,
  });

  const response = await fetch(
    `https://graph.facebook.com/${META_API_VERSION}/oauth/access_token?${params}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Long-lived token exchange failed: ${error.error?.message || response.statusText}`
    );
  }

  return response.json() as Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
  }>;
}
