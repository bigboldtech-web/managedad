"use client";

import { signOut, useSession } from "next-auth/react";
import { Bell, LogOut, Menu, Zap, Shield, ClipboardCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Notification } from "@/app/api/notifications/route";

interface TopbarProps {
  onMobileMenuToggle?: () => void;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  optimization: <Zap size={11} color="#f97316" />,
  fraud: <Shield size={11} color="#f87171" />,
  audit: <ClipboardCheck size={11} color="#fbbf24" />,
  sync: <Zap size={11} color="#34d399" />,
};

const TYPE_BG: Record<string, string> = {
  optimization: "rgba(249,115,22,0.1)",
  fraud: "rgba(248,113,113,0.1)",
  audit: "rgba(251,191,36,0.1)",
  sync: "rgba(52,211,153,0.1)",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function Topbar({ onMobileMenuToggle }: TopbarProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const initials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() ?? "U";

  // Load notifications on mount and every 2 min
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnread(data.unread || 0);
        }
      } catch { /* silent */ } finally {
        setLoading(false);
      }
    }
    load();
    const id = setInterval(load, 120_000);
    return () => clearInterval(id);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <header
      style={{
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        background: "#111114",
        borderBottom: "1px solid #27272e",
        flexShrink: 0,
        position: "relative",
        zIndex: 40,
      }}
    >
      {/* Left: mobile menu + title */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button
          className="md:hidden"
          onClick={onMobileMenuToggle}
          style={{
            width: "36px", height: "36px", display: "flex", alignItems: "center",
            justifyContent: "center", background: "transparent", border: "none",
            borderRadius: "8px", color: "#71717a", cursor: "pointer",
          }}
        >
          <Menu size={18} />
        </button>
        <span
          className="md:hidden"
          style={{ fontFamily: '"Sora", sans-serif', fontWeight: 700, fontSize: "16px", color: "#fafafa" }}
        >
          Managed<span style={{ color: "#fb923c" }}>Ad</span>
        </span>
      </div>

      {/* Right: bell + user + logout */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }} ref={panelRef}>
        {/* Bell + dropdown */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setOpen(!open)}
            style={{
              position: "relative", width: "36px", height: "36px", display: "flex",
              alignItems: "center", justifyContent: "center", background: open ? "#18181c" : "transparent",
              border: open ? "1px solid #27272e" : "none", borderRadius: "8px", color: open ? "#fafafa" : "#71717a",
              cursor: "pointer", transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => { if (!open) { (e.currentTarget as HTMLElement).style.background = "#18181c"; (e.currentTarget as HTMLElement).style.color = "#a1a1aa"; } }}
            onMouseLeave={(e) => { if (!open) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#71717a"; } }}
          >
            <Bell size={16} />
            {unread > 0 && (
              <span style={{
                position: "absolute", top: "6px", right: "6px", minWidth: "8px", height: "8px",
                background: "#f87171", borderRadius: "50%", border: "1.5px solid #111114",
              }} />
            )}
          </button>

          {/* Notification dropdown */}
          {open && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              width: "340px", background: "#111114", border: "1px solid #27272e",
              borderRadius: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              zIndex: 100, overflow: "hidden",
            }}>
              <div style={{ padding: "14px 16px", borderBottom: "1px solid #1a1a1f", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: '"Sora", sans-serif', fontSize: "13px", fontWeight: 700, color: "#fafafa" }}>Notifications</span>
                <button onClick={() => setOpen(false)} style={{ background: "transparent", border: "none", color: "#52525b", cursor: "pointer", padding: "2px" }}>
                  <X size={13} />
                </button>
              </div>

              {loading ? (
                <div style={{ padding: "24px", textAlign: "center", color: "#3f3f46", fontSize: "12.5px" }}>Loading...</div>
              ) : notifications.length === 0 ? (
                <div style={{ padding: "32px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: "13px", color: "#52525b" }}>No notifications yet</div>
                  <div style={{ fontSize: "11.5px", color: "#3f3f46", marginTop: "4px" }}>Optimisation actions and alerts will appear here.</div>
                </div>
              ) : (
                <div style={{ maxHeight: "360px", overflowY: "auto" }}>
                  {notifications.map((n) => (
                    <Link key={n.id} href={n.href} onClick={() => setOpen(false)} style={{ textDecoration: "none", display: "block" }}>
                      <div style={{
                        padding: "12px 16px", borderBottom: "1px solid #1a1a1f", display: "flex", gap: "11px", alignItems: "flex-start",
                        transition: "background 0.1s",
                      }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#18181c")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <div style={{
                          width: "28px", height: "28px", borderRadius: "7px", flexShrink: 0,
                          background: TYPE_BG[n.type] || "rgba(113,113,122,0.1)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {TYPE_ICON[n.type] || <Bell size={11} color="#71717a" />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#fafafa", lineHeight: 1.35, marginBottom: "2px" }}>{n.title}</div>
                          <div style={{ fontSize: "11.5px", color: "#71717a", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.body}</div>
                          <div style={{ fontSize: "10.5px", color: "#3f3f46", marginTop: "3px" }}>{timeAgo(n.createdAt)}</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              <div style={{ padding: "10px 16px", borderTop: "1px solid #1a1a1f" }}>
                <Link href="/automations" onClick={() => setOpen(false)} style={{ fontSize: "12px", color: "#f97316", textDecoration: "none", fontWeight: 600 }}>
                  View all activity →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: "1px", height: "24px", background: "#27272e", margin: "0 4px" }} />

        {/* User info */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "4px 8px", borderRadius: "8px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "50%",
            background: "rgba(249, 115, 22, 0.15)", border: "1px solid rgba(249, 115, 22, 0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "12px", fontWeight: 700, color: "#fb923c", flexShrink: 0, overflow: "hidden",
          }}>
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt={initials} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              initials
            )}
          </div>
          <div className="hidden md:block">
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#fafafa", lineHeight: 1.3 }}>
              {session?.user?.name ?? "User"}
            </p>
            <p style={{ fontSize: "11px", color: "#71717a", lineHeight: 1.3 }}>
              {session?.user?.email}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          title="Sign out"
          onClick={() => signOut({ callbackUrl: "/" })}
          style={{
            width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center",
            background: "transparent", border: "none", borderRadius: "8px", color: "#71717a",
            cursor: "pointer", transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.08)"; (e.currentTarget as HTMLElement).style.color = "#f87171"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#71717a"; }}
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
