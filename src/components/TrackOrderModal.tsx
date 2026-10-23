"use client";

import React, { useState } from "react";
import { X, Search, PackageCheck, CheckCircle2, AlertCircle, ShoppingBag } from "lucide-react";
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
  items: OrderItemData[];
}

const STATUS_STEPS = ["Pending", "Confirmed", "Shipped", "Delivered"];

export function TrackOrderModal({ isOpen, onClose, currencySymbol = "৳" }: TrackOrderModalProps) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<OrderData[] | null>(null);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 5) {
      setErrorMsg("Please enter a valid phone number.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
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
            <label htmlFor="track-phone" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
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
                        <span>This order was cancelled.</span>
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

                    {/* Ordered Items Preview */}
                    <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-gray-200/50">
                      <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <ShoppingBag className="h-3.5 w-3.5 text-slate-400" />
                        <span>Items ({order.items.length}):</span>
                      </div>
                      <div className="pl-5 space-y-0.5">
                        {order.items.map((it) => (
                          <div key={it.id} className="flex justify-between">
                            <span className="truncate pr-2">• {it.productName} × {it.quantity}</span>
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
        </div>
      </div>
    </div>
  );
}
