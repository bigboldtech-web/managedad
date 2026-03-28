import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encryptToken, decryptToken } from "@/lib/encryption";

export async function POST(req: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const META_APP_ID = process.env.META_APP_ID;
  const META_APP_SECRET = process.env.META_APP_SECRET;

  if (!META_APP_ID || !META_APP_SECRET) {
    return NextResponse.json(
      { error: "META_APP_ID and META_APP_SECRET must be set" },
      { status: 500 }
    );
  }

  const results = { refreshed: 0, failed: 0, skipped: 0 };
  const errors: { connectionId: string; error: string }[] = [];

  try {
    // Find connections where token expires within the next 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const connections = await prisma.metaAdsConnection.findMany({
      where: {
        isActive: true,
        tokenExpiresAt: {
          lte: sevenDaysFromNow,
        },
      },
      select: {
        id: true,
        accessToken: true,
        tokenExpiresAt: true,
        adAccountId: true,
      },
    });

    if (connections.length === 0) {
      return NextResponse.json({
        message: "No tokens need refreshing",
        results,
        timestamp: new Date().toISOString(),
      });
    }

    for (const connection of connections) {
      try {
        // Decrypt the current stored token before sending to Meta
        const currentToken = decryptToken(connection.accessToken);

        const url = new URL(
          "https://graph.facebook.com/v22.0/oauth/access_token"
        );
        url.searchParams.set("grant_type", "fb_exchange_token");
        url.searchParams.set("client_id", META_APP_ID);
        url.searchParams.set("client_secret", META_APP_SECRET);
        url.searchParams.set("fb_exchange_token", currentToken);

        const response = await fetch(url.toString());
        const data = await response.json();

        if (!response.ok || data.error) {
          const errMsg =
            data.error?.message || `HTTP ${response.status}`;
          console.error(
            `Failed to refresh token for connection ${connection.id}: ${errMsg}`
          );
          errors.push({ connectionId: connection.id, error: errMsg });
          results.failed++;
          continue;
        }

        const newAccessToken = data.access_token as string;
        if (!newAccessToken) {
          console.error(
            `No access_token in response for connection ${connection.id}`
          );
          errors.push({
            connectionId: connection.id,
            error: "No access_token in Meta response",
          });
          results.failed++;
          continue;
        }

        // Encrypt the new token before storing
        const encryptedToken = encryptToken(newAccessToken);

        // New long-lived token is valid for 60 days
        const newExpiresAt = new Date();
        newExpiresAt.setDate(newExpiresAt.getDate() + 60);

        await prisma.metaAdsConnection.update({
          where: { id: connection.id },
          data: {
            accessToken: encryptedToken,
            tokenExpiresAt: newExpiresAt,
          },
        });

        results.refreshed++;
        console.log(
          `Refreshed Meta token for connection ${connection.id} (account ${connection.adAccountId})`
        );
      } catch (error) {
        console.error(
          `Error refreshing token for connection ${connection.id}:`,
          error
        );
        errors.push({
          connectionId: connection.id,
          error: String(error),
        });
        results.failed++;
      }
    }

    return NextResponse.json({
      message: "Meta token refresh completed",
      results,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron refresh-meta-tokens failed:", error);
    return NextResponse.json(
      { error: "Token refresh failed", details: String(error) },
      { status: 500 }
    );
  }
}
