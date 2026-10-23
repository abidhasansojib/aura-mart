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
  Search,
  ChevronDown,
  Bell,
  Store,
} from "lucide-react";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { AdminOrders, AdminOrder } from "@/components/admin/AdminOrders";
import { AdminProducts, AdminProduct } from "@/components/admin/AdminProducts";
import { AdminSettings, StoreSettingsData } from "@/components/admin/AdminSettings";

type ActiveTab = "overview" | "orders" | "products" | "settings";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  // Data States
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [settings, setSettings] = useState<StoreSettingsData>({
    storeName: "Aura Mart",
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

  // Check auth on mount
  useEffect(() => {
    fetch("/api/admin/auth")
      .then((res) => res.json())
      .then((data) => {
        setIsAuthenticated(Boolean(data.authenticated));
      })
      .catch(() => setIsAuthenticated(false));
  }, []);

  // Fetch orders, products, settings
  const fetchDashboardData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [ordersRes, productsRes, settingsRes] = await Promise.allSettled([
        fetch("/api/orders").then((r) => (r.ok ? r.json() : [])),
        fetch("/api/products?all=true").then((r) => (r.ok ? r.json() : [])),
        fetch("/api/settings").then((r) => (r.ok ? r.json() : null)),
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
      <div className="min-h-screen bg-[#CBD5CE] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-700">Loading Bento Canvas...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onSuccess={() => setIsAuthenticated(true)} />;
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
    <div className="min-h-screen bg-[#CBD5CE] p-3 sm:p-6 lg:p-8 flex items-center justify-center font-sans">
      {/* =======================================================================
          OUTER MATTE CONTAINER (Replicating Dribbble Reference)
          ======================================================================= */}
      <div className="w-full max-w-[1440px] bg-[#181A1D] text-white rounded-[36px] shadow-2xl p-4 sm:p-6 lg:p-7 flex gap-4 sm:gap-6 border border-white/5 relative overflow-hidden">
        {/* =====================================================================
            1. FLOATING VERTICAL DOCK (LEFT SIDEBAR)
            ===================================================================== */}
        <aside className="w-14 sm:w-16 bg-[#212429] rounded-[28px] p-2.5 flex flex-col justify-between items-center shrink-0 border border-white/5 shadow-lg">
          {/* Top Logo */}
          <div className="space-y-4 flex flex-col items-center w-full">
            <Link
              href="/"
              className="w-10 h-10 rounded-2xl bg-white text-slate-950 font-black text-sm flex items-center justify-center shadow-md hover:scale-105 transition-transform"
              title="Storefront"
            >
              Am
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

            {/* Avatar Pill */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF6448] to-[#F5B738] flex items-center justify-center text-slate-950 font-black text-xs shadow-inner">
              👑
            </div>
          </div>
        </aside>

        {/* =====================================================================
            2. MAIN DASHBOARD CONTENT AREA
            ===================================================================== */}
        <div className="flex-1 flex flex-col min-w-0 space-y-6">
          {/* Top Bar matching Dribbble Reference */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            {/* Breadcrumb Title */}
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold tracking-wide text-slate-400 font-mono">
                {getBreadcrumbTitle()}
              </h2>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Search Pill */}
              <div className="w-9 h-9 rounded-full bg-[#24272C] flex items-center justify-center text-slate-300 hover:text-white border border-white/5 shadow-sm">
                <Search className="h-4 w-4" />
              </div>

              {/* Store Location Pill Dropdown */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#24272C] border border-white/5 text-xs font-semibold text-slate-200 shadow-sm">
                <Store className="h-3.5 w-3.5 text-[#FF6448]" />
                <span className="font-bold">{settings.storeName}</span>
                <span className="text-slate-400 text-[10px]">Central Hub</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </div>

              {/* Bell Notification Pill */}
              <div className="relative w-9 h-9 rounded-full bg-[#24272C] flex items-center justify-center text-slate-300 hover:text-white border border-white/5 shadow-sm">
                <Bell className="h-4 w-4" />
                {pendingOrdersCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF6448]" />
                )}
              </div>

              {/* Visit Store Button */}
              <Link
                href="/"
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-full transition-colors"
              >
                <span>Live Store</span>
                <ExternalLink className="h-3.5 w-3.5" />
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

            {activeTab === "settings" && (
              <AdminSettings
                initialSettings={settings}
                onSettingsSaved={fetchDashboardData}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
