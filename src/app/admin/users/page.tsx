"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" },
  label: { fontSize: "10px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: "#3f3f46" },
};

const PLAN_COLORS: Record<string, string> = {
  FREE: "#3f3f46",
  STARTER: "#f97316",
  GROWTH: "#34d399",
  AGENCY: "#818cf8",
};

interface UserEntry {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN";
  plan: string;
  campaignsCount: number;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "USER" | "ADMIN">("ALL");
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) setUsers(await res.json());
    } catch { /* silently fail */ }
    setLoading(false);
  }

  async function handleRoleChange(userId: string, newRole: "USER" | "ADMIN") {
    setUpdatingRole(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      }
    } catch { /* silently fail */ }
    setUpdatingRole(null);
  }

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "3px" }}>User Management</h1>
        <p style={{ fontSize: "13px", color: "#52525b" }}>View and manage all users on the platform.</p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
          <Search size={14} color="#3f3f46" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", paddingLeft: "34px", paddingRight: "12px", paddingTop: "9px", paddingBottom: "9px", background: "#111114", border: "1px solid #27272e", borderRadius: "8px", color: "#fafafa", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as "ALL" | "USER" | "ADMIN")}
          style={{ padding: "9px 12px", background: "#111114", border: "1px solid #27272e", borderRadius: "8px", color: "#a1a1aa", fontSize: "13px", cursor: "pointer" }}
        >
          <option value="ALL">All Roles</option>
          <option value="USER">Users</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ ...S.card, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #27272e" }}>
          <span style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa" }}>Users</span>
          <span style={{ fontSize: "11px", color: "#3f3f46", marginLeft: "8px" }}>{filtered.length} total</span>
        </div>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#3f3f46", fontSize: "13px" }}>Loading...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1a1a1f" }}>
                  {["Name", "Email", "Role", "Plan", "Campaigns", "Joined"].map(h => (
                    <th key={h} style={{ padding: "10px 20px", textAlign: h === "Campaigns" ? "right" : "left", ...S.label }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid #1a1a1f" }}>
                    <td style={{ padding: "12px 20px", color: "#fafafa", fontWeight: 500 }}>{user.name ?? "Unnamed"}</td>
                    <td style={{ padding: "12px 20px", color: "#71717a" }}>{user.email}</td>
                    <td style={{ padding: "12px 20px" }}>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as "USER" | "ADMIN")}
                        disabled={updatingRole === user.id}
                        style={{ padding: "3px 8px", background: "#0d0d10", border: "1px solid #27272e", borderRadius: "5px", color: user.role === "ADMIN" ? "#f97316" : "#a1a1aa", fontSize: "11px", cursor: "pointer" }}
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td style={{ padding: "12px 20px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: "5px", fontSize: "10.5px", fontWeight: 700, background: `${PLAN_COLORS[user.plan] || "#3f3f46"}18`, color: PLAN_COLORS[user.plan] || "#71717a" }}>
                        {user.plan}
                      </span>
                    </td>
                    <td style={{ padding: "12px 20px", textAlign: "right", color: "#71717a" }}>{user.campaignsCount}</td>
                    <td style={{ padding: "12px 20px", color: "#52525b" }}>{new Date(user.createdAt).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#3f3f46", fontSize: "13px" }}>No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
