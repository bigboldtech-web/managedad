import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMetaAuthUrl } from "@/lib/meta-ads/oauth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authUrl = getMetaAuthUrl();
  return NextResponse.redirect(authUrl);
}
