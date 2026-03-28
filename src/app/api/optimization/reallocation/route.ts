import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  analyzeCrossPlatformReallocation,
  applyReallocation,
} from "@/lib/optimization/cross-platform";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const analysis = await analyzeCrossPlatformReallocation(session.user.id);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Error analyzing cross-platform reallocation:", error);
    return NextResponse.json(
      { error: "Failed to analyze cross-platform performance" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { recommendationIndex } = body;

    if (typeof recommendationIndex !== "number" || recommendationIndex < 0) {
      return NextResponse.json(
        { error: "Invalid recommendationIndex" },
        { status: 400 }
      );
    }

    // Re-fetch analysis to get fresh recommendations
    const analysis = await analyzeCrossPlatformReallocation(session.user.id);

    if (!analysis.isEligible) {
      return NextResponse.json(
        { error: analysis.reason || "Not eligible for reallocation" },
        { status: 403 }
      );
    }

    if (recommendationIndex >= analysis.recommendations.length) {
      return NextResponse.json(
        { error: "Recommendation index out of range" },
        { status: 400 }
      );
    }

    const recommendation = analysis.recommendations[recommendationIndex];
    const result = await applyReallocation(session.user.id, recommendation);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to apply reallocation" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      applied: recommendation,
      message: `Shifted ${recommendation.amount} INR/day from ${recommendation.fromPlatform} to ${recommendation.toPlatform}`,
    });
  } catch (error) {
    console.error("Error applying reallocation:", error);
    return NextResponse.json(
      { error: "Failed to apply reallocation" },
      { status: 500 }
    );
  }
}
