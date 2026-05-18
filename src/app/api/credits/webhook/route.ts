import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * Razorpay webhook for credit purchase fulfillment.
 *
 * Configured separately from the subscription webhook so credit purchase
 * events don't get mixed with subscription billing events.
 *
 * Subscribe this URL in Razorpay dashboard → Webhooks → Add new
 * with the events: payment.captured, payment.failed
 *
 * Secret comes from RAZORPAY_CREDITS_WEBHOOK_SECRET (separate from the
 * subscription webhook secret so they can be rotated independently).
 */

interface RazorpayPayment {
  id: string;
  status: string;
  order_id: string;
  amount: number;
  notes?: { userId?: string; packSize?: string; kind?: string };
}

interface RazorpayWebhookPayload {
  event: string;
  payload: {
    payment?: { entity: RazorpayPayment };
  };
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-razorpay-signature");
  const secret = process.env.RAZORPAY_CREDITS_WEBHOOK_SECRET;

  if (!secret) {
    console.error("RAZORPAY_CREDITS_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const bodyText = await req.text();
  const expected = crypto.createHmac("sha256", secret).update(bodyText).digest("hex");
  if (expected !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: RazorpayWebhookPayload;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ error: "Bad body" }, { status: 400 });
  }

  const payment = payload.payload.payment?.entity;
  if (!payment) {
    return NextResponse.json({ ok: true, ignored: "no payment" });
  }
  // Only fulfill credit purchases (not subscription payments — separate webhook)
  if (payment.notes?.kind !== "credit_purchase") {
    return NextResponse.json({ ok: true, ignored: "not credit_purchase" });
  }

  const purchase = await prisma.creditPurchase.findUnique({
    where: { razorpayOrderId: payment.order_id },
  });
  if (!purchase) {
    console.error(`Credit purchase row not found for order ${payment.order_id}`);
    return NextResponse.json({ ok: true, ignored: "no purchase record" });
  }
  if (purchase.status === "COMPLETED") {
    return NextResponse.json({ ok: true, alreadyFulfilled: true });
  }

  if (payload.event === "payment.captured") {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: purchase.userId },
        select: { creditBalance: true },
      });
      if (!user) throw new Error("User not found");

      const newBalance = user.creditBalance + purchase.packSize;
      await tx.user.update({
        where: { id: purchase.userId },
        data: { creditBalance: newBalance },
      });
      await tx.creditPurchase.update({
        where: { id: purchase.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          razorpayPaymentId: payment.id,
        },
      });
      await tx.creditTransaction.create({
        data: {
          userId: purchase.userId,
          type: "PURCHASE",
          amount: purchase.packSize,
          balanceAfter: newBalance,
          source: payment.id,
          metadata: {
            packSize: purchase.packSize,
            amountPaise: purchase.amountPaise,
            razorpayOrderId: payment.order_id,
          },
        },
      });
    });
    return NextResponse.json({ ok: true, fulfilled: purchase.packSize });
  }

  if (payload.event === "payment.failed") {
    await prisma.creditPurchase.update({
      where: { id: purchase.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json({ ok: true, status: "failed" });
  }

  return NextResponse.json({ ok: true, ignored: `event ${payload.event}` });
}
