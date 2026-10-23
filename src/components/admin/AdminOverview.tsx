"use client";

import React, { useState, useMemo } from "react";
import {
  ArrowUpRight,
  Clock,
  AlertTriangle,
  Sparkles,
  MapPin,
  CheckCircle2,
  DollarSign,
  Send,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface OrderItem {
  id: string;
  quantity: number;
  priceAtPurchase: number;
}

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  deliveryZone: string;
  items: OrderItem[];
}

interface Product {
  id: string;
  name: string;
  stock: number;
  price: number;
  isActive: boolean;
}

interface AdminOverviewProps {
  orders: Order[];
  products: Product[];
  currencySymbol?: string;
  onRefreshData: () => void;
  onGoToTab: (tab: "overview" | "orders" | "products" | "settings") => void;
}

export function AdminOverview({
  orders,
  products,
  currencySymbol = "৳",
  onRefreshData,
  onGoToTab,
}: AdminOverviewProps) {
  const [seeding, setSeeding] = useState(false);
  const [seedSuccessMsg, setSeedSuccessMsg] = useState<string | null>(null);
  const [copilotPrompt, setCopilotPrompt] = useState("");
  const [copilotReply, setCopilotReply] = useState<string | null>(null);

  // 1. KPI Calculations
  const metrics = useMemo(() => {
    const deliveredOrders = orders.filter((o) => o.status === "Delivered");
    const deliveredRevenue = deliveredOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const activePipelineOrders = orders.filter((o) =>
      ["Pending", "Confirmed", "Shipped"].includes(o.status)
    );
    const pipelineRevenue = activePipelineOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const pendingOrdersCount = orders.filter((o) => o.status === "Pending").length;

    // Today's orders & revenue
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayOrders = orders.filter((o) => new Date(o.createdAt).getTime() >= startOfToday);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const nonCancelledOrders = orders.filter((o) => o.status !== "Cancelled");
    const avgOrderValue =
      nonCancelledOrders.length > 0
        ? Math.round(nonCancelledOrders.reduce((sum, o) => sum + o.totalAmount, 0) / nonCancelledOrders.length)
        : 0;

    const lowStockCount = products.filter((p) => p.stock <= 5).length;
    const outOfStockCount = products.filter((p) => p.stock === 0).length;

    // Completion rate
    const completionRate =
      orders.length > 0 ? Math.round((deliveredOrders.length / orders.length) * 100) : 100;

    return {
      deliveredRevenue,
      pipelineRevenue,
      pendingOrdersCount,
      todayRevenue,
      todayOrdersCount: todayOrders.length,
      avgOrderValue,
      lowStockCount,
      outOfStockCount,
      completionRate,
      totalOrdersCount: orders.length,
    };
  }, [orders, products]);

  // 2. 7-Day Sales Trend Bar Chart Data
  const weeklyData = useMemo(() => {
    const days: { label: string; dateStr: string; revenue: number; orderCount: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      days.push({ label, dateStr, revenue: 0, orderCount: 0 });
    }

    orders.forEach((o) => {
      const orderDateStr = o.createdAt.split("T")[0];
      const match = days.find((d) => d.dateStr === orderDateStr);
      if (match && o.status !== "Cancelled") {
        match.revenue += o.totalAmount;
        match.orderCount += 1;
      }
    });

    const maxRevenue = Math.max(...days.map((d) => d.revenue), 100);
    const peakDay = days.reduce(
      (max, d) => (d.revenue > max.revenue ? d : max),
      days[days.length - 1]
    );

    return {
      days,
      maxRevenue,
      peakDay,
    };
  }, [orders]);

  const handleSeedDemoData = async () => {
    setSeeding(true);
    setSeedSuccessMsg(null);
    try {
      const res = await fetch("/api/admin/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Seed failed");
      setSeedSuccessMsg(data.message || "Sample products seeded successfully!");
      onRefreshData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to seed demo data");
    } finally {
      setSeeding(false);
    }
  };

  const handleCopilotAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotPrompt.trim()) return;

    const q = copilotPrompt.toLowerCase();
    if (q.includes("stock") || q.includes("product")) {
      setCopilotReply(
        `Catalog Status: ${products.length} products total. ${metrics.lowStockCount} items have ≤5 units left in inventory.`
      );
    } else if (q.includes("revenue") || q.includes("sales")) {
      setCopilotReply(
        `Delivered Revenue: ${formatPrice(metrics.deliveredRevenue, currencySymbol)}, Active Pipeline: ${formatPrice(
          metrics.pipelineRevenue,
          currencySymbol
        )}.`
      );
    } else if (q.includes("order")) {
      setCopilotReply(
        `Orders Pipeline: ${metrics.totalOrdersCount} total orders, ${metrics.pendingOrdersCount} pending confirmation.`
      );
    } else {
      setCopilotReply(
        `Analyzing Aura Mart: Store conversion is active. Top priority is fulfilling ${metrics.pendingOrdersCount} pending orders.`
      );
    }
    setCopilotPrompt("");
  };

  return (
    <div className="space-y-6">
      {/* Seed notification */}
      {seedSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{seedSuccessMsg}</span>
        </div>
      )}

      {/* =========================================================================
          BENTO GRID CONTAINER (Matching Dribbble Reference)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* =======================================================================
            CARD 1: CORAL REVENUE CARD (Span 8 Cols)
            ======================================================================= */}
        <div className="lg:col-span-8 bg-[#FF6448] text-white rounded-[28px] p-6 sm:p-7 shadow-xl flex flex-col justify-between relative overflow-hidden bento-card">
          {/* Card Header */}
          <div className="flex items-center justify-between gap-2.5 sm:gap-3 relative z-10 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-black tracking-wider uppercase">REVENUE</h3>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="text-[10px] sm:text-[11px] font-bold bg-white/20 backdrop-blur-sm px-2.5 sm:px-3 py-1 rounded-full border border-white/20">
                this week ▾
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold bg-white/20 backdrop-blur-sm px-2.5 sm:px-3 py-1 rounded-full border border-white/20">
                {currencySymbol} (BDT) ▾
              </span>
            </div>
          </div>

          {/* Card Body: Split Chart (Left) and High-Impact Numbers (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end pt-6 sm:pt-8 relative z-10">
            {/* Chart Column (7 Cols) */}
            <div className="md:col-span-7 flex flex-col justify-end space-y-3">
              {/* Active Day Price Tooltip Pill */}
              <div className="flex justify-center md:justify-start pl-8">
                <div className="bg-slate-950 text-white text-[11px] font-mono font-bold px-3 py-1 rounded-full shadow-lg">
                  {formatPrice(weeklyData.peakDay.revenue || 0, currencySymbol)}
                </div>
              </div>

              {/* Striped Chart Bars */}
              <div className="h-40 flex items-end justify-between gap-2 sm:gap-3 px-2 pt-2">
                {weeklyData.days.map((day) => {
                  const isPeak = day.dateStr === weeklyData.peakDay.dateStr;
                  const heightPercent = Math.max(
                    Math.round((day.revenue / weeklyData.maxRevenue) * 100),
                    18
                  );

                  return (
                    <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      {/* Bar Container */}
                      <div className="w-full max-w-[36px] h-32 bg-white/25 rounded-t-xl rounded-b-md overflow-hidden flex flex-col justify-end p-0.5 relative">
                        {/* Upper Striped Pattern area */}
                        <div className="absolute inset-x-0 top-0 h-10 striped-bar-pattern opacity-40 pointer-events-none" />

                        {/* Solid fill indicator */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-lg transition-all duration-300 ${
                            isPeak
                              ? "bg-white shadow-md"
                              : "bg-white/80 hover:bg-white"
                          }`}
                        />
                      </div>

                      {/* Day Label Pill */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isPeak
                            ? "bg-slate-950 text-white"
                            : "text-white/80"
                        }`}
                      >
                        {day.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Numbers Column (5 Cols) */}
            <div className="md:col-span-5 flex flex-col justify-center space-y-6 md:pl-4 border-t md:border-t-0 md:border-l border-white/20 pt-4 md:pt-0">
              {/* Gross Revenue */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/80">
                    Gross Revenue
                  </span>
                  <span className="text-[10px] font-bold bg-slate-950 text-white px-2 py-0.5 rounded-full">
                    +7.5%
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight">
                  {formatPrice(metrics.deliveredRevenue + metrics.pipelineRevenue, currencySymbol)}
                </div>
              </div>

              {/* Avg Order Value */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/80">
                    Avg. Order Value
                  </span>
                  <span className="text-[10px] font-bold bg-slate-950 text-white px-2 py-0.5 rounded-full">
                    +2.4%
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono">
                  {formatPrice(metrics.avgOrderValue, currencySymbol)}
                  <span className="text-[11px] font-medium text-white/70 block mt-0.5">
                    Growth vs last week
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Background Ambient Glow */}
          <div className="absolute -right-16 -top-16 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* =======================================================================
            CARD 2 & 3: RIGHT COLUMN (Span 4 Cols)
            ======================================================================= */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Top Pill Card: Low Stock / Warning Alert */}
          <div
            onClick={() => onGoToTab("products")}
            className="bg-[#24272C] text-white rounded-[26px] p-5 shadow-lg flex items-center justify-between gap-4 cursor-pointer hover:bg-[#2A2E33] transition-all bento-card border border-white/5"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#F5B738] flex items-center justify-center text-slate-950 font-black shadow-md shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-white">
                  Inventory Health Check
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {metrics.lowStockCount > 0
                    ? `${metrics.lowStockCount} items have ≤5 units left`
                    : "All inventory healthy & active"}
                </p>
              </div>
            </div>

            <div className="w-8 h-8 rounded-full bg-white/10 hover:bg-white text-white hover:text-slate-950 flex items-center justify-center transition-colors shrink-0">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>

          {/* Indigo Blue Card: Venue / Pipeline Capacity */}
          <div className="bg-[#5256FF] text-white rounded-[28px] p-6 shadow-xl flex-1 flex flex-col justify-between bento-card relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-white/15">
              <h3 className="text-base font-black tracking-wider uppercase">
                ORDER PIPELINE
              </h3>
              <span className="text-[10px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full">
                active ▾
              </span>
            </div>

            {/* Status Percentages Circles */}
            <div className="grid grid-cols-4 gap-2 py-4 text-center">
              {[
                { label: "Pend", val: metrics.pendingOrdersCount, color: "bg-white/20" },
                { label: "Conf", val: orders.filter((o) => o.status === "Confirmed").length, color: "bg-white/20" },
                { label: "Ship", val: orders.filter((o) => o.status === "Shipped").length, color: "bg-white/20" },
                { label: "Deli", val: orders.filter((o) => o.status === "Delivered").length, color: "bg-white text-slate-950 font-black" },
              ].map((st) => (
                <div key={st.label} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-mono font-bold ${st.color}`}>
                    {st.val}
                  </div>
                  <span className="text-[10px] font-semibold text-white/80 mt-1">
                    {st.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom Status Dot Pills */}
            <div className="flex items-center justify-between text-[11px] font-bold pt-2 border-t border-white/15">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF6448]" />
                <span>Pending</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F5B738]" />
                <span>Dispatched</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>Delivered</span>
              </span>
            </div>
          </div>
        </div>

        {/* =======================================================================
            CARD 4: ICE MINT POINTS & DELIVERY HUBS (Span 4 Cols)
            ======================================================================= */}
        <div className="lg:col-span-4 bg-[#C4E9E5] text-slate-900 rounded-[28px] p-6 shadow-xl flex flex-col justify-between bento-card">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black uppercase tracking-wider">
              DELIVERY HUBS
            </h3>
            <div
              onClick={() => onGoToTab("settings")}
              className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Map Graphic Box */}
          <div className="my-4 h-36 rounded-2xl bg-gradient-to-br from-teal-200/80 to-cyan-300/80 p-3.5 flex flex-col justify-between border border-teal-300/50 relative overflow-hidden">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold self-start">
              <MapPin className="h-3 w-3 text-emerald-400" />
              <span>Central Dispatch Hub</span>
            </div>

            <div className="space-y-1 bg-white/80 backdrop-blur-sm p-2.5 rounded-xl border border-white/60">
              <div className="flex justify-between text-[11px] font-bold">
                <span>Inside City Express:</span>
                <span className="font-mono text-emerald-800">৳60</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold">
                <span>Nationwide Courier:</span>
                <span className="font-mono text-emerald-800">৳120</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
            <span>Nationwide Coverage</span>
            <span className="text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
              64 Districts Active
            </span>
          </div>
        </div>

        {/* =======================================================================
            CARD 5: WARM SAGE OPERATIONAL TIMING (Span 3 Cols)
            ======================================================================= */}
        <div className="lg:col-span-3 bg-[#D5E2DA] text-slate-900 rounded-[28px] p-6 shadow-xl flex flex-col justify-between bento-card">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black uppercase tracking-wider">
              FULFILLMENT
            </h3>
            <span className="text-[10px] font-bold bg-slate-900/10 px-2 py-0.5 rounded-md">
              UTC+6
            </span>
          </div>

          {/* Circular Radar Visual */}
          <div className="my-3 flex items-center justify-center">
            <div className="w-28 h-28 rounded-full border-4 border-slate-900/20 border-t-[#FF6448] flex flex-col items-center justify-center relative">
              <Clock className="h-6 w-6 text-slate-800" />
              <span className="text-sm font-black font-mono mt-1">
                {metrics.completionRate}%
              </span>
              <span className="text-[9px] uppercase font-bold text-slate-600">
                Fulfilled
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 pt-2 border-t border-slate-900/10">
            <span>Avg Delivery</span>
            <span className="font-mono font-bold text-slate-900">24-48 Hours</span>
          </div>
        </div>

        {/* =======================================================================
            CARD 6: AI OPERATIONS LEAD / COPILOT (Span 5 Cols)
            ======================================================================= */}
        <div className="lg:col-span-5 bg-[#24272C] text-white rounded-[28px] p-6 shadow-xl flex flex-col justify-between bento-card border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="text-base font-black uppercase tracking-wider">
                AI STORE COPILOT
              </h3>
            </div>
            <div className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Conversational Bubble */}
          <div className="bg-[#1C1E22] p-3.5 rounded-2xl border border-white/5 space-y-2 text-xs">
            <p className="text-slate-300 leading-relaxed">
              {copilotReply ||
                `Hi Admin! Aura Mart is operating smoothly. You have ${metrics.pendingOrdersCount} pending orders and ${products.length} products listed. Ready to assist with inventory or analytics.`}
            </p>

            {/* Quick Action Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {products.length === 0 ? (
                <button
                  type="button"
                  onClick={handleSeedDemoData}
                  disabled={seeding}
                  className="px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-bold hover:bg-emerald-400 transition-colors"
                >
                  ✨ Seed 6 Sample Products
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onGoToTab("orders")}
                  className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold transition-colors"
                >
                  📦 Review {metrics.pendingOrdersCount} Pending
                </button>
              )}

              <button
                type="button"
                onClick={() => onGoToTab("products")}
                className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold transition-colors"
              >
                🏷️ Manage Catalog
              </button>
            </div>
          </div>

          {/* Chat / Command Prompt Bar */}
          <form onSubmit={handleCopilotAsk} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FF6448] flex items-center justify-center text-white shrink-0 shadow-md">
              <span className="font-bold text-sm">+</span>
            </div>
            <input
              type="text"
              value={copilotPrompt}
              onChange={(e) => setCopilotPrompt(e.target.value)}
              placeholder="Ask about revenue, stock, or orders..."
              className="flex-1 min-w-0 bg-[#1C1E22] border border-white/10 rounded-full px-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 min-h-[38px]"
            />
            <button
              type="submit"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
