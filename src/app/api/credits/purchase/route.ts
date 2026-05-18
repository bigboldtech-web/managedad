import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRazorpay } from "@/lib/razorpay";
import { CREDIT_PACKS } from "@/lib/credits";

/**
 * Create a Razorpay order for a credit pack.
 * Client receives the order ID and uses it with Razorpay Checkout.js to collect payment.
 * On success, the webhook fulfills the order by crediting the user.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { packSize } = (await req.json()) as { packSize?: number };
  if (!packSize) {
    return NextResponse.json({ error: "packSize is required" }, { status: 400 });
  }

  const pack = CREDIT_PACKS.find((p) => p.credits === packSize);
  if (!pack) {
    return NextResponse.json(
      { error: `Unknown pack size. Allowed: ${CREDIT_PACKS.map((p) => p.credits).join(", ")}` },
      { status: 400 }
    );
  }

  let order;
  try {
    order = await getRazorpay().orders.create({
      amount: pack.amountPaise,
      currency: "INR",
      receipt: `credits_${session.user.id}_${Date.now()}`,
      notes: {
        userId: session.user.id,
        packSize: String(pack.credits),
        kind: "credit_purchase",
      },
    });
  } catch (err) {
    console.error("Razorpay order create failed:", err);
    return NextResponse.json(
      { error: "Could not create payment order. Try again." },
      { status: 502 }
    );
  }

  // Record the pending purchase
  await prisma.creditPurchase.create({
    data: {
      userId: session.user.id,
      packSize: pack.credits,
      amountPaise: pack.amountPaise,
      status: "PENDING",
      razorpayOrderId: order.id,
    },
  });

  return NextResponse.json({
    orderId: order.id,
    amountPaise: pack.amountPaise,
    credits: pack.credits,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
}
