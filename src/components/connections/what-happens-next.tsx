"use client";

import { Clock, Database, Brain, CheckCircle } from "lucide-react";

const STEPS = [
  {
    icon: CheckCircle,
    color: "#86efac",
    title: "Now",
    body: "We exchange encrypted OAuth tokens. No password ever leaves your ad platform.",
  },
  {
    icon: Database,
    color: "#fbbf24",
    title: "Within 1 hour",
    body: "First sync pulls your campaigns, ad groups, ads, keywords and the last 14 days of daily metrics.",
  },
  {
    icon: Brain,
    color: "#a78bfa",
    title: "Within 24 hours",
    body: "The AI generates its first batch of optimization proposals based on your data and your chosen objective.",
  },
  {
    icon: Clock,
    color: "#f97316",
    title: "After 30 days",
    body: "Per-account adaptive learning kicks in. The AI calibrates to your specific account's patterns and your house style.",
  },
];

export default function WhatHappensNext() {
  return (
    <div
      style={{
        background: "#111114",
        border: "1px solid #27272e",
        borderRadius: 12,
        padding: 20,
      }}
    >
      <strong style={{ color: "#fafafa", fontSize: 14, display: "block", marginBottom: 14 }}>
        What happens after you connect?
      </strong>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.title} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Icon size={16} color={step.color} style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12, color: step.color, fontWeight: 600, marginBottom: 2 }}>
                  {step.title}
                </div>
                <div style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.5 }}>{step.body}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
