"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2, Users } from "lucide-react";
import PlatformCard, { ConnectionData } from "./platform-card";

interface PlatformData {
  available: boolean;
  comingSoon: boolean;
  connections: ConnectionData[];
}

interface ConnectionsData {
  platforms: {
    google: PlatformData;
    meta: PlatformData;
    tiktok: PlatformData;
    linkedin: PlatformData;
  };
  limits: {
    current: number;
    limit: number;
    allowed: boolean;
  };
}

/* Platform brand icons as inline SVG */
function GoogleAdsIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <path d="M3.272 16.092l6.093-10.59 4.073 2.35-6.093 10.59z" fill="#FBBC04" />
      <path d="M20.727 16.092l-6.093-10.59-4.073 2.35 6.093 10.59z" fill="#4285F4" />
      <circle cx="6.5" cy="18.5" r="2.5" fill="#34A853" />
    </svg>
  );
}

function MetaAdsIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z"
        fill="#1877F2"
      />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <path
        d="M19.321 5.562a5.124 5.124 0 0 1-.443-.258 6.228 6.228 0 0 1-1.137-.966c-.849-.971-1.166-1.956-1.282-2.645h.004c-.097-.571-.057-.94-.05-.94h-3.854v14.891c0 .2 0 .398-.008.593 0 .024-.003.047-.004.073 0 .01 0 .022-.003.032v.008a3.272 3.272 0 0 1-1.645 2.598 3.216 3.216 0 0 1-1.599.42c-1.776 0-3.216-1.45-3.216-3.24 0-1.79 1.44-3.241 3.216-3.241.336 0 .67.052.988.155l.005-3.92a7.12 7.12 0 0 0-5.487 1.605 7.502 7.502 0 0 0-1.638 2.02c-.15.26-.725 1.313-.794 3.023-.044 1.32.37 2.684.608 3.21v.008c.026.066.288.69.747 1.213.4.484.844.953 1.352 1.373a7.108 7.108 0 0 0 1.735 1.027 7.227 7.227 0 0 0 3.007.644c3.989 0 7.224-3.258 7.224-7.277V7.708c.157.092.845.47 1.849.725 1.35.344 2.141.374 2.141.374V4.802c-.486.023-1.462-.112-2.446-.542-1.022-.447-1.56-.93-1.56-.93 0 0-.273.155-.717-.002z"
        fill="#fff"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <path
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452z"
        fill="#0A66C2"
      />
    </svg>
  );
}

const PLATFORM_CONFIG = [
  {
    key: "google" as const,
    name: "Google Ads",
    color: "#4285F4",
    bgColor: "rgba(66,133,244,0.1)",
    icon: <GoogleAdsIcon />,
    description: "Search, Display, Shopping, Video & Performance Max",
    connectUrl: "/api/google-ads/connect",
  },
  {
    key: "meta" as const,
    name: "Meta Ads",
    color: "#1877F2",
    bgColor: "rgba(24,119,242,0.1)",
    icon: <MetaAdsIcon />,
    description: "Facebook & Instagram ads across all objectives",
    connectUrl: "/api/meta-ads/connect",
  },
  {
    key: "tiktok" as const,
    name: "TikTok Ads",
    color: "#000000",
    bgColor: "rgba(0,242,234,0.1)",
    icon: <TikTokIcon />,
    description: "In-feed ads, TopView & Branded Hashtags",
    connectUrl: "/api/tiktok-ads/connect",
  },
  {
    key: "linkedin" as const,
    name: "LinkedIn Ads",
    color: "#0A66C2",
    bgColor: "rgba(10,102,194,0.1)",
    icon: <LinkedInIcon />,
    description: "B2B campaigns with job title & company targeting",
    connectUrl: "/api/linkedin-ads/connect",
  },
];

const DISCONNECT_ENDPOINTS: Record<string, string> = {
  google: "/api/google-ads/connections",
  meta: "/api/meta-ads/connections",
  tiktok: "/api/tiktok-ads/connections",
  linkedin: "/api/linkedin-ads/connections",
};

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" },
};

