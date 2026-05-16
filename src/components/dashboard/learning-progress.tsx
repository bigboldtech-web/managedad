"use client";

import { useEffect, useState } from "react";
import { Brain, Check } from "lucide-react";

interface AccountProgress {
  platform: "GOOGLE_ADS" | "META_ADS";
  accountId: string;
  vertical: string;
  ageDays: number;
  totalActionsApplied: number;
  benchmarksActive: boolean;
  behavioralActive: boolean;
  progressPct: number;
}

const PLATFORM_LABELS: Record<string, string> = {
  GOOGLE_ADS: "Google Ads",
  META_ADS: "Meta Ads",
};

export default function LearningProgress() {
  const [accounts, setAccounts] = useState<AccountProgress[] | null>(null);

  useEffect(() => {
    fetch("/api/fingerprint-progress")
      .then((r) => (r.ok ? r.json() : { accounts: [] }))
      .then((d) => setAccounts(d.accounts ?? []));
  }, []);

  if (!accounts || accounts.length === 0) return null;

  return (
    <div
      style={{
        background: "#111114",
        border: "1px solid #27272e",
        borderRadius: 12,
        padding: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Brain size={16} color="#f97316" />
        <strong style={{ color: "#fafafa", fontSize: 14 }}>Your AI is learning your account</strong>
      </div>
      <p style={{ color: "#71717a", fontSize: 12, marginBottom: 16, lineHeight: 1.5 }}>
        ManagedAd builds a per-account fingerprint from every action you approve or reject.
        Adaptive optimization activates at 30 days OR 50 measured actions per account.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {accounts.map((a) => (
          <div key={`${a.platform}:${a.accountId}`}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: "#e4e4e7" }}>
                {PLATFORM_LABELS[a.platform] ?? a.platform} · {a.vertical}
              </span>
              <span style={{ fontSize: 12, color: "#71717a" }}>
                {a.ageDays}d · {a.totalActionsApplied} action{a.totalActionsApplied === 1 ? "" : "s"}
              </span>
            </div>
            <div
              style={{
                background: "#1f1f23",
                borderRadius: 4,
                height: 6,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background: a.benchmarksActive ? "#22c55e" : "#f97316",
                  width: `${a.progressPct}%`,
                  height: "100%",
                  transition: "width 0.3s",
                }}
              />
            </div>
            <div style={{ marginTop: 6, display: "flex", gap: 12 }}>
              <Badge active={a.behavioralActive} label="Style detected" />
              <Badge active={a.benchmarksActive} label="Benchmarks calibrated" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Badge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      style={{
        fontSize: 11,
        color: active ? "#86efac" : "#52525b",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      {active ? <Check size={11} /> : <span style={{ width: 11, display: "inline-block" }}>·</span>}
      {label}
    </span>
  );
}
