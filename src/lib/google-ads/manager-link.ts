/**
 * Google Ads MCC linking helper.
 *
 * When a customer connects via OAuth, their account isn't automatically
 * managed by our MCC. We need to call CustomerManagerLink to invite the
 * client account to join our manager. The customer then approves the
 * invitation inside their own Google Ads UI (Tools → Account access).
 *
 * Once approved, our developer-token + login-customer-id headers can act
 * on behalf of the client account.
 *
 * API ref: https://developers.google.com/google-ads/api/rest/reference/rest/v19/customers.customerManagerLinks/mutate
 */

const API_VERSION = "v19";
const BASE_URL = `https://googleads.googleapis.com/${API_VERSION}`;

interface LinkParams {
  /** Client account being invited (digits only, no dashes) */
  clientCustomerId: string;
  /** Our manager account (digits only, no dashes) */
  managerCustomerId: string;
  /** Fresh OAuth access token for the client account owner */
  accessToken: string;
}

export async function sendManagerLinkInvitation(
  params: LinkParams
): Promise<{ ok: boolean; alreadyLinked?: boolean; error?: string }> {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!developerToken) {
    return { ok: false, error: "missing GOOGLE_ADS_DEVELOPER_TOKEN" };
  }

  const url = `${BASE_URL}/customers/${params.clientCustomerId}/customerManagerLinks:mutate`;

  // The invitation is created by setting status = PENDING on the link
  // resource. The customer then approves it from their Google Ads UI.
  const body = {
    operations: [
      {
        create: {
          managerCustomer: `customers/${params.managerCustomerId}`,
          status: "PENDING",
        },
      },
    ],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "developer-token": developerToken,
      "login-customer-id": params.clientCustomerId,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (res.ok) {
    return { ok: true };
  }

  const errorBody = await res.text();

  // Google returns ALREADY_EXISTS / CUSTOMER_ALREADY_MANAGED if the link
  // is already in place — treat that as success.
  if (
    errorBody.includes("ALREADY") ||
    errorBody.includes("DUPLICATE") ||
    errorBody.includes("CUSTOMER_ALREADY_MANAGED")
  ) {
    return { ok: true, alreadyLinked: true };
  }

  return { ok: false, error: errorBody };
}
