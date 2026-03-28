"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Rocket,
  CheckCircle2,
  ArrowRight,
  Loader2,
  SkipForward,
  LayoutDashboard,
  MessageSquare,
  Zap,
  Settings,
} from "lucide-react";

interface OnboardingProps {
  userName: string;
  hasGoogleConnection: boolean;
  hasMetaConnection: boolean;
  hasCampaigns: boolean;
}

const S = {
  card: {
    background: "#111114",
    border: "1px solid #27272e",
    borderRadius: "12px",
  } as React.CSSProperties,
};

/* ---------- Step indicator dots ---------- */
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "32px" }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? "28px" : "8px",
            height: "8px",
            borderRadius: "4px",
            background: i === current ? "#f97316" : i < current ? "#f97316" : "#27272e",
            opacity: i < current ? 0.5 : 1,
            transition: "all 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

/* ---------- Google Ads SVG icon ---------- */
function GoogleAdsIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3.272 16.092l6.093-10.59 4.073 2.35-6.093 10.59z" fill="#FBBC04" />
      <path d="M20.727 16.092l-6.093-10.59-4.073 2.35 6.093 10.59z" fill="#4285F4" />
      <circle cx="6.5" cy="18.5" r="2.5" fill="#34A853" />
    </svg>
  );
}

/* ---------- Meta Ads SVG icon ---------- */
function MetaAdsIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z"
        fill="#1877F2"
      />
    </svg>
  );
}

