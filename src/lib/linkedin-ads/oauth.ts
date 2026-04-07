/**
 * LinkedIn Marketing Developer Platform OAuth flow.
 * Docs: https://learn.microsoft.com/en-us/linkedin/marketing/
 */

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_API_BASE = "https://api.linkedin.com/rest";
const LINKEDIN_SCOPES = "r_ads r_ads_reporting rw_ads";

export function isLinkedInConfigured(): boolean {
  return !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);
}

export function getLinkedInAuthUrl(state: string): string {
  const clientId = process.env.LINKEDIN_CLIENT_ID!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/linkedin-ads/callback`;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: LINKEDIN_SCOPES,
    state,
  });

  return `${LINKEDIN_AUTH_URL}?${params}`;
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}> {
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/linkedin-ads/callback`;

  const response = await fetch(LINKEDIN_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
  });

  if (!response.ok) {
    throw new Error(`LinkedIn token exchange failed: ${response.statusText}`);
  }

  return response.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const response = await fetch(LINKEDIN_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
  });

  if (!response.ok) {
    throw new Error(`LinkedIn token refresh failed: ${response.statusText}`);
  }

  return response.json();
}

export async function listAdAccounts(accessToken: string): Promise<
  { id: string; name: string }[]
> {
  const response = await fetch(
    `${LINKEDIN_API_BASE}/adAccounts?q=search&search=(status:(values:List(ACTIVE)))`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "LinkedIn-Version": "202401",
        "X-Restli-Protocol-Version": "2.0.0",
      },
    }
  );

  if (!response.ok) return [];

  const data = await response.json();
  return (data.elements || []).map((a: { id: number; name: string }) => ({
    id: String(a.id),
    name: a.name,
  }));
}
