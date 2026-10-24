"use client";

import React, { useState } from "react";
import { X, Search, PackageCheck, CheckCircle2, AlertCircle, ShoppingBag, Ban, Truck, Star, Send, Loader2, ChevronDown } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencySymbol?: string;
}

interface OrderItemData {
  id: string;
  productId?: string | null;
  productName: string;
  quantity: number;
  priceAtPurchase: number;
}

interface OrderData {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  deliveryZone: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  courierName?: string | null;
  courierTrackingCode?: string | null;
  items: OrderItemData[];
}

function getCourierTrackingUrl(courier?: string | null, code?: string | null): string | null {
  if (!code) return null;
  const cleanCourier = (courier || "").toLowerCase().trim();
  const cleanCode = encodeURIComponent(code.trim());
  if (cleanCourier.includes("steadfast")) {
    return `https://steadfast.com.bd/t/${cleanCode}`;
  }
  if (cleanCourier.includes("pathao")) {
    return `https://merchant.pathao.com/tracking?consignment_id=${cleanCode}`;
  }
  if (cleanCourier.includes("redx")) {
    return `https://redx.com.bd/track/${cleanCode}`;
  }
  return null;
}

const STATUS_STEPS = ["Pending", "Confirmed", "Shipped", "Delivered"];

export function TrackOrderModal({ isOpen, onClose, currencySymbol = "৳" }: TrackOrderModalProps) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<OrderData[] | null>(null);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cancellation state
  const [cancellingOrder, setCancellingOrder] = useState<OrderData | null>(null);
  const [cancelReason, setCancelReason] = useState("Ordered by mistake");
  const [customReason, setCustomReason] = useState("");
  const [cancellingLoading, setCancellingLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  // Review state
  const [reviewingItem, setReviewingItem] = useState<{
    item: OrderItemData;
    order: OrderData;
  } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 5) {
      setErrorMsg("Please enter a valid phone number.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setCancelSuccessMsg(null);
    try {
      const res = await fetch(`/api/orders?phone=${encodeURIComponent(phone.trim())}`);
      if (!res.ok) {
        throw new Error("Failed to look up orders");
      }
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
      setSearched(true);
    } catch {
      setErrorMsg("Failed to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingOrder) return;
    setCancellingLoading(true);
    setCancelError(null);

    const finalReason =
      cancelReason === "Other" && customReason.trim() ? customReason.trim() : cancelReason;

    try {
      const res = await fetch(`/api/orders/${cancellingOrder.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerPhone: phone.trim() || cancellingOrder.customerPhone,
          reason: finalReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel order");
      }

      setOrders((prev) =>
        prev
          ? prev.map((o) => (o.id === cancellingOrder.id ? { ...o, status: "Cancelled" } : o))
          : null
      );
      setCancelSuccessMsg(`Order #${cancellingOrder.orderNumber} has been cancelled successfully.`);
      setCancellingOrder(null);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Error cancelling order");
    } finally {
      setCancellingLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingItem) return;
    setReviewError(null);
    setReviewSuccessMsg(null);

    if (!reviewComment.trim() || reviewComment.trim().length < 5) {
      setReviewError("Please write at least 5 characters for your review.");
      return;
    }

    setReviewLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: reviewingItem.item.productId || reviewingItem.item.productName,
          orderNumber: reviewingItem.order.orderNumber,
          customerPhone: reviewingItem.order.customerPhone,
          customerName: reviewingItem.order.customerName,
          rating: reviewRating,
          comment: reviewComment.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setReviewError(data.error || "Failed to submit review.");
      } else {
        setReviewSuccessMsg("Thank you! Your verified review has been submitted for moderation and will appear once approved by our team.");
        setReviewComment("");
        setTimeout(() => {
          setReviewingItem(null);
          setReviewSuccessMsg(null);
        }, 3000);
      }
    } catch {
      setReviewError("An unexpected error occurred. Please try again.");
    } finally {
      setReviewLoading(false);
    }
  };

  const getStepIndex = (status: string) => {
    return STATUS_STEPS.indexOf(status);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
        <div className="relative w-full max-w-xl rounded-3xl bg-white p-4 xs:p-5 sm:p-6 shadow-2xl transition-all border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-emerald-600" />
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Track Your Orders</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleTrack} className="mt-4">
            <label
              htmlFor="track-phone"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5"
            >
              Enter the phone number used at checkout
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                id="track-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 01712345678 (11 digits)"
                className="w-full flex-1 min-w-0 rounded-xl border border-gray-200 px-3.5 sm:px-4 py-2.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 min-h-[44px]"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-xl text-sm transition-all min-h-[44px] shrink-0 shadow-sm shadow-emerald-600/20 active:scale-95"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    <span>Search Orders</span>
                  </>
                )}
              </button>
            </div>
            {errorMsg && <p className="text-xs text-rose-600 mt-2">{errorMsg}</p>}
            {cancelSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 mt-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{cancelSuccessMsg}</span>
              </div>
            )}
          </form>

          {/* Results Container */}
          <div className="mt-6 max-h-[60vh] overflow-y-auto space-y-4 pr-1">
            {searched && orders && orders.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <AlertCircle className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-medium text-slate-700">No orders found for this number.</p>
                <p className="text-xs text-slate-400 mt-1">
                  Please double-check the phone number or place a new order.
                </p>
              </div>
            )}

            {orders &&
              orders.map((order) => {
                const currentStepIdx = getStepIndex(order.status);
                const isCancelled = order.status === "Cancelled";
                const isPending = order.status === "Pending";
                const isConfirmedOrLater =
                  order.status === "Confirmed" ||
                  order.status === "Shipped" ||
                  order.status === "Delivered";

                return (
                  <div
                    key={order.id}
                    className="p-4 rounded-xl border border-gray-200 bg-neutral-50 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/60 pb-3">
                      <div>
                        <span className="text-xs font-bold text-emerald-700 font-mono tracking-wider">
                          {order.orderNumber}
                        </span>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-900">
                          {formatPrice(order.totalAmount, currencySymbol)}
                        </span>
                        <span className="block text-[11px] text-slate-500 uppercase font-medium">
                          {order.paymentMethod}
                        </span>
                      </div>
                    </div>

                    {/* Visual Status Stepper */}
                    {isCancelled ? (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                        <span>This order was cancelled. Items were returned to inventory.</span>
                      </div>
                    ) : (
                      <div className="py-2">
                        <div className="grid grid-cols-4 gap-1 text-center relative">
                          {STATUS_STEPS.map((step, idx) => {
                            const isDone = currentStepIdx >= idx;
                            const isCurrent = currentStepIdx === idx;

                            return (
                              <div key={step} className="flex flex-col items-center">
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                    isCurrent
                                      ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                                      : isDone
                                      ? "bg-emerald-500 text-white"
                                      : "bg-gray-200 text-slate-500"
                                  }`}
                                >
                                  {isDone ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                  ) : (
                                    <span>{idx + 1}</span>
                                  )}
                                </div>
                                <span
                                  className={`text-[10px] mt-1.5 font-medium leading-tight ${
                                    isCurrent ? "text-emerald-700 font-bold" : "text-slate-500"
                                  }`}
                                >
                                  {step}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Courier Tracking Dispatch Pill */}
                    {order.courierTrackingCode && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Truck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          <span>
                            {order.courierName || "Courier"}: <b>{order.courierTrackingCode}</b>
                          </span>
                        </span>
                        {(() => {
                          const trackUrl = getCourierTrackingUrl(order.courierName, order.courierTrackingCode);
                          return trackUrl ? (
                            <a
                              href={trackUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-blue-700 hover:text-blue-900 underline text-[11px]"
                            >
                              Track Live Parcel ↗
                            </a>
                          ) : null;
                        })()}
                      </div>
                    )}

                    {/* Pending Action Bar: Cancel Order */}
                    {isPending && (
                      <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2.5 pt-2 border-t border-gray-200/50">
                        <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-center xs:text-left">
                          Pending Store Confirmation
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setCancelError(null);
                            setCancellingOrder(order);
                          }}
                          className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-600 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[38px] active:scale-95 shadow-xs"
                        >
                          <Ban className="h-3.5 w-3.5" />
                          <span>Cancel Order</span>
                        </button>
                      </div>
                    )}

                    {/* Confirmed Lockout Notice */}
                    {isConfirmedOrLater && !isCancelled && (
                      <div className="pt-2 border-t border-gray-200/50 flex items-center justify-between text-[11px]">
                        <span className="text-blue-700 font-bold">✓ Confirmed & Processing</span>
                        <span className="text-slate-400">Cannot be cancelled online</span>
                      </div>
                    )}

                    {/* Ordered Items Preview */}
                    <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-gray-200/50">
                      <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <ShoppingBag className="h-3.5 w-3.5 text-slate-400" />
                        <span>Items ({order.items.length}):</span>
                      </div>
                      <div className="pl-5 space-y-1.5">
                        {order.items.map((it) => (
                          <div key={it.id} className="flex items-center justify-between gap-2">
                            <span className="truncate pr-2">
                              • {it.productName} × {it.quantity}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-medium text-slate-700">
                                {formatPrice(it.priceAtPurchase * it.quantity, currencySymbol)}
                              </span>
                              {it.productId && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReviewError(null);
                                    setReviewSuccessMsg(null);
                                    setReviewingItem({ item: it, order });
                                  }}
                                  className="px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200/60 flex items-center gap-1 transition-colors"
                                  title="Write a verified review"
                                >
                                  <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                                  <span>Review</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Cancellation Confirmation Dialog Overlay inside Track Modal */}
          {cancellingOrder && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <Ban className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Cancel Order #{cancellingOrder.orderNumber}
                      </h4>
                      <p className="text-[11px] text-slate-500">Only pending orders can be cancelled</p>
                    </div>
                  </div>
                  <button
                    disabled={cancellingLoading}
                    onClick={() => setCancellingOrder(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-600">
                  Are you sure you want to cancel this order? This cannot be undone.
                </p>

                {cancelError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                    {cancelError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">
                    Reason for Cancellation
                  </label>
                  <div className="relative">
                    <select
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full appearance-none pl-3.5 pr-9 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 text-xs font-semibold text-slate-900 bg-neutral-50/70 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-xs transition-all cursor-pointer min-h-[42px]"
                    >
                      <option value="Ordered by mistake">Ordered by mistake</option>
                      <option value="Want to change delivery address">Want to change delivery address</option>
                      <option value="Want to change items or quantity">Want to change items/quantity</option>
                      <option value="No longer needed">No longer needed</option>
                      <option value="Other">Other</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  </div>

                  {cancelReason === "Other" && (
                    <input
                      type="text"
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Specify reason..."
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-slate-900 mt-1"
                    />
                  )}
                </div>

                <div className="flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    disabled={cancellingLoading}
                    onClick={() => setCancellingOrder(null)}
                    className="w-full xs:w-auto px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors min-h-[40px]"
                  >
                    Keep Order
                  </button>
                  <button
                    type="button"
                    disabled={cancellingLoading}
                    onClick={handleConfirmCancel}
                    className="w-full xs:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all min-h-[40px] active:scale-95"
                  >
                    {cancellingLoading ? (
                      <>
                        <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Cancelling...</span>
                      </>
                    ) : (
                      <>
                        <Ban className="h-3.5 w-3.5" />
                        <span>Confirm Cancel</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Item Review Dialog Overlay */}
          {reviewingItem && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <form
                onSubmit={handleSubmitReview}
                className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 truncate max-w-[200px]">
                        Review: {reviewingItem.item.productName}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Order #{reviewingItem.order.orderNumber}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={reviewLoading}
                    onClick={() => setReviewingItem(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {reviewError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                    {reviewError}
                  </div>
                )}

                {reviewSuccessMsg && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{reviewSuccessMsg}</span>
                  </div>
                )}

                {/* Rating selection */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Your Rating
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`h-5 w-5 ${
                            star <= reviewRating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-600 ml-2">
                      {reviewRating} / 5
                    </span>
                  </div>
                </div>

                {/* Review comment */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Review Feedback
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Tell other shoppers how the product quality and packaging were..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-slate-900 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    disabled={reviewLoading}
                    onClick={() => setReviewingItem(null)}
                    className="w-full xs:w-auto px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors min-h-[40px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reviewLoading}
                    className="w-full xs:w-auto px-4 py-2.5 bg-[#181A1D] hover:bg-black disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all min-h-[40px] active:scale-95"
                  >
                    {reviewLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span>Submit Review</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
