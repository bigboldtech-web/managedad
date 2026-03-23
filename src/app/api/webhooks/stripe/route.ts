import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import Stripe from "stripe";

function getPlanMap(): Record<string, "FREE" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE"> {
  return {
    [process.env.STRIPE_STARTER_PRICE_ID || ""]: "STARTER",
    [process.env.STRIPE_PROFESSIONAL_PRICE_ID || ""]: "PROFESSIONAL",
    [process.env.STRIPE_ENTERPRISE_PRICE_ID || ""]: "ENTERPRISE",
  };
}

function mapStatus(
  stripeStatus: Stripe.Subscription.Status
): "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE" | "TRIALING" {
  switch (stripeStatus) {
    case "active":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
    case "unpaid":
      return "CANCELED";
    case "incomplete":
    case "incomplete_expired":
      return "INCOMPLETE";
    case "trialing":
      return "TRIALING";
    default:
      return "ACTIVE";
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        const customerId = checkoutSession.customer as string;
        const subscriptionId = checkoutSession.subscription as string;
        const plan = checkoutSession.metadata?.plan ?? "STARTER";

        const stripeSubscription = await getStripe().subscriptions.retrieve(subscriptionId) as any;

        await prisma.subscription.update({
          where: { stripeCustomerId: customerId },
          data: {
            stripeSubscriptionId: subscriptionId,
            stripePriceId: stripeSubscription.items?.data?.[0]?.price?.id,
            plan: (plan as "STARTER" | "PROFESSIONAL" | "ENTERPRISE"),
            status: "ACTIVE",
            currentPeriodStart: stripeSubscription.current_period_start
              ? new Date(stripeSubscription.current_period_start * 1000)
              : undefined,
            currentPeriodEnd: stripeSubscription.current_period_end
              ? new Date(stripeSubscription.current_period_end * 1000)
              : undefined,
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end ?? false,
          },
        });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;
        const priceId = subscription.items?.data?.[0]?.price?.id;
        const plan = priceId ? getPlanMap()[priceId] ?? "FREE" : "FREE";

        await prisma.subscription.update({
          where: { stripeCustomerId: customerId },
          data: {
            stripePriceId: priceId,
            plan,
            status: mapStatus(subscription.status),
            currentPeriodStart: subscription.current_period_start
              ? new Date(subscription.current_period_start * 1000)
              : undefined,
            currentPeriodEnd: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : undefined,
            cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;

        await prisma.subscription.update({
          where: { stripeCustomerId: customerId },
          data: {
            plan: "FREE",
            status: "CANCELED",
            stripeSubscriptionId: null,
            stripePriceId: null,
            cancelAtPeriodEnd: false,
          },
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