export default function ConnectionsPanel() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<ConnectionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/connections");
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error("Failed to fetch connections:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Show toast when redirected from callback
  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    if (connected) {
      const platformName =
        connected === "google" ? "Google Ads" :
        connected === "meta" ? "Meta Ads" :
        connected === "tiktok" ? "TikTok Ads" :
        connected === "linkedin" ? "LinkedIn Ads" : connected;
      setToast({ type: "success", message: `${platformName} connected successfully!` });
      setTimeout(() => setToast(null), 4000);
    } else if (error) {
      const errorMsg =
        error === "invalid_state" ? "Security check failed. Please try again." :
        error === "no_code" ? "Authorization was cancelled." :
        error === "no_accounts" ? "No ad accounts found on this login." :
        error === "oauth_failed" ? "Connection failed. Please try again." :
        "An error occurred during connection.";
      setToast({ type: "error", message: errorMsg });
      setTimeout(() => setToast(null), 5000);
    }
  }, [searchParams]);

  async function handleDisconnect(
    platform: "google" | "meta" | "tiktok" | "linkedin",
    id: string
  ) {
    if (!confirm("Disconnect this account? You can reconnect it anytime.")) return;

    setDisconnectingId(id);
    try {
      const endpoint = DISCONNECT_ENDPOINTS[platform];
      const res = await fetch(`${endpoint}?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchData();
        setToast({ type: "success", message: "Account disconnected" });
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast({ type: "error", message: "Failed to disconnect" });
        setTimeout(() => setToast(null), 3000);
      }
    } catch {
      setToast({ type: "error", message: "Failed to disconnect" });
      setTimeout(() => setToast(null), 3000);
    }
    setDisconnectingId(null);
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
        <Loader2 size={22} color="#f97316" style={{ animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ ...S.card, padding: "32px", textAlign: "center" }}>
        <AlertCircle size={22} color="#f87171" style={{ margin: "0 auto 12px" }} />
        <div style={{ color: "#f87171", fontSize: "13px" }}>Failed to load connections. Please refresh.</div>
      </div>
    );
  }

  const { platforms, limits } = data;
  const canConnect = limits.limit === -1 || limits.current < limits.limit;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            padding: "12px 18px",
            background: toast.type === "success" ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
            border: `1px solid ${toast.type === "success" ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`,
            borderRadius: "10px",
            color: toast.type === "success" ? "#34d399" : "#f87171",
            fontSize: "13px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            zIndex: 1000,
            backdropFilter: "blur(8px)",
          }}
        >
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}

      {/* Plan limit banner */}
      <div
        style={{
          ...S.card,
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            background: "rgba(249,115,22,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Users size={16} color="#f97316" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#fafafa" }}>
            {limits.current} of {limits.limit === -1 ? "unlimited" : limits.limit} ad accounts connected
          </div>
          <div style={{ fontSize: "11.5px", color: "#52525b" }}>
            {canConnect
              ? "Connect your ad platforms to start optimizing automatically"
              : "Limit reached — upgrade your plan to connect more accounts"}
          </div>
        </div>
        {!canConnect && (
          <a
            href="/billing"
            style={{
              padding: "6px 14px",
              background: "#f97316",
              borderRadius: "6px",
              color: "#fff",
              fontSize: "11.5px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Upgrade Plan
          </a>
        )}
      </div>

      {/* Platform grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "14px",
        }}
      >
        {PLATFORM_CONFIG.map((config) => {
          const platformData = platforms[config.key];
          return (
            <PlatformCard
              key={config.key}
              platform={config.key}
              name={config.name}
              color={config.color}
              bgColor={config.bgColor}
              icon={config.icon}
              description={config.description}
              connections={platformData.connections}
              connectUrl={config.connectUrl}
              comingSoon={platformData.comingSoon}
              canConnect={canConnect && !platformData.comingSoon}
              disconnectingId={disconnectingId}
              onDisconnect={handleDisconnect}
            />
          );
        })}
      </div>
    </div>
  );
}
