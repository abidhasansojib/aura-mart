"use client";

import React, { useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { Search, Sparkles, ArrowRight, Tag, Flame } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { searchProducts, SearchableProduct } from "@/lib/search";

interface SearchAutocompleteProps<T extends SearchableProduct> {
  isOpen: boolean;
  searchQuery: string;
  products: T[];
  currencySymbol?: string;
  onSelectProduct: (product: T) => void;
  onSelectCategory: (category: string) => void;
  onClose: () => void;
}

export function SearchAutocomplete<T extends SearchableProduct>({
  isOpen,
  searchQuery,
  products,
  currencySymbol = "৳",
  onSelectProduct,
  onSelectCategory,
  onClose,
}: SearchAutocompleteProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return searchProducts(products, searchQuery);
  }, [products, searchQuery]);

  if (!isOpen || !searchQuery.trim() || !searchResults) {
    return null;
  }

  const { exactMatches, similarProducts, matchedCategories } = searchResults;
  const hasExact = exactMatches.length > 0;
  const hasSimilar = similarProducts.length > 0;

  // Highlight matching characters in product title
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[^\w\s]/g, "")})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-amber-100 text-amber-950 font-black rounded px-0.5">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  return (
    <div
      ref={containerRef}
      className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-3xl border border-black/10 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[82vh] flex flex-col divide-y divide-gray-100 text-slate-800"
    >
      {/* 1. Category Quick Filters if query matches categories */}
      {matchedCategories.length > 0 && (
        <div className="p-3 bg-neutral-50/70 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
            <Tag className="h-3 w-3" />
            <span>Categories:</span>
          </span>
          <div className="flex items-center gap-1.5">
            {matchedCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  onSelectCategory(cat);
                  onClose();
                }}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-slate-900 hover:text-white border border-gray-200 text-slate-700 text-[11px] font-bold transition-all shadow-xs"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. Scrollable Body: Exact Matches + Similar Products */}
      <div className="overflow-y-auto max-h-[60vh] p-3 space-y-4">
        {/* Exact Matches Section */}
        {hasExact ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2 pt-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Search className="h-3 w-3 text-[#FF6448]" />
                <span>Exact Products ({exactMatches.length})</span>
              </span>
            </div>

            <div className="space-y-1">
              {exactMatches.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectProduct(p);
                    onClose();
                  }}
                  className="flex items-center justify-between p-2 rounded-2xl hover:bg-neutral-100/80 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-12 h-12 rounded-xl bg-neutral-100 overflow-hidden shrink-0 border border-black/5 relative">
                      <Image
                        src={p.imageUrl || "/placeholder-product.png"}
                        alt={p.name}
                        fill
                        sizes="48px"
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                      {p.isFeatured && (
                        <div className="absolute top-0.5 right-0.5 bg-[#FF6448] text-white p-0.5 rounded-full z-10">
                          <Flame className="h-2 w-2" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate group-hover:text-[#FF6448] transition-colors">
                        {highlightMatch(p.name, searchQuery)}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {p.category}
                        </span>
                        {p.stock <= 0 && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 rounded">
                            Sold Out
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-bold text-xs text-slate-900">
                      {formatPrice(p.price, currencySymbol)}
                    </span>
                    <div className="w-7 h-7 rounded-xl bg-neutral-100 group-hover:bg-[#FF6448] group-hover:text-white flex items-center justify-center transition-colors">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Similar / Related Products Section */}
        {hasSimilar && (
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between px-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-amber-500" />
                <span>You Might Also Like (Related Products)</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {similarProducts.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectProduct(p);
                    onClose();
                  }}
                  className="flex items-center gap-2.5 p-2 rounded-2xl bg-neutral-50/70 hover:bg-neutral-100 border border-black/5 cursor-pointer group transition-all"
                >
                  <div className="relative w-10 h-10 rounded-xl bg-white overflow-hidden shrink-0 border border-black/5">
                    <Image
                      src={p.imageUrl || "/placeholder-product.png"}
                      alt={p.name}
                      fill
                      sizes="40px"
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-slate-800 truncate group-hover:text-[#FF6448]">
                      {p.name}
                    </p>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[10px] text-slate-400 truncate pr-1">
                        {p.category}
                      </span>
                      <span className="text-[11px] font-mono font-black text-emerald-700 shrink-0">
                        {formatPrice(p.price, currencySymbol)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Zero Results State */}
        {!hasExact && !hasSimilar && (
          <div className="py-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                No products matching &ldquo;{searchQuery}&rdquo;
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Try searching for general keywords like &ldquo;wallet&rdquo;, &ldquo;earbuds&rdquo;, or &ldquo;stand&rdquo;
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Footer Bar */}
      <div className="p-2.5 bg-neutral-50 flex items-center justify-between text-[11px] font-semibold text-slate-500">
        <span className="truncate pr-2">
          <span className="hidden xs:inline">Press </span><kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono shadow-xs">Enter</kbd> to view all
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-[#FF6448] hover:underline font-bold shrink-0"
        >
          Close [Esc]
        </button>
      </div>
    </div>
  );
}
