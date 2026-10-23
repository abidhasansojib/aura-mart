"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Phone, Search, ShoppingBag, Truck, ShieldCheck, Sparkles } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { TrackOrderModal } from "@/components/TrackOrderModal";
import { SearchAutocomplete } from "@/components/SearchAutocomplete";
import { ModalProduct } from "@/components/ProductDetailModal";

interface NavbarProps {
  storeName?: string;
  announcementText?: string;
  supportPhone?: string;
  currencySymbol?: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  products?: ModalProduct[];
  onSelectProduct?: (product: ModalProduct) => void;
  onSelectCategory?: (category: string) => void;
}

export function Navbar({
  storeName = "Aura Mart",
  announcementText = "🚚 Cash on Delivery Available Nationwide! Fast Express Shipping.",
  supportPhone = "01700000000",
  currencySymbol = "৳",
  searchQuery,
  onSearchChange,
  products = [],
  onSelectProduct,
  onSelectCategory,
}: NavbarProps) {
  const { totalItems, setIsCartOpen } = useCart();
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 70 && currentScrollY > lastScrollY.current + 6) {
        // Scrolling down past 70px -> condense mobile search to give screen estate to products
        setIsScrolledDown(true);
      } else if (currentScrollY < lastScrollY.current - 6 || currentScrollY <= 40) {
        // Scrolling up or at top -> smoothly reveal search bar
        setIsScrolledDown(false);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* 1. Sleek Top Announcement Ribbon */}
      <div className="bg-[#181A1D] text-white text-[10px] sm:text-[11px] font-semibold py-1.5 sm:py-2 px-3 sm:px-4 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 truncate text-slate-300 min-w-0">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#FF6448] animate-pulse shrink-0" />
            <span className="truncate hidden sm:inline">{announcementText}</span>
            <span className="truncate sm:hidden">🚚 Cash on Delivery Nationwide • Fast Express</span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0 text-slate-400">
            {supportPhone && (
              <a
                href={`tel:${supportPhone}`}
                className="hidden xs:flex items-center gap-1 hover:text-white transition-colors"
              >
                <Phone className="h-3 w-3 text-[#FF6448]" />
                <span>{supportPhone}</span>
              </a>
            )}
            <Link
              href="/admin"
              className="flex items-center gap-1 hover:text-white text-slate-400 transition-colors border-l border-white/10 pl-2.5 sm:pl-3"
              title="Admin Portal"
            >
              <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden xs:inline">Admin Portal</span>
              <span className="xs:hidden">Admin</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Floating Bento Glass Header (Auto-condenses on mobile scroll) */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/90 border-b border-black/5 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-2 sm:py-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between sm:h-20 gap-2 sm:gap-6">
            {/* Top row on mobile / Left Brand on desktop */}
            <div className="flex items-center justify-between gap-3">
              {/* Brand Logo & Name */}
              <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0 group">
                <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#181A1D] flex items-center justify-center text-white font-black text-sm sm:text-lg shadow-md group-hover:scale-105 transition-transform border border-white/10 relative overflow-hidden">
                  <span className="relative z-10">{storeName.charAt(0) || "A"}</span>
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#FF6448]/30 to-transparent pointer-events-none" />
                </div>
                <div>
                  <span className="text-sm sm:text-lg font-black text-slate-900 tracking-tight block leading-none">
                    {storeName}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-[#FF6448] font-bold uppercase tracking-wider block mt-0.5 sm:mt-1 flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5" />
                    <span>Premium Store</span>
                  </span>
                </div>
              </Link>

              {/* Mobile Actions: Search Trigger, Track Order & Cart (Visible on < sm) */}
              <div className="flex items-center gap-1.5 sm:hidden">
                {isScrolledDown && (
                  <button
                    onClick={() => setIsScrolledDown(false)}
                    className="flex items-center justify-center w-8.5 h-8.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors active:scale-95 animate-in fade-in"
                    title="Search catalog"
                    aria-label="Search"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                )}

                <button
                  onClick={() => setIsTrackModalOpen(true)}
                  className="flex items-center justify-center w-8.5 h-8.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors active:scale-95"
                  title="Track Order Status"
                  aria-label="Track Order"
                >
                  <Truck className="h-4 w-4" />
                </button>

                <button
                  onClick={() => setIsCartOpen(true)}
                  className="relative flex items-center justify-center w-8.5 h-8.5 rounded-xl bg-[#181A1D] hover:bg-black text-white shadow-md active:scale-95 transition-all"
                  aria-label={`Shopping cart containing ${totalItems} items`}
                >
                  <ShoppingBag className="h-4 w-4" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#FF6448] text-white text-[9px] font-black h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center shadow-md animate-pulse">
                      {totalItems}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Instant Search Bar with Live Autocomplete Popover (Auto-condensed on mobile downward scroll) */}
            <div
              className={`flex-1 w-full sm:max-w-md md:max-w-lg relative transition-all duration-300 ease-in-out ${
                isScrolledDown
                  ? "max-h-0 opacity-0 -translate-y-2 pointer-events-none overflow-hidden sm:max-h-none sm:opacity-100 sm:translate-y-0 sm:pointer-events-auto sm:overflow-visible"
                  : "max-h-14 opacity-100 translate-y-0"
              }`}
            >
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-3.5 sm:h-4 w-3.5 sm:w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setIsSearchDropdownOpen(true)}
                  onChange={(e) => {
                    onSearchChange(e.target.value);
                    if (!isSearchDropdownOpen) setIsSearchDropdownOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setIsSearchDropdownOpen(false);
                    } else if (e.key === "Enter") {
                      setIsSearchDropdownOpen(false);
                    }
                  }}
                  placeholder="Search products, categories, or keywords..."
                  className="w-full pl-9 sm:pl-11 pr-12 sm:pr-14 py-1.5 sm:py-2.5 rounded-xl sm:rounded-full border border-black/10 bg-white/95 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#FF6448]/30 focus:border-[#FF6448] transition-all min-h-[36px] sm:min-h-[44px] shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      onSearchChange("");
                      setIsSearchDropdownOpen(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400 hover:text-slate-700 bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded-full"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Live Search Dropdown */}
              <SearchAutocomplete
                isOpen={isSearchDropdownOpen}
                searchQuery={searchQuery}
                products={products}
                currencySymbol={currencySymbol}
                onSelectProduct={(p) => {
                  if (onSelectProduct) onSelectProduct(p);
                  setIsSearchDropdownOpen(false);
                }}
                onSelectCategory={(cat) => {
                  if (onSelectCategory) onSelectCategory(cat);
                  setIsSearchDropdownOpen(false);
                }}
                onClose={() => setIsSearchDropdownOpen(false)}
              />
            </div>

            {/* Desktop Actions: Track Order & Cart (Hidden on mobile, visible on >= sm) */}
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              {/* Track Order Pill */}
              <button
                onClick={() => setIsTrackModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors min-h-[44px]"
                title="Track your order status"
              >
                <Truck className="h-4 w-4 text-slate-600" />
                <span>Track Order</span>
              </button>

              {/* Cart Drawer Trigger */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-[#181A1D] hover:bg-black text-white shadow-md hover:shadow-lg transition-transform active:scale-95 min-h-[44px] min-w-[44px]"
                aria-label={`Shopping cart containing ${totalItems} items`}
              >
                <ShoppingBag className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#FF6448] text-white text-[11px] font-black h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center shadow-md animate-pulse">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Track Order Modal */}
      <TrackOrderModal
        isOpen={isTrackModalOpen}
        onClose={() => setIsTrackModalOpen(false)}
        currencySymbol={currencySymbol}
      />
    </>
  );
}
