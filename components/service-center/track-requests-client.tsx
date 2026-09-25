"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { AssessmentRecord, AssessmentStatus } from "@/types/assessment";
import { AssessmentStatusBadge } from "./status-badge";

interface TrackRequestsClientProps {
  assessments: AssessmentRecord[];
}

export function TrackRequestsClient({ assessments }: TrackRequestsClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filteredAssessments = useMemo(() => {
    return assessments.filter((item) => {
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      const query = searchTerm.toLowerCase().trim();
      const matchesQuery =
        !query ||
        item.id.toLowerCase().includes(query) ||
        item.customer.name.toLowerCase().includes(query) ||
        item.vehicle.registrationNumber.toLowerCase().includes(query) ||
        item.vehicle.manufacturer.toLowerCase().includes(query) ||
        item.vehicle.model.toLowerCase().includes(query) ||
        item.policy.policyNumber.toLowerCase().includes(query);

      return matchesStatus && matchesQuery;
    });
  }, [assessments, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      {/* ─── Search & Filter Bar ──────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by ID, customer, plate, make..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 placeholder:font-normal rounded-lg border border-slate-300 focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7] outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-600 shrink-0">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto text-xs text-slate-900 border border-slate-300 rounded-lg px-3 py-2 bg-white focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7] outline-none"
          >
            <option value="ALL">All Statuses ({assessments.length})</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* ─── Assessments List / Table ─────────────────────────────────── */}
      {filteredAssessments.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="h-12 w-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {assessments.length === 0 ? "No Assessments Recorded Yet" : "No Assessments Matching Filter"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
            {assessments.length === 0
              ? "Generate your first vehicle damage assessment from the intake wizard to view and track progress here."
              : "Try adjusting your search criteria or filter options to locate the desired request."}
          </p>
          {assessments.length === 0 && (
            <div className="mt-5">
              <Link
                href="/service-center/new-assessment"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0369A1] transition-colors"
              >
                + Create New Assessment
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 text-[11px]">
                  <th className="py-3 px-4 font-semibold">Assessment ID</th>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Vehicle</th>
                  <th className="py-3 px-4 font-semibold">Policy & Insurer</th>
                  <th className="py-3 px-4 font-semibold">Photos</th>
                  <th className="py-3 px-4 font-semibold">Date Created</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssessments.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0B1E48]">
                      <Link
                        href={`/service-center/track/${record.id}`}
                        className="hover:text-[#0284C7] hover:underline"
                      >
                        {record.id}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">{record.customer.name}</p>
                      <p className="text-[11px] text-slate-400">{record.customer.phone}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-mono font-bold text-slate-800">{record.vehicle.registrationNumber}</p>
                      <p className="text-[11px] text-slate-500">
                        {record.vehicle.manufacturer} {record.vehicle.model} ({record.vehicle.year})
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-mono text-slate-800">{record.policy.policyNumber}</p>
                      <p className="text-[11px] text-slate-500">{record.policy.insuranceCompany}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        <svg className="h-3 w-3 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        {record.images?.length || record.aiAnalysis?.imagesProcessed || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(record.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <AssessmentStatusBadge status={record.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/service-center/track/${record.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#0284C7] hover:text-[#0369A1] transition-colors"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
