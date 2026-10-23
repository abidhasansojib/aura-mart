import React from "react";
import { ShieldCheck, Truck, RotateCcw, Headphones } from "lucide-react";

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
    <footer className="mt-20 border-t border-black/5 bg-white/70 backdrop-blur-md">
      {/* 1. Value Propositions Ribbon */}
      <div className="py-8 border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-black/5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-[#5256FF]/10 text-[#5256FF] flex items-center justify-center shrink-0">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">Fast Nationwide</h4>
                <p className="text-[11px] text-slate-500">64 districts covered</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-black/5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-[#C4E9E5] text-slate-900 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">100% Authentic</h4>
                <p className="text-[11px] text-slate-500">Guaranteed quality</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-black/5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-[#FF6448]/10 text-[#FF6448] flex items-center justify-center shrink-0">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">Easy Returns</h4>
                <p className="text-[11px] text-slate-500">7-day replacement</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-black/5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-[#F5B738]/10 text-amber-700 flex items-center justify-center shrink-0">
                <Headphones className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">Hotline Support</h4>
                <p className="text-[11px] text-slate-500">{supportPhone}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="max-w-sm">
            <h3 className="text-base font-black text-slate-900 tracking-tight">{storeName}</h3>
            <p className="text-xs text-slate-500 mt-1">{tagline}</p>
          </div>

          {/* Payment Badges */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <span className="text-xs text-slate-400 font-semibold">Payment Methods:</span>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-white rounded-full text-[11px] font-bold text-slate-800 border border-black/5 shadow-sm">
                💵 Cash on Delivery
              </span>
              <span className="px-3 py-1 bg-[#E2136E]/10 text-[#E2136E] rounded-full text-[11px] font-black border border-[#E2136E]/20 shadow-sm">
                bKash
              </span>
              <span className="px-3 py-1 bg-[#F7941D]/10 text-[#F7941D] rounded-full text-[11px] font-black border border-[#F7941D]/20 shadow-sm">
                Nagad
              </span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-black/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} {storeName}. All rights reserved.</p>
          <p className="flex items-center gap-1 font-medium">
            Modern Bento Architecture.
          </p>
        </div>
      </div>
    </footer>
  );
}
