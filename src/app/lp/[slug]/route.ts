import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const page = await prisma.landingPage.findUnique({
    where: { slug },
    select: { htmlContent: true, isPublished: true, userId: true, id: true },
  });

  if (!page || !page.isPublished) {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="background:#09090b;color:#fafafa;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h1 style="font-size:48px;margin:0">404</h1><p style="color:#52525b">Page not found</p></div></body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // Track visit asynchronously (fire and forget)
  prisma.landingPage.update({
    where: { id: page.id },
    data: { visits: { increment: 1 } },
  }).catch(() => {});

  return new NextResponse(page.htmlContent, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
