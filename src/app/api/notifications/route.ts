import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface Notification {
  id: string;
  type: "optimization" | "fraud" | "audit" | "sync";
  title: string;
  body: string;
  createdAt: string;
  href: string;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // last 7 days

  const [recentRuns, recentFraud, recentAudits] = await Promise.all([
    prisma.optimizationRun.findMany({
      where: { userId, status: "COMPLETED", createdAt: { gte: since } },
      select: { id: true, createdAt: true, summary: true, _count: { select: { actions: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.fraudBlock.findMany({
      where: { userId, blockedAt: { gte: since } },
      select: { id: true, ip: true, reason: true, blockedAt: true },
      orderBy: { blockedAt: "desc" },
      take: 5,
    }),
    prisma.auditReport.findMany({
      where: { userId, createdAt: { gte: since } },
      select: { id: true, score: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const notifications: Notification[] = [];

  for (const run of recentRuns) {
    if (run._count.actions === 0) continue;
    const summary = run.summary as { actionsByType?: Record<string, number>; campaignsAnalyzed?: number } | null;
    const topEntry = summary?.actionsByType
      ? Object.entries(summary.actionsByType).sort(([, a], [, b]) => b - a)[0]
      : null;
    notifications.push({
      id: `opt-${run.id}`,
      type: "optimization",
      title: `${run._count.actions} optimisation action${run._count.actions !== 1 ? "s" : ""} applied`,
      body: topEntry
        ? `${topEntry[1]}× ${topEntry[0].replace(/_/g, " ").toLowerCase()}${summary?.campaignsAnalyzed ? ` across ${summary.campaignsAnalyzed} campaigns` : ""}`
        : `${summary?.campaignsAnalyzed ?? "—"} campaigns analysed`,
      createdAt: run.createdAt.toISOString(),
      href: "/automations",
    });
  }

  for (const block of recentFraud) {
    notifications.push({
      id: `fraud-${block.id}`,
      type: "fraud",
      title: `Fraud IP blocked: ${block.ip}`,
      body: block.reason || "Suspicious click pattern detected",
      createdAt: block.blockedAt.toISOString(),
      href: "/fraud",
    });
  }

  for (const audit of recentAudits) {
    const label = audit.score >= 80 ? "Healthy" : audit.score >= 60 ? "Needs attention" : "Critical issues found";
    notifications.push({
      id: `audit-${audit.id}`,
      type: "audit",
      title: `Account audit completed — ${audit.score}/100`,
      body: label,
      createdAt: audit.createdAt.toISOString(),
      href: "/audit",
    });
  }

  // Sort by recency
  notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({
    notifications: notifications.slice(0, 15),
    unread: notifications.length,
  });
}
