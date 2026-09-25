import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { assessmentRepository } from "@/lib/assessment/repository";
import { TrackRequestsClient } from "@/components/service-center/track-requests-client";

export default async function TrackRequestPage() {
  const user = await getCurrentUser();
  const serviceCenterId = user?.id || "";

  // Retrieve persistent assessments belonging strictly to the logged-in Service Center
  const assessments = serviceCenterId
    ? await assessmentRepository.listByServiceCenter(serviceCenterId)
    : [];

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6" aria-label="Breadcrumb">
        <Link href="/service-center" className="hover:text-[#0284C7] transition-colors">
          Home
        </Link>
        <svg
          className="h-3 w-3 text-slate-300"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="text-slate-600 font-medium">Track Request</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
              <svg
                className="h-5 w-5 text-[#0284C7]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#0B1E48]">Track Assessment Requests</h1>
              <p className="text-xs text-slate-500">
                Monitor status and review reports for all vehicle damage assessments submitted by your center.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/service-center/new-assessment"
          className="inline-flex items-center gap-2 rounded-lg bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0369A1] transition-colors self-start sm:self-auto"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Assessment
        </Link>
      </div>

      {/* Interactive Table with Real Repository Data */}
      <TrackRequestsClient assessments={assessments} />
    </main>
  );
}
