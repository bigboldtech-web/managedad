"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Check,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  ChevronDown,
} from "lucide-react";

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

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: 12 },
};

// Meta account status: 1 = ACTIVE, 2 = DISABLED, 3 = UNSETTLED, 7 = PENDING_RISK_REVIEW,
// 8 = PENDING_SETTLEMENT, 9 = IN_GRACE_PERIOD, 100 = PENDING_CLOSURE, 101 = CLOSED, etc.
const STATUS_LABELS: Record<number, string> = {
  1: "Active",
  2: "Disabled",
  3: "Unsettled",
  7: "Pending review",
  8: "Pending settlement",
  9: "In grace period",
  100: "Pending closure",
  101: "Closed",
};

export default function ConnectMetaPage() {
  const router = useRouter();
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const discover = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/meta-ads/discover");
      const data = (await res.json()) as DiscoveryResult;
      setResult(data);
      if (data.state === "ready") {
        // Pre-select active, not-yet-connected accounts
        const auto = new Set(
          data.accounts
            .filter((a) => !a.alreadyConnected && a.accountStatus === 1)
            .map((a) => a.adAccountId)
        );
        setSelected(auto);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Discovery failed");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    discover();
  }, [discover]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleLinkSelected = async () => {
    if (selected.size === 0) {
      setError("Pick at least one ad account to link.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const targets = (result?.accounts ?? [])
        .filter((a) => selected.has(a.adAccountId))
        .map((a) => ({
          adAccountId: a.adAccountId,
          accountName: a.accountName ?? undefined,
          businessId: a.businessId ?? null,
        }));
      const res = await fetch("/api/meta-ads/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adAccountIds: targets }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      router.replace("/settings?tab=connections&connected=meta");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 32, color: "#e4e4e7", maxWidth: 720, margin: "0 auto" }}>
      <button
        onClick={() => router.push("/settings?tab=connections")}
        style={{
          background: "transparent",
          border: "none",
          color: "#71717a",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          marginBottom: 20,
          padding: 0,
        }}
      >
        <ArrowLeft size={14} /> Back to connections
      </button>

      <h1 style={{ fontSize: 26, fontWeight: 600, marginBottom: 6 }}>
        Connect Meta Ads
      </h1>
      <p style={{ color: "#71717a", fontSize: 14, marginBottom: 24 }}>
        Your Facebook sign-in was successful. Select which Meta ad accounts to link.
      </p>

      {loading && (
        <div style={{ ...S.card, padding: 40, textAlign: "center" }}>
          <Loader2 size={20} color="#1877F2" style={{ animation: "spin 0.8s linear infinite" }} />
          <div style={{ marginTop: 12, color: "#71717a", fontSize: 13 }}>
            Looking up your ad accounts…
          </div>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {!loading && result?.state === "no_pending" && (
        <ErrorCard
          title="No pending Meta connection"
          body="Start fresh — click below to begin the Facebook OAuth flow."
          cta={{ label: "Connect Meta Ads", href: "/api/meta-ads/connect" }}
        />
      )}

      {!loading && result?.state === "api_error" && (
        <ErrorCard
          title="Couldn't reach Meta's API"
          body={result.errorDetail ?? "Unknown error from Meta's Graph API."}
          errorCode={result.errorCode}
          onRetry={discover}
        />
      )}

      {!loading && result?.state === "no_accounts" && (
        <NoAccountsHelp
          showHelp={showHelp}
          setShowHelp={setShowHelp}
          onRetry={discover}
        />
      )}

      {!loading && result?.state === "ready" && (
        <>
          <div style={{ ...S.card, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 14 }}>
              We found <strong style={{ color: "#fafafa" }}>{result.accounts.length}</strong> ad account
              {result.accounts.length === 1 ? "" : "s"} you can manage with ManagedAd.
              Already-connected and disabled accounts are toggled off by default.
            </div>

            {result.accounts.map((acc) => (
              <label
                key={acc.adAccountId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  background: selected.has(acc.adAccountId) ? "rgba(24,119,242,0.08)" : "#0e0e10",
                  border: "1px solid",
                  borderColor: selected.has(acc.adAccountId) ? "#1877F2" : "#27272e",
                  borderRadius: 8,
                  marginBottom: 8,
                  cursor: acc.alreadyConnected ? "not-allowed" : "pointer",
                  opacity: acc.alreadyConnected ? 0.5 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(acc.adAccountId)}
                  onChange={() => toggle(acc.adAccountId)}
                  disabled={acc.alreadyConnected}
                  style={{ accentColor: "#1877F2", width: 16, height: 16 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: "#fafafa", fontWeight: 600 }}>
                    {acc.accountName || `Ad account ${acc.adAccountId}`}
                    {acc.alreadyConnected && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 10,
                          background: "rgba(52,211,153,0.15)",
                          color: "#34d399",
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontWeight: 600,
                          letterSpacing: 0.5,
                        }}
                      >
                        CONNECTED
                      </span>
                    )}
                    {acc.accountStatus != null && acc.accountStatus !== 1 && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 10,
                          background: "rgba(248,113,113,0.15)",
                          color: "#f87171",
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontWeight: 600,
                          letterSpacing: 0.5,
                        }}
                      >
                        {(STATUS_LABELS[acc.accountStatus] || `STATUS ${acc.accountStatus}`).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#71717a",
                      fontFamily: "var(--font-ibm-plex-mono), monospace",
                    }}
                  >
                    ID: {acc.adAccountId}
                    {acc.currency && (
                      <span style={{ marginLeft: 10, fontFamily: "inherit" }}>· {acc.currency}</span>
                    )}
                    {acc.businessName && (
                      <span style={{ marginLeft: 10, fontFamily: "inherit" }}>
                        · {acc.businessName}
                      </span>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>

          {error && (
            <div
              style={{
                ...S.card,
                padding: 12,
                marginBottom: 12,
                borderColor: "rgba(239,68,68,0.3)",
                background: "rgba(239,68,68,0.08)",
                color: "#f87171",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleLinkSelected}
              disabled={saving || selected.size === 0}
              style={{
                background: saving || selected.size === 0 ? "#27272e" : "#1877F2",
                color: saving || selected.size === 0 ? "#71717a" : "#fff",
                border: "none",
                padding: "10px 20px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: saving || selected.size === 0 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {saving ? (
                <>
                  <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> Linking…
                </>
              ) : (
                <>
                  <Check size={14} /> Link {selected.size} account{selected.size === 1 ? "" : "s"}
                </>
              )}
            </button>
            <button
              onClick={discover}
              disabled={saving}
              style={{
                background: "transparent",
                color: "#a1a1aa",
                border: "1px solid #3f3f46",
                padding: "10px 16px",
                borderRadius: 8,
                fontSize: 13,
                cursor: saving ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <RefreshCw size={13} /> Rescan
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ErrorCard({
  title,
  body,
  errorCode,
  onRetry,
  cta,
}: {
  title: string;
  body: string;
  errorCode?: string;
  onRetry?: () => void;
  cta?: { label: string; href: string };
}) {
  return (
    <div
      style={{
        ...S.card,
        padding: 24,
        borderColor: "rgba(239,68,68,0.3)",
        background: "rgba(239,68,68,0.05)",
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <AlertCircle size={20} color="#f87171" style={{ marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          <div style={{ color: "#f87171", fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
            {title}
          </div>
          <div style={{ color: "#a1a1aa", fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
            {body}
          </div>
          {errorCode && (
            <div
              style={{
                fontSize: 11,
                color: "#71717a",
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                marginBottom: 12,
              }}
            >
              Error code: {errorCode}
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            {onRetry && (
              <button
                onClick={onRetry}
                style={{
                  background: "#f87171",
                  color: "#0a0a0a",
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
            )}
            {cta && (
              <a
                href={cta.href}
                style={{
                  background: "#1877F2",
                  color: "#fff",
                  padding: "8px 14px",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                {cta.label}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NoAccountsHelp({
  showHelp,
  setShowHelp,
  onRetry,
}: {
  showHelp: boolean;
  setShowHelp: (v: boolean) => void;
  onRetry: () => void;
}) {
  return (
    <div
      style={{
        ...S.card,
        padding: 24,
        borderColor: "rgba(251,191,36,0.3)",
        background: "rgba(251,191,36,0.05)",
      }}
    >
      <div style={{ color: "#fbbf24", fontWeight: 600, fontSize: 15, marginBottom: 8 }}>
        We couldn&apos;t find any ad accounts under this Facebook sign-in
      </div>
      <div style={{ color: "#a1a1aa", fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
        Meta returned zero ad accounts. The most common cause: the Facebook account you signed in
        with isn&apos;t a user on any Business Manager that owns an ad account. Try the steps below.
      </div>

      <button
        onClick={() => setShowHelp(!showHelp)}
        style={{
          background: "transparent",
          border: "1px solid #3f3f46",
          color: "#fbbf24",
          padding: "8px 14px",
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <ChevronDown
          size={14}
          style={{ transform: showHelp ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
        />
        {showHelp ? "Hide" : "Show"} step-by-step fix
      </button>

      {showHelp && (
        <ol style={{ marginTop: 16, paddingLeft: 20, color: "#d4d4d8", fontSize: 13, lineHeight: 1.8 }}>
          <li>
            Open{" "}
            <a
              href="https://business.facebook.com/settings"
              target="_blank"
              rel="noopener"
              style={linkStyle}
            >
              business.facebook.com/settings <ExternalLink size={11} style={{ display: "inline" }} />
            </a>
            {" "} as the Business Manager admin.
          </li>
          <li>
            Left sidebar → <strong>Users → People</strong> → <strong>Add</strong>. Invite the Facebook
            account you used to sign into ManagedAd.
          </li>
          <li>
            On the next screen, expand <strong>Ad accounts</strong>, pick the ad account you want to
            manage, and grant <strong>Advertiser</strong> (or higher) access. Save.
          </li>
          <li>
            The invited user opens their email or Facebook notifications → clicks{" "}
            <strong>Accept</strong> on the Business Manager invitation.
          </li>
          <li>
            If you don&apos;t have a Business Manager yet, create one at{" "}
            <a
              href="https://business.facebook.com/overview"
              target="_blank"
              rel="noopener"
              style={linkStyle}
            >
              business.facebook.com/overview <ExternalLink size={11} style={{ display: "inline" }} />
            </a>
            , then move your ad account into it.
          </li>
          <li>
            Wait 1–2 minutes for the permission to propagate, then click <strong>Rescan</strong>{" "}
            below.
          </li>
          <li>
            Also: confirm you&apos;re listed as a Developer or Tester on the ManagedAd Meta App in{" "}
            <a
              href="https://developers.facebook.com/apps"
              target="_blank"
              rel="noopener"
              style={linkStyle}
            >
              developers.facebook.com <ExternalLink size={11} style={{ display: "inline" }} />
            </a>
            . Until the app passes Meta App Review, only roles-listed users can grant{" "}
            <code style={codeStyle}>ads_management</code>.
          </li>
        </ol>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button
          onClick={onRetry}
          style={{
            background: "#1877F2",
            color: "#fff",
            border: "none",
            padding: "8px 14px",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <RefreshCw size={13} /> Rescan
        </button>
      </div>
    </div>
  );
}

const linkStyle = {
  color: "#fbbf24",
  textDecoration: "underline",
} as const;

const codeStyle = {
  background: "#18181c",
  color: "#e4e4e7",
  padding: "1px 5px",
  borderRadius: 3,
  fontSize: 12,
  fontFamily: "var(--font-ibm-plex-mono), monospace",
} as const;
