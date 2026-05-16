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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { vertical: true },
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
        roasWeight: 0.6,
        cpaWeight: 0.3,
        volumeWeight: 0.1,
        vertical: user?.vertical ?? "D2C",
      });
    }

    return NextResponse.json({ ...settings, vertical: user?.vertical ?? "D2C" });
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
  roasWeight: z.number().min(0).max(1).optional(),
  cpaWeight: z.number().min(0).max(1).optional(),
  volumeWeight: z.number().min(0).max(1).optional(),
  vertical: z.enum(["D2C", "SAAS", "REAL_ESTATE", "EDTECH", "LEAD_GEN", "OTHER"]).optional(),
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

    const { vertical, ...settingsData } = parsed.data;

    if (
      settingsData.roasWeight !== undefined ||
      settingsData.cpaWeight !== undefined ||
      settingsData.volumeWeight !== undefined
    ) {
      const r = settingsData.roasWeight ?? 0.6;
      const c = settingsData.cpaWeight ?? 0.3;
      const v = settingsData.volumeWeight ?? 0.1;
      const sum = r + c + v;
      if (Math.abs(sum - 1.0) > 0.005) {
        return NextResponse.json(
          {
            error: `Weights must sum to 1.0 (got ${sum.toFixed(3)}). roas=${r}, cpa=${c}, volume=${v}`,
          },
          { status: 400 }
        );
      }
    }

    const settings = await prisma.optimizationSettings.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, ...settingsData },
      update: settingsData,
    });

    if (vertical) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { vertical },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating optimization settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
