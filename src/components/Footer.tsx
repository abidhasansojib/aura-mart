/* eslint-disable @next/next/no-img-element */
import React from "react";
import Link from "next/link";
import { ShieldCheck, Truck, PackageCheck, Headphones, Phone } from "lucide-react";

interface FooterProps {
  storeName?: string;
  logoUrl?: string;
  tagline?: string;
  supportPhone?: string;
  facebookUrl?: string;
  instagramUrl?: string;
}

export function Footer({
  storeName = "Official Store",
  logoUrl,
  tagline = "Quality Products Delivered to Your Doorstep",
  supportPhone = "01700000000",
  facebookUrl,
  instagramUrl,
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
                <p className="text-[10px] sm:text-[11px] text-slate-400">Direct genuine source</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3.5 p-3 sm:p-4 rounded-2xl bg-[#24272C] border border-white/5 shadow-sm">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <PackageCheck className="h-4 sm:h-5 w-4 sm:w-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-white">Safe Packaging</h4>
                <p className="text-[10px] sm:text-[11px] text-slate-400">Bubble-wrapped & sealed</p>
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
              {logoUrl ? (
                <div className="h-11 sm:h-12 max-w-[140px] sm:max-w-[180px] min-w-[44px] sm:min-w-[48px] rounded-2xl bg-white shadow-md border border-white/20 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src={logoUrl}
                    alt={storeName}
                    className="h-full w-auto max-w-full object-contain rounded-xl"
                  />
                </div>
              ) : (
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#24272C] border border-white/10 flex items-center justify-center text-white font-black text-lg shadow-md">
                  <span>{storeName.charAt(0) || "A"}</span>
                </div>
              )}
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

            {/* Social Links (Facebook & Instagram) */}
            {(facebookUrl || instagramUrl) && (
              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                {facebookUrl && (
                  <a
                    href={facebookUrl.startsWith("http") ? facebookUrl : `https://${facebookUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] hover:text-[#4287f5] border border-[#1877F2]/30 text-xs font-bold transition-all shadow-sm group"
                  >
                    <svg className="w-4 h-4 fill-current transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span>Visit Facebook Page</span>
                  </a>
                )}
                {instagramUrl && (
                  <a
                    href={instagramUrl.startsWith("http") ? instagramUrl : `https://${instagramUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#E4405F]/10 hover:bg-[#E4405F]/20 text-[#E4405F] hover:text-[#f85a7a] border border-[#E4405F]/30 text-xs font-bold transition-all shadow-sm group"
                  >
                    <svg className="w-4 h-4 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                    </svg>
                    <span>Follow Instagram</span>
                  </a>
                )}
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
              {facebookUrl && (
                <li>
                  <a
                    href={facebookUrl.startsWith("http") ? facebookUrl : `https://${facebookUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    Facebook Page
                  </a>
                </li>
              )}
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
        <div className="mt-12 pt-8 border-t border-white/10 flex items-center justify-center text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {storeName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
