"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Minus, ShoppingBag, Zap, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
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
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden border border-gray-100 transition-all animate-in zoom-in-95">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 backdrop-blur-md text-slate-500 hover:text-slate-900 shadow-sm border border-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Image Section */}
            <div className="relative bg-neutral-100 aspect-square md:aspect-auto h-72 md:h-full flex items-center justify-center p-4">
              <img
                src={product.imageUrl || "/placeholder-product.png"}
                alt={product.name}
                className="max-h-full max-w-full object-contain rounded-2xl"
              />
              {discountPercent && (
                <div className="absolute top-4 left-4 bg-rose-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                  {discountPercent}% OFF
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                {/* Category & Stock Tag */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {product.category}
                  </span>

                  {isOutOfStock ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-slate-500 border border-gray-200">
                      Out of Stock
                    </span>
                  ) : isLowStock ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Only {product.stock} left in stock!
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      In Stock
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                  {product.name}
                </h2>

                {/* Pricing */}
                <div className="flex items-baseline gap-3 pt-1">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                    {formatPrice(product.price, currencySymbol)}
                  </span>
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <span className="text-base text-slate-400 line-through font-mono">
                      {formatPrice(product.compareAtPrice, currencySymbol)}
                    </span>
                  )}
                </div>

                {/* Description */}
                <div className="pt-2">
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {product.description || "Premium quality product guaranteed."}
                  </p>
                </div>
              </div>

              {/* Action Controls */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                {!isOutOfStock && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Quantity:
                    </span>
                    <div className="flex items-center border border-gray-200 rounded-xl bg-neutral-50 p-1">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-30"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-4 text-sm font-bold text-slate-900 min-w-[32px] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                        disabled={quantity >= product.stock}
                        className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-30"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-slate-900 text-slate-900 font-semibold hover:bg-slate-900 hover:text-white disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent transition-colors min-h-[44px]"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>{isOutOfStock ? "Out of Stock" : "Add to Cart"}</span>
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#FF6448] hover:bg-[#e8553b] text-white font-bold shadow-lg shadow-[#FF6448]/20 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none transition-all min-h-[44px]"
                  >
                    <Zap className="h-4 w-4 fill-white" />
                    <span>Order Now</span>
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Cash on Delivery & Easy Inspection at Doorstep</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
