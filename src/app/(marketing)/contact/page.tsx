import type { Metadata } from "next";
import { Mail, MapPin, Clock, Twitter, Linkedin } from "lucide-react";
import { JsonLd, localBusinessSchema } from "@/components/marketing/json-ld";
import { CTASection } from "@/components/marketing/cta-section";
import { ContactForm } from "@/components/marketing/contact-form";

export const metadata: Metadata = {
  title: "Contact ManagedAd — Get in Touch",
  description:
    "Contact the ManagedAd team for questions, demos, or support. Email hello@managedad.com or fill out the form. Based in Mumbai, India. Mon-Sat 10am-7pm IST.",
};

export default function ContactPage() {
  return (
    <>
      <JsonLd data={localBusinessSchema()} />

      {/* Hero */}
      <section
        style={{
          textAlign: "center",
          padding: "80px 24px 48px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-40%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 700,
            height: 700,
            background:
              "radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 2,
              color: "#fb923c",
              marginBottom: 12,
            }}
          >
            Contact
          </p>
          <h1
            style={{
              fontFamily: '"Sora", sans-serif',
              fontSize: "clamp(36px, 5vw, 60px)",
              fontWeight: 800,
              letterSpacing: -2,
              lineHeight: 1.08,
              color: "#fafafa",
              margin: "0 0 20px",
            }}
          >
            Get in touch
          </h1>
          <p
            style={{
              fontSize: "clamp(15px, 1.3vw, 18px)",
              color: "#a1a1aa",
              maxWidth: 480,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Have a question about ManagedAd? Want a demo? We would love to hear
            from you.
          </p>
        </div>
      </section>

      {/* Contact content */}
      <section style={{ padding: "0 24px 96px" }}>
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 380px",
            gap: 40,
            alignItems: "start",
          }}
          className="contact-grid"
        >
          {/* Form */}
          <div
            style={{
              background: "#111114",
              border: "1px solid #27272e",
              borderRadius: 16,
              padding: "36px 32px",
            }}
          >
            <ContactForm />
          </div>

          {/* Sidebar */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <ContactCard
              icon={<Mail size={20} color="#f97316" />}
              title="Email"
              content="hello@managedad.com"
              href="mailto:hello@managedad.com"
            />
            <ContactCard
              icon={<MapPin size={20} color="#f97316" />}
              title="Location"
              content="Mumbai, Maharashtra, India"
            />
            <ContactCard
              icon={<Clock size={20} color="#f97316" />}
              title="Support hours"
              content="Mon\u2013Sat, 10:00 AM \u2013 7:00 PM IST"
            />

            {/* Social links */}
            <div
              style={{
                background: "#111114",
                border: "1px solid #27272e",
                borderRadius: 12,
                padding: "24px 24px",
              }}
            >
              <h4
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#fafafa",
                  margin: "0 0 14px",
                }}
              >
                Follow us
              </h4>
              <div style={{ display: "flex", gap: 12 }}>
                <SocialLink href="#" icon={<Twitter size={18} />} label="Twitter" />
                <SocialLink
                  href="#"
                  icon={<Linkedin size={18} />}
                  label="LinkedIn"
                />
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .contact-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </section>

      <CTASection
        headline="Ready to get started?"
        subtext="14-day free trial. No credit card required."
      />
    </>
  );
}

function ContactCard({
  icon,
  title,
  content,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  content: string;
  href?: string;
}) {
  return (
    <div
      style={{
        background: "#111114",
        border: "1px solid #27272e",
        borderRadius: 12,
        padding: "24px 24px",
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: "rgba(249,115,22,0.1)",
          border: "1px solid rgba(249,115,22,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#71717a",
            textTransform: "uppercase",
            letterSpacing: 1,
            margin: "0 0 4px",
          }}
        >
          {title}
        </p>
        {href ? (
          <a
            href={href}
            style={{
              fontSize: 15,
              color: "#fafafa",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            {content}
          </a>
        ) : (
          <p
            style={{
              fontSize: 15,
              color: "#fafafa",
              margin: 0,
              fontWeight: 500,
            }}
          >
            {content}
          </p>
        )}
      </div>
    </div>
  );
}

function SocialLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: "#1f1f25",
        border: "1px solid #27272e",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#a1a1aa",
        textDecoration: "none",
        transition: "all 0.2s",
      }}
    >
      {icon}
    </a>
  );
}
