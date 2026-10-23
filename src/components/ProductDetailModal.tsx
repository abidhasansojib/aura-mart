/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  X,
  Plus,
  Minus,
  ShoppingBag,
  Zap,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Star,
  Flame,
  Sparkles,
  MessageSquare,
  AlertCircle,
  Loader2,
  Send,
} from "lucide-react";
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
  salesCount?: number;
  isViral?: boolean;
  averageRating?: number;
  reviewsCount?: number;
}

interface ProductReview {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  isVerified: boolean;
  createdAt: string;
}

interface ProductDetailModalProps {
  product: ModalProduct | null;
  onClose: () => void;
  currencySymbol?: string;
  initialOrderNumber?: string;
  initialCustomerPhone?: string;
}

export function ProductDetailModal({
  product,
  onClose,
  currencySymbol = "৳",
  initialOrderNumber = "",
  initialCustomerPhone = "",
}: ProductDetailModalProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"overview" | "reviews">("overview");

  // Reviews state
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Review submission state
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [customerPhone, setCustomerPhone] = useState(initialCustomerPhone);
  const [customerName, setCustomerName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [honeypot, setHoneypot] = useState(""); // Bot trap
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const productId = product?.id;

  // Fetch approved reviews for the product
  const fetchReviews = useCallback(async () => {
    if (!productId) return;
    setIsLoadingReviews(true);
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch {
      // Ignore network failures
    } finally {
      setIsLoadingReviews(false);
    }
  }, [productId]);

  useEffect(() => {
    if (productId) {
      fetchReviews();
      setActiveTab("overview");
      setShowReviewForm(false);
      setSubmitError(null);
      setSubmitSuccess(null);
    }
  }, [productId, fetchReviews]);

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

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!orderNumber.trim()) {
      setSubmitError("Please enter your Order Number (found in your SMS or invoice).");
      return;
    }
    if (!customerPhone.trim()) {
      setSubmitError("Please enter the Phone Number used during checkout.");
      return;
    }
    if (!comment.trim() || comment.trim().length < 5) {
      setSubmitError("Please share at least a few words about your experience (min 5 characters).");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          orderNumber: orderNumber.trim(),
          customerPhone: customerPhone.trim(),
          customerName: customerName.trim(),
          rating,
          comment: comment.trim(),
          honeypot,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "Failed to submit review.");
      } else {
        setSubmitSuccess(
          data.message ||
            "Thank you! Your verified review has been submitted for moderation and will appear once approved by our team."
        );
        setComment("");
        setTimeout(() => {
          setShowReviewForm(false);
          setSubmitSuccess(null);
        }, 4000);
      }
    } catch {
      setSubmitError("An unexpected error occurred. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const realReviewsCount = reviews.length > 0 ? reviews.length : product.reviewsCount || 0;
  const realAverageRating =
    reviews.length > 0
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
      : product.averageRating || 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-3 xs:p-4 sm:p-6">
        <div className="relative w-full max-w-3xl rounded-3xl sm:rounded-[32px] bg-white shadow-2xl overflow-hidden border border-black/5 transition-all animate-in zoom-in-95 bento-card max-h-[92vh] flex flex-col">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-10 p-2 sm:p-2.5 rounded-full bg-white/90 backdrop-blur-md text-slate-700 hover:text-black shadow-md border border-black/5 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 overflow-y-auto">
            {/* Image Section */}
            <div className="relative bg-neutral-100 aspect-square md:aspect-auto h-56 xs:h-64 sm:h-72 md:h-full flex items-center justify-center p-4 sm:p-6 overflow-hidden">
              <div className="relative w-full h-full min-h-[220px]">
                <Image
                  src={product.imageUrl || "/placeholder-product.png"}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain rounded-2xl"
                  priority
                />
              </div>
              {discountPercent && (
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-[#FF6448] text-white text-[10px] sm:text-xs font-black px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-md z-10">
                  {discountPercent}% OFF
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="p-5 xs:p-6 sm:p-8 flex flex-col justify-between space-y-4 sm:space-y-5">
              <div className="space-y-3 sm:space-y-3.5">
                {/* Category & Dynamic Stock Tag */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-slate-100 text-slate-700 font-mono uppercase tracking-wider">
                    {product.category}
                  </span>

                  {/* Dynamic Rating Badge (No fake reviews!) */}
                  {realReviewsCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab("reviews")}
                      className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors px-2 sm:px-2.5 py-0.5 rounded-full border border-amber-200/60"
                      title="Click to view verified customer reviews"
                    >
                      <Star className="h-3 sm:h-3.5 w-3 sm:w-3.5 fill-amber-400 text-amber-400" />
                      <span>
                        {realAverageRating} ({realReviewsCount} {realReviewsCount === 1 ? "Review" : "Reviews"})
                      </span>
                    </button>
                  ) : (
                    <span className="text-[10px] sm:text-xs font-medium text-slate-500 bg-slate-100 px-2 sm:px-2.5 py-0.5 rounded-full">
                      No reviews yet
                    </span>
                  )}

                  {isOutOfStock ? (
                    <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-red-100 text-red-700">
                      Out of Stock
                    </span>
                  ) : isLowStock ? (
                    <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-[#F5B738]/20 text-amber-800">
                      Only {product.stock} left!
                    </span>
                  ) : (
                    <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>In Stock</span>
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-lg xs:text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                  {product.name}
                </h2>

                {/* Price Display */}
                <div className="flex items-baseline gap-2.5 pt-0.5">
                  <span className="text-xl xs:text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                    {formatPrice(product.price, currencySymbol)}
                  </span>
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <span className="text-xs sm:text-sm text-slate-400 line-through font-mono">
                      {formatPrice(product.compareAtPrice, currencySymbol)}
                    </span>
                  )}
                </div>

                {/* Social Proof & Admin Pick Banner */}
                {((product.salesCount !== undefined && product.salesCount > 0) || product.isFeatured) && (
                  <div className="flex items-center gap-2 flex-wrap pt-0.5">
                    {product.salesCount !== undefined && product.salesCount > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-[#FF6448]/10 text-[#FF6448] border border-[#FF6448]/20 shadow-xs">
                        <Flame className="h-3.5 w-3.5 fill-[#FF6448]" />
                        <span>{product.salesCount}+ Sold • Viral Choice</span>
                      </span>
                    )}
                    {product.isFeatured && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-xs">
                        <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                        <span>Admin Pushed • Featured Pick</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Tab Switcher: Overview vs Reviews */}
                <div className="flex border-b border-gray-100 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("overview")}
                    className={`pb-2 text-xs font-bold transition-all relative mr-5 ${
                      activeTab === "overview"
                        ? "text-[#FF6448] border-b-2 border-[#FF6448]"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Product Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("reviews")}
                    className={`pb-2 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
                      activeTab === "reviews"
                        ? "text-[#FF6448] border-b-2 border-[#FF6448]"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <span>Buyer Reviews</span>
                    {realReviewsCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono">
                        {realReviewsCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* TAB 1: PRODUCT DETAILS */}
                {activeTab === "overview" && (
                  <div className="space-y-3.5 animate-in fade-in-50 duration-200">
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                      {product.description}
                    </p>

                    {/* Value Propositions */}
                    <div className="pt-1 grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50">
                        <Truck className="h-3.5 w-3.5 text-[#5256FF]" />
                        <span>24-48h Delivery</span>
                      </div>
                      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Cash on Delivery</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: VERIFIED BUYER REVIEWS */}
                {activeTab === "reviews" && (
                  <div className="space-y-3.5 animate-in fade-in-50 duration-200">
                    {/* Header with Rating Summary & Write Button */}
                    <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between gap-3 border border-slate-100">
                      <div>
                        {realReviewsCount > 0 ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-black text-slate-900 font-mono">
                              {realAverageRating}
                            </span>
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`h-3.5 w-3.5 ${
                                    s <= Math.round(realAverageRating)
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-slate-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-[11px] text-slate-500 font-medium">
                              ({realReviewsCount} verified)
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-700">
                            No reviews yet
                          </span>
                        )}
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Only verified buyers with order receipt can review
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowReviewForm(!showReviewForm)}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-xs shrink-0 flex items-center gap-1"
                      >
                        <MessageSquare className="h-3 w-3 text-[#FF6448]" />
                        <span>{showReviewForm ? "Cancel" : "Write Review"}</span>
                      </button>
                    </div>

                    {/* Write Review Form */}
                    {showReviewForm && (
                      <form
                        onSubmit={handleSubmitReview}
                        className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200/60 space-y-3 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span>Share Your Verified Feedback</span>
                          </h4>
                          <span className="text-[10px] text-amber-800 font-medium bg-amber-100 px-2 py-0.5 rounded-full">
                            Moderated
                          </span>
                        </div>

                        {submitError && (
                          <div className="p-2 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs flex items-center gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            <span>{submitError}</span>
                          </div>
                        )}

                        {submitSuccess && (
                          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span className="leading-tight">{submitSuccess}</span>
                          </div>
                        )}

                        {/* Interactive Star Rating */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Your Rating:
                          </label>
                          <div className="flex items-center gap-1.5">
                            {[1, 2, 3, 4, 5].map((starValue) => (
                              <button
                                key={starValue}
                                type="button"
                                onClick={() => setRating(starValue)}
                                className="p-1 rounded-lg hover:scale-110 transition-transform"
                                aria-label={`${starValue} Stars`}
                              >
                                <Star
                                  className={`h-5 w-5 ${
                                    starValue <= rating
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-slate-300"
                                  }`}
                                />
                              </button>
                            ))}
                            <span className="text-xs font-bold text-slate-600 ml-1">
                              {rating === 5
                                ? "5 - Excellent"
                                : rating === 4
                                ? "4 - Very Good"
                                : rating === 3
                                ? "3 - Average"
                                : rating === 2
                                ? "2 - Poor"
                                : "1 - Terrible"}
                            </span>
                          </div>
                        </div>

                        {/* Order Number & Phone Verification */}
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                              Order Number *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="ORD-2026-XXXX"
                              value={orderNumber}
                              onChange={(e) => setOrderNumber(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-[#FF6448] text-xs font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                              Phone Number *
                            </label>
                            <input
                              type="tel"
                              required
                              placeholder="01XXXXXXXXX"
                              value={customerPhone}
                              onChange={(e) => setCustomerPhone(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-[#FF6448] text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                            Your Name (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Sojib H."
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-[#FF6448] text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                            Your Review *
                          </label>
                          <textarea
                            required
                            rows={3}
                            placeholder="How was the product quality and delivery experience?"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-[#FF6448] text-xs resize-none"
                          />
                        </div>

                        {/* Invisible Honeypot Trap for Spam Bots */}
                        <input
                          type="text"
                          name="website_url_hp"
                          tabIndex={-1}
                          autoComplete="off"
                          value={honeypot}
                          onChange={(e) => setHoneypot(e.target.value)}
                          className="opacity-0 absolute pointer-events-none -z-10 h-0 w-0"
                        />

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-2 px-3 rounded-xl bg-[#181A1D] hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>Verifying Order...</span>
                            </>
                          ) : (
                            <>
                              <Send className="h-3.5 w-3.5" />
                              <span>Submit Verified Review</span>
                            </>
                          )}
                        </button>
                      </form>
                    )}

                    {/* Review List */}
                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                      {isLoadingReviews ? (
                        <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-[#FF6448]" />
                          <span>Loading verified reviews...</span>
                        </div>
                      ) : reviews.length > 0 ? (
                        reviews.map((rev) => (
                          <div
                            key={rev.id}
                            className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 text-xs">
                                  {rev.customerName || "Verified Buyer"}
                                </span>
                                {rev.isVerified && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md">
                                    <CheckCircle2 className="h-2.5 w-2.5" />
                                    <span>Verified Buyer</span>
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {new Date(rev.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`h-3 w-3 ${
                                    s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                                  }`}
                                />
                              ))}
                            </div>

                            <p className="text-xs text-slate-700 leading-relaxed font-normal">
                              {rev.comment}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="py-6 text-center text-xs text-slate-400 space-y-1">
                          <MessageSquare className="h-6 w-6 text-slate-300 mx-auto mb-1.5" />
                          <p className="font-medium text-slate-600">No public reviews yet</p>
                          <p className="text-[11px] text-slate-400">
                            Be the first verified customer to share your thoughts after delivery!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Section */}
              <div className="space-y-4 pt-3 border-t border-gray-100">
                {!isOutOfStock && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Quantity:</span>
                    <div className="flex items-center border border-gray-200 rounded-2xl bg-slate-50 p-1">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="p-1.5 text-slate-600 hover:text-black transition-colors rounded-xl hover:bg-white"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center font-bold text-sm text-slate-900 font-mono">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                        className="p-1.5 text-slate-600 hover:text-black transition-colors rounded-xl hover:bg-white"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Primary & Secondary Action Buttons */}
                {isOutOfStock ? (
                  <button
                    disabled
                    className="w-full py-3.5 rounded-2xl bg-gray-100 text-slate-400 font-bold text-sm cursor-not-allowed min-h-[48px]"
                  >
                    Sold Out
                  </button>
                ) : (
                  <div className="flex flex-col xs:grid xs:grid-cols-2 gap-2.5 sm:gap-3">
                    <button
                      onClick={handleAddToCart}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border-2 border-[#181A1D] text-[#181A1D] font-bold text-xs hover:bg-[#181A1D] hover:text-white transition-all active:scale-95 min-h-[48px]"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      <span>Add to Cart</span>
                    </button>

                    <button
                      onClick={handleBuyNow}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#FF6448] hover:bg-[#e8553b] text-white font-bold text-xs shadow-lg shadow-[#FF6448]/25 transition-all active:scale-95 min-h-[48px]"
                    >
                      <Zap className="h-4 w-4 fill-white" />
                      <span>Buy Now (COD)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
