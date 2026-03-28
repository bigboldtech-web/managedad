import { prisma } from "@/lib/prisma";

// ─── Slack ───────────────────────────────────────────────────────────────────

export async function sendSlackMessage(webhookUrl: string, text: string, blocks?: unknown[]): Promise<void> {
  const body: Record<string, unknown> = { text };
  if (blocks) body.blocks = blocks;

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Slack webhook failed (${res.status}): ${err}`);
  }
}

// ─── WhatsApp Cloud API ───────────────────────────────────────────────────────

export async function sendWhatsAppMessage(phone: string, text: string): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error("WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN are not configured");
  }

  // Normalise phone — must be E.164 without +
  const normalized = phone.replace(/[^0-9]/g, "");

  const res = await fetch(
    `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalized,
        type: "text",
        text: { body: text },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`WhatsApp API failed: ${JSON.stringify(err)}`);
  }
}

// ─── High-level alert helpers ─────────────────────────────────────────────────

export interface OptimizationAlertPayload {
  userId: string;
  userName: string;
  totalActions: number;
  actionsByType: Record<string, number>;
  campaignsAnalyzed: number;
}

export async function notifyOptimizationActions(payload: OptimizationAlertPayload): Promise<void> {
  const settings = await prisma.notificationSettings.findUnique({
    where: { userId: payload.userId },
  });

  if (!settings) return;
  if (!settings.anomalyAlerts) return;

  const topActions = Object.entries(payload.actionsByType)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([type, count]) => `• ${count}x ${type.replace(/_/g, " ").toLowerCase()}`)
    .join("\n");

  const summary =
    `*ManagedAd ran ${payload.totalActions} optimisation action${payload.totalActions !== 1 ? "s" : ""}* across ${payload.campaignsAnalyzed} campaigns.\n\n${topActions}\n\nReview → ${process.env.NEXT_PUBLIC_APP_URL ?? "https://managedad.io"}/automations`;

  const errors: string[] = [];

  if (settings.slackEnabled && settings.slackWebhookUrl) {
    try {
      await sendSlackMessage(settings.slackWebhookUrl, summary, [
        {
          type: "section",
          text: { type: "mrkdwn", text: summary },
        },
      ]);
    } catch (err) {
      errors.push(`Slack: ${String(err)}`);
    }
  }

  if (settings.whatsappEnabled && settings.whatsappPhone) {
    try {
      // WhatsApp doesn't support markdown — send plain text
      const plain = summary.replace(/\*/g, "").replace(/→/g, "");
      await sendWhatsAppMessage(settings.whatsappPhone, plain);
    } catch (err) {
      errors.push(`WhatsApp: ${String(err)}`);
    }
  }

  if (errors.length > 0) {
    console.error("Notification errors:", errors);
  }
}

export interface SpendAnomalyPayload {
  userId: string;
  campaignName: string;
  metric: string;
  change: string; // e.g. "+340% spend spike"
  value: string;  // e.g. "₹12,400 in 2 hours"
}

export async function notifySpendAnomaly(payload: SpendAnomalyPayload): Promise<void> {
  const settings = await prisma.notificationSettings.findUnique({
    where: { userId: payload.userId },
  });

  if (!settings?.anomalyAlerts) return;

  const text = `⚠️ Anomaly detected in "${payload.campaignName}"\n${payload.metric}: ${payload.change}\nValue: ${payload.value}\n\nCheck now → ${process.env.NEXT_PUBLIC_APP_URL ?? "https://managedad.io"}/campaigns`;

  if (settings.slackEnabled && settings.slackWebhookUrl) {
    sendSlackMessage(settings.slackWebhookUrl, text).catch(console.error);
  }

  if (settings.whatsappEnabled && settings.whatsappPhone) {
    sendWhatsAppMessage(settings.whatsappPhone, text).catch(console.error);
  }
}
