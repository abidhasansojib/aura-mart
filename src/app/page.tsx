import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { StorefrontClient } from "@/components/StorefrontClient";
import { ModalProduct } from "@/components/ProductDetailModal";

export const dynamic = "force-dynamic";

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
  },
];

const DEFAULT_SETTINGS = {
  storeName: "Aura Mart",
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

  try {
    const [dbProducts, dbSettings] = await Promise.allSettled([
      prisma.product.findMany({
        where: { isActive: true },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      }),
      prisma.storeSettings.findUnique({
        where: { id: "default" },
      }),
    ]);

    if (dbProducts.status === "fulfilled" && dbProducts.value.length > 0) {
      products = dbProducts.value;
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
          seeded.push(created);
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
      };
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
      <StorefrontClient initialProducts={products} settings={settings} />
    </>
  );
}
