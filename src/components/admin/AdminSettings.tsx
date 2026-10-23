"use client";

import React, { useState } from "react";
import {
  Save,
  Store,
  Phone,
  Truck,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Megaphone,
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
}

interface AdminSettingsProps {
  initialSettings: StoreSettingsData;
  onSettingsSaved: () => void;
}

export function AdminSettings({ initialSettings, onSettingsSaved }: AdminSettingsProps) {
  const [settings, setSettings] = useState<StoreSettingsData>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

      setSuccessMsg("Store settings updated successfully! Changes are live on your storefront.");
      onSettingsSaved();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs text-slate-700">
        {/* Section 1: Store Identity & Announcement */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Store className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">1. Store Branding & Identity</h3>
              <p className="text-[11px] text-slate-400">
                Configure your brand name, tagline, and top announcement banner
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-700 mb-1">
                Store Name
              </label>
              <input
                type="text"
                required
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 min-h-[42px]"
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
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 min-h-[42px]"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-700 mb-1">
                Store Tagline
              </label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                placeholder="Quality Products Delivered to Your Doorstep"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 min-h-[40px]"
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
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 min-h-[40px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Currency & Delivery Charges */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">2. Pricing & Delivery Charges</h3>
              <p className="text-[11px] text-slate-400">
                Set your default currency symbol and shipping rates
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-700 mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                required
                value={settings.currencySymbol}
                onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                placeholder="৳ or $ or €"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 min-h-[42px]"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-700 mb-1">
                Inside City Delivery
              </label>
              <input
                type="number"
                required
                value={settings.insideCityDelivery}
                onChange={(e) =>
                  setSettings({ ...settings, insideCityDelivery: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 min-h-[42px]"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-700 mb-1">
                Outside City / Nationwide
              </label>
              <input
                type="number"
                required
                value={settings.outsideCityDelivery}
                onChange={(e) =>
                  setSettings({ ...settings, outsideCityDelivery: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 min-h-[42px]"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Mobile Banking Instructions (bKash & Nagad) */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">3. Mobile Banking Numbers</h3>
              <p className="text-[11px] text-slate-400">
                Provide your payment numbers displayed to buyers selecting bKash or Nagad
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase tracking-wider text-[11px] text-[#E2136E] mb-1">
                bKash Number & Type
              </label>
              <input
                type="text"
                required
                value={settings.bkashNumber}
                onChange={(e) => setSettings({ ...settings, bkashNumber: e.target.value })}
                placeholder="01XXXXXXXXX (Personal/Send Money)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#E2136E]/20 focus:border-[#E2136E] min-h-[42px]"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-[11px] text-[#F7941D] mb-1">
                Nagad Number & Type
              </label>
              <input
                type="text"
                required
                value={settings.nagadNumber}
                onChange={(e) => setSettings({ ...settings, nagadNumber: e.target.value })}
                placeholder="01XXXXXXXXX (Personal/Send Money)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#F7941D]/20 focus:border-[#F7941D] min-h-[42px]"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/25 transition-all text-xs min-h-[46px]"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Saving Changes..." : "Save Store Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
