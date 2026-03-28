import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGoogleAdsAuthUrl } from "@/lib/google-ads/oauth";
import { checkAccountLimit } from "@/lib/plan-limits";

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

  const authUrl = getGoogleAdsAuthUrl();
  return NextResponse.redirect(authUrl);
}
