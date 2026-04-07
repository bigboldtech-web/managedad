"use client";

import { CheckCircle2, XCircle, Link2, Loader2, Unlink, Sparkles } from "lucide-react";

export interface ConnectionData {
  id: string;
  accountIdentifier: string;
  accountName: string | null;
  isActive: boolean;
  lastSyncAt: string | null;
  createdAt: string;
}

interface PlatformCardProps {
  platform: "google" | "meta" | "tiktok" | "linkedin";
  name: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  description: string;
  connections: ConnectionData[];
  connectUrl: string;
  comingSoon: boolean;
  canConnect: boolean;
  disconnectingId: string | null;
  onDisconnect: (platform: "google" | "meta" | "tiktok" | "linkedin", id: string) => void;
}

const S = {
  card: {
    background: "#111114",
    border: "1px solid #27272e",
    borderRadius: "12px",
    padding: "20px 22px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "14px",
    minHeight: "220px",
  },
};

export default function PlatformCard({
  platform,
  name,
  color,
  bgColor,
  icon,
  description,
  connections,
  connectUrl,
  comingSoon,
  canConnect,
  disconnectingId,
  onDisconnect,
}: PlatformCardProps) {
  const isConnected = connections.length > 0;
  const activeCount = connections.filter((c) => c.isActive).length;

  return (
    <div style={S.card}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "10px",
            background: bgColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontFamily: '"Sora", sans-serif',
                fontSize: "15px",
                fontWeight: 700,
                color: "#fafafa",
              }}
            >
              {name}
            </span>
            {comingSoon && (
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "9.5px",
                  fontWeight: 700,
                  background: "rgba(251,191,36,0.1)",
                  color: "#fbbf24",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Coming Soon
              </span>
            )}
            {!comingSoon && isConnected && (
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "9.5px",
                  fontWeight: 700,
                  background: "rgba(52,211,153,0.1)",
                  color: "#34d399",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {activeCount} Active
              </span>
            )}
          </div>
          <p style={{ fontSize: "11.5px", color: "#52525b", marginTop: "2px", margin: 0 }}>
            {description}
          </p>
        </div>
      </div>

      {/* Connections list */}
      {isConnected && !comingSoon ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            flex: 1,
            maxHeight: "180px",
            overflowY: "auto",
          }}
        >
          {connections.map((conn) => (
            <div
              key={conn.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                background: "#0d0d10",
                borderRadius: "8px",
                border: "1px solid #1a1a1f",
              }}
            >
              {conn.isActive ? (
                <CheckCircle2 size={14} color="#34d399" style={{ flexShrink: 0 }} />
              ) : (
                <XCircle size={14} color="#f87171" style={{ flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 600,
                    color: "#fafafa",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {conn.accountName || `Account ${conn.accountIdentifier}`}
                </div>
                <div style={{ fontSize: "10.5px", color: "#52525b" }}>
                  ID: {conn.accountIdentifier}
                  {conn.lastSyncAt && (
                    <>
                      {" · "}
                      Synced {new Date(conn.lastSyncAt).toLocaleDateString("en-IN")}
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => onDisconnect(platform, conn.id)}
                disabled={disconnectingId === conn.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 10px",
                  background: "transparent",
                  border: "1px solid rgba(248,113,113,0.25)",
                  borderRadius: "6px",
                  color: "#f87171",
                  fontSize: "10.5px",
                  fontWeight: 600,
                  cursor: disconnectingId === conn.id ? "not-allowed" : "pointer",
                  flexShrink: 0,
                }}
              >
                {disconnectingId === conn.id ? (
                  <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <Unlink size={10} />
                )}
                Disconnect
              </button>
            </div>
          ))}
        </div>
      ) : comingSoon ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px 0",
            gap: "8px",
          }}
        >
          <Sparkles size={22} color="#fbbf24" />
          <div style={{ fontSize: "12px", color: "#71717a", textAlign: "center" }}>
            Coming soon — our team is working on it
          </div>
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px 0",
            gap: "8px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              color: "#52525b",
              textAlign: "center",
            }}
          >
            No accounts connected
          </div>
        </div>
      )}

      {/* Action button */}
      {!comingSoon && (
        <a
          href={canConnect ? connectUrl : undefined}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "10px 16px",
            background: canConnect ? color : "#27272e",
            border: "none",
            borderRadius: "8px",
            color: canConnect ? "#fff" : "#52525b",
            fontSize: "12.5px",
            fontWeight: 600,
            textDecoration: "none",
            cursor: canConnect ? "pointer" : "not-allowed",
            pointerEvents: canConnect ? "auto" : "none",
          }}
        >
          <Link2 size={13} />
          {isConnected ? "Connect Another Account" : `Connect ${name}`}
        </a>
      )}
      {comingSoon && (
        <div
          style={{
            padding: "10px 16px",
            background: "#18181c",
            border: "1px dashed #27272e",
            borderRadius: "8px",
            fontSize: "11.5px",
            color: "#52525b",
            textAlign: "center",
          }}
        >
          Integration in development
        </div>
      )}
    </div>
  );
}
