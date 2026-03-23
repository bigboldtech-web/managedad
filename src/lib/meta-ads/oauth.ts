const META_ADS_SCOPES = "ads_management,ads_read,business_management";

export function getMetaAuthUrl(): string {
  const clientId = process.env.META_APP_ID!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/meta-ads/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: META_ADS_SCOPES,
    response_type: "code",
    state: crypto.randomUUID(),
  });

  return `https://www.facebook.com/v22.0/dialog/oauth?${params}`;
}

export async function exchangeCodeForToken(code: string) {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/meta-ads/callback`,
    code,
  });

  const tokenResponse = await fetch(
    `https://graph.facebook.com/v22.0/oauth/access_token?${params}`
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
    `https://graph.facebook.com/v22.0/oauth/access_token?${params}`
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
