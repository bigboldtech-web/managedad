import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { executeBlueprint } from "@/lib/campaign-builder/executor";
import type { CampaignBlueprintData } from "@/lib/campaign-builder/types";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { blueprintId } = await req.json();
    if (!blueprintId) return NextResponse.json({ error: "blueprintId required" }, { status: 400 });

    const blueprint = await prisma.campaignBlueprint.findFirst({
      where: { id: blueprintId, userId: session.user.id, status: "DRAFT" },
    });

    if (!blueprint) return NextResponse.json({ error: "Blueprint not found or already executed" }, { status: 404 });

    // Mark as creating
    await prisma.campaignBlueprint.update({
      where: { id: blueprintId },
      data: { status: "CREATING" },
    });

    const blueprintData = blueprint.blueprint as unknown as CampaignBlueprintData;

    try {
      const campaignId = await executeBlueprint(session.user.id, blueprintData);

      await prisma.campaignBlueprint.update({
        where: { id: blueprintId },
        data: { status: "CREATED", campaignId },
      });

      return NextResponse.json({ success: true, campaignId });
    } catch (err) {
      await prisma.campaignBlueprint.update({
        where: { id: blueprintId },
        data: { status: "FAILED" },
      });
      throw err;
    }
  } catch (err) {
    console.error("AI Builder execute error:", err);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
