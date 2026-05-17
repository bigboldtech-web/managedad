"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, X, Info } from "lucide-react";

type Variant = "success" | "warning" | "error" | "info";

interface Banner {
  variant: Variant;
  title: string;
  body: string;
}

function bannerForParams(params: URLSearchParams): Banner | null {
  const connected = params.get("connected");
  const setup = params.get("setup");
  const error = params.get("error");

  if (connected === "google") {
    return {
      variant: "success",
      title: "Google Ads connected",
      body:
        "We'll start syncing your campaigns within the hour. If we linked a sub-account under your MCC, accept the manager link invitation in Google Ads → Tools → Account access → Managers.",
    };
  }
  if (connected === "meta") {
    return {
      variant: "success",
      title: "Meta Ads connected",
      body: "We'll start syncing your campaigns within the hour.",
    };
  }
  if (setup === "google_manual") {
    // Legacy URL — new flow uses /settings/connect-google. Banner kept for old links.
    return {
      variant: "info",
      title: "Google sign-in complete",
      body: "Continue to pick which Google Ads accounts to link.",
    };
  }
  if (error === "plan_limit") {
    const current = params.get("current");
    const limit = params.get("limit");
    return {
      variant: "error",
      title: "Plan limit reached",
      body: `You've already connected ${current} of ${limit} accounts on your current plan. Upgrade in Billing to connect more.`,
    };
  }
  if (error === "no_code") {
    return {
      variant: "error",
      title: "Connection cancelled",
      body: "You closed the consent window before granting access. Click Connect again to retry.",
    };
  }
  if (error === "no_ad_accounts") {
    return {
      variant: "warning",
      title: "No ad accounts found",
      body:
        "We couldn't find any active ad accounts under the profile you connected. Make sure you're signed into the right Google/Meta account, then try again.",
    };
  }
  if (error === "user_denied" || error === "access_denied") {
    return {
      variant: "warning",
      title: "Permission not granted",
      body:
        "You declined permissions on the consent screen, or canceled the OAuth dialog. Click Connect again — and on the consent screen, accept all requested permissions (we need them to read campaign data and apply changes).",
    };
  }
  if (error === "invalid_state") {
    return {
      variant: "error",
      title: "Session expired during connect",
      body:
        "The OAuth flow timed out or was opened in a different browser tab. Click Connect again — this time complete the consent within 10 minutes in the same tab.",
    };
  }
  if (error === "oauth_failed") {
    const detail = params.get("detail");
    return {
      variant: "error",
      title: "Connection failed",
      body: detail
        ? `Reason: ${detail}. Try again — and if it persists, double-check the Meta App's Valid OAuth Redirect URIs include https://managedad.com/api/meta-ads/callback or https://www.managedad.com/api/meta-ads/callback.`
        : "Something went wrong during the OAuth handshake. Try again — when you see 'Google hasn't verified this app,' click 'Advanced' → 'Go to ManagedAd'.",
    };
  }
  if (error) {
    const detail = params.get("detail");
    return {
      variant: "error",
      title: "Something went wrong",
      body: detail
        ? `Error code: ${error}. ${detail}`
        : `Error code: ${error}. Try reconnecting; if it persists, contact support.`,
    };
  }
  return null;
}

const VARIANT_STYLES: Record<Variant, { bg: string; border: string; color: string; Icon: typeof CheckCircle2 }> = {
  success: { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.3)", color: "#86efac", Icon: CheckCircle2 },
  warning: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)", color: "#fbbf24", Icon: AlertTriangle },
  error: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.3)", color: "#f87171", Icon: AlertTriangle },
  info: { bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.3)", color: "#93c5fd", Icon: Info },
};

export default function OAuthResultBanner() {
  const params = useSearchParams();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const banner = bannerForParams(new URLSearchParams(params.toString()));

  useEffect(() => {
    setDismissed(false);
  }, [params]);

  if (!banner || dismissed) return null;

  const style = VARIANT_STYLES[banner.variant];
  const Icon = style.Icon;

  const handleDismiss = () => {
    setDismissed(true);
    const newParams = new URLSearchParams(params.toString());
    ["connected", "setup", "error", "current", "limit", "detail"].forEach((k) => newParams.delete(k));
    const query = newParams.toString();
    router.replace(`/settings${query ? "?" + query : ""}`);
  };

  return (
    <div
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: 10,
        padding: 16,
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      <Icon size={18} color={style.color} style={{ marginTop: 2, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ color: style.color, fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
          {banner.title}
        </div>
        <div style={{ color: "#a1a1aa", fontSize: 13, lineHeight: 1.55 }}>{banner.body}</div>
      </div>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        style={{
          background: "transparent",
          border: "none",
          color: "#71717a",
          cursor: "pointer",
          padding: 2,
          flexShrink: 0,
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
