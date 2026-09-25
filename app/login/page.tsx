"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const accessDeniedReason = searchParams.get("access_denied");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

  const error =
    customError ||
    (accessDeniedReason === "service_center_only"
      ? "Access denied: You must be an approved Service Center to access that area."
      : accessDeniedReason === "admin_only"
      ? "Access denied: Administrator permissions required."
      : null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // If a callbackUrl was requested and user is authorized, redirect or follow server redirectUrl
      const destination = callbackUrl || data.redirectUrl || "/";
      router.push(destination);
      router.refresh();
    } catch (err: unknown) {
      setCustomError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (testEmail: string, testPass: string) => {
    setEmail(testEmail);
    setPassword(testPass);
    setCustomError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Shield Header */}
        <Link href="/" className="flex items-center justify-center gap-3 group focus:outline-none">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0284C7] to-[#0369A1] shadow-lg shadow-blue-500/25 text-white transition-transform duration-200 group-hover:scale-105">
            <svg
              className="h-7 w-7 text-white"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2.5L4.5 5.5V11.2C4.5 16.1 7.7 20.6 12 21.8C16.3 20.6 19.5 16.1 19.5 11.2V5.5L12 2.5Z"
                fill="currentColor"
                fillOpacity="0.25"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M8.2 12.5L9.2 9.5C9.4 9 9.8 8.6 10.4 8.6H13.6C14.2 8.6 14.6 9 14.8 9.5L15.8 12.5"
                stroke="white"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7 12.8C7 12.4 7.3 12 7.7 12H16.3C16.7 12 17 12.4 17 12.8V15.2C17 15.6 16.7 16 16.3 16H7.7C7.3 16 7 15.6 7 15.2V12.8Z"
                stroke="white"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <circle cx="9" cy="14" r="0.8" fill="white" />
              <circle cx="15" cy="14" r="0.8" fill="white" />
            </svg>
          </div>
          <span className="text-2xl font-black tracking-tight text-[#0B1E48]">
            Auto<span className="text-[#0284C7]">Insight</span>
          </span>
        </Link>

        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-slate-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Single access portal for Customers, Service Centers, and Administrators.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-200/80">
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200">
              <div className="flex">
                <div className="shrink-0 text-red-500">
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3 text-sm font-medium text-red-800">{error}</div>
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                Email address
              </label>
              <div className="mt-1.5">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 sm:text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="mt-1.5">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 sm:text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 rounded-xl shadow-md shadow-blue-500/20 text-sm font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0284C7] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-5">
            <div className="flex flex-col space-y-2 text-center text-xs text-slate-600">
              <p>
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-bold text-[#0284C7] hover:underline">
                  Sign up as Customer
                </Link>
              </p>
              <p>
                Are you an automotive repair facility?{" "}
                <Link href="/register/service-center" className="font-bold text-[#0B1E48] hover:underline">
                  Apply for Service Center access
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Quick Test Accounts Switcher for Evaluation */}
        <div className="mt-8 rounded-2xl bg-white p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              ⚡ Instant Test Accounts
            </h3>
            <span className="text-[11px] text-slate-400">Click to autofill</span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill("admin@autoinsight.com", "Admin123!")}
              className="text-left px-3 py-2 rounded-lg text-xs bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-slate-200 flex items-center justify-between transition-colors group"
            >
              <div>
                <span className="font-bold text-slate-800 group-hover:text-purple-700">Administrator</span>
                <span className="block text-[11px] text-slate-500">admin@autoinsight.com</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700">
                admin
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill("approved@service.com", "Service123!")}
              className="text-left px-3 py-2 rounded-lg text-xs bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 flex items-center justify-between transition-colors group"
            >
              <div>
                <span className="font-bold text-slate-800 group-hover:text-emerald-700">Service Center (Approved)</span>
                <span className="block text-[11px] text-slate-500">approved@service.com</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                approved
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill("pending@service.com", "Service123!")}
              className="text-left px-3 py-2 rounded-lg text-xs bg-slate-50 hover:bg-amber-50 hover:border-amber-200 border border-slate-200 flex items-center justify-between transition-colors group"
            >
              <div>
                <span className="font-bold text-slate-800 group-hover:text-amber-700">Service Center (Pending)</span>
                <span className="block text-[11px] text-slate-500">pending@service.com</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
                pending
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill("rejected@service.com", "Service123!")}
              className="text-left px-3 py-2 rounded-lg text-xs bg-slate-50 hover:bg-rose-50 hover:border-rose-200 border border-slate-200 flex items-center justify-between transition-colors group"
            >
              <div>
                <span className="font-bold text-slate-800 group-hover:text-rose-700">Service Center (Rejected)</span>
                <span className="block text-[11px] text-slate-500">rejected@service.com</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700">
                rejected
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill("customer@autoinsight.com", "Customer123!")}
              className="text-left px-3 py-2 rounded-lg text-xs bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 flex items-center justify-between transition-colors group"
            >
              <div>
                <span className="font-bold text-slate-800 group-hover:text-blue-700">Customer Account</span>
                <span className="block text-[11px] text-slate-500">customer@autoinsight.com</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                customer
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
