import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | ManagedAd",
  description:
    "Terms and conditions for using the ManagedAd AI ad management platform by Big Bold Technologies.",
};

const heading2 =
  "mt-10 mb-4 text-xl font-bold tracking-tight sm:text-2xl";
const para = "mb-4 leading-relaxed";
const list = "mb-4 list-disc pl-6 space-y-2 leading-relaxed";

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="mt-2 text-sm" style={{ color: "#71717a" }}>
          Last updated: March 1, 2026
        </p>

        <p className={`${para} mt-8`}>
          These Terms of Service (&quot;Terms&quot;) govern your use of the
          ManagedAd platform (&quot;Service&quot;) operated by Big Bold
          Technologies (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or
          &quot;our&quot;), based in Mumbai, Maharashtra, India. By accessing or
          using the Service, you agree to be bound by these Terms.
        </p>

        {/* 1 */}
        <h2 className={heading2} style={{ fontFamily: "Sora, sans-serif", color: "#fafafa" }}>
          1. Acceptance of Terms
        </h2>
        <p className={para}>
          By creating an account or using any part of the Service, you
          acknowledge that you have read, understood, and agree to be bound by
          these Terms and our{" "}
          <Link href="/privacy" className="text-orange-500 hover:text-orange-400 underline">
            Privacy Policy
          </Link>
          . If you are using the Service on behalf of an organization, you
          represent that you have authority to bind that organization to these
          Terms.
        </p>

        {/* 2 */}
        <h2 className={heading2} style={{ fontFamily: "Sora, sans-serif", color: "#fafafa" }}>
          2. Description of Service
        </h2>
        <p className={para}>
          ManagedAd is an AI-powered advertising management platform that
          connects to your Google Ads and Meta (Facebook/Instagram) advertising
          accounts via their official APIs. The Service provides automated
          campaign optimization, bid management, negative keyword mining, fraud
          detection, performance reporting, and related features designed to
          improve advertising efficiency.
        </p>

        {/* 3 */}
        <h2 className={heading2} style={{ fontFamily: "Sora, sans-serif", color: "#fafafa" }}>
          3. Account Registration and Security
        </h2>
        <p className={para}>
          You must provide accurate and complete information when creating an
          account. You are responsible for maintaining the confidentiality of
          your login credentials and for all activities that occur under your
          account. You must notify us immediately at{" "}
          <a href="mailto:support@managedad.com" className="text-orange-500 hover:text-orange-400 underline">
            support@managedad.com
          </a>{" "}
          if you suspect unauthorized access to your account.
        </p>

        {/* 4 */}
        <h2 className={heading2} style={{ fontFamily: "Sora, sans-serif", color: "#fafafa" }}>
          4. Subscription Plans and Billing
        </h2>
        <p className={para}>
          The Service is offered through subscription plans billed in Indian
          Rupees (INR). Payments are processed through Razorpay. By subscribing,
          you authorize us to charge the applicable subscription fee to your
          selected payment method on a recurring basis (monthly or annual,
          depending on the plan selected).
        </p>
        <ul className={list}>
          <li>Subscription fees are billed in advance at the start of each billing cycle.</li>
          <li>All prices are listed exclusive of applicable taxes (GST) unless stated otherwise.</li>
          <li>We reserve the right to modify pricing with at least 30 days&apos; written notice. Price changes will take effect at the start of your next billing cycle.</li>
        </ul>

        {/* 5 */}
        <h2 className={heading2} style={{ fontFamily: "Sora, sans-serif", color: "#fafafa" }}>
          5. Free Trial
        </h2>
        <p className={para}>
          We offer a 14-day free trial for new users. During the trial period,
          you have access to the full feature set of the Service. No payment
          information is required to start a trial. If you do not subscribe to a
          paid plan before the trial ends, your account will be downgraded and
          campaign management features will be paused.
        </p>

        {/* 6 */}
        <h2 className={heading2} style={{ fontFamily: "Sora, sans-serif", color: "#fafafa" }}>
          6. User Responsibilities
        </h2>
        <p className={para}>As a user of the Service, you agree to:</p>
        <ul className={list}>
          <li>Provide accurate ad account credentials and maintain valid API connections with Google Ads and Meta platforms.</li>
          <li>Comply with all applicable advertising platform policies, including Google Ads policies and Meta Advertising Standards.</li>
          <li>Ensure that your advertising content does not violate any applicable laws, regulations, or third-party rights.</li>
          <li>Not use the Service for any unlawful, fraudulent, or malicious purpose.</li>
          <li>Not attempt to reverse-engineer, decompile, or extract the source code of the Service.</li>
          <li>Not share your account credentials with unauthorized parties.</li>
        </ul>

        {/* 7 */}
        <h2 className={heading2} style={{ fontFamily: "Sora, sans-serif", color: "#fafafa" }}>
          7. Intellectual Property
        </h2>
        <p className={para}>
          The Service, including its software, algorithms, design, branding, and
          documentation, is the intellectual property of Big Bold Technologies
          and is protected by applicable copyright and trademark laws. Your
          subscription grants you a limited, non-exclusive, non-transferable
          license to use the Service for its intended purpose during your active
          subscription period.
        </p>

        {/* 8 */}
        <h2 className={heading2} style={{ fontFamily: "Sora, sans-serif", color: "#fafafa" }}>
          8. Third-Party Integrations
        </h2>
        <p className={para}>
          The Service integrates with third-party platforms including Google Ads
          and Meta. These integrations are provided through official APIs and are
          subject to the respective terms and policies of those platforms.
          ManagedAd is not affiliated with, endorsed by, or sponsored by Google
          LLC or Meta Platforms, Inc. We do not guarantee uninterrupted access to
          third-party APIs, as availability is controlled by those platforms.
        </p>

        {/* 9 */}
        <h2 className={heading2} style={{ fontFamily: "Sora, sans-serif", color: "#fafafa" }}>
          9. Limitation of Liability
        </h2>
        <p className={para}>
          To the maximum extent permitted by applicable law, Big Bold
          Technologies shall not be liable for any indirect, incidental, special,
          consequential, or punitive damages, including but not limited to loss
          of revenue, loss of profits, loss of data, or advertising spend
          resulting from automated campaign adjustments made by the Service.
        </p>
        <p className={para}>
          Our total aggregate liability for any claims arising from the use of
          the Service shall not exceed the amount you paid for the Service during
          the twelve (12) months immediately preceding the claim.
        </p>

        {/* 10 */}
        <h2 className={heading2} style={{ fontFamily: "Sora, sans-serif", color: "#fafafa" }}>
          10. Termination
        </h2>
        <p className={para}>
          You may cancel your subscription at any time through the account
          settings or by contacting{" "}
          <a href="mailto:support@managedad.com" className="text-orange-500 hover:text-orange-400 underline">
            support@managedad.com
          </a>
          . We may suspend or terminate your account if you violate these Terms,
          fail to pay subscription fees, or engage in activity that harms the
          Service or other users. Upon termination, your right to use the Service
          ceases immediately and your data will be retained for 90 days before
          deletion.
        </p>

        {/* 11 */}
        <h2 className={heading2} style={{ fontFamily: "Sora, sans-serif", color: "#fafafa" }}>
          11. Governing Law and Jurisdiction
        </h2>
        <p className={para}>
          These Terms are governed by and construed in accordance with the laws
          of India. Any disputes arising from these Terms or the use of the
          Service shall be subject to the exclusive jurisdiction of the courts in
          Mumbai, Maharashtra, India.
        </p>

        {/* 12 */}
        <h2 className={heading2} style={{ fontFamily: "Sora, sans-serif", color: "#fafafa" }}>
          12. Modifications to Terms
        </h2>
        <p className={para}>
          We reserve the right to modify these Terms at any time. We will notify
          registered users of material changes via email at least 15 days before
          they take effect. Your continued use of the Service after the updated
          Terms take effect constitutes your acceptance of the changes.
        </p>

        {/* 13 */}
        <h2 className={heading2} style={{ fontFamily: "Sora, sans-serif", color: "#fafafa" }}>
          13. Contact
        </h2>
        <p className={para}>
          For questions about these Terms of Service, please contact us:
        </p>
        <p className={para}>
          Big Bold Technologies<br />
          Mumbai, Maharashtra, India<br />
          Email:{" "}
          <a href="mailto:support@managedad.com" className="text-orange-500 hover:text-orange-400 underline">
            support@managedad.com
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
