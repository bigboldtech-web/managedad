import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.notificationSettings.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const data = {
    emailEnabled:    Boolean(body.emailEnabled ?? true),
    slackEnabled:    Boolean(body.slackEnabled ?? false),
    slackWebhookUrl: typeof body.slackWebhookUrl === "string" ? body.slackWebhookUrl.trim() || null : null,
    whatsappEnabled: Boolean(body.whatsappEnabled ?? false),
    whatsappPhone:   typeof body.whatsappPhone === "string" ? body.whatsappPhone.trim() || null : null,
    dailyDigest:     Boolean(body.dailyDigest ?? true),
    weeklyReport:    Boolean(body.weeklyReport ?? true),
    fraudAlerts:     Boolean(body.fraudAlerts ?? true),
    anomalyAlerts:   Boolean(body.anomalyAlerts ?? true),
  };

  const settings = await prisma.notificationSettings.upsert({
    where:  { userId: session.user.id },
    update: data,
    create: { userId: session.user.id, ...data },
  });

  return NextResponse.json({ settings });
}
