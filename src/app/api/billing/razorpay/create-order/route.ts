import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRazorpay, RAZORPAY_PLANS, PlanKey } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { plan, billing } = await req.json() as { plan: PlanKey; billing: "monthly" | "annual" };

    const planConfig = RAZORPAY_PLANS[plan];
    if (!planConfig) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const amount = billing === "annual" ? planConfig.annualAmount : planConfig.monthlyAmount;

    const order = await getRazorpay().orders.create({
      amount,
      currency: "INR",
      receipt: `order_${session.user.id}_${Date.now()}`,
      notes: {
        userId: session.user.id,
        plan,
        billing,
        userEmail: session.user.email ?? "",
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      prefill: {
        name: session.user.name ?? "",
        email: session.user.email ?? "",
      },
      planName: planConfig.name,
    });
  } catch (error) {
    console.error("Razorpay create order error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
