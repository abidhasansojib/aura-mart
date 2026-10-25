import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { StorefrontClient } from "@/components/StorefrontClient";
import { ModalProduct } from "@/components/ProductDetailModal";
import { BannerItem } from "@/lib/banner-templates";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Fallback demo products if database is not yet connected during local review
const FALLBACK_PRODUCTS: ModalProduct[] = [
  {
    id: "sample-1",
    name: "Minimalist Slim Leather Wallet",
    slug: "minimalist-slim-leather-wallet",
    description: "Crafted from full-grain genuine leather with RFID-blocking technology. Holds up to 8 cards with an ultra-slim profile.",
    category: "Accessories",
    price: 650,
    compareAtPrice: 850,
    stock: 15,
    imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80",
    isFeatured: true,
    salesCount: 48,
    isViral: true,
  },
  {
    id: "sample-3",
    name: "Wireless Active Noise-Cancelling Earbuds",
    slug: "wireless-anc-earbuds",
    description: "Bluetooth 5.3 earbuds featuring immersive deep bass, 32-hour total battery life with case, and IPX5 water resistance.",
    category: "Electronics",
    price: 1850,
    compareAtPrice: 2400,
    stock: 8,
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80",
    isFeatured: true,
    salesCount: 35,
    isViral: true,
  },
  {
    id: "sample-5",
    name: "Foldable Ergonomic Aluminium Laptop Stand",
    slug: "foldable-ergonomic-laptop-stand",
    description: "Aviation-grade aluminium riser designed to optimize posture and airflow. Fits all laptops from 10 to 17 inches.",
    category: "Workstation",
    price: 1200,
    compareAtPrice: 1600,
    stock: 4,
    imageUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80",
    isFeatured: true,
    salesCount: 22,
    isViral: true,
  },
  {
    id: "sample-2",
    name: "Matte Black Ceramic Coffee Mug (350ml)",
    slug: "matte-black-ceramic-coffee-mug",
    description: "Handcrafted stoneware mug with a velvety matte black glaze and comfortable ergonomic grip. Microwave and dishwasher safe.",
    category: "Lifestyle",
    price: 420,
    compareAtPrice: 550,
    stock: 24,
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80",
    isFeatured: true,
    salesCount: 16,
    isViral: true,
  },
  {
    id: "sample-4",
    name: "Heavyweight 240 GSM Pure Cotton T-Shirt",
    slug: "heavyweight-pure-cotton-tshirt",
    description: "Relaxed boxy fit made with 100% pre-shrunk combed cotton. Ultra-durable ribbed collar that maintains its shape wash after wash.",
    category: "Apparel",
    price: 750,
    compareAtPrice: 950,
    stock: 30,
    imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
    isFeatured: false,
    salesCount: 9,
    isViral: false,
  },
  {
    id: "sample-6",
    name: "Aromatherapy Organic Soy Wax Candle",
    slug: "aromatherapy-soy-wax-candle",
    description: "Clean-burning soy candle infused with calming lavender and cedarwood essential oils. 45 hours of warm ambient burn time.",
    category: "Home & Living",
    price: 480,
    compareAtPrice: 600,
    stock: 18,
    imageUrl: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&auto=format&fit=crop&q=80",
    isFeatured: false,
    salesCount: 5,
    isViral: false,
  },
];

const DEFAULT_SETTINGS = {
  storeName: "Official Store",
  logoUrl: "",
  tagline: "Quality Products Delivered to Your Doorstep",
  announcementText: "🚚 Cash on Delivery Available Nationwide! Fast Express Shipping.",
  supportPhone: "01700000000",
  currencySymbol: "৳",
  insideCityDelivery: 60,
  outsideCityDelivery: 120,
  shopCity: "Bogura",
  shopAddress: "Bogura, Rajshahi, Bangladesh",
};

export async function generateMetadata(): Promise<Metadata> {
  let storeName = DEFAULT_SETTINGS.storeName;
  let tagline = DEFAULT_SETTINGS.tagline;

  try {
    const settings = await prisma.storeSettings.findUnique({
      where: { id: "default" },
    });
    if (settings) {
      if (settings.storeName) storeName = settings.storeName;
      if (settings.tagline) tagline = settings.tagline;
    }
  } catch {
    // Graceful fallback during build or when database is provisioning
  }

  return {
    title: `${storeName} — Official Store`,
    description: tagline,
    openGraph: {
      title: `${storeName} — Official Store`,
      description: tagline,
      siteName: storeName,
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: `${storeName} — Official Store`,
      description: tagline,
    },
  };
}

