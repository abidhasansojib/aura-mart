import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/coupons - List all coupons (Admin protected)
export async function GET() {
  if (!verifyAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });

    if (coupons.length === 0) {
      // Auto-initialize standard starter coupons so admin can manage them immediately
      await prisma.coupon.createMany({
        data: [
          {
            code: "WELCOME10",
            discountType: "PERCENTAGE",
            discountValue: 10,
            minOrderValue: 500,
            isActive: true,
          },
          {
            code: "FLAT100",
            discountType: "FIXED",
            discountValue: 100,
            minOrderValue: 1000,
            isActive: true,
          },
          {
            code: "AURA20",
            discountType: "PERCENTAGE",
            discountValue: 20,
            minOrderValue: 1500,
            isActive: true,
          },
        ],
        skipDuplicates: true,
      });

      coupons = await prisma.coupon.findMany({
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json(coupons);
  } catch (error) {
    console.error("GET /api/coupons error:", error);
    // Return empty array if db not ready
    return NextResponse.json([]);
  }
}

// POST /api/coupons - Create a new coupon (Admin protected)
export async function POST(req: NextRequest) {
  if (!verifyAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { code, discountType, discountValue, minOrderValue, maxUses, expiresAt } = body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    }

    if (!discountValue || Number(discountValue) <= 0) {
      return NextResponse.json({ error: "Valid discount value is required" }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    const existing = await prisma.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (existing) {
      return NextResponse.json({ error: "A coupon with this code already exists" }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: cleanCode,
        discountType: discountType === "FIXED" ? "FIXED" : "PERCENTAGE",
        discountValue: Number(discountValue),
        minOrderValue: minOrderValue ? Number(minOrderValue) : 0,
        maxUses: maxUses ? Number(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
      },
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    console.error("POST /api/coupons error:", error);
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}

// DELETE /api/coupons?id=... - Delete a coupon (Admin protected)
export async function DELETE(req: NextRequest) {
  if (!verifyAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Coupon ID is required" }, { status: 400 });
    }

    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/coupons error:", error);
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}
