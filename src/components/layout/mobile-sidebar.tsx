"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Zap, LayoutDashboard, Megaphone, Target, Facebook, BarChart3, CreditCard, Settings, MessageSquare, Image, Shield, Users, Globe, KeyRound, ClipboardCheck, MapPin, FileText } from "lucide-react";
import { useEffect } from "react";

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

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

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const pathname = usePathname();

  // Close on route change
  useEffect(() => { onClose(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={onClose}
          className="md:hidden"
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            zIndex: 50, backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* Drawer */}
      <div
        className="md:hidden"
        style={{
          position: "fixed", top: 0, left: 0, bottom: 0,
          width: "260px", background: "#111114", borderRight: "1px solid #27272e",
          zIndex: 60, display: "flex", flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Header */}
        <div style={{
          height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px", borderBottom: "1px solid #27272e", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "28px", height: "28px", background: "linear-gradient(135deg, #f97316, #fb923c)",
              borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Zap size={13} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{
              fontFamily: '"Sora", sans-serif', fontWeight: 700, fontSize: "16px",
              letterSpacing: "-0.4px", color: "#fafafa",
            }}>
              Managed<span style={{ color: "#fb923c" }}>Ad</span>
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center",
              background: "transparent", border: "none", borderRadius: "7px", color: "#71717a", cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "8px", overflowY: "auto" }}>
          {navSections.map((section) => (
            <div key={section.label} style={{ marginBottom: "4px" }}>
              <div style={{
                fontSize: "9px", fontWeight: 700, letterSpacing: "1.2px",
                textTransform: "uppercase", color: "#3f3f46", padding: "10px 10px 4px",
              }}>
                {section.label}
              </div>
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    style={{
                      display: "flex", alignItems: "center", gap: "9px",
                      padding: "8px 10px", borderRadius: "7px", marginBottom: "1px",
                      textDecoration: "none", fontSize: "13px",
                      fontWeight: isActive ? 600 : 400,
                      background: isActive ? "rgba(249, 115, 22, 0.1)" : "transparent",
                      color: isActive ? "#fb923c" : "#71717a",
                    }}
                  >
                    <item.icon
                      size={15}
                      strokeWidth={isActive ? 2.5 : 1.8}
                      style={{ flexShrink: 0, color: isActive ? "#f97316" : "inherit" }}
                    />
                    <span>{item.name}</span>
                    {isActive && (
                      <span style={{
                        marginLeft: "auto", width: "3px", height: "14px",
                        background: "#f97316", borderRadius: "2px", flexShrink: 0,
                      }} />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}
