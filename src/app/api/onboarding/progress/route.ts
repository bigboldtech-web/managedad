import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      onboardingStep: true,
      onboardingCompleted: true,
      autonomousMode: true,
      name: true,
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [googleConns, metaConns, campaignCount, optSettings] = await Promise.all([
    prisma.googleAdsConnection.findMany({
      where: { userId: session.user.id, isActive: true },
      select: { id: true, accountName: true, customerId: true },
    }),
    prisma.metaAdsConnection.findMany({
      where: { userId: session.user.id, isActive: true },
      select: { id: true, accountName: true, adAccountId: true },
    }),
    prisma.campaign.count({ where: { userId: session.user.id } }),
    prisma.optimizationSettings.findUnique({
      where: { userId: session.user.id },
      select: { autoApply: true, isEnabled: true },
    }),
  ]);

  return NextResponse.json({
    step: user.onboardingStep,
    completed: user.onboardingCompleted,
    autonomousMode: user.autonomousMode,
    userName: user.name || "",
    googleConnections: googleConns,
    metaConnections: metaConns,
    campaignCount,
    hasOptSettings: !!optSettings,
    autoApply: optSettings?.autoApply ?? false,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { step, completed, autonomousMode } = await req.json();

  const updateData: Record<string, unknown> = {};
  if (typeof step === "number") updateData.onboardingStep = step;
  if (typeof completed === "boolean") updateData.onboardingCompleted = completed;
  if (typeof autonomousMode === "boolean") updateData.autonomousMode = autonomousMode;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: { onboardingStep: true, onboardingCompleted: true, autonomousMode: true },
  });

  // When enabling autonomous mode, also enable optimization settings
  if (autonomousMode === true) {
    await prisma.optimizationSettings.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        isEnabled: true,
        autoApply: true,
      },
      update: {
        isEnabled: true,
        autoApply: true,
      },
    });
  }

  return NextResponse.json(user);
}
