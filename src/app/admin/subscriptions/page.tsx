"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SubscriptionEntry {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

interface PlanBreakdown {
  name: string;
  count: number;
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionEntry[]>([]);
  const [planBreakdown, setPlanBreakdown] = useState<PlanBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          const data = await res.json();
          setPlanBreakdown(
            data.planDistribution?.map((d: { name: string; value: number }) => ({
              name: d.name,
              count: d.value,
            })) ?? []
          );
        }

        const subsRes = await fetch("/api/admin/users");
        if (subsRes.ok) {
          const users = await subsRes.json();
          const subs: SubscriptionEntry[] = users.map(
            (u: {
              id: string;
              name: string | null;
              email: string;
              plan: string;
              createdAt: string;
            }) => ({
              id: u.id,
              userId: u.id,
              userName: u.name,
              userEmail: u.email,
              plan: u.plan,
              status: "ACTIVE",
              currentPeriodEnd: null,
              cancelAtPeriodEnd: false,
              createdAt: u.createdAt,
            })
          );
          setSubscriptions(subs);
        }
      } catch {
        // Silently fail
      }
      setLoading(false);
    }

    fetchData();
  }, []);

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
        <h1 className="text-3xl font-bold">Subscriptions</h1>
        <p className="text-muted-foreground">
          Overview of all subscriptions and plan distribution.
        </p>
      </div>

      {/* Plan Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Breakdown</CardTitle>
          <CardDescription>Number of users on each plan</CardDescription>
        </CardHeader>
        <CardContent>
          {planBreakdown.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={planBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-6 text-center text-muted-foreground">
              No subscription data available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions ({subscriptions.length})</CardTitle>
          <CardDescription>Detailed subscription list</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-muted-foreground">User</th>
                  <th className="pb-3 font-medium text-muted-foreground">Email</th>
                  <th className="pb-3 font-medium text-muted-foreground">Plan</th>
                  <th className="pb-3 font-medium text-muted-foreground">Status</th>
                  <th className="pb-3 font-medium text-muted-foreground">
                    Period End
                  </th>
                  <th className="pb-3 font-medium text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">
                      {sub.userName ?? "Unnamed"}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {sub.userEmail}
                    </td>
                    <td className="py-3">
                      <Badge variant="secondary">{sub.plan}</Badge>
                    </td>
                    <td className="py-3">
                      <Badge
                        variant={sub.status === "ACTIVE" ? "default" : "secondary"}
                        className={
                          sub.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : ""
                        }
                      >
                        {sub.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {sub.currentPeriodEnd
                        ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {subscriptions.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-6 text-center text-muted-foreground"
                    >
                      No subscriptions found
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
