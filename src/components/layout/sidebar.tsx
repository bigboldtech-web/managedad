"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Megaphone,
  Target,
  Facebook,
  Zap,
  BarChart3,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Image,
  Shield,
  Users,
  Globe,
  KeyRound,
  ClipboardCheck,
  MapPin,
  FileText,
  Eye,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

const navSections = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
      { name: "Reports", href: "/reports", icon: FileText },
    ],
  },
  {
    label: "Campaigns",
    items: [
      { name: "All Campaigns", href: "/campaigns", icon: Megaphone },
      { name: "Google Ads", href: "/google-ads", icon: Target },
      { name: "Meta Ads", href: "/meta-ads", icon: Facebook },
      { name: "Keywords", href: "/keywords", icon: KeyRound },
      { name: "City Campaigns", href: "/city-campaigns", icon: MapPin },
    ],
  },
  {
    label: "AI Engine",
    items: [
      { name: "Automations", href: "/automations", icon: Zap },
      { name: "Reviews", href: "/reviews", icon: Eye },
      { name: "Recommendations", href: "/recommendations", icon: TrendingUp },
      { name: "Creatives", href: "/creatives", icon: Image },
      { name: "Chat", href: "/chat", icon: MessageSquare },
      { name: "Audit", href: "/audit", icon: ClipboardCheck },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { name: "Fraud", href: "/fraud", icon: Shield },
      { name: "Competitors", href: "/competitors", icon: Users },
    ],
  },
  {
    label: "Publish",
    items: [
      { name: "Landing Pages", href: "/landing-pages", icon: Globe },
    ],
  },
  {
    label: "Account",
    items: [
      { name: "Billing", href: "/billing", icon: CreditCard },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      style={{
        width: collapsed ? "64px" : "220px",
        minWidth: collapsed ? "64px" : "220px",
        background: "#111114",
        borderRight: "1px solid #27272e",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.25s ease, min-width 0.25s ease",
        overflow: "hidden",
      }}
      className="hidden md:flex"
    >
      {/* Logo */}
      <div
        style={{
          height: "60px",
          display: "flex",
          alignItems: "center",
          padding: collapsed ? "0 16px" : "0 16px",
          borderBottom: "1px solid #27272e",
          gap: "10px",
          flexShrink: 0,
          justifyContent: collapsed ? "center" : "flex-start",
        }}
      >
        <div
          style={{
            width: "28px",
            height: "28px",
            background: "linear-gradient(135deg, #f97316, #fb923c)",
            borderRadius: "7px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Zap size={13} color="#fff" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <Link
            href="/dashboard"
            style={{
              fontFamily: '"Sora", sans-serif',
              fontWeight: 700,
              fontSize: "16px",
              letterSpacing: "-0.4px",
              color: "#fafafa",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Managed<span style={{ color: "#fb923c" }}>Ad</span>
          </Link>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 8px", overflowY: "auto" }}>
        {navSections.map((section) => (
          <div key={section.label} style={{ marginBottom: "4px" }}>
            {!collapsed && (
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                  color: "#3f3f46",
                  padding: "10px 10px 4px",
                }}
              >
                {section.label}
              </div>
            )}
            {collapsed && <div style={{ height: "8px" }} />}
            {section.items.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                    padding: collapsed ? "9px 0" : "7px 10px",
                    justifyContent: collapsed ? "center" : "flex-start",
                    borderRadius: "7px",
                    marginBottom: "1px",
                    textDecoration: "none",
                    fontSize: "12.5px",
                    fontWeight: isActive ? 600 : 400,
                    transition: "background 0.12s, color 0.12s",
                    background: isActive
                      ? "rgba(249, 115, 22, 0.1)"
                      : "transparent",
                    color: isActive ? "#fb923c" : "#52525b",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(249, 115, 22, 0.05)";
                      (e.currentTarget as HTMLElement).style.color = "#a1a1aa";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background =
                        "transparent";
                      (e.currentTarget as HTMLElement).style.color = "#52525b";
                    }
                  }}
                >
                  <item.icon
                    size={14}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    style={{ flexShrink: 0, color: isActive ? "#f97316" : "inherit" }}
                  />
                  {!collapsed && (
                    <span style={{ whiteSpace: "nowrap" }}>{item.name}</span>
                  )}
                  {isActive && !collapsed && (
                    <span
                      style={{
                        marginLeft: "auto",
                        width: "3px",
                        height: "14px",
                        background: "#f97316",
                        borderRadius: "2px",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div style={{ borderTop: "1px solid #27272e", padding: "6px" }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            width: "100%",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            borderRadius: "7px",
            color: "#3f3f46",
            cursor: "pointer",
            transition: "background 0.12s, color 0.12s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "#18181c";
            (e.currentTarget as HTMLElement).style.color = "#71717a";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "#3f3f46";
          }}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>
    </aside>
  );
}
