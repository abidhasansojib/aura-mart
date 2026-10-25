/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Printer,
  ArrowLeft,
  AlertCircle,
  Phone,
  MapPin,
  CreditCard,
  Banknote,
  Ticket,
  Sparkles,
  Ban,
  X,
  MessageCircle,
  Clock,
  ChevronDown,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import {
  BANGLADESH_DISTRICTS,
  isInsideLocalCity,
  getEstimatedDeliveryTurnaround,
} from "@/lib/districts";

interface StoreSettings {
  storeName: string;
  storeBadge?: string;
  logoUrl?: string;
  tagline: string;
  announcementText: string;
  supportPhone: string;
  bkashNumber: string;
  nagadNumber: string;
  insideCityDelivery: number;
  outsideCityDelivery: number;
  currencySymbol: string;
  enableCod?: boolean;
  enableBkash?: boolean;
  enableNagad?: boolean;
  enableRocket?: boolean;
  rocketNumber?: string;
  freeShippingThreshold?: number;
  isStoreOpen?: boolean;
  storeClosedNotice?: string;
  shopCity?: string;
  shopAddress?: string;
  whatsappNumber?: string;
}

interface OrderItemData {
  id: string;
  productName: string;
  productImage: string;
  quantity: number;
  priceAtPurchase: number;
}

interface CompletedOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  deliveryZone: string;
  deliveryCharge: number;
  subtotal: number;
  totalAmount: number;
  paymentMethod: string;
  paymentSenderNo?: string | null;
  trxId?: string | null;
  orderNote?: string | null;
  status: string;
  createdAt: string;
  items: OrderItemData[];
}

