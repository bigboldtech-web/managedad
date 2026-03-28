import Razorpay from "razorpay";

let _razorpay: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!_razorpay) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are not configured");
    }
    _razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return _razorpay;
}

// Plan definitions — prices in paise (INR × 100)
export const RAZORPAY_PLANS = {
  STARTER: {
    name: "Starter",
    monthlyAmount: 299900,   // ₹2,999
    annualAmount: 2878800,   // ₹28,788 (₹2,399/mo × 12)
    monthlyPlanId: process.env.RAZORPAY_STARTER_MONTHLY_PLAN_ID || "",
    annualPlanId: process.env.RAZORPAY_STARTER_ANNUAL_PLAN_ID || "",
  },
  GROWTH: {
    name: "Growth",
    monthlyAmount: 799900,   // ₹7,999
    annualAmount: 7679040,   // ₹7,679 × 12 (~₹7,679/mo billed annually)
    monthlyPlanId: process.env.RAZORPAY_GROWTH_MONTHLY_PLAN_ID || "",
    annualPlanId: process.env.RAZORPAY_GROWTH_ANNUAL_PLAN_ID || "",
  },
  AGENCY: {
    name: "Agency",
    monthlyAmount: 1999900,  // ₹19,999
    annualAmount: 19199040,  // ₹19,199 × 12
    monthlyPlanId: process.env.RAZORPAY_AGENCY_MONTHLY_PLAN_ID || "",
    annualPlanId: process.env.RAZORPAY_AGENCY_ANNUAL_PLAN_ID || "",
  },
} as const;

export type PlanKey = keyof typeof RAZORPAY_PLANS;
