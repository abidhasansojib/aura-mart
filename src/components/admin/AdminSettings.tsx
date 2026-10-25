/* eslint-disable @next/next/no-img-element */
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
  ShieldCheck,
  Eye,
  EyeOff,
  Upload,
  Image as ImageIcon,
  ChevronDown,
  Pencil,
  Palette,
  X,
  ArrowUp,
  ArrowDown,
  Star,
  ArrowRight,
} from "lucide-react";
import { compressAndUploadImage } from "@/lib/image-upload";
import {
  BANNER_TEMPLATES,
  GRADIENT_PRESETS,
  BannerItem,
  BannerTemplate,
} from "@/lib/banner-templates";

export type PaymentAccountType = "Personal" | "Agent" | "Merchant";

export function parsePaymentField(value: string | undefined): { phone: string; type: PaymentAccountType } {
  if (!value) return { phone: "", type: "Personal" };

  const match = value.match(/^([0-9+]+)\s*(?:\(([^)]+)\))?/);
  if (match) {
    const phone = match[1] || "";
    const rawType = (match[2] || "").toLowerCase();
    let type: PaymentAccountType = "Personal";
    if (rawType.includes("agent") || rawType.includes("cash in") || rawType.includes("cash out")) {
      type = "Agent";
    } else if (rawType.includes("merchant") || rawType.includes("payment")) {
      type = "Merchant";
    }
    return { phone, type };
  }

  const digits = value.replace(/[^0-9+]/g, "");
  return { phone: digits, type: "Personal" };
}

export function formatPaymentField(
  phone: string,
  type: PaymentAccountType,
  gateway: "bKash" | "Nagad" | "Rocket"
): string {
  const cleanPhone = phone.trim();
  if (!cleanPhone) return "";

  if (type === "Agent") {
    const action = gateway === "bKash" ? "Cash In" : "Cash Out";
    return `${cleanPhone} (Agent/${action})`;
  }
  if (type === "Merchant") {
    return `${cleanPhone} (Merchant/Payment)`;
  }
  return `${cleanPhone} (Personal/Send Money)`;
}

export interface StoreSettingsData {
  id?: string;
  storeName: string;
  logoUrl?: string;
  tagline: string;
  announcementText: string;
  supportPhone: string;
  bkashNumber: string;
  nagadNumber: string;
  insideCityDelivery: number;
  outsideCityDelivery: number;
  currencySymbol: string;
  shopCity?: string;
  shopAddress?: string;
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
    "branding" | "content" | "shipping" | "payments" | "coupons" | "store" | "security"
  >("branding");

