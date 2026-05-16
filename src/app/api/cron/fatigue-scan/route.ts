import { NextRequest, NextResponse } from "next/server";
import { scanAndMarkFatigue } from "@/lib/optimization/helios/fatigue";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updates = await scanAndMarkFatigue();
  const fatigued = updates.filter((u) => u.isFatigued).length;

  return NextResponse.json({
    message: "Fatigue scan completed",
    scored: updates.length,
    fatigued,
    timestamp: new Date().toISOString(),
  });
}

export const GET = POST;
