import { NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { getMetaAuthUrl } from "@/lib/meta-ads/oauth";
import { checkAccountLimit } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Plan limit check — ad account limit
  const { allowed, current, limit } = await checkAccountLimit(session.user.id);
  if (!allowed) {
    return NextResponse.json(
      { error: `Ad account limit reached (${current}/${limit}). Upgrade your plan to connect more accounts.` },
      { status: 403 }
    );
  }

  // Wipe any stale PENDING row from a previous aborted attempt so the user
  // always starts the OAuth dance clean. Without this, a half-finished flow
  // can leave bad state that the picker page surfaces as an error.
  await prisma.metaAdsConnection.deleteMany({
    where: { userId: session.user.id, adAccountId: "PENDING" },
  });

  const state = crypto.randomUUID();
  const authUrl = getMetaAuthUrl(state);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("meta_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return response;
}
