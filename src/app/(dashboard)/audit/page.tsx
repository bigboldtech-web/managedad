"use client";

import { useState, useEffect, useCallback } from "react";
import { ClipboardCheck, RefreshCw, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" },
  mono: { fontFamily: "var(--font-ibm-plex-mono), monospace" },
};

interface AuditCheck {
  id: string;
  name: string;
  status: "PASS" | "WARN" | "FAIL";
  score: number;
  finding: string;
  recommendation: string;
}

interface AuditReport {
  id: string;
  score: number;
  checks: AuditCheck[];
  summary: string;
  createdAt: string;
}

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? "#34d399" : score >= 60 ? "#fbbf24" : "#f87171";
  const circumference = 2 * Math.PI * 46;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div style={{ position: "relative", width: "120px", height: "120px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="120" height="120" style={{ position: "absolute", transform: "rotate(-90deg)" }}>
        <circle cx="60" cy="60" r="46" fill="none" stroke="#1a1a1f" strokeWidth="8" />
        <circle cx="60" cy="60" r="46" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div style={{ textAlign: "center" }}>
        <div style={{ ...S.mono, fontSize: "28px", fontWeight: 800, color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: "10px", color: "#52525b", marginTop: "2px" }}>/ 100</div>
      </div>
    </div>
  );
}

const statusIcon = {
  PASS: <CheckCircle size={14} color="#34d399" />,
  WARN: <AlertTriangle size={14} color="#fbbf24" />,
  FAIL: <XCircle size={14} color="#f87171" />,
};

const statusColors = {
  PASS: { bg: "rgba(52,211,153,0.08)", color: "#34d399", border: "rgba(52,211,153,0.2)" },
  WARN: { bg: "rgba(251,191,36,0.08)", color: "#fbbf24", border: "rgba(251,191,36,0.2)" },
  FAIL: { bg: "rgba(248,113,113,0.08)", color: "#f87171", border: "rgba(248,113,113,0.2)" },
};

