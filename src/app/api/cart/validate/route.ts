import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface CartValidateItem {
  productId: string;
  quantity: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { items } = body as { items?: CartValidateItem[] };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ isValid: true, items: [], hasChanges: false });
    }

    const productIds = items.map((i) => i.productId).filter(Boolean);
    const dbProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
    });

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));
    let hasChanges = false;
    let isValid = true;

    const validatedItems = items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product || !product.isActive) {
        hasChanges = true;
        isValid = false;
        return {
          productId: item.productId,
          name: product?.name || "Unavailable Product",
          requestedQuantity: item.quantity,
          availableStock: 0,
          currentPrice: product?.price || 0,
          isAvailable: false,
          adjustedQuantity: 0,
          reason: "This product is no longer available.",
        };
      }

      if (product.stock < item.quantity) {
        hasChanges = true;
        if (product.stock <= 0) {
          isValid = false;
        }
        return {
          productId: item.productId,
          name: product.name,
          requestedQuantity: item.quantity,
          availableStock: product.stock,
          currentPrice: product.price,
          isAvailable: product.stock > 0,
          adjustedQuantity: Math.max(0, product.stock),
          reason:
            product.stock > 0
              ? `Only ${product.stock} left in stock.`
              : "Sold out just now.",
        };
      }

      return {
        productId: item.productId,
        name: product.name,
        requestedQuantity: item.quantity,
        availableStock: product.stock,
        currentPrice: product.price,
        isAvailable: true,
        adjustedQuantity: item.quantity,
        reason: null,
      };
    });

    return NextResponse.json({
      isValid,
      hasChanges,
      items: validatedItems,
    });
  } catch (error) {
    console.error("POST /api/cart/validate error:", error);
    return NextResponse.json(
      { error: "Failed to validate cart inventory" },
      { status: 500 }
    );
  }
}
