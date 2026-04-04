import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateBlueprint } from "@/lib/campaign-builder/generator";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { success: rlOk } = rateLimit(`ai-builder:${session.user.id}`, 10, 15 * 60_000);
  if (!rlOk) {
    return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
  }

  try {
    const { prompt, platform } = await req.json();
    if (!prompt?.trim()) return NextResponse.json({ error: "Describe what campaign you want to create" }, { status: 400 });
    if (!["GOOGLE_ADS", "META_ADS"].includes(platform)) {
      return NextResponse.json({ error: "Platform must be GOOGLE_ADS or META_ADS" }, { status: 400 });
    }

    const blueprint = await generateBlueprint(session.user.id, prompt, platform);

    // Store the blueprint in DB
    const record = await prisma.campaignBlueprint.create({
      data: {
        userId: session.user.id,
        prompt,
        platform,
        blueprint: JSON.parse(JSON.stringify(blueprint)),
        status: "DRAFT",
      },
    });

    return NextResponse.json({ blueprint, blueprintId: record.id });
  } catch (err) {
    console.error("AI Builder generate error:", err);
    return NextResponse.json({ error: "Failed to generate campaign strategy" }, { status: 500 });
  }
}
