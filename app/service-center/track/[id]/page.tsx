import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { assessmentRepository } from "@/lib/assessment/repository";
import { AssessmentStatusBadge } from "@/components/service-center/status-badge";
import { DamageVisualizer } from "@/components/service-center/damage-visualizer";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AssessmentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!id) {
    notFound();
  }

  const record = await assessmentRepository.findById(id);

  // Security guard: Ensure record exists and belongs to the currently logged in Service Center
  if (!record || (user && record.serviceCenterId !== user.id && user.role !== "admin")) {
    notFound();
  }

  const ai = record.aiAnalysis;

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-400" aria-label="Breadcrumb">
        <Link href="/service-center" className="hover:text-[#0284C7] transition-colors">
          Home
        </Link>
        <svg className="h-3 w-3 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <Link href="/service-center/track" className="hover:text-[#0284C7] transition-colors">
          Track Request
        </Link>
        <svg className="h-3 w-3 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="text-slate-600 font-medium font-mono">{record.id}</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-xl text-[#0B1E48]">{record.id}</span>
              <AssessmentStatusBadge status={record.status} />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Created on {new Date(record.createdAt).toLocaleString()} • Last Updated: {new Date(record.updatedAt).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/service-center/track"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              ← Back to List
            </Link>
            <Link
              href="/service-center/new-assessment"
              className="inline-flex items-center justify-center rounded-lg bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0369A1] transition-colors"
            >
              + New Assessment
            </Link>
          </div>
        </div>

        {/* Overview Grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Customer */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Customer Information
            </span>
            <p className="font-bold text-slate-900 text-sm">{record.customer.name}</p>
            <p className="text-slate-600">{record.customer.phone}</p>
            <p className="text-slate-600">{record.customer.email}</p>
            <p className="text-slate-500 text-[11px] truncate pt-1">{record.customer.address}</p>
          </div>

          {/* Vehicle */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Vehicle Details
            </span>
            <p className="font-mono font-bold text-[#0B1E48] text-sm">{record.vehicle.registrationNumber}</p>
            <p className="font-medium text-slate-800">{record.vehicle.manufacturer} {record.vehicle.model}</p>
            <p className="text-slate-600">Year: {record.vehicle.year}</p>
            <p className="text-slate-500 text-[11px]">Type: {record.vehicle.type}</p>
          </div>

          {/* Policy */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Insurance Policy
            </span>
            <p className="font-mono font-bold text-slate-900 text-sm">{record.policy.policyNumber}</p>
            <p className="font-medium text-slate-800">{record.policy.insuranceCompany}</p>
            <p className="text-slate-600">{record.policy.policyType}</p>
            <p className="text-slate-500 text-[11px]">Coverage: {record.policy.coverageType}</p>
          </div>

          {/* AI Detection Summary */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              AI Assessment Scope
            </span>
            <p className="font-bold text-purple-900 text-sm">
              {ai.totalDetectionsCount} {ai.totalDetectionsCount === 1 ? "Damage Item" : "Damage Items"}
            </p>
            <p className="text-slate-600">{ai.imagesProcessed} Photos Inspected</p>
            <p className="text-emerald-700 font-medium">CARDD YOLO Model: Active</p>
            <p className="text-amber-700 text-[11px]">Parts Checkpoint: Bypassed</p>
          </div>
        </div>
      </div>

      {/* Real AI Damage Details Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-[#0B1E48]">AI Computer Vision Damage Findings</h2>
            <p className="text-xs text-slate-500">
              Damage classifications and spatial localization recorded from the inference pipeline.
            </p>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            {ai.totalDetectionsCount} Damages Detected
          </span>
        </div>

        {/* Parts Notice */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3.5 text-xs text-amber-900 flex gap-3">
          <svg className="h-5 w-5 text-amber-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <p className="font-bold">Parts Detection Notice:</p>
            <p className="text-amber-800 mt-0.5">{ai.partsModelNote}</p>
          </div>
        </div>

        {/* Per Image Results with Bounding Box Visualizer */}
        <div className="space-y-6">
          {ai.results.map((imgRes, idx) => {
            // Find corresponding persisted image evidence URL
            const matchedImage = record.images?.find((img) => img.id === imgRes.imageId || img.fileName === imgRes.imageName) || record.images?.[idx];
            const displayUrl = imgRes.imageUrl || matchedImage?.url;

            return (
              <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/30 space-y-4 p-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      #{idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-slate-800">{imgRes.imageName}</span>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {imgRes.status}
                  </span>
                </div>

                {/* Persistent Image with Bounding Box Visualizer */}
                {displayUrl && (
                  <div className="bg-slate-900/5 rounded-xl p-2 sm:p-4 border border-slate-200/80">
                    <DamageVisualizer
                      imageUrl={displayUrl}
                      imageName={imgRes.imageName}
                      detections={imgRes.detections}
                    />
                  </div>
                )}

                <div className="p-1">
                  {imgRes.detections.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">
                      No damage detected above threshold in this photo.
                    </p>
                  ) : (
                    <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 text-[11px]">
                            <th className="py-2.5 px-3 font-semibold">Damage ID</th>
                            <th className="py-2.5 px-3 font-semibold">Damage Type</th>
                            <th className="py-2.5 px-3 font-semibold">Confidence</th>
                            <th className="py-2.5 px-3 font-semibold">Severity</th>
                            <th className="py-2.5 px-3 font-semibold">Severity Source</th>
                            <th className="py-2.5 px-3 font-semibold">Part Identified</th>
                            <th className="py-2.5 px-3 font-semibold">Bounding Box [x1, y1, x2, y2]</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {imgRes.detections.map((det) => (
                            <tr key={det.damage_id} className="hover:bg-slate-50/80">
                              <td className="py-2.5 px-3 font-mono text-slate-700 font-bold">#{det.damage_id}</td>
                              <td className="py-2.5 px-3">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-100 capitalize">
                                  {det.damage_type}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                                {(det.confidence * 100).toFixed(1)}%
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                                    det.severity === "Severe"
                                      ? "bg-rose-100 text-rose-800"
                                      : det.severity === "Moderate"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  {det.severity}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 capitalize">{det.severity_source}</td>
                              <td className="py-2.5 px-3 text-slate-400 italic">Unavailable</td>
                              <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                                [{det.bbox.join(", ")}]
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Adjuster Notes */}
        {(record.additionalNotes.additionalDamage || record.additionalNotes.otherRelevantInformation) && (
          <div className="pt-4 border-t border-slate-200 space-y-3 text-xs">
            <h4 className="font-semibold text-slate-800">Submitted Notes & Additional Information</h4>
            {record.additionalNotes.additionalDamage && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-700 block mb-0.5">Additional Damage Description:</span>
                <p className="text-slate-600">{record.additionalNotes.additionalDamage}</p>
              </div>
            )}
            {record.additionalNotes.otherRelevantInformation && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-700 block mb-0.5">Other Relevant Information:</span>
                <p className="text-slate-600">{record.additionalNotes.otherRelevantInformation}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
