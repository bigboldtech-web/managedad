"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, X, Info } from "lucide-react";

type Variant = "success" | "warning" | "error" | "info";

interface Banner {
  variant: Variant;
  title: string;
  body: string;
  showManualEntry?: boolean;
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
        "We've sent a manager-account link invitation to your Google Ads. Approve it in Google Ads → Tools → Account access → Managers, and we'll start syncing within an hour. If you're already managed by us, you're done.",
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
    return {
      variant: "warning",
      title: "Google connected — finish setup by entering your customer ID",
      body:
        "We couldn't auto-detect your Google Ads accounts. Paste your 10-digit customer ID below (find it in Google Ads UI, top-right of any page). We'll link the connection to it directly.",
      showManualEntry: true,
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
  if (error === "oauth_failed") {
    return {
      variant: "error",
      title: "Connection failed",
      body:
        "Something went wrong during the OAuth handshake. Common cause: clicking 'Cancel' on Google's verification warning. Try again — when you see 'Google hasn't verified this app,' click 'Advanced' → 'Go to ManagedAd'.",
    };
  }
  if (error) {
    return {
      variant: "error",
      title: "Something went wrong",
      body: `Error code: ${error}. Try reconnecting; if it persists, contact support.`,
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
  const [customerId, setCustomerId] = useState("");
  const [accountName, setAccountName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const banner = bannerForParams(new URLSearchParams(params.toString()));

  useEffect(() => {
    setDismissed(false);
    setSaveError(null);
  }, [params]);

  if (!banner || dismissed) return null;

  const style = VARIANT_STYLES[banner.variant];
  const Icon = style.Icon;

  const handleDismiss = () => {
    setDismissed(true);
    const newParams = new URLSearchParams(params.toString());
    ["connected", "setup", "error", "current", "limit"].forEach((k) => newParams.delete(k));
    const query = newParams.toString();
    router.replace(`/settings${query ? "?" + query : ""}`);
  };

  const handleManualSave = async () => {
    const sanitized = customerId.replace(/[-\s]/g, "");
    if (!/^\d{3,10}$/.test(sanitized)) {
      setSaveError("Customer ID must be 7-10 digits (dashes allowed, e.g. 123-456-7890)");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/google-ads/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: sanitized, accountName: accountName || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Save failed" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      router.replace("/settings?tab=connections&connected=google");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
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

        {banner.showManualEntry && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Customer ID (e.g. 123-456-7890)"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                disabled={saving}
                style={{
                  flex: "1 1 240px",
                  background: "#18181c",
                  border: "1px solid #27272e",
                  color: "#fafafa",
                  padding: "9px 12px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontFamily: "var(--font-ibm-plex-mono), monospace",
                  outline: "none",
                }}
              />
              <input
                type="text"
                placeholder="Account name (optional)"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                disabled={saving}
                style={{
                  flex: "1 1 200px",
                  background: "#18181c",
                  border: "1px solid #27272e",
                  color: "#fafafa",
                  padding: "9px 12px",
                  borderRadius: 8,
                  fontSize: 13,
                  outline: "none",
                }}
              />
              <button
                onClick={handleManualSave}
                disabled={saving || !customerId.trim()}
                style={{
                  background: saving || !customerId.trim() ? "#27272e" : "#f97316",
                  color: saving || !customerId.trim() ? "#71717a" : "#fff",
                  border: "none",
                  padding: "9px 18px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: saving || !customerId.trim() ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Saving…" : "Link account"}
              </button>
            </div>
            {saveError && (
              <div style={{ color: "#f87171", fontSize: 12 }}>{saveError}</div>
            )}
            <div style={{ color: "#52525b", fontSize: 11 }}>
              Customer ID is the 10-digit number in the top-right corner of your Google Ads UI (e.g.
              325-372-0007). Use either your MCC ID or a specific sub-account ID.
            </div>
          </div>
        )}
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
