import { NextRequest, NextResponse } from "next/server";
import { runReviewForAllUsers } from "@/lib/reviews/run-review";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runReviewForAllUsers("BID_REVIEW");
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("Weekly bid review cron failed:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
