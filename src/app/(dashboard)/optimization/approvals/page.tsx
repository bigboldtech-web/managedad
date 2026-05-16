"use client";

import { useEffect, useState, useCallback } from "react";
import { Check, X, ShieldAlert, AlertCircle, Sparkles } from "lucide-react";

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" },
  mono: { fontFamily: "var(--font-ibm-plex-mono), monospace" },
};

type RiskTier = "LOW" | "MED" | "HIGH";

interface ActionRow {
  id: string;
  actionType: string;
  description: string;
  reasonCode: string | null;
  riskTier: RiskTier;
  expectedDelta: string | null;
  confidence: string | null;
  status: string;
  autoApprovesAt: string | null;
  createdAt: string;
  campaign: { id: string; name: string; platform: string } | null;
  ad: { id: string; name: string | null } | null;
  keyword: { id: string; text: string; matchType: string } | null;
}

interface GroupedResponse {
  grouped: { LOW: ActionRow[]; MED: ActionRow[]; HIGH: ActionRow[] };
  total: number;
}

const TIER_META: Record<RiskTier, { label: string; icon: typeof ShieldAlert; color: string; bg: string }> = {
  LOW: { label: "Low risk — auto applies", icon: Sparkles, color: "#86efac", bg: "rgba(34,197,94,0.12)" },
  MED: { label: "Medium — auto-approves in 24h if untouched", icon: AlertCircle, color: "#fbbf24", bg: "rgba(245,158,11,0.12)" },
  HIGH: { label: "High — manual approval required", icon: ShieldAlert, color: "#f87171", bg: "rgba(239,68,68,0.12)" },
};

export default function ApprovalsPage() {
  const [data, setData] = useState<GroupedResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/optimization/actions");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as GroupedResponse;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = (ids: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = ids.every((id) => next.has(id));
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const decide = async (decision: "approve" | "reject", actionIds?: string[]) => {
    const ids = actionIds ?? Array.from(selected);
    if (ids.length === 0) return;
    setBusy(true);
    try {
      const res = await fetch("/api/optimization/actions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionIds: ids, decision }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSelected(new Set());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: "32px", color: "#e4e4e7", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 4 }}>Approvals</h1>
          <p style={{ color: "#71717a", fontSize: 14 }}>
            Review AI-proposed changes. Low-risk auto-applies; medium auto-approves after 24h; high needs you.
          </p>
        </div>
        {selected.size > 0 && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => decide("approve")}
              disabled={busy}
              style={{
                background: "#22c55e",
                color: "#0a0a0a",
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                fontWeight: 600,
                cursor: busy ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Check size={16} /> Approve {selected.size}
            </button>
            <button
              onClick={() => decide("reject")}
              disabled={busy}
              style={{
                background: "transparent",
                color: "#f87171",
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #3f3f46",
                cursor: busy ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <X size={16} /> Reject {selected.size}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div style={{ ...S.card, padding: 16, marginBottom: 16, borderColor: "#7f1d1d", color: "#fca5a5" }}>
          {error}
        </div>
      )}

      {data && data.total === 0 && (
        <div style={{ ...S.card, padding: 32, textAlign: "center", color: "#a1a1aa" }}>
          Nothing pending. Helios will queue actions after the next strategy run.
        </div>
      )}

      {data &&
        (["HIGH", "MED", "LOW"] as RiskTier[]).map((tier) => {
          const rows = data.grouped[tier];
          if (rows.length === 0) return null;
          const meta = TIER_META[tier];
          const Icon = meta.icon;
          const tierIds = rows.map((r) => r.id);
          const allSelectedInTier = tierIds.every((id) => selected.has(id));

          return (
            <div key={tier} style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 16px",
                  background: meta.bg,
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                <Icon size={18} color={meta.color} />
                <span style={{ color: meta.color, fontWeight: 600 }}>{meta.label}</span>
                <span style={{ color: "#71717a", marginLeft: "auto", fontSize: 13 }}>
                  {rows.length} action{rows.length === 1 ? "" : "s"}
                </span>
                <button
                  onClick={() => selectAll(tierIds)}
                  style={{
                    background: "transparent",
                    color: "#a1a1aa",
                    border: "1px solid #3f3f46",
                    borderRadius: 6,
                    padding: "4px 10px",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  {allSelectedInTier ? "Deselect all" : "Select all"}
                </button>
              </div>

              {rows.map((row) => (
                <div
                  key={row.id}
                  style={{
                    ...S.card,
                    padding: 16,
                    marginBottom: 8,
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    borderColor: selected.has(row.id) ? "#3b82f6" : "#27272e",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => toggle(row.id)}
                    style={{ marginTop: 4, accentColor: "#3b82f6" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: 11,
                          color: "#a1a1aa",
                          background: "#1f1f23",
                          padding: "2px 6px",
                          borderRadius: 4,
                          ...S.mono,
                        }}
                      >
                        {row.actionType}
                      </span>
                      {row.reasonCode && (
                        <span style={{ fontSize: 11, color: "#71717a", ...S.mono }}>{row.reasonCode}</span>
                      )}
                      {row.campaign && (
                        <span style={{ fontSize: 12, color: "#a1a1aa" }}>
                          {row.campaign.platform === "GOOGLE_ADS" ? "Google" : "Meta"} · {row.campaign.name}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 14, marginBottom: 6 }}>{row.description}</div>
                    <div style={{ fontSize: 12, color: "#71717a", display: "flex", gap: 12 }}>
                      {row.expectedDelta && (
                        <span>
                          Expected impact: <strong style={{ color: "#e4e4e7" }}>
                            {(Number(row.expectedDelta) * 100).toFixed(1)}%
                          </strong>
                        </span>
                      )}
                      {row.confidence && (
                        <span>
                          Confidence: <strong style={{ color: "#e4e4e7" }}>
                            {(Number(row.confidence) * 100).toFixed(0)}%
                          </strong>
                        </span>
                      )}
                      {tier === "MED" && row.autoApprovesAt && (
                        <span>
                          Auto-approves: {new Date(row.autoApprovesAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => decide("approve", [row.id])}
                      disabled={busy}
                      style={{
                        background: "#22c55e",
                        color: "#0a0a0a",
                        border: "none",
                        borderRadius: 6,
                        padding: "6px 10px",
                        cursor: busy ? "not-allowed" : "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => decide("reject", [row.id])}
                      disabled={busy}
                      style={{
                        background: "transparent",
                        color: "#f87171",
                        border: "1px solid #3f3f46",
                        borderRadius: 6,
                        padding: "6px 10px",
                        cursor: busy ? "not-allowed" : "pointer",
                        fontSize: 12,
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
    </div>
  );
}
