import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyAdminAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DEFAULT_STORE_SETTINGS = {
  id: "default",
  storeName: "Official Store",
  logoUrl: "",
  tagline: "Quality Products Delivered to Your Doorstep",
  announcementText: "🚚 Cash on Delivery Available Nationwide! Fast Express Shipping.",
  supportPhone: "01700000000",
  bkashNumber: "01700000000 (Personal/Send Money)",
  nagadNumber: "01700000000 (Personal/Send Money)",
  insideCityDelivery: 60,
  outsideCityDelivery: 120,
  currencySymbol: "৳",
  shopCity: "Bogura",
  shopAddress: "Bogura, Rajshahi, Bangladesh",
  heroBadgeText: "Featured Collection 2026",
  heroTitle: "Curated Essentials",
  heroTagline: "Quality Products Delivered to Your Doorstep. Zero advance payment required.",
  heroCtaText: "Shop Catalog",
  heroBadgeSecondary: "Cash on Delivery Available",
  expressCardTitle: "Fast Doorstep Delivery",
  expressCardSubtitle: "All 64 Districts Dispatched in 24-48 Hours",
  guaranteeCardTitle: "100% Quality Assured",
  guaranteeCardSubtitle: "Every item is hand-inspected for flawless quality and packaged securely before dispatch.",
  whatsappNumber: "01700000000",
  facebookUrl: "",
  instagramUrl: "",
  enableCod: true,
  enableBkash: true,
  enableNagad: true,
  enableRocket: false,
  rocketNumber: "",
  freeShippingThreshold: 0,
  lowStockThreshold: 5,
  isStoreOpen: true,
  storeClosedNotice: "We are currently restocking our inventory. Orders will resume shortly!",
};

