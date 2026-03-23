"use client";

import { useEffect, useState } from "react";
import {
  Users,
  CreditCard,
  DollarSign,
  BarChart3,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  mrr: number;
  totalCampaigns: number;
  recentSignups: {
    id: string;
    name: string | null;
    email: string;
    createdAt: string;
    plan: string;
  }[];
  planDistribution: { name: string; value: number }[];
}

const COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b"];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // Silently fail
      }
      setLoading(false);
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const data = stats ?? {
    totalUsers: 0,
    activeSubscriptions: 0,
    mrr: 0,
    totalCampaigns: 0,
    recentSignups: [],
    planDistribution: [],
  };

  const kpis = [
    {
      title: "Total Users",
      value: data.totalUsers.toLocaleString(),
      icon: Users,
    },
    {
      title: "Active Subscriptions",
      value: data.activeSubscriptions.toLocaleString(),
      icon: CreditCard,
    },
    {
      title: "MRR",
      value: formatCurrency(data.mrr),
      icon: DollarSign,
    },
    {
      title: "Total Campaigns",
      value: data.totalCampaigns.toLocaleString(),
      icon: BarChart3,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of platform metrics and user activity.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Signups */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Signups</CardTitle>
            <CardDescription>Latest users who joined the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Name</th>
                    <th className="pb-3 font-medium text-muted-foreground">Email</th>
                    <th className="pb-3 font-medium text-muted-foreground">Plan</th>
                    <th className="pb-3 font-medium text-muted-foreground">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentSignups.map((user) => (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">
                        {user.name ?? "Unnamed"}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {user.email}
                      </td>
                      <td className="py-3">
                        <Badge variant="secondary">{user.plan}</Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {data.recentSignups.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-6 text-center text-muted-foreground"
                      >
                        No recent signups
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
            <CardDescription>Subscription breakdown by plan</CardDescription>
          </CardHeader>
          <CardContent>
            {data.planDistribution.length > 0 ? (
              <>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.planDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {data.planDistribution.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex flex-wrap justify-center gap-3">
                  {data.planDistribution.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-sm">
                        {item.name} ({item.value})
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="py-6 text-center text-muted-foreground">
                No subscription data
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
