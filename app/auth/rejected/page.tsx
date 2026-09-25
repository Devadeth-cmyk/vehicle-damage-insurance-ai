"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SessionUser } from "@/types/auth";

export default function RejectedPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
      });
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto">
        <div className="bg-white rounded-2xl p-8 shadow-xl shadow-slate-200/50 border border-slate-200/80 text-center">
          {/* Rejection Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 border-2 border-rose-200 text-rose-500 mb-4">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800 mb-2">
            Status: Application Rejected
          </span>

          <h2 className="text-xl font-extrabold text-slate-900 mt-2">
            Access Not Approved
          </h2>

          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            Your Service Center registration request for{" "}
            <span className="font-semibold text-slate-900">
              {user?.serviceCenterName || user?.name || "your facility"}
            </span>{" "}
            was reviewed and declined by the administrator.
          </p>

          <div className="mt-6 rounded-xl bg-slate-50 p-4 border border-slate-200 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Account Role:</span>
              <span className="font-bold text-slate-700">service_center</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Account Status:</span>
              <span className="font-bold text-rose-600">rejected</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/register/service-center"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] transition-colors"
            >
              Submit New Application
            </Link>

            <button
              onClick={handleLogout}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
