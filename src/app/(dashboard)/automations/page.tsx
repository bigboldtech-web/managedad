"use client";

import { useState, useEffect, useCallback } from "react";
import { Zap, Play, RotateCcw, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" },
  mono: { fontFamily: "var(--font-ibm-plex-mono), monospace" },
};

type FilterType = "ALL" | "NEGATIVE_KEYWORD" | "BUDGET_OPTIMIZATION" | "BID_ADJUSTMENT" | "CREATIVE_REFRESH" | "PAUSE_AD";
type DisplayStatus = "EXECUTED" | "PENDING" | "ROLLED_BACK" | "FAILED" | "SKIPPED";

interface AutomationLog {
  id: string;
  type: FilterType;
  platform: string;
  description: string;
  status: DisplayStatus;
  rawStatus: string;
  impact: string;
  before: string;
  after: string;
  createdAt: string;
}

interface ApiAction {
  id: string;
  actionType: string;
  platform: string;
  description: string;
  status: string;
  previousValue: string | null;
  newValue: string | null;
  campaignName: string | null;
  keywordText: string | null;
  adName: string | null;
  createdAt: string;
}

interface AutomationsResponse {
  actions: ApiAction[];
  stats: { executed: number; pending: number; totalActions: number };
  recentRuns: { id: string; status: string; createdAt: string; completedAt: string | null; summary: string | null }[];
  hasData: boolean;
}

function mapActionType(at: string): FilterType {
  if (at === "ADD_NEGATIVE_KEYWORD") return "NEGATIVE_KEYWORD";
  if (at === "INCREASE_BUDGET" || at === "DECREASE_BUDGET") return "BUDGET_OPTIMIZATION";
  if (at === "ADJUST_BID") return "BID_ADJUSTMENT";
  if (at === "CREATE_AD_VARIATION" || at === "SUGGEST_AB_TEST") return "CREATIVE_REFRESH";
  if (at === "PAUSE_AD" || at === "ENABLE_AD") return "PAUSE_AD";
  return "BUDGET_OPTIMIZATION";
}

