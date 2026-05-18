"use client";

import { useEffect, useState, useCallback } from "react";
import Script from "next/script";
import { Sparkles, CreditCard, RefreshCw } from "lucide-react";

const PACKS = [
  { credits: 100, paise: 30000, label: "₹300" },
  { credits: 500, paise: 140000, label: "₹1,400", discount: "Save ~7%" },
  { credits: 1000, paise: 270000, label: "₹2,700", discount: "Save 10%" },
  { credits: 5000, paise: 1200000, label: "₹12,000", discount: "Best value · Save 20%" },
];

interface CreditState {
  topupBalance: number;
  monthly: {
    chat: { used: number; limit: number };
    creativeBrief: { used: number; limit: number };
  };
  resetsAt: string;
  plan: string;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: 12 },
};

export default function CreditsPage() {
  const [state, setState] = useState<CreditState | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/credits/state");
      if (res.ok) setState(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const purchase = async (packSize: number) => {
    setPurchasing(packSize);
    setError(null);
    try {
      const res = await fetch("/api/credits/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packSize }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const { orderId, amountPaise, keyId, credits } = await res.json();

      const razorpay = new window.Razorpay({
        key: keyId,
        amount: amountPaise,
        currency: "INR",
        name: "ManagedAd",
        description: `${credits} AI credits`,
        order_id: orderId,
        prefill: {},
        notes: { kind: "credit_purchase" },
        theme: { color: "#f97316" },
        handler: async () => {
          // Razorpay webhook will fulfill; refresh state shortly
          setTimeout(fetchState, 2000);
          setPurchasing(null);
        },
        modal: {
          ondismiss: () => setPurchasing(null),
        },
      });
      razorpay.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Purchase failed");
      setPurchasing(null);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <div style={{ padding: 32, color: "#e4e4e7", maxWidth: 920, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 6 }}>AI Credits</h1>
        <p style={{ color: "#71717a", fontSize: 14, marginBottom: 24 }}>
          AI features (chat, creative briefs) use credits. Your plan includes a monthly allowance.
          Buy credit packs to top up if you exceed it. Helios optimization is unlimited on every plan.
        </p>

        {loading ? (
          <div style={{ ...S.card, padding: 32, textAlign: "center", color: "#71717a" }}>
            Loading…
          </div>
        ) : !state ? (
          <div style={{ ...S.card, padding: 32, textAlign: "center", color: "#f87171" }}>
            Couldn&apos;t load credit state. Refresh the page.
          </div>
        ) : (
          <>
            {/* Balance summary */}
            <div
              style={{
                ...S.card,
                padding: 24,
                marginBottom: 24,
                background:
                  "linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(249,115,22,0.02) 100%)",
                borderColor: "rgba(249,115,22,0.3)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Sparkles size={18} color="#f97316" />
                <span style={{ fontSize: 13, color: "#a1a1aa", fontWeight: 600 }}>
                  TOP-UP BALANCE
                </span>
              </div>
              <div
                style={{
                  fontSize: 42,
                  fontWeight: 700,
                  color: "#fafafa",
                  fontFamily: '"Sora", sans-serif',
                }}
              >
                {state.topupBalance.toLocaleString("en-IN")}
              </div>
              <div style={{ fontSize: 12, color: "#71717a", marginTop: 4 }}>
                credits · top-up credits never expire
              </div>
            </div>

            {/* Monthly allowance */}
            <div style={{ ...S.card, padding: 20, marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <strong style={{ color: "#fafafa", fontSize: 14 }}>
                  Monthly allowance · {state.plan} plan
                </strong>
                <button
                  onClick={fetchState}
                  style={{
                    background: "transparent",
                    border: "1px solid #3f3f46",
                    color: "#71717a",
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: 11,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <RefreshCw size={11} />
                  Refresh
                </button>
              </div>
              <div style={{ fontSize: 12, color: "#71717a", marginBottom: 16 }}>
                Resets on{" "}
                {new Date(state.resetsAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </div>
              <UsageRow
                label="Chat messages"
                used={state.monthly.chat.used}
                limit={state.monthly.chat.limit}
                creditCost={1}
              />
              <UsageRow
                label="Creative briefs"
                used={state.monthly.creativeBrief.used}
                limit={state.monthly.creativeBrief.limit}
                creditCost={5}
              />
            </div>

            {/* Pack purchase */}
            <h2
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "#fafafa",
                marginBottom: 12,
              }}
            >
              Buy credit packs
            </h2>
            <div style={{ fontSize: 12, color: "#71717a", marginBottom: 16 }}>
              1 credit = ₹3. Pricing in INR. Larger packs include volume discount.
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 12,
              }}
            >
              {PACKS.map((pack) => (
                <div
                  key={pack.credits}
                  style={{
                    ...S.card,
                    padding: 18,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 700,
                      color: "#fafafa",
                      fontFamily: '"Sora", sans-serif',
                    }}
                  >
                    {pack.credits.toLocaleString("en-IN")}
                  </div>
                  <div style={{ fontSize: 12, color: "#71717a", marginBottom: 8 }}>credits</div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      color: "#f97316",
                      marginBottom: 4,
                    }}
                  >
                    {pack.label}
                  </div>
                  {pack.discount && (
                    <div style={{ fontSize: 11, color: "#86efac", marginBottom: 12 }}>
                      {pack.discount}
                    </div>
                  )}
                  <button
                    onClick={() => purchase(pack.credits)}
                    disabled={purchasing !== null}
                    style={{
                      marginTop: "auto",
                      background: purchasing === pack.credits ? "#27272e" : "#f97316",
                      color: purchasing === pack.credits ? "#71717a" : "#fff",
                      border: "none",
                      padding: "8px 14px",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: purchasing !== null ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <CreditCard size={13} />
                    {purchasing === pack.credits ? "Opening…" : "Buy"}
                  </button>
                </div>
              ))}
            </div>

            {error && (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 8,
                  color: "#f87171",
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function UsageRow({
  label,
  used,
  limit,
  creditCost,
}: {
  label: string;
  used: number;
  limit: number;
  creditCost: number;
}) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const exhausted = used >= limit;
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 4,
          fontSize: 13,
        }}
      >
        <span style={{ color: "#e4e4e7" }}>
          {label}{" "}
          <span style={{ color: "#71717a", fontSize: 11 }}>
            · {creditCost} credit{creditCost === 1 ? "" : "s"} each
          </span>
        </span>
        <span style={{ color: exhausted ? "#f87171" : "#a1a1aa" }}>
          {used.toLocaleString("en-IN")} / {limit > 0 ? limit.toLocaleString("en-IN") : "—"}
        </span>
      </div>
      <div style={{ background: "#1f1f23", height: 6, borderRadius: 3, overflow: "hidden" }}>
        <div
          style={{
            background: exhausted ? "#f87171" : pct > 80 ? "#fbbf24" : "#22c55e",
            height: "100%",
            width: `${pct}%`,
            transition: "width 0.3s",
          }}
        />
      </div>
    </div>
  );
}
