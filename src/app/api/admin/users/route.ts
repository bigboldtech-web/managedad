import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized", status: 401, session: null };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    return { error: "Forbidden", status: 403, session: null };
  }

  return { error: null, status: 200, session };
}

export async function GET() {
  const { error, status } = await requireAdmin();
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        subscription: {
          select: { plan: true },
        },
        _count: {
          select: { campaigns: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      plan: u.subscription?.plan ?? "FREE",
      campaignsCount: u._count.campaigns,
      createdAt: u.createdAt.toISOString(),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

const updateRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["USER", "ADMIN"]),
});

export async function PATCH(req: NextRequest) {
  const { error, status } = await requireAdmin();
  if (error) {
    return NextResponse.json({ error }, { status });
  }

  try {
    const body = await req.json();
    const parsed = updateRoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { userId, role } = parsed.data;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, role: true },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 }
    );
  }
}
