"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, AccountStatus, SessionUser } from "@/types/auth";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [serviceCenters, setServiceCenters] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AccountStatus | "all">("all");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionModalId, setRejectionModalId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const fetchCurrentUserAndList = React.useCallback(async () => {
    try {
      // 1. Check current session
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (!meData.authenticated || meData.user.role !== "admin") {
        router.push("/login?callbackUrl=/admin&access_denied=admin_only");
        return;
      }
      setCurrentUser(meData.user);

      // 2. Fetch service center requests
      const filterQuery = filter !== "all" ? `?status=${filter}` : "";
      const scRes = await fetch(`/api/admin/service-centers${filterQuery}`);
      const scData = await scRes.json();
      if (scData.success) {
        setServiceCenters(scData.serviceCenters);
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, [filter, router]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();
        if (!isMounted) return;
        if (!meData.authenticated || meData.user.role !== "admin") {
          router.push("/login?callbackUrl=/admin&access_denied=admin_only");
          return;
        }
        setCurrentUser(meData.user);

        const filterQuery = filter !== "all" ? `?status=${filter}` : "";
        const scRes = await fetch(`/api/admin/service-centers${filterQuery}`);
        const scData = await scRes.json();
        if (isMounted && scData.success) {
          setServiceCenters(scData.serviceCenters);
        }
      } catch {
        // Handle error
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [filter, router]);

  const handleReview = async (userId: string, status: AccountStatus.APPROVED | AccountStatus.REJECTED, reason?: string) => {
    setProcessingId(userId);
    setActionSuccessMsg(null);
    try {
      const res = await fetch("/api/admin/service-centers/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          status,
          rejectionReason: reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Action failed");
        return;
      }

      setActionSuccessMsg(`Successfully ${status} service center request.`);
      setRejectionModalId(null);
      setRejectionReason("");
      await fetchCurrentUserAndList();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to review");
    } finally {
      setProcessingId(null);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const pendingCount = serviceCenters.filter((s) => s.status === AccountStatus.PENDING).length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Admin Navigation Bar */}
      <header className="bg-[#0B1E48] text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-black text-white text-base">
              AI
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight leading-none">
                AutoInsight <span className="text-blue-400 font-normal text-xs uppercase tracking-wider ml-1">Admin Portal</span>
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">Role: Administrator</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors"
            >
              View Customer Home
            </Link>
            <div className="flex items-center gap-2 pl-3 border-l border-slate-700">
              <div className="h-7 w-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                AD
              </div>
              <span className="text-xs font-medium text-slate-200 hidden sm:inline">
                {currentUser?.name || "Admin"}
              </span>
              <button
                onClick={handleLogout}
                className="text-xs text-rose-300 hover:text-rose-100 px-2 py-1 rounded bg-rose-950/40 border border-rose-800/50 hover:bg-rose-900 transition-colors ml-2"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Service Center Approvals</h1>
            <p className="text-sm text-slate-600 mt-1">
              Review and authorize automotive service center partner registrations.
            </p>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filter === "all" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              All Requests
            </button>
            <button
              onClick={() => setFilter(AccountStatus.PENDING)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                filter === AccountStatus.PENDING ? "bg-amber-500 text-white" : "text-amber-700 hover:bg-amber-50"
              }`}
            >
              Pending Review
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-amber-900/40 text-white font-mono">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter(AccountStatus.APPROVED)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filter === AccountStatus.APPROVED ? "bg-emerald-600 text-white" : "text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilter(AccountStatus.REJECTED)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filter === AccountStatus.REJECTED ? "bg-rose-600 text-white" : "text-rose-700 hover:bg-rose-50"
              }`}
            >
              Rejected
            </button>
          </div>
        </div>

        {/* Action success alert */}
        {actionSuccessMsg && (
          <div className="mt-4 rounded-xl bg-emerald-50 p-4 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-800 text-sm font-medium">
              <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{actionSuccessMsg}</span>
            </div>
            <button onClick={() => setActionSuccessMsg(null)} className="text-xs text-emerald-700 underline font-semibold">
              Dismiss
            </button>
          </div>
        )}

        {/* Service Centers List */}
        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500 text-sm">
              Loading requests...
            </div>
          ) : serviceCenters.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500 text-sm">
              No service center requests found for the selected filter.
            </div>
          ) : (
            serviceCenters.map((sc) => {
              const profile = sc.serviceCenterProfile;
              const isPending = sc.status === AccountStatus.PENDING;
              const isApproved = sc.status === AccountStatus.APPROVED;
              const isRejected = sc.status === AccountStatus.REJECTED;

              return (
                <div
                  key={sc.id}
                  className={`bg-white rounded-2xl border p-6 shadow-sm transition-all ${
                    isPending
                      ? "border-amber-300 ring-1 ring-amber-200"
                      : isApproved
                      ? "border-slate-200 hover:border-emerald-200"
                      : "border-slate-200 opacity-80"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Facility Header */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-[#0B1E48]">
                          {profile?.serviceCenterName || sc.name}
                        </h2>
                        {/* Status Badge */}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                            isPending
                              ? "bg-amber-100 text-amber-800"
                              : isApproved
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {sc.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Submitted: {new Date(sc.createdAt).toLocaleString()} | ID: <span className="font-mono">{sc.id}</span>
                      </p>
                    </div>

                    {/* Action Buttons for Administrator */}
                    <div className="flex items-center gap-2">
                      {isPending && (
                        <>
                          <button
                            type="button"
                            disabled={processingId === sc.id}
                            onClick={() => handleReview(sc.id, AccountStatus.APPROVED)}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
                          >
                            {processingId === sc.id ? "Processing..." : "✓ Approve Request"}
                          </button>
                          <button
                            type="button"
                            disabled={processingId === sc.id}
                            onClick={() => setRejectionModalId(sc.id)}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 disabled:opacity-50 transition-colors"
                          >
                            ✕ Reject
                          </button>
                        </>
                      )}

                      {isApproved && (
                        <button
                          type="button"
                          disabled={processingId === sc.id}
                          onClick={() => setRejectionModalId(sc.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                        >
                          Revoke / Reject
                        </button>
                      )}

                      {isRejected && (
                        <button
                          type="button"
                          disabled={processingId === sc.id}
                          onClick={() => handleReview(sc.id, AccountStatus.APPROVED)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 hover:bg-emerald-50 border border-emerald-200 transition-colors"
                        >
                          Re-Approve
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                        Contact Details
                      </span>
                      <p className="mt-1 font-medium text-slate-800">{profile?.contactPerson || "N/A"}</p>
                      <p className="text-slate-600">{sc.email}</p>
                      <p className="text-slate-600">{profile?.phone || "N/A"}</p>
                    </div>

                    <div>
                      <span className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                        Address & Facility
                      </span>
                      <p className="mt-1 text-slate-700">{profile?.address || "Address not specified"}</p>
                    </div>

                    <div>
                      <span className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                        Licensing & Verification
                      </span>
                      <p className="mt-1 font-mono text-slate-800">
                        License: <strong className="text-blue-700">{profile?.registrationNumber || "N/A"}</strong>
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 text-slate-600">
                        <svg className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                        <span className="underline cursor-pointer text-[#0284C7]">
                          {profile?.supportingDocumentName || "document.pdf"}
                        </span>
                      </div>
                      {profile?.rejectionReason && (
                        <p className="mt-2 text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                          <strong>Rejection Note:</strong> {profile.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Rejection Note Modal/Inline for this item */}
                  {rejectionModalId === sc.id && (
                    <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3">
                      <h4 className="text-xs font-bold text-rose-900">
                        Specify reason for rejection (will be visible to the applicant):
                      </h4>
                      <textarea
                        rows={2}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="e.g. License documentation expired or unverified. Please re-submit valid certification."
                        className="w-full text-xs rounded-lg border border-rose-300 p-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setRejectionModalId(null)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReview(sc.id, AccountStatus.REJECTED, rejectionReason)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors"
                        >
                          Confirm Rejection
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
