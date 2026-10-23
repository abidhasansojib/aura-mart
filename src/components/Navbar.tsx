"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Phone, Search, ShoppingBag, Truck, ShieldCheck } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { TrackOrderModal } from "@/components/TrackOrderModal";

interface NavbarProps {
  storeName?: string;
  announcementText?: string;
  supportPhone?: string;
  currencySymbol?: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function Navbar({
  storeName = "Aura Mart",
  announcementText = "🚚 Cash on Delivery Available Nationwide! Fast Express Shipping.",
  supportPhone = "01700000000",
  currencySymbol = "৳",
  searchQuery,
  onSearchChange,
}: NavbarProps) {
  const { totalItems, setIsCartOpen } = useCart();
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);

  return (
    <>
      {/* 1. Sleek Top Announcement Ribbon */}
      <div className="bg-[#1C1E22] text-white text-[11px] font-semibold py-2 px-4 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2 truncate text-slate-300">
            <span className="w-2 h-2 rounded-full bg-[#FF6448] animate-pulse" />
            <span className="truncate">{announcementText}</span>
          </div>

          <div className="flex items-center gap-4 shrink-0 text-slate-400">
            {supportPhone && (
              <a
                href={`tel:${supportPhone}`}
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Phone className="h-3.5 w-3.5 text-[#FF6448]" />
                <span>Hotline: {supportPhone}</span>
              </a>
            )}
            <Link
              href="/admin"
              className="flex items-center gap-1 hover:text-white text-slate-400 text-[11px] transition-colors border-l border-white/10 pl-3"
              title="Admin Portal"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Admin Portal</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Floating Bento Glass Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b border-black/5 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-6">
            {/* Brand Logo & Name */}
            <Link href="/" className="flex items-center gap-3 shrink-0 group">
              <div className="w-10 h-10 rounded-2xl bg-[#1C1E22] flex items-center justify-center text-white font-black text-lg shadow-md group-hover:scale-105 transition-transform border border-white/10">
                <span>{storeName.charAt(0) || "A"}</span>
              </div>
              <div className="hidden xs:block">
                <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight block leading-none">
                  {storeName}
                </span>
                <span className="text-[10px] text-[#FF6448] font-bold uppercase tracking-wider block mt-0.5">
                  Official Store
                </span>
              </div>
            </Link>

            {/* Instant Search Bar */}
            <div className="flex-1 max-w-lg relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search products, brands, or categories..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-full border border-black/5 bg-white/90 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#FF6448]/20 focus:border-[#FF6448] transition-all min-h-[44px] shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-700"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Actions: Track Order & Cart Trigger */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Track Order Button */}
              <button
                onClick={() => setIsTrackModalOpen(true)}
                className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-slate-700 hover:bg-white bg-white/70 border border-black/5 shadow-sm transition-all min-h-[44px]"
              >
                <Truck className="h-4 w-4 text-slate-600" />
                <span>Track Order</span>
              </button>

              {/* Cart Drawer Trigger Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center justify-center p-2.5 sm:px-4 sm:py-2.5 rounded-full bg-[#1C1E22] text-white hover:bg-black transition-all shadow-md min-h-[44px]"
                aria-label="Open cart"
              >
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden sm:inline font-bold text-xs ml-2">Cart</span>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#FF6448] text-white text-[10px] font-black rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center ring-2 ring-white animate-in zoom-in">
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
