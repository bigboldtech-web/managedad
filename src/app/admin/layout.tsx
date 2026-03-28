"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Providers } from "@/components/providers";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  TrendingUp,
} from "lucide-react";

const adminNav = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Revenue", href: "/admin/revenue", icon: TrendingUp },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <Providers>
      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#0a0a0d" }}>
        <Sidebar />
        <div style={{ display: "flex", flex: 1, flexDirection: "column", overflow: "hidden" }}>
          <Topbar />
          {/* Admin sub-navigation */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2px",
              padding: "0 32px",
              borderBottom: "1px solid #27272e",
              background: "#111114",
              flexShrink: 0,
            }}
          >
            {adminNav.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "10px 14px",
                    fontSize: "12.5px",
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "#f97316" : "#52525b",
                    textDecoration: "none",
                    borderBottom: isActive ? "2px solid #f97316" : "2px solid transparent",
                    marginBottom: "-1px",
                    transition: "color 0.12s",
                  }}
                >
                  <item.icon size={13} strokeWidth={isActive ? 2.5 : 1.8} />
                  {item.name}
                </Link>
              );
            })}
          </div>
          <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
            {children}
          </main>
        </div>
      </div>
    </Providers>
  );
}
