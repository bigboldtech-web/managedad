import Link from "next/link";

interface CTAProps {
  headline?: string;
  subtext?: string;
}

export function CTASection({
  headline = "Start optimizing your ads today",
  subtext = "14-day free trial. No credit card required.",
}: CTAProps) {
  return (
    <section className="mkt-cta">
      <h2 className="mkt-cta__headline">{headline}</h2>
      <p className="mkt-cta__subtext">{subtext}</p>
      <div className="mkt-cta__actions">
        <Link href="/register" className="mkt-cta__btn mkt-cta__btn--primary">
          Get started &rarr;
        </Link>
        <Link href="/contact" className="mkt-cta__btn mkt-cta__btn--ghost">
          Book a demo
        </Link>
      </div>

      <style>{`
        .mkt-cta {
          text-align: center;
          padding: 96px 24px;
          position: relative;
          overflow: hidden;
          background: #09090b;
        }
        .mkt-cta::before {
          content: "";
          position: absolute;
          top: -50%;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(249, 115, 22, 0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .mkt-cta__headline {
          font-size: clamp(28px, 5vw, 40px);
          font-weight: 700;
          letter-spacing: -0.5px;
          color: #fafafa;
          margin: 0 0 16px;
          line-height: 1.2;
        }
        .mkt-cta__subtext {
          color: #a1a1aa;
          font-size: 17px;
          margin: 0 0 32px;
        }
        .mkt-cta__actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .mkt-cta__btn {
          display: inline-flex;
          align-items: center;
          height: 48px;
          padding: 0 28px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .mkt-cta__btn--primary {
          background: #f97316;
          color: #fff;
          border: none;
        }
        .mkt-cta__btn--primary:hover {
          background: #fb923c;
          transform: translateY(-1px);
        }
        .mkt-cta__btn--ghost {
          background: transparent;
          color: #a1a1aa;
          border: 1px solid #27272e;
        }
        .mkt-cta__btn--ghost:hover {
          border-color: #35353e;
          color: #fafafa;
        }
      `}</style>
    </section>
  );
}
