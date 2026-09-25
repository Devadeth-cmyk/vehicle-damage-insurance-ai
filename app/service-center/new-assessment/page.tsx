import Link from "next/link";
import { NewAssessmentWizard } from "@/components/service-center/new-assessment-wizard";

export default function NewAssessmentPage() {
  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6" aria-label="Breadcrumb">
        <Link href="/service-center" className="hover:text-[#0284C7] transition-colors">
          Home
        </Link>
        <svg className="h-3 w-3 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="text-slate-600 font-medium">New Assessment</span>
      </nav>

      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1.5">
          <div className="h-9 w-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
            <svg className="h-5 w-5 text-[#0284C7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0B1E48]">New Vehicle Damage Assessment</h1>
            <p className="text-xs text-slate-500">
              Complete vehicle, insurance, and damage information intake to prepare for claim processing.
            </p>
          </div>
        </div>
      </div>

      {/* Assessment Form Wizard */}
      <NewAssessmentWizard />
    </main>
  );
}
