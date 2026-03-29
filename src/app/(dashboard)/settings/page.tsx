"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { User, Bell, Plug, Lock, Check, X } from "lucide-react";

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" },
  input: { height: "40px", padding: "0 14px", background: "#18181c", border: "1px solid #27272e", borderRadius: "8px", color: "#fafafa", fontSize: "13px", outline: "none", width: "100%", boxSizing: "border-box" as const, fontFamily: "inherit" },
  label: { fontSize: "11.5px", fontWeight: 600, color: "#71717a", marginBottom: "5px", display: "block" as const },
  sectionTitle: { fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa", marginBottom: "14px" },
};

type Tab = "profile" | "connections" | "notifications" | "security";

interface Connection { id: string; platform: "google" | "meta"; accountName: string | null; isActive: boolean; lastSyncAt: string | null; }

export default function SettingsPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<Tab>("profile");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);

  const [emailNotif, setEmailNotif] = useState(true);
  const [slackEnabled, setSlackEnabled] = useState(false);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState("");
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [dailyDigest, setDailyDigest] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [fraudAlerts, setFraudAlerts] = useState(true);
  const [anomalyAlerts, setAnomalyAlerts] = useState(true);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);

  useEffect(() => {
    if (session?.user) { setName(session.user.name ?? ""); setEmail(session.user.email ?? ""); }
  }, [session]);

  useEffect(() => {
    async function loadNotifSettings() {
      try {
        const res = await fetch("/api/settings/notifications");
        if (res.ok) {
          const { settings } = await res.json();
          if (settings) {
            setEmailNotif(settings.emailEnabled ?? true);
            setSlackEnabled(settings.slackEnabled ?? false);
            setSlackWebhookUrl(settings.slackWebhookUrl ?? "");
            setWhatsappEnabled(settings.whatsappEnabled ?? false);
            setWhatsappPhone(settings.whatsappPhone ?? "");
            setDailyDigest(settings.dailyDigest ?? true);
            setWeeklyReport(settings.weeklyReport ?? true);
            setFraudAlerts(settings.fraudAlerts ?? true);
            setAnomalyAlerts(settings.anomalyAlerts ?? true);
          }
        }
      } catch { /* use defaults */ }
    }
    loadNotifSettings();
  }, []);

  async function saveNotifications() {
    setNotifSaving(true);
    try {
      await fetch("/api/settings/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailEnabled: emailNotif, slackEnabled, slackWebhookUrl, whatsappEnabled, whatsappPhone, dailyDigest, weeklyReport, fraudAlerts, anomalyAlerts }),
      });
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 2500);
    } catch { /* silent */ } finally {
      setNotifSaving(false);
    }
  }

  useEffect(() => {
    async function fetchConnections() {
      try {
        const [gRes, mRes] = await Promise.all([fetch("/api/google-ads/connections"), fetch("/api/meta-ads/connections")]);
        const conns: Connection[] = [];
        if (gRes.ok) { const d = await gRes.json(); if (d.connections) conns.push(...d.connections.map((c: Connection) => ({ ...c, platform: "google" as const }))); }
        if (mRes.ok) { const d = await mRes.json(); if (d.connections) conns.push(...d.connections.map((c: Connection) => ({ ...c, platform: "meta" as const }))); }
        setConnections(conns);
      } catch {
        setConnections([]);
      }
    }
    fetchConnections();
  }, []);

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    } catch { /* silent */ } finally {
      setSaving(false);
    }
  }

  async function savePassword() {
    setPwError("");
    if (newPw !== confirmPw) { setPwError("Passwords do not match"); return; }
    if (newPw.length < 8) { setPwError("Must be at least 8 characters"); return; }
    setPwSaving(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      if (res.ok) {
        setPwSaved(true); setCurrentPw(""); setNewPw(""); setConfirmPw("");
        setTimeout(() => setPwSaved(false), 2500);
      } else {
        const d = await res.json();
        setPwError(d.error || "Failed to update password");
      }
    } catch { setPwError("Failed to update password"); } finally {
      setPwSaving(false);
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "connections", label: "Connections", icon: Plug },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Lock },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "3px" }}>Settings</h1>
        <p style={{ fontSize: "13px", color: "#52525b" }}>Manage your account, connections, and notification preferences.</p>
      </div>

      <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
        {/* Tab nav */}
        <div style={{ width: "180px", flexShrink: 0 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: "flex", alignItems: "center", gap: "9px", width: "100%", padding: "9px 12px", marginBottom: "2px",
              background: tab === t.id ? "rgba(249,115,22,0.1)" : "transparent",
              border: "1px solid", borderColor: tab === t.id ? "rgba(249,115,22,0.3)" : "transparent",
              borderRadius: "8px", color: tab === t.id ? "#fb923c" : "#52525b", fontSize: "12.5px", fontWeight: tab === t.id ? 600 : 400, cursor: "pointer", textAlign: "left",
            }}>
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {tab === "profile" && (
            <div style={{ ...S.card, padding: "24px" }}>
              <div style={S.sectionTitle}>Profile Information</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div>
                  <label style={S.label}>Full Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} style={S.input} placeholder="Your name" />
                </div>
                <div>
                  <label style={S.label}>Email Address</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} style={S.input} placeholder="you@example.com" type="email" />
                </div>
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label style={S.label}>Target ROAS</label>
                <input defaultValue="4.0" style={{ ...S.input, width: "160px" }} />
                <div style={{ fontSize: "11px", color: "#3f3f46", marginTop: "5px" }}>AI optimizes towards this ROAS target across all campaigns.</div>
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={S.label}>Business Type</label>
                <select style={{ ...S.input, appearance: "none" as const }}>
                  <option value="ecommerce">E-Commerce</option>
                  <option value="saas">SaaS / Software</option>
                  <option value="leadgen">Lead Generation</option>
                  <option value="local">Local Business</option>
                  <option value="agency">Agency</option>
                </select>
              </div>
              <button onClick={saveProfile} disabled={saving} style={{ padding: "9px 20px", background: saving ? "rgba(249,115,22,0.5)" : "#f97316", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                {saved ? <><Check size={13} /> Saved!</> : saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}

          {tab === "connections" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ ...S.card, padding: "24px" }}>
                <div style={S.sectionTitle}>Ad Platform Connections</div>
                {connections.map(conn => (
                  <div key={conn.id} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 0", borderBottom: "1px solid #1a1a1f" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: conn.platform === "google" ? "rgba(66,133,244,0.12)" : "rgba(24,119,242,0.12)" }}>
                      <span style={{ fontSize: "16px" }}>{conn.platform === "google" ? "G" : "f"}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#fafafa" }}>{conn.accountName}</div>
                      <div style={{ fontSize: "11.5px", color: "#52525b" }}>{conn.platform === "google" ? "Google Ads" : "Meta Ads"} · Last sync: {conn.lastSyncAt}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ padding: "3px 9px", borderRadius: "5px", fontSize: "10.5px", fontWeight: 600, background: conn.isActive ? "rgba(52,211,153,0.08)" : "rgba(113,113,122,0.1)", color: conn.isActive ? "#34d399" : "#71717a" }}>
                        {conn.isActive ? "● Connected" : "Disconnected"}
                      </span>
                      <button style={{ padding: "5px 12px", background: "transparent", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "6px", color: "#f87171", fontSize: "11.5px", cursor: "pointer" }}>Disconnect</button>
                    </div>
                  </div>
                ))}
                <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
                  <a href="/api/google-ads/connect" style={{ padding: "8px 16px", background: "rgba(66,133,244,0.1)", border: "1px solid rgba(66,133,244,0.3)", borderRadius: "8px", color: "#4285F4", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>+ Connect Google Ads</a>
                  <a href="/api/meta-ads/connect" style={{ padding: "8px 16px", background: "rgba(24,119,242,0.1)", border: "1px solid rgba(24,119,242,0.3)", borderRadius: "8px", color: "#1877F2", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>+ Connect Meta Ads</a>
                </div>
              </div>
              <div style={{ ...S.card, padding: "24px" }}>
                <div style={S.sectionTitle}>Integrations</div>
                {[
                  { name: "Slack", desc: "Get notifications in your Slack workspace", connected: false, color: "#611f69" },
                  { name: "WhatsApp", desc: "Receive alerts via WhatsApp Business", connected: false, color: "#25D366" },
                  { name: "Razorpay", desc: "Track ad ROI against revenue", connected: false, color: "#072654" },
                ].map(int => (
                  <div key={int.name} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 0", borderBottom: "1px solid #1a1a1f" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#fafafa" }}>{int.name}</div>
                      <div style={{ fontSize: "11.5px", color: "#52525b" }}>{int.desc}</div>
                    </div>
                    <button style={{ padding: "5px 14px", background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: "6px", color: "#fb923c", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}>Connect</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "notifications" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ ...S.card, padding: "24px" }}>
                <div style={S.sectionTitle}>Notification Channels</div>
                {/* Email */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #1a1a1f" }}>
                  <div><div style={{ fontSize: "13px", fontWeight: 500, color: "#fafafa" }}>Email Notifications</div><div style={{ fontSize: "11.5px", color: "#52525b" }}>Reports and alerts to your registered email</div></div>
                  <button onClick={() => setEmailNotif(!emailNotif)} style={{ width: "42px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer", background: emailNotif ? "#f97316" : "#27272e", position: "relative", transition: "background 0.2s" }}>
                    <span style={{ position: "absolute", top: "3px", left: emailNotif ? "21px" : "3px", width: "18px", height: "18px", borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                  </button>
                </div>
                {/* Slack */}
                <div style={{ padding: "12px 0", borderBottom: "1px solid #1a1a1f" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: slackEnabled ? "12px" : "0" }}>
                    <div><div style={{ fontSize: "13px", fontWeight: 500, color: "#fafafa" }}>Slack</div><div style={{ fontSize: "11.5px", color: "#52525b" }}>Alerts in your Slack workspace channel</div></div>
                    <button onClick={() => setSlackEnabled(!slackEnabled)} style={{ width: "42px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer", background: slackEnabled ? "#f97316" : "#27272e", position: "relative", transition: "background 0.2s" }}>
                      <span style={{ position: "absolute", top: "3px", left: slackEnabled ? "21px" : "3px", width: "18px", height: "18px", borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                    </button>
                  </div>
                  {slackEnabled && (
                    <div>
                      <label style={S.label}>Slack Incoming Webhook URL</label>
                      <input
                        value={slackWebhookUrl}
                        onChange={(e) => setSlackWebhookUrl(e.target.value)}
                        placeholder="https://hooks.slack.com/services/..."
                        style={S.input}
                      />
                      <div style={{ fontSize: "11px", color: "#3f3f46", marginTop: "4px" }}>Create an Incoming Webhook in your Slack app settings.</div>
                    </div>
                  )}
                </div>
                {/* WhatsApp */}
                <div style={{ padding: "12px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: whatsappEnabled ? "12px" : "0" }}>
                    <div><div style={{ fontSize: "13px", fontWeight: 500, color: "#fafafa" }}>WhatsApp</div><div style={{ fontSize: "11.5px", color: "#52525b" }}>Critical alerts via WhatsApp Business</div></div>
                    <button onClick={() => setWhatsappEnabled(!whatsappEnabled)} style={{ width: "42px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer", background: whatsappEnabled ? "#f97316" : "#27272e", position: "relative", transition: "background 0.2s" }}>
                      <span style={{ position: "absolute", top: "3px", left: whatsappEnabled ? "21px" : "3px", width: "18px", height: "18px", borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                    </button>
                  </div>
                  {whatsappEnabled && (
                    <div>
                      <label style={S.label}>WhatsApp Number (with country code)</label>
                      <input
                        value={whatsappPhone}
                        onChange={(e) => setWhatsappPhone(e.target.value)}
                        placeholder="919876543210"
                        style={S.input}
                      />
                      <div style={{ fontSize: "11px", color: "#3f3f46", marginTop: "4px" }}>Format: country code + number, no + or spaces. E.g. 919876543210</div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ ...S.card, padding: "24px" }}>
                <div style={S.sectionTitle}>What to Notify</div>
                {[
                  { label: "Daily Performance Digest", desc: "Yesterday's spend, ROAS, and top actions", value: dailyDigest, set: setDailyDigest },
                  { label: "Weekly Report", desc: "Full weekly analysis every Monday", value: weeklyReport, set: setWeeklyReport },
                  { label: "Fraud Alerts", desc: "Instant alerts when click fraud is detected", value: fraudAlerts, set: setFraudAlerts },
                  { label: "Anomaly Alerts", desc: "Spend spikes, CTR drops, AI optimisation actions", value: anomalyAlerts, set: setAnomalyAlerts },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #1a1a1f" }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 500, color: "#fafafa" }}>{item.label}</div>
                      <div style={{ fontSize: "11.5px", color: "#52525b" }}>{item.desc}</div>
                    </div>
                    <button onClick={() => item.set(!item.value)} style={{ width: "42px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer", background: item.value ? "#f97316" : "#27272e", position: "relative", transition: "background 0.2s" }}>
                      <span style={{ position: "absolute", top: "3px", left: item.value ? "21px" : "3px", width: "18px", height: "18px", borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                    </button>
                  </div>
                ))}
                <div style={{ marginTop: "16px" }}>
                  <button onClick={saveNotifications} disabled={notifSaving} style={{ padding: "9px 20px", background: notifSaving ? "rgba(249,115,22,0.5)" : "#f97316", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: notifSaving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                    {notifSaved ? <><Check size={13} /> Saved!</> : notifSaving ? "Saving..." : "Save Notifications"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === "security" && (
            <div style={{ ...S.card, padding: "24px" }}>
              <div style={S.sectionTitle}>Change Password</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxWidth: "400px" }}>
                <div><label style={S.label}>Current Password</label><input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} style={S.input} placeholder="••••••••" /></div>
                <div><label style={S.label}>New Password</label><input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} style={S.input} placeholder="At least 8 characters" /></div>
                <div><label style={S.label}>Confirm New Password</label><input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} style={S.input} placeholder="••••••••" /></div>
                {pwError && <div style={{ fontSize: "12px", color: "#f87171" }}>{pwError}</div>}
                <button onClick={savePassword} disabled={pwSaving || !currentPw || !newPw || !confirmPw} style={{ padding: "9px 20px", background: (pwSaving || !currentPw || !newPw || !confirmPw) ? "rgba(249,115,22,0.4)" : "#f97316", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: (pwSaving || !currentPw || !newPw || !confirmPw) ? "not-allowed" : "pointer", alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "6px" }}>
                  {pwSaved ? <><Check size={13} /> Updated!</> : pwSaving ? "Updating..." : "Update Password"}
                </button>
              </div>
              <div style={{ height: "1px", background: "#27272e", margin: "24px 0" }} />
              <div style={S.sectionTitle}>Danger Zone</div>
              <div style={{ padding: "14px 16px", background: "rgba(248,113,113,0.04)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#f87171" }}>Delete Account</div>
                  <div style={{ fontSize: "11.5px", color: "#52525b" }}>Permanently delete your account and all data. This cannot be undone.</div>
                </div>
                <button style={{ padding: "7px 14px", background: "transparent", border: "1px solid rgba(248,113,113,0.4)", borderRadius: "7px", color: "#f87171", fontSize: "12px", cursor: "pointer" }}>Delete</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
