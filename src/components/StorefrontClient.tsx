"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
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
  RotateCcw,
  Star,
  PackageCheck,
  PhoneCall,
  SlidersHorizontal,
  CheckCircle2,
  MessageCircle,
  AlertCircle,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { ProductDetailModal, ModalProduct } from "@/components/ProductDetailModal";
import { formatPrice } from "@/lib/utils";

interface StoreSettingsData {
  id?: string;
  storeName?: string;
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
}

export function StorefrontClient({ initialProducts, settings }: StorefrontClientProps) {
  const router = useRouter();
  const { addItem, totalItems, subtotal, setIsCartOpen } = useCart();
  const currencySymbol = settings.currencySymbol || "৳";

  // Filter & sort states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "discount">("featured");
  const [activeModalProduct, setActiveModalProduct] = useState<ModalProduct | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    initialProducts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["All", "Featured", ...Array.from(set)];
  }, [initialProducts]);

  // Filtered & sorted products
  const filteredProducts = useMemo(() => {
    const filtered = initialProducts.filter((product) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedCategory === "All") return true;
      if (selectedCategory === "Featured") return Boolean(product.isFeatured);
      return product.category.toLowerCase() === selectedCategory.toLowerCase();
    });

    return filtered.sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "discount") {
        const discA = a.compareAtPrice && a.compareAtPrice > a.price ? a.compareAtPrice - a.price : 0;
        const discB = b.compareAtPrice && b.compareAtPrice > b.price ? b.compareAtPrice - b.price : 0;
        return discB - discA;
      }
      return 0; // featured / default order
    });
  }, [initialProducts, searchQuery, selectedCategory, sortBy]);

  const handleQuickBuy = (product: ModalProduct) => {
    if (product.stock <= 0) return;
    addItem(product, 1);
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen bg-[#CBD5CE] text-slate-900 flex flex-col font-sans selection:bg-[#FF6448] selection:text-white">
      {/* 1. Header & Navigation */}
      <Navbar
        storeName={settings.storeName}
        announcementText={settings.announcementText}
        supportPhone={settings.supportPhone}
        currencySymbol={currencySymbol}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
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
        <section className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Main Hero Card: Coral `#FF6448` (Span 7 Cols) */}
          <div className="md:col-span-7 bg-[#FF6448] text-white rounded-[32px] p-7 sm:p-10 shadow-xl flex flex-col justify-between bento-card relative overflow-hidden group">
            <div className="space-y-4 relative z-10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold border border-white/20 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{settings.heroBadgeText || "Featured Collection 2026"}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/30 backdrop-blur-md text-white text-[11px] font-bold">
                  <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                  <span>4.9/5 (2,400+ Orders)</span>
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.08]">
                {settings.heroTitle || settings.storeName || "Aura Mart"}
              </h1>

              <p className="text-sm sm:text-base text-white/95 max-w-lg leading-relaxed font-medium">
                {settings.heroTagline ||
                  settings.tagline ||
                  "Quality Products Delivered to Your Doorstep. Zero advance payment required."}
              </p>
            </div>

            <div className="pt-8 relative z-10 flex flex-wrap items-center gap-3">
              <a
                href="#catalog"
                className="inline-flex items-center gap-2 bg-[#181A1D] hover:bg-black text-white text-xs sm:text-sm font-bold px-7 py-3.5 rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95 min-h-[44px]"
              >
                <span>{settings.heroCtaText || "Shop Catalog"}</span>
                <ArrowRight className="h-4 w-4" />
              </a>

              <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/25 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/30 text-white shadow-sm">
                <CheckCircle2 className="h-4 w-4 text-white" />
                <span>{settings.heroBadgeSecondary || "Cash on Delivery Available"}</span>
              </span>
            </div>

            {/* Subtle striped pattern watermark */}
            <div className="absolute -right-8 -bottom-8 w-72 h-44 striped-bar-pattern opacity-25 pointer-events-none rounded-tl-full" />
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Right Bento Column: Indigo, Mint & Dark Cards (Span 5 Cols) */}
          <div className="md:col-span-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4">
            {/* Indigo Blue Card: Nationwide Express */}
            <div className="bg-[#5256FF] text-white rounded-[28px] p-6 shadow-xl flex flex-col justify-between bento-card relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-white/85">
                  EXPRESS SHIPPING
                </span>
                <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Truck className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="my-3">
                <div className="text-xl font-black tracking-tight">
                  {settings.expressCardTitle || "Fast Doorstep Delivery"}
                </div>
                <p className="text-xs text-white/85 mt-1 font-medium">
                  Inside City: ৳{settings.insideCityDelivery || 60} • Nationwide: ৳{settings.outsideCityDelivery || 120}
                </p>
              </div>
              <div className="text-[11px] font-bold text-white/95 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span>{settings.expressCardSubtitle || "All 64 Districts Dispatched in 24-48 Hours"}</span>
              </div>
            </div>

            {/* Ice Mint Card: 100% Authentic & Inspection */}
            <div className="bg-[#C4E9E5] text-slate-950 rounded-[28px] p-6 shadow-xl flex flex-col justify-between bento-card">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                  ASSURANCE & GUARANTEE
                </span>
                <div className="w-9 h-9 rounded-2xl bg-[#181A1D] text-white flex items-center justify-center shadow-md">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                </div>
              </div>
              <div className="my-2">
                <div className="text-lg font-black tracking-tight">
                  {settings.guaranteeCardTitle || "Open-Box Inspection"}
                </div>
                <p className="text-xs text-slate-700 mt-1 font-medium">
                  {settings.guaranteeCardSubtitle ||
                    "Check your parcel in front of the delivery agent before paying cash."}
                </p>
              </div>
              <div className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5 pt-1">
                <RotateCcw className="h-3.5 w-3.5 text-emerald-700" />
                <span>7-Day Replacement Guarantee</span>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            3. CATEGORY PILL FILTER & SORT BAR
            ===================================================================== */}
        <section id="catalog" className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {selectedCategory === "All"
                  ? "Explore Catalog"
                  : selectedCategory === "Featured"
                  ? "Featured Selection"
                  : selectedCategory}
                <span className="text-xs font-bold text-slate-600 ml-2 px-2.5 py-0.5 rounded-full bg-white/70 border border-black/5">
                  {filteredProducts.length} {filteredProducts.length === 1 ? "item" : "items"}
                </span>
              </h2>
              {searchQuery && (
                <p className="text-xs font-medium text-slate-600 mt-0.5">
                  Showing results matching &quot;{searchQuery}&quot;
                </p>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-slate-600 hidden xs:inline flex items-center gap-1">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Sort by:</span>
              </span>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as "featured" | "price-asc" | "price-desc" | "discount"
                  )
                }
                aria-label="Sort products by"
                className="bg-white/90 backdrop-blur-sm border border-black/10 rounded-2xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6448]/30 min-h-[40px] shadow-sm cursor-pointer"
              >
                <option value="featured">Featured / Default</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="discount">Biggest Savings</option>
              </select>
            </div>
          </div>

          {/* Category Pill Horizontal Scroller */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all min-h-[42px] flex items-center gap-1.5 shadow-sm active:scale-95 ${
                    isActive
                      ? "bg-[#181A1D] text-white shadow-md shadow-black/15"
                      : "bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-white hover:text-slate-950 border border-black/5"
                  }`}
                >
                  {cat === "Featured" && <Flame className="h-3.5 w-3.5 text-[#FF6448] fill-[#FF6448]" />}
                  {cat === "All" && <Sparkles className="h-3.5 w-3.5 text-slate-500" />}
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* =====================================================================
            4. RESPONSIVE BENTO PRODUCT GRID
            ===================================================================== */}
        <section>
          {filteredProducts.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-black/5 p-12 text-center max-w-md mx-auto my-12 space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-3xl bg-neutral-100 flex items-center justify-center mx-auto text-slate-400">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No products found</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                We couldn&apos;t find any items matching your filters or search keywords.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
                className="px-6 py-2.5 bg-[#181A1D] text-white text-xs font-bold rounded-2xl hover:bg-black transition-colors shadow-md min-h-[40px]"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock > 0 && product.stock <= 5;
                const discountPercent =
                  product.compareAtPrice && product.compareAtPrice > product.price
                    ? Math.round(
                        ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100
                      )
                    : null;

                return (
                  <div
                    key={product.id}
                    className="group flex flex-col bg-white rounded-[28px] border border-black/5 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 relative bento-card"
                  >
                    {/* Image Container (1:1 Aspect Ratio) */}
                    <div
                      onClick={() => setActiveModalProduct(product)}
                      className="relative aspect-square w-full bg-neutral-100 overflow-hidden cursor-pointer"
                    >
                      <img
                        src={product.imageUrl || "/placeholder-product.png"}
                        alt={product.name}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                        loading="lazy"
                      />

                      {/* Top Badges */}
                      <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                        {discountPercent ? (
                          <span className="bg-[#FF6448] text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
                            {discountPercent}% OFF
                          </span>
                        ) : (
                          <span />
                        )}

                        {product.isFeatured && (
                          <span className="bg-[#181A1D]/80 backdrop-blur-sm text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                            <Flame className="h-2.5 w-2.5 text-[#FF6448] fill-[#FF6448]" />
                            <span>Hot</span>
                          </span>
                        )}
                      </div>

                      {/* Low Stock Warning Badge */}
                      {isLowStock && (
                        <span className="absolute bottom-3 left-3 bg-[#F5B738] text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md">
                          Only {product.stock} left!
                        </span>
                      )}

                      {/* Out of Stock Overlay */}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-white/85 backdrop-blur-[2px] flex items-center justify-center p-2">
                          <span className="bg-[#181A1D] text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                          <span className="uppercase tracking-wider font-mono">{product.category}</span>
                          <span className="flex items-center gap-0.5 text-amber-500">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span>4.9</span>
                          </span>
                        </div>

                        <h3
                          onClick={() => setActiveModalProduct(product)}
                          className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 cursor-pointer hover:text-[#FF6448] transition-colors leading-snug"
                        >
                          {product.name}
                        </h3>
                      </div>

                      {/* Price & Action Section */}
                      <div className="space-y-2.5 pt-2 border-t border-gray-100">
                        <div className="flex items-baseline gap-2">
                          <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                            {formatPrice(product.price, currencySymbol)}
                          </span>
                          {product.compareAtPrice && product.compareAtPrice > product.price && (
                            <span className="text-xs text-slate-400 line-through font-mono">
                              {formatPrice(product.compareAtPrice, currencySymbol)}
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        {isOutOfStock ? (
                          <button
                            disabled
                            className="w-full py-2 bg-gray-100 text-slate-400 text-xs font-bold rounded-xl cursor-not-allowed min-h-[44px]"
                          >
                            Sold Out
                          </button>
                        ) : (
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              onClick={() => addItem(product, 1)}
                              className="w-full flex items-center justify-center gap-1 py-2 px-2 rounded-2xl border border-slate-900 text-slate-900 text-xs font-bold hover:bg-[#181A1D] hover:text-white transition-all active:scale-95 min-h-[44px]"
                              title="Add to cart"
                            >
                              <ShoppingBag className="h-3.5 w-3.5" />
                              <span>Add</span>
                            </button>

                            <button
                              onClick={() => handleQuickBuy(product)}
                              className="w-full flex items-center justify-center gap-1 py-2 px-2 rounded-2xl bg-[#FF6448] hover:bg-[#e8553b] text-white text-xs font-bold shadow-md shadow-[#FF6448]/25 transition-all active:scale-95 min-h-[44px]"
                              title="1-Click Instant Order"
                            >
                              <Zap className="h-3.5 w-3.5 fill-white" />
                              <span>Order</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* =====================================================================
            5. MODERN BENTO TRUST & ASSURANCE SECTION
            ===================================================================== */}
        <section className="bg-[#181A1D] text-white rounded-[32px] p-6 sm:p-10 shadow-2xl space-y-6">
          <div className="max-w-2xl space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#FF6448]">
              WHY BUY FROM AURA MART
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              A Hassle-Free Shopping Experience
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Enjoy verified quality, nationwide cash on delivery, and open-box verification on every purchase.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="bg-[#24272C] rounded-2xl p-5 space-y-2 border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-[#5256FF]/20 text-[#5256FF] flex items-center justify-center">
                <Truck className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Nationwide Shipping</h4>
              <p className="text-xs text-slate-400">
                Doorstep delivery across all 64 districts with real-time SMS & hotline tracking.
              </p>
            </div>

            <div className="bg-[#24272C] rounded-2xl p-5 space-y-2 border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-[#C4E9E5]/20 text-[#C4E9E5] flex items-center justify-center">
                <PackageCheck className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Cash on Delivery</h4>
              <p className="text-xs text-slate-400">
                Zero advance payment required. Inspect parcel before paying the delivery agent.
              </p>
            </div>

            <div className="bg-[#24272C] rounded-2xl p-5 space-y-2 border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-[#FF6448]/20 text-[#FF6448] flex items-center justify-center">
                <RotateCcw className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-white">7-Day Replacement</h4>
              <p className="text-xs text-slate-400">
                Received a damaged or defective item? We replace it swiftly with zero hassle.
              </p>
            </div>

            <div className="bg-[#24272C] rounded-2xl p-5 space-y-2 border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
                <PhoneCall className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Direct Phone Support</h4>
              <p className="text-xs text-slate-400">
                Have questions or need help placing an order? Call our hotline: {settings.supportPhone || "01700000000"}.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* 6. Footer */}
      <Footer
        storeName={settings.storeName}
        tagline={settings.tagline}
        supportPhone={settings.supportPhone}
      />

      {/* 7. Mobile Sticky Bottom Cart Bar */}
      {totalItems > 0 && (
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-[#181A1D]/95 backdrop-blur-xl text-white p-3 shadow-2xl animate-in slide-in-from-bottom border-t border-white/10">
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => setIsCartOpen(true)} className="text-left flex-1 pl-2">
              <span className="text-[11px] text-slate-400 block font-medium">
                {totalItems} {totalItems === 1 ? "Item" : "Items"} in Cart
              </span>
              <span className="text-base font-black text-white font-mono">
                {formatPrice(subtotal, currencySymbol)}
              </span>
            </button>

            <Link
              href="/checkout"
              className="flex items-center justify-center gap-2 bg-[#FF6448] text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-lg shadow-[#FF6448]/30 active:scale-95 transition-all min-h-[44px]"
            >
              <span>Checkout Now</span>
              <ArrowRight className="h-4 w-4" />
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
            `Hello ${settings.storeName || "Aura Mart"}, I want to place an order!`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-20 sm:bottom-6 right-5 z-40 flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-3 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all text-xs font-bold border-2 border-white/20"
          title="Chat or Order via WhatsApp"
        >
          <MessageCircle className="h-5 w-5 fill-white" />
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
