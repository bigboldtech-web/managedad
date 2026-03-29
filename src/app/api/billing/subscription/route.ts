import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: { plan: true, status: true, currentPeriodEnd: true, cancelAtPeriodEnd: true },
  });

  return NextResponse.json({
    plan: subscription?.plan ?? "FREE",
    status: subscription?.status ?? "ACTIVE",
    currentPeriodEnd: subscription?.currentPeriodEnd,
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
  });
}
