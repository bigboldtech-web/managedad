import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, email } = await req.json();

  if (!name && !email) {
    return NextResponse.json({ error: "name or email required" }, { status: 400 });
  }

  try {
    if (email && email !== session.user.email) {
      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists && exists.id !== session.user.id) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name ? { name } : {}),
        ...(email ? { email } : {}),
      },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("Profile update failed:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
