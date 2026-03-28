import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PlanKey, RAZORPAY_PLANS } from "@/lib/razorpay";
import { sendPaymentSuccessEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, billing } =
      await req.json() as {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
        plan: PlanKey;
        billing: "monthly" | "annual";
      };

    // Verify signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ error: "Payment verification not configured" }, { status: 500 });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = createHmac("sha256", keySecret).update(body).digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // Upsert subscription record
    await prisma.subscription.upsert({
      where: { userId: session.user.id },
      update: {
        plan,
        status: "ACTIVE",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        billingCycle: billing,
        currentPeriodStart: new Date(),
        currentPeriodEnd: billing === "annual"
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      create: {
        userId: session.user.id,
        plan,
        status: "ACTIVE",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        billingCycle: billing,
        currentPeriodStart: new Date(),
        currentPeriodEnd: billing === "annual"
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Fire-and-forget payment confirmation email
    if (session.user.email) {
      const planConfig = RAZORPAY_PLANS[plan];
      const amountPaise = billing === "annual" ? planConfig.annualAmount : planConfig.monthlyAmount;
      sendPaymentSuccessEmail(
        session.user.email,
        session.user.name ?? "there",
        planConfig.name,
        billing,
        amountPaise / 100
      ).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Razorpay verify error:", error);
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
  }
}
