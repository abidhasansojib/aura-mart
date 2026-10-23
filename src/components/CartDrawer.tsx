"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";

interface CartDrawerProps {
  currencySymbol?: string;
}

export function CartDrawer({ currencySymbol = "৳" }: CartDrawerProps) {
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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform ease-out duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Shopping Cart ({totalItems})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 -mr-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Close cart drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
                  <ShoppingBag className="h-8 w-8" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">
                  Your cart is empty
                </h3>
                <p className="text-sm text-slate-500 mb-6 max-w-xs">
                  Explore our collection and add your favorite items to get started!
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors"
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
                        <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          aria-label={`Remove ${item.name} from cart`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-sm font-bold text-slate-900">
                          {formatPrice(item.price, currencySymbol)}
                        </span>
                        {item.compareAtPrice && item.compareAtPrice > item.price && (
                          <span className="text-xs text-slate-400 line-through">
                            {formatPrice(item.compareAtPrice, currencySymbol)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Selector & Line Total */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200/60">
                      <div className="flex items-center border border-gray-200 rounded-lg bg-white">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-semibold text-slate-900 min-w-[28px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.maxStock}
                          className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <span className="text-sm font-bold text-emerald-700">
                        {formatPrice(item.price * item.quantity, currencySymbol)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Summary */}
          {cart.length > 0 && (
            <div className="border-t border-gray-100 bg-white p-6 space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Subtotal ({totalItems} items)</span>
                  <span className="font-semibold text-slate-900">
                    {formatPrice(subtotal, currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Shipping & taxes calculated at checkout</span>
                  <span className="text-emerald-600 font-medium">Cash on Delivery</span>
                </div>
              </div>

              <div className="space-y-2">
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full flex items-center justify-center gap-2 bg-[#FF6448] hover:bg-[#e8553b] text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-[#FF6448]/25 transition-all min-h-[44px]"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-full text-center py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
