"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Providers } from "@/components/providers";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#0a0a0d" }}>
        <Sidebar />
        <div style={{ display: "flex", flex: 1, flexDirection: "column", overflow: "hidden" }}>
          <Topbar />
          <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
            {children}
          </main>
        </div>
      </div>
    </Providers>
  );
}
