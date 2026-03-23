"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Plan = "FREE" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE";

interface SubscriptionInfo {
  plan: Plan;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

const PLANS: {
  name: Plan;
  price: string;
  description: string;
  features: string[];
}[] = [
  {
    name: "FREE",
    price: "$0",
    description: "Get started with basic features",
    features: [
      "1 ad platform connection",
      "Up to 5 campaigns",
      "7-day data retention",
      "Basic analytics",
    ],
  },
  {
    name: "STARTER",
    price: "$29",
    description: "For growing businesses",
    features: [
      "2 ad platform connections",
      "Up to 25 campaigns",
      "30-day data retention",
      "Advanced analytics",
      "Weekly optimization suggestions",
      "Email support",
    ],
  },
  {
    name: "PROFESSIONAL",
    price: "$99",
    description: "For scaling teams",
    features: [
      "Unlimited ad connections",
      "Unlimited campaigns",
      "90-day data retention",
      "AI-powered optimization",
      "Auto-apply optimizations",
      "City campaign generator",
      "Priority support",
    ],
  },
  {
    name: "ENTERPRISE",
    price: "$299",
    description: "For large organizations",
    features: [
      "Everything in Professional",
      "365-day data retention",
      "Custom optimization rules",
      "Dedicated account manager",
      "API access",
      "SSO/SAML support",
      "Custom integrations",
    ],
  },
];

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <BillingContent />
    </Suspense>
  );
}

function BillingContent() {
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [managingBilling, setManagingBilling] = useState(false);

  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const res = await fetch("/api/billing/checkout", { method: "GET" });
        if (res.ok) {
          const data = await res.json();
          setSubscription(data);
        } else {
          setSubscription({ plan: "FREE", status: "ACTIVE", currentPeriodEnd: null, cancelAtPeriodEnd: false });
        }
      } catch {
        setSubscription({ plan: "FREE", status: "ACTIVE", currentPeriodEnd: null, cancelAtPeriodEnd: false });
      }
      setLoading(false);
    }

    fetchSubscription();
  }, []);

  const currentPlan = subscription?.plan ?? "FREE";

  async function handleUpgrade(plan: Plan) {
    setUpgrading(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Failed to create checkout session:", error);
    }
    setUpgrading(null);
  }

  async function handleManageBilling() {
    setManagingBilling(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Failed to open billing portal:", error);
    }
    setManagingBilling(false);
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing details.
        </p>
      </div>

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
          Your subscription has been updated successfully.
        </div>
      )}

      {canceled && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
          Checkout was canceled. No changes were made.
        </div>
      )}

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
          <CardDescription>
            Your current subscription details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold">{currentPlan}</span>
            <Badge
              variant={subscription?.status === "ACTIVE" ? "default" : "secondary"}
              className={
                subscription?.status === "ACTIVE"
                  ? "bg-green-100 text-green-800"
                  : ""
              }
            >
              {subscription?.status ?? "ACTIVE"}
            </Badge>
            {subscription?.cancelAtPeriodEnd && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                Cancels at period end
              </Badge>
            )}
          </div>
          {subscription?.currentPeriodEnd && (
            <p className="text-sm text-muted-foreground">
              Current period ends:{" "}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                "en-US",
                { year: "numeric", month: "long", day: "numeric" }
              )}
            </p>
          )}
          {currentPlan !== "FREE" && (
            <Button
              variant="outline"
              onClick={handleManageBilling}
              disabled={managingBilling}
            >
              {managingBilling && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Manage Subscription
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Available Plans</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const isCurrentPlan = plan.name === currentPlan;
            const planIndex = PLANS.findIndex((p) => p.name === plan.name);
            const currentIndex = PLANS.findIndex(
              (p) => p.name === currentPlan
            );
            const isDowngrade = planIndex < currentIndex;

            return (
              <Card
                key={plan.name}
                className={isCurrentPlan ? "border-primary" : ""}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.name}
                    {isCurrentPlan && (
                      <Badge className="bg-primary text-primary-foreground">
                        Current
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    {plan.name !== "FREE" && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {isCurrentPlan ? (
                    <Button className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : plan.name === "FREE" ? (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={handleManageBilling}
                      disabled={currentPlan === "FREE"}
                    >
                      {currentPlan === "FREE" ? "Current Plan" : "Downgrade"}
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={isDowngrade ? "outline" : "default"}
                      onClick={() => handleUpgrade(plan.name)}
                      disabled={upgrading === plan.name}
                    >
                      {upgrading === plan.name && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {isDowngrade ? "Downgrade" : "Upgrade"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
