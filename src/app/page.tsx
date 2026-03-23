import Link from "next/link";
import {
  BarChart3,
  Zap,
  Target,
  TrendingUp,
  Globe,
  Shield,
  ArrowRight,
  Check,
} from "lucide-react";
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

const features = [
  {
    icon: BarChart3,
    title: "Unified Dashboard",
    description:
      "View all your Google Ads and Meta Ads campaigns in one place. Real-time metrics, spend tracking, and performance analytics.",
  },
  {
    icon: Zap,
    title: "Auto-Optimization",
    description:
      "AI-powered weekly optimization that pauses underperformers, scales winners, and adjusts bids and budgets automatically.",
  },
  {
    icon: Target,
    title: "Smart Keywords",
    description:
      "Intelligent keyword management with automatic match type optimization, negative keyword discovery, and quality score tracking.",
  },
  {
    icon: TrendingUp,
    title: "Performance Insights",
    description:
      "Deep analytics with CTR, CPC, CPA, and ROAS tracking. Compare platforms, campaigns, and time periods at a glance.",
  },
  {
    icon: Globe,
    title: "City Campaign Builder",
    description:
      "Launch geo-targeted campaigns for any city. Our AI researches demographics and competition to build optimal campaigns.",
  },
  {
    icon: Shield,
    title: "Budget Protection",
    description:
      "Configurable thresholds prevent overspending. Auto-pause wasteful keywords and ads before they drain your budget.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    description: "For small businesses getting started with paid ads.",
    features: [
      "2 ad platform connections",
      "Up to 10 campaigns",
      "Weekly auto-optimization",
      "Basic analytics",
      "Email support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Professional",
    price: "$149",
    period: "/month",
    description: "For growing businesses that need more power.",
    features: [
      "Unlimited connections",
      "Unlimited campaigns",
      "Daily auto-optimization",
      "Advanced analytics & reports",
      "City campaign builder",
      "A/B test suggestions",
      "Priority support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$399",
    period: "/month",
    description: "For agencies and large-scale advertisers.",
    features: [
      "Everything in Professional",
      "Multi-account management",
      "Custom optimization rules",
      "API access",
      "Dedicated account manager",
      "White-label reports",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">ManagedAd</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="#features"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Pricing
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="container mx-auto px-4 py-24 text-center md:py-32">
          <Badge variant="secondary" className="mb-4">
            Now supporting Google Ads & Meta Ads
          </Badge>
          <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
            Your AI Performance
            <br />
            <span className="text-primary">Marketing Autopilot</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Stop wasting ad spend. ManagedAd automatically optimizes your
            Google Ads and Meta Ads campaigns, manages keywords, and scales
            what works — so you don&apos;t have to.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg">
                See How It Works
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            14-day free trial. No credit card required.
          </p>
        </section>

        {/* Features */}
        <section id="features" className="border-t bg-muted/50 py-24">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold">
                Everything you need to dominate paid advertising
              </h2>
              <p className="mt-4 text-muted-foreground">
                One platform to manage, optimize, and scale all your ad
                campaigns.
              </p>
            </div>
            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="border-0 shadow-md">
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="mt-4">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold">
                Simple, transparent pricing
              </h2>
              <p className="mt-4 text-muted-foreground">
                Choose the plan that fits your advertising needs.
              </p>
            </div>
            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={
                    plan.popular
                      ? "relative border-primary shadow-lg"
                      : "shadow-md"
                  }
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge>Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">
                        {plan.period}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Link href="/register" className="w-full">
                      <Button
                        className="w-full"
                        variant={plan.popular ? "default" : "outline"}
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t bg-primary py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-primary-foreground">
              Ready to automate your ad performance?
            </h2>
            <p className="mt-4 text-primary-foreground/80">
              Join thousands of marketers who trust ManagedAd to optimize
              their campaigns.
            </p>
            <Link href="/register">
              <Button
                size="lg"
                variant="secondary"
                className="mt-8 gap-2"
              >
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">ManagedAd</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} ManagedAd. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