  const [settings, setSettings] = useState<StoreSettingsData>({
    ...initialSettings,
    logoUrl: initialSettings.logoUrl || "",
    heroBadgeText: initialSettings.heroBadgeText || "Featured Collection 2026",
    heroTitle:
      initialSettings.heroTitle && initialSettings.heroTitle !== "Aura Mart"
        ? initialSettings.heroTitle
        : initialSettings.storeName || "Official Store",
    heroTagline:
      initialSettings.heroTagline ||
      initialSettings.tagline ||
      "Quality Products Delivered to Your Doorstep. Zero advance payment required.",
    heroCtaText: initialSettings.heroCtaText || "Shop Catalog",
    heroBadgeSecondary: initialSettings.heroBadgeSecondary || "Cash on Delivery Available",
    expressCardTitle: initialSettings.expressCardTitle || "Fast Doorstep Delivery",
    expressCardSubtitle:
      initialSettings.expressCardSubtitle || "All 64 Districts Dispatched in 24-48 Hours",
    guaranteeCardTitle: initialSettings.guaranteeCardTitle || "100% Quality Assured",
    guaranteeCardSubtitle:
      initialSettings.guaranteeCardSubtitle ||
      "Every item is hand-inspected for flawless quality and packaged securely before dispatch.",
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
    shopCity: initialSettings.shopCity || "Bogura",
    shopAddress: initialSettings.shopAddress || "Bogura, Rajshahi, Bangladesh",
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Logo upload state
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadFeedback, setLogoUploadFeedback] = useState<string | null>(null);

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    setLogoUploadFeedback("Uploading and optimizing brand logo...");
    try {
      const uploadedUrl = await compressAndUploadImage(file);
      setSettings((prev) => ({ ...prev, logoUrl: uploadedUrl }));
      setLogoUploadFeedback("Logo uploaded successfully! Remember to save changes.");
    } catch (err) {
      setLogoUploadFeedback(err instanceof Error ? err.message : "Failed to upload logo image");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Structured Payment Gateways State (Phone Number + Account Type Dropdown)
  const initialBkashParsed = parsePaymentField(initialSettings.bkashNumber);
  const [bkashPhone, setBkashPhone] = useState(initialBkashParsed.phone || "01700000000");
  const [bkashType, setBkashType] = useState<PaymentAccountType>(initialBkashParsed.type);

  const initialNagadParsed = parsePaymentField(initialSettings.nagadNumber);
  const [nagadPhone, setNagadPhone] = useState(initialNagadParsed.phone || "01700000000");
  const [nagadType, setNagadType] = useState<PaymentAccountType>(initialNagadParsed.type);

  const initialRocketParsed = parsePaymentField(initialSettings.rocketNumber);
  const [rocketPhone, setRocketPhone] = useState(initialRocketParsed.phone || "");
  const [rocketType, setRocketType] = useState<PaymentAccountType>(initialRocketParsed.type);

  const handleBkashChange = (newPhone: string, newType: PaymentAccountType) => {
    setBkashPhone(newPhone);
    setBkashType(newType);
    setSettings((prev) => ({
      ...prev,
      bkashNumber: formatPaymentField(newPhone, newType, "bKash"),
    }));
  };

  const handleNagadChange = (newPhone: string, newType: PaymentAccountType) => {
    setNagadPhone(newPhone);
    setNagadType(newType);
    setSettings((prev) => ({
      ...prev,
      nagadNumber: formatPaymentField(newPhone, newType, "Nagad"),
    }));
  };

  const handleRocketChange = (newPhone: string, newType: PaymentAccountType) => {
    setRocketPhone(newPhone);
    setRocketType(newType);
    setSettings((prev) => ({
      ...prev,
      rocketNumber: formatPaymentField(newPhone, newType, "Rocket"),
    }));
  };

  // Security & Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [confirmAdminPassword, setConfirmAdminPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewAdminPassword, setShowNewAdminPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg(null);
    setPasswordSuccessMsg(null);

    if (!currentPassword) {
      setPasswordErrorMsg("Please enter your current password.");
      return;
    }

    if (!newAdminPassword || newAdminPassword.length < 6) {
      setPasswordErrorMsg("New password must be at least 6 characters long.");
      return;
    }

    if (newAdminPassword !== confirmAdminPassword) {
      setPasswordErrorMsg("New password and confirm password do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/admin/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword: newAdminPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to change password.");
      }

      setPasswordSuccessMsg(data.message || "Password changed successfully!");
      setCurrentPassword("");
      setNewAdminPassword("");
      setConfirmAdminPassword("");
    } catch (err) {
      setPasswordErrorMsg(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setChangingPassword(false);
    }
  };

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

  // ==========================================
  // SWIPABLE HERO BANNERS CAROUSEL STATE & HANDLERS
  // ==========================================
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(false);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [savingBanner, setSavingBanner] = useState(false);
  const [isUploadingBannerImg, setIsUploadingBannerImg] = useState(false);
  const [bannerImgFeedback, setBannerImgFeedback] = useState<string | null>(null);

  const [bannerForm, setBannerForm] = useState({
    title: "",
    subtitle: "",
    badgeText: "✨ Featured Collection 2026",
    badgeSecondary: "Cash on Delivery Available",
    imageUrl: "",
    ctaText: "Shop Catalog",
    ctaLink: "#catalog",
    bgGradient: "from-[#FF6448] via-[#FF755B] to-[#FF8A73]",
    textColor: "#FFFFFF",
    isActive: true,
  });

  useEffect(() => {
    if (activeTab === "content") {
      fetchBanners();
    }
  }, [activeTab]);

  const fetchBanners = async () => {
    setLoadingBanners(true);
    try {
      const res = await fetch("/api/banners?all=true");
      if (res.ok) {
        const data = await res.json();
        setBanners(data);
      }
    } catch (err) {
      console.warn("Failed to load banners:", err);
    } finally {
      setLoadingBanners(false);
    }
  };

  const handleOpenAddBanner = (template?: BannerTemplate) => {
    setEditingBanner(null);
    setBannerImgFeedback(null);
    if (template) {
      setBannerForm({
        title: template.title,
        subtitle: template.subtitle,
        badgeText: template.badgeText,
        badgeSecondary: template.badgeSecondary,
        imageUrl: "",
        ctaText: template.ctaText,
        ctaLink: template.ctaLink,
        bgGradient: template.bgGradient,
        textColor: "#FFFFFF",
        isActive: true,
      });
    } else {
      setBannerForm({
        title: "",
        subtitle: "",
        badgeText: "✨ Featured Collection 2026",
        badgeSecondary: "Cash on Delivery Available",
        imageUrl: "",
        ctaText: "Shop Catalog",
        ctaLink: "#catalog",
        bgGradient: "from-[#FF6448] via-[#FF755B] to-[#FF8A73]",
        textColor: "#FFFFFF",
        isActive: true,
      });
    }
    setIsBannerModalOpen(true);
  };

  const handleOpenEditBanner = (b: BannerItem) => {
    setEditingBanner(b);
    setBannerImgFeedback(null);
    setBannerForm({
      title: b.title,
      subtitle: b.subtitle || "",
      badgeText: b.badgeText || "",
      badgeSecondary: b.badgeSecondary || "",
      imageUrl: b.imageUrl || "",
      ctaText: b.ctaText || "Shop Catalog",
      ctaLink: b.ctaLink || "#catalog",
      bgGradient: b.bgGradient || "from-[#FF6448] via-[#FF755B] to-[#FF8A73]",
      textColor: b.textColor || "#FFFFFF",
      isActive: b.isActive,
    });
    setIsBannerModalOpen(true);
  };

  const handleBannerImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBannerImg(true);
    setBannerImgFeedback("Optimizing and uploading banner image...");
    try {
      const uploadedUrl = await compressAndUploadImage(file);
      setBannerForm((prev) => ({ ...prev, imageUrl: uploadedUrl }));
      setBannerImgFeedback("Banner image uploaded successfully!");
    } catch (err) {
      setBannerImgFeedback(err instanceof Error ? err.message : "Failed to upload banner image");
    } finally {
      setIsUploadingBannerImg(false);
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.title.trim()) {
      setErrorMsg("Banner headline title is required");
      return;
    }

    setSavingBanner(true);
    try {
      const url = editingBanner ? `/api/banners/${editingBanner.id}` : "/api/banners";
      const method = editingBanner ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: bannerForm.title.trim(),
          subtitle: bannerForm.subtitle.trim() || null,
          badgeText: bannerForm.badgeText.trim() || null,
          badgeSecondary: bannerForm.badgeSecondary.trim() || null,
          imageUrl: bannerForm.imageUrl.trim() || null,
          ctaText: bannerForm.ctaText.trim() || "Shop Catalog",
          ctaLink: bannerForm.ctaLink.trim() || "#catalog",
          bgGradient: bannerForm.bgGradient,
          textColor: bannerForm.textColor,
          isActive: bannerForm.isActive,
          order: editingBanner ? editingBanner.order : banners.length,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save banner");
      }

      setIsBannerModalOpen(false);
      setEditingBanner(null);
      await fetchBanners();
      setSuccessMsg(
        editingBanner ? "Banner updated successfully!" : "New banner created successfully!"
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save banner");
    } finally {
      setSavingBanner(false);
    }
  };

