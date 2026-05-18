import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCreditState } from "@/lib/credits";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = await getCreditState(session.user.id);
  if (!state) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(state);
}
