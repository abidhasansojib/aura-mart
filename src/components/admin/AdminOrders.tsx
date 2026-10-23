"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Phone,
  MessageSquare,
  Printer,
  ChevronDown,
  Package,
  X,
  MapPin,
  Download,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface OrderItem {
  id: string;
  productName: string;
  productImage: string;
  quantity: number;
  priceAtPurchase: number;
}

export interface AdminOrder {
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
  items: OrderItem[];
}

interface AdminOrdersProps {
  orders: AdminOrder[];
  currencySymbol?: string;
  storeName?: string;
  supportPhone?: string;
  onOrderUpdated: () => void;
}

const STATUS_OPTIONS = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];

export function AdminOrders({
  orders,
  currencySymbol = "৳",
  storeName = "Aura Mart",
  supportPhone = "01700000000",
  onOrderUpdated,
}: AdminOrdersProps) {
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [printableOrder, setPrintableOrder] = useState<AdminOrder | null>(null);

  // Status Counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: orders.length };
    STATUS_OPTIONS.forEach((s) => (counts[s] = 0));
    orders.forEach((o) => {
      if (counts[o.status] !== undefined) {
        counts[o.status]++;
      }
    });
    return counts;
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (selectedStatus !== "All" && o.status !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const matchesNumber = o.orderNumber.toLowerCase().includes(q);
        const matchesName = o.customerName.toLowerCase().includes(q);
        const matchesPhone = o.customerPhone.toLowerCase().includes(q);
        const matchesTrx = o.trxId ? o.trxId.toLowerCase().includes(q) : false;
        return matchesNumber || matchesName || matchesPhone || matchesTrx;
      }
      return true;
    });
  }, [orders, selectedStatus, searchQuery]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update order status");
      }

      onOrderUpdated();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update order");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Shipped":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Delivered":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Cancelled":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-gray-100 text-slate-700 border-gray-200";
    }
  };

  const formatWhatsAppUrl = (phone: string, customerName: string, orderNumber: string) => {
    const cleanNumber = phone.replace(/[^0-9]/g, "");
    const formatted = cleanNumber.startsWith("88") ? cleanNumber : `88${cleanNumber}`;
    const text = encodeURIComponent(
      `Hello ${customerName}, thank you for your order (${orderNumber}) at ${storeName}. We are preparing your package!`
    );
    return `https://wa.me/${formatted}?text=${text}`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Header, Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {["All", ...STATUS_OPTIONS].map((status) => {
            const isActive = selectedStatus === status;
            const count = statusCounts[status] || 0;
            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 min-h-[38px] ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-neutral-50 text-slate-600 hover:bg-slate-100 border border-gray-200"
                }`}
              >
                <span>{status}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? "bg-white/20 text-white" : "bg-gray-200 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Actions: Search Bar & Export CSV */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Order #, Name, Phone, TrxID..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 min-h-[40px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          <a
            href={`/api/admin/orders/export?status=${selectedStatus}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-sm shrink-0 min-h-[40px]"
            title="Download CSV for Steadfast / Pathao courier bulk upload"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* 2. Orders List Cards */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center max-w-md mx-auto space-y-3">
          <Package className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No orders found</h3>
          <p className="text-xs text-slate-500">
            {searchQuery
              ? `No orders matching "${searchQuery}".`
              : `There are currently no ${selectedStatus !== "All" ? selectedStatus.toLowerCase() : ""} orders.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isUpdating = updatingId === order.id;

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-sm space-y-4 hover:border-gray-300 transition-all"
              >
                {/* Order Top Bar: Order ID, Date, Amount & Status Dropdown */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-black font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                      {order.orderNumber}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadgeStyle(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-base font-black text-slate-900 font-mono">
                      {formatPrice(order.totalAmount, currencySymbol)}
                    </span>

                    {/* Status Updater Dropdown */}
                    <div className="relative">
                      <select
                        disabled={isUpdating}
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="appearance-none pl-3 pr-8 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-xs font-bold text-slate-800 rounded-xl border border-gray-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 min-h-[36px]"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            Set: {status}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                    </div>

                    {/* Print Packing Slip Button */}
                    <button
                      onClick={() => setPrintableOrder(order)}
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-neutral-100 border border-gray-200 transition-colors"
                      title="Print Courier Invoice / Packing Slip"
                      aria-label="Print Invoice"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Customer Details & Quick Contact Links */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Column 1: Customer Contact */}
                  <div className="space-y-1.5 bg-neutral-50 p-3.5 rounded-2xl border border-gray-100">
                    <span className="font-bold text-slate-900 block text-xs">
                      {order.customerName}
                    </span>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 text-emerald-700 font-semibold rounded-lg hover:bg-emerald-50 transition-colors"
                      >
                        <Phone className="h-3 w-3" />
                        <span>{order.customerPhone}</span>
                      </a>

                      <a
                        href={formatWhatsAppUrl(
                          order.customerPhone,
                          order.customerName,
                          order.orderNumber
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#25D366]/10 text-[#128C7E] font-semibold rounded-lg hover:bg-[#25D366]/20 transition-colors"
                      >
                        <MessageSquare className="h-3 w-3" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  {/* Column 2: Delivery Destination */}
                  <div className="space-y-1 bg-neutral-50 p-3.5 rounded-2xl border border-gray-100">
                    <span className="font-bold text-slate-900 block text-xs flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{order.deliveryZone}</span>
                    </span>
                    <p className="text-slate-600 leading-relaxed">{order.shippingAddress}</p>
                    {order.orderNote && (
                      <p className="text-[11px] text-amber-700 italic pt-1">
                        Note: &quot;{order.orderNote}&quot;
                      </p>
                    )}
                  </div>

                  {/* Column 3: Payment Verification Box */}
                  <div className="space-y-1 bg-neutral-50 p-3.5 rounded-2xl border border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">Payment Verification</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          order.paymentMethod === "COD"
                            ? "bg-slate-200 text-slate-800"
                            : order.paymentMethod === "bKash"
                            ? "bg-[#E2136E]/10 text-[#E2136E]"
                            : "bg-[#F7941D]/10 text-[#F7941D]"
                        }`}
                      >
                        {order.paymentMethod}
                      </span>
                    </div>

                    {order.paymentMethod === "COD" ? (
                      <p className="text-slate-500 text-[11px] pt-1">
                        Collect <b className="text-slate-800">{formatPrice(order.totalAmount, currencySymbol)}</b> in cash from courier upon delivery.
                      </p>
                    ) : (
                      <div className="space-y-1 pt-1">
                        <div className="text-[11px] text-slate-600">
                          Sender: <b className="font-mono text-slate-900">{order.paymentSenderNo || "N/A"}</b>
                        </div>
                        <div className="text-xs bg-white px-2 py-1 rounded-md border border-gray-200 font-mono font-bold text-emerald-800">
                          TrxID: {order.trxId || "N/A"}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ordered Items List */}
                <div className="pt-2 border-t border-gray-100">
                  <div className="text-xs text-slate-500 font-medium mb-2">
                    Items in Order ({order.items.length}):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-neutral-50 border border-gray-100"
                      >
                        <div className="w-10 h-10 rounded-lg bg-white overflow-hidden shrink-0 border border-gray-200">
                          <img
                            src={item.productImage || "/placeholder-product.png"}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0 text-xs">
                          <p className="font-semibold text-slate-900 truncate">
                            {item.productName}
                          </p>
                          <p className="text-slate-500 text-[11px]">
                            {item.quantity} × {formatPrice(item.priceAtPurchase, currencySymbol)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Printable Courier Packing Slip Modal */}
      {printableOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-4 xs:p-6 sm:p-8 shadow-2xl space-y-4 sm:space-y-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-gray-200">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Courier Packing Slip — {printableOrder.orderNumber}
              </h3>
              <button
                onClick={() => setPrintableOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-neutral-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Slip Contents */}
            <div id="printable-slip" className="space-y-4 text-xs border border-gray-300 p-5 rounded-2xl bg-white">
              <div className="flex justify-between items-start pb-3 border-b border-gray-200">
                <div>
                  <h4 className="text-base font-black text-slate-900">{storeName}</h4>
                  <p className="text-[11px] text-slate-500">Support: {supportPhone}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {printableOrder.orderNumber}
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    {new Date(printableOrder.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                  Customer & Delivery:
                </span>
                <p className="text-sm font-bold text-slate-900">{printableOrder.customerName}</p>
                <p className="font-mono text-slate-800 text-xs">{printableOrder.customerPhone}</p>
                <p className="text-slate-600 mt-0.5">{printableOrder.shippingAddress}</p>
                <p className="text-emerald-700 font-semibold">{printableOrder.deliveryZone}</p>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] block mb-1">
                  Parcel Contents:
                </span>
                <div className="space-y-1 divide-y divide-gray-100">
                  {printableOrder.items.map((it) => (
                    <div key={it.id} className="pt-1 flex justify-between">
                      <span>{it.productName} × {it.quantity}</span>
                      <span className="font-mono font-bold">
                        {formatPrice(it.priceAtPurchase * it.quantity, currencySymbol)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t-2 border-slate-900 flex justify-between items-center text-sm font-black">
                <span>
                  {printableOrder.paymentMethod === "COD" ? "Cash to Collect (COD):" : "Amount Paid:"}
                </span>
                <span className="font-mono text-base text-emerald-800">
                  {formatPrice(printableOrder.totalAmount, currencySymbol)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setPrintableOrder(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-md hover:bg-slate-800 transition-colors min-h-[44px]"
              >
                <Printer className="h-4 w-4" />
                <span>Print Packing Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
