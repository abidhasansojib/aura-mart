"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Sparkles } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";

interface CartDrawerProps {
  currencySymbol?: string;
  freeShippingThreshold?: number;
}

export function CartDrawer({ currencySymbol = "৳", freeShippingThreshold = 0 }: CartDrawerProps) {
  const { cart, isCartOpen, setIsCartOpen, removeItem, updateQuantity, subtotal, totalItems } =
    useCart();

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const isFreeShippingUnlocked = freeShippingThreshold > 0 && subtotal >= freeShippingThreshold;
  const progressPercent = freeShippingThreshold > 0 ? Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100)) : 0;
  const remainingForFreeShipping = freeShippingThreshold > 0 ? Math.max(0, freeShippingThreshold - subtotal) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-0 xs:pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform ease-out duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-[#FF6448]" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Shopping Cart ({totalItems})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 -mr-1 sm:-mr-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Close cart drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Free Shipping Dynamic Progress Bar */}
          {freeShippingThreshold > 0 && cart.length > 0 && (
            <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-neutral-50 border-b border-gray-100 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                {isFreeShippingUnlocked ? (
                  <span className="text-emerald-700 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    <span>🎉 You unlocked 100% FREE Delivery!</span>
                  </span>
                ) : (
                  <span className="text-slate-700">
                    Add <span className="font-mono text-[#FF6448]">{formatPrice(remainingForFreeShipping, currencySymbol)}</span> more for <span className="text-emerald-700 font-bold">FREE Delivery</span>
                  </span>
                )}
                <span className="text-[10px] text-slate-500 font-mono font-bold">
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${isFreeShippingUnlocked ? "bg-emerald-500" : "bg-[#5256FF]"}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-slate-400 mb-4">
                  <ShoppingBag className="h-8 w-8" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">
                  Your cart is empty
                </h3>
                <p className="text-xs text-slate-500 mb-6 max-w-xs leading-relaxed">
                  Explore our collection and add your favorite items to get started!
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 bg-[#181A1D] text-white rounded-xl text-xs font-bold hover:bg-black transition-colors"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-4 p-3.5 bg-neutral-50 rounded-2xl border border-gray-100 relative group"
                >
                  {/* Thumbnail */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white shrink-0 border border-gray-200">
                    <img
                      src={item.imageUrl || "/placeholder-product.png"}
                      alt={item.name}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-1">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                          aria-label={`Remove ${item.name} from cart`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <span className="text-xs font-black text-slate-900 font-mono mt-0.5 block">
                        {formatPrice(item.price, currencySymbol)}
                      </span>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center border border-gray-200 rounded-lg bg-white">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="p-1 text-slate-600 hover:text-black transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-semibold font-mono text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="p-1 text-slate-600 hover:text-black transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <span className="text-xs font-bold text-slate-700 font-mono">
                        {formatPrice(item.price * item.quantity, currencySymbol)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Action */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-6 pb-safe border-t border-gray-100 bg-neutral-50 space-y-3 sm:space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatPrice(subtotal, currencySymbol)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Delivery</span>
                  <span>
                    {isFreeShippingUnlocked ? (
                      <span className="text-emerald-700 font-bold">FREE</span>
                    ) : (
                      "Calculated at Checkout"
                    )}
                  </span>
                </div>
              </div>

              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-[#FF6448] hover:bg-[#e8553b] text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-[#FF6448]/25 transition-all active:scale-95"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <div className="text-center">
                <span className="text-[11px] text-slate-400 font-medium">
                  🔒 Cash on Delivery & Mobile Banking Available
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
