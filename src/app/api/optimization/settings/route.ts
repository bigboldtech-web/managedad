import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await prisma.optimizationSettings.findUnique({
      where: { userId: session.user.id },
    });

    if (!settings) {
      return NextResponse.json({
        isEnabled: true,
        runFrequency: "WEEKLY",
        autoApply: false,
        minImpressions: 100,
        lowPerformanceThreshold: 0.5,
        highPerformanceThreshold: 2.0,
        maxBudgetIncrease: 25,
        maxBudgetDecrease: 50,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching optimization settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

const updateSettingsSchema = z.object({
  isEnabled: z.boolean().optional(),
  runFrequency: z.string().optional(),
  autoApply: z.boolean().optional(),
  minImpressions: z.number().int().positive().optional(),
  lowPerformanceThreshold: z.number().positive().optional(),
  highPerformanceThreshold: z.number().positive().optional(),
  maxBudgetIncrease: z.number().positive().max(100).optional(),
  maxBudgetDecrease: z.number().positive().max(100).optional(),
});

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = updateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const settings = await prisma.optimizationSettings.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...parsed.data,
      },
      update: parsed.data,
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating optimization settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
