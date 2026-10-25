/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BarChart3,
  Package,
  Boxes,
  Settings,
  LogOut,
  ExternalLink,
  RefreshCw,
  Bell,
  Store,
  ShieldCheck,
  Star,
} from "lucide-react";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { AdminOrders, AdminOrder } from "@/components/admin/AdminOrders";
import { AdminProducts, AdminProduct } from "@/components/admin/AdminProducts";
import { AdminSettings, StoreSettingsData } from "@/components/admin/AdminSettings";
import { AdminReviews } from "@/components/admin/AdminReviews";

type ActiveTab = "overview" | "orders" | "products" | "reviews" | "settings";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  // Data States
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [settings, setSettings] = useState<StoreSettingsData>({
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
    shopCity: "Bogura",
    shopAddress: "Bogura, Rajshahi, Bangladesh",
  });
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);

  // Load settings and check auth on mount
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setSettings(data);
          if (data.storeName) {
            document.title = `${data.storeName} — Admin Dashboard`;
          }
        }
      })
      .catch(() => {});

    fetch("/api/admin/auth")
      .then((res) => res.json())
      .then((data) => {
        setIsAuthenticated(Boolean(data.authenticated));
      })
      .catch(() => setIsAuthenticated(false));
  }, []);

  // Keep browser tab title dynamic whenever storeName changes
  useEffect(() => {
    if (settings.storeName) {
      document.title = `${settings.storeName} — Admin Dashboard`;
    }
  }, [settings.storeName]);

  // Fetch orders, products, settings, and pending reviews count
  const fetchDashboardData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [ordersRes, productsRes, settingsRes, reviewsRes] = await Promise.allSettled([
        fetch("/api/orders").then((r) => (r.ok ? r.json() : [])),
        fetch("/api/products?all=true").then((r) => (r.ok ? r.json() : [])),
        fetch("/api/settings").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/admin/reviews?status=PENDING").then((r) => (r.ok ? r.json() : null)),
      ]);

      if (ordersRes.status === "fulfilled" && Array.isArray(ordersRes.value)) {
        setOrders(ordersRes.value);
      }
      if (productsRes.status === "fulfilled" && Array.isArray(productsRes.value)) {
        setProducts(productsRes.value);
      }
      if (settingsRes.status === "fulfilled" && settingsRes.value) {
        setSettings(settingsRes.value);
      }
      if (reviewsRes.status === "fulfilled" && reviewsRes.value?.counts) {
        setPendingReviewsCount(reviewsRes.value.counts.pending || 0);
      }
    } catch (error) {
      console.warn("Failed to refresh admin dashboard data:", error);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, fetchDashboardData]);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
    } catch {
      // Ignore
    } finally {
      setIsAuthenticated(false);
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-700">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AdminLogin
        onSuccess={() => setIsAuthenticated(true)}
        storeName={settings.storeName}
        logoUrl={settings.logoUrl}
      />
    );
  }

  const pendingOrdersCount = orders.filter((o) => o.status === "Pending").length;
  const currencySymbol = settings.currencySymbol || "৳";

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case "overview":
        return "Dashboard / Overview";
      case "orders":
        return "Dashboard / Orders Pipeline";
      case "products":
        return "Dashboard / Products & Inventory";
      case "settings":
        return "Dashboard / Store Settings";
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-2 xs:p-3 sm:p-6 lg:p-8 pb-24 sm:pb-6 flex items-center justify-center font-sans selection:bg-[#FF6448] selection:text-white">
      {/* =======================================================================
          OUTER MATTE CONTAINER (Replicating Dribbble Reference)
          ======================================================================= */}
      <div className="w-full max-w-[1440px] bg-[#181A1D] text-white rounded-2xl sm:rounded-[36px] shadow-2xl p-3.5 xs:p-4 sm:p-6 lg:p-7 flex gap-4 sm:gap-6 border border-white/5 relative overflow-hidden">
        {/* =====================================================================
            1. FLOATING VERTICAL DOCK (LEFT SIDEBAR - Visible on Desktop >= sm)
            ===================================================================== */}
        <aside className="hidden sm:flex w-14 sm:w-16 bg-[#212429] rounded-[28px] p-2.5 flex-col justify-between items-center shrink-0 border border-white/5 shadow-lg">
          {/* Top Logo */}
          <div className="space-y-4 flex flex-col items-center w-full">
            <Link
              href="/"
              className="h-11 max-w-[100px] min-w-[44px] rounded-2xl bg-white text-slate-950 font-black text-xs flex items-center justify-center shadow-md hover:scale-105 transition-transform overflow-hidden p-1 border border-slate-200/80"
              title={`Visit ${settings.storeName || "Storefront"}`}
            >
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.storeName}
                  className="h-full w-auto max-w-full object-contain rounded-xl"
                />
              ) : (
                <span>{settings.storeName?.slice(0, 2).toUpperCase() || "AM"}</span>
              )}
            </Link>

            {/* Nav Icons */}
            <div className="space-y-2 pt-2 w-full flex flex-col items-center">
              {/* Home / Overview */}
              <button
                onClick={() => setActiveTab("overview")}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                  activeTab === "overview"
                    ? "bg-[#C4E9E5] text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
                title="Overview & Analytics"
              >
                <BarChart3 className="h-5 w-5" />
              </button>

              {/* Orders */}
              <button
                onClick={() => setActiveTab("orders")}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all relative ${
                  activeTab === "orders"
                    ? "bg-[#FF6448] text-white shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
                title="Orders Pipeline"
              >
                <Package className="h-5 w-5" />
                {pendingOrdersCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#F5B738] text-slate-950 text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-[#212429]">
                    {pendingOrdersCount}
                  </span>
                )}
              </button>

              {/* Products */}
              <button
                onClick={() => setActiveTab("products")}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                  activeTab === "products"
                    ? "bg-[#5256FF] text-white shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
                title="Products & Inventory"
              >
                <Boxes className="h-5 w-5" />
              </button>

              {/* Reviews Moderation */}
              <button
                onClick={() => setActiveTab("reviews")}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all relative ${
                  activeTab === "reviews"
                    ? "bg-amber-500 text-slate-950 shadow-md font-bold"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
                title="Customer Reviews Moderation"
              >
                <Star className="h-5 w-5 fill-current" />
                {pendingReviewsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-[#212429]">
                    {pendingReviewsCount}
                  </span>
                )}
              </button>

              {/* Settings */}
              <button
                onClick={() => setActiveTab("settings")}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                  activeTab === "settings"
                    ? "bg-white text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
                title="Store Settings"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Bottom Dock: Refresh, Logout, Avatar */}
          <div className="space-y-3 flex flex-col items-center w-full pt-4 border-t border-white/5">
            <button
              onClick={fetchDashboardData}
              disabled={isLoadingData}
              className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingData ? "animate-spin text-[#C4E9E5]" : ""}`} />
            </button>

            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>

            {/* Redesigned Executive Admin Profile Badge */}
            <div className="relative group cursor-default" title="Super Admin Account (Verified)">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#2D3036] via-[#1F2126] to-[#141619] border border-white/10 shadow-lg flex items-center justify-center relative overflow-hidden group-hover:border-amber-400/50 transition-all">
                <div className="absolute inset-0 bg-radial from-amber-400/15 via-transparent to-transparent pointer-events-none" />
                <ShieldCheck className="h-4.5 w-4.5 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              {/* Online Pulse Dot */}
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-[#212429]" />
              </span>
            </div>
          </div>
        </aside>

        {/* =====================================================================
            2. MAIN DASHBOARD CONTENT AREA
            ===================================================================== */}
        <div className="flex-1 flex flex-col min-w-0 space-y-5 sm:space-y-6">
          {/* Top Bar matching Dribbble Reference */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-white/5 sm:border-transparent">
            {/* Breadcrumb Title & Mobile Brand/Logout */}
            <div className="flex items-center justify-between w-full sm:w-auto">
              <div className="flex items-center gap-2.5">
                <Link
                  href="/"
                  className="sm:hidden h-8 max-w-[80px] min-w-[32px] rounded-xl bg-white text-slate-950 font-black text-[10px] flex items-center justify-center shadow-md shrink-0 overflow-hidden p-0.5 border border-slate-200"
                  title="Visit Store"
                >
                  {settings.logoUrl ? (
                    <img
                      src={settings.logoUrl}
                      alt={settings.storeName}
                      className="h-full w-auto max-w-full object-contain rounded-lg"
                    />
                  ) : (
                    <span>{settings.storeName?.charAt(0) || "A"}</span>
                  )}
                </Link>
                <h2 className="text-xs sm:text-sm font-semibold tracking-wide text-slate-400 font-mono truncate">
                  {getBreadcrumbTitle()}
                </h2>
              </div>

              {/* Mobile Logout Quick Trigger */}
              <button
                onClick={handleLogout}
                className="sm:hidden p-1.5 text-rose-400 hover:bg-rose-500/15 rounded-xl transition-colors shrink-0"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              {/* Store Location Pill */}
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#24272C] border border-white/5 text-[11px] sm:text-xs font-semibold text-slate-200 shadow-sm max-w-[200px] truncate">
                <Store className="h-3.5 w-3.5 text-[#FF6448] shrink-0" />
                <span className="font-bold truncate">{settings.storeName}</span>
                <span className="text-slate-400 text-[10px] hidden xs:inline">Central Hub</span>
              </div>

              {/* Bell Notification Pill */}
              <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#24272C] flex items-center justify-center text-slate-300 hover:text-white border border-white/5 shadow-sm shrink-0">
                <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {pendingOrdersCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF6448]" />
                )}
              </div>

              {/* Visit Store Button */}
              <Link
                href="/"
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 text-white text-[11px] sm:text-xs font-bold rounded-full transition-colors shrink-0"
              >
                <span>Live Store</span>
                <ExternalLink className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
              </Link>
            </div>
          </header>

          {/* Tab Views */}
          <div className="flex-1">
            {activeTab === "overview" && (
              <AdminOverview
                orders={orders}
                products={products}
                currencySymbol={currencySymbol}
                onRefreshData={fetchDashboardData}
                onGoToTab={setActiveTab}
              />
            )}

            {activeTab === "orders" && (
              <AdminOrders
                orders={orders}
                currencySymbol={currencySymbol}
                storeName={settings.storeName}
                supportPhone={settings.supportPhone}
                onOrderUpdated={fetchDashboardData}
              />
            )}

            {activeTab === "products" && (
              <AdminProducts
                products={products}
                currencySymbol={currencySymbol}
                onProductsUpdated={fetchDashboardData}
              />
            )}

            {activeTab === "reviews" && (
              <AdminReviews
                products={products}
                currencySymbol={currencySymbol}
                onReviewsUpdated={fetchDashboardData}
              />
            )}

            {activeTab === "settings" && (
              <AdminSettings
                initialSettings={settings}
                onSettingsSaved={fetchDashboardData}
              />
            )}
          </div>
        </div>
      </div>

      {/* =======================================================================
          3. MOBILE APP DOCK (Visible ONLY on Small Devices < sm)
          ======================================================================= */}
      <nav className="sm:hidden fixed bottom-3 inset-x-3 z-50 bg-[#212429]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 flex items-center justify-around gap-1 shadow-2xl pb-safe">
        {/* Overview Tab */}
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all ${
            activeTab === "overview"
              ? "bg-[#C4E9E5] text-slate-950 font-bold shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span className="text-[10px] mt-0.5 truncate">Overview</span>
        </button>

        {/* Orders Tab with Pending Count */}
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all relative ${
            activeTab === "orders"
              ? "bg-[#FF6448] text-white font-bold shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Package className="h-4 w-4" />
          {pendingOrdersCount > 0 && (
            <span className="absolute top-1 right-1.5 xs:right-2 w-3.5 h-3.5 bg-[#F5B738] text-slate-950 text-[8px] font-black rounded-full flex items-center justify-center ring-2 ring-[#212429]">
              {pendingOrdersCount}
            </span>
          )}
          <span className="text-[10px] mt-0.5 truncate">Orders</span>
        </button>

        {/* Products Tab */}
        <button
          onClick={() => setActiveTab("products")}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all ${
            activeTab === "products"
              ? "bg-[#5256FF] text-white font-bold shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Boxes className="h-4 w-4" />
          <span className="text-[10px] mt-0.5 truncate">Products</span>
        </button>

        {/* Reviews Tab */}
        <button
          onClick={() => setActiveTab("reviews")}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all relative ${
            activeTab === "reviews"
              ? "bg-amber-400 text-slate-950 font-bold shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Star className="h-4 w-4 fill-current" />
          {pendingReviewsCount > 0 && (
            <span className="absolute top-1 right-1.5 xs:right-2 w-3.5 h-3.5 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center ring-2 ring-[#212429]">
              {pendingReviewsCount}
            </span>
          )}
          <span className="text-[10px] mt-0.5 truncate">Reviews</span>
        </button>

        {/* Settings Tab */}
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all ${
            activeTab === "settings"
              ? "bg-white text-slate-950 font-bold shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Settings className="h-4 w-4" />
          <span className="text-[10px] mt-0.5 truncate">Settings</span>
        </button>

        <div className="w-[1px] h-6 bg-white/10 mx-0.5" />

        {/* Sync / Refresh */}
        <button
          onClick={fetchDashboardData}
          disabled={isLoadingData}
          className="flex flex-col items-center justify-center py-1.5 px-2 text-slate-400 hover:text-white"
          title="Refresh Data"
        >
          <RefreshCw className={`h-4 w-4 ${isLoadingData ? "animate-spin text-[#C4E9E5]" : ""}`} />
          <span className="text-[9px] mt-0.5">Sync</span>
        </button>
      </nav>
    </div>
  );
}
