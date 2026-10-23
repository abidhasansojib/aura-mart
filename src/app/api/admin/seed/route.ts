import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAuth, hashPassword } from "@/lib/auth";
import { generateSlug } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SAMPLE_PRODUCTS = [
  {
    name: "Minimalist Slim Leather Wallet",
    description: "Crafted from full-grain genuine leather with RFID-blocking technology. Holds up to 8 cards with an ultra-slim profile.",
    category: "Accessories",
    price: 650,
    compareAtPrice: 850,
    stock: 15,
    imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80",
    isFeatured: true,
    isActive: true,
  },
  {
    name: "Matte Black Ceramic Coffee Mug (350ml)",
    description: "Handcrafted stoneware mug with a velvety matte black glaze and comfortable ergonomic grip. Microwave and dishwasher safe.",
    category: "Lifestyle",
    price: 420,
    compareAtPrice: 550,
    stock: 24,
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80",
    isFeatured: true,
    isActive: true,
  },
  {
    name: "Wireless Active Noise-Cancelling Earbuds",
    description: "Bluetooth 5.3 earbuds featuring immersive deep bass, 32-hour total battery life with case, and IPX5 water resistance.",
    category: "Electronics",
    price: 1850,
    compareAtPrice: 2400,
    stock: 8,
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80",
    isFeatured: true,
    isActive: true,
  },
  {
    name: "Heavyweight 240 GSM Pure Cotton T-Shirt",
    description: "Relaxed boxy fit made with 100% pre-shrunk combed cotton. Ultra-durable ribbed collar that maintains its shape wash after wash.",
    category: "Apparel",
    price: 750,
    compareAtPrice: 950,
    stock: 30,
    imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
    isFeatured: false,
    isActive: true,
  },
  {
    name: "Foldable Ergonomic Aluminium Laptop Stand",
    description: "Aviation-grade aluminium riser designed to optimize posture and airflow. Fits all laptops from 10 to 17 inches.",
    category: "Workstation",
    price: 1200,
    compareAtPrice: 1600,
    stock: 4,
    imageUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80",
    isFeatured: true,
    isActive: true,
  },
  {
    name: "Aromatherapy Organic Soy Wax Candle",
    description: "Clean-burning soy candle infused with calming lavender and cedarwood essential oils. 45 hours of warm ambient burn time.",
    category: "Home & Living",
    price: 480,
    compareAtPrice: 600,
    stock: 18,
    imageUrl: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&auto=format&fit=crop&q=80",
    isFeatured: false,
    isActive: true,
  },
];

export async function POST() {
  if (!verifyAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Ensure Admin User exists in DB
    const adminExists = await prisma.adminUser.findFirst({
      where: { username: "admin" },
    });
    if (!adminExists) {
      await prisma.adminUser.create({
        data: {
          username: "admin",
          email: "admin@auramart.com",
          password: hashPassword("admin123"),
          name: "Super Admin",
          role: "superadmin",
        },
      });
    }

    // 2. Ensure StoreSettings exists
    const settingsExists = await prisma.storeSettings.findUnique({
      where: { id: "default" },
    });
    if (!settingsExists) {
      await prisma.storeSettings.create({
        data: { id: "default" },
      });
    }

    // 3. Seed Products if none exist
    const existingCount = await prisma.product.count();
    if (existingCount > 0) {
      return NextResponse.json(
        {
          message: `Database already has ${existingCount} products. Seed skipped to preserve existing data.`,
          count: existingCount,
        },
        { status: 200 }
      );
    }

    const created = [];
    for (const item of SAMPLE_PRODUCTS) {
      const product = await prisma.product.create({
        data: {
          ...item,
          slug: generateSlug(item.name),
        },
      });
      created.push(product);
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully initialized database: created superadmin user and seeded ${created.length} products.`,
        products: created,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed demo products" },
      { status: 500 }
    );
  }
}
