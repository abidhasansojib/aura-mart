"use client";

import React, { useState, useEffect } from "react";
import {
  Save,
  Store,
  Phone,
  Truck,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Megaphone,
  Sparkles,
  Ticket,
  Plus,
  Trash2,
  Lock,
  Globe,
  MessageCircle,
} from "lucide-react";

export interface StoreSettingsData {
  id?: string;
  storeName: string;
  tagline: string;
  announcementText: string;
  supportPhone: string;
  bkashNumber: string;
  nagadNumber: string;
  insideCityDelivery: number;
  outsideCityDelivery: number;
  currencySymbol: string;
  // Hero & Bento
  heroBadgeText?: string;
  heroTitle?: string;
  heroTagline?: string;
  heroCtaText?: string;
  heroBadgeSecondary?: string;
  expressCardTitle?: string;
  expressCardSubtitle?: string;
  guaranteeCardTitle?: string;
  guaranteeCardSubtitle?: string;
  // Social
  whatsappNumber?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  // Payments
  enableCod?: boolean;
  enableBkash?: boolean;
  enableNagad?: boolean;
  enableRocket?: boolean;
  rocketNumber?: string;
  // Free Shipping & Rules
  freeShippingThreshold?: number;
  lowStockThreshold?: number;
  isStoreOpen?: boolean;
  storeClosedNotice?: string;
}

interface CouponData {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderValue: number;
  maxUses?: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt?: string | null;
}

interface AdminSettingsProps {
  initialSettings: StoreSettingsData;
  onSettingsSaved: () => void;
}

