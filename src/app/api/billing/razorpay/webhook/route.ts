import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret || !signature) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  // Verify webhook signature
  const expectedSignature = createHmac("sha256", webhookSecret).update(body).digest("hex");
  if (expectedSignature !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);

  try {
    switch (event.event) {
      case "subscription.charged": {
        const sub = event.payload.subscription.entity;
        await prisma.subscription.updateMany({
          where: { razorpaySubscriptionId: sub.id },
          data: {
            status: "ACTIVE",
            currentPeriodEnd: new Date(sub.current_end * 1000),
          },
        });
        break;
      }
      case "subscription.cancelled": {
        const sub = event.payload.subscription.entity;
        await prisma.subscription.updateMany({
          where: { razorpaySubscriptionId: sub.id },
          data: { status: "CANCELLED" },
        });
        break;
      }
      case "payment.failed": {
        const payment = event.payload.payment.entity;
        if (payment.order_id) {
          await prisma.subscription.updateMany({
            where: { razorpayOrderId: payment.order_id },
            data: { status: "PAST_DUE" },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
