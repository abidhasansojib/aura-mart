"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Minus, ShoppingBag, Zap, CheckCircle2, ShieldCheck, Truck, Star } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";

export interface ModalProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  imageUrl: string;
  isFeatured?: boolean;
}

interface ProductDetailModalProps {
  product: ModalProduct | null;
  onClose: () => void;
  currencySymbol?: string;
}

export function ProductDetailModal({
  product,
  onClose,
  currencySymbol = "৳",
}: ProductDetailModalProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, quantity);
    onClose();
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addItem(product, quantity);
    onClose();
    router.push("/checkout");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-3 xs:p-4 sm:p-6">
        <div className="relative w-full max-w-3xl rounded-3xl sm:rounded-[32px] bg-white shadow-2xl overflow-hidden border border-black/5 transition-all animate-in zoom-in-95 bento-card max-h-[92vh] flex flex-col">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-10 p-2 sm:p-2.5 rounded-full bg-white/90 backdrop-blur-md text-slate-700 hover:text-black shadow-md border border-black/5 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 overflow-y-auto">
            {/* Image Section */}
            <div className="relative bg-neutral-100 aspect-square md:aspect-auto h-56 xs:h-64 sm:h-72 md:h-full flex items-center justify-center p-4 sm:p-6 overflow-hidden">
              <img
                src={product.imageUrl || "/placeholder-product.png"}
                alt={product.name}
                className="max-h-full max-w-full object-cover rounded-2xl shadow-sm"
              />
              {discountPercent && (
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-[#FF6448] text-white text-[10px] sm:text-xs font-black px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-md">
                  {discountPercent}% OFF
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="p-5 xs:p-6 sm:p-8 flex flex-col justify-between space-y-5 sm:space-y-6">
              <div className="space-y-3 sm:space-y-3.5">
                {/* Category & Stock Tag */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-slate-100 text-slate-700 font-mono uppercase tracking-wider">
                    {product.category}
                  </span>

                  <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-amber-500 bg-amber-50 px-2 sm:px-2.5 py-0.5 rounded-full">
                    <Star className="h-3 sm:h-3.5 w-3 sm:w-3.5 fill-amber-400 text-amber-400" />
                    <span>4.9 (Verified)</span>
                  </span>

                  {isOutOfStock ? (
                    <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-red-100 text-red-700">
                      Out of Stock
                    </span>
                  ) : isLowStock ? (
                    <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-[#F5B738]/20 text-amber-800">
                      Only {product.stock} left!
                    </span>
                  ) : (
                    <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>In Stock</span>
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-lg xs:text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                  {product.name}
                </h2>

                {/* Price Display */}
                <div className="flex items-baseline gap-2.5 pt-1">
                  <span className="text-xl xs:text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                    {formatPrice(product.price, currencySymbol)}
                  </span>
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <span className="text-xs sm:text-sm text-slate-400 line-through font-mono">
                      {formatPrice(product.compareAtPrice, currencySymbol)}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {product.description}
                </p>

                {/* Value Propositions */}
                <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-medium">
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50">
                    <Truck className="h-3.5 w-3.5 text-[#5256FF]" />
                    <span>24-48h Delivery</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Cash on Delivery</span>
                  </div>
                </div>
              </div>

              {/* Actions Section */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                {!isOutOfStock && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Quantity:</span>
                    <div className="flex items-center border border-gray-200 rounded-2xl bg-slate-50 p-1">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="p-1.5 text-slate-600 hover:text-black transition-colors rounded-xl hover:bg-white"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center font-bold text-sm text-slate-900 font-mono">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                        className="p-1.5 text-slate-600 hover:text-black transition-colors rounded-xl hover:bg-white"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Primary & Secondary Action Buttons */}
                {isOutOfStock ? (
                  <button
                    disabled
                    className="w-full py-3.5 rounded-2xl bg-gray-100 text-slate-400 font-bold text-sm cursor-not-allowed min-h-[48px]"
                  >
                    Sold Out
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleAddToCart}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border-2 border-[#181A1D] text-[#181A1D] font-bold text-xs hover:bg-[#181A1D] hover:text-white transition-all active:scale-95 min-h-[48px]"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      <span>Add to Cart</span>
                    </button>

                    <button
                      onClick={handleBuyNow}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#FF6448] hover:bg-[#e8553b] text-white font-bold text-xs shadow-lg shadow-[#FF6448]/25 transition-all active:scale-95 min-h-[48px]"
                    >
                      <Zap className="h-4 w-4 fill-white" />
                      <span>Buy Now (COD)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
