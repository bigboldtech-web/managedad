import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runOptimization } from "@/lib/optimization/engine";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
