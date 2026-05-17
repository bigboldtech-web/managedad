import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkAccountLimit } from "@/lib/plan-limits";
import { isTikTokConfigured } from "@/lib/tiktok-ads/oauth";
import { isLinkedInConfigured } from "@/lib/linkedin-ads/oauth";

/**
 * Unified connections endpoint — returns all 4 platforms' connections
 * along with plan limits and platform availability in a single call.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [google, meta, tiktok, linkedin, limits] = await Promise.all([
    prisma.googleAdsConnection.findMany({
      where: { userId, customerId: { not: "PENDING" } },
      select: {
        id: true,
        customerId: true,
        accountName: true,
        isActive: true,
        lastSyncAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.metaAdsConnection.findMany({
      where: { userId, NOT: { adAccountId: "PENDING" } },
      select: {
        id: true,
        adAccountId: true,
        accountName: true,
        isActive: true,
        lastSyncAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tikTokAdsConnection.findMany({
      where: { userId },
      select: {
        id: true,
        advertiserId: true,
        accountName: true,
        isActive: true,
        lastSyncAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.linkedInAdsConnection.findMany({
      where: { userId },
      select: {
        id: true,
        adAccountId: true,
        accountName: true,
        isActive: true,
        lastSyncAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    checkAccountLimit(userId),
  ]);

  // Normalize accountIdentifier across platforms
  const normalize = (
    c: { id: string; accountName: string | null; isActive: boolean; lastSyncAt: Date | null; createdAt: Date },
    identifier: string
  ) => ({
    id: c.id,
    accountIdentifier: identifier,
    accountName: c.accountName,
    isActive: c.isActive,
    lastSyncAt: c.lastSyncAt,
    createdAt: c.createdAt,
  });

  return NextResponse.json({
    platforms: {
      google: {
        available: true,
        comingSoon: false,
        connections: google.map((c) => normalize(c, c.customerId)),
      },
      meta: {
        available: true,
        comingSoon: false,
        connections: meta.map((c) => normalize(c, c.adAccountId)),
      },
      tiktok: {
        available: isTikTokConfigured(),
        comingSoon: !isTikTokConfigured(),
        connections: tiktok.map((c) => normalize(c, c.advertiserId)),
      },
      linkedin: {
        available: isLinkedInConfigured(),
        comingSoon: !isLinkedInConfigured(),
        connections: linkedin.map((c) => normalize(c, c.adAccountId)),
      },
    },
    limits: {
      current: limits.current,
      limit: limits.limit,
      allowed: limits.allowed,
    },
  });
}