export default function AuditPage() {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    const res = await fetch("/api/audit/latest");
    if (res.ok) {
      const { report: data } = await res.json();
      setReport(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadReport(); }, [loadReport]);

  async function runAudit() {
    setRunning(true);
    try {
      const res = await fetch("/api/audit/run", { method: "POST" });
      if (res.ok) {
        const { report: data } = await res.json();
        setReport({ ...data, checks: data.checks });
      }
    } finally {
      setRunning(false);
    }
  }

  const checks = (report?.checks as AuditCheck[]) || [];
  const passCount = checks.filter((c) => c.status === "PASS").length;
  const warnCount = checks.filter((c) => c.status === "WARN").length;
  const failCount = checks.filter((c) => c.status === "FAIL").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "3px" }}>Account Audit</h1>
          <p style={{ fontSize: "13px", color: "#52525b" }}>7-point AI audit across spend, keywords, creatives, bidding, and tracking.</p>
        </div>
        <button onClick={runAudit} disabled={running} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 16px", background: running ? "rgba(249,115,22,0.5)" : "#f97316", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: running ? "not-allowed" : "pointer" }}>
          <RefreshCw size={13} style={{ animation: running ? "spin 1s linear infinite" : "none" }} />
          {running ? "Running Audit…" : "Run Audit Now"}
        </button>
      </div>

      {loading ? (
        <div style={{ ...S.card, padding: "48px", textAlign: "center", color: "#3f3f46", fontSize: "13px" }}>Loading…</div>
      ) : !report ? (
        <div style={{ ...S.card, padding: "48px", textAlign: "center" }}>
          <ClipboardCheck size={32} color="#27272e" style={{ margin: "0 auto 16px" }} />
          <div style={{ fontSize: "15px", fontWeight: 600, color: "#52525b", marginBottom: "6px" }}>No audit report yet</div>
          <div style={{ fontSize: "13px", color: "#3f3f46", marginBottom: "20px" }}>Run your first audit to get an AI analysis of your ad account health.</div>
          <button onClick={runAudit} disabled={running} style={{ padding: "10px 24px", background: "#f97316", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
            {running ? "Running…" : "Run First Audit"}
          </button>
        </div>
      ) : (
        <>
          {/* Score + summary */}
          <div style={{ ...S.card, padding: "24px", display: "grid", gridTemplateColumns: "auto 1fr", gap: "24px", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
              <ScoreGauge score={report.score} />
              <div style={{ fontSize: "11px", color: "#52525b" }}>
                {report.score >= 80 ? "Healthy" : report.score >= 60 ? "Needs Attention" : "Critical Issues"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#3f3f46", marginBottom: "8px" }}>AI Summary</div>
              <div style={{ fontSize: "13.5px", color: "#a1a1aa", lineHeight: 1.65, marginBottom: "16px" }}>{report.summary}</div>
              <div style={{ display: "flex", gap: "12px" }}>
                {[
                  { label: "Passed", count: passCount, color: "#34d399" },
                  { label: "Warnings", count: warnCount, color: "#fbbf24" },
                  { label: "Failed", count: failCount, color: "#f87171" },
                ].map((s) => (
                  <div key={s.label} style={{ padding: "6px 14px", borderRadius: "6px", background: `${s.color}10`, border: `1px solid ${s.color}22` }}>
                    <span style={{ fontSize: "16px", fontWeight: 700, color: s.color, ...S.mono }}>{s.count}</span>
                    <span style={{ fontSize: "11px", color: "#52525b", marginLeft: "5px" }}>{s.label}</span>
                  </div>
                ))}
                <div style={{ marginLeft: "auto", fontSize: "11px", color: "#3f3f46", alignSelf: "center" }}>
                  {new Date(report.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          </div>

          {/* Checks */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {checks.map((check) => {
              const sc = statusColors[check.status];
              const isOpen = expanded === check.id;
              return (
                <div key={check.id} style={{ ...S.card, overflow: "hidden", borderColor: isOpen ? sc.border : "#27272e" }}>
                  <div
                    onClick={() => setExpanded(isOpen ? null : check.id)}
                    style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px", cursor: "pointer" }}
                  >
                    <div style={{ padding: "6px 10px", borderRadius: "6px", background: sc.bg, border: `1px solid ${sc.border}`, display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
                      {statusIcon[check.status]}
                      <span style={{ fontSize: "9.5px", fontWeight: 700, color: sc.color }}>{check.status}</span>
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#fafafa", marginBottom: "2px" }}>{check.name}</div>
                      <div style={{ fontSize: "12px", color: "#52525b" }}>{check.finding}</div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "18px", fontWeight: 800, color: sc.color, ...S.mono, lineHeight: 1 }}>{check.score}</div>
                        <div style={{ fontSize: "9.5px", color: "#3f3f46" }}>/ 100</div>
                      </div>
                      <div style={{ width: "6px", height: "6px", borderRight: "1.5px solid #52525b", borderBottom: "1.5px solid #52525b", transform: isOpen ? "rotate(-135deg)" : "rotate(45deg)", transition: "transform 0.2s", marginRight: "2px" }} />
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ padding: "0 20px 16px", borderTop: "1px solid #1a1a1f" }}>
                      <div style={{ paddingTop: "14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div>
                          <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "#3f3f46", marginBottom: "6px" }}>Finding</div>
                          <div style={{ fontSize: "13px", color: "#71717a", lineHeight: 1.6 }}>{check.finding}</div>
                        </div>
                        <div style={{ padding: "12px 14px", background: "rgba(249,115,22,0.04)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: "8px" }}>
                          <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "#f97316", marginBottom: "6px" }}>Recommendation</div>
                          <div style={{ fontSize: "13px", color: "#a1a1aa", lineHeight: 1.6 }}>{check.recommendation}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
