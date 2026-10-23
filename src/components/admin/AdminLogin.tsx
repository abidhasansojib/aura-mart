"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, KeyRound, ArrowRight, ArrowLeft, AlertCircle, Eye, EyeOff } from "lucide-react";

interface AdminLoginProps {
  onSuccess: () => void;
}

export function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [passcode, setPasscode] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!passcode.trim()) {
      setError("Please enter the admin passcode.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid admin passcode.");
      }

      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-200 shadow-xl p-8 space-y-6">
        {/* Header Icon & Brand */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="h-7 w-7 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Store Owner Portal
          </h1>
          <p className="text-xs text-slate-500">
            Enter your admin secret passcode to manage orders and inventory.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="adminPasscode"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Secret Passcode
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="adminPasscode"
                type={showPasscode ? "text" : "password"}
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter ADMIN_SECRET_KEY"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 min-h-[44px]"
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label={showPasscode ? "Hide passcode" : "Show passcode"}
              >
                {showPasscode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Configured via ADMIN_SECRET_KEY in your environment variables.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-colors text-sm min-h-[44px]"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Unlock Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-gray-100 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Storefront</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
