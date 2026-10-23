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
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Navbar } from "@/components/Navbar";
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
}

interface StorefrontClientProps {
  initialProducts: ModalProduct[];
  settings: StoreSettingsData;
}

export function StorefrontClient({ initialProducts, settings }: StorefrontClientProps) {
  const router = useRouter();
  const { addItem, totalItems, subtotal, setIsCartOpen } = useCart();
  const currencySymbol = settings.currencySymbol || "৳";

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeModalProduct, setActiveModalProduct] = useState<ModalProduct | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    initialProducts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["All", "Featured", ...Array.from(set)];
  }, [initialProducts]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
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
  }, [initialProducts, searchQuery, selectedCategory]);

  const handleQuickBuy = (product: ModalProduct) => {
    if (product.stock <= 0) return;
    addItem(product, 1);
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen bg-[#CBD5CE] text-slate-900 flex flex-col font-sans">
      {/* 1. Header & Navigation */}
      <Navbar
        storeName={settings.storeName}
        announcementText={settings.announcementText}
        supportPhone={settings.supportPhone}
        currencySymbol={currencySymbol}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* =====================================================================
            2. MODERN BENTO HERO SHOWCASE (Matching Dribbble Reference)
            ===================================================================== */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Main Hero Card: Coral `#FF6448` (Span 7 Cols) */}
          <div className="md:col-span-7 bg-[#FF6448] text-white rounded-[32px] p-7 sm:p-9 shadow-xl flex flex-col justify-between bento-card relative overflow-hidden">
            <div className="space-y-3 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold border border-white/20">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Featured Collection 2026</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                {settings.storeName || "Aura Mart"}
              </h1>

              <p className="text-sm text-white/90 max-w-md leading-relaxed font-medium">
                {settings.tagline || "Quality Products Delivered to Your Doorstep."}
              </p>
            </div>

            <div className="pt-6 relative z-10 flex flex-wrap items-center gap-3">
              <a
                href="#catalog"
                className="inline-flex items-center gap-2 bg-slate-950 hover:bg-black text-white text-xs font-bold px-6 py-3.5 rounded-2xl shadow-lg transition-transform active:scale-95 min-h-[44px]"
              >
                <span>Shop Catalog</span>
                <ArrowRight className="h-4 w-4" />
              </a>

              <span className="text-xs font-bold bg-white/20 backdrop-blur-sm px-4 py-2.5 rounded-2xl border border-white/20">
                Cash on Delivery Available
              </span>
            </div>

            {/* Subtle striped pattern overlay */}
            <div className="absolute right-0 bottom-0 w-64 h-36 striped-bar-pattern opacity-30 pointer-events-none rounded-tl-3xl" />
          </div>

          {/* Right Bento Column: Royal Blue & Mint Cards (Span 5 Cols) */}
          <div className="md:col-span-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4">
            {/* Indigo Blue Card: Nationwide Express */}
            <div className="bg-[#5256FF] text-white rounded-[28px] p-6 shadow-xl flex flex-col justify-between bento-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-white/80">
                  EXPRESS SHIPPING
                </span>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Truck className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="my-3">
                <div className="text-xl font-black">Fast Doorstep Delivery</div>
                <p className="text-xs text-white/80 mt-1">
                  Inside City: ৳{settings.insideCityDelivery || 60} • Nationwide: ৳{settings.outsideCityDelivery || 120}
                </p>
              </div>
              <div className="text-[11px] font-bold text-white/90 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>64 Districts Covered</span>
              </div>
            </div>

            {/* Ice Mint Card: 100% Authentic */}
            <div className="bg-[#C4E9E5] text-slate-950 rounded-[28px] p-6 shadow-xl flex flex-col justify-between bento-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                  GUARANTEE
                </span>
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                </div>
              </div>
              <div className="my-2">
                <div className="text-lg font-black">100% Genuine Quality</div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Inspect your parcel before paying courier cash.
                </p>
              </div>
              <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                <RotateCcw className="h-3.5 w-3.5 text-emerald-700" />
                <span>7-Day Easy Replacement</span>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            3. CATEGORY PILL FILTER SCROLLER
            ===================================================================== */}
        <section id="catalog" className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              {selectedCategory === "All"
                ? "All Products"
                : selectedCategory === "Featured"
                ? "Featured Selection"
                : selectedCategory}
              <span className="text-xs font-semibold text-slate-600 ml-2">
                ({filteredProducts.length} items)
              </span>
            </h2>

            {searchQuery && (
              <span className="text-xs font-semibold text-slate-600">
                Filtering by &quot;{searchQuery}&quot;
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all min-h-[40px] flex items-center gap-1.5 ${
                    isActive
                      ? "bg-slate-900 text-white shadow-md"
                      : "bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-white border border-black/5"
                  }`}
                >
                  {cat === "Featured" && <Flame className="h-3.5 w-3.5 text-[#FF6448]" />}
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
            <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-black/5 p-12 text-center max-w-md mx-auto my-12 space-y-3 shadow-lg">
              <Search className="h-10 w-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No products found</h3>
              <p className="text-xs text-slate-500">
                We couldn&apos;t find any items matching your filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
                className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-black transition-colors"
              >
                Reset Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
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
                    className="group flex flex-col bg-white rounded-[26px] border border-black/5 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative bento-card"
                  >
                    {/* Image Container (1:1 Aspect Ratio) */}
                    <div
                      onClick={() => setActiveModalProduct(product)}
                      className="relative aspect-square w-full bg-neutral-100 overflow-hidden cursor-pointer"
                    >
                      <img
                        src={product.imageUrl || "/placeholder-product.png"}
                        alt={product.name}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />

                      {/* Discount Badge */}
                      {discountPercent && (
                        <span className="absolute top-3 left-3 bg-[#FF6448] text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
                          {discountPercent}% OFF
                        </span>
                      )}

                      {/* Low Stock Warning Badge */}
                      {isLowStock && (
                        <span className="absolute bottom-3 left-3 bg-[#F5B738] text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md">
                          Only {product.stock} left!
                        </span>
                      )}

                      {/* Out of Stock Overlay */}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex items-center justify-center p-2">
                          <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-full">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                          {product.category}
                        </span>

                        <h3
                          onClick={() => setActiveModalProduct(product)}
                          className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 cursor-pointer hover:text-[#FF6448] transition-colors leading-snug"
                        >
                          {product.name}
                        </h3>
                      </div>

                      {/* Price Section */}
                      <div className="space-y-2 pt-2 border-t border-gray-100">
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
                            Out of Stock
                          </button>
                        ) : (
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              onClick={() => addItem(product, 1)}
                              className="w-full flex items-center justify-center gap-1 py-2 px-2 rounded-xl border border-slate-900 text-slate-900 text-xs font-bold hover:bg-slate-900 hover:text-white transition-colors min-h-[44px]"
                              title="Add to cart"
                            >
                              <ShoppingBag className="h-3.5 w-3.5" />
                              <span>Add</span>
                            </button>

                            <button
                              onClick={() => handleQuickBuy(product)}
                              className="w-full flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-[#FF6448] hover:bg-[#e8553b] text-white text-xs font-bold shadow-md shadow-[#FF6448]/20 transition-all active:scale-95 min-h-[44px]"
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
      </main>

      {/* 5. Mobile Sticky Bottom Cart Bar */}
      {totalItems > 0 && (
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-md text-white p-3 shadow-2xl animate-in slide-in-from-bottom border-t border-white/10">
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => setIsCartOpen(true)} className="text-left flex-1 pl-2">
              <span className="text-[11px] text-slate-400 block">
                {totalItems} {totalItems === 1 ? "Item" : "Items"} in Cart
              </span>
              <span className="text-base font-black text-white font-mono">
                {formatPrice(subtotal, currencySymbol)}
              </span>
            </button>

            <Link
              href="/checkout"
              className="flex items-center justify-center gap-2 bg-[#FF6448] text-white text-xs font-bold px-5 py-3 rounded-xl shadow-lg shadow-[#FF6448]/30 active:scale-95 transition-all min-h-[44px]"
            >
              <span>Checkout Now</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* 6. Product Detail Modal */}
      <ProductDetailModal
        product={activeModalProduct}
        onClose={() => setActiveModalProduct(null)}
        currencySymbol={currencySymbol}
      />

      {/* 7. Slide-Over Cart Drawer */}
      <CartDrawer currencySymbol={currencySymbol} />
    </div>
  );
}
