export interface FallbackCoupon {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrder: number;
}

export const FALLBACK_COUPONS: Record<string, FallbackCoupon> = {
  WELCOME10: { code: "WELCOME10", type: "PERCENTAGE", value: 10, minOrder: 500 },
  FLAT100: { code: "FLAT100", type: "FIXED", value: 100, minOrder: 1000 },
  AURA20: { code: "AURA20", type: "PERCENTAGE", value: 20, minOrder: 1500 },
};
