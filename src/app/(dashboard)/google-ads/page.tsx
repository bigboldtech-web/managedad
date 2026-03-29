"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Target, Link2, RefreshCw, Plus, CheckCircle2, XCircle, Unlink } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" },
  th: { padding: "10px 14px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: "#3f3f46", borderBottom: "1px solid #27272e" },
  td: { padding: "12px 14px", fontSize: "13px", color: "#a1a1aa", borderBottom: "1px solid #1a1a1f" },
  input: { height: "40px", padding: "0 14px", background: "#18181c", border: "1px solid #27272e", borderRadius: "8px", color: "#fafafa", fontSize: "13px", outline: "none", width: "100%", boxSizing: "border-box" as const, fontFamily: "inherit" },
  mono: { fontFamily: "var(--font-ibm-plex-mono), monospace" },
};

interface Connection { id: string; customerId: string; accountName: string | null; isActive: boolean; lastSyncAt: string | null; }
interface Campaign { id: string; name: string; status: string; dailyBudget: number; impressions: number; clicks: number; conversions: number; spend: number; }


function GoogleAdsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [accountName, setAccountName] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (searchParams.get("setup") === "enter_customer_id" && connections.length === 0) setShowForm(true);
    if (connections.length > 0) { setShowForm(false); if (searchParams.get("setup")) router.replace("/google-ads"); }
  }, [searchParams, connections, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [connRes, campRes] = await Promise.all([fetch("/api/google-ads/connections"), fetch("/api/google-ads/campaigns")]);
        if (connRes.ok) { const d = await connRes.json(); if (Array.isArray(d) && d.length) setConnections(d); }
        if (campRes.ok) { const d = await campRes.json(); if (Array.isArray(d) && d.length) setCampaigns(d); }
      } catch {}
      setLoading(false);
    }
    fetchData();
  }, []);

  async function saveCustomerId() {
    const sanitized = customerId.replace(/[-\s]/g, "");
    if (!/^\d{3,10}$/.test(sanitized)) { setFormError("Enter a valid Google Ads Customer ID (e.g., 123-456-7890)"); return; }
    setSaving(true); setFormError("");
    try {
      const res = await fetch("/api/google-ads/connections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerId: sanitized, accountName: accountName || null }) });
      if (res.ok) { setShowForm(false); setCustomerId(""); setAccountName(""); router.replace("/google-ads?connected=true"); const r = await fetch("/api/google-ads/connections"); if (r.ok) setConnections(await r.json()); }
      else { const d = await res.json(); setFormError(d.error || "Failed to save connection"); }
    } catch { setFormError("Failed to save connection"); }
    setSaving(false);
  }

  async function handleDisconnect(id: string) {
    setDisconnecting(id);
    try { const r = await fetch(`/api/google-ads/connections?id=${id}`, { method: "DELETE" }); if (r.ok) setConnections(prev => prev.filter(c => c.id !== id)); }
    catch { /* ignore */ }
    setDisconnecting(null);
  }

  async function handleSync() {
    setSyncing(true);
    try { await fetch("/api/cron/sync-ads", { method: "POST" }); }
    catch { /* ignore */ }
    await new Promise(r => setTimeout(r, 1500));
    setSyncing(false);
  }

  const hasConnection = connections.length > 0;
  const totalSpend = campaigns.reduce((s, c) => s + Number(c.spend), 0);
  const totalConversions = campaigns.reduce((s, c) => s + Number(c.conversions), 0);
  const totalClicks = campaigns.reduce((s, c) => s + Number(c.clicks), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Customer ID form modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ ...S.card, padding: "28px", width: "440px", maxWidth: "90vw" }}>
            <h2 style={{ fontFamily: '"Sora", sans-serif', fontSize: "17px", fontWeight: 800, color: "#fafafa", marginBottom: "6px" }}>Enter Google Ads Customer ID</h2>
            <p style={{ fontSize: "12.5px", color: "#52525b", marginBottom: "20px", lineHeight: 1.5 }}>Your Google account is connected. Now enter your Google Ads Customer ID (found top-right of your Google Ads dashboard).</p>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#71717a", marginBottom: "5px", display: "block" }}>Customer ID *</label>
              <input value={customerId} onChange={e => setCustomerId(e.target.value)} placeholder="123-456-7890" style={S.input} />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#71717a", marginBottom: "5px", display: "block" }}>Account Name (optional)</label>
              <input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="My Business Account" style={S.input} />
            </div>
            {formError && <div style={{ padding: "8px 12px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "7px", color: "#f87171", fontSize: "12.5px", marginBottom: "14px" }}>{formError}</div>}
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={saveCustomerId} disabled={saving} style={{ flex: 1, height: "40px", background: saving ? "rgba(249,115,22,0.5)" : "#f97316", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>{saving ? "Saving..." : "Save Connection"}</button>
              <button onClick={() => setShowForm(false)} style={{ padding: "0 18px", height: "40px", background: "transparent", border: "1px solid #27272e", borderRadius: "8px", color: "#71717a", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "3px" }}>Google Ads</h1>
          <p style={{ fontSize: "13px", color: "#52525b" }}>Manage campaigns, keywords, and bids across your Google Ads accounts.</p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {hasConnection && (
            <button onClick={handleSync} disabled={syncing} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", background: "transparent", border: "1px solid #27272e", borderRadius: "8px", color: "#71717a", fontSize: "12.5px", cursor: syncing ? "not-allowed" : "pointer" }}>
              <RefreshCw size={13} style={{ animation: syncing ? "spin 1s linear infinite" : "none" }} /> {syncing ? "Syncing..." : "Sync Now"}
            </button>
          )}
          <a href="/api/google-ads/connect" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", background: "#4285F4", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
            <Link2 size={13} /> {hasConnection ? "Add Account" : "Connect Google Ads"}
          </a>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        {[
          { label: "Accounts", value: hasConnection ? String(connections.length) : "0" },
          { label: "Total Spend", value: formatCurrency(totalSpend) },
          { label: "Clicks", value: formatNumber(totalClicks) },
          { label: "Conversions", value: String(totalConversions) },
        ].map(kpi => (
          <div key={kpi.label} style={{ ...S.card, padding: "16px 18px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#3f3f46", marginBottom: "6px" }}>{kpi.label}</div>
            <div style={{ ...S.mono, fontFamily: '"Sora", sans-serif', fontSize: "20px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px" }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Connected accounts */}
      <div style={{ ...S.card, padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <Target size={15} color="#4285F4" />
          <span style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa" }}>Connected Accounts</span>
        </div>
        {!hasConnection ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(66,133,244,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <Target size={22} color="#4285F4" />
            </div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#fafafa", marginBottom: "6px" }}>No accounts connected</div>
            <div style={{ fontSize: "12.5px", color: "#52525b", marginBottom: "16px" }}>Connect your Google Ads account to start managing campaigns.</div>
            <a href="/api/google-ads/connect" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 18px", background: "#4285F4", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
              <Link2 size={13} /> Connect Google Ads
            </a>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {connections.map(conn => (
              <div key={conn.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", background: "#0d0d10", borderRadius: "8px", border: "1px solid #1a1a1f" }}>
                {conn.isActive ? <CheckCircle2 size={15} color="#34d399" /> : <XCircle size={15} color="#f87171" />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#fafafa" }}>{conn.accountName || `Account ${conn.customerId}`}</div>
                  <div style={{ fontSize: "11.5px", color: "#52525b" }}>
                    ID: {conn.customerId}{conn.lastSyncAt && ` · Last synced: ${new Date(conn.lastSyncAt).toLocaleString("en-IN")}`}
                  </div>
                </div>
                <span style={{ padding: "3px 9px", borderRadius: "5px", fontSize: "10.5px", fontWeight: 600, background: conn.isActive ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)", color: conn.isActive ? "#34d399" : "#f87171" }}>
                  {conn.isActive ? "Active" : "Disconnected"}
                </span>
                <button onClick={() => handleDisconnect(conn.id)} disabled={disconnecting === conn.id} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 12px", background: "transparent", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "6px", color: "#f87171", fontSize: "11.5px", cursor: "pointer" }}>
                  <Unlink size={11} /> {disconnecting === conn.id ? "..." : "Disconnect"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Campaigns Table */}
      {campaigns.length > 0 && (
        <div style={{ ...S.card, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #27272e", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa" }}>Campaigns</span>
            <Link href="/campaigns/new?platform=GOOGLE_ADS" style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", background: "rgba(66,133,244,0.1)", border: "1px solid rgba(66,133,244,0.3)", borderRadius: "6px", color: "#4285F4", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}>
              <Plus size={11} /> New Campaign
            </Link>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Campaign", "Status", "Budget/Day", "Impressions", "Clicks", "Conversions", "Spend"].map((h, i) => (
                    <th key={h} style={{ ...S.th, textAlign: i > 1 ? "right" : "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ ...S.td, textAlign: "center", padding: "32px" }}>Loading...</td></tr>
                ) : campaigns.map(c => (
                  <tr key={c.id}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#18181c")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    style={{ transition: "background 0.1s" }}>
                    <td style={S.td}>
                      <Link href={`/campaigns/${c.id}`} style={{ color: "#fafafa", fontWeight: 500, textDecoration: "none", fontSize: "13px" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#4285F4")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#fafafa")}
                      >{c.name}</Link>
                    </td>
                    <td style={S.td}>
                      <span style={{ padding: "2px 8px", borderRadius: "5px", fontSize: "11px", fontWeight: 600, background: c.status === "ACTIVE" ? "rgba(52,211,153,0.08)" : "rgba(113,113,122,0.1)", color: c.status === "ACTIVE" ? "#34d399" : "#71717a" }}>{c.status}</span>
                    </td>
                    <td style={{ ...S.td, textAlign: "right", ...S.mono }}>{formatCurrency(Number(c.dailyBudget))}</td>
                    <td style={{ ...S.td, textAlign: "right", ...S.mono }}>{formatNumber(Number(c.impressions))}</td>
                    <td style={{ ...S.td, textAlign: "right", ...S.mono }}>{formatNumber(Number(c.clicks))}</td>
                    <td style={{ ...S.td, textAlign: "right", ...S.mono }}>{c.conversions}</td>
                    <td style={{ ...S.td, textAlign: "right", ...S.mono }}>{formatCurrency(Number(c.spend))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GoogleAdsPage() {
  return <Suspense fallback={<div style={{ color: "#52525b", padding: "40px", textAlign: "center" }}>Loading...</div>}><GoogleAdsContent /></Suspense>;
}
