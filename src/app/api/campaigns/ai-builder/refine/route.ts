import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refineBlueprint } from "@/lib/campaign-builder/generator";
import { rateLimit } from "@/lib/rate-limit";
import type { CampaignBlueprintData } from "@/lib/campaign-builder/types";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { success: rlOk } = rateLimit(`ai-refine:${session.user.id}`, 10, 15 * 60_000);
  if (!rlOk) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  try {
    const { blueprintId, feedback } = await req.json();
    if (!blueprintId || !feedback?.trim()) {
      return NextResponse.json({ error: "blueprintId and feedback required" }, { status: 400 });
    }

    const existing = await prisma.campaignBlueprint.findFirst({
      where: { id: blueprintId, userId: session.user.id, status: "DRAFT" },
    });

    if (!existing) return NextResponse.json({ error: "Blueprint not found" }, { status: 404 });

    const currentBlueprint = existing.blueprint as unknown as CampaignBlueprintData;
    const refined = await refineBlueprint(currentBlueprint, feedback);

    await prisma.campaignBlueprint.update({
      where: { id: blueprintId },
      data: { blueprint: JSON.parse(JSON.stringify(refined)) },
    });

    return NextResponse.json({ blueprint: refined, blueprintId });
  } catch (err) {
    console.error("AI Builder refine error:", err);
    return NextResponse.json({ error: "Failed to refine blueprint" }, { status: 500 });
  }
}
