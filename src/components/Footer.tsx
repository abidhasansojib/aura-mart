import React from "react";
import Link from "next/link";
import { ShieldCheck, Truck, RotateCcw, Headphones, Phone, Sparkles } from "lucide-react";

interface FooterProps {
  storeName?: string;
  tagline?: string;
  supportPhone?: string;
}

export function Footer({
  storeName = "Aura Mart",
  tagline = "Quality Products Delivered to Your Doorstep",
  supportPhone = "01700000000",
}: FooterProps) {
  return (
    <footer className="mt-16 bg-[#181A1D] text-white rounded-t-[40px] border-t border-white/10 shadow-2xl overflow-hidden">
      {/* 1. Value Propositions Ribbon */}
      <div className="py-8 sm:py-10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-6">
            <div className="flex items-center gap-2.5 sm:gap-3.5 p-3 sm:p-4 rounded-2xl bg-[#24272C] border border-white/5 shadow-sm">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-[#5256FF]/20 text-[#5256FF] flex items-center justify-center shrink-0">
                <Truck className="h-4 sm:h-5 w-4 sm:w-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-white">Fast Nationwide</h4>
                <p className="text-[10px] sm:text-[11px] text-slate-400">All 64 districts</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3.5 p-3 sm:p-4 rounded-2xl bg-[#24272C] border border-white/5 shadow-sm">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-[#C4E9E5]/20 text-[#C4E9E5] flex items-center justify-center shrink-0">
                <ShieldCheck className="h-4 sm:h-5 w-4 sm:w-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-white">100% Authentic</h4>
                <p className="text-[10px] sm:text-[11px] text-slate-400">Inspected parcel</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3.5 p-3 sm:p-4 rounded-2xl bg-[#24272C] border border-white/5 shadow-sm">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-[#FF6448]/20 text-[#FF6448] flex items-center justify-center shrink-0">
                <RotateCcw className="h-4 sm:h-5 w-4 sm:w-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-white">Easy Returns</h4>
                <p className="text-[10px] sm:text-[11px] text-slate-400">7-day replacement</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3.5 p-3 sm:p-4 rounded-2xl bg-[#24272C] border border-white/5 shadow-sm">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
                <Headphones className="h-4 sm:h-5 w-4 sm:w-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-white">Hotline Support</h4>
                <p className="text-[10px] sm:text-[11px] text-slate-400 truncate max-w-[100px] sm:max-w-none">{supportPhone}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-12 pb-24 sm:pb-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#24272C] border border-white/10 flex items-center justify-center text-white font-black text-lg">
                <span>{storeName.charAt(0) || "A"}</span>
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-white">{storeName}</h3>
                <span className="text-[10px] text-[#FF6448] font-bold uppercase tracking-wider block">
                  Official Direct Store
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
              {tagline}. Experience reliable cash on delivery and fast express shipping nationwide.
            </p>

            {supportPhone && (
              <div className="pt-1">
                <a
                  href={`tel:${supportPhone}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#24272C] hover:bg-[#2d3137] text-white text-xs font-bold transition-colors border border-white/5"
                >
                  <Phone className="h-3.5 w-3.5 text-[#FF6448]" />
                  <span>Order by Phone: {supportPhone}</span>
                </a>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs font-medium text-slate-300">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Home & Catalog
                </Link>
              </li>
              <li>
                <Link href="/checkout" className="hover:text-white transition-colors">
                  Instant Checkout
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span>Merchant Admin Portal</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-[#FF6448]/20 text-[#FF6448] text-[9px] font-bold">
                    Staff
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Payment & Trust */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Payment & Security
            </h4>
            <p className="text-xs text-slate-400">
              Pay upon doorstep delivery or via instant mobile banking after order confirmation.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1.5 bg-[#24272C] text-white rounded-xl text-xs font-bold border border-white/5 shadow-sm">
                💵 Cash on Delivery
              </span>
              <span className="px-3 py-1.5 bg-[#E2136E]/20 text-[#ff4b98] rounded-xl text-xs font-black border border-[#E2136E]/30 shadow-sm">
                bKash
              </span>
              <span className="px-3 py-1.5 bg-[#F7941D]/20 text-[#ffaa47] rounded-xl text-xs font-black border border-[#F7941D]/30 shadow-sm">
                Nagad
              </span>
            </div>
          </div>
        </div>

        {/* 3. Bottom Copyright */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {storeName}. All rights reserved.</p>
          <p className="flex items-center gap-1.5 font-medium text-slate-400">
            <Sparkles className="h-3 w-3 text-[#FF6448]" />
            <span>Modern Bento-Box E-Commerce Architecture</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
