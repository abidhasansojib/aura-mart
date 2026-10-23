"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  imageUrl: string;
  quantity: number;
  maxStock: number;
}

export interface CartProductInput {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  imageUrl: string;
  stock: number;
}

interface CartContextType {
  cart: CartItem[];
  addItem: (product: CartProductInput, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  totalItems: number;
  subtotal: number;
}

const CART_STORAGE_KEY = "ecommerce_cart_v1";

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Failed to load cart from localStorage:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      } catch (e) {
        console.warn("Failed to save cart to localStorage:", e);
      }
    }
  }, [cart, isLoaded]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 3200);
  };

  const addItem = (product: CartProductInput, qty: number = 1) => {
    if (product.stock <= 0) return;

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.productId === product.id);
      if (existingIndex > -1) {
        const existing = prev[existingIndex];
        const newQty = Math.min(existing.quantity + qty, product.stock);
        const updated = [...prev];
        updated[existingIndex] = { ...existing, quantity: newQty, maxStock: product.stock };
        return updated;
      } else {
        const initialQty = Math.min(qty, product.stock);
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            imageUrl: product.imageUrl,
            quantity: initialQty,
            maxStock: product.stock,
          },
        ];
      }
    });

    showToast(`Added "${product.name}" to cart!`);
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, qty: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const clampedQty = Math.max(1, Math.min(qty, item.maxStock));
            return { ...item, quantity: clampedQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => {
    setCart([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (e) {
      console.warn("Failed to clear localStorage cart:", e);
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        totalItems,
        subtotal,
      }}
    >
      {children}

      {/* Floating Emerald Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-white shadow-xl ring-1 ring-white/10 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium pr-2">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white transition-colors p-1"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
