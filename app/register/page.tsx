"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CustomerRegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register-customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      router.push(data.redirectUrl || "/");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center gap-3 group focus:outline-none">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0284C7] to-[#0369A1] shadow-lg shadow-blue-500/25 text-white transition-transform duration-200 group-hover:scale-105">
            <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            </svg>
          </div>
          <span className="text-2xl font-black tracking-tight text-[#0B1E48]">
            Auto<span className="text-[#0284C7]">Insight</span>
          </span>
        </Link>

        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-slate-900">
          Create Customer Account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Sign up to track damage assessments and manage insurance claims.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-200/80">
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200 text-sm font-medium text-red-800">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-slate-700">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 shadow-sm focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 shadow-sm focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">Phone Number (Optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 shadow-sm focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 shadow-sm focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 shadow-sm focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 sm:text-sm"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 rounded-xl shadow-md shadow-blue-500/20 text-sm font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] focus:outline-none focus:ring-2 focus:ring-[#0284C7] disabled:opacity-50 transition-all"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-5 text-center text-xs text-slate-600 space-y-2">
            <p>
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-[#0284C7] hover:underline">
                Sign in
              </Link>
            </p>
            <p>
              Are you a repair shop or body shop?{" "}
              <Link href="/register/service-center" className="font-bold text-[#0B1E48] hover:underline">
                Register as Service Center
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
