import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGoogleAdsAuthUrl } from "@/lib/google-ads/oauth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authUrl = getGoogleAdsAuthUrl();
  return NextResponse.redirect(authUrl);
}