  const handleToggleBannerActive = async (banner: BannerItem) => {
    try {
      const res = await fetch(`/api/banners/${banner.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !banner.isActive }),
      });
      if (res.ok) {
        setBanners((prev) =>
          prev.map((b) => (b.id === banner.id ? { ...b, isActive: !b.isActive } : b))
        );
      }
    } catch (err) {
      console.warn("Failed to toggle banner:", err);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    try {
      const res = await fetch(`/api/banners/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setBanners((prev) => prev.filter((b) => b.id !== id));
        setSuccessMsg("Banner removed successfully");
      }
    } catch {
      setErrorMsg("Failed to delete banner");
    }
  };

  const handleMoveBanner = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const newBanners = [...banners];
    const temp = newBanners[index];
    newBanners[index] = newBanners[targetIndex];
    newBanners[targetIndex] = temp;

    // Update orders
    const updated = newBanners.map((b, idx) => ({ ...b, order: idx }));
    setBanners(updated);

    try {
      await Promise.all([
        fetch(`/api/banners/${updated[index].id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: updated[index].order }),
        }),
        fetch(`/api/banners/${updated[targetIndex].id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: updated[targetIndex].order }),
        }),
      ]);
    } catch (err) {
      console.warn("Failed to save reordered banners:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const payload = {
        ...settings,
        bkashNumber: formatPaymentField(bkashPhone, bkashType, "bKash"),
        nagadNumber: formatPaymentField(nagadPhone, nagadType, "Nagad"),
        rocketNumber: formatPaymentField(rocketPhone, rocketType, "Rocket"),
      };

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === "security"
              ? "bg-[#181A1D] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Security & Password</span>
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

            {/* Store Website Brand Logo Panel */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4 text-[#FF6448]" />
                  <span>Website Store Logo</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Upload your brand logo image to display in the header, footer, and checkout. If empty, your store initial monogram will be shown automatically.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Logo Live Preview */}
                <div className="flex items-center justify-center w-28 h-20 sm:w-32 sm:h-24 rounded-2xl bg-white border border-slate-200 shadow-xs p-2 overflow-hidden shrink-0">
                  {settings.logoUrl ? (
                    <img
                      src={settings.logoUrl}
                      alt={settings.storeName}
                      className="h-full w-auto max-w-full object-contain rounded-xl"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[#181A1D] flex items-center justify-center text-white font-black text-xl shadow-sm">
                      <span>{settings.storeName?.charAt(0) || "A"}</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2.5 w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#181A1D] hover:bg-black text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95">
                      <Upload className="h-3.5 w-3.5" />
                      <span>{isUploadingLogo ? "Uploading Logo..." : "Upload Logo Image"}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                        disabled={isUploadingLogo}
                        className="hidden"
                        onChange={handleLogoFileUpload}
                      />
                    </label>

                    {settings.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, logoUrl: "" })}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-bold transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove Logo</span>
                      </button>
                    )}
                  </div>

                  {logoUploadFeedback && (
                    <p className="text-[11px] font-semibold text-[#FF6448]">
                      {logoUploadFeedback}
                    </p>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Or Direct Logo Image URL
                    </label>
                    <input
                      type="url"
                      value={settings.logoUrl || ""}
                      onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                      placeholder="https://example.com/logo.png or /uploads/..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6448]/20 focus:border-[#FF6448]"
                    />
                  </div>
                </div>
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

              <div>
                <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-800 mb-1">
                  Shop Operating City (Default Base)
                </label>
                <input
                  type="text"
                  value={settings.shopCity || "Bogura"}
                  onChange={(e) => setSettings({ ...settings, shopCity: e.target.value })}
                  placeholder="e.g. Bogura"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#FF6448]/20 focus:border-[#FF6448] min-h-[42px]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Sets your local delivery city (e.g. Inside Bogura).
                </p>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-800 mb-1">
                  Warehouse / Shop Address
                </label>
                <input
                  type="text"
                  value={settings.shopAddress || "Bogura, Rajshahi, Bangladesh"}
                  onChange={(e) => setSettings({ ...settings, shopAddress: e.target.value })}
                  placeholder="e.g. Bogura, Rajshahi, Bangladesh"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6448]/20 focus:border-[#FF6448] min-h-[42px]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Printed on courier slips and invoices.
                </p>
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
              {/* 1. SWIPABLE HERO BANNERS CAROUSEL MANAGER */}
              <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-orange-50/30 border border-orange-200/60 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-orange-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase text-[#FF6448] tracking-wider block">
                        1. Swipable Hero Carousel & Templates
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF6448]/10 text-[#FF6448] border border-[#FF6448]/20">
                        ⚡ 5s Autoplay + Swipe
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Customers can swipe horizontally on mobile/desktop, or let slides automatically animate.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenAddBanner()}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#FF6448] hover:bg-[#e05237] text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add New Banner</span>
                  </button>
                </div>

                {/* 1-Click Banner Templates */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Palette className="h-4 w-4 text-[#FF6448]" />
                      <span>1-Click Designer Templates</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Select a template to customize
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {BANNER_TEMPLATES.map((tpl) => (
                      <div
                        key={tpl.id}
                        className="p-3 rounded-xl border border-gray-200/80 bg-white hover:border-[#FF6448]/50 hover:shadow-sm transition-all flex flex-col justify-between gap-2 group"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                              {tpl.tag}
                            </span>
                            <div
                              className="w-4 h-4 rounded-full border border-white shadow-xs"
                              style={{ backgroundColor: tpl.previewColor }}
                            />
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#FF6448] transition-colors">
                            {tpl.name}
                          </h4>
                          <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                            {tpl.description}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenAddBanner(tpl)}
                          className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-[#FF6448] text-slate-700 hover:text-white text-[11px] font-bold rounded-lg transition-colors active:scale-95 mt-1"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Use Template</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Banners Sequence & Management */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">
                        Active Slides Sequence ({banners.length})
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Slide 1 displays first
                      </span>
                    </div>
                    {loadingBanners && (
                      <span className="text-[10px] text-slate-400 animate-pulse font-mono">
                        Syncing slides...
                      </span>
                    )}
                  </div>

                  {banners.length === 0 ? (
                    <div className="p-6 text-center rounded-xl bg-white border border-dashed border-gray-300">
                      <Sparkles className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">No Custom Banners Configured</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Your homepage is currently showing the default store branding. Choose a template above or click &quot;Add New Banner&quot;.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {banners.map((b, idx) => (
                        <div
                          key={b.id}
                          className={`p-3 rounded-xl border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                            b.isActive
                              ? "border-gray-200 hover:border-orange-300 shadow-xs"
                              : "border-gray-200/60 opacity-60 bg-gray-50/50"
                          }`}
                        >
                          {/* Left: Order Buttons & Graphic Preview */}
                          <div className="flex items-center gap-3">
                            {/* Reorder Buttons */}
                            <div className="flex flex-col items-center gap-0.5">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveBanner(idx, "up")}
                                className="p-1 rounded hover:bg-slate-100 disabled:opacity-20 text-slate-600 transition-colors"
                                title="Move slide up"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <span className="text-[10px] font-mono font-bold text-slate-500">
                                #{idx + 1}
                              </span>
                              <button
                                type="button"
                                disabled={idx === banners.length - 1}
                                onClick={() => handleMoveBanner(idx, "down")}
                                className="p-1 rounded hover:bg-slate-100 disabled:opacity-20 text-slate-600 transition-colors"
                                title="Move slide down"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            {/* Mini Swatch / Thumbnail */}
                            <div
                              className={`w-14 h-14 rounded-xl bg-gradient-to-br ${
                                b.bgGradient || "from-[#FF6448] via-[#FF755B] to-[#FF8A73]"
                              } shrink-0 overflow-hidden relative border border-white/20 shadow-xs flex items-center justify-center`}
                            >
                              {b.imageUrl ? (
                                <img
                                  src={b.imageUrl}
                                  alt={b.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Sparkles className="h-5 w-5 text-white/60" />
                              )}
                            </div>

                            {/* Info */}
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs font-bold text-slate-900 leading-snug">
                                  {b.title}
                                </h4>
                                {b.badgeText && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                    {b.badgeText}
                                  </span>
                                )}
                              </div>
                              {b.subtitle && (
                                <p className="text-[11px] text-slate-500 line-clamp-1 max-w-md">
                                  {b.subtitle}
                                </p>
                              )}
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <span>CTA: {b.ctaText || "Shop Catalog"}</span>
                                <span>•</span>
                                <span className="font-mono text-slate-500">{b.ctaLink || "#catalog"}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            {/* Active Toggle Switch */}
                            <button
                              type="button"
                              onClick={() => handleToggleBannerActive(b)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                                b.isActive
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                  : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                              }`}
                            >
                              {b.isActive ? "Active" : "Paused"}
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditBanner(b)}
                              className="p-1.5 rounded-lg border border-gray-200 hover:bg-slate-100 text-slate-700 transition-colors"
                              title="Edit banner"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteBanner(b.id)}
                              className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 transition-colors"
                              title="Delete banner"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fallback Store Banner Copywriting */}
                <div className="pt-2 border-t border-orange-100/60">
                  <details className="group">
                    <summary className="text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer flex items-center justify-between py-1">
                      <span>⚙️ Fallback Store Copywriting (Used if banner list is empty)</span>
                      <ChevronDown className="h-3.5 w-3.5 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                      <div>
                        <label className="block font-bold text-[10px] text-slate-600 mb-1">
                          Default Pill Tag
                        </label>
                        <input
                          type="text"
                          value={settings.heroBadgeText || ""}
                          onChange={(e) =>
                            setSettings({ ...settings, heroBadgeText: e.target.value })
                          }
                          placeholder="Featured Collection 2026"
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-[10px] text-slate-600 mb-1">
                          Default Headline
                        </label>
                        <input
                          type="text"
                          value={settings.heroTitle || ""}
                          onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                          placeholder={settings.storeName || "Store Name"}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 text-slate-900"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-[10px] text-slate-600 mb-1">
                          Default Subtitle
                        </label>
                        <input
                          type="text"
                          value={settings.heroTagline || ""}
                          onChange={(e) =>
                            setSettings({ ...settings, heroTagline: e.target.value })
                          }
                          placeholder="Quality Products Delivered to Your Doorstep."
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-200 text-slate-900"
                        />
                      </div>
                    </div>
                  </details>
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
                  3. Quality & Packaging Bento Card (Ice Mint)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-[11px] text-slate-700 mb-1">
                      Card Title
                    </label>
                    <input
                      type="text"
                      value={settings.guaranteeCardTitle || ""}
                      onChange={(e) => setSettings({ ...settings, guaranteeCardTitle: e.target.value })}
                      placeholder="100% Quality Assured"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-slate-900 min-h-[40px]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[11px] text-slate-700 mb-1">
                      Card Description
                    </label>
                    <input
                      type="text"
                      value={settings.guaranteeCardSubtitle || ""}
                      onChange={(e) =>
                        setSettings({ ...settings, guaranteeCardSubtitle: e.target.value })
                      }
                      placeholder="Every item is hand-inspected for flawless quality and packaged securely before dispatch."
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

            {/* Shop Base City Location Setting */}
            <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold uppercase tracking-wider text-[11px] text-indigo-950 mb-1">
                  Shop Operating City (Inside City Base)
                </label>
                <input
                  type="text"
                  required
                  value={settings.shopCity || "Bogura"}
                  onChange={(e) => setSettings({ ...settings, shopCity: e.target.value })}
                  placeholder="e.g. Bogura"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#5256FF]/20 focus:border-[#5256FF] min-h-[42px] bg-white text-xs"
                />
                <p className="text-[11px] text-indigo-800/80 mt-1">
                  Orders delivered within <strong>{settings.shopCity || "Bogura"}</strong> will be charged your local rate.
                </p>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-[11px] text-indigo-950 mb-1">
                  Shop Physical / Dispatch Address
                </label>
                <input
                  type="text"
                  value={settings.shopAddress || "Bogura, Rajshahi, Bangladesh"}
                  onChange={(e) => setSettings({ ...settings, shopAddress: e.target.value })}
                  placeholder="e.g. Bogura, Rajshahi, Bangladesh"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#5256FF]/20 focus:border-[#5256FF] min-h-[42px] bg-white text-xs font-medium"
                />
                <p className="text-[11px] text-indigo-800/80 mt-1">
                  Printed on packing slips as return address for Steadfast/Pathao courier parcels.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-700 mb-1 truncate" title={`Inside ${settings.shopCity || "Bogura"} Delivery Fee`}>
                  Inside {settings.shopCity || "Bogura"} Fee
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
                <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-700 mb-1 truncate" title={`Outside ${settings.shopCity || "Bogura"} / All other districts`}>
                  Outside {settings.shopCity || "Bogura"} Fee
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

              {/* bKash Mobile Payment Box */}
              <div className="p-4 sm:p-5 rounded-2xl border border-[#E2136E]/20 bg-[#E2136E]/5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E2136E]" />
                    <span className="font-bold text-xs sm:text-sm text-[#E2136E]">bKash Mobile Payment</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableBkash}
                    onChange={(e) => setSettings({ ...settings, enableBkash: e.target.checked })}
                    className="w-5 h-5 accent-[#E2136E] cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  {/* Dedicated Phone Input (7 cols desktop, full width mobile) */}
                  <div className="sm:col-span-7">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      bKash Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9+]*"
                        value={bkashPhone}
                        onChange={(e) => handleBkashChange(e.target.value.replace(/[^0-9+]/g, ""), bkashType)}
                        placeholder="01XXXXXXXXX"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#E2136E]/20 focus:border-[#E2136E] min-h-[42px] bg-white shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Account Type Dropdown (5 cols desktop, full width mobile) */}
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Account Type
                    </label>
                    <div className="relative">
                      <select
                        value={bkashType}
                        onChange={(e) => handleBkashChange(bkashPhone, e.target.value as PaymentAccountType)}
                        className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 text-slate-900 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-[#E2136E]/20 focus:border-[#E2136E] min-h-[42px] bg-white shadow-xs cursor-pointer transition-all"
                      >
                        <option value="Personal">Personal (Send Money)</option>
                        <option value="Agent">Agent (Cash In)</option>
                        <option value="Merchant">Merchant (Payment)</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#E2136E] pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Customer View Live Preview Badge */}
                {bkashPhone && (
                  <div className="text-[11px] text-slate-600 flex items-center gap-1.5 pt-0.5 flex-wrap">
                    <span className="text-slate-400 text-[10px] font-medium">Customer View:</span>
                    <span className="font-mono font-bold text-[#E2136E] bg-white px-2 py-0.5 rounded-md border border-[#E2136E]/20 text-[11px]">
                      {formatPaymentField(bkashPhone, bkashType, "bKash")}
                    </span>
                  </div>
                )}
              </div>

              {/* Nagad Mobile Payment Box */}
              <div className="p-4 sm:p-5 rounded-2xl border border-[#F7941D]/20 bg-[#F7941D]/5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F7941D]" />
                    <span className="font-bold text-xs sm:text-sm text-[#F7941D]">Nagad Mobile Payment</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableNagad}
                    onChange={(e) => setSettings({ ...settings, enableNagad: e.target.checked })}
                    className="w-5 h-5 accent-[#F7941D] cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  {/* Dedicated Phone Input (7 cols desktop, full width mobile) */}
                  <div className="sm:col-span-7">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Nagad Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9+]*"
                        value={nagadPhone}
                        onChange={(e) => handleNagadChange(e.target.value.replace(/[^0-9+]/g, ""), nagadType)}
                        placeholder="01XXXXXXXXX"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#F7941D]/20 focus:border-[#F7941D] min-h-[42px] bg-white shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Account Type Dropdown (5 cols desktop, full width mobile) */}
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Account Type
                    </label>
                    <div className="relative">
                      <select
                        value={nagadType}
                        onChange={(e) => handleNagadChange(nagadPhone, e.target.value as PaymentAccountType)}
                        className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 text-slate-900 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-[#F7941D]/20 focus:border-[#F7941D] min-h-[42px] bg-white shadow-xs cursor-pointer transition-all"
                      >
                        <option value="Personal">Personal (Send Money)</option>
                        <option value="Agent">Agent (Cash Out)</option>
                        <option value="Merchant">Merchant (Payment)</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#F7941D] pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Customer View Live Preview Badge */}
                {nagadPhone && (
                  <div className="text-[11px] text-slate-600 flex items-center gap-1.5 pt-0.5 flex-wrap">
                    <span className="text-slate-400 text-[10px] font-medium">Customer View:</span>
                    <span className="font-mono font-bold text-[#F7941D] bg-white px-2 py-0.5 rounded-md border border-[#F7941D]/20 text-[11px]">
                      {formatPaymentField(nagadPhone, nagadType, "Nagad")}
                    </span>
                  </div>
                )}
              </div>

              {/* Rocket Mobile Payment Box */}
              <div className="p-4 sm:p-5 rounded-2xl border border-purple-200 bg-purple-50 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                    <span className="font-bold text-xs sm:text-sm text-purple-700">Dutch-Bangla Rocket</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableRocket}
                    onChange={(e) => setSettings({ ...settings, enableRocket: e.target.checked })}
                    className="w-5 h-5 accent-purple-600 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  {/* Dedicated 12-Digit Number Input (7 cols desktop, full width mobile) */}
                  <div className="sm:col-span-7">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Rocket 12-Digit Account Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9+]*"
                        value={rocketPhone}
                        onChange={(e) => handleRocketChange(e.target.value.replace(/[^0-9+]/g, ""), rocketType)}
                        placeholder="01XXXXXXXXXX (12 digits)"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 min-h-[42px] bg-white shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Account Type Dropdown (5 cols desktop, full width mobile) */}
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Account Type
                    </label>
                    <div className="relative">
                      <select
                        value={rocketType}
                        onChange={(e) => handleRocketChange(rocketPhone, e.target.value as PaymentAccountType)}
                        className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 text-slate-900 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 min-h-[42px] bg-white shadow-xs cursor-pointer transition-all"
                      >
                        <option value="Personal">Personal (Send Money)</option>
                        <option value="Agent">Agent (Cash Out)</option>
                        <option value="Merchant">Merchant (Payment)</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-purple-600 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Customer View Live Preview Badge */}
                {rocketPhone && (
                  <div className="text-[11px] text-slate-600 flex items-center gap-1.5 pt-0.5 flex-wrap">
                    <span className="text-slate-400 text-[10px] font-medium">Customer View:</span>
                    <span className="font-mono font-bold text-purple-700 bg-white px-2 py-0.5 rounded-md border border-purple-200 text-[11px]">
                      {formatPaymentField(rocketPhone, rocketType, "Rocket")}
                    </span>
                  </div>
                )}
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
                  <div className="relative">
                    <select
                      value={couponType}
                      onChange={(e) => setCouponType(e.target.value as "PERCENTAGE" | "FIXED")}
                      className="w-full appearance-none pl-3.5 pr-8 py-2 rounded-xl border border-gray-200 hover:border-gray-300 text-slate-900 text-xs font-bold min-h-[40px] bg-white shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    >
                      <option value="PERCENTAGE">Percentage (% Off)</option>
                      <option value="FIXED">Flat Amount (৳ Off)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  </div>
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

        {/* ===================================================================
            TAB 7: SECURITY & PASSWORD MANAGEMENT
            =================================================================== */}
        {activeTab === "security" && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-2xl bg-neutral-100 text-[#181A1D] flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-[#FF6448]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Admin Account Security & Password</h3>
                  <p className="text-[11px] text-slate-400">
                    Change your dashboard credentials and manage security recovery options
                  </p>
                </div>
              </div>

              {passwordSuccessMsg && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{passwordSuccessMsg}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPasswordSuccessMsg(null)}
                    className="text-emerald-700 hover:underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {passwordErrorMsg && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>{passwordErrorMsg}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPasswordErrorMsg(null)}
                    className="text-rose-700 hover:underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Password Form Container */}
              <div className="max-w-lg space-y-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-gray-200 text-slate-900 min-h-[42px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewAdminPassword ? "text" : "password"}
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-gray-200 text-slate-900 min-h-[42px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewAdminPassword(!showNewAdminPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type={showNewAdminPassword ? "text" : "password"}
                    value={confirmAdminPassword}
                    onChange={(e) => setConfirmAdminPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-slate-900 min-h-[42px]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={changingPassword}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#FF6448] hover:bg-[#e8553b] disabled:bg-gray-400 text-white font-bold rounded-xl shadow-md transition-all text-xs min-h-[42px] active:scale-95"
                  >
                    <Lock className="h-4 w-4" />
                    <span>{changingPassword ? "Updating Password..." : "Update Password"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Security Channels Info Card */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Password Management & Recovery Channels</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-neutral-50 border border-gray-200 space-y-1.5">
                  <span className="font-bold text-xs text-slate-900 block">Current Password Verification</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Update your admin credentials anytime from this settings tab by validating your existing password.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 border border-gray-200 space-y-1.5">
                  <span className="font-bold text-xs text-slate-900 block">Telegram Bot OTP Reset</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Forgot your password? Request an instant 6-digit one-time passcode delivered directly to your Telegram alerts bot.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Save Changes Floating / Bottom Bar */}
        {activeTab !== "security" && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-slate-900 text-white rounded-2xl shadow-xl">
            <div className="text-xs">
              <span className="font-bold block">Unsaved Changes?</span>
              <span className="text-slate-400 text-[11px]">Click save to push updates to the live storefront immediately.</span>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 px-6 sm:px-7 py-3 bg-[#FF6448] hover:bg-[#e8553b] disabled:bg-gray-600 text-white font-bold rounded-xl shadow-lg shadow-[#FF6448]/30 transition-all text-xs min-h-[44px] active:scale-95 shrink-0"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? "Publishing Changes..." : "Save Store Settings"}</span>
            </button>
          </div>
        )}
      </form>

      {/* =====================================================================
          ADD / EDIT BANNER MODAL DIALOG
          ===================================================================== */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/60 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FF6448]/10 text-[#FF6448] flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingBanner ? "Edit Hero Banner Slide" : "Create New Hero Banner Slide"}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Customize headlines, visuals, CTAs, and background gradients
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBannerModalOpen(false)}
                className="w-8 h-8 rounded-xl hover:bg-slate-200/80 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body: Scrollable */}
            <form onSubmit={handleSaveBanner} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
              {/* 1. Real-time Live Preview Card */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Live Banner Preview
                </span>
                <div
                  className={`rounded-2xl p-4 sm:p-6 bg-gradient-to-br ${
                    bannerForm.bgGradient || "from-[#FF6448] via-[#FF755B] to-[#FF8A73]"
                  } text-white shadow-md relative overflow-hidden flex flex-col justify-between min-h-[160px] sm:min-h-[180px]`}
                >
                  {/* Card Background Photo Layer (when image is uploaded) */}
                  {bannerForm.imageUrl && (
                    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                      <img
                        src={bannerForm.imageUrl}
                        alt="Banner Background Preview"
                        className="w-full h-full object-cover object-center"
                      />
                      <div
                        className={`absolute inset-0 bg-gradient-to-r ${
                          bannerForm.bgGradient || "from-[#FF6448] via-[#FF755B] to-[#FF8A73]"
                        } opacity-75 mix-blend-multiply`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/20" />
                      <div className="absolute inset-0 bg-black/25" />
                    </div>
                  )}

                  <div className="space-y-2 relative z-10">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {bannerForm.badgeText && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold border border-white/20">
                          <Sparkles className="h-3 w-3 text-amber-200" />
                          <span>{bannerForm.badgeText}</span>
                        </span>
                      )}
                      {bannerForm.badgeSecondary && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-md text-[10px] font-bold border border-white/10">
                          <Star className="h-2.5 w-2.5 fill-amber-300 text-amber-300" />
                          <span>{bannerForm.badgeSecondary}</span>
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 max-w-sm">
                      <h4 className="text-base sm:text-xl font-black tracking-tight leading-tight">
                        {bannerForm.title || "Your Banner Headline Here"}
                      </h4>
                      <p className="text-[11px] text-white/90 line-clamp-2">
                        {bannerForm.subtitle || "Your promotional subtitle and value proposition description."}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 relative z-10 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 bg-[#181A1D] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-sm">
                      <span>{bannerForm.ctaText || "Shop Catalog"}</span>
                      <ArrowRight className="h-3 w-3" />
                    </span>
                    <span className="text-[10px] font-mono text-white/70">
                      Link: {bannerForm.ctaLink || "#catalog"}
                    </span>
                  </div>

                  <div className="absolute -right-6 -bottom-6 w-32 h-20 striped-bar-pattern opacity-20 pointer-events-none rounded-tl-full" />
                </div>
              </div>

              {/* 2. Text Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-[11px] text-slate-700 mb-1">
                    Headline Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bannerForm.title}
                    onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                    placeholder="e.g. Curated Essentials & Gifts"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-slate-900 text-xs font-semibold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-[11px] text-slate-700 mb-1">
                    Subtitle / Promotional Description
                  </label>
                  <textarea
                    rows={2}
                    value={bannerForm.subtitle}
                    onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                    placeholder="e.g. Quality Products Delivered to Your Doorstep. Zero advance payment required."
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[11px] text-slate-700 mb-1">
                    Top Pill Tag (Primary Badge)
                  </label>
                  <input
                    type="text"
                    value={bannerForm.badgeText}
                    onChange={(e) => setBannerForm({ ...bannerForm, badgeText: e.target.value })}
                    placeholder="✨ Featured Collection 2026"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[11px] text-slate-700 mb-1">
                    Secondary Trust Badge
                  </label>
                  <input
                    type="text"
                    value={bannerForm.badgeSecondary}
                    onChange={(e) =>
                      setBannerForm({ ...bannerForm, badgeSecondary: e.target.value })
                    }
                    placeholder="Cash on Delivery Available"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[11px] text-slate-700 mb-1">
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={bannerForm.ctaText}
                    onChange={(e) => setBannerForm({ ...bannerForm, ctaText: e.target.value })}
                    placeholder="Shop Catalog"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-slate-900 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[11px] text-slate-700 mb-1">
                    CTA Button Target Link
                  </label>
                  <input
                    type="text"
                    value={bannerForm.ctaLink}
                    onChange={(e) => setBannerForm({ ...bannerForm, ctaLink: e.target.value })}
                    placeholder="#catalog or /#catalog or custom link"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-slate-900 text-xs font-mono"
                  />
                </div>
              </div>

              {/* 3. Color Theme / Gradient Preset Selector */}
              <div className="space-y-2">
                <label className="block font-bold text-[11px] text-slate-700">
                  Background Gradient Theme
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {GRADIENT_PRESETS.map((preset) => {
                    const isSelected = bannerForm.bgGradient === preset.value;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() =>
                          setBannerForm((prev) => ({ ...prev, bgGradient: preset.value }))
                        }
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                          isSelected
                            ? "border-[#FF6448] bg-orange-50/50 shadow-xs ring-2 ring-[#FF6448]/20"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div
                          className="w-5 h-5 rounded-full shrink-0 shadow-xs border border-white"
                          style={{ backgroundColor: preset.preview }}
                        />
                        <span className="text-[10px] font-bold text-slate-700 truncate">
                          {preset.label.split(" ")[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="pt-1">
                  <input
                    type="text"
                    value={bannerForm.bgGradient}
                    onChange={(e) => setBannerForm({ ...bannerForm, bgGradient: e.target.value })}
                    placeholder="Custom Tailwind classes e.g. from-[#FF6448] via-[#FF755B] to-[#FF8A73]"
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-slate-600 text-[11px] font-mono"
                  />
                </div>
              </div>

              {/* 4. Banner Background Image */}
              <div className="space-y-2">
                <label className="block font-bold text-[11px] text-slate-700">
                  Banner Background Photo (Full Card Background)
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors">
                    <Upload className="h-3.5 w-3.5 text-slate-500" />
                    <span>{isUploadingBannerImg ? "Uploading..." : "Upload Background Photo"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingBannerImg}
                      onChange={handleBannerImgUpload}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="text"
                    value={bannerForm.imageUrl}
                    onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
                    placeholder="Or enter direct image URL (https://...)"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 text-slate-900 text-xs font-mono"
                  />

                  {bannerForm.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setBannerForm({ ...bannerForm, imageUrl: "" })}
                      className="px-2.5 py-2 text-[11px] font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                    >
                      Clear Image
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-500">
                  {bannerImgFeedback || "This photo serves as the full-bleed background for your banner card. Theme gradient and readability overlays are automatically applied so text and buttons pop."}
                </p>
              </div>

              {/* 5. Active Toggle */}
              <div className="p-3 rounded-xl bg-slate-50 border border-gray-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Active Status</span>
                  <p className="text-[10px] text-slate-500">
                    If active, this banner is immediately included in the homepage carousel rotation.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bannerForm.isActive}
                    onChange={(e) =>
                      setBannerForm((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBanner}
                  className="px-6 py-2.5 rounded-xl bg-[#FF6448] hover:bg-[#e05237] disabled:bg-gray-400 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{savingBanner ? "Saving Banner..." : "Save Banner"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
