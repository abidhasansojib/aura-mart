"use client";

import React, { useState } from "react";
import { X, Search, PackageCheck, CheckCircle2, AlertCircle, ShoppingBag, Ban, Truck } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencySymbol?: string;
}

interface OrderItemData {
  id: string;
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

  const getStepIndex = (status: string) => {
    return STATUS_STEPS.indexOf(status);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl transition-all border border-gray-100">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-slate-900">Track Your Orders</h3>
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
            <div className="flex gap-2">
              <input
                id="track-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 01712345678"
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 min-h-[44px]"
              />
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium rounded-xl text-sm transition-colors min-h-[44px] shrink-0"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    <span>Search</span>
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
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
                        <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          Pending Store Confirmation
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setCancelError(null);
                            setCancellingOrder(order);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-600 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 min-h-[36px]"
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
                      <div className="pl-5 space-y-0.5">
                        {order.items.map((it) => (
                          <div key={it.id} className="flex justify-between">
                            <span className="truncate pr-2">
                              • {it.productName} × {it.quantity}
                            </span>
                            <span className="shrink-0 font-medium">
                              {formatPrice(it.priceAtPurchase * it.quantity, currencySymbol)}
                            </span>
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
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-slate-900 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 min-h-[40px]"
                  >
                    <option value="Ordered by mistake">Ordered by mistake</option>
                    <option value="Want to change delivery address">Want to change delivery address</option>
                    <option value="Want to change items or quantity">Want to change items/quantity</option>
                    <option value="No longer needed">No longer needed</option>
                    <option value="Other">Other</option>
                  </select>

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

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    disabled={cancellingLoading}
                    onClick={() => setCancellingOrder(null)}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Keep Order
                  </button>
                  <button
                    type="button"
                    disabled={cancellingLoading}
                    onClick={handleConfirmCancel}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
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
        </div>
      </div>
    </div>
  );
}
