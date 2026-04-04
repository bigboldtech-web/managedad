import { NextRequest, NextResponse } from "next/server";
import { runWeeklyRecommendations } from "@/lib/recommendations/engine";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const usersProcessed = await runWeeklyRecommendations();
    return NextResponse.json({ success: true, usersProcessed });
  } catch (err) {
    console.error("Weekly recommendations cron failed:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
