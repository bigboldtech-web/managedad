import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/fraud/block — manually block an IP and push to Google Ads IP exclusion
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { ip, reason } = await req.json();

  if (!ip) return NextResponse.json({ error: "ip required" }, { status: 400 });

  // Upsert fraud block
  const block = await prisma.fraudBlock.upsert({
    where: { userId_ip: { userId, ip } },
    update: { isActive: true, reason: reason || "Manually blocked", fraudScore: 1.0 },
    create: { userId, ip, reason: reason || "Manually blocked", fraudScore: 1.0 },
  });

  // Attempt to push IP exclusion to all active Google Ads connections
  const connections = await prisma.googleAdsConnection.findMany({
    where: { userId, isActive: true },
    select: { id: true, customerId: true, accessToken: true, refreshToken: true, managerAccountId: true },
  });

  const pushed: string[] = [];
  const failed: string[] = [];

  for (const conn of connections) {
    try {
      const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
      if (!devToken || !conn.accessToken) continue;

      // Google Ads IP exclusion via customer negative criterion
      const headers: Record<string, string> = {
        Authorization: `Bearer ${conn.accessToken}`,
        "developer-token": devToken,
        "Content-Type": "application/json",
      };
      if (conn.managerAccountId) headers["login-customer-id"] = conn.managerAccountId;

      const customerId = conn.customerId.replace(/-/g, "");
      const res = await fetch(
        `https://googleads.googleapis.com/v19/customers/${customerId}/customerNegativeCriteria:mutate`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            operations: [
              {
                create: {
                  ipBlock: { ipAddress: ip },
                },
              },
            ],
          }),
        }
      );

      if (res.ok) {
        pushed.push(conn.customerId);
      } else {
        const err = await res.json();
        console.error("Google Ads IP exclusion failed:", err);
        failed.push(conn.customerId);
      }
    } catch (err) {
      console.error("IP exclusion push error:", err);
      failed.push(conn.customerId);
    }
  }

  return NextResponse.json({ block, pushed, failed });
}

// DELETE /api/fraud/block?ip=x.x.x.x — unblock
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = new URL(req.url).searchParams.get("ip");
  if (!ip) return NextResponse.json({ error: "ip required" }, { status: 400 });

  await prisma.fraudBlock.updateMany({
    where: { userId: session.user.id, ip },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true });
}