export default async function HomePage() {
  let products: ModalProduct[] = FALLBACK_PRODUCTS;
  let settings = DEFAULT_SETTINGS;
  let banners: BannerItem[] = [];

  try {
    const [dbProducts, dbSettings, dbSales, dbReviews, dbBanners] = await Promise.allSettled([
      prisma.product.findMany({
        where: { isActive: true },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      }),
      prisma.storeSettings.findUnique({
        where: { id: "default" },
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
      }),
      prisma.review.groupBy({
        by: ["productId"],
        _avg: {
          rating: true,
        },
        _count: {
          rating: true,
        },
        where: {
          status: "APPROVED",
        },
      }),
      prisma.banner.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
      }),
    ]);

    const salesMap = new Map<string, number>();
    if (dbSales.status === "fulfilled" && Array.isArray(dbSales.value)) {
      for (const item of dbSales.value) {
        if (item.productId && item._sum?.quantity) {
          salesMap.set(item.productId, item._sum.quantity);
        }
      }
    }

    const reviewsMap = new Map<string, { averageRating: number; reviewsCount: number }>();
    if (dbReviews && dbReviews.status === "fulfilled" && Array.isArray(dbReviews.value)) {
      for (const r of dbReviews.value) {
        if (r.productId) {
          reviewsMap.set(r.productId, {
            averageRating: r._avg?.rating ? Number(r._avg.rating.toFixed(1)) : 0,
            reviewsCount: r._count?.rating || 0,
          });
        }
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

    if (dbProducts.status === "fulfilled" && dbProducts.value.length > 0) {
      // Enrich products with sales metrics & viral classification & real review stats
      const enriched = dbProducts.value.map((p) => {
        const realSales = salesMap.get(p.id) || 0;
        const starterSales = STARTER_SALES_BY_SLUG[p.slug] || 0;
        const salesCount = realSales > 0 ? realSales + starterSales : starterSales;
        const isViral = salesCount >= 10 || (p.isFeatured && salesCount > 0);
        const reviewStats = reviewsMap.get(p.id) || { averageRating: 0, reviewsCount: 0 };

        return {
          ...p,
          salesCount,
          isViral,
          averageRating: reviewStats.averageRating,
          reviewsCount: reviewStats.reviewsCount,
        };
      });

      // Dynamic sorting priority:
      // 1. Admin pushed (isFeatured) with sales momentum
      // 2. Admin pushed (isFeatured)
      // 3. Highest salesCount (most sold viral products)
      // 4. Newest products
      enriched.sort((a, b) => {
        const scoreA = (a.isFeatured ? 1000 : 0) + (a.salesCount || 0) * 10;
        const scoreB = (b.isFeatured ? 1000 : 0) + (b.salesCount || 0) * 10;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });

      products = enriched;
    } else if (dbProducts.status === "fulfilled" && dbProducts.value.length === 0) {
      // Database connected but empty: auto-seed starter products into DB
      try {
        const seeded = [];
        for (const p of FALLBACK_PRODUCTS) {
          const created = await prisma.product.create({
            data: {
              name: p.name,
              slug: p.slug,
              description: p.description,
              category: p.category,
              price: p.price,
              compareAtPrice: p.compareAtPrice,
              stock: p.stock,
              imageUrl: p.imageUrl,
              isFeatured: p.isFeatured,
              isActive: true,
            },
          });
          seeded.push({
            ...created,
            salesCount: p.salesCount,
            isViral: p.isViral,
          });
        }
        if (seeded.length > 0) {
          products = seeded;
        }
      } catch (seedErr) {
        console.warn("Auto-seeding products into empty database skipped:", seedErr);
      }
    }

    if (dbSettings.status === "fulfilled" && dbSettings.value) {
      settings = {
        ...DEFAULT_SETTINGS,
        ...dbSettings.value,
        logoUrl: dbSettings.value.logoUrl || "",
      };
    }

    if (dbBanners.status === "fulfilled" && Array.isArray(dbBanners.value)) {
      banners = dbBanners.value.map((b) => ({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle,
        badgeText: b.badgeText,
        badgeSecondary: b.badgeSecondary,
        imageUrl: b.imageUrl,
        ctaText: b.ctaText,
        ctaLink: b.ctaLink,
        bgGradient: b.bgGradient,
        textColor: b.textColor,
        order: b.order,
        isActive: b.isActive,
      }));
    }
  } catch (error) {
    console.warn("Could not query database for storefront, using safe fallbacks:", error);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Schema.org JSON-LD Structured Data for Google Rich Snippets
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        url: baseUrl,
        name: settings.storeName,
        description: settings.tagline,
        potentialAction: {
          "@type": "SearchAction",
          target: `${baseUrl}/?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "OnlineStore",
        "@id": `${baseUrl}/#store`,
        name: settings.storeName,
        url: baseUrl,
        telephone: settings.supportPhone,
        priceRange: "৳৳",
        address: {
          "@type": "PostalAddress",
          addressLocality: settings.shopCity || "Bogura",
          addressRegion: "Rajshahi",
          addressCountry: "BD",
        },
      },
      {
        "@type": "ItemList",
        itemListElement: products.slice(0, 24).map((p, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          item: {
            "@type": "Product",
            name: p.name,
            description: p.description,
            image: p.imageUrl,
            offers: {
              "@type": "Offer",
              price: p.price,
              priceCurrency: "BDT",
              availability:
                p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              seller: {
                "@type": "Organization",
                name: settings.storeName,
              },
            },
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StorefrontClient initialProducts={products} settings={settings} banners={banners} />
    </>
  );
}
