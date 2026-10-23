"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Storefront runtime error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-gray-200 p-8 sm:p-10 text-center space-y-5 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="h-8 w-8" />
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-bold text-rose-600 uppercase tracking-widest block font-mono">
            Application Error
          </span>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Something went wrong
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            We encountered an unexpected error while loading this page. You can try refreshing or returning to the storefront.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2.5">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-md min-h-[44px]"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors min-h-[40px]"
          >
            <Home className="h-4 w-4 text-slate-500" />
            <span>Return to Storefront</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
