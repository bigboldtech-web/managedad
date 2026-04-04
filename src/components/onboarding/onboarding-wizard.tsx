"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Rocket, CheckCircle2, ArrowRight, ArrowLeft, Loader2,
  Zap, Settings2, Shield, TrendingUp, Brain, BarChart3,
  Target, MousePointerClick, Bot,
} from "lucide-react";

/* ─── Types ─── */
interface OnboardingData {
  step: number;
  completed: boolean;
  autonomousMode: boolean;
  userName: string;
  googleConnections: { id: string; accountName: string | null; customerId: string }[];
  metaConnections: { id: string; accountName: string | null; adAccountId: string }[];
  campaignCount: number;
  hasOptSettings: boolean;
  autoApply: boolean;
}

/* ─── Styles ─── */
const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" } as React.CSSProperties,
  btn: {
    display: "inline-flex", alignItems: "center", gap: "8px",
    padding: "12px 28px", background: "#f97316", border: "none", borderRadius: "10px",
    color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer",
  } as React.CSSProperties,
  btnGhost: {
    background: "none", border: "none", color: "#52525b", fontSize: "13px", cursor: "pointer",
  } as React.CSSProperties,
  heading: {
    fontFamily: '"Sora", sans-serif', fontSize: "24px", fontWeight: 800,
    color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "8px",
  } as React.CSSProperties,
  sub: { fontSize: "14px", color: "#71717a", lineHeight: "1.7", marginBottom: "28px" } as React.CSSProperties,
};

/* ─── Google Ads SVG icon ─── */
function GoogleAdsIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3.272 16.092l6.093-10.59 4.073 2.35-6.093 10.59z" fill="#FBBC04" />
      <path d="M20.727 16.092l-6.093-10.59-4.073 2.35 6.093 10.59z" fill="#4285F4" />
      <circle cx="6.5" cy="18.5" r="2.5" fill="#34A853" />
    </svg>
  );
}

/* ─── Meta Ads SVG icon ─── */
function MetaAdsIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z" fill="#1877F2" />
    </svg>
  );
}

