import React from "react";
import Link from "next/link";
import { ShoppingBag, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-gray-200 p-8 sm:p-10 text-center space-y-5 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <ShoppingBag className="h-8 w-8" />
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest block font-mono">
            404 Error
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Page Not Found
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            The page or product you are looking for may have been moved, renamed, or is temporarily unavailable.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2.5">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-md min-h-[44px]"
          >
            <Home className="h-4 w-4" />
            <span>Return to Storefront</span>
          </Link>

          <Link
            href="/#catalog"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors min-h-[40px]"
          >
            <Search className="h-4 w-4 text-slate-500" />
            <span>Browse All Products</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
