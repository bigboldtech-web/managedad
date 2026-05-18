import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { executeApprovedActions } from "@/lib/optimization/executor";

/**
 * Debug endpoint — runs the executor on demand for the calling user.
 * Useful to flush APPROVED actions and capture errorMessage on failures.
 * Admin-only.
 */
export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const summary = await executeApprovedActions(session.user.id);
  return NextResponse.json({ message: "Executor finished", summary });
}

export const GET = POST;
