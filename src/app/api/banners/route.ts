import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAuth } from "@/lib/auth";
import { BANNER_TEMPLATES } from "@/lib/banner-templates";

export const dynamic = "force-dynamic";

// GET /api/banners - List banners
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const showAll = searchParams.get("all") === "true";
    const isAdmin = verifyAdminAuth();

    const where = showAll && isAdmin ? {} : { isActive: true };

    let banners = await prisma.banner.findMany({
      where,
      orderBy: { order: "asc" },
    });

    // Auto-seed initial default banners if table is completely empty
    if (banners.length === 0) {
      const defaultTemplate = BANNER_TEMPLATES[0];
      try {
        const initialBanner = await prisma.banner.create({
          data: {
            title: defaultTemplate.title,
            subtitle: defaultTemplate.subtitle,
            badgeText: defaultTemplate.badgeText,
            badgeSecondary: defaultTemplate.badgeSecondary,
            imageUrl: "",
            ctaText: defaultTemplate.ctaText,
            ctaLink: defaultTemplate.ctaLink,
            bgGradient: defaultTemplate.bgGradient,
            textColor: "#FFFFFF",
            order: 0,
            isActive: true,
          },
        });
        banners = [initialBanner];
      } catch (seedErr) {
        console.warn("Could not auto-seed banner table:", seedErr);
      }
    }

    return NextResponse.json(banners, {
      headers: showAll
        ? { "Cache-Control": "no-store" }
        : { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("GET /api/banners error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

// POST /api/banners - Create new banner (Admin protected)
export async function POST(req: NextRequest) {
  if (!verifyAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      title,
      subtitle,
      badgeText,
      badgeSecondary,
      imageUrl,
      ctaText,
      ctaLink,
      bgGradient,
      textColor,
      order,
      isActive,
    } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Banner title is required" }, { status: 400 });
    }

    // Determine default order (highest order + 1)
    const currentMax = await prisma.banner.aggregate({
      _max: { order: true },
    });
    const nextOrder = order !== undefined ? Number(order) : (currentMax._max.order ?? -1) + 1;

    const banner = await prisma.banner.create({
      data: {
        title: title.trim(),
        subtitle: subtitle ? String(subtitle).trim() : null,
        badgeText: badgeText ? String(badgeText).trim() : "Featured Collection 2026",
        badgeSecondary: badgeSecondary ? String(badgeSecondary).trim() : "Cash on Delivery Available",
        imageUrl: imageUrl ? String(imageUrl).trim() : "",
        ctaText: ctaText ? String(ctaText).trim() : "Shop Catalog",
        ctaLink: ctaLink ? String(ctaLink).trim() : "#catalog",
        bgGradient: bgGradient ? String(bgGradient).trim() : "from-[#FF6448] via-[#FF755B] to-[#FF8A73]",
        textColor: textColor ? String(textColor).trim() : "#FFFFFF",
        order: nextOrder,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    console.error("POST /api/banners error:", error);
    return NextResponse.json(
      { error: "Failed to create banner" },
      { status: 500 }
    );
  }
}
