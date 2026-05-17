import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGoogleAdsAuthUrl } from "@/lib/google-ads/oauth";
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
  // always starts the OAuth dance clean.
  await prisma.googleAdsConnection.deleteMany({
    where: { userId: session.user.id, customerId: "PENDING" },
  });

  const authUrl = getGoogleAdsAuthUrl();
  return NextResponse.redirect(authUrl);
}
