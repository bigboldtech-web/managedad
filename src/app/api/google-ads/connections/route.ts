import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptToken } from "@/lib/encryption";
import { sendManagerLinkInvitation } from "@/lib/google-ads/manager-link";

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing connection ID" }, { status: 400 });
  }

  try {
    const connection = await prisma.googleAdsConnection.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    await prisma.googleAdsConnection.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting Google Ads connection:", error);
    return NextResponse.json(
      { error: "Failed to delete connection" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Accept either a single { customerId, accountName } OR
    // an array { customerIds: [{ customerId, accountName?, isManager? }, ...] }
    let targets: { customerId: string; accountName?: string; isManager?: boolean }[];
    if (Array.isArray(body.customerIds)) {
      targets = body.customerIds;
    } else if (body.customerId) {
      targets = [{ customerId: body.customerId, accountName: body.accountName }];
    } else {
      return NextResponse.json(
        { error: "Provide customerId (single) or customerIds (array)" },
        { status: 400 }
      );
    }

    if (targets.length === 0) {
      return NextResponse.json(
        { error: "No customer IDs provided" },
        { status: 400 }
      );
    }

    // Find the pending connection
    const pending = await prisma.googleAdsConnection.findFirst({
      where: { userId: session.user.id, customerId: "PENDING" },
      orderBy: { createdAt: "desc" },
    });

    if (!pending) {
      return NextResponse.json(
        { error: "No pending connection found. Please reconnect via OAuth first." },
        { status: 404 }
      );
    }

    const envManager = process.env.GOOGLE_ADS_MANAGER_ID?.replace(/-/g, "");
    const saved: string[] = [];

    for (const target of targets) {
      const sanitizedId = target.customerId.replace(/[-\s]/g, "");
      if (!/^\d{3,10}$/.test(sanitizedId)) continue;

      // If user is linking their own MCC, don't tag it as managed-by-itself.
      // If they're linking a sub-account and we know the platform MCC, tag it.
      const managerAccountId =
        target.isManager
          ? null
          : envManager && envManager !== sanitizedId
            ? envManager
            : null;

      await prisma.googleAdsConnection.upsert({
        where: {
          userId_customerId: {
            userId: session.user.id,
            customerId: sanitizedId,
          },
        },
        update: {
          refreshToken: pending.refreshToken,
          accessToken: pending.accessToken,
          tokenExpiresAt: pending.tokenExpiresAt,
          isActive: true,
          managerAccountId,
          ...(target.accountName && { accountName: target.accountName }),
        },
        create: {
          userId: session.user.id,
          customerId: sanitizedId,
          refreshToken: pending.refreshToken,
          accessToken: pending.accessToken,
          tokenExpiresAt: pending.tokenExpiresAt,
          isActive: true,
          managerAccountId,
          ...(target.accountName && { accountName: target.accountName }),
        },
      });
      saved.push(sanitizedId);
    }

    // Delete the pending record once at least one real connection saved
    if (saved.length > 0) {
      await prisma.googleAdsConnection.delete({ where: { id: pending.id } });
    }

    // Best-effort: send MCC link invitations for any sub-accounts we just linked
    // so they appear under our manager. Failures don't block the response.
    if (envManager) {
      try {
        const accessToken = decryptToken(pending.accessToken ?? "");
        for (const target of targets) {
          const sanitizedId = target.customerId.replace(/[-\s]/g, "");
          if (!/^\d{3,10}$/.test(sanitizedId)) continue;
          if (target.isManager) continue;
          if (sanitizedId === envManager) continue;
          try {
            await sendManagerLinkInvitation({
              clientCustomerId: sanitizedId,
              managerCustomerId: envManager,
              accessToken,
            });
          } catch (err) {
            console.error(`Manager link invitation failed for ${sanitizedId}:`, err);
          }
        }
      } catch (err) {
        console.error("Manager link invitation block failed:", err);
      }
    }

    return NextResponse.json({ success: true, customerIds: saved });
  } catch (error) {
    console.error("Error finalizing Google Ads connection:", error);
    return NextResponse.json(
      { error: "Failed to save connection" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const connections = await prisma.googleAdsConnection.findMany({
      where: { userId: session.user.id, NOT: { customerId: "PENDING" } },
      select: {
        id: true,
        customerId: true,
        accountName: true,
        isActive: true,
        lastSyncAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(connections);
  } catch (error) {
    console.error("Error fetching Google Ads connections:", error);
    return NextResponse.json(
      { error: "Failed to fetch connections" },
      { status: 500 }
    );
  }
}
