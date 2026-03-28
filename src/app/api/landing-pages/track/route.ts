import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Called by the DKI script on landing pages to track visits/conversions
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const event = searchParams.get("event") || "visit";

  if (!slug) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    if (event === "conversion") {
      await prisma.landingPage.updateMany({
        where: { slug },
        data: { conversions: { increment: 1 } },
      });
    } else {
      await prisma.landingPage.updateMany({
        where: { slug },
        data: { visits: { increment: 1 } },
      });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
