import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runOptimization } from "@/lib/optimization/engine";
import { rateLimit } from "@/lib/rate-limit";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success: rlOk } = rateLimit(`opt-run:${session.user.id}`, 5, 15 * 60_000);
  if (!rlOk) {
    return NextResponse.json({ error: "Too many optimization runs. Please wait 15 minutes." }, { status: 429 });
  }

  try {
    const summary = await runOptimization(session.user.id);
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error running optimization:", error);
    return NextResponse.json(
      { error: "Failed to run optimization" },
      { status: 500 }
    );
  }
}
