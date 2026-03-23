"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Save, Unlink, Loader2, User, Bell, Lock, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Connection {
  id: string;
  platform: "google" | "meta";
  accountName: string | null;
  isActive: boolean;
  lastSyncAt: string | null;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [optimizationAlerts, setOptimizationAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name ?? "");
      setEmail(session.user.email ?? "");
    }
  }, [session]);

  useEffect(() => {
    async function fetchConnections() {
      try {
        const [googleRes, metaRes] = await Promise.all([
          fetch("/api/google-ads/connections"),
          fetch("/api/meta-ads/connect"),
        ]);

        const conns: Connection[] = [];

        if (googleRes.ok) {
          const googleData = await googleRes.json();
          const items = Array.isArray(googleData) ? googleData : googleData.connections ?? [];
          for (const c of items) {
            conns.push({
              id: c.id,
              platform: "google",
              accountName: c.accountName ?? c.customerId,
              isActive: c.isActive,
              lastSyncAt: c.lastSyncAt,
            });
          }
        }

        if (metaRes.ok) {
          const metaData = await metaRes.json();
          const items = Array.isArray(metaData) ? metaData : metaData.connections ?? [];
          for (const c of items) {
            conns.push({
              id: c.id,
              platform: "meta",
              accountName: c.accountName ?? c.adAccountId,
              isActive: c.isActive,
              lastSyncAt: c.lastSyncAt,
            });
          }
        }

        setConnections(conns);
      } catch {
        // Silently fail
      }
      setLoadingConnections(false);
    }

    fetchConnections();
  }, []);

  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      await fetch("/api/auth/register", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
    setSavingProfile(false);
  }

  async function handleDisconnect(connectionId: string, platform: "google" | "meta") {
    setDisconnecting(connectionId);
    try {
      const endpoint =
        platform === "google"
          ? "/api/google-ads/connections"
          : "/api/meta-ads/connect";

      const res = await fetch(`${endpoint}?id=${connectionId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setConnections((prev) => prev.filter((c) => c.id !== connectionId));
      }
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
    setDisconnecting(null);
  }

  async function handleChangePassword() {
    setPasswordMessage("");

    if (newPassword !== confirmPassword) {
      setPasswordMessage("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage("Password must be at least 6 characters.");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.ok) {
        setPasswordMessage("Password updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await res.json();
        setPasswordMessage(data.error ?? "Failed to update password.");
      }
    } catch {
      setPasswordMessage("Failed to update password.");
    }
    setChangingPassword(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>
            Update your personal information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              {(name || email || "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm text-muted-foreground">
                Avatar is managed via your OAuth provider
              </p>
            </div>
          </div>
          <Separator />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input value={email} disabled className="bg-muted" />
            </div>
          </div>
          <Button onClick={handleSaveProfile} disabled={savingProfile}>
            {savingProfile && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Connected Platforms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5" />
            Connected Platforms
          </CardTitle>
          <CardDescription>
            Manage your ad platform connections
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingConnections ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : connections.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">
              No platforms connected. Connect Google Ads or Meta Ads from the
              sidebar.
            </p>
          ) : (
            <div className="space-y-3">
              {connections.map((conn) => (
                <div
                  key={conn.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {conn.platform === "google"
                          ? "Google Ads"
                          : "Meta Ads"}
                      </span>
                      <Badge
                        variant={conn.isActive ? "default" : "secondary"}
                        className={
                          conn.isActive
                            ? "bg-green-100 text-green-800"
                            : ""
                        }
                      >
                        {conn.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {conn.accountName ?? "Unknown Account"}
                    </p>
                    {conn.lastSyncAt && (
                      <p className="text-xs text-muted-foreground">
                        Last synced:{" "}
                        {new Date(conn.lastSyncAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleDisconnect(conn.id, conn.platform)
                    }
                    disabled={disconnecting === conn.id}
                  >
                    {disconnecting === conn.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Unlink className="mr-2 h-4 w-4" />
                    )}
                    Disconnect
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure your notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive important updates via email
              </p>
            </div>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
          </label>
          <Separator />
          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium">Optimization Alerts</p>
              <p className="text-sm text-muted-foreground">
                Get notified when optimizations are available
              </p>
            </div>
            <input
              type="checkbox"
              checked={optimizationAlerts}
              onChange={(e) => setOptimizationAlerts(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
          </label>
          <Separator />
          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium">Weekly Performance Report</p>
              <p className="text-sm text-muted-foreground">
                Receive a weekly summary of your campaign performance
              </p>
            </div>
            <input
              type="checkbox"
              checked={weeklyReport}
              onChange={(e) => setWeeklyReport(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
          </label>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your account password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-md space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Password</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm New Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            {passwordMessage && (
              <p
                className={`text-sm ${
                  passwordMessage.includes("success")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {passwordMessage}
              </p>
            )}
            <Button
              onClick={handleChangePassword}
              disabled={
                changingPassword ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
            >
              {changingPassword && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
