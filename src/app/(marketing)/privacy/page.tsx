import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | ManagedAd",
  description:
    "Learn how ManagedAd by Big Bold Technologies collects, uses, and protects your data.",
};

/* ---------- reusable styles ---------- */
const heading2 =
  "mt-10 mb-4 text-xl font-bold tracking-tight sm:text-2xl";
const heading3 = "mt-6 mb-2 text-lg font-semibold";
const para = "mb-4 leading-relaxed";
const list = "mb-4 list-disc pl-6 space-y-2 leading-relaxed";

export default function PrivacyPolicyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm" style={{ color: "#71717a" }}>
          Last updated: March 1, 2026
        </p>

        <p className={`${para} mt-8`}>
          This Privacy Policy describes how Big Bold Technologies (&quot;we,&quot;
          &quot;us,&quot; or &quot;our&quot;), operating from Mumbai, India,
          collects, uses, and protects information when you use the ManagedAd
          platform (&quot;Service&quot;). By using the Service, you agree to the
          practices described in this policy.
        </p>

        {/* 1 */}
        <h2 className={heading2} style={{ fontFamily: "Sora, sans-serif", color: "#fafafa" }}>
          1. Information We Collect
        </h2>
        <h3 className={heading3} style={{ color: "#fafafa" }}>Account Information</h3>
        <p className={para}>
          When you create an account, we collect your name, email address,
          company name, phone number, and billing details required to process
          payments through Razorpay.
        </p>
        <h3 className={heading3} style={{ color: "#fafafa" }}>Campaign Data</h3>
        <p className={para}>
          When you connect your Google Ads or Meta advertising accounts, we
          access campaign performance data, ad creatives, keywords, budgets, and
          audience information through official platform APIs. This data is used
          exclusively to provide and improve the Service.
        </p>
        <h3 className={heading3} style={{ color: "#fafafa" }}>Usage Data</h3>
        <p className={para}>
          We automatically collect information about how you interact with the
          Service, including pages viewed, features used, browser type, device
          information, IP address, and timestamps.
        </p>

        {/* 2 */}
        <h2 className={heading2} style={{ fontFamily: "Sora, sans-serif", color: "#fafafa" }}>
          2. How We Use Information
        </h2>
        <ul className={list}>
          <li>Deliver, maintain, and improve the Service, including AI-powered ad optimization, reporting, and fraud detection.</li>
          <li>Process billing and subscription management through Razorpay.</li>
          <li>Send transactional communications such as billing confirmations, optimization alerts, and weekly performance digests.</li>
          <li>Analyze aggregated, anonymized usage data to improve product features.</li>
          <li>Respond to support requests and communicate about Service updates.</li>
        </ul>

        {/* 3 */}
        <h2 className={heading2} style={{ fontFamily: "Sora, sans-serif", color: "#fafafa" }}>
          3. Data Sharing
        </h2>
        <p className={para}>
          We do not sell, rent, or trade your personal information to third
          parties. We share data only in the following circumstances:
        </p>
        <ul className={list}>
          <li><strong style={{ color: "#fafafa" }}>Third-party integrations:</strong> When you connect your Google Ads or Meta accounts, data flows between ManagedAd and those platforms via their official APIs in accordance with their respective terms of service.</li>
          <li><strong style={{ color: "#fafafa" }}>Payment processing:</strong> Billing information is processed by Razorpay under their privacy policy.</li>
          <li><strong style={{ color: "#fafafa" }}>Service providers:</strong> We use infrastructure providers (hosting, email delivery, analytics) that process data on our behalf under strict confidentiality agreements.</li>
          <li><strong style={{ color: "#fafafa" }}>Legal requirements:</strong> We may disclose information if required by applicable law, regulation, or legal process.</li>
        </ul>

        {/* 4 */}
        <h2 className={heading2} style={{ fontFamily: "Sora, sans-serif", color: "#fafafa" }}>
          4. Data Security
        </h2>
        <p className={para}>
          We implement industry-standard security measures to protect your data.
          Sensitive credentials such as API tokens and refresh tokens are
          encrypted using AES-256-GCM encryption at rest. All data in transit is
          protected with TLS 1.2 or higher. We conduct regular security reviews
          and are working toward SOC 2 Type II compliance.
        </p>

        {/* 5 */}
        <h2 className={heading2} style={{ fontFamily: "Sora, sans-serif", color: "#fafafa" }}>
          5. Data Retention and Deletion
        </h2>
        <p className={para}>
          We retain your account and campaign data for as long as your account is
          active and for up to 90 days after account closure for backup and audit
          purposes. You may request deletion of your data at any time by
          contacting us at{" "}
          <a href="mailto:privacy@managedad.com" className="text-orange-500 hover:text-orange-400 underline">
            privacy@managedad.com
          </a>
          . Upon a verified deletion request, we will remove your personal data
          within 30 days, except where retention is required by law.
        </p>

        {/* 6 */}
        <h2 className={heading2} style={{ fontFamily: "Sora, sans-serif", color: "#fafafa" }}>
          6. Cookies
        </h2>
        <p className={para}>
          We use essential cookies required for authentication and session
          management. We may also use analytics cookies to understand how users
          interact with the Service. You can manage cookie preferences through
          your browser settings. The Service does not use advertising or
          tracking cookies.
        </p>

        {/* 7 */}
        <h2 className={heading2} style={{ fontFamily: "Sora, sans-serif", color: "#fafafa" }}>
          7. India Digital Personal Data Protection Act (DPDPA) 2023
        </h2>
        <p className={para}>
          As a company based in India, we comply with the Digital Personal Data
          Protection Act, 2023. You have the right to access your personal data,
          request correction of inaccurate data, request erasure of your data,
          and withdraw consent for data processing. To exercise any of these
          rights, contact our Grievance Officer at{" "}
          <a href="mailto:privacy@managedad.com" className="text-orange-500 hover:text-orange-400 underline">
            privacy@managedad.com
          </a>
          .
        </p>

        {/* 8 */}
        <h2 className={heading2} style={{ fontFamily: "Sora, sans-serif", color: "#fafafa" }}>
          8. GDPR Compliance (EU Users)
        </h2>
        <p className={para}>
          If you are located in the European Union or European Economic Area, you
          have additional rights under the General Data Protection Regulation
          (GDPR), including the right to access, rectification, erasure, data
          portability, restriction of processing, and the right to object. We
          process your data based on contractual necessity (to provide the
          Service) and legitimate interests (to improve the Service). You may
          exercise your GDPR rights by contacting{" "}
          <a href="mailto:privacy@managedad.com" className="text-orange-500 hover:text-orange-400 underline">
            privacy@managedad.com
          </a>
          .
        </p>

        {/* 9 */}
        <h2 className={heading2} style={{ fontFamily: "Sora, sans-serif", color: "#fafafa" }}>
          9. Children&apos;s Privacy
        </h2>
        <p className={para}>
          The Service is not directed to individuals under 18 years of age. We do
          not knowingly collect personal data from children. If we become aware
          that we have collected data from a child, we will delete it promptly.
        </p>

        {/* 10 */}
        <h2 className={heading2} style={{ fontFamily: "Sora, sans-serif", color: "#fafafa" }}>
          10. Changes to This Policy
        </h2>
        <p className={para}>
          We may update this Privacy Policy from time to time. We will notify
          registered users of material changes via email. Continued use of the
          Service after changes take effect constitutes acceptance of the updated
          policy.
        </p>

        {/* 11 */}
        <h2 className={heading2} style={{ fontFamily: "Sora, sans-serif", color: "#fafafa" }}>
          11. Contact Us
        </h2>
        <p className={para}>
          If you have questions or concerns about this Privacy Policy, please
          contact us:
        </p>
        <p className={para}>
          Big Bold Technologies<br />
          Mumbai, Maharashtra, India<br />
          Email:{" "}
          <a href="mailto:privacy@managedad.com" className="text-orange-500 hover:text-orange-400 underline">
            privacy@managedad.com
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
