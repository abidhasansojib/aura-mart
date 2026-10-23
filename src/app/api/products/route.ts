import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyAdminAuth } from "@/lib/auth";
import { generateSlug } from "@/lib/utils";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const showAll = searchParams.get("all") === "true";
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: Prisma.ProductWhereInput = {};

    if (!showAll) {
      where.isActive = true;
    }

    if (category && category !== "All" && category.trim() !== "") {
      where.category = { equals: category.trim(), mode: "insensitive" };
    }

    if (search && search.trim() !== "") {
      const query = search.trim();
      const tokens = query.split(/\s+/).filter((t) => t.length > 0);
      where.OR = [
        { name: { contains: query, mode: "insensitive" as const } },
        { description: { contains: query, mode: "insensitive" as const } },
        { category: { contains: query, mode: "insensitive" as const } },
        ...tokens.flatMap((t) => [
          { name: { contains: t, mode: "insensitive" as const } },
          { category: { contains: t, mode: "insensitive" as const } },
          { description: { contains: t, mode: "insensitive" as const } },
        ]),
      ];
    }

    const [products, salesAgg] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: {
          quantity: true,
        },
        where: {
          productId: { not: null },
          order: {
            status: { not: "Cancelled" },
          },
        },
      }).catch(() => []),
    ]);

    const salesMap = new Map<string, number>();
    for (const item of salesAgg) {
      if (item.productId && item._sum?.quantity) {
        salesMap.set(item.productId, item._sum.quantity);
      }
    }

    const STARTER_SALES_BY_SLUG: Record<string, number> = {
      "minimalist-slim-leather-wallet": 48,
      "wireless-anc-earbuds": 35,
      "foldable-ergonomic-laptop-stand": 22,
      "matte-black-ceramic-coffee-mug": 16,
      "heavyweight-pure-cotton-tshirt": 9,
      "aromatherapy-soy-wax-candle": 5,
    };

    const enrichedProducts = products.map((p) => {
      const realSales = salesMap.get(p.id) || 0;
      const starterSales = STARTER_SALES_BY_SLUG[p.slug] || 0;
      const salesCount = realSales > 0 ? realSales + starterSales : starterSales;
      const isViral = salesCount >= 10 || (p.isFeatured && salesCount > 0);

      return {
        ...p,
        salesCount,
        isViral,
      };
    });

    return NextResponse.json(enrichedProducts);
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!verifyAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      name,
      description,
      category,
      price,
      compareAtPrice,
      stock,
      imageUrl,
      isFeatured,
      isActive,
    } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
      return NextResponse.json({ error: "Valid price is required" }, { status: 400 });
    }

    const slug = generateSlug(name);

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        slug,
        description: description ? String(description).trim() : "",
        category: category ? String(category).trim() : "General",
        price: Number(price),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
        stock: stock !== undefined ? Math.max(0, parseInt(String(stock), 10) || 0) : 0,
        imageUrl: imageUrl ? String(imageUrl).trim() : "/placeholder-product.png",
        isFeatured: Boolean(isFeatured),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    try {
      revalidatePath("/");
    } catch {
      // safe fallback
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
