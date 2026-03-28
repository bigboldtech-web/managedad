"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export function ContactForm() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormState((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    const subject = encodeURIComponent(
      `Contact from ${formState.name} — ${formState.company}`
    );
    const body = encodeURIComponent(
      `Name: ${formState.name}\nEmail: ${formState.email}\nCompany: ${formState.company}\n\n${formState.message}`
    );
    window.location.href = `mailto:hello@managedad.com?subject=${subject}&body=${body}`;

    setSending(false);
    setSubmitted(true);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 44,
    padding: "0 14px",
    background: "#111114",
    border: "1px solid #27272e",
    borderRadius: 10,
    color: "#fafafa",
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  };

  if (submitted) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "rgba(52,211,153,0.1)",
            border: "1px solid rgba(52,211,153,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <Send size={24} color="#34d399" />
        </div>
        <h3
          style={{
            fontFamily: '"Sora", sans-serif',
            fontSize: 20,
            fontWeight: 700,
            color: "#fafafa",
            margin: "0 0 8px",
          }}
        >
          Message opened in your email client
        </h3>
        <p style={{ fontSize: 14, color: "#a1a1aa", margin: 0 }}>
          Please send the email to complete your inquiry. We typically respond
          within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <h2
          style={{
            fontFamily: '"Sora", sans-serif',
            fontSize: 20,
            fontWeight: 700,
            color: "#fafafa",
            margin: "0 0 24px",
            letterSpacing: -0.3,
          }}
        >
          Send us a message
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: "#a1a1aa",
                marginBottom: 6,
              }}
            >
              Name *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formState.name}
              onChange={handleChange}
              placeholder="Your full name"
              style={inputStyle}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: "#a1a1aa",
                marginBottom: 6,
              }}
            >
              Email *
            </label>
            <input
              type="email"
              name="email"
              required
              value={formState.email}
              onChange={handleChange}
              placeholder="you@company.com"
              style={inputStyle}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: "#a1a1aa",
                marginBottom: 6,
              }}
            >
              Company
            </label>
            <input
              type="text"
              name="company"
              value={formState.company}
              onChange={handleChange}
              placeholder="Your company name"
              style={inputStyle}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: "#a1a1aa",
                marginBottom: 6,
              }}
            >
              Message *
            </label>
            <textarea
              name="message"
              required
              value={formState.message}
              onChange={handleChange}
              placeholder="Tell us how we can help..."
              rows={5}
              style={{
                ...inputStyle,
                height: "auto",
                padding: "12px 14px",
                resize: "vertical",
                lineHeight: 1.6,
              }}
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              height: 48,
              background: "#f97316",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: sending ? "not-allowed" : "pointer",
              opacity: sending ? 0.7 : 1,
              transition: "all 0.2s",
            }}
          >
            <Send size={16} />
            {sending ? "Sending..." : "Send message"}
          </button>
        </div>
      </form>

      <style>{`
        input:focus, textarea:focus {
          border-color: #f97316 !important;
        }
        input::placeholder, textarea::placeholder {
          color: #52525b;
        }
      `}</style>
    </>
  );
}