function mapStatus(s: string): DisplayStatus {
  if (s === "APPLIED") return "EXECUTED";
  if (s === "PENDING") return "PENDING";
  if (s === "ROLLED_BACK") return "ROLLED_BACK";
  if (s === "FAILED") return "FAILED";
  if (s === "SKIPPED") return "SKIPPED";
  return "PENDING";
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} day ago`;
}

const typeLabels: Record<FilterType, string> = {
  ALL: "All",
  NEGATIVE_KEYWORD: "Negative Keyword",
  BUDGET_OPTIMIZATION: "Budget",
  BID_ADJUSTMENT: "Bid Adjustment",
  CREATIVE_REFRESH: "Creative",
  PAUSE_AD: "Pause/Enable",
};

const typeColors: Record<FilterType, { bg: string; color: string }> = {
  ALL: { bg: "rgba(113,113,122,0.1)", color: "#71717a" },
  NEGATIVE_KEYWORD: { bg: "rgba(251,191,36,0.1)", color: "#fbbf24" },
  BUDGET_OPTIMIZATION: { bg: "rgba(249,115,22,0.1)", color: "#fb923c" },
  BID_ADJUSTMENT: { bg: "rgba(99,102,241,0.1)", color: "#818cf8" },
  CREATIVE_REFRESH: { bg: "rgba(236,72,153,0.1)", color: "#f472b6" },
  PAUSE_AD: { bg: "rgba(248,113,113,0.1)", color: "#f87171" },
};

const statusIcon = (s: DisplayStatus) => {
  if (s === "EXECUTED") return <CheckCircle size={13} color="#34d399" />;
  if (s === "PENDING") return <Clock size={13} color="#fbbf24" />;
  if (s === "ROLLED_BACK") return <RotateCcw size={13} color="#71717a" />;
  if (s === "FAILED") return <XCircle size={13} color="#f87171" />;
  return <Clock size={13} color="#52525b" />;
};

export default function AutomationsPage() {
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [stats, setStats] = useState({ executed: 0, pending: 0, totalActions: 0 });
  const [recentRuns, setRecentRuns] = useState<AutomationsResponse["recentRuns"]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [rollingBack, setRollingBack] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<FilterType | "ALL">("ALL");

  const load = useCallback(async (filter: FilterType | "ALL") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/automations?type=${filter}`);
      if (res.ok) {
        const data: AutomationsResponse = await res.json();
        setStats(data.stats);
        setRecentRuns(data.recentRuns);
        setLogs(
          data.actions.map((a) => ({
            id: a.id,
            type: mapActionType(a.actionType),
            platform: a.platform,
            description: a.description,
            status: mapStatus(a.status),
            rawStatus: a.status,
            impact: a.newValue ? `→ ${a.newValue}` : "—",
            before: a.previousValue || (a.campaignName ? `Campaign: ${a.campaignName}` : "—"),
            after: a.newValue || a.description,
            createdAt: formatTimeAgo(a.createdAt),
          }))
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(typeFilter); }, [typeFilter, load]);

  async function runNow() {
    setRunning(true);
    try {
      await fetch("/api/optimization/run", { method: "POST" });
      await load(typeFilter);
    } finally {
      setRunning(false);
    }
  }

  async function rollback(actionId: string) {
    if (!confirm("Are you sure you want to roll back this action? This will reverse the change.")) return;
    setRollingBack(actionId);
    try {
      const res = await fetch("/api/automations/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId }),
      });
      if (res.ok) {
        setLogs((prev) =>
          prev.map((l) =>
            l.id === actionId ? { ...l, status: "ROLLED_BACK" as DisplayStatus, rawStatus: "ROLLED_BACK" } : l
          )
        );
      } else {
        const data = await res.json();
        alert(data.error || "Rollback failed");
      }
    } catch {
      alert("Rollback request failed");
    } finally {
      setRollingBack(null);
    }
  }

  const lastRun = recentRuns[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "3px" }}>Automations</h1>
          <p style={{ fontSize: "13px", color: "#52525b" }}>Every AI action, logged with full before/after state. One-click rollback.</p>
        </div>
        <button onClick={runNow} disabled={running} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 16px", background: running ? "rgba(249,115,22,0.5)" : "#f97316", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: running ? "not-allowed" : "pointer" }}>
          <Play size={13} /> {running ? "Running..." : "Run Now"}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        {[
          { label: "Actions Executed", value: String(stats.executed), color: "#34d399" },
          { label: "Pending Review", value: String(stats.pending), color: "#fbbf24" },
          { label: "Total Actions", value: String(stats.totalActions), color: "#fafafa" },
          { label: "Last Run", value: lastRun ? formatTimeAgo(lastRun.createdAt) : "—", color: "#fb923c" },
        ].map(stat => (
          <div key={stat.label} style={{ ...S.card, padding: "16px 18px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#3f3f46", marginBottom: "6px" }}>{stat.label}</div>
            <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: stat.color, letterSpacing: "-0.5px" }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {(["ALL", "NEGATIVE_KEYWORD", "BUDGET_OPTIMIZATION", "BID_ADJUSTMENT", "PAUSE_AD", "CREATIVE_REFRESH"] as (FilterType | "ALL")[]).map(t => (
          <button key={t} onClick={() => setTypeFilter(t)} style={{
            padding: "5px 12px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 500, cursor: "pointer", border: "1px solid",
            background: typeFilter === t ? "rgba(249,115,22,0.1)" : "transparent",
            borderColor: typeFilter === t ? "rgba(249,115,22,0.4)" : "#27272e",
            color: typeFilter === t ? "#fb923c" : "#52525b",
          }}>
            {t === "ALL" ? "All" : typeLabels[t as FilterType]}
          </button>
        ))}
      </div>

      {/* Log */}
      <div style={{ ...S.card, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #27272e", display: "flex", alignItems: "center", gap: "8px" }}>
          <Zap size={14} color="#f97316" />
          <span style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa" }}>Action Log</span>
          <span style={{ fontSize: "11px", color: "#3f3f46", marginLeft: "4px" }}>{logs.length} actions</span>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#3f3f46", fontSize: "13px" }}>Loading...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#3f3f46", fontSize: "13px" }}>
            No automation actions yet. Click &quot;Run Now&quot; to trigger the optimization engine.
          </div>
        ) : (
          logs.map((log) => {
            const tc = typeColors[log.type];
            const isExpanded = expanded === log.id;
            return (
              <div key={log.id} style={{ borderBottom: "1px solid #1a1a1f" }}>
                <div
                  style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}
                  onClick={() => setExpanded(isExpanded ? null : log.id)}
                >
                  {statusIcon(log.status)}
                  <span style={{ padding: "2px 8px", borderRadius: "5px", fontSize: "10.5px", fontWeight: 700, background: tc.bg, color: tc.color, whiteSpace: "nowrap" }}>
                    {typeLabels[log.type]}
                  </span>
                  <span style={{ padding: "2px 7px", borderRadius: "4px", fontSize: "10px", fontWeight: 600, background: log.platform === "GOOGLE_ADS" ? "rgba(66,133,244,0.1)" : "rgba(24,119,242,0.1)", color: log.platform === "GOOGLE_ADS" ? "#4285F4" : "#1877F2" }}>
                    {log.platform === "GOOGLE_ADS" ? "Google" : "Meta"}
                  </span>
                  <span style={{ flex: 1, fontSize: "13px", color: "#a1a1aa" }}>{log.description}</span>
                  <span style={{ fontSize: "11px", color: "#52525b", ...S.mono, whiteSpace: "nowrap" }}>{log.impact}</span>
                  <span style={{ fontSize: "11px", color: "#3f3f46", whiteSpace: "nowrap" }}>{log.createdAt}</span>
                  {isExpanded ? <ChevronUp size={13} color="#52525b" /> : <ChevronDown size={13} color="#52525b" />}
                </div>
                {isExpanded && (
                  <div style={{ padding: "0 20px 16px 20px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: log.rawStatus === "APPLIED" ? "12px" : "0" }}>
                      <div style={{ background: "#0d0d10", borderRadius: "8px", padding: "12px 14px" }}>
                        <div style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#3f3f46", marginBottom: "6px" }}>Before</div>
                        <div style={{ fontSize: "12px", color: "#71717a", ...S.mono }}>{log.before}</div>
                      </div>
                      <div style={{ background: "#0d0d10", borderRadius: "8px", padding: "12px 14px" }}>
                        <div style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#3f3f46", marginBottom: "6px" }}>After</div>
                        <div style={{ fontSize: "12px", color: "#fafafa", ...S.mono }}>{log.after}</div>
                      </div>
                    </div>
                    {log.rawStatus === "APPLIED" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); rollback(log.id); }}
                        disabled={rollingBack === log.id}
                        style={{
                          display: "flex", alignItems: "center", gap: "6px",
                          padding: "7px 14px", background: "rgba(113,113,122,0.1)",
                          border: "1px solid #27272e", borderRadius: "7px",
                          color: "#a1a1aa", fontSize: "12px", fontWeight: 600,
                          cursor: rollingBack === log.id ? "not-allowed" : "pointer",
                          opacity: rollingBack === log.id ? 0.5 : 1,
                        }}
                      >
                        <RotateCcw size={12} />
                        {rollingBack === log.id ? "Rolling back..." : "Rollback"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Recent Runs */}
      {recentRuns.length > 0 && (
        <div style={{ ...S.card, padding: "20px 24px" }}>
          <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa", marginBottom: "14px" }}>Recent Optimization Runs</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {recentRuns.map((run) => (
              <div key={run.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "#0d0d10", borderRadius: "8px" }}>
                {run.status === "COMPLETED" ? <CheckCircle size={13} color="#34d399" /> : run.status === "FAILED" ? <XCircle size={13} color="#f87171" /> : <Clock size={13} color="#fbbf24" />}
                <span style={{ fontSize: "12px", color: run.status === "COMPLETED" ? "#34d399" : run.status === "FAILED" ? "#f87171" : "#fbbf24", fontWeight: 600 }}>{run.status}</span>
                <span style={{ fontSize: "12px", color: "#71717a", flex: 1 }}>{run.summary || "Optimization run completed"}</span>
                <span style={{ fontSize: "11px", color: "#3f3f46" }}>{formatTimeAgo(run.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
