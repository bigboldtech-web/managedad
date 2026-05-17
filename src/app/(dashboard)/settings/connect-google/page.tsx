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
}

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: 12 },
  input: {
    background: "#18181c",
    border: "1px solid #27272e",
    color: "#fafafa",
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 13,
    outline: "none",
    fontFamily: "var(--font-ibm-plex-mono), monospace" as const,
  },
};

export default function ConnectGooglePage() {
  const router = useRouter();
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualId, setManualId] = useState("");
  const [manualName, setManualName] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  const discover = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/google-ads/discover");
      const data = (await res.json()) as DiscoveryResult;
      setResult(data);
      if (data.state === "ready") {
        // Pre-select non-manager accounts (those have real campaigns to manage).
        // Includes inaccessible ones — user can link them anyway, we'll send
        // a manager-link invitation that they accept inside Google Ads UI.
        const auto = new Set(
          data.accounts.filter((a) => !a.isManager).map((a) => a.customerId)
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
      setError("Pick at least one account to link.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const targets = (result?.accounts ?? [])
        .filter((a) => selected.has(a.customerId))
        .map((a) => ({
          customerId: a.customerId,
          accountName: a.accountName ?? undefined,
          isManager: a.isManager,
        }));
      const res = await fetch("/api/google-ads/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerIds: targets }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      router.replace("/settings?tab=connections&connected=google");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      setSaving(false);
    }
  };

  const handleLinkManual = async () => {
    const sanitized = manualId.replace(/[-\s]/g, "");
    if (!/^\d{7,10}$/.test(sanitized)) {
      setError("Customer ID must be 7-10 digits (e.g. 123-456-7890).");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/google-ads/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: sanitized, accountName: manualName || undefined }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      router.replace("/settings?tab=connections&connected=google");
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
        Connect Google Ads
      </h1>
      <p style={{ color: "#71717a", fontSize: 14, marginBottom: 24 }}>
        Your Google sign-in was successful. Select which Google Ads accounts to link.
      </p>

      {loading && (
        <div style={{ ...S.card, padding: 40, textAlign: "center" }}>
          <Loader2 size={20} color="#f97316" style={{ animation: "spin 0.8s linear infinite" }} />
          <div style={{ marginTop: 12, color: "#71717a", fontSize: 13 }}>
            Looking up your accounts…
          </div>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {!loading && result?.state === "no_pending" && (
        <ErrorCard
          title="No pending Google connection"
          body="Start fresh — click below to begin the Google OAuth flow."
          cta={{ label: "Connect Google Ads", href: "/api/google-ads/connect" }}
        />
      )}

      {!loading && result?.state === "api_error" && (
        <ErrorCard
          title="Couldn't reach Google's API"
          body={result.errorDetail ?? "Unknown error from Google's API."}
          errorCode={result.errorCode}
          onRetry={discover}
        />
      )}

      {!loading && result?.state === "no_accounts" && (
        <NoAccountsHelp
          showHelp={showHelp}
          setShowHelp={setShowHelp}
          showManual={showManual}
          setShowManual={setShowManual}
          onRetry={discover}
          manualId={manualId}
          setManualId={setManualId}
          manualName={manualName}
          setManualName={setManualName}
          onLinkManual={handleLinkManual}
          saving={saving}
        />
      )}

      {!loading && result?.state === "ready" && (
        <>
          <div style={{ ...S.card, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 14 }}>
              We found <strong style={{ color: "#fafafa" }}>{result.accounts.length}</strong> account
              {result.accounts.length === 1 ? "" : "s"} you can manage with ManagedAd.
              Manager accounts (MCC) are toggled off by default — they have no campaigns of their own.
            </div>

            {result.accounts.map((acc) => (
              <label
                key={acc.customerId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  background: selected.has(acc.customerId) ? "rgba(249,115,22,0.08)" : "#0e0e10",
                  border: "1px solid",
                  borderColor: selected.has(acc.customerId) ? "#f97316" : "#27272e",
                  borderRadius: 8,
                  marginBottom: 8,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(acc.customerId)}
                  onChange={() => toggle(acc.customerId)}
                  style={{ accentColor: "#f97316", width: 16, height: 16 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: "#fafafa", fontWeight: 600 }}>
                    {acc.accountName || `Account ${formatId(acc.customerId)}`}
                    {acc.isManager && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 10,
                          background: "rgba(139,92,246,0.15)",
                          color: "#a78bfa",
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontWeight: 600,
                          letterSpacing: 0.5,
                        }}
                      >
                        MANAGER
                      </span>
                    )}
                    {!acc.isAccessible && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 10,
                          background: "rgba(251,191,36,0.15)",
                          color: "#fbbf24",
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontWeight: 600,
                          letterSpacing: 0.5,
                        }}
                      >
                        NEEDS MCC LINK
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
                    ID: {formatId(acc.customerId)}
                    {!acc.isAccessible && (
                      <span style={{ color: "#fbbf24", fontFamily: "inherit", marginLeft: 8 }}>
                        — link anyway; we&apos;ll send a manager invitation after you click Link
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
                background: saving || selected.size === 0 ? "#27272e" : "#f97316",
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

function formatId(id: string): string {
  // 3253720007 → 325-372-0007
  if (id.length === 10) return `${id.slice(0, 3)}-${id.slice(3, 6)}-${id.slice(6)}`;
  return id;
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
                  background: "#f97316",
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
  showManual,
  setShowManual,
  onRetry,
  manualId,
  setManualId,
  manualName,
  setManualName,
  onLinkManual,
  saving,
}: {
  showHelp: boolean;
  setShowHelp: (v: boolean) => void;
  showManual: boolean;
  setShowManual: (v: boolean) => void;
  onRetry: () => void;
  manualId: string;
  setManualId: (v: string) => void;
  manualName: string;
  setManualName: (v: string) => void;
  onLinkManual: () => void;
  saving: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div
        style={{
          ...S.card,
          padding: 24,
          borderColor: "rgba(251,191,36,0.3)",
          background: "rgba(251,191,36,0.05)",
        }}
      >
        <div style={{ color: "#fbbf24", fontWeight: 600, fontSize: 15, marginBottom: 8 }}>
          We couldn&apos;t find any ad accounts under this Google sign-in
        </div>
        <div style={{ color: "#a1a1aa", fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
          Google&apos;s API returned zero accessible accounts. The most common cause: the Google account
          you signed in with isn&apos;t a user with API access on any Google Ads account. Try the steps
          below.
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
              Open <a href="https://ads.google.com" target="_blank" rel="noopener" style={linkStyle}>
                ads.google.com <ExternalLink size={11} style={{ display: "inline" }} />
              </a> in a new tab.
            </li>
            <li>
              Sign in with the Google account that <strong>created</strong> or <strong>owns</strong> the
              Google Ads account you want to manage.
            </li>
            <li>
              Click <strong>Tools</strong> (wrench icon top-right) → <strong>Setup</strong> →{" "}
              <strong>Access and security</strong>.
            </li>
            <li>
              Click the blue <strong>+</strong> → <strong>Invite users</strong>. Enter the email you
              just used to sign into ManagedAd, set Access level to <strong>Admin</strong>, and send
              the invitation.
            </li>
            <li>
              Open the inbox for that email, find the Google Ads invitation, and click{" "}
              <strong>Accept invitation</strong>.
            </li>
            <li>
              Wait 5 minutes for the permission to propagate, then click <strong>Rescan</strong> below.
            </li>
          </ol>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button
            onClick={onRetry}
            style={{
              background: "#f97316",
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
          <button
            onClick={() => setShowManual(!showManual)}
            style={{
              background: "transparent",
              color: "#a1a1aa",
              border: "1px solid #3f3f46",
              padding: "8px 14px",
              borderRadius: 6,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {showManual ? "Hide" : "Enter customer ID manually"}
          </button>
        </div>
      </div>

      {showManual && (
        <div style={{ ...S.card, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#fafafa", marginBottom: 6 }}>
            Manual customer ID
          </div>
          <div style={{ fontSize: 12, color: "#71717a", marginBottom: 14, lineHeight: 1.5 }}>
            If you know your Google Ads customer ID (10 digits, top-right corner of Google Ads UI),
            paste it here to link directly. ManagedAd&apos;s manager account will send a link
            invitation that you can accept inside Google Ads.
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="123-456-7890"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              disabled={saving}
              style={{ ...S.input, flex: "1 1 220px" }}
            />
            <input
              type="text"
              placeholder="Account name (optional)"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              disabled={saving}
              style={{
                ...S.input,
                flex: "1 1 200px",
                fontFamily: "inherit" as const,
              }}
            />
            <button
              onClick={onLinkManual}
              disabled={saving || !manualId.trim()}
              style={{
                background: saving || !manualId.trim() ? "#27272e" : "#f97316",
                color: saving || !manualId.trim() ? "#71717a" : "#fff",
                border: "none",
                padding: "10px 16px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: saving || !manualId.trim() ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Linking…" : "Link account"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const linkStyle = {
  color: "#fbbf24",
  textDecoration: "underline",
} as const;