export default function CheckoutPage() {
  const { cart, subtotal, totalItems, clearCart } = useCart();

  // Settings
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: "Official Store",
    storeBadge: "Verified Online Store",
    tagline: "Quality Products Delivered to Your Doorstep",
    announcementText: "🚚 Cash on Delivery Available Nationwide! Fast Express Shipping.",
    supportPhone: "01700000000",
    bkashNumber: "01700000000 (Personal/Send Money)",
    nagadNumber: "01700000000 (Personal/Send Money)",
    insideCityDelivery: 60,
    outsideCityDelivery: 120,
    currencySymbol: "৳",
    enableCod: true,
    enableBkash: true,
    enableNagad: true,
    enableRocket: false,
    rocketNumber: "01700000000 (Personal)",
    freeShippingThreshold: 0,
    isStoreOpen: true,
    storeClosedNotice: "We are currently restocking our inventory. Orders will resume shortly!",
  });

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("Bogura");
  const [deliveryZone, setDeliveryZone] = useState<"Inside City" | "Outside City">("Inside City");
  const [orderNote, setOrderNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "bKash" | "Nagad" | "Rocket">("COD");
  const [paymentSenderNo, setPaymentSenderNo] = useState("");
  const [trxId, setTrxId] = useState("");

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // UI state
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cartValidationWarning, setCartValidationWarning] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(null);

  // Cancellation state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("Ordered by mistake");
  const [customCancelReason, setCustomCancelReason] = useState("");
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  const handleCancelCompletedOrder = async () => {
    if (!completedOrder) return;
    setIsCancellingOrder(true);
    setCancelError(null);

    const reasonText =
      cancelReason === "Other" && customCancelReason.trim()
        ? customCancelReason.trim()
        : cancelReason;

    try {
      const res = await fetch(`/api/orders/${completedOrder.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerPhone: completedOrder.customerPhone,
          reason: reasonText,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel order");
      }

      setCompletedOrder((prev) => (prev ? { ...prev, status: "Cancelled" } : null));
      setCancelSuccessMsg(data.message || "Your order has been cancelled successfully.");
      setIsCancelModalOpen(false);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Error cancelling order");
    } finally {
      setIsCancellingOrder(false);
    }
  };

  // Fetch latest settings on mount
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setSettings((prev) => ({ ...prev, ...data }));
          if (data.shopCity) {
            const matched = BANGLADESH_DISTRICTS.find(
              (d) =>
                d.name.toLowerCase() === data.shopCity.toLowerCase() ||
                isInsideLocalCity(d.name, data.shopCity)
            );
            if (matched) {
              setSelectedDistrict(matched.name);
              setDeliveryZone("Inside City");
            }
          }
          if (data.enableCod === false && data.enableBkash) {
            setPaymentMethod("bKash");
          } else if (data.enableCod === false && data.enableNagad) {
            setPaymentMethod("Nagad");
          }
        }
      })
      .catch((err) => console.warn("Could not load dynamic store settings:", err));
  }, []);

  // Pre-checkout cart stock validation
  useEffect(() => {
    if (cart.length > 0) {
      fetch("/api/cart/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((c) => ({ productId: c.productId, quantity: c.quantity })),
        }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.hasChanges) {
            setCartValidationWarning(
              "Note: Some items in your shopping bag have stock or availability changes. Please review your order."
            );
          }
        })
        .catch(() => {});
    }
  }, [cart]);

  const isFreeShipping = Boolean(
    settings.freeShippingThreshold &&
    settings.freeShippingThreshold > 0 &&
    subtotal >= settings.freeShippingThreshold
  );

  const deliveryCharge = isFreeShipping
    ? 0
    : deliveryZone === "Inside City"
    ? settings.insideCityDelivery
    : settings.outsideCityDelivery;

  const discountAmount = appliedCoupon?.discountAmount || 0;
  const grandTotal = Math.max(0, subtotal - discountAmount + deliveryCharge);
  const currencySymbol = settings.currencySymbol || "৳";

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setValidatingCoupon(true);
    setCouponError(null);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput.trim(), subtotal }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid coupon code");
      }

      setAppliedCoupon({ code: data.code, discountAmount: data.discountAmount });
      setCouponInput("");
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : "Failed to apply coupon");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleCopyPaymentNumber = (text: string) => {
    const rawNumber = text.split(" ")[0].replace(/[^0-9+]/g, "");
    navigator.clipboard.writeText(rawNumber);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2500);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!name.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setErrorMessage("Please enter a valid 11-digit mobile number.");
      return;
    }
    if (!address.trim() || address.trim().length < 5) {
      setErrorMessage("Please provide your full delivery address (Road/Street, Area, City).");
      return;
    }
    if (cart.length === 0) {
      setErrorMessage("Your cart is empty. Please add items before checking out.");
      return;
    }

    if (paymentMethod !== "COD") {
      if (!paymentSenderNo.trim()) {
        setErrorMessage(`Please enter your ${paymentMethod} sender number.`);
        return;
      }
      if (!trxId.trim()) {
        setErrorMessage(`Please enter the ${paymentMethod} Transaction ID (TrxID).`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const cleanAddress = address.trim();
      const formattedAddress = cleanAddress.toLowerCase().includes(selectedDistrict.toLowerCase())
        ? cleanAddress
        : `${cleanAddress}, ${selectedDistrict}`;

      const computedZone = isInsideLocalCity(selectedDistrict, settings.shopCity)
        ? "Inside City"
        : "Outside City";

      const payload = {
        customerName: name.trim(),
        customerPhone: phone.trim(),
        shippingAddress: formattedAddress,
        deliveryZone: computedZone,
        district: selectedDistrict,
        paymentMethod,
        paymentSenderNo: paymentMethod !== "COD" ? paymentSenderNo.trim() : null,
        trxId: paymentMethod !== "COD" ? trxId.trim() : null,
        orderNote: orderNote.trim() || null,
        couponCode: appliedCoupon?.code || null,
        discountAmount: appliedCoupon?.discountAmount || 0,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to place order.");
      }

      // Success
      clearCart();
      setCompletedOrder(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Order checkout error:", err);
      const msg = err instanceof Error ? err.message : "Something went wrong while placing your order.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 1. ORDER CONFIRMATION / PRINTABLE RECEIPT VIEW
  // ---------------------------------------------------------------------------
  if (completedOrder) {
    return (
      <div className="min-h-screen bg-[#CBD5CE] py-6 sm:py-12 px-3 sm:px-6 lg:px-8 selection:bg-[#FF6448] selection:text-white">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Action Bar (hidden when printing) */}
          <div className="print:hidden flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors py-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Store</span>
            </Link>

            <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full sm:w-auto">
              {completedOrder.status === "Pending" && (
                <button
                  onClick={() => setIsCancelModalOpen(true)}
                  className="w-full xs:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors min-h-[44px]"
                  title="Cancel this order before store confirmation"
                >
                  <Ban className="h-4 w-4 text-rose-600" />
                  <span>Cancel Order</span>
                </button>
              )}

              <button
                onClick={() => window.print()}
                className="w-full xs:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-sm min-h-[44px]"
              >
                <Printer className="h-4 w-4" />
                <span>Print / Save Receipt (PDF)</span>
              </button>
            </div>
          </div>

          {/* Celebratory / Status Banner (hidden when printing) */}
          {completedOrder.status === "Cancelled" ? (
            <div className="print:hidden text-center space-y-2 py-4 bg-rose-50/70 border border-rose-200 rounded-3xl p-6">
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-md">
                <Ban className="h-10 w-10 text-rose-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-rose-950 tracking-tight">
                Order Cancelled
              </h1>
              <p className="text-sm text-rose-800 max-w-md mx-auto">
                {cancelSuccessMsg || `Order #${completedOrder.orderNumber} has been cancelled successfully. All items have been returned to active stock.`}
              </p>
            </div>
          ) : (
            <div className="print:hidden text-center space-y-2 py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Order Placed!
              </h1>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Thank you, <span className="font-semibold text-slate-900">{completedOrder.customerName}</span>! Your order has been placed and is awaiting confirmation.
              </p>
            </div>
          )}

          {/* Printable Thermal / A4 Packing Slip Card */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden print:shadow-none print:border print:rounded-none p-6 sm:p-8 space-y-6">
            {/* Invoice Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-200 gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {settings.storeName}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{settings.tagline}</p>
                {settings.supportPhone && (
                  <p className="text-xs text-slate-600 font-medium mt-1">
                    Hotline: {settings.supportPhone}
                  </p>
                )}
              </div>

              <div className="sm:text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Order Number
                </span>
                <span className="text-lg font-black text-emerald-700 font-mono">
                  {completedOrder.orderNumber}
                </span>
                <span className="text-xs text-slate-500 block mt-0.5">
                  {new Date(completedOrder.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <div className="mt-2 flex sm:justify-end">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      completedOrder.status === "Cancelled"
                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                        : completedOrder.status === "Pending"
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-blue-100 text-blue-800 border border-blue-200"
                    }`}
                  >
                    ● {completedOrder.status === "Pending" ? "Pending Confirmation" : completedOrder.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer & Delivery Snapshot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 bg-neutral-50 p-4 rounded-2xl border border-gray-100">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 block text-xs">Customer Details:</span>
                <p className="text-slate-800 font-medium">{completedOrder.customerName}</p>
                <p className="text-slate-700 flex items-center gap-1">
                  <Phone className="h-3 w-3 text-slate-400" />
                  {completedOrder.customerPhone}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-900 block text-xs">Delivery Address:</span>
                <p className="text-slate-800 flex items-start gap-1">
                  <MapPin className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    {completedOrder.shippingAddress} ({completedOrder.deliveryZone})
                  </span>
                </p>
                {completedOrder.orderNote && (
                  <p className="text-slate-500 italic mt-1">
                    Note: &quot;{completedOrder.orderNote}&quot;
                  </p>
                )}
              </div>
            </div>

            {/* Payment Badge info */}
            <div className="flex items-center justify-between p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs">
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-emerald-950">
                  Payment Method: {completedOrder.paymentMethod}
                </span>
              </div>
              {completedOrder.paymentMethod !== "COD" && (
                <div className="text-right">
                  <span className="text-slate-500 block text-[11px]">
                    Sender: {completedOrder.paymentSenderNo}
                  </span>
                  <span className="font-mono font-bold text-emerald-800 text-xs">
                    TrxID: {completedOrder.trxId}
                  </span>
                </div>
              )}
            </div>

            {/* Ordered Items Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Order Summary ({completedOrder.items.length} items)
              </h3>
              <div className="divide-y divide-gray-100 border-y border-gray-100">
                {completedOrder.items.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-lg bg-neutral-100 overflow-hidden shrink-0 border border-gray-200">
                        <Image
                          src={item.productImage || "/placeholder-product.png"}
                          alt={item.productName}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 line-clamp-1">
                          {item.productName}
                        </p>
                        <p className="text-slate-500 text-[11px]">
                          {formatPrice(item.priceAtPurchase, currencySymbol)} × {item.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 font-mono">
                      {formatPrice(item.priceAtPurchase * item.quantity, currencySymbol)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Grand Total Calculation */}
            <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-mono font-semibold text-slate-800">
                  {formatPrice(completedOrder.subtotal, currencySymbol)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Delivery Charge ({completedOrder.deliveryZone})</span>
                <span className="font-mono font-semibold text-slate-800">
                  {formatPrice(completedOrder.deliveryCharge, currencySymbol)}
                </span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-3 border-t border-gray-200">
                <span>Total Payable</span>
                <span className="text-emerald-700 font-mono text-lg">
                  {formatPrice(completedOrder.totalAmount, currencySymbol)}
                </span>
              </div>
            </div>

            {/* Footer Trust Note on Slip */}
            <div className="text-center pt-4 border-t border-dashed border-gray-200 text-[11px] text-slate-400">
              <p>For questions regarding your delivery, contact our customer hotline at {settings.supportPhone}.</p>
              <p className="mt-1">Thank you for shopping with {settings.storeName}! Your parcel is being carefully prepared.</p>
            </div>
          </div>

          {/* Navigation & WhatsApp Confirmation Actions */}
          <div className="print:hidden flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            {settings.whatsappNumber && (
              <a
                href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                  `Hello ${settings.storeName}! I just placed Order #${completedOrder.orderNumber} for ${settings.currencySymbol}${completedOrder.totalAmount}.\nCustomer: ${completedOrder.customerName}\nPhone: ${completedOrder.customerPhone}\nDestination: ${completedOrder.shippingAddress}\nPlease confirm my delivery.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all min-h-[44px]"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Confirm via WhatsApp</span>
              </a>
            )}
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#FF6448] hover:bg-[#e8553b] text-white font-black py-3.5 px-8 rounded-2xl shadow-lg shadow-[#FF6448]/25 transition-all min-h-[44px]"
            >
              <span>Continue Shopping</span>
            </Link>
          </div>

          {/* Cancel Order Confirmation Modal */}
          {isCancelModalOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
                onClick={() => !isCancellingOrder && setIsCancelModalOpen(false)}
              />
              <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <Ban className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          Cancel Order #{completedOrder.orderNumber}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Pending confirmation cancellation
                        </p>
                      </div>
                    </div>
                    <button
                      disabled={isCancellingOrder}
                      onClick={() => setIsCancelModalOpen(false)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                    Are you sure you want to cancel this order? Reserved items will be released back to our inventory. You can only cancel before store confirmation.
                  </div>

                  {cancelError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                      {cancelError}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Reason for Cancellation
                    </label>
                    <div className="relative">
                      <select
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="w-full appearance-none pl-4 pr-10 py-3 rounded-2xl border border-gray-200 hover:border-gray-300 focus:border-rose-500 text-xs font-semibold text-slate-900 bg-neutral-50/70 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 shadow-xs transition-all cursor-pointer min-h-[44px]"
                      >
                        <option value="Ordered by mistake">Ordered by mistake</option>
                        <option value="Want to change shipping address or delivery zone">Want to change delivery address</option>
                        <option value="Want to change ordered products or quantity">Want to change products or quantity</option>
                        <option value="Found a better price or no longer needed">No longer needed</option>
                        <option value="Other">Other reason</option>
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>

                    {cancelReason === "Other" && (
                      <textarea
                        rows={2}
                        value={customCancelReason}
                        onChange={(e) => setCustomCancelReason(e.target.value)}
                        placeholder="Please specify why you wish to cancel..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 mt-2"
                      />
                    )}
                  </div>

                  <div className="flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      disabled={isCancellingOrder}
                      onClick={() => setIsCancelModalOpen(false)}
                      className="w-full xs:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors min-h-[42px] text-center"
                    >
                      Keep Order
                    </button>
                    <button
                      type="button"
                      disabled={isCancellingOrder}
                      onClick={handleCancelCompletedOrder}
                      className="w-full xs:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 min-h-[42px] active:scale-95"
                    >
                      {isCancellingOrder ? (
                        <>
                          <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Cancelling...</span>
                        </>
                      ) : (
                        <>
                          <Ban className="h-3.5 w-3.5" />
                          <span>Confirm Cancellation</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. EMPTY CART VIEW
  // ---------------------------------------------------------------------------
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#CBD5CE] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-gray-200 p-8 sm:p-10 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Your Cart is Empty</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            You don&apos;t have any products in your cart yet. Browse our store catalog to select your favorite items!
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors min-h-[44px]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Explore Products</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. 1-PAGE FRICTIONLESS CHECKOUT FORM
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#CBD5CE] text-slate-900 selection:bg-[#FF6448] selection:text-white">
      {/* Top Simple Header */}
      <header className="bg-white/95 border-b border-black/5 py-3.5 sm:py-4 px-4 sm:px-6 sticky top-0 z-20 backdrop-blur-md shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <ArrowLeft className="h-4 w-4 text-slate-500 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Return to Catalog
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {settings.logoUrl ? (
              <div className="h-9 sm:h-10 max-w-[130px] min-w-[36px] flex items-center justify-center shrink-0 rounded-xl bg-white p-1 shadow-xs border border-slate-200 overflow-hidden">
                <img
                  src={settings.logoUrl}
                  alt={settings.storeName}
                  className="h-full w-auto max-w-full object-contain rounded-lg"
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-[#181A1D] text-white flex items-center justify-center font-black text-xs shadow-sm">
                {settings.storeName.charAt(0)}
              </div>
            )}
            <span className="text-sm font-black text-slate-900 tracking-tight">{settings.storeName}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Secure 256-bit Checkout</span>
          </div>
        </div>
      </header>

      {/* Main Content Form */}
      <main className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-10">
        <form onSubmit={handleFormSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Customer Details, Delivery Zone & Payment Method */}
            <div className="lg:col-span-7 space-y-6">
              {/* Error Alert Box */}
              {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2.5 shadow-sm animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">Please check the following error:</p>
                    <p className="mt-0.5">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Cart Stock Update Warning */}
              {cartValidationWarning && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-start gap-2.5 shadow-sm animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">Cart Update Notice:</p>
                    <p className="mt-0.5">{cartValidationWarning}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCartValidationWarning(null)}
                    className="text-amber-500 hover:text-amber-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* 1. Customer Information Card */}
              <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-7 shadow-sm space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">1. Delivery Address</h2>
                    <p className="text-xs text-slate-500">
                      Where should our courier deliver your package?
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label
                      htmlFor="customerName"
                      className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="customerName"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Tanvir Rahman"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 min-h-[44px]"
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label
                      htmlFor="customerPhone"
                      className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="customerPhone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 01712345678"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 min-h-[44px]"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Our delivery courier will call this number before arrival.
                    </p>
                  </div>

                  {/* Destination District (Bangladesh) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Destination District (Bangladesh) <span className="text-rose-500">*</span></span>
                      <span className="text-[10px] text-slate-400 font-normal">All 64 districts</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedDistrict}
                        onChange={(e) => {
                          const newDist = e.target.value;
                          setSelectedDistrict(newDist);
                          if (isInsideLocalCity(newDist, settings.shopCity)) {
                            setDeliveryZone("Inside City");
                          } else {
                            setDeliveryZone("Outside City");
                          }
                        }}
                        className="w-full appearance-none pl-4 pr-10 py-3 rounded-2xl border border-gray-200 hover:border-gray-300 focus:border-emerald-600 text-base sm:text-sm font-semibold text-slate-900 bg-neutral-50/70 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs transition-all cursor-pointer min-h-[46px]"
                      >
                        {BANGLADESH_DISTRICTS.map((d) => (
                          <option key={d.name} value={d.name} className="py-1">
                            {d.name} ({d.bnName}) — {d.division} Division
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none transition-transform" />
                    </div>

                    {/* Estimated Courier Turnaround Notice */}
                    {(() => {
                      const est = getEstimatedDeliveryTurnaround(selectedDistrict, settings.shopCity);
                      return (
                        <div className="mt-2 flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Clock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span>Estimated Delivery: <b>{est.days}</b></span>
                          </span>
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                            {est.badge}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Delivery Area Selection (Radio Cards) */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Select Delivery Area <span className="text-rose-500">*</span>
                      </label>
                      {isFreeShipping && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-emerald-600" />
                          <span>Free Delivery Unlocked</span>
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Inside City Card */}
                      <label
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          deliveryZone === "Inside City"
                            ? "border-emerald-600 bg-emerald-50/40 text-emerald-950"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="deliveryZone"
                            value="Inside City"
                            checked={deliveryZone === "Inside City"}
                            onChange={() => {
                              setDeliveryZone("Inside City");
                              const localMatch =
                                BANGLADESH_DISTRICTS.find((d) =>
                                  isInsideLocalCity(d.name, settings.shopCity)
                                )?.name || settings.shopCity || "Bogura";
                              setSelectedDistrict(localMatch);
                            }}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                          />
                          <div>
                            <span className="text-xs font-bold block">
                              Inside {settings.shopCity || "Bogura"}
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              Local delivery in {settings.shopCity || "Bogura"}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-black font-mono text-emerald-700">
                          {isFreeShipping ? "FREE" : formatPrice(settings.insideCityDelivery, currencySymbol)}
                        </span>
                      </label>

                      {/* Outside City Card */}
                      <label
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          deliveryZone === "Outside City"
                            ? "border-emerald-600 bg-emerald-50/40 text-emerald-950"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="deliveryZone"
                            value="Outside City"
                            checked={deliveryZone === "Outside City"}
                            onChange={() => {
                              setDeliveryZone("Outside City");
                              if (isInsideLocalCity(selectedDistrict, settings.shopCity)) {
                                setSelectedDistrict("Dhaka");
                              }
                            }}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                          />
                          <div>
                            <span className="text-xs font-bold block">
                              Outside {settings.shopCity || "Bogura"} / Nationwide
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              Courier to all other districts
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-black font-mono text-emerald-700">
                          {isFreeShipping ? "FREE" : formatPrice(settings.outsideCityDelivery, currencySymbol)}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Street Address */}
                  <div>
                    <label
                      htmlFor="shippingAddress"
                      className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      Full Street Address <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      id="shippingAddress"
                      required
                      rows={3}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="House / Flat No., Road, Sector / Area, Thana & District"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>

                  {/* Optional Note */}
                  <div>
                    <label
                      htmlFor="orderNote"
                      className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5"
                    >
                      Order Note (Optional)
                    </label>
                    <input
                      id="orderNote"
                      type="text"
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      placeholder="e.g. Call before delivery or deliver after 5 PM"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 text-base sm:text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 min-h-[40px]"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Payment Method Selector Card */}
              <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-7 shadow-sm space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">2. Payment Method</h2>
                    <p className="text-xs text-slate-500">
                      Choose how you would like to pay for your order.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Option 1: Cash on Delivery */}
                  {settings.enableCod !== false && (
                    <label
                      className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        paymentMethod === "COD"
                          ? "border-emerald-600 bg-emerald-50/30"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="COD"
                        checked={paymentMethod === "COD"}
                        onChange={() => setPaymentMethod("COD")}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Banknote className="h-4 w-4 text-emerald-600" />
                            Cash on Delivery (COD)
                          </span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                            Default & Most Popular
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          Pay in cash directly to the courier when you receive your parcel at your doorstep.
                        </p>
                      </div>
                    </label>
                  )}

                  {/* Option 2: bKash */}
                  {settings.enableBkash !== false && (
                    <label
                      className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        paymentMethod === "bKash"
                          ? "border-[#E2136E] bg-[#E2136E]/5"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bKash"
                        checked={paymentMethod === "bKash"}
                        onChange={() => setPaymentMethod("bKash")}
                        className="w-4 h-4 text-[#E2136E] focus:ring-[#E2136E] mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#E2136E]" />
                            bKash (Send Money)
                          </span>
                          <span className="text-[11px] font-bold text-[#E2136E] bg-[#E2136E]/10 px-2 py-0.5 rounded-full">
                            bKash
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Send payment directly from your bKash app and enter TrxID.
                        </p>
                      </div>
                    </label>
                  )}

                  {/* bKash Instructions Box (revealed when selected) */}
                  {paymentMethod === "bKash" && (
                    <div className="p-4 rounded-2xl bg-white border border-[#E2136E]/30 shadow-inner space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between bg-[#E2136E]/10 p-3 rounded-xl border border-[#E2136E]/20">
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                            bKash Number:
                          </span>
                          <span className="text-sm font-black font-mono text-[#E2136E]">
                            {settings.bkashNumber}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyPaymentNumber(settings.bkashNumber)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white text-slate-800 text-xs font-semibold rounded-lg shadow-sm border border-gray-200 hover:bg-slate-50 transition-colors shrink-0 active:scale-95 min-h-[36px]"
                        >
                          {copiedNumber ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 text-slate-500" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-600 space-y-1 bg-neutral-50 p-3 rounded-xl">
                        <p className="font-bold text-slate-800">Payment Steps:</p>
                        <p>
                          1. Open your bKash App and select{" "}
                          <b>
                            {settings.bkashNumber.toLowerCase().includes("agent")
                              ? "Cash In"
                              : settings.bkashNumber.toLowerCase().includes("merchant")
                              ? "Make Payment"
                              : "Send Money"}
                          </b>
                          {settings.bkashNumber.toLowerCase().includes("agent")
                            ? " (or visit any nearby bKash agent)"
                            : ""}
                          .
                        </p>
                        <p>2. Enter the bKash Number above and the Exact Total Amount: <b>{formatPrice(grandTotal, currencySymbol)}</b>.</p>
                        <p>3. Copy your <b>Transaction ID (TrxID)</b> and enter it below.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                            bKash Sender Number <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="tel"
                            required
                            value={paymentSenderNo}
                            onChange={(e) => setPaymentSenderNo(e.target.value)}
                            placeholder="01XXXXXXXXX"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-base sm:text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E2136E]/20 focus:border-[#E2136E] min-h-[42px]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                            Transaction ID (TrxID) <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={trxId}
                            onChange={(e) => setTrxId(e.target.value)}
                            placeholder="e.g. BL92A8ZK1"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-base sm:text-xs text-slate-900 uppercase font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#E2136E]/20 focus:border-[#E2136E] min-h-[42px]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Option 3: Nagad */}
                  {settings.enableNagad !== false && (
                    <>
                      <label
                        className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          paymentMethod === "Nagad"
                            ? "border-[#F7941D] bg-[#F7941D]/5"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="Nagad"
                          checked={paymentMethod === "Nagad"}
                          onChange={() => setPaymentMethod("Nagad")}
                          className="w-4 h-4 text-[#F7941D] focus:ring-[#F7941D] mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#F7941D]" />
                              Nagad (Send Money)
                            </span>
                            <span className="text-[11px] font-bold text-[#F7941D] bg-[#F7941D]/10 px-2 py-0.5 rounded-full">
                              Nagad
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Send payment directly from your Nagad app and enter TrxID.
                          </p>
                        </div>
                      </label>

                      {/* Nagad Instructions Box (revealed when selected) */}
                      {paymentMethod === "Nagad" && (
                        <div className="p-4 rounded-2xl bg-white border border-[#F7941D]/30 shadow-inner space-y-3 animate-in fade-in">
                          <div className="flex items-center justify-between bg-[#F7941D]/10 p-3 rounded-xl border border-[#F7941D]/20">
                            <div>
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                                Nagad Number:
                              </span>
                              <span className="text-sm font-black font-mono text-[#F7941D]">
                                {settings.nagadNumber}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyPaymentNumber(settings.nagadNumber)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-white text-slate-800 text-xs font-semibold rounded-lg shadow-sm border border-gray-200 hover:bg-slate-50 transition-colors shrink-0 active:scale-95 min-h-[36px]"
                            >
                              {copiedNumber ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  <span className="text-emerald-700">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="text-[11px] text-slate-600 space-y-1 bg-neutral-50 p-3 rounded-xl">
                            <p className="font-bold text-slate-800">Payment Steps:</p>
                            <p>
                              1. Open your Nagad App and select{" "}
                              <b>
                                {settings.nagadNumber.toLowerCase().includes("agent")
                                  ? "Cash Out"
                                  : settings.nagadNumber.toLowerCase().includes("merchant")
                                  ? "Merchant Payment"
                                  : "Send Money"}
                              </b>
                              {settings.nagadNumber.toLowerCase().includes("agent")
                                ? " (or visit any nearby Nagad agent)"
                                : ""}
                              .
                            </p>
                            <p>2. Enter the Nagad Number above and the Exact Total Amount: <b>{formatPrice(grandTotal, currencySymbol)}</b>.</p>
                            <p>3. Copy your <b>Transaction ID (TrxID)</b> and enter it below.</p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                                Nagad Sender Number <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="tel"
                                required
                                value={paymentSenderNo}
                                onChange={(e) => setPaymentSenderNo(e.target.value)}
                                placeholder="01XXXXXXXXX"
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-base sm:text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#F7941D]/20 focus:border-[#F7941D] min-h-[42px]"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                                Transaction ID (TrxID) <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={trxId}
                                onChange={(e) => setTrxId(e.target.value)}
                                placeholder="e.g. 7GA619B0"
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-base sm:text-xs text-slate-900 uppercase font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#F7941D]/20 focus:border-[#F7941D] min-h-[42px]"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Option 4: Dutch-Bangla Rocket */}
                  {settings.enableRocket && (
                    <label
                      className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        paymentMethod === "Rocket"
                          ? "border-purple-600 bg-purple-50/20"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="Rocket"
                        checked={paymentMethod === "Rocket"}
                        onChange={() => setPaymentMethod("Rocket")}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500 mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                            Dutch-Bangla Rocket
                          </span>
                          <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                            Rocket
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Send payment from your Rocket account and enter TrxID.
                        </p>
                      </div>
                    </label>
                  )}

                  {/* Rocket Instructions Box */}
                  {paymentMethod === "Rocket" && settings.enableRocket && (
                    <div className="p-4 rounded-2xl bg-white border border-purple-300 shadow-inner space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between bg-purple-50 p-3 rounded-xl border border-purple-200">
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                            Rocket 12-Digit Number:
                          </span>
                          <span className="text-sm font-black font-mono text-purple-700">
                            {settings.rocketNumber || "01XXXXXXXXXX"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyPaymentNumber(settings.rocketNumber || "")}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white text-slate-800 text-xs font-semibold rounded-lg shadow-sm border border-gray-200 hover:bg-slate-50 transition-colors shrink-0 active:scale-95 min-h-[36px]"
                        >
                          {copiedNumber ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 text-slate-500" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-600 space-y-1 bg-neutral-50 p-3 rounded-xl">
                        <p className="font-bold text-slate-800">Payment Steps:</p>
                        <p>
                          1. Open your DBBL Rocket App or dial *322# and select{" "}
                          <b>
                            {settings.rocketNumber?.toLowerCase().includes("agent")
                              ? "Cash Out"
                              : settings.rocketNumber?.toLowerCase().includes("merchant")
                              ? "Payment"
                              : "Send Money"}
                          </b>
                          {settings.rocketNumber?.toLowerCase().includes("agent")
                            ? " (or visit any nearby Rocket agent)"
                            : ""}
                          .
                        </p>
                        <p>2. Enter the 12-digit Rocket Number above and Amount: <b>{formatPrice(grandTotal, currencySymbol)}</b>.</p>
                        <p>3. Copy your <b>Transaction ID (TrxID)</b> and enter it below.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                            Rocket Sender Number <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="tel"
                            required
                            value={paymentSenderNo}
                            onChange={(e) => setPaymentSenderNo(e.target.value)}
                            placeholder="01XXXXXXXXXX"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-base sm:text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 min-h-[42px]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                            Transaction ID (TrxID) <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={trxId}
                            onChange={(e) => setTrxId(e.target.value)}
                            placeholder="e.g. 7GA619B0"
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-base sm:text-xs text-slate-900 uppercase font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 min-h-[42px]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Sticky Live Order Summary */}
            <div className="lg:col-span-5 sticky top-24 space-y-6">
              <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-7 shadow-lg space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h3 className="text-base font-bold text-slate-900">Order Summary</h3>
                  <span className="text-xs font-semibold text-slate-500">
                    {totalItems} {totalItems === 1 ? "Item" : "Items"}
                  </span>
                </div>

                {/* Cart Items List */}
                <div className="max-h-72 overflow-y-auto space-y-3 pr-1 divide-y divide-gray-100">
                  {cart.map((item) => (
                    <div key={item.productId} className="pt-3 first:pt-0 flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded-xl bg-neutral-100 overflow-hidden shrink-0 border border-gray-200">
                        <Image
                          src={item.imageUrl || "/placeholder-product.png"}
                          alt={item.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {formatPrice(item.price, currencySymbol)} × {item.quantity}
                        </p>
                      </div>
                      <span className="text-xs font-bold font-mono text-slate-900 shrink-0">
                        {formatPrice(item.price * item.quantity, currencySymbol)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Promo Code / Coupon Section */}
                <div className="p-4 bg-neutral-50 rounded-2xl border border-gray-200 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Ticket className="h-4 w-4 text-amber-500" />
                    <span>Have a Promo Code?</span>
                  </div>

                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold">
                      <div className="flex items-center gap-1.5 text-emerald-800">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="font-mono">{appliedCoupon.code}</span>
                        <span className="text-emerald-700">(-{formatPrice(appliedCoupon.discountAmount, currencySymbol)})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAppliedCoupon(null)}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex flex-col xs:flex-row gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => {
                            setCouponInput(e.target.value);
                            setCouponError(null);
                          }}
                          placeholder="e.g. WELCOME10 or FLAT100"
                          className="w-full flex-1 min-w-0 px-3 py-2 rounded-xl border border-gray-200 text-base sm:text-xs font-mono font-bold uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6448]/20 focus:border-[#FF6448] bg-white min-h-[40px]"
                        />
                        <button
                          type="button"
                          disabled={validatingCoupon || !couponInput.trim()}
                          onClick={handleApplyCoupon}
                          className="w-full xs:w-auto px-4 py-2 bg-[#181A1D] hover:bg-black disabled:bg-gray-200 disabled:text-slate-400 text-white font-bold text-xs rounded-xl shadow-sm transition-all min-h-[40px] shrink-0 active:scale-95 flex items-center justify-center text-center"
                        >
                          {validatingCoupon ? "Checking..." : "Apply"}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-[11px] font-semibold text-rose-600">{couponError}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Subtotal & Delivery Calculation */}
                <div className="space-y-2 pt-4 border-t border-gray-100 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-semibold font-mono text-slate-900">
                      {formatPrice(subtotal, currencySymbol)}
                    </span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Discount ({appliedCoupon?.code || "Coupon"})</span>
                      <span className="font-mono">-{formatPrice(discountAmount, currencySymbol)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <span>
                      Delivery Charge ({deliveryZone === "Inside City" ? `Inside ${settings.shopCity || "Bogura"}` : `Outside ${settings.shopCity || "Bogura"}`})
                    </span>
                    <span className="font-semibold font-mono text-slate-900">
                      {isFreeShipping ? (
                        <span className="text-emerald-700 font-bold">FREE (Promo Unlocked)</span>
                      ) : (
                        formatPrice(deliveryCharge, currencySymbol)
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-base font-black text-slate-900 pt-3 border-t border-gray-200">
                    <span>Total Amount</span>
                    <span className="text-emerald-700 font-mono text-xl">
                      {formatPrice(grandTotal, currencySymbol)}
                    </span>
                  </div>
                </div>

                {/* Maintenance Warning if store is paused */}
                {settings.isStoreOpen === false && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold text-amber-900">
                    {settings.storeClosedNotice || "Store is temporarily paused. Checkout disabled."}
                  </div>
                )}

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || settings.isStoreOpen === false}
                  className="w-full flex items-center justify-center gap-2 bg-[#FF6448] hover:bg-[#e8553b] disabled:bg-gray-300 disabled:text-slate-500 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-[#FF6448]/25 transition-all text-sm min-h-[48px]"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Confirming Order...</span>
                    </div>
                  ) : (
                    <span>Confirm Order — {formatPrice(grandTotal, currencySymbol)}</span>
                  )}
                </button>

                {/* Trust Badges under CTA */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-around text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    Verified Store
                  </span>
                  <span className="flex items-center gap-1">
                    <Truck className="h-3.5 w-3.5 text-emerald-600" />
                    Nationwide Delivery
                  </span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