export async function GET() {
  try {
    const settings = await prisma.storeSettings.upsert({
      where: { id: "default" },
      update: {},
      create: DEFAULT_STORE_SETTINGS,
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET /api/settings error:", error);
    // Return resilient fallback settings if database is not reachable
    return NextResponse.json(DEFAULT_STORE_SETTINGS);
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
      logoUrl,
      tagline,
      announcementText,
      supportPhone,
      bkashNumber,
      nagadNumber,
      insideCityDelivery,
      outsideCityDelivery,
      currencySymbol,
      shopCity,
      shopAddress,
      heroBadgeText,
      heroTitle,
      heroTagline,
      heroCtaText,
      heroBadgeSecondary,
      expressCardTitle,
      expressCardSubtitle,
      guaranteeCardTitle,
      guaranteeCardSubtitle,
      whatsappNumber,
      facebookUrl,
      instagramUrl,
      enableCod,
      enableBkash,
      enableNagad,
      enableRocket,
      rocketNumber,
      freeShippingThreshold,
      lowStockThreshold,
      isStoreOpen,
      storeClosedNotice,
    } = body;

    const updated = await prisma.storeSettings.upsert({
      where: { id: "default" },
      update: {
        ...(storeName !== undefined && { storeName: String(storeName).trim() }),
        ...(logoUrl !== undefined && { logoUrl: String(logoUrl).trim() }),
        ...(tagline !== undefined && { tagline: String(tagline) }),
        ...(announcementText !== undefined && { announcementText: String(announcementText) }),
        ...(supportPhone !== undefined && { supportPhone: String(supportPhone) }),
        ...(bkashNumber !== undefined && { bkashNumber: String(bkashNumber) }),
        ...(nagadNumber !== undefined && { nagadNumber: String(nagadNumber) }),
        ...(insideCityDelivery !== undefined && { insideCityDelivery: Number(insideCityDelivery) }),
        ...(outsideCityDelivery !== undefined && { outsideCityDelivery: Number(outsideCityDelivery) }),
        ...(currencySymbol !== undefined && { currencySymbol: String(currencySymbol) }),
        ...(shopCity !== undefined && { shopCity: String(shopCity).trim() }),
        ...(shopAddress !== undefined && { shopAddress: String(shopAddress).trim() }),
        ...(heroBadgeText !== undefined && { heroBadgeText: String(heroBadgeText) }),
        ...(heroTitle !== undefined && {
          heroTitle:
            String(heroTitle).trim() === "Aura Mart" && storeName
              ? String(storeName).trim()
              : String(heroTitle).trim(),
        }),
        ...(heroTagline !== undefined && { heroTagline: String(heroTagline) }),
        ...(heroCtaText !== undefined && { heroCtaText: String(heroCtaText) }),
        ...(heroBadgeSecondary !== undefined && { heroBadgeSecondary: String(heroBadgeSecondary) }),
        ...(expressCardTitle !== undefined && { expressCardTitle: String(expressCardTitle) }),
        ...(expressCardSubtitle !== undefined && { expressCardSubtitle: String(expressCardSubtitle) }),
        ...(guaranteeCardTitle !== undefined && { guaranteeCardTitle: String(guaranteeCardTitle) }),
        ...(guaranteeCardSubtitle !== undefined && { guaranteeCardSubtitle: String(guaranteeCardSubtitle) }),
        ...(whatsappNumber !== undefined && { whatsappNumber: String(whatsappNumber) }),
        ...(facebookUrl !== undefined && { facebookUrl: String(facebookUrl) }),
        ...(instagramUrl !== undefined && { instagramUrl: String(instagramUrl) }),
        ...(enableCod !== undefined && { enableCod: Boolean(enableCod) }),
        ...(enableBkash !== undefined && { enableBkash: Boolean(enableBkash) }),
        ...(enableNagad !== undefined && { enableNagad: Boolean(enableNagad) }),
        ...(enableRocket !== undefined && { enableRocket: Boolean(enableRocket) }),
        ...(rocketNumber !== undefined && { rocketNumber: String(rocketNumber) }),
        ...(freeShippingThreshold !== undefined && { freeShippingThreshold: Number(freeShippingThreshold) }),
        ...(lowStockThreshold !== undefined && { lowStockThreshold: Number(lowStockThreshold) }),
        ...(isStoreOpen !== undefined && { isStoreOpen: Boolean(isStoreOpen) }),
        ...(storeClosedNotice !== undefined && { storeClosedNotice: String(storeClosedNotice) }),
      },
      create: {
        id: "default",
        storeName: storeName ? String(storeName).trim() : DEFAULT_STORE_SETTINGS.storeName,
        logoUrl: logoUrl ? String(logoUrl).trim() : "",
        tagline: tagline ?? DEFAULT_STORE_SETTINGS.tagline,
        announcementText: announcementText ?? DEFAULT_STORE_SETTINGS.announcementText,
        supportPhone: supportPhone ?? DEFAULT_STORE_SETTINGS.supportPhone,
        bkashNumber: bkashNumber ?? DEFAULT_STORE_SETTINGS.bkashNumber,
        nagadNumber: nagadNumber ?? DEFAULT_STORE_SETTINGS.nagadNumber,
        insideCityDelivery: insideCityDelivery ? Number(insideCityDelivery) : DEFAULT_STORE_SETTINGS.insideCityDelivery,
        outsideCityDelivery: outsideCityDelivery ? Number(outsideCityDelivery) : DEFAULT_STORE_SETTINGS.outsideCityDelivery,
        currencySymbol: currencySymbol ?? DEFAULT_STORE_SETTINGS.currencySymbol,
        shopCity: shopCity ? String(shopCity).trim() : DEFAULT_STORE_SETTINGS.shopCity,
        shopAddress: shopAddress ? String(shopAddress).trim() : DEFAULT_STORE_SETTINGS.shopAddress,
        heroBadgeText: heroBadgeText ?? DEFAULT_STORE_SETTINGS.heroBadgeText,
        heroTitle: heroTitle ?? DEFAULT_STORE_SETTINGS.heroTitle,
        heroTagline: heroTagline ?? DEFAULT_STORE_SETTINGS.heroTagline,
        heroCtaText: heroCtaText ?? DEFAULT_STORE_SETTINGS.heroCtaText,
        heroBadgeSecondary: heroBadgeSecondary ?? DEFAULT_STORE_SETTINGS.heroBadgeSecondary,
        expressCardTitle: expressCardTitle ?? DEFAULT_STORE_SETTINGS.expressCardTitle,
        expressCardSubtitle: expressCardSubtitle ?? DEFAULT_STORE_SETTINGS.expressCardSubtitle,
        guaranteeCardTitle: guaranteeCardTitle ?? DEFAULT_STORE_SETTINGS.guaranteeCardTitle,
        guaranteeCardSubtitle: guaranteeCardSubtitle ?? DEFAULT_STORE_SETTINGS.guaranteeCardSubtitle,
        whatsappNumber: whatsappNumber ?? DEFAULT_STORE_SETTINGS.whatsappNumber,
        facebookUrl: facebookUrl ?? DEFAULT_STORE_SETTINGS.facebookUrl,
        instagramUrl: instagramUrl ?? DEFAULT_STORE_SETTINGS.instagramUrl,
        enableCod: enableCod !== undefined ? Boolean(enableCod) : DEFAULT_STORE_SETTINGS.enableCod,
        enableBkash: enableBkash !== undefined ? Boolean(enableBkash) : DEFAULT_STORE_SETTINGS.enableBkash,
        enableNagad: enableNagad !== undefined ? Boolean(enableNagad) : DEFAULT_STORE_SETTINGS.enableNagad,
        enableRocket: enableRocket !== undefined ? Boolean(enableRocket) : DEFAULT_STORE_SETTINGS.enableRocket,
        rocketNumber: rocketNumber ?? DEFAULT_STORE_SETTINGS.rocketNumber,
        freeShippingThreshold: freeShippingThreshold ? Number(freeShippingThreshold) : DEFAULT_STORE_SETTINGS.freeShippingThreshold,
        lowStockThreshold: lowStockThreshold ? Number(lowStockThreshold) : DEFAULT_STORE_SETTINGS.lowStockThreshold,
        isStoreOpen: isStoreOpen !== undefined ? Boolean(isStoreOpen) : DEFAULT_STORE_SETTINGS.isStoreOpen,
        storeClosedNotice: storeClosedNotice ?? DEFAULT_STORE_SETTINGS.storeClosedNotice,
      },
    });

    try {
      revalidatePath("/");
      revalidatePath("/checkout");
      revalidatePath("/admin");
    } catch {
      // safe fallback if called outside request context
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to update store settings" },
      { status: 500 }
    );
  }
}