/* ─── Step Progress Bar ─── */
function ProgressBar({ current, total }: { current: number; total: number }) {
  const labels = ["Welcome", "Google Ads", "Meta Ads", "Sync Data", "Preferences", "Go Live"];
  return (
    <div style={{ marginBottom: "40px", maxWidth: "600px", width: "100%", margin: "0 auto 40px" }}>
      {/* Step count */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
        <span style={{ fontSize: "11px", color: "#52525b", fontWeight: 600 }}>STEP {current + 1} OF {total}</span>
        <span style={{ fontSize: "11px", color: "#52525b" }}>{labels[current]}</span>
      </div>
      {/* Bar */}
      <div style={{ height: "4px", background: "#1f1f25", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${((current + 1) / total) * 100}%`, background: "#f97316", borderRadius: "2px", transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

/* ─── Navigation buttons ─── */
function NavButtons({ onBack, onNext, onSkip, nextLabel, nextDisabled }: {
  onBack?: () => void; onNext: () => void; onSkip?: () => void;
  nextLabel?: string; nextDisabled?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "32px" }}>
      {onBack ? (
        <button onClick={onBack} style={S.btnGhost}><ArrowLeft size={14} /> Back</button>
      ) : <div />}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {onSkip && (
          <button onClick={onSkip} style={{ ...S.btnGhost, textDecoration: "underline", textUnderlineOffset: "3px", color: "#71717a" }}>
            Skip for now
          </button>
        )}
        <button onClick={onNext} disabled={nextDisabled} style={{ ...S.btn, opacity: nextDisabled ? 0.5 : 1, cursor: nextDisabled ? "not-allowed" : "pointer" }}>
          {nextLabel || "Continue"} <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   STEP 0: Welcome
   ════════════════════════════════════════════════ */
function StepWelcome({ firstName, onNext }: { firstName: string; onNext: () => void }) {
  const benefits = [
    { icon: Brain, label: "AI-Powered Optimization", desc: "Automated keyword, bid, and budget optimization running 24/7" },
    { icon: Shield, label: "Click Fraud Protection", desc: "Detect and block fraudulent clicks to save your ad spend" },
    { icon: TrendingUp, label: "Growth Recommendations", desc: "Weekly AI insights to scale your campaigns profitably" },
  ];

  return (
    <div style={{ textAlign: "center", maxWidth: "540px", margin: "0 auto" }}>
      <div style={{ width: "80px", height: "80px", borderRadius: "24px", background: "rgba(249,115,22,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
        <Rocket size={36} color="#f97316" />
      </div>
      <h1 style={{ ...S.heading, fontSize: "30px" }}>
        Welcome{firstName !== "there" ? `, ${firstName}` : ""}!
      </h1>
      <p style={S.sub}>
        ManagedAd is your autonomous AI performance marketer. Connect your ad accounts and let our AI optimize everything — keywords, bids, budgets, creatives — automatically.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px", textAlign: "left" }}>
        {benefits.map((b) => (
          <div key={b.label} style={{ ...S.card, padding: "16px 20px", display: "flex", gap: "14px", alignItems: "center" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(249,115,22,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <b.icon size={20} color="#f97316" />
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#fafafa", marginBottom: "2px" }}>{b.label}</div>
              <div style={{ fontSize: "12px", color: "#52525b" }}>{b.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={onNext} style={{ ...S.btn, padding: "14px 40px", fontSize: "15px" }}>
        Get Started — It takes 3 minutes <ArrowRight size={16} />
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════
   STEP 1: Connect Google Ads
   ════════════════════════════════════════════════ */
function StepConnectGoogle({ connections, onNext, onBack, onSkip, onRefresh }: {
  connections: OnboardingData["googleConnections"]; onNext: () => void; onBack: () => void; onSkip: () => void; onRefresh: () => void;
}) {
  const connected = connections.length > 0;

  // Poll for connections after redirect
  useEffect(() => {
    if (connected) return;
    const interval = setInterval(onRefresh, 3000);
    return () => clearInterval(interval);
  }, [connected, onRefresh]);

  const steps = [
    "Click the 'Connect Google Ads' button below",
    "Sign in with your Google account that has access to Google Ads",
    "Grant ManagedAd permission to manage your campaigns",
    "You'll be redirected back here automatically",
  ];

  return (
    <div style={{ maxWidth: "520px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "rgba(66,133,244,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          {connected ? <CheckCircle2 size={28} color="#34d399" /> : <GoogleAdsIcon size={32} />}
        </div>
        <h2 style={S.heading}>Connect Google Ads</h2>
        <p style={{ ...S.sub, marginBottom: "20px" }}>
          {connected
            ? `Connected: ${connections.map(c => c.accountName || c.customerId).join(", ")}`
            : "Link your Google Ads account so ManagedAd can import and optimize your campaigns."}
        </p>
      </div>

      {!connected && (
        <>
          <div style={{ ...S.card, padding: "20px", marginBottom: "24px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#3f3f46", marginBottom: "14px" }}>
              HOW IT WORKS
            </div>
            {steps.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: "12px", marginBottom: i < steps.length - 1 ? "12px" : "0" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "rgba(249,115,22,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "11px", fontWeight: 700, color: "#f97316" }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: "13px", color: "#a1a1aa", lineHeight: "24px" }}>{s}</span>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <Link href="/api/google-ads/connect" style={{ textDecoration: "none" }}>
              <button style={{ ...S.btn, background: "#4285F4", padding: "14px 32px" }}>
                <GoogleAdsIcon size={20} /> Connect Google Ads
              </button>
            </Link>
          </div>
        </>
      )}

      {connected && (
        <div style={{ ...S.card, padding: "16px 20px" }}>
          {connections.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0" }}>
              <CheckCircle2 size={16} color="#34d399" />
              <span style={{ fontSize: "13px", color: "#e4e4e7" }}>{c.accountName || `Account ${c.customerId}`}</span>
              <span style={{ fontSize: "11px", color: "#52525b", marginLeft: "auto" }}>{c.customerId}</span>
            </div>
          ))}
        </div>
      )}

      <NavButtons onBack={onBack} onNext={onNext} onSkip={connected ? undefined : onSkip} nextLabel={connected ? "Continue" : "Skip — Connect Later"} />
    </div>
  );
}

/* ════════════════════════════════════════════════
   STEP 2: Connect Meta Ads
   ════════════════════════════════════════════════ */
function StepConnectMeta({ connections, onNext, onBack, onSkip, onRefresh }: {
  connections: OnboardingData["metaConnections"]; onNext: () => void; onBack: () => void; onSkip: () => void; onRefresh: () => void;
}) {
  const connected = connections.length > 0;

  useEffect(() => {
    if (connected) return;
    const interval = setInterval(onRefresh, 3000);
    return () => clearInterval(interval);
  }, [connected, onRefresh]);

  const steps = [
    "Click the 'Connect Meta Ads' button below",
    "Log in with the Facebook account linked to your Business Manager",
    "Select the ad accounts you want ManagedAd to manage",
    "You'll be redirected back here automatically",
  ];

  return (
    <div style={{ maxWidth: "520px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "rgba(24,119,242,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          {connected ? <CheckCircle2 size={28} color="#34d399" /> : <MetaAdsIcon size={32} />}
        </div>
        <h2 style={S.heading}>Connect Meta Ads</h2>
        <p style={{ ...S.sub, marginBottom: "20px" }}>
          {connected
            ? `Connected: ${connections.map(c => c.accountName || c.adAccountId).join(", ")}`
            : "Link your Facebook & Instagram ad accounts for cross-platform optimization."}
        </p>
      </div>

      {!connected && (
        <>
          <div style={{ ...S.card, padding: "20px", marginBottom: "24px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#3f3f46", marginBottom: "14px" }}>
              HOW IT WORKS
            </div>
            {steps.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: "12px", marginBottom: i < steps.length - 1 ? "12px" : "0" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "rgba(24,119,242,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "11px", fontWeight: 700, color: "#1877F2" }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: "13px", color: "#a1a1aa", lineHeight: "24px" }}>{s}</span>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <Link href="/api/meta-ads/connect" style={{ textDecoration: "none" }}>
              <button style={{ ...S.btn, background: "#1877F2", padding: "14px 32px" }}>
                <MetaAdsIcon size={20} /> Connect Meta Ads
              </button>
            </Link>
          </div>
        </>
      )}

      {connected && (
        <div style={{ ...S.card, padding: "16px 20px" }}>
          {connections.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0" }}>
              <CheckCircle2 size={16} color="#34d399" />
              <span style={{ fontSize: "13px", color: "#e4e4e7" }}>{c.accountName || `Account ${c.adAccountId}`}</span>
              <span style={{ fontSize: "11px", color: "#52525b", marginLeft: "auto" }}>{c.adAccountId}</span>
            </div>
          ))}
        </div>
      )}

      <NavButtons onBack={onBack} onNext={onNext} onSkip={connected ? undefined : onSkip} nextLabel={connected ? "Continue" : "Skip — Connect Later"} />
    </div>
  );
}

/* ════════════════════════════════════════════════
   STEP 3: Auto-Sync
   ════════════════════════════════════════════════ */
function StepSync({ hasConnections, campaignCount, onNext, onBack }: {
  hasConnections: boolean; campaignCount: number; onNext: () => void; onBack: () => void;
}) {
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(campaignCount > 0);
  const [syncedCount, setSyncedCount] = useState(campaignCount);

  async function handleSync() {
    setSyncing(true);
    try {
      await fetch("/api/cron/sync-ads", { method: "POST" });
      // Fetch updated campaign count
      const res = await fetch("/api/campaigns");
      if (res.ok) {
        const data = await res.json();
        setSyncedCount(Array.isArray(data) ? data.length : data?.campaigns?.length || 0);
      }
      setSyncDone(true);
    } catch {
      setSyncDone(true);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", textAlign: "center" }}>
      <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: syncing ? "rgba(249,115,22,0.1)" : syncDone ? "rgba(52,211,153,0.1)" : "rgba(249,115,22,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        {syncing ? (
          <Loader2 size={28} color="#f97316" className="animate-spin" />
        ) : syncDone ? (
          <CheckCircle2 size={28} color="#34d399" />
        ) : (
          <Zap size={28} color="#f97316" />
        )}
      </div>

      <h2 style={S.heading}>
        {syncDone ? "Sync Complete!" : "Import Your Campaign Data"}
      </h2>
      <p style={S.sub}>
        {syncDone
          ? `Imported ${syncedCount} campaign${syncedCount !== 1 ? "s" : ""} with all keywords, ad groups, creatives, and performance metrics.`
          : hasConnections
            ? "We'll import all your campaigns, keywords, ad copy, and performance history. This usually takes 30-60 seconds."
            : "No ad accounts connected yet. You can sync later from Settings after connecting an account."}
      </p>

      {!syncDone && hasConnections && (
        <button onClick={handleSync} disabled={syncing} style={{ ...S.btn, marginBottom: "16px", opacity: syncing ? 0.7 : 1 }}>
          {syncing ? (
            <><Loader2 size={16} className="animate-spin" /> Importing data...</>
          ) : (
            <><Zap size={16} /> Sync My Campaigns</>
          )}
        </button>
      )}

      {syncing && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ height: "4px", background: "#1f1f25", borderRadius: "2px", overflow: "hidden", maxWidth: "240px", margin: "0 auto" }}>
            <div style={{ height: "100%", background: "#f97316", borderRadius: "2px", animation: "progressPulse 2s ease-in-out infinite", width: "60%" }} />
          </div>
          <p style={{ fontSize: "12px", color: "#52525b", marginTop: "10px" }}>
            Fetching campaigns, keywords, ad groups, and metrics...
          </p>
        </div>
      )}

      {syncDone && syncedCount > 0 && (
        <div style={{ ...S.card, padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "8px", textAlign: "center" }}>
          {[
            { label: "Campaigns", value: syncedCount, icon: BarChart3 },
            { label: "Data Synced", value: "All", icon: Target },
            { label: "Ready", value: "Yes", icon: CheckCircle2 },
          ].map((item) => (
            <div key={item.label}>
              <item.icon size={18} color="#f97316" style={{ margin: "0 auto 6px", display: "block" }} />
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#fafafa" }}>{item.value}</div>
              <div style={{ fontSize: "11px", color: "#52525b" }}>{item.label}</div>
            </div>
          ))}
        </div>
      )}

      <NavButtons onBack={onBack} onNext={onNext} onSkip={!syncDone && hasConnections ? onNext : undefined} nextLabel={syncDone ? "Continue" : "Skip"} />

      <style>{`
        @keyframes progressPulse { 0% { width: 20%; } 50% { width: 80%; } 100% { width: 20%; } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

/* ════════════════════════════════════════════════
   STEP 4: Optimization Preferences
   ════════════════════════════════════════════════ */
function StepPreferences({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [targetRoas, setTargetRoas] = useState(3);
  const [maxBudgetIncrease, setMaxBudgetIncrease] = useState(25);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/optimization/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isEnabled: true,
          highPerformanceThreshold: targetRoas,
          maxBudgetIncrease,
          maxBudgetDecrease: 50,
          minImpressions: 100,
        }),
      });
    } catch {}
    setSaving(false);
    onNext();
  }

  return (
    <div style={{ maxWidth: "520px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "rgba(249,115,22,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Settings2 size={28} color="#f97316" />
        </div>
        <h2 style={S.heading}>Set Your Preferences</h2>
        <p style={{ ...S.sub, marginBottom: "8px" }}>
          Tell us your goals. ManagedAd will use these to optimize your campaigns automatically.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "8px" }}>
        {/* Target ROAS */}
        <div style={{ ...S.card, padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#fafafa", marginBottom: "2px" }}>
                Target Return on Ad Spend (ROAS)
              </div>
              <div style={{ fontSize: "12px", color: "#52525b" }}>
                For every ₹1 you spend, how much revenue do you want back?
              </div>
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#f97316", fontFamily: '"Sora", sans-serif' }}>
              {targetRoas}x
            </div>
          </div>
          <input
            type="range" min={1} max={10} step={0.5} value={targetRoas}
            onChange={(e) => setTargetRoas(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#f97316" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#3f3f46", marginTop: "4px" }}>
            <span>1x (Break even)</span>
            <span>5x (Good)</span>
            <span>10x (Excellent)</span>
          </div>
        </div>

        {/* Max Budget Increase */}
        <div style={{ ...S.card, padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#fafafa", marginBottom: "2px" }}>
                Maximum Budget Change
              </div>
              <div style={{ fontSize: "12px", color: "#52525b" }}>
                How much can the AI increase a campaign&apos;s budget at once?
              </div>
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#f97316", fontFamily: '"Sora", sans-serif' }}>
              {maxBudgetIncrease}%
            </div>
          </div>
          <input
            type="range" min={10} max={50} step={5} value={maxBudgetIncrease}
            onChange={(e) => setMaxBudgetIncrease(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#f97316" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#3f3f46", marginTop: "4px" }}>
            <span>10% (Conservative)</span>
            <span>30% (Balanced)</span>
            <span>50% (Aggressive)</span>
          </div>
        </div>
      </div>

      <NavButtons onBack={onBack} onNext={handleSave} nextLabel={saving ? "Saving..." : "Save & Continue"} nextDisabled={saving} />
    </div>
  );
}

/* ════════════════════════════════════════════════
   STEP 5: Enable Autonomous Mode
   ════════════════════════════════════════════════ */
function StepAutonomous({ onBack, onComplete }: { onBack: () => void; onComplete: (autonomous: boolean) => void }) {
  const [autonomous, setAutonomous] = useState(true);

  const features = [
    { icon: MousePointerClick, label: "Weekly Keyword Review", desc: "Find waste, discover new keywords, adjust match types" },
    { icon: Target, label: "Weekly Creative Review", desc: "Detect ad fatigue, generate fresh ad variations" },
    { icon: BarChart3, label: "Weekly Bid & Budget Review", desc: "Optimize bids and reallocate budgets to winners" },
    { icon: Shield, label: "Competitor Monitoring", desc: "Track competitor moves, defend your position" },
    { icon: TrendingUp, label: "Growth Recommendations", desc: "Weekly AI insights to scale your campaigns" },
  ];

  return (
    <div style={{ maxWidth: "520px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "rgba(249,115,22,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Bot size={28} color="#f97316" />
        </div>
        <h2 style={S.heading}>Enable Autonomous Mode</h2>
        <p style={{ ...S.sub, marginBottom: "8px" }}>
          When autonomous mode is on, ManagedAd becomes your full-time performance marketer — running reviews, making optimizations, and sending you weekly growth strategies.
        </p>
      </div>

      {/* Toggle */}
      <div
        onClick={() => setAutonomous(!autonomous)}
        style={{
          ...S.card, padding: "20px", marginBottom: "20px", cursor: "pointer",
          borderColor: autonomous ? "#f97316" : "#27272e", transition: "border-color 0.2s",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#fafafa", marginBottom: "2px" }}>
            Autonomous Mode
          </div>
          <div style={{ fontSize: "12px", color: "#52525b" }}>
            Let AI make safe optimizations automatically within your limits
          </div>
        </div>
        <div style={{
          width: "48px", height: "26px", borderRadius: "13px",
          background: autonomous ? "#f97316" : "#27272e",
          position: "relative", transition: "background 0.2s",
        }}>
          <div style={{
            width: "22px", height: "22px", borderRadius: "50%", background: "#fff",
            position: "absolute", top: "2px",
            left: autonomous ? "24px" : "2px", transition: "left 0.2s",
          }} />
        </div>
      </div>

      {/* Features list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "8px" }}>
        {features.map((f) => (
          <div key={f.label} style={{ display: "flex", gap: "12px", alignItems: "center", padding: "10px 16px", borderRadius: "8px", background: autonomous ? "rgba(249,115,22,0.04)" : "transparent" }}>
            <f.icon size={16} color={autonomous ? "#f97316" : "#3f3f46"} />
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: autonomous ? "#fafafa" : "#52525b" }}>{f.label}</div>
              <div style={{ fontSize: "11px", color: "#52525b" }}>{f.desc}</div>
            </div>
            {autonomous && <CheckCircle2 size={14} color="#34d399" style={{ marginLeft: "auto" }} />}
          </div>
        ))}
      </div>

      <NavButtons onBack={onBack} onNext={() => onComplete(autonomous)} nextLabel="Launch ManagedAd" />
    </div>
  );
}

/* ════════════════════════════════════════════════
   MAIN WIZARD
   ════════════════════════════════════════════════ */
export default function OnboardingWizard() {
  const [data, setData] = useState<OnboardingData | null>(null);
  const [step, setStep] = useState(0);
  const [completing, setCompleting] = useState(false);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch("/api/onboarding/progress");
      if (res.ok) {
        const d: OnboardingData = await res.json();
        setData(d);
        if (!completing && d.step > 0 && !d.completed) setStep(d.step);
      }
    } catch {}
  }, [completing]);

  useEffect(() => { fetchProgress(); }, [fetchProgress]);

  const refreshConnections = useCallback(async () => {
    await fetchProgress();
  }, [fetchProgress]);

  async function saveStep(newStep: number) {
    setStep(newStep);
    try {
      await fetch("/api/onboarding/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: newStep }),
      });
    } catch {}
  }

  async function completeOnboarding(autonomous: boolean) {
    setCompleting(true);
    try {
      await fetch("/api/onboarding/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: 6, completed: true, autonomousMode: autonomous }),
      });
    } catch {}
    window.location.reload();
  }

  if (!data) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 120px)" }}>
        <Loader2 size={24} color="#f97316" className="animate-spin" />
        <style>{`.animate-spin { animation: spin 0.8s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const firstName = data.userName?.split(" ")[0] || "there";
  const hasConnections = data.googleConnections.length > 0 || data.metaConnections.length > 0;
  const TOTAL_STEPS = 6;

  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 120px)", padding: "40px 20px" }}>
      {step > 0 && <ProgressBar current={step} total={TOTAL_STEPS} />}

      {step === 0 && <StepWelcome firstName={firstName} onNext={() => saveStep(1)} />}
      {step === 1 && (
        <StepConnectGoogle
          connections={data.googleConnections}
          onNext={() => saveStep(2)}
          onBack={() => saveStep(0)}
          onSkip={() => saveStep(2)}
          onRefresh={refreshConnections}
        />
      )}
      {step === 2 && (
        <StepConnectMeta
          connections={data.metaConnections}
          onNext={() => saveStep(3)}
          onBack={() => saveStep(1)}
          onSkip={() => saveStep(3)}
          onRefresh={refreshConnections}
        />
      )}
      {step === 3 && (
        <StepSync
          hasConnections={hasConnections}
          campaignCount={data.campaignCount}
          onNext={() => saveStep(4)}
          onBack={() => saveStep(2)}
        />
      )}
      {step === 4 && (
        <StepPreferences
          onNext={() => saveStep(5)}
          onBack={() => saveStep(3)}
        />
      )}
      {step === 5 && (
        <StepAutonomous
          onBack={() => saveStep(4)}
          onComplete={completeOnboarding}
        />
      )}
    </div>
  );
}
