"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Zap,
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
  Flame,
  Search,
  Star,
  MessageCircle,
  AlertCircle,
  ChevronDown,
  Boxes,
  Compass,
  Shuffle,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { ProductDetailModal, ModalProduct } from "@/components/ProductDetailModal";
import { HeroBannerSlider } from "@/components/HeroBannerSlider";
import { BannerItem } from "@/lib/banner-templates";
import { formatPrice } from "@/lib/utils";
import { searchProducts } from "@/lib/search";

// Helper for highlighting matching terms
function HighlightText({ text, query }: { text: string; query?: string }) {
  if (!query || !query.trim()) return <>{text}</>;
  const clean = query.trim().replace(/[^\w\s]/g, "");
  if (!clean) return <>{text}</>;
  const parts = text.split(new RegExp(`(${clean})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === clean.toLowerCase() ? (
          <mark key={i} className="bg-amber-100 text-amber-950 font-black rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// Bento Product Card Component
interface ProductCardProps {
  product: ModalProduct;
  currencySymbol: string;
  onOpenModal: (product: ModalProduct) => void;
  onAddToCart: (product: ModalProduct) => void;
  onQuickBuy: (product: ModalProduct) => void;
  searchHighlight?: string;
  isSimilar?: boolean;
}

function ProductCard({
  product,
  currencySymbol,
  onOpenModal,
  onAddToCart,
  onQuickBuy,
  searchHighlight,
  isSimilar,
}: ProductCardProps) {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

  return (
    <div className="group flex flex-col bg-white rounded-2xl sm:rounded-[28px] border border-black/5 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 relative bento-card">
      {/* Image Container (1:1 Aspect Ratio) */}
      <div
        onClick={() => onOpenModal(product)}
        className="relative aspect-square w-full bg-neutral-100 overflow-hidden cursor-pointer"
      >
        <Image
          src={product.imageUrl || "/placeholder-product.png"}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-2 sm:top-3 inset-x-2 sm:inset-x-3 flex items-center justify-between pointer-events-none gap-1">
          {discountPercent ? (
            <span className="bg-[#FF6448] text-white text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-md">
              {discountPercent}% OFF
            </span>
          ) : product.salesCount && product.salesCount > 0 ? (
            <span className="bg-[#181A1D]/85 backdrop-blur-sm text-white text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full shadow-md flex items-center gap-1">
              <Flame className="h-2.5 w-2.5 text-[#FF6448] fill-[#FF6448]" />
              <span>{product.salesCount}+ Sold</span>
            </span>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-1">
            {isSimilar && (
              <span className="bg-amber-100/90 text-amber-900 text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5 border border-amber-200">
                <Sparkles className="h-2.5 w-2.5 text-amber-600" />
                <span className="hidden xs:inline">Related</span>
              </span>
            )}
            {product.isFeatured ? (
              <span className="bg-amber-400 text-slate-950 text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-full shadow-md flex items-center gap-0.5 border border-amber-500/20">
                <Sparkles className="h-2.5 w-2.5 text-slate-950" />
                <span className="hidden xs:inline">Staff Pick</span>
                <span className="xs:hidden">Pick</span>
              </span>
            ) : product.isViral ? (
              <span className="bg-emerald-600 text-white text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-full shadow-md flex items-center gap-0.5">
                <Flame className="h-2.5 w-2.5 text-amber-300 fill-amber-300" />
                <span className="hidden xs:inline">Viral</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Low Stock Warning Badge */}
        {isLowStock && (
          <span className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 bg-[#F5B738] text-slate-950 text-[9px] sm:text-[10px] font-black px-2 sm:px-2.5 py-0.5 rounded-full shadow-md">
            Only {product.stock} left!
          </span>
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/85 backdrop-blur-[2px] flex items-center justify-center p-2">
            <span className="bg-[#181A1D] text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-3 sm:p-4 md:p-5 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3">
        <div className="space-y-1 sm:space-y-1.5">
          <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-bold text-slate-400">
            <span className="uppercase tracking-wider font-mono truncate pr-1">{product.category}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              {product.salesCount !== undefined && product.salesCount > 0 ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md">
                  {product.salesCount} sold
                </span>
              ) : null}
              {product.reviewsCount !== undefined && product.reviewsCount > 0 ? (
                <span className="flex items-center gap-0.5 text-amber-500 font-bold text-[10px] sm:text-xs">
                  <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-amber-400 text-amber-400" />
                  <span>{product.averageRating}</span>
                  <span className="text-slate-400 font-normal text-[9px] sm:text-[10px]">({product.reviewsCount})</span>
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-medium">New</span>
              )}
            </div>
          </div>

          <h3
            onClick={() => onOpenModal(product)}
            className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 cursor-pointer hover:text-[#FF6448] transition-colors leading-snug min-h-[2rem] sm:min-h-[2.5rem]"
          >
            <HighlightText text={product.name} query={searchHighlight} />
          </h3>
        </div>

        {/* Price & Action Section */}
        <div className="space-y-2 pt-1.5 sm:pt-2 border-t border-gray-100">
          <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-sm xs:text-base sm:text-lg font-black text-slate-900 font-mono">
              {formatPrice(product.price, currencySymbol)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-[10px] sm:text-xs text-slate-400 line-through font-mono">
                {formatPrice(product.compareAtPrice, currencySymbol)}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          {isOutOfStock ? (
            <button
              disabled
              className="w-full py-2 bg-gray-100 text-slate-400 text-xs font-bold rounded-xl cursor-not-allowed min-h-[38px] sm:min-h-[44px]"
            >
              Sold Out
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
              <button
                onClick={() => onAddToCart(product)}
                className="w-full flex items-center justify-center gap-1 py-1.5 sm:py-2 px-1 sm:px-2 rounded-xl sm:rounded-2xl border border-slate-900 text-slate-900 text-[11px] sm:text-xs font-bold hover:bg-[#181A1D] hover:text-white transition-all active:scale-95 min-h-[38px] sm:min-h-[44px]"
                title="Add to cart"
              >
                <ShoppingBag className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span>Add</span>
              </button>

              <button
                onClick={() => onQuickBuy(product)}
                className="w-full flex items-center justify-center gap-1 py-1.5 sm:py-2 px-1 sm:px-2 rounded-xl sm:rounded-2xl bg-[#FF6448] hover:bg-[#e8553b] text-white text-[11px] sm:text-xs font-bold shadow-md shadow-[#FF6448]/25 transition-all active:scale-95 min-h-[38px] sm:min-h-[44px]"
                title="1-Click Instant Order"
              >
                <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-white" />
                <span>Order</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface StoreSettingsData {
  id?: string;
  storeName?: string;
  storeBadge?: string;
  logoUrl?: string;
  tagline?: string;
  announcementText?: string;
  supportPhone?: string;
  bkashNumber?: string;
  nagadNumber?: string;
  insideCityDelivery?: number;
  outsideCityDelivery?: number;
  currencySymbol?: string;
  heroBadgeText?: string;
  heroTitle?: string;
  heroTagline?: string;
  heroCtaText?: string;
  heroBadgeSecondary?: string;
  expressCardTitle?: string;
  expressCardSubtitle?: string;
  guaranteeCardTitle?: string;
  guaranteeCardSubtitle?: string;
  whatsappNumber?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  enableCod?: boolean;
  enableBkash?: boolean;
  enableNagad?: boolean;
  enableRocket?: boolean;
  rocketNumber?: string;
  freeShippingThreshold?: number;
  lowStockThreshold?: number;
  shopCity?: string;
  shopAddress?: string;
  isStoreOpen?: boolean;
  storeClosedNotice?: string;
}

interface StorefrontClientProps {
  initialProducts: ModalProduct[];
  settings: StoreSettingsData;
  banners?: BannerItem[];
}

export function StorefrontClient({
  initialProducts,
  settings,
  banners = [],
}: StorefrontClientProps) {
  const router = useRouter();
  const { addItem, totalItems, subtotal, setIsCartOpen } = useCart();
  const currencySymbol = settings.currencySymbol || "৳";

  // Filter & sort states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Discover");
  const [sortBy, setSortBy] = useState<"featured" | "viral" | "price-asc" | "price-desc" | "discount">("featured");
  const [activeModalProduct, setActiveModalProduct] = useState<ModalProduct | null>(null);

  // Random 8 products picker (deterministic SSR initialization to avoid hydration mismatches)
  const [randomProducts, setRandomProducts] = useState<ModalProduct[]>(() => {
    return initialProducts.slice(0, 8);
  });

  const reshuffleRandom = useCallback(() => {
    if (initialProducts.length <= 8) {
      setRandomProducts(initialProducts);
      return;
    }
    const shuffled = [...initialProducts].sort(() => 0.5 - Math.random());
    setRandomProducts(shuffled.slice(0, 8));
  }, [initialProducts]);

  useEffect(() => {
    reshuffleRandom();
  }, [reshuffleRandom]);

  // Extract unique categories including Discover, All, Viral and Featured
  const categories = useMemo(() => {
    const set = new Set<string>();
    initialProducts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["Discover", "All", "Viral", "Featured", ...Array.from(set)];
  }, [initialProducts]);

  // Helper to sort products dynamically
  const sortProducts = useCallback(
    <T extends ModalProduct>(items: T[]): T[] => {
      const list = [...items];
      return list.sort((a, b) => {
        if (sortBy === "viral") {
          const scoreA = (a.isFeatured ? 500 : 0) + (a.salesCount || 0) * 10;
          const scoreB = (b.isFeatured ? 500 : 0) + (b.salesCount || 0) * 10;
          return scoreB - scoreA;
        }
        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        if (sortBy === "discount") {
          const discA = a.compareAtPrice && a.compareAtPrice > a.price ? a.compareAtPrice - a.price : 0;
          const discB = b.compareAtPrice && b.compareAtPrice > b.price ? b.compareAtPrice - b.price : 0;
          return discB - discA;
        }
        // Default "featured": dynamically prioritize admin-pushed (isFeatured) and mostly sold
        const rankA = (a.isFeatured ? 1000 : 0) + (a.salesCount || 0) * 10;
        const rankB = (b.isFeatured ? 1000 : 0) + (b.salesCount || 0) * 10;
        return rankB - rankA;
      });
    },
    [sortBy]
  );

  const isSearching = searchQuery.trim().length > 0;

  // Intelligent multi-tier search computation
  const searchResult = useMemo(() => {
    if (!isSearching) return null;
    return searchProducts(initialProducts, searchQuery);
  }, [initialProducts, searchQuery, isSearching]);

  // Category filter helper (supports "Discover", "All", "Viral" and "Featured")
  const filterByCategory = useCallback(
    (items: ModalProduct[]) => {
      if (selectedCategory === "Discover") {
        return randomProducts;
      }
      if (selectedCategory === "All") return items;
      if (selectedCategory === "Viral") {
        return items.filter((p) => Boolean(p.isViral || (p.salesCount && p.salesCount >= 10)));
      }
      if (selectedCategory === "Featured") {
        return items.filter((p) => Boolean(p.isFeatured));
      }
      return items.filter((p) => p.category.toLowerCase() === selectedCategory.toLowerCase());
    },
    [selectedCategory, randomProducts]
  );

  // Exact product search results
  const exactSearchResults = useMemo(() => {
    if (!searchResult) return [];
    return sortProducts(filterByCategory(searchResult.exactMatches));
  }, [searchResult, filterByCategory, sortProducts]);

  // Similar & related recommendations
  const similarSearchResults = useMemo(() => {
    if (!searchResult) return [];
    return sortProducts(filterByCategory(searchResult.similarProducts));
  }, [searchResult, filterByCategory, sortProducts]);

  // Default filtered products when not searching
  const standardFilteredProducts = useMemo(() => {
    if (isSearching) return [];
    if (selectedCategory === "Discover" && sortBy === "featured") {
      return randomProducts;
    }
    return sortProducts(filterByCategory(initialProducts));
  }, [initialProducts, isSearching, selectedCategory, sortBy, randomProducts, sortProducts, filterByCategory]);

  // Featured picks for smart fallback
  const featuredPicks = useMemo(() => {
    return initialProducts.filter((p) => p.isFeatured).slice(0, 4);
  }, [initialProducts]);

  const handleQuickBuy = (product: ModalProduct) => {
    if (product.stock <= 0) return;
    addItem(product, 1);
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-[#FF6448] selection:text-white">
      {/* 1. Header & Navigation */}
      <Navbar
        storeName={settings.storeName}
        storeBadge={settings.storeBadge}
        logoUrl={settings.logoUrl}
        announcementText={settings.announcementText}
        supportPhone={settings.supportPhone}
        currencySymbol={currencySymbol}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        products={initialProducts}
        onSelectProduct={(p) => setActiveModalProduct(p)}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          const el = document.getElementById("catalog");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 sm:space-y-10">
        {/* Temporary Store Vacation / Maintenance Banner */}
        {settings.isStoreOpen === false && (
          <div className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500 text-amber-950 flex items-center gap-3 shadow-md animate-in fade-in">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="text-xs sm:text-sm font-bold">
              <span className="font-black uppercase tracking-wider block sm:inline mr-2 text-amber-800">
                [NOTICE]
              </span>
              <span>
                {settings.storeClosedNotice ||
                  "We are currently restocking our inventory. Orders will resume shortly!"}
              </span>
            </div>
          </div>
        )}

        {/* =====================================================================
            2. MODERN BENTO HERO SHOWCASE (Matching Dribbble Bento Aesthetic)
            ===================================================================== */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 overflow-hidden no-scrollbar [&::-webkit-scrollbar]:hidden">
          {/* Main Hero Card: Swipable Animated Hero Banner Slider */}
          <HeroBannerSlider banners={banners} defaultSettings={settings} />

          {/* Right Bento Column: Desktop only (>= md), hidden on mobile per user instruction */}
          <div className="hidden md:grid md:col-span-5 grid-cols-1 gap-4">
            {/* Indigo Blue Card: Nationwide Express */}
            <div className="bg-[#5256FF] text-white rounded-[28px] p-6 shadow-xl flex flex-col justify-between bento-card relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-white/85 truncate">
                  EXPRESS SHIPPING
                </span>
                <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                  <Truck className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="my-3">
                <div className="text-xl font-black tracking-tight leading-snug">
                  {settings.expressCardTitle || "Fast Doorstep Delivery"}
                </div>
                <p className="text-xs text-white/85 mt-1 font-medium leading-tight">
                  ৳{settings.insideCityDelivery || 60} City • ৳{settings.outsideCityDelivery || 120} Nationwide
                </p>
              </div>
              <div className="text-[11px] font-bold text-white/95 flex items-center gap-2">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span className="truncate">{settings.expressCardSubtitle || "All 64 Districts Dispatched in 24-48 Hours"}</span>
              </div>
            </div>

            {/* Ice Mint Card: Quality Assurance & Bubble-Wrap Packaging */}
            <div className="bg-[#C4E9E5] text-slate-950 rounded-[28px] p-6 shadow-xl flex flex-col justify-between bento-card">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 truncate">
                  QUALITY & AUTHENTICITY
                </span>
                <div className="w-9 h-9 rounded-2xl bg-[#181A1D] text-white flex items-center justify-center shadow-md shrink-0">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                </div>
              </div>
              <div className="my-2">
                <div className="text-lg font-black tracking-tight leading-snug">
                  {settings.guaranteeCardTitle || "100% Quality Assured"}
                </div>
                <p className="text-xs text-slate-700 mt-1 font-medium leading-tight">
                  {settings.guaranteeCardSubtitle ||
                    "Every item is hand-inspected for flawless quality and packaged securely before dispatch."}
                </p>
              </div>
              <div className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5 pt-1 truncate">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                <span className="truncate">Damage-Free Protective Packaging</span>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            3. CATEGORY PILL FILTER & SORT BAR (Streamlined Single-Row Controls)
            ===================================================================== */}
        <section id="catalog" className="space-y-3 sm:space-y-4 pt-1 sm:pt-2">
          {/* Consolidated Single-Row Header & Sort */}
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1.5 sm:gap-2">
                <span className="truncate">
                  {isSearching
                    ? "Search Results"
                    : selectedCategory === "Discover"
                    ? "Discover Picks"
                    : selectedCategory === "All"
                    ? "Explore Full Catalog"
                    : selectedCategory === "Viral"
                    ? "🔥 Viral Products"
                    : selectedCategory === "Featured"
                    ? "⭐ Admin Picks"
                    : selectedCategory}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-slate-600 px-2 py-0.5 rounded-full bg-white/80 border border-black/5 shrink-0">
                  {isSearching
                    ? exactSearchResults.length + similarSearchResults.length
                    : standardFilteredProducts.length}{" "}
                  {(isSearching
                    ? exactSearchResults.length + similarSearchResults.length
                    : standardFilteredProducts.length) === 1
                    ? "item"
                    : "items"}
                </span>
              </h2>
              {isSearching && (
                <p className="text-[11px] sm:text-xs font-medium text-slate-600 mt-0.5 truncate">
                  Showing matches for &quot;{searchQuery}&quot;
                </p>
              )}
            </div>

            {/* Modern Styled Sort Dropdown */}
            <div className="relative flex items-center shrink-0">
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as "featured" | "viral" | "price-asc" | "price-desc" | "discount"
                  )
                }
                aria-label="Sort products by"
                className="appearance-none bg-white/95 backdrop-blur-md border border-slate-300/80 hover:border-slate-400 focus:border-[#FF6448] rounded-xl sm:rounded-2xl pl-3 sm:pl-3.5 pr-8 sm:pr-9 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF6448]/20 min-h-[36px] sm:min-h-[40px] shadow-xs cursor-pointer transition-all"
              >
                <option value="featured">✨ Featured</option>
                <option value="viral">🔥 Mostly Sold / Viral</option>
                <option value="price-asc">💵 Price: Low to High</option>
                <option value="price-desc">💎 Price: High to Low</option>
                <option value="discount">🏷️ Biggest Savings</option>
              </select>
              <ChevronDown className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none transition-transform" />
            </div>
          </div>

          {/* Category Pill Horizontal Scroller */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all min-h-[36px] sm:min-h-[42px] flex items-center gap-1 sm:gap-1.5 shadow-xs active:scale-95 shrink-0 ${
                    isActive
                      ? "bg-[#181A1D] text-white shadow-md shadow-black/15"
                      : "bg-white/85 backdrop-blur-sm text-slate-700 hover:bg-white hover:text-slate-950 border border-black/5"
                  }`}
                >
                  {cat === "Discover" && <Compass className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-[#FF6448]" />}
                  {cat === "All" && <Boxes className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-slate-600" />}
                  {cat === "Viral" && <Flame className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-[#FF6448] fill-[#FF6448]" />}
                  {cat === "Featured" && <Sparkles className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-amber-500" />}
                  <span>
                    {cat === "Discover"
                      ? `Discover (${Math.min(8, initialProducts.length)})`
                      : cat === "All"
                      ? `All Products (${initialProducts.length})`
                      : cat === "Viral"
                      ? "Viral Hits"
                      : cat === "Featured"
                      ? "Admin Picks"
                      : cat}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Search Summary Pill Bar */}
          {isSearching && (
            <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-black/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#FF6448]/10 text-[#FF6448] flex items-center justify-center shrink-0">
                  <Search className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Keyword: &ldquo;{searchQuery}&rdquo;</span>
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {exactSearchResults.length} Exact
                    </span>
                    {similarSearchResults.length > 0 && (
                      <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        {similarSearchResults.length} Similar
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Multi-tier search with typo tolerance and category affinity
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {searchResult?.matchedCategories && searchResult.matchedCategories.length > 0 && (
                  <div className="hidden md:flex items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Tags:</span>
                    {searchResult.matchedCategories.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedCategory(c)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                          selectedCategory === c
                            ? "bg-[#181A1D] text-white border-black"
                            : "bg-white text-slate-600 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                  }}
                  className="px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-slate-700 text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  Clear Search
                </button>
              </div>
            </div>
          )}
        </section>

        {/* =====================================================================
            4. RESPONSIVE BENTO PRODUCT GRID (MULTI-TIER SEARCH & DISCOVERY)
            ===================================================================== */}
        <section className="space-y-8">
          {isSearching ? (
            <>
              {/* Tier 1: Exact Matches */}
              {exactSearchResults.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#FF6448] text-white flex items-center justify-center shadow-xs">
                        <Search className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                          Exact Product Matches
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Direct title and keyword matches
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-700 bg-white/80 px-2.5 py-0.5 rounded-full border border-black/5">
                      {exactSearchResults.length} {exactSearchResults.length === 1 ? "item" : "items"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
                    {exactSearchResults.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        currencySymbol={currencySymbol}
                        onOpenModal={setActiveModalProduct}
                        onAddToCart={(p) => addItem(p, 1)}
                        onQuickBuy={handleQuickBuy}
                        searchHighlight={searchQuery}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Tier 2: Similar & Related Products */}
              {similarSearchResults.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-black/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                        <Sparkles className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                          You Might Also Like
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Related recommendations based on your search
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      {similarSearchResults.length} recommendations
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
                    {similarSearchResults.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        currencySymbol={currencySymbol}
                        onOpenModal={setActiveModalProduct}
                        onAddToCart={(p) => addItem(p, 1)}
                        onQuickBuy={handleQuickBuy}
                        isSimilar
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Tier 3: Zero Matches State with Smart Category Suggestions & Featured Picks */}
              {exactSearchResults.length === 0 && similarSearchResults.length === 0 && (
                <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-black/5 p-8 sm:p-12 text-center max-w-xl mx-auto my-6 space-y-6 shadow-xl animate-in fade-in">
                  <div className="w-16 h-16 rounded-3xl bg-neutral-100 flex items-center justify-center mx-auto text-slate-400">
                    <Search className="h-8 w-8 text-slate-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-slate-900">
                      No matches found for &ldquo;{searchQuery}&rdquo;
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                      We couldn&apos;t find an exact match for your query. Try checking your spelling or explore popular categories below:
                    </p>
                  </div>

                  {/* Category Quick Chips */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    {categories
                      .filter((c) => c !== "All")
                      .map((cat) => (
                        <button
                          key={cat}
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedCategory(cat);
                          }}
                          className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-[#181A1D] hover:text-white text-slate-800 text-xs font-bold transition-all shadow-xs"
                        >
                          {cat}
                        </button>
                      ))}
                  </div>

                  {/* Featured Picks Fallback */}
                  {featuredPicks.length > 0 && (
                    <div className="pt-6 border-t border-gray-100 text-left space-y-3">
                      <div className="flex items-center gap-2">
                        <Flame className="h-4 w-4 text-[#FF6448]" />
                        <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                          Popular Featured Picks
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {featuredPicks.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => setActiveModalProduct(p)}
                            className="bg-neutral-50 rounded-2xl p-2.5 cursor-pointer hover:bg-neutral-100 border border-black/5 transition-all text-center group"
                          >
                            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white mb-2 border border-black/5">
                              <Image
                                src={p.imageUrl || "/placeholder-product.png"}
                                alt={p.name}
                                fill
                                sizes="(max-width: 640px) 50vw, 25vw"
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                            <p className="text-xs font-mono font-black text-[#FF6448] mt-1">
                              {formatPrice(p.price, currencySymbol)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("All");
                      }}
                      className="px-6 py-2.5 bg-[#181A1D] text-white text-xs font-bold rounded-2xl hover:bg-black transition-colors shadow-md min-h-[40px]"
                    >
                      Clear Search & Browse All
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : standardFilteredProducts.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-black/5 p-12 text-center max-w-md mx-auto my-12 space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-3xl bg-neutral-100 flex items-center justify-center mx-auto text-slate-400">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No products found</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                We couldn&apos;t find any items matching your selected category.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("All");
                }}
                className="px-6 py-2.5 bg-[#181A1D] text-white text-xs font-bold rounded-2xl hover:bg-black transition-colors shadow-md min-h-[40px]"
              >
                Show All Products
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
                {standardFilteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    currencySymbol={currencySymbol}
                    onOpenModal={setActiveModalProduct}
                    onAddToCart={(p) => addItem(p, 1)}
                    onQuickBuy={handleQuickBuy}
                  />
                ))}
              </div>

              {/* Browse All Products Prompt when in Discover Mode */}
              {selectedCategory === "Discover" && initialProducts.length > Math.min(8, initialProducts.length) && (
                <div className="bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-black/5 p-6 sm:p-8 text-center shadow-sm space-y-3.5 mt-2 sm:mt-4">
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-slate-900">
                      Showing {Math.min(8, initialProducts.length)} Random Picks from our {initialProducts.length} Products
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-500 max-w-md mx-auto mt-0.5">
                      Want to explore our entire collection or get another fresh set of {Math.min(8, initialProducts.length)} items?
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2.5 flex-wrap pt-1">
                    <button
                      onClick={() => {
                        setSelectedCategory("All");
                        const el = document.getElementById("catalog");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl sm:rounded-2xl bg-[#181A1D] hover:bg-black text-white text-xs font-bold transition-all shadow-md active:scale-95 min-h-[42px]"
                    >
                      <span>Browse All Products ({initialProducts.length})</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={reshuffleRandom}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl sm:rounded-2xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all border border-slate-200 shadow-xs active:scale-95 min-h-[42px]"
                    >
                      <Shuffle className="h-3.5 w-3.5 text-[#FF6448]" />
                      <span>Shuffle {Math.min(8, initialProducts.length)} More</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* 6. Footer */}
      <Footer
        storeName={settings.storeName}
        storeBadge={settings.storeBadge}
        logoUrl={settings.logoUrl}
        tagline={settings.tagline}
        supportPhone={settings.supportPhone}
        facebookUrl={settings.facebookUrl}
        instagramUrl={settings.instagramUrl}
      />

      {/* 7. Mobile Sticky Bottom Cart Bar */}
      {totalItems > 0 && (
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-[#181A1D]/95 backdrop-blur-xl text-white p-3 pb-safe shadow-2xl animate-in slide-in-from-bottom border-t border-white/10">
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => setIsCartOpen(true)} className="text-left flex-1 pl-1">
              <span className="text-[10px] text-slate-400 block font-medium">
                {totalItems} {totalItems === 1 ? "Item" : "Items"} in Cart
              </span>
              <span className="text-sm font-black text-white font-mono">
                {formatPrice(subtotal, currencySymbol)}
              </span>
            </button>

            <Link
              href="/checkout"
              className="flex items-center justify-center gap-1.5 bg-[#FF6448] hover:bg-[#e8553b] text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-lg shadow-[#FF6448]/30 active:scale-95 transition-all min-h-[42px]"
            >
              <span>Checkout</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* 8. Product Detail Modal */}
      <ProductDetailModal
        product={activeModalProduct}
        onClose={() => setActiveModalProduct(null)}
        currencySymbol={currencySymbol}
      />

      {/* 9. Floating WhatsApp Direct Order Bubble */}
      {settings.whatsappNumber && (
        <a
          href={`https://wa.me/${
            settings.whatsappNumber.replace(/[^0-9]/g, "").startsWith("88")
              ? settings.whatsappNumber.replace(/[^0-9]/g, "")
              : `88${settings.whatsappNumber.replace(/[^0-9]/g, "")}`
          }?text=${encodeURIComponent(
            `Hello ${settings.storeName || "there"}, I want to place an order!`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`fixed ${
            totalItems > 0 ? "bottom-[76px]" : "bottom-4"
          } sm:bottom-6 right-3 sm:right-6 z-40 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 text-xs font-bold border-2 border-white/80`}
          title="Chat or Order via WhatsApp"
          aria-label="Order via WhatsApp"
        >
          <MessageCircle className="h-5 w-5 fill-white shrink-0" />
          <span className="hidden sm:inline">WhatsApp Order</span>
        </a>
      )}

      {/* 10. Slide-Over Cart Drawer */}
      <CartDrawer
        currencySymbol={currencySymbol}
        freeShippingThreshold={settings.freeShippingThreshold || 0}
      />
    </div>
  );
}
