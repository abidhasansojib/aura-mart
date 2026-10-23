import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await prisma.storeSettings.upsert({
      where: { id: "default" },
      update: {},
      create: {
        id: "default",
        storeName: "Aura Mart",
        tagline: "Quality Products Delivered to Your Doorstep",
        announcementText: "🚚 Cash on Delivery Available Nationwide! Fast Express Shipping.",
        supportPhone: "01700000000",
        bkashNumber: "01700000000 (Personal/Send Money)",
        nagadNumber: "01700000000 (Personal/Send Money)",
        insideCityDelivery: 60,
        outsideCityDelivery: 120,
        currencySymbol: "৳",
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to load store settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  if (!verifyAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      storeName,
      tagline,
      announcementText,
      supportPhone,
      bkashNumber,
      nagadNumber,
      insideCityDelivery,
      outsideCityDelivery,
      currencySymbol,
    } = body;

    const updated = await prisma.storeSettings.upsert({
      where: { id: "default" },
      update: {
        ...(storeName !== undefined && { storeName: String(storeName) }),
        ...(tagline !== undefined && { tagline: String(tagline) }),
        ...(announcementText !== undefined && { announcementText: String(announcementText) }),
        ...(supportPhone !== undefined && { supportPhone: String(supportPhone) }),
        ...(bkashNumber !== undefined && { bkashNumber: String(bkashNumber) }),
        ...(nagadNumber !== undefined && { nagadNumber: String(nagadNumber) }),
        ...(insideCityDelivery !== undefined && { insideCityDelivery: Number(insideCityDelivery) }),
        ...(outsideCityDelivery !== undefined && { outsideCityDelivery: Number(outsideCityDelivery) }),
        ...(currencySymbol !== undefined && { currencySymbol: String(currencySymbol) }),
      },
      create: {
        id: "default",
        storeName: storeName ?? "Aura Mart",
        tagline: tagline ?? "Quality Products Delivered to Your Doorstep",
        announcementText: announcementText ?? "🚚 Cash on Delivery Available Nationwide! Fast Express Shipping.",
        supportPhone: supportPhone ?? "01700000000",
        bkashNumber: bkashNumber ?? "01700000000 (Personal/Send Money)",
        nagadNumber: nagadNumber ?? "01700000000 (Personal/Send Money)",
        insideCityDelivery: insideCityDelivery ? Number(insideCityDelivery) : 60,
        outsideCityDelivery: outsideCityDelivery ? Number(outsideCityDelivery) : 120,
        currencySymbol: currencySymbol ?? "৳",
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to update store settings" },
      { status: 500 }
    );
  }
}
