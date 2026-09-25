"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SessionUser } from "@/types/auth";

export default function PendingApprovalPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
        // If status is now approved, redirect them to service center
        if (data.user.role === "service_center" && data.user.status === "approved") {
          router.push("/service-center");
        }
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.authenticated && data.user) {
          setUser(data.user);
          if (data.user.role === "service_center" && data.user.status === "approved") {
            router.push("/service-center");
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto">
        {/* Brand Shield */}
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0284C7] to-[#0369A1] shadow-lg shadow-blue-500/25 text-white">
            <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-[#0B1E48]">
            Auto<span className="text-[#0284C7]">Insight</span>
          </h1>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-xl shadow-slate-200/50 border border-slate-200/80 text-center">
          {/* Pending Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 border-2 border-amber-200 text-amber-500 mb-4 animate-pulse">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 mb-2">
            Status: Pending Administrator Review
          </span>

          <h2 className="text-xl font-extrabold text-slate-900 mt-2">
            Application Under Review
          </h2>

          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            Thank you for applying to join AutoInsight. Your Service Center account for{" "}
            <span className="font-semibold text-slate-900">
              {user?.serviceCenterName || user?.name || "your facility"}
            </span>{" "}
            is currently pending administrator verification.
          </p>

          <div className="mt-6 rounded-xl bg-slate-50 p-4 border border-slate-200 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Account Role:</span>
              <span className="font-bold text-slate-700">service_center</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Account Status:</span>
              <span className="font-bold text-amber-600">pending</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Service Center Access:</span>
              <span className="font-bold text-rose-600">Locked until approved</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={fetchSession}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-[#0284C7] bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              {loading ? "Checking..." : "🔄 Refresh Application Status"}
            </button>

            <button
              onClick={handleLogout}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Sign out
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400">
            Need urgent assistance? Contact{" "}
            <a href="mailto:support@autoinsight.com" className="text-[#0284C7] underline">
              support@autoinsight.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
