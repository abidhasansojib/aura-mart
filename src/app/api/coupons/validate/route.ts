import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FALLBACK_COUPONS } from "@/lib/coupons";

export const dynamic = "force-dynamic";

// POST /api/coupons/validate - Validate coupon for checkout
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, subtotal } = body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json({ error: "Please enter a promo code" }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    const currentSubtotal = Number(subtotal) || 0;

    let couponData = null;

    try {
      const dbCoupon = await prisma.coupon.findUnique({
        where: { code: cleanCode },
      });

      if (dbCoupon) {
        if (!dbCoupon.isActive) {
          return NextResponse.json({ error: "This promo code is no longer active" }, { status: 400 });
        }

        if (dbCoupon.expiresAt && new Date(dbCoupon.expiresAt) < new Date()) {
          return NextResponse.json({ error: "This promo code has expired" }, { status: 400 });
        }

        if (dbCoupon.maxUses && dbCoupon.usedCount >= dbCoupon.maxUses) {
          return NextResponse.json({ error: "This promo code has reached its usage limit" }, { status: 400 });
        }

        if (currentSubtotal < dbCoupon.minOrderValue) {
          return NextResponse.json(
            { error: `Minimum order value for this coupon is ৳${dbCoupon.minOrderValue}` },
            { status: 400 }
          );
        }

        couponData = {
          code: dbCoupon.code,
          discountType: dbCoupon.discountType,
          discountValue: dbCoupon.discountValue,
          minOrderValue: dbCoupon.minOrderValue,
        };
      }
    } catch (dbErr) {
      console.warn("Coupon database lookup failed, checking fallback coupons:", dbErr);
    }

    // Check fallback coupons if not found in db or db unreachable
    if (!couponData) {
      const fallback = FALLBACK_COUPONS[cleanCode];
      if (fallback) {
        if (currentSubtotal < fallback.minOrder) {
          return NextResponse.json(
            { error: `Minimum order value for this coupon is ৳${fallback.minOrder}` },
            { status: 400 }
          );
        }
        couponData = {
          code: cleanCode,
          discountType: fallback.type,
          discountValue: fallback.value,
          minOrderValue: fallback.minOrder,
        };
      }
    }

    if (!couponData) {
      return NextResponse.json({ error: "Invalid promo code" }, { status: 400 });
    }

    // Calculate discount
    let discountAmount = 0;
    if (couponData.discountType === "PERCENTAGE") {
      discountAmount = Math.round((currentSubtotal * couponData.discountValue) / 100);
    } else {
      discountAmount = Math.min(couponData.discountValue, currentSubtotal);
    }

    return NextResponse.json({
      valid: true,
      code: couponData.code,
      discountType: couponData.discountType,
      discountValue: couponData.discountValue,
      discountAmount,
      minOrderValue: couponData.minOrderValue,
      message: `Coupon "${couponData.code}" applied! You saved ৳${discountAmount}`,
    });
  } catch (error) {
    console.error("POST /api/coupons/validate error:", error);
    return NextResponse.json({ error: "Failed to validate coupon" }, { status: 500 });
  }
}
