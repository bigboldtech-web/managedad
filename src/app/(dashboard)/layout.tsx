"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Providers } from "@/components/providers";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Providers>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop sidebar */}
        <Sidebar />

        {/* Mobile sidebar overlay */}
        <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar onMobileMenuToggle={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-y-auto p-6" style={{ background: "#09090b" }}>
            {children}
          </main>
        </div>
      </div>
    </Providers>
  );
}
