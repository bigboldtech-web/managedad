import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

function getPriceLookup(): Record<string, string> {
  return {
    STARTER: process.env.STRIPE_STARTER_PRICE_ID || "",
    PROFESSIONAL: process.env.STRIPE_PROFESSIONAL_PRICE_ID || "",
    ENTERPRISE: process.env.STRIPE_ENTERPRISE_PRICE_ID || "",
  };
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { plan } = await req.json();

    const PRICE_LOOKUP = getPriceLookup();
    if (!plan || !PRICE_LOOKUP[plan]) {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      );
    }

    const priceId = PRICE_LOOKUP[plan];

    // Find or create Stripe customer
    let subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    let customerId = subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: session.user.email!,
        name: session.user.name ?? undefined,
        metadata: { userId: session.user.id },
      });
      customerId = customer.id;

      subscription = await prisma.subscription.create({
        data: {
          userId: session.user.id,
          stripeCustomerId: customerId,
          plan: "FREE",
          status: "ACTIVE",
        },
      });
    }

    const checkoutSession = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
      metadata: {
        userId: session.user.id,
        plan,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
