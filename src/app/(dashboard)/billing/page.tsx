"use client";

import { Suspense, useState } from "react";
import { Check, Zap, Crown, Building2, Loader2 } from "lucide-react";

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" },
};

const PLANS = [
  {
    key: "STARTER",
    name: "Starter",
    price: "₹2,999",
    priceMonthly: 2999,
    period: "/month",
    description: "Perfect for growing businesses managing 1-2 ad accounts.",
    icon: Zap,
    color: "#fb923c",
    features: [
      "2 ad platform connections",
      "Up to 25 campaigns",
      "Negative keyword mining",
      "Budget optimization",
      "Daily performance digest",
      "7-day rollback history",
      "Email support",
    ],
    cta: "Start Free Trial",
    popular: false,
    current: false,
  },
  {
    key: "GROWTH",
    name: "Growth",
    price: "₹7,999",
    priceMonthly: 7999,
    period: "/month",
    description: "For scaling teams that need full AI automation.",
    icon: Crown,
    color: "#f97316",
    features: [
      "All Starter features",
      "4 ad platform connections",
      "Unlimited campaigns",
      "Click fraud detection",
      "Creative fatigue monitoring",
      "AI chat interface",
      "Competitor intelligence",
      "Slack + WhatsApp alerts",
      "Weekly PDF reports",
      "30-day rollback history",
      "Priority support",
    ],
    cta: "Start Free Trial",
    popular: true,
    current: true,
  },
  {
    key: "AGENCY",
    name: "Agency",
    price: "₹19,999",
    priceMonthly: 19999,
    period: "/month",
    description: "For agencies managing multiple client accounts.",
    icon: Building2,
    color: "#a78bfa",
    features: [
      "All Growth features",
      "Unlimited ad accounts",
      "Multi-client management",
      "Cross-platform budget shift",
      "White-label reports",
      "Landing page builder",
      "REST API access",
      "Custom domain reports",
      "90-day rollback history",
      "Dedicated account manager",
    ],
    cta: "Contact Sales",
    popular: false,
    current: false,
  },
];

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function BillingContent() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSubscribe(planKey: string) {
    if (planKey === "AGENCY") {
      window.open("mailto:sales@managedad.io?subject=Agency Plan Inquiry", "_blank");
      return;
    }

    setLoading(planKey);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Failed to load payment gateway. Please try again.");
        return;
      }

      const res = await fetch("/api/billing/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey, billing }),
      });

      if (!res.ok) throw new Error("Failed to create order");
      const order = await res.json();

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "ManagedAd",
        description: `${order.planName} Plan — ${billing === "annual" ? "Annual" : "Monthly"}`,
        order_id: order.orderId,
        prefill: order.prefill,
        theme: { color: "#f97316" },
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/billing/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: planKey,
              billing,
            }),
          });
          if (verifyRes.ok) {
            window.location.href = "/billing?success=true";
          } else {
            alert("Payment verification failed. Please contact support.");
          }
        },
        modal: { ondismiss: () => setLoading(null) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "3px" }}>Billing</h1>
        <p style={{ fontSize: "13px", color: "#52525b" }}>Choose the plan that fits your business. Cancel anytime.</p>
      </div>

      {/* Current plan banner */}
      <div style={{ padding: "16px 20px", background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: "10px", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
        <Crown size={16} color="#f97316" />
        <div>
          <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#fafafa" }}>You&apos;re on the Growth plan</span>
          <span style={{ fontSize: "12.5px", color: "#71717a", marginLeft: "8px" }}>Trial ends in 7 days</span>
        </div>
        <button onClick={() => handleSubscribe("GROWTH")} style={{ marginLeft: "auto", padding: "7px 16px", background: "#f97316", border: "none", borderRadius: "7px", color: "#fff", fontSize: "12.5px", fontWeight: 600, cursor: "pointer" }}>
          Upgrade Now
        </button>
      </div>

      {/* Billing toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "center" }}>
        <span style={{ fontSize: "13px", color: billing === "monthly" ? "#fafafa" : "#52525b", fontWeight: billing === "monthly" ? 600 : 400 }}>Monthly</span>
        <button onClick={() => setBilling(billing === "monthly" ? "annual" : "monthly")} style={{ width: "46px", height: "26px", borderRadius: "13px", border: "none", cursor: "pointer", background: billing === "annual" ? "#f97316" : "#27272e", position: "relative", transition: "background 0.2s" }}>
          <span style={{ position: "absolute", top: "3px", left: billing === "annual" ? "23px" : "3px", width: "20px", height: "20px", borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
        </button>
        <span style={{ fontSize: "13px", color: billing === "annual" ? "#fafafa" : "#52525b", fontWeight: billing === "annual" ? 600 : 400 }}>Annual</span>
        {billing === "annual" && <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "10.5px", fontWeight: 700, background: "rgba(52,211,153,0.12)", color: "#34d399" }}>SAVE 20%</span>}
      </div>

      {/* Plans */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        {PLANS.map((plan) => {
          const displayPrice = billing === "annual"
            ? `₹${Math.round(plan.priceMonthly * 0.8).toLocaleString("en-IN")}`
            : plan.price;
          const isLoading = loading === plan.key;

          return (
            <div key={plan.name} style={{
              ...S.card,
              position: "relative",
              borderColor: plan.popular ? "rgba(249,115,22,0.5)" : "#27272e",
              background: plan.popular ? "rgba(249,115,22,0.03)" : "#111114",
            }}>
              {plan.popular && (
                <div style={{ position: "absolute", top: "-1px", left: "50%", transform: "translateX(-50%)", padding: "4px 14px", background: "#f97316", borderRadius: "0 0 8px 8px", fontSize: "10px", fontWeight: 700, color: "#fff", letterSpacing: "0.5px" }}>
                  MOST POPULAR
                </div>
              )}
              {plan.current && (
                <div style={{ position: "absolute", top: "14px", right: "14px", padding: "2px 8px", background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: "4px", fontSize: "9.5px", fontWeight: 700, color: "#34d399" }}>CURRENT</div>
              )}
              <div style={{ padding: "24px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <plan.icon size={16} color={plan.color} />
                  <span style={{ fontFamily: '"Sora", sans-serif', fontSize: "15px", fontWeight: 700, color: "#fafafa" }}>{plan.name}</span>
                </div>
                <div style={{ marginBottom: "4px" }}>
                  <span style={{ fontFamily: '"Sora", sans-serif', fontSize: "28px", fontWeight: 800, color: plan.color }}>{displayPrice}</span>
                  <span style={{ fontSize: "13px", color: "#52525b" }}>/month</span>
                </div>
                {billing === "annual" && <div style={{ fontSize: "11px", color: "#3f3f46", marginBottom: "12px" }}>billed annually</div>}
                <div style={{ fontSize: "12.5px", color: "#52525b", marginBottom: "20px", lineHeight: 1.5 }}>{plan.description}</div>

                <div style={{ height: "1px", background: "#1f1f25", marginBottom: "18px" }} />

                <div style={{ display: "flex", flexDirection: "column", gap: "9px", marginBottom: "22px" }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                      <Check size={12} color="#34d399" style={{ marginTop: "2px", flexShrink: 0 }} />
                      <span style={{ fontSize: "12.5px", color: "#a1a1aa", lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => !plan.current && handleSubscribe(plan.key)}
                  disabled={plan.current || isLoading}
                  style={{
                    width: "100%", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                    background: plan.current ? "transparent" : plan.popular ? "#f97316" : "transparent",
                    border: `1px solid ${plan.current ? "#27272e" : plan.popular ? "#f97316" : "#27272e"}`,
                    borderRadius: "8px",
                    color: plan.current ? "#71717a" : plan.popular ? "#fff" : "#a1a1aa",
                    fontSize: "13px", fontWeight: 600, cursor: plan.current ? "default" : "pointer",
                    opacity: isLoading ? 0.7 : 1,
                  }}>
                  {isLoading && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
                  {plan.current ? "Current Plan" : plan.cta}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Usage */}
      <div style={{ ...S.card, padding: "22px 24px" }}>
        <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa", marginBottom: "16px" }}>Current Usage</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
          {[
            { label: "Ad Accounts", used: 2, limit: 4 },
            { label: "Active Campaigns", used: 6, limit: "Unlimited" },
            { label: "Automation Actions", used: 847, limit: "Unlimited" },
          ].map(u => (
            <div key={u.label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "12.5px", color: "#71717a" }}>{u.label}</span>
                <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#fafafa", fontFamily: "var(--font-ibm-plex-mono), monospace" }}>
                  {u.used}{typeof u.limit === "number" ? ` / ${u.limit}` : " / ∞"}
                </span>
              </div>
              {typeof u.limit === "number" && (
                <div style={{ height: "4px", background: "#1f1f25", borderRadius: "2px" }}>
                  <div style={{ height: "100%", width: `${(u.used / u.limit) * 100}%`, background: "#f97316", borderRadius: "2px" }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return <Suspense fallback={null}><BillingContent /></Suspense>;
}
