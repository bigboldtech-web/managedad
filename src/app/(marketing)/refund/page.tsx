import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refund Policy | ManagedAd",
  description:
    "ManagedAd refund policy covering free trial, monthly and annual subscription refunds, and processing details.",
};

const heading2 =
  "mt-10 mb-4 text-xl font-bold tracking-tight sm:text-2xl";
const para = "mb-4 leading-relaxed";
const list = "mb-4 list-disc pl-6 space-y-2 leading-relaxed";

export default function RefundPolicyPage() {
  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "#09090b", color: "#d4d4d8" }}
    >
      <div className="mx-auto max-w-3xl px-6 pt-28 pb-24">
        <h1
          className="text-3xl font-bold tracking-tight sm:text-4xl"
          style={{ fontFamily: "Sora, sans-serif", color: "#fafafa" }}
        >
          Refund Policy
        </h1>
        <p className="mt-2 text-sm" style={{ color: "#71717a" }}>
          Last updated: March 1, 2026
        </p>

        <p className={`${para} mt-8`}>
          Big Bold Technologies (&quot;we,&quot; &quot;us,&quot; or
          &quot;our&quot;) is committed to ensuring customer satisfaction with the
          ManagedAd platform. This Refund Policy outlines the terms under which
          refunds are available for our subscription plans.
        </p>

        {/* 1 */}
        <h2 className={heading2} style={{ fontFamily: "Sora, sans-serif", color: "#fafafa" }}>
          1. Free Trial
        </h2>
        <p className={para}>
          All new users receive a 14-day free trial with full access to the
          Service. No payment information is required to start the trial. You
          will not be charged during the trial period. If you decide that
          ManagedAd is not the right fit, simply do not subscribe to a paid plan
          and your trial will end automatically with no charges.
        </p>

        {/* 2 */}
        <h2 className={heading2} style={{ fontFamily: "Sora, sans-serif", color: "#fafafa" }}>
          2. Monthly Subscription Refunds
        </h2>
        <p className={para}>
          If you are on a monthly subscription plan and wish to request a refund,
          the following terms apply:
        </p>
        <ul className={list}>
          <li>Refund requests made within the first 7 days of a billing cycle are eligible for a pro-rated refund based on the unused portion of the billing period.</li>
          <li>Refund requests made after 7 days into the billing cycle are not eligible for a refund for that billing period. However, you may cancel your subscription to prevent future charges.</li>
        </ul>

        {/* 3 */}
        <h2 className={heading2} style={{ fontFamily: "Sora, sans-serif", color: "#fafafa" }}>
          3. Annual Subscription Refunds
        </h2>
        <p className={para}>
          If you are on an annual subscription plan and wish to request a refund,
          the following terms apply:
        </p>
        <ul className={list}>
          <li>Refund requests made within 30 days of the annual purchase date are eligible for a full refund.</li>
          <li>Refund requests made after 30 days are not eligible for a refund. You may continue to use the Service until the end of your annual billing period.</li>
        </ul>

        {/* 4 */}
        <h2 className={heading2} style={{ fontFamily: "Sora, sans-serif", color: "#fafafa" }}>
          4. How to Request a Refund
        </h2>
        <p className={para}>
          To request a refund, send an email to{" "}
          <a
            href="mailto:billing@managedad.com"
            className="text-orange-500 hover:text-orange-400 underline"
          >
            billing@managedad.com
          </a>{" "}
          with the following information:
        </p>
        <ul className={list}>
          <li>Your registered email address and account name.</li>
          <li>The subscription plan you are on (monthly or annual).</li>
          <li>The reason for your refund request.</li>
          <li>The date of the charge you are requesting a refund for.</li>
        </ul>
        <p className={para}>
          Our team will review your request and respond within 2 business days.
        </p>

        {/* 5 */}
        <h2 className={heading2} style={{ fontFamily: "Sora, sans-serif", color: "#fafafa" }}>
          5. Refund Processing
        </h2>
        <p className={para}>
          Approved refunds are processed through Razorpay and will be credited
          back to your original payment method. Please allow 5 to 7 business
          days for the refund to appear in your account after approval. The exact
          timing may vary depending on your bank or payment provider.
        </p>

        {/* 6 */}
        <h2 className={heading2} style={{ fontFamily: "Sora, sans-serif", color: "#fafafa" }}>
          6. Non-Refundable Items
        </h2>
        <p className={para}>
          The following are not eligible for refunds:
        </p>
        <ul className={list}>
          <li>Usage that occurred during the 14-day free trial period (no charge is applied, so no refund is necessary).</li>
          <li>Charges for billing periods where the Service was actively used beyond the applicable refund window.</li>
          <li>Any applicable taxes or government fees that have already been remitted.</li>
        </ul>

        {/* 7 */}
        <h2 className={heading2} style={{ fontFamily: "Sora, sans-serif", color: "#fafafa" }}>
          7. Cancellation
        </h2>
        <p className={para}>
          You may cancel your subscription at any time through your account
          settings or by emailing{" "}
          <a
            href="mailto:billing@managedad.com"
            className="text-orange-500 hover:text-orange-400 underline"
          >
            billing@managedad.com
          </a>
          . Cancellation takes effect at the end of the current billing period.
          You will retain access to the Service until your current billing period
          expires.
        </p>

        {/* 8 */}
        <h2 className={heading2} style={{ fontFamily: "Sora, sans-serif", color: "#fafafa" }}>
          8. Contact Us
        </h2>
        <p className={para}>
          For questions about this Refund Policy or to request a refund, please
          contact us:
        </p>
        <p className={para}>
          Big Bold Technologies<br />
          Mumbai, Maharashtra, India<br />
          Email:{" "}
          <a
            href="mailto:billing@managedad.com"
            className="text-orange-500 hover:text-orange-400 underline"
          >
            billing@managedad.com
          </a>
        </p>

        <div className="mt-12 border-t pt-8" style={{ borderColor: "#27272a" }}>
          <Link
            href="/"
            className="text-sm font-medium text-orange-500 hover:text-orange-400 transition-colors"
          >
            &larr; Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
