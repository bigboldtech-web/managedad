"use client";

import { useEffect, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

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

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch {
      // Silently fail
    }
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
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (error) {
      console.error("Failed to update role:", error);
    }
    setUpdatingRole(null);
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !search ||
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          View and manage all users on the platform.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) =>
            setRoleFilter(e.target.value as "ALL" | "USER" | "ADMIN")
          }
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="ALL">All Roles</option>
          <option value="USER">Users</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>All registered users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Name</th>
                  <th className="pb-3 font-medium text-muted-foreground">Email</th>
                  <th className="pb-3 font-medium text-muted-foreground">Role</th>
                  <th className="pb-3 font-medium text-muted-foreground">Plan</th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">
                    Campaigns
                  </th>
                  <th className="pb-3 font-medium text-muted-foreground">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">
                      {user.name ?? "Unnamed"}
                    </td>
                    <td className="py-3 text-muted-foreground">{user.email}</td>
                    <td className="py-3">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(
                            user.id,
                            e.target.value as "USER" | "ADMIN"
                          )
                        }
                        disabled={updatingRole === user.id}
                        className="rounded-md border bg-background px-2 py-1 text-xs"
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="py-3">
                      <Badge variant="secondary">{user.plan}</Badge>
                    </td>
                    <td className="py-3 text-right">{user.campaignsCount}</td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-6 text-center text-muted-foreground"
                    >
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
