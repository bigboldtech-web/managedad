"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronRight, CheckCircle, XCircle, Clock } from "lucide-react";

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" },
};

const ACTION_LABELS: Record<string, string> = {
  INCREASE_BUDGET: "Increase Budget", DECREASE_BUDGET: "Decrease Budget",
  PAUSE_AD: "Pause Ad", ENABLE_AD: "Enable Ad", PAUSE_KEYWORD: "Pause Keyword",
  ADD_NEGATIVE_KEYWORD: "Add Negative Keyword", ADJUST_BID: "Adjust Bid",
  CREATE_AD_VARIATION: "Create Variation", SUGGEST_AB_TEST: "A/B Test",
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  COMPLETED: { bg: "rgba(52,211,153,0.1)", color: "#34d399" },
  APPLIED:   { bg: "rgba(52,211,153,0.1)", color: "#34d399" },
  APPROVED:  { bg: "rgba(52,211,153,0.1)", color: "#34d399" },
  FAILED:    { bg: "rgba(248,113,113,0.1)", color: "#f87171" },
  REJECTED:  { bg: "rgba(248,113,113,0.1)", color: "#f87171" },
  RUNNING:   { bg: "rgba(66,133,244,0.1)",  color: "#4285F4" },
  PENDING:   { bg: "rgba(251,191,36,0.1)",  color: "#fbbf24" },
};

function StatusBadge({ status }: { status: string }) {
  const st = STATUS_STYLE[status] || { bg: "rgba(113,113,122,0.1)", color: "#71717a" };
  return (
    <span style={{ padding: "2px 8px", borderRadius: "5px", fontSize: "10.5px", fontWeight: 700, background: st.bg, color: st.color }}>
      {status}
    </span>
  );
}

interface OptimizationActionItem {
  id: string; actionType: string; description: string; status: string;
  campaign: { name: string; platform: string } | null; createdAt: string;
}
interface OptimizationRun {
  id: string; triggerType: string; status: string; createdAt: string;
  completedAt: string | null; summary: Record<string, unknown> | null;
  actions: OptimizationActionItem[];
}

export default function OptimizationHistoryPage() {
  const [runs, setRuns] = useState<OptimizationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/optimization/history")
      .then(r => r.ok ? r.json() : [])
      .then(setRuns)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Link href="/optimization" style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "#111114", border: "1px solid #27272e", borderRadius: "8px", color: "#71717a", textDecoration: "none", flexShrink: 0 }}>
          <ArrowLeft size={14} />
        </Link>
        <div>
          <h1 style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "2px" }}>Optimization History</h1>
          <p style={{ fontSize: "13px", color: "#52525b" }}>Past optimization runs and their actions.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#3f3f46", fontSize: "13px" }}>Loading...</div>
      ) : runs.length === 0 ? (
        <div style={{ ...S.card, padding: "48px", textAlign: "center" }}>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "#fafafa", marginBottom: "8px" }}>No optimization runs yet</div>
          <div style={{ fontSize: "13px", color: "#52525b", marginBottom: "16px" }}>Run the optimization engine from the optimization dashboard.</div>
          <Link href="/optimization" style={{ padding: "8px 16px", background: "#f97316", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>Go to Optimization</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {runs.map(run => (
            <div key={run.id} style={S.card}>
              <div onClick={() => setExpanded(expanded === run.id ? null : run.id)}
                style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {expanded === run.id ? <ChevronDown size={14} color="#52525b" /> : <ChevronRight size={14} color="#52525b" />}
                  <div>
                    <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#fafafa" }}>Optimization Run</div>
                    <div style={{ fontSize: "11.5px", color: "#52525b", marginTop: "2px" }}>
                      {new Date(run.createdAt).toLocaleString("en-IN")} · {run.triggerType} · {run.actions.length} action{run.actions.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
                <StatusBadge status={run.status} />
              </div>

              {expanded === run.id && (
                <div style={{ borderTop: "1px solid #1a1a1f", padding: "12px 20px 16px" }}>
                  {run.actions.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "#3f3f46", fontSize: "12.5px" }}>No actions generated in this run.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {run.actions.map(action => (
                        <div key={action.id} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 12px", background: "#0d0d10", borderRadius: "8px" }}>
                          {action.status === "APPLIED" || action.status === "COMPLETED" ? <CheckCircle size={13} color="#34d399" style={{ marginTop: "1px", flexShrink: 0 }} /> :
                           action.status === "FAILED" ? <XCircle size={13} color="#f87171" style={{ marginTop: "1px", flexShrink: 0 }} /> :
                           <Clock size={13} color="#fbbf24" style={{ marginTop: "1px", flexShrink: 0 }} />}
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px", flexWrap: "wrap" as const }}>
                              <span style={{ padding: "2px 7px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, background: "rgba(249,115,22,0.1)", color: "#fb923c" }}>
                                {ACTION_LABELS[action.actionType] || action.actionType}
                              </span>
                              <StatusBadge status={action.status} />
                              {action.campaign && (
                                <span style={{ fontSize: "11px", color: "#52525b" }}>{action.campaign.name}</span>
                              )}
                            </div>
                            <div style={{ fontSize: "12.5px", color: "#71717a" }}>{action.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
