/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  KeyRound,
  User,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Send,
  CheckCircle2,
  Lock,
  Clock,
  Key,
} from "lucide-react";

interface AdminLoginProps {
  onSuccess: () => void;
  storeName?: string;
  logoUrl?: string;
}

type AuthMode = "login" | "forgot-request" | "forgot-verify" | "master-recovery";

function getPasswordStrength(pass: string): {
  label: "Weak" | "Fair" | "Strong";
  score: number;
  barColor: string;
} {
  if (!pass) return { label: "Weak", score: 0, barColor: "bg-gray-200" };
  let score = 0;
  if (pass.length >= 6) score++;
  if (pass.length >= 8) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;

  if (score <= 2) return { label: "Weak", score: 1, barColor: "bg-rose-500" };
  if (score <= 3) return { label: "Fair", score: 2, barColor: "bg-amber-500" };
  return { label: "Strong", score: 3, barColor: "bg-emerald-500" };
}

export function AdminLogin({
  onSuccess,
  storeName = "Aura Mart",
  logoUrl = "",
}: AdminLoginProps) {
  const [mode, setMode] = useState<AuthMode>("login");

  useEffect(() => {
    if (storeName) {
      document.title = `${storeName} — Admin Login`;
    }
  }, [storeName]);

  // Login credentials
  const [usernameOrEmail, setUsernameOrEmail] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password & reset fields
  const [otp, setOtp] = useState("");
  const [masterKey, setMasterKey] = useState("");
  const [showMasterKey, setShowMasterKey] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Status & Feedback states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 60-second OTP resend timer
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const strength = getPasswordStrength(newPassword);

  // 1. Standard Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!usernameOrEmail.trim()) {
      setError("Please enter your admin username or email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailOrUsername: usernameOrEmail.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid username or password.");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Request OTP to Telegram
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!usernameOrEmail.trim()) {
      setError("Please enter your admin username or email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailOrUsername: usernameOrEmail.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send verification code.");
      }

      setSuccessMessage(data.message || "Verification code sent to your Telegram bot.");
      setMode("forgot-verify");
      setResendCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Verify OTP / Master Key & Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (mode === "forgot-verify" && (!otp || otp.trim().length !== 6)) {
      setError("Please enter the 6-digit verification code sent to Telegram.");
      return;
    }

    if (mode === "master-recovery" && !masterKey.trim()) {
      setError("Please enter your server Master Recovery Key.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, string> = {
        emailOrUsername: usernameOrEmail.trim(),
        newPassword,
      };

      if (mode === "forgot-verify") {
        payload.otp = otp.trim();
      } else if (mode === "master-recovery") {
        payload.masterKey = masterKey.trim();
      }

      const res = await fetch("/api/admin/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Password reset failed.");
      }

      setSuccessMessage("Password reset successfully! Redirecting to dashboard...");
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#CBD5CE] text-slate-900 selection:bg-[#FF6448] selection:text-white flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Decorative Bento Ambient Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF6448]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#5256FF]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -right-10 -bottom-10 w-72 h-44 striped-bar-pattern opacity-10 pointer-events-none rounded-tl-full" />

      {/* Bento Glass Card Container */}
      <div className="w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-2xl sm:rounded-[32px] border border-black/5 shadow-2xl p-5 xs:p-7 sm:p-9 space-y-5 sm:space-y-6 relative z-10 bento-card">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block group">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#181A1D] text-white flex items-center justify-center mx-auto shadow-md group-hover:scale-105 transition-transform border border-white/10 relative overflow-hidden p-1.5">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={storeName}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <>
                  <span className="relative z-10 font-black text-xl">{storeName.charAt(0) || "A"}</span>
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#FF6448]/40 to-transparent pointer-events-none" />
                </>
              )}
            </div>
          </Link>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {storeName}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#181A1D] text-white text-[10px] font-bold uppercase tracking-wider mt-1 shadow-sm">
              <ShieldCheck className="h-3 w-3 text-[#FF6448]" />
              <span>Store Owner Portal</span>
            </span>
          </div>

          <p className="text-xs text-slate-500 font-medium pt-1">
            {mode === "login" && "Sign in with your database credentials to manage your store."}
            {mode === "forgot-request" && "Enter your admin username to receive a 6-digit Telegram OTP."}
            {mode === "forgot-verify" && "Enter the verification code sent to your Telegram bot."}
            {mode === "master-recovery" && "Emergency reset using your server ADMIN_SECRET_KEY."}
          </p>
        </div>

        {/* Status & Error Alerts */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="leading-snug">{successMessage}</span>
          </div>
        )}

        {/* =====================================================================
            VIEW 1: SIGN IN FORM
            ===================================================================== */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="usernameOrEmail"
                className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Username or Email
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="usernameOrEmail"
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="admin or admin@auramart.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-black/10 bg-white text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6448]/30 focus:border-[#FF6448] transition-all min-h-[46px]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="adminPassword"
                  className="block text-[11px] font-black uppercase tracking-wider text-slate-700"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMessage(null);
                    setMode("forgot-request");
                  }}
                  className="text-[11px] font-bold text-[#FF6448] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="adminPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-black/10 bg-white text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6448]/30 focus:border-[#FF6448] transition-all min-h-[46px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#FF6448] hover:bg-[#e8553b] disabled:bg-slate-400 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-[#FF6448]/25 hover:scale-[1.01] active:scale-95 transition-all text-sm min-h-[46px]"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* =====================================================================
            VIEW 2: FORGOT PASSWORD - REQUEST OTP
            ==================================================================== */}
        {mode === "forgot-request" && (
          <form onSubmit={handleRequestOtp} className="space-y-4 animate-in fade-in">
            <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs font-medium space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5 text-amber-600" />
                <span>Telegram Bot Verification</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                We will send an instant 6-digit one-time code to your connected Telegram bot (<code>@aura_mart_bot</code>).
              </p>
            </div>

            <div>
              <label
                htmlFor="resetIdentifier"
                className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Username or Email
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="resetIdentifier"
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="admin or admin@auramart.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-black/10 bg-white text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6448]/30 focus:border-[#FF6448] transition-all min-h-[46px]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#FF6448] hover:bg-[#e8553b] disabled:bg-slate-400 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-[#FF6448]/25 hover:scale-[1.01] active:scale-95 transition-all text-sm min-h-[46px]"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <Send className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Alternative: Master Recovery Key Option */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccessMessage(null);
                  setMode("master-recovery");
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1.5 mx-auto"
              >
                <Key className="h-3.5 w-3.5 text-slate-400" />
                <span>Or use Master Recovery Key</span>
              </button>
            </div>
          </form>
        )}

        {/* =====================================================================
            VIEW 3: FORGOT PASSWORD - VERIFY OTP & SET NEW PASSWORD
            ===================================================================== */}
        {mode === "forgot-verify" && (
          <form onSubmit={handleResetPassword} className="space-y-4 animate-in fade-in">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="otpInput"
                  className="block text-[11px] font-black uppercase tracking-wider text-slate-700"
                >
                  6-Digit Verification Code
                </label>
                {resendCooldown > 0 ? (
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Resend in {resendCooldown}s</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    className="text-[11px] font-bold text-[#FF6448] hover:underline"
                  >
                    Resend Code
                  </button>
                )}
              </div>
              <input
                id="otpInput"
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="123456"
                className="w-full text-center font-mono font-black text-xl tracking-[0.5em] py-2.5 rounded-2xl border border-black/10 bg-white text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#FF6448]/30 focus:border-[#FF6448] transition-all min-h-[46px]"
              />
            </div>

            {/* New Password */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5"
              >
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-black/10 bg-white text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6448]/30 focus:border-[#FF6448] transition-all min-h-[46px]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Strength Bar */}
              {newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-slate-400 uppercase">Strength:</span>
                    <span
                      className={
                        strength.label === "Strong"
                          ? "text-emerald-600"
                          : strength.label === "Fair"
                          ? "text-amber-600"
                          : "text-rose-600"
                      }
                    >
                      {strength.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden flex gap-1">
                    <div
                      className={`h-full flex-1 rounded-full ${
                        strength.score >= 1 ? strength.barColor : "bg-neutral-200"
                      }`}
                    />
                    <div
                      className={`h-full flex-1 rounded-full ${
                        strength.score >= 2 ? strength.barColor : "bg-neutral-200"
                      }`}
                    />
                    <div
                      className={`h-full flex-1 rounded-full ${
                        strength.score >= 3 ? strength.barColor : "bg-neutral-200"
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="confirmPassword"
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-black/10 bg-white text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6448]/30 focus:border-[#FF6448] transition-all min-h-[46px]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#FF6448] hover:bg-[#e8553b] disabled:bg-slate-400 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-[#FF6448]/25 hover:scale-[1.01] active:scale-95 transition-all text-sm min-h-[46px]"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Reset Password & Sign In</span>
                  <CheckCircle2 className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* =====================================================================
            VIEW 4: MASTER RECOVERY KEY RESET
            ===================================================================== */}
        {mode === "master-recovery" && (
          <form onSubmit={handleResetPassword} className="space-y-4 animate-in fade-in">
            <div className="p-3 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-indigo-900 text-xs font-medium space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-indigo-600" />
                <span>Emergency Master Recovery</span>
              </div>
              <p className="text-[11px] text-indigo-800 leading-relaxed">
                Enter the secret <code>ADMIN_SECRET_KEY</code> defined in your server environment to immediately reset credentials.
              </p>
            </div>

            <div>
              <label
                htmlFor="masterSecretKey"
                className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Master Secret Key
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="masterSecretKey"
                  type={showMasterKey ? "text" : "password"}
                  required
                  value={masterKey}
                  onChange={(e) => setMasterKey(e.target.value)}
                  placeholder="Enter ADMIN_SECRET_KEY"
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-black/10 bg-white text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6448]/30 focus:border-[#FF6448] transition-all min-h-[46px]"
                />
                <button
                  type="button"
                  onClick={() => setShowMasterKey(!showMasterKey)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showMasterKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="masterNewPassword"
                className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5"
              >
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="masterNewPassword"
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-black/10 bg-white text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6448]/30 focus:border-[#FF6448] transition-all min-h-[46px]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="masterConfirmPassword"
                className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="masterConfirmPassword"
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-black/10 bg-white text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6448]/30 focus:border-[#FF6448] transition-all min-h-[46px]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#181A1D] hover:bg-black disabled:bg-slate-400 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg hover:scale-[1.01] active:scale-95 transition-all text-sm min-h-[46px]"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Reset with Master Key & Sign In</span>
                  <CheckCircle2 className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Bottom Navigation Actions */}
        <div className="pt-4 border-t border-black/5 flex items-center justify-between text-xs">
          {mode !== "login" ? (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setSuccessMessage(null);
                setMode("login");
              }}
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-bold transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Sign In</span>
            </button>
          ) : (
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-[#FF6448]" />
              <span>{storeName} Portal v2.0</span>
            </span>
          )}

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 font-bold transition-colors ml-auto"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Storefront</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