/* ---------- Main wizard ---------- */
export default function OnboardingWizard({
  userName,
  hasGoogleConnection: initialGoogle,
  hasMetaConnection: initialMeta,
  hasCampaigns: initialCampaigns,
}: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [googleConnected, setGoogleConnected] = useState(initialGoogle);
  const [metaConnected, setMetaConnected] = useState(initialMeta);
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(initialCampaigns);

  const firstName = userName?.split(" ")[0] || "there";

  /* Check connections on step 2 focus */
  async function refreshConnections() {
    try {
      const [gRes, mRes] = await Promise.all([
        fetch("/api/google-ads/connections"),
        fetch("/api/meta-ads/connections"),
      ]);
      if (gRes.ok) {
        const gData = await gRes.json();
        setGoogleConnected(Array.isArray(gData) ? gData.length > 0 : !!gData?.connected);
      }
      if (mRes.ok) {
        const mData = await mRes.json();
        setMetaConnected(Array.isArray(mData) ? mData.length > 0 : !!mData?.connected);
      }
    } catch {}
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const promises: Promise<Response>[] = [];
      if (metaConnected) promises.push(fetch("/api/meta-ads/sync", { method: "POST" }));
      if (googleConnected) promises.push(fetch("/api/cron/sync-ads", { method: "POST" }));
      if (promises.length === 0) promises.push(fetch("/api/cron/sync-ads", { method: "POST" }));
      await Promise.all(promises);
      setSyncDone(true);
    } catch {
      // still let them proceed
      setSyncDone(true);
    } finally {
      setSyncing(false);
    }
  }

  function goNext() {
    if (step === 1) refreshConnections();
    setStep((s) => Math.min(s + 1, 3));
  }

  /* ========== Step 0: Welcome ========== */
  function StepWelcome() {
    return (
      <div style={{ textAlign: "center", maxWidth: "480px", margin: "0 auto" }}>
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "20px",
            background: "rgba(249,115,22,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          <Rocket size={32} color="#f97316" />
        </div>
        <h1
          style={{
            fontFamily: '"Sora", sans-serif',
            fontSize: "28px",
            fontWeight: 800,
            color: "#fafafa",
            letterSpacing: "-0.5px",
            marginBottom: "8px",
          }}
        >
          Welcome to ManagedAd{firstName !== "there" ? `, ${firstName}` : ""}
        </h1>
        <p style={{ fontSize: "15px", color: "#71717a", lineHeight: "1.6", marginBottom: "32px" }}>
          Your AI-powered ad optimization engine. Let&apos;s get you set up in 3 minutes.
        </p>
        <button
          onClick={goNext}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 32px",
            background: "#f97316",
            border: "none",
            borderRadius: "10px",
            color: "#fff",
            fontSize: "15px",
            fontWeight: 700,
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#ea580c")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#f97316")}
        >
          Get Started <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  /* ========== Step 1: Connect Ad Platform ========== */
  function StepConnect() {
    const platforms = [
      {
        name: "Google Ads",
        description: "Connect your Google Ads account to import campaigns, keywords, and performance data.",
        icon: <GoogleAdsIcon size={32} />,
        accent: "#4285F4",
        href: "/google-ads/connect",
        connected: googleConnected,
      },
      {
        name: "Meta Ads",
        description: "Connect your Meta (Facebook & Instagram) ad account to sync campaigns and creatives.",
        icon: <MetaAdsIcon size={32} />,
        accent: "#1877F2",
        href: "/meta-ads/connect",
        connected: metaConnected,
      },
    ];

    return (
      <div style={{ maxWidth: "560px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <h2
            style={{
              fontFamily: '"Sora", sans-serif',
              fontSize: "22px",
              fontWeight: 800,
              color: "#fafafa",
              letterSpacing: "-0.3px",
              marginBottom: "6px",
            }}
          >
            Connect Your Ad Platform
          </h2>
          <p style={{ fontSize: "14px", color: "#71717a" }}>
            Link at least one ad account to get started.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
          {platforms.map((p) => (
            <div
              key={p.name}
              style={{
                ...S.card,
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                gap: "18px",
                borderColor: p.connected ? "#34d399" : "#27272e",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "12px",
                  background: `${p.accent}10`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {p.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: "#fafafa" }}>{p.name}</span>
                  {p.connected && <CheckCircle2 size={16} color="#34d399" />}
                </div>
                <p style={{ fontSize: "12px", color: "#52525b", lineHeight: "1.5", margin: 0 }}>
                  {p.description}
                </p>
              </div>
              {p.connected ? (
                <span
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 600,
                    background: "rgba(52,211,153,0.1)",
                    color: "#34d399",
                    flexShrink: 0,
                  }}
                >
                  Connected
                </span>
              ) : (
                <Link href={p.href} style={{ textDecoration: "none", flexShrink: 0 }}>
                  <button
                    style={{
                      padding: "8px 20px",
                      background: p.accent,
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "opacity 0.15s",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.85")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
                  >
                    Connect
                  </button>
                </Link>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={() => setStep(0)}
            style={{
              background: "none",
              border: "none",
              color: "#52525b",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Back
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={goNext}
              style={{
                background: "none",
                border: "none",
                color: "#71717a",
                fontSize: "13px",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              Skip for now
            </button>
            {(googleConnected || metaConnected) && (
              <button
                onClick={goNext}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 24px",
                  background: "#f97316",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Continue <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ========== Step 2: First Sync ========== */
  function StepSync() {
    const anyConnected = googleConnected || metaConnected;

    return (
      <div style={{ maxWidth: "480px", margin: "0 auto", textAlign: "center" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "16px",
            background: "rgba(249,115,22,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          {syncing ? (
            <Loader2 size={28} color="#f97316" style={{ animation: "spin 1s linear infinite" }} />
          ) : syncDone ? (
            <CheckCircle2 size={28} color="#34d399" />
          ) : (
            <Zap size={28} color="#f97316" />
          )}
        </div>

        <h2
          style={{
            fontFamily: '"Sora", sans-serif',
            fontSize: "22px",
            fontWeight: 800,
            color: "#fafafa",
            letterSpacing: "-0.3px",
            marginBottom: "6px",
          }}
        >
          {syncDone ? "Sync Complete" : "Sync Your Campaigns"}
        </h2>
        <p style={{ fontSize: "14px", color: "#71717a", marginBottom: "28px", lineHeight: "1.6" }}>
          {syncDone
            ? "Your campaigns and performance data have been imported successfully."
            : anyConnected
              ? "Import your existing campaigns and performance data so ManagedAd can start optimizing."
              : "No ad platform connected yet. You can sync later from Settings."}
        </p>

        {!syncDone && (
          <button
            onClick={handleSync}
            disabled={syncing || !anyConnected}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 28px",
              background: syncing || !anyConnected ? "#27272e" : "#f97316",
              border: "none",
              borderRadius: "10px",
              color: syncing || !anyConnected ? "#52525b" : "#fff",
              fontSize: "14px",
              fontWeight: 700,
              cursor: syncing || !anyConnected ? "not-allowed" : "pointer",
              marginBottom: "16px",
              transition: "background 0.15s",
            }}
          >
            {syncing ? (
              <>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Syncing...
              </>
            ) : (
              "Sync My Campaigns"
            )}
          </button>
        )}

        {syncing && (
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                height: "4px",
                background: "#1f1f25",
                borderRadius: "2px",
                overflow: "hidden",
                maxWidth: "240px",
                margin: "0 auto",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: "#f97316",
                  borderRadius: "2px",
                  animation: "progressPulse 2s ease-in-out infinite",
                  width: "60%",
                }}
              />
            </div>
            <style>{`
              @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
              @keyframes progressPulse { 0% { width: 20%; } 50% { width: 80%; } 100% { width: 20%; } }
            `}</style>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
          <button
            onClick={() => setStep(1)}
            style={{
              background: "none",
              border: "none",
              color: "#52525b",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Back
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {!syncDone && (
              <button
                onClick={goNext}
                style={{
                  background: "none",
                  border: "none",
                  color: "#71717a",
                  fontSize: "13px",
                  cursor: "pointer",
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                }}
              >
                Skip — I&apos;ll sync later
              </button>
            )}
            {syncDone && (
              <button
                onClick={goNext}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 24px",
                  background: "#f97316",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Continue <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ========== Step 3: All Set ========== */
  function StepComplete() {
    const completedSteps = [
      { label: "Account created", done: true },
      { label: "Ad platform connected", done: googleConnected || metaConnected },
      { label: "Campaigns synced", done: syncDone },
    ];

    const quickLinks = [
      { label: "Dashboard", description: "View your performance overview", icon: LayoutDashboard, href: "/dashboard", color: "#f97316" },
      { label: "AI Chat", description: "Ask questions about your data", icon: MessageSquare, href: "/chat", color: "#818cf8" },
      { label: "Automations", description: "Set up AI optimization rules", icon: Zap, href: "/automations", color: "#fbbf24" },
      { label: "Settings", description: "Configure your preferences", icon: Settings, href: "/settings", color: "#71717a" },
    ];

    return (
      <div style={{ maxWidth: "520px", margin: "0 auto", textAlign: "center" }}>
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "20px",
            background: "rgba(52,211,153,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <CheckCircle2 size={32} color="#34d399" />
        </div>

        <h2
          style={{
            fontFamily: '"Sora", sans-serif',
            fontSize: "26px",
            fontWeight: 800,
            color: "#fafafa",
            letterSpacing: "-0.5px",
            marginBottom: "6px",
          }}
        >
          You&apos;re All Set!
        </h2>
        <p style={{ fontSize: "14px", color: "#71717a", marginBottom: "24px" }}>
          ManagedAd is ready to optimize your ad performance.
        </p>

        {/* Completion checklist */}
        <div
          style={{
            ...S.card,
            padding: "16px 20px",
            marginBottom: "24px",
            textAlign: "left",
          }}
        >
          {completedSteps.map((s, i) => (
            <div
              key={s.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 0",
                borderBottom: i < completedSteps.length - 1 ? "1px solid #1f1f25" : "none",
              }}
            >
              <CheckCircle2
                size={16}
                color={s.done ? "#34d399" : "#3f3f46"}
              />
              <span style={{ fontSize: "13px", color: s.done ? "#e4e4e7" : "#52525b" }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            marginBottom: "24px",
          }}
        >
          {quickLinks.map((link) => (
            <Link key={link.label} href={link.href} style={{ textDecoration: "none" }}>
              <div
                style={{
                  ...S.card,
                  padding: "14px 16px",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = link.color)}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#27272e")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <link.icon size={14} color={link.color} />
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#fafafa" }}>{link.label}</span>
                </div>
                <p style={{ fontSize: "11px", color: "#52525b", margin: 0 }}>{link.description}</p>
              </div>
            </Link>
          ))}
        </div>

        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 32px",
              background: "#f97316",
              border: "none",
              borderRadius: "10px",
              color: "#fff",
              fontSize: "15px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Go to Dashboard <ArrowRight size={16} />
          </button>
        </Link>
      </div>
    );
  }

  /* ========== Render ========== */
  const steps = [<StepWelcome key={0} />, <StepConnect key={1} />, <StepSync key={2} />, <StepComplete key={3} />];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "calc(100vh - 120px)",
        padding: "40px 20px",
      }}
    >
      <StepIndicator current={step} total={4} />
      {steps[step]}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
