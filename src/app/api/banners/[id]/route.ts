import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

// PATCH /api/banners/[id] - Update banner
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  if (!verifyAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;
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

    const banner = await prisma.banner.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: String(title).trim() }),
        ...(subtitle !== undefined && { subtitle: subtitle ? String(subtitle).trim() : null }),
        ...(badgeText !== undefined && { badgeText: badgeText ? String(badgeText).trim() : null }),
        ...(badgeSecondary !== undefined && {
          badgeSecondary: badgeSecondary ? String(badgeSecondary).trim() : null,
        }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl ? String(imageUrl).trim() : "" }),
        ...(ctaText !== undefined && { ctaText: ctaText ? String(ctaText).trim() : "Shop Catalog" }),
        ...(ctaLink !== undefined && { ctaLink: ctaLink ? String(ctaLink).trim() : "#catalog" }),
        ...(bgGradient !== undefined && { bgGradient: String(bgGradient).trim() }),
        ...(textColor !== undefined && { textColor: String(textColor).trim() }),
        ...(order !== undefined && { order: Number(order) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    return NextResponse.json(banner);
  } catch (error) {
    console.error(`PATCH /api/banners/${params.id} error:`, error);
    return NextResponse.json(
      { error: "Failed to update banner" },
      { status: 500 }
    );
  }
}

// DELETE /api/banners/[id] - Delete banner
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  if (!verifyAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;
    await prisma.banner.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Banner deleted successfully" });
  } catch (error) {
    console.error(`DELETE /api/banners/${params.id} error:`, error);
    return NextResponse.json(
      { error: "Failed to delete banner" },
      { status: 500 }
    );
  }
}
