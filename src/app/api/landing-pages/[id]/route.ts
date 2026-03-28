import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const page = await prisma.landingPage.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!page || page.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const data: { isPublished?: boolean; name?: string } = {};
  if (typeof body.isPublished === "boolean") data.isPublished = body.isPublished;
  if (typeof body.name === "string") data.name = body.name.trim();

  const updated = await prisma.landingPage.update({
    where: { id },
    data,
  });

  return NextResponse.json({ page: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const page = await prisma.landingPage.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!page || page.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.landingPage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
