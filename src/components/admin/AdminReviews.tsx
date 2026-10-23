/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  MessageSquare,
  Package,
  Phone,
  AlertCircle,
  Loader2,
  X,
  Send,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface ProductSnippet {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  price: number;
}

interface OrderSnippet {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
}

interface AdminReview {
  id: string;
  productId: string;
  product?: ProductSnippet;
  orderId?: string | null;
  order?: OrderSnippet | null;
  orderNumber?: string | null;
  customerName: string;
  customerPhone: string;
  rating: number;
  comment: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  isVerified: boolean;
  createdAt: string;
}

interface AdminReviewsProps {
  products: { id: string; name: string; price: number; imageUrl: string }[];
  currencySymbol?: string;
  onReviewsUpdated?: () => void;
}

export function AdminReviews({
  products = [],
  currencySymbol = "৳",
  onReviewsUpdated,
}: AdminReviewsProps) {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [counts, setCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">(
    "PENDING"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Add Direct Review Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProductId, setNewProductId] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newOrderNumber, setNewOrderNumber] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews?status=${activeFilter}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch admin reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Handle Review Status change (Approve / Reject)
  const handleUpdateStatus = async (id: string, newStatus: "APPROVED" | "REJECTED") => {
    setActionLoadingId(id);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        await fetchReviews();
        if (onReviewsUpdated) onReviewsUpdated();
      }
    } catch {
      // Ignore
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Review Delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this review?")) return;
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchReviews();
        if (onReviewsUpdated) onReviewsUpdated();
      }
    } catch {
      // Ignore
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Create Direct Review
  const handleCreateDirectReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!newProductId) {
      setModalError("Please select a product to review.");
      return;
    }
    if (!newCustomerName.trim() || !newComment.trim()) {
      setModalError("Customer name and review feedback are required.");
      return;
    }

    setIsSubmittingNew(true);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: newProductId,
          customerName: newCustomerName.trim(),
          customerPhone: newCustomerPhone.trim() || "WhatsApp/Direct",
          orderNumber: newOrderNumber.trim() || null,
          rating: newRating,
          comment: newComment.trim(),
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewCustomerName("");
        setNewCustomerPhone("");
        setNewOrderNumber("");
        setNewComment("");
        setNewRating(5);
        await fetchReviews();
        if (onReviewsUpdated) onReviewsUpdated();
      } else {
        const data = await res.json();
        setModalError(data.error || "Failed to create review.");
      }
    } catch {
      setModalError("An unexpected error occurred.");
    } finally {
      setIsSubmittingNew(false);
    }
  };

  // Filter by search query
  const filteredReviews = reviews.filter((r) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const productName = r.product?.name?.toLowerCase() || "";
    const customerName = r.customerName?.toLowerCase() || "";
    const phone = r.customerPhone?.toLowerCase() || "";
    const orderNo = r.orderNumber?.toLowerCase() || "";
    const comment = r.comment?.toLowerCase() || "";
    return (
      productName.includes(query) ||
      customerName.includes(query) ||
      phone.includes(query) ||
      orderNo.includes(query) ||
      comment.includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Customer Reviews Moderation</span>
            {counts.pending > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 animate-pulse">
                {counts.pending} Awaiting Approval
              </span>
            )}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Accept verified buyer reviews manually. Only approved reviews appear on your public storefront.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchReviews}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-[#212429] hover:bg-[#2b2f36] text-slate-300 hover:text-white transition-colors border border-white/5"
            title="Refresh Reviews"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#C4E9E5]" : ""}`} />
          </button>

          <button
            onClick={() => {
              setModalError(null);
              if (products.length > 0 && !newProductId) {
                setNewProductId(products[0].id);
              }
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-[#FF6448] hover:bg-[#e8553b] text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-[#FF6448]/20 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Add Direct Review</span>
          </button>
        </div>
      </div>

      {/* 2. Metrics Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-3xl bg-[#212429] border border-white/5 space-y-1">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
            Pending Moderation
          </span>
          <span className="text-2xl font-black text-white font-mono">{counts.pending}</span>
          <p className="text-[10px] text-slate-400">Needs manual accept</p>
        </div>

        <div className="p-4 rounded-3xl bg-[#212429] border border-white/5 space-y-1">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
            Approved & Public
          </span>
          <span className="text-2xl font-black text-white font-mono">{counts.approved}</span>
          <p className="text-[10px] text-slate-400">Live on storefront</p>
        </div>

        <div className="p-4 rounded-3xl bg-[#212429] border border-white/5 space-y-1">
          <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">
            Rejected
          </span>
          <span className="text-2xl font-black text-white font-mono">{counts.rejected}</span>
          <p className="text-[10px] text-slate-400">Hidden from buyers</p>
        </div>

        <div className="p-4 rounded-3xl bg-[#212429] border border-white/5 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Reviews
          </span>
          <span className="text-2xl font-black text-white font-mono">{counts.all}</span>
          <p className="text-[10px] text-slate-400">All submissions</p>
        </div>
      </div>

      {/* 3. Search and Status Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-[#212429] rounded-2xl border border-white/5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveFilter("PENDING")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === "PENDING"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>Pending</span>
            <span className="px-1.5 py-0.2 rounded-md bg-black/20 text-[10px] font-mono">
              {counts.pending}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter("APPROVED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === "APPROVED"
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>Approved</span>
            <span className="px-1.5 py-0.2 rounded-md bg-black/20 text-[10px] font-mono">
              {counts.approved}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter("REJECTED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === "REJECTED"
                ? "bg-rose-500 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>Rejected</span>
            <span className="px-1.5 py-0.2 rounded-md bg-black/20 text-[10px] font-mono">
              {counts.rejected}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeFilter === "ALL"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All ({counts.all})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer, phone, order, or item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-2xl bg-[#212429] border border-white/5 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#FF6448]"
          />
        </div>
      </div>

      {/* 4. Reviews List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400 rounded-3xl bg-[#212429] border border-white/5 space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-[#FF6448] mx-auto" />
            <p className="text-xs">Loading reviews...</p>
          </div>
        ) : filteredReviews.length > 0 ? (
          filteredReviews.map((rev) => {
            const isActing = actionLoadingId === rev.id;

            return (
              <div
                key={rev.id}
                className="p-4 sm:p-5 rounded-3xl bg-[#212429] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-white/10"
              >
                {/* Left Product & Customer Info */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Product Thumbnail */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-neutral-800 p-1 shrink-0 border border-white/10 flex items-center justify-center overflow-hidden">
                    {rev.product?.imageUrl ? (
                      <img
                        src={rev.product.imageUrl}
                        alt={rev.product.name}
                        className="w-full h-full object-contain rounded-xl"
                      />
                    ) : (
                      <Package className="h-6 w-6 text-slate-500" />
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    {/* Product Name */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-black text-white truncate max-w-sm">
                        {rev.product?.name || "Product"}
                      </span>
                      {rev.product?.price && (
                        <span className="text-[11px] font-mono text-slate-400">
                          {formatPrice(rev.product.price, currencySymbol)}
                        </span>
                      )}
                    </div>

                    {/* Customer & Order details */}
                    <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
                      <span className="font-bold text-slate-200">{rev.customerName}</span>
                      <span>•</span>
                      {rev.customerPhone && (
                        <a
                          href={`tel:${rev.customerPhone}`}
                          className="hover:text-white transition-colors flex items-center gap-1 font-mono text-[11px]"
                        >
                          <Phone className="h-3 w-3 text-emerald-400" />
                          <span>{rev.customerPhone}</span>
                        </a>
                      )}
                      {rev.orderNumber && (
                        <>
                          <span>•</span>
                          <span className="px-2 py-0.5 rounded-lg bg-white/5 font-mono text-[10px] text-slate-300 border border-white/10">
                            #{rev.orderNumber}
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Stars & Comment */}
                    <div className="pt-1 space-y-1">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3.5 w-3.5 ${
                              s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-600"
                            }`}
                          />
                        ))}
                        <span className="text-xs font-bold text-amber-400 ml-1">
                          {rev.rating}.0
                        </span>
                        {rev.isVerified && (
                          <span className="ml-2 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            ✓ Verified Buyer
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal bg-black/20 p-2.5 rounded-xl border border-white/5">
                        &quot;{rev.comment}&quot;
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Status Badge & Actions */}
                <div className="flex items-center justify-between md:flex-col md:items-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
                  {/* Status Indicator */}
                  {rev.status === "PENDING" && (
                    <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                      <span>Pending Moderation</span>
                    </span>
                  )}
                  {rev.status === "APPROVED" && (
                    <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Live on Storefront</span>
                    </span>
                  )}
                  {rev.status === "REJECTED" && (
                    <span className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 flex items-center gap-1.5">
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Rejected</span>
                    </span>
                  )}

                  {/* Actions Buttons */}
                  <div className="flex items-center gap-2">
                    {rev.status !== "APPROVED" && (
                      <button
                        onClick={() => handleUpdateStatus(rev.id, "APPROVED")}
                        disabled={isActing}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                        title="Approve & Publish to Storefront"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Accept Review</span>
                      </button>
                    )}

                    {rev.status !== "REJECTED" && (
                      <button
                        onClick={() => handleUpdateStatus(rev.id, "REJECTED")}
                        disabled={isActing}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-bold text-xs flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50 border border-rose-500/20"
                        title="Reject review"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Reject</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(rev.id)}
                      disabled={isActing}
                      className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors border border-white/5"
                      title="Permanently Delete Review"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center text-slate-400 rounded-3xl bg-[#212429] border border-white/5 space-y-2">
            <MessageSquare className="h-8 w-8 text-slate-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white">No reviews found</h3>
            <p className="text-xs text-slate-400">
              {activeFilter === "PENDING"
                ? "No reviews are currently pending your approval."
                : "No reviews match the selected filter or search query."}
            </p>
          </div>
        )}
      </div>

      {/* 5. Direct Review Modal (for WhatsApp/FB customer feedback) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreateDirectReview}
            className="w-full max-w-md rounded-3xl bg-[#212429] border border-white/10 p-5 sm:p-6 shadow-2xl space-y-4 text-white animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FF6448]/20 text-[#FF6448] flex items-center justify-center">
                  <Star className="h-4 w-4 fill-[#FF6448]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Add Direct Customer Review</h3>
                  <p className="text-[11px] text-slate-400">Publish authentic WhatsApp or Facebook feedback</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Product selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                Select Product *
              </label>
              <select
                required
                value={newProductId}
                onChange={(e) => setNewProductId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#181A1D] border border-white/10 text-white text-xs focus:outline-none focus:border-[#FF6448]"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatPrice(p.price, currencySymbol)})
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Name & Phone */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sojib H."
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#181A1D] border border-white/10 text-white text-xs focus:outline-none focus:border-[#FF6448]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Source / Phone
                </label>
                <input
                  type="text"
                  placeholder="WhatsApp / 017..."
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#181A1D] border border-white/10 text-white text-xs focus:outline-none focus:border-[#FF6448]"
                />
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                Star Rating
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setNewRating(s)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        s <= newRating ? "fill-amber-400 text-amber-400" : "text-slate-600"
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-amber-400 ml-2">{newRating} Stars</span>
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                Review Feedback *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Paste customer's feedback message..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#181A1D] border border-white/10 text-white text-xs focus:outline-none focus:border-[#FF6448] resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingNew}
                className="px-4 py-2 rounded-xl bg-[#FF6448] hover:bg-[#e8553b] text-white text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmittingNew ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Publish Review</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