export function AdminSettings({ initialSettings, onSettingsSaved }: AdminSettingsProps) {
  const [activeTab, setActiveTab] = useState<
    "branding" | "content" | "shipping" | "payments" | "coupons" | "store"
  >("branding");

  const [settings, setSettings] = useState<StoreSettingsData>({
    ...initialSettings,
    heroBadgeText: initialSettings.heroBadgeText || "Featured Collection 2026",
    heroTitle: initialSettings.heroTitle || initialSettings.storeName || "Aura Mart",
    heroTagline:
      initialSettings.heroTagline ||
      initialSettings.tagline ||
      "Quality Products Delivered to Your Doorstep. Zero advance payment required.",
    heroCtaText: initialSettings.heroCtaText || "Shop Catalog",
    heroBadgeSecondary: initialSettings.heroBadgeSecondary || "Cash on Delivery Available",
    expressCardTitle: initialSettings.expressCardTitle || "Fast Doorstep Delivery",
    expressCardSubtitle:
      initialSettings.expressCardSubtitle || "All 64 Districts Dispatched in 24-48 Hours",
    guaranteeCardTitle: initialSettings.guaranteeCardTitle || "Open-Box Inspection",
    guaranteeCardSubtitle:
      initialSettings.guaranteeCardSubtitle ||
      "Check your parcel in front of the delivery agent before paying cash.",
    whatsappNumber: initialSettings.whatsappNumber || initialSettings.supportPhone || "01700000000",
    facebookUrl: initialSettings.facebookUrl || "",
    instagramUrl: initialSettings.instagramUrl || "",
    enableCod: initialSettings.enableCod !== undefined ? initialSettings.enableCod : true,
    enableBkash: initialSettings.enableBkash !== undefined ? initialSettings.enableBkash : true,
    enableNagad: initialSettings.enableNagad !== undefined ? initialSettings.enableNagad : true,
    enableRocket: initialSettings.enableRocket !== undefined ? initialSettings.enableRocket : false,
    rocketNumber: initialSettings.rocketNumber || "01700000000 (Personal)",
    freeShippingThreshold: initialSettings.freeShippingThreshold || 0,
    lowStockThreshold: initialSettings.lowStockThreshold || 5,
    isStoreOpen: initialSettings.isStoreOpen !== undefined ? initialSettings.isStoreOpen : true,
    storeClosedNotice:
      initialSettings.storeClosedNotice ||
      "We are currently restocking our inventory. Orders will resume shortly!",
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Coupon state
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponType, setCouponType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [couponValue, setCouponValue] = useState("");
  const [couponMinOrder, setCouponMinOrder] = useState("");
  const [couponExpires, setCouponExpires] = useState("");
  const [couponMaxUses, setCouponMaxUses] = useState("");
  const [creatingCoupon, setCreatingCoupon] = useState(false);

  // Load coupons when coupon tab active
  useEffect(() => {
    if (activeTab === "coupons") {
      fetchCoupons();
    }
  }, [activeTab]);

  const fetchCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const res = await fetch("/api/coupons");
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (err) {
      console.warn("Failed to load coupons:", err);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim() || !couponValue) return;

    setCreatingCoupon(true);
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim().toUpperCase(),
          discountType: couponType,
          discountValue: Number(couponValue),
          minOrderValue: couponMinOrder ? Number(couponMinOrder) : 0,
          maxUses: couponMaxUses ? Number(couponMaxUses) : null,
          expiresAt: couponExpires ? new Date(couponExpires).toISOString() : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create coupon");
      }

      setCouponCode("");
      setCouponValue("");
      setCouponMinOrder("");
      setCouponExpires("");
      setCouponMaxUses("");
      fetchCoupons();
      setSuccessMsg("Coupon created successfully!");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create coupon");
    } finally {
      setCreatingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      const res = await fetch(`/api/coupons?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.warn("Failed to delete coupon:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update settings");
      }

      setSuccessMsg("Store settings updated successfully! All changes are live immediately.");
      onSettingsSaved();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:text-rose-900 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Tab Navigation Ribbon */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar bg-white p-2 rounded-2xl border border-gray-200 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab("branding")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === "branding"
              ? "bg-[#181A1D] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Store className="h-3.5 w-3.5" />
          <span>Brand & Social</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("content")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === "content"
              ? "bg-[#181A1D] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-[#FF6448]" />
          <span>Hero & Bento Content</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("shipping")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === "shipping"
              ? "bg-[#181A1D] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Truck className="h-3.5 w-3.5 text-[#5256FF]" />
          <span>Shipping & Free Delivery</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("payments")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === "payments"
              ? "bg-[#181A1D] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
          <span>Payment Gateways</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("coupons")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === "coupons"
              ? "bg-[#181A1D] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Ticket className="h-3.5 w-3.5 text-amber-500" />
          <span>Coupons & Promos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("store")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === "store"
              ? "bg-[#181A1D] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Lock className="h-3.5 w-3.5 text-purple-600" />
          <span>Store Status</span>
        </button>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6 text-xs text-slate-700">
        {/* ===================================================================
            TAB 1: BRANDING & SOCIAL MEDIA
            =================================================================== */}
        {activeTab === "branding" && (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-2xl bg-neutral-100 text-[#181A1D] flex items-center justify-center">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Store Identity & Social Channels</h3>
                <p className="text-[11px] text-slate-400">
                  Control how your store appears to customers across the site, header, and footer
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-700 mb-1">
                  Store Display Name
                </label>
                <input
                  type="text"
                  required
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6448]/20 focus:border-[#FF6448] min-h-[42px]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-700 mb-1">
                  Support Hotline Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={settings.supportPhone}
                    onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6448]/20 focus:border-[#FF6448] min-h-[42px]"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-700 mb-1">
                  Tagline / Motto
                </label>
                <input
                  type="text"
                  value={settings.tagline}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  placeholder="Quality Products Delivered to Your Doorstep"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6448]/20 focus:border-[#FF6448] min-h-[42px]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-700 mb-1">
                  Top Announcement Ribbon Text
                </label>
                <div className="relative">
                  <Megaphone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={settings.announcementText}
                    onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6448]/20 focus:border-[#FF6448] min-h-[42px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-[11px] text-emerald-600 mb-1">
                  WhatsApp Direct Order Number
                </label>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-500" />
                  <input
                    type="text"
                    value={settings.whatsappNumber || ""}
                    onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 min-h-[42px]"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  A floating WhatsApp button will appear on the storefront with 1-click customer chat.
                </p>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-[11px] text-blue-600 mb-1">
                  Facebook Page URL (Optional)
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-500" />
                  <input
                    type="text"
                    value={settings.facebookUrl || ""}
                    onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                    placeholder="https://facebook.com/yourpage"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 min-h-[42px]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 2: HERO & BENTO PROMOTIONAL CONTENT
            =================================================================== */}
        {activeTab === "content" && (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-2xl bg-[#FF6448]/10 text-[#FF6448] flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Hero & Bento Card Copywriting</h3>
                <p className="text-[11px] text-slate-400">
                  Instantly edit the promotional headlines and guarantee badges on your homepage
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-[#FF6448]/5 border border-[#FF6448]/20 space-y-4">
                <span className="text-xs font-black uppercase text-[#FF6448] tracking-wider block">
                  1. Main Coral Hero Banner
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-[11px] text-slate-700 mb-1">
                      Top Pill Tag / Badge
                    </label>
                    <input
                      type="text"
                      value={settings.heroBadgeText || ""}
                      onChange={(e) => setSettings({ ...settings, heroBadgeText: e.target.value })}
                      placeholder="Featured Collection 2026"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-slate-900 min-h-[40px]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[11px] text-slate-700 mb-1">
                      Main Headline Title
                    </label>
                    <input
                      type="text"
                      value={settings.heroTitle || ""}
                      onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                      placeholder="Aura Mart"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-slate-900 min-h-[40px]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-[11px] text-slate-700 mb-1">
                      Hero Subtitle / Description
                    </label>
                    <input
                      type="text"
                      value={settings.heroTagline || ""}
                      onChange={(e) => setSettings({ ...settings, heroTagline: e.target.value })}
                      placeholder="Quality Products Delivered to Your Doorstep."
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-slate-900 min-h-[40px]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[11px] text-slate-700 mb-1">
                      CTA Button Text
                    </label>
                    <input
                      type="text"
                      value={settings.heroCtaText || ""}
                      onChange={(e) => setSettings({ ...settings, heroCtaText: e.target.value })}
                      placeholder="Shop Catalog"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-slate-900 min-h-[40px]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[11px] text-slate-700 mb-1">
                      Secondary Trust Badge
                    </label>
                    <input
                      type="text"
                      value={settings.heroBadgeSecondary || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, heroBadgeSecondary: e.target.value })
                      }
                      placeholder="Cash on Delivery Available"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-slate-900 min-h-[40px]"
                    />
                  </div>
                </div>
              </div>

              {/* Bento Card 2: Express Shipping */}
              <div className="p-4 rounded-2xl bg-[#5256FF]/5 border border-[#5256FF]/20 space-y-4">
                <span className="text-xs font-black uppercase text-[#5256FF] tracking-wider block">
                  2. Express Shipping Bento Card (Royal Indigo)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-[11px] text-slate-700 mb-1">
                      Card Title
                    </label>
                    <input
                      type="text"
                      value={settings.expressCardTitle || ""}
                      onChange={(e) => setSettings({ ...settings, expressCardTitle: e.target.value })}
                      placeholder="Fast Doorstep Delivery"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-slate-900 min-h-[40px]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[11px] text-slate-700 mb-1">
                      Card Subtitle / Coverage Note
                    </label>
                    <input
                      type="text"
                      value={settings.expressCardSubtitle || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, expressCardSubtitle: e.target.value })
                      }
                      placeholder="All 64 Districts Dispatched in 24-48 Hours"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-slate-900 min-h-[40px]"
                    />
                  </div>
                </div>
              </div>

              {/* Bento Card 3: Quality Guarantee */}
              <div className="p-4 rounded-2xl bg-[#C4E9E5]/30 border border-[#C4E9E5] space-y-4">
                <span className="text-xs font-black uppercase text-teal-900 tracking-wider block">
                  3. Quality Assurance Bento Card (Ice Mint)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-[11px] text-slate-700 mb-1">
                      Guarantee Title
                    </label>
                    <input
                      type="text"
                      value={settings.guaranteeCardTitle || ""}
                      onChange={(e) => setSettings({ ...settings, guaranteeCardTitle: e.target.value })}
                      placeholder="Open-Box Inspection"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-slate-900 min-h-[40px]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[11px] text-slate-700 mb-1">
                      Guarantee Description
                    </label>
                    <input
                      type="text"
                      value={settings.guaranteeCardSubtitle || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, guaranteeCardSubtitle: e.target.value })
                      }
                      placeholder="Check your parcel in front of the delivery agent before paying cash."
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-slate-900 min-h-[40px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 3: SHIPPING RATES & FREE DELIVERY THRESHOLD
            =================================================================== */}
        {activeTab === "shipping" && (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-2xl bg-[#5256FF]/10 text-[#5256FF] flex items-center justify-center">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delivery Charges & Free Shipping Incentives</h3>
                <p className="text-[11px] text-slate-400">
                  Configure delivery fees and set an automatic Free Shipping threshold to increase order size
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-700 mb-1">
                  Inside City Delivery Fee
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">
                    {settings.currencySymbol}
                  </span>
                  <input
                    type="number"
                    required
                    value={settings.insideCityDelivery}
                    onChange={(e) =>
                      setSettings({ ...settings, insideCityDelivery: Number(e.target.value) })
                    }
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#5256FF]/20 focus:border-[#5256FF] min-h-[42px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-700 mb-1">
                  Nationwide / Outside City Fee
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">
                    {settings.currencySymbol}
                  </span>
                  <input
                    type="number"
                    required
                    value={settings.outsideCityDelivery}
                    onChange={(e) =>
                      setSettings({ ...settings, outsideCityDelivery: Number(e.target.value) })
                    }
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#5256FF]/20 focus:border-[#5256FF] min-h-[42px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-[11px] text-emerald-600 mb-1">
                  Free Shipping Minimum (AOV Boost)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">
                    {settings.currencySymbol}
                  </span>
                  <input
                    type="number"
                    value={settings.freeShippingThreshold || 0}
                    onChange={(e) =>
                      setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) })
                    }
                    placeholder="1500 (0 to disable)"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 min-h-[42px]"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Orders above this amount receive automatic 100% Free Shipping.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 4: PAYMENT GATEWAYS MANAGER
            =================================================================== */}
        {activeTab === "payments" && (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Payment Gateways & Mobile Banking</h3>
                <p className="text-[11px] text-slate-400">
                  Toggle active payment options and customize payment instructions shown at checkout
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* COD Toggle */}
              <div className="p-4 rounded-2xl border border-gray-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">Cash on Delivery (COD)</span>
                    <span className="text-[11px] text-slate-400">Allow customers to pay cash at their doorstep</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableCod}
                    onChange={(e) => setSettings({ ...settings, enableCod: e.target.checked })}
                    className="w-5 h-5 accent-[#FF6448] cursor-pointer"
                  />
                </div>
              </div>

              {/* bKash Toggle & Details */}
              <div className="p-4 rounded-2xl border border-[#E2136E]/20 bg-[#E2136E]/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#E2136E]">bKash Mobile Payment</span>
                  <input
                    type="checkbox"
                    checked={settings.enableBkash}
                    onChange={(e) => setSettings({ ...settings, enableBkash: e.target.checked })}
                    className="w-5 h-5 accent-[#E2136E] cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    bKash Number & Account Type
                  </label>
                  <input
                    type="text"
                    value={settings.bkashNumber}
                    onChange={(e) => setSettings({ ...settings, bkashNumber: e.target.value })}
                    placeholder="01XXXXXXXXX (Personal / Send Money)"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-slate-900 font-mono text-xs"
                  />
                </div>
              </div>

              {/* Nagad Toggle & Details */}
              <div className="p-4 rounded-2xl border border-[#F7941D]/20 bg-[#F7941D]/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#F7941D]">Nagad Mobile Payment</span>
                  <input
                    type="checkbox"
                    checked={settings.enableNagad}
                    onChange={(e) => setSettings({ ...settings, enableNagad: e.target.checked })}
                    className="w-5 h-5 accent-[#F7941D] cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Nagad Number & Account Type
                  </label>
                  <input
                    type="text"
                    value={settings.nagadNumber}
                    onChange={(e) => setSettings({ ...settings, nagadNumber: e.target.value })}
                    placeholder="01XXXXXXXXX (Personal / Send Money)"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-slate-900 font-mono text-xs"
                  />
                </div>
              </div>

              {/* Rocket Toggle & Details */}
              <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-purple-700">Dutch-Bangla Rocket</span>
                  <input
                    type="checkbox"
                    checked={settings.enableRocket}
                    onChange={(e) => setSettings({ ...settings, enableRocket: e.target.checked })}
                    className="w-5 h-5 accent-purple-600 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Rocket 12-Digit Number
                  </label>
                  <input
                    type="text"
                    value={settings.rocketNumber || ""}
                    onChange={(e) => setSettings({ ...settings, rocketNumber: e.target.value })}
                    placeholder="01XXXXXXXXXX (12 Digits)"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-slate-900 font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 5: COUPONS & DISCOUNT ENGINE
            =================================================================== */}
        {activeTab === "coupons" && (
          <div className="space-y-6">
            {/* Coupon Creator Card */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Ticket className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Create New Promo / Discount Code</h3>
                  <p className="text-[11px] text-slate-400">
                    Customers enter this code at checkout to unlock percentage or flat-rate savings
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-[11px] text-slate-700 mb-1">
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="e.g. EID50 or SAVE10"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-slate-900 font-mono font-bold uppercase text-xs min-h-[40px]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[11px] text-slate-700 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={couponType}
                    onChange={(e) => setCouponType(e.target.value as "PERCENTAGE" | "FIXED")}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-slate-900 text-xs font-bold min-h-[40px] bg-white cursor-pointer"
                  >
                    <option value="PERCENTAGE">Percentage (% Off)</option>
                    <option value="FIXED">Flat Amount (৳ Off)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[11px] text-slate-700 mb-1">
                    Discount Value {couponType === "PERCENTAGE" ? "(%)" : `(${settings.currencySymbol})`}
                  </label>
                  <input
                    type="number"
                    value={couponValue}
                    onChange={(e) => setCouponValue(e.target.value)}
                    placeholder={couponType === "PERCENTAGE" ? "10" : "100"}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-slate-900 font-mono text-xs min-h-[40px]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[11px] text-slate-700 mb-1">
                    Min Order Spend ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    value={couponMinOrder}
                    onChange={(e) => setCouponMinOrder(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-slate-900 font-mono text-xs min-h-[40px]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[11px] text-slate-700 mb-1">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={couponExpires}
                    onChange={(e) => setCouponExpires(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-slate-900 text-xs min-h-[40px]"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    disabled={creatingCoupon || !couponCode.trim() || !couponValue}
                    onClick={handleCreateCoupon}
                    className="w-full py-2.5 px-4 bg-[#FF6448] hover:bg-[#e8553b] disabled:bg-gray-200 disabled:text-slate-400 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#FF6448]/20 transition-all min-h-[40px]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{creatingCoupon ? "Creating..." : "Save Coupon"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Existing Coupons List */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Active Store Promo Codes
              </h4>

              {loadingCoupons ? (
                <p className="text-xs text-slate-400">Loading coupons...</p>
              ) : coupons.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs space-y-2">
                  <Ticket className="h-8 w-8 mx-auto text-slate-300" />
                  <p>No coupons created yet. Create your first discount code above!</p>
                  <div className="inline-flex items-center gap-2 text-[11px] text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
                    <span>💡 Tip: Customers can also test offline codes: WELCOME10, FLAT100</span>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {coupons.map((c) => (
                    <div key={c.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-gray-200">
                            {c.code}
                          </span>
                          <span className="text-xs font-bold text-emerald-600">
                            {c.discountType === "PERCENTAGE" ? `${c.discountValue}% OFF` : `৳${c.discountValue} OFF`}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Min spend: ৳{c.minOrderValue} • Redeemed: {c.usedCount} times
                          {c.expiresAt ? ` • Expires: ${new Date(c.expiresAt).toLocaleDateString()}` : " • Never expires"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteCoupon(c.id)}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Delete coupon"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 6: STORE STATUS & INVENTORY CONTROLS
            =================================================================== */}
        {activeTab === "store" && (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Store Status & Inventory Alerts</h3>
                <p className="text-[11px] text-slate-400">
                  Pause checkout for holidays/restocking and set threshold for low stock warnings
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Store Open/Pause Switch */}
              <div className="p-4 rounded-2xl border border-gray-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Accepting Orders</span>
                  <span className="text-[11px] text-slate-400">
                    {settings.isStoreOpen
                      ? "Store is open and active for shopping."
                      : "Store is paused. Customers cannot complete checkout."}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.isStoreOpen}
                  onChange={(e) => setSettings({ ...settings, isStoreOpen: e.target.checked })}
                  className="w-5 h-5 accent-purple-600 cursor-pointer"
                />
              </div>

              {/* Maintenance Notice Message */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-700 mb-1">
                  Store Pause / Maintenance Notice (shown if store is closed)
                </label>
                <input
                  type="text"
                  value={settings.storeClosedNotice || ""}
                  onChange={(e) => setSettings({ ...settings, storeClosedNotice: e.target.value })}
                  placeholder="We are currently restocking our inventory. Orders will resume shortly!"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-slate-900 min-h-[42px]"
                />
              </div>

              {/* Low Stock Threshold */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-700 mb-1">
                  Low Stock Warning Threshold (units)
                </label>
                <input
                  type="number"
                  value={settings.lowStockThreshold || 5}
                  onChange={(e) => setSettings({ ...settings, lowStockThreshold: Number(e.target.value) })}
                  className="w-48 px-3.5 py-2.5 rounded-xl border border-gray-200 text-slate-900 font-mono font-bold min-h-[42px]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Products with stock at or below this count will show the orange &quot;Only X left!&quot; urgency badge.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Global Save Changes Floating / Bottom Bar */}
        <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl shadow-xl">
          <div className="text-xs">
            <span className="font-bold block">Unsaved Changes?</span>
            <span className="text-slate-400 text-[11px]">Click save to push updates to the live storefront immediately.</span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-7 py-3 bg-[#FF6448] hover:bg-[#e8553b] disabled:bg-gray-600 text-white font-bold rounded-xl shadow-lg shadow-[#FF6448]/30 transition-all text-xs min-h-[44px] active:scale-95"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Publishing Changes..." : "Save Store Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
