import { getCurrentUser } from "@/lib/auth/session";
import { assessmentRepository } from "@/lib/assessment/repository";
import Link from "next/link";

export const dynamic = "force-dynamic";

const METRIC_CARDS = [
  {
    id: "active",
    label: "Active Requests",
    description: "In-progress assessments",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    id: "processing",
    label: "Processing",
    description: "Under AI analysis",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  {
    id: "completed",
    label: "Completed",
    description: "Assessment reports ready",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  {
    id: "review",
    label: "Requires Review",
    description: "Needs your attention",
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
  },
];

const WORKFLOW_STEPS = [
  { step: 1, text: "Submit vehicle and incident information" },
  { step: 2, text: "Upload visual evidence of the damage" },
  { step: 3, text: "AI analyzes the submitted evidence" },
  { step: 4, text: "Review the generated assessment report" },
  { step: 5, text: "Track and manage the assessment status" },
];

export default async function ServiceCenterDashboardPage() {
  const user = await getCurrentUser();

  const displayName =
    user?.serviceCenterName || user?.name || "Service Center";

  const serviceCenterId = user?.id;

  const assessments = serviceCenterId
    ? await assessmentRepository.listByServiceCenter(serviceCenterId)
    : [];


  const activeCount = assessments.filter(
    (assessment) =>
      assessment.status === "SUBMITTED" ||
      assessment.status === "UNDER_REVIEW"
  ).length;

  const processingCount = 0;

  const completedCount = assessments.filter(
    (assessment) => assessment.status === "APPROVED"
  ).length;

  const reviewCount = assessments.filter(
    (assessment) => assessment.status === "UNDER_REVIEW"
  ).length;

  const metricValues: Record<string, number> = {
    active: activeCount,
    processing: processingCount,
    completed: completedCount,
    review: reviewCount,
  };

  const recentAssessments = assessments.slice(0, 5);

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Welcome back
          </p>

          <h1 className="mt-0.5 text-2xl font-bold text-[#0B1E48] tracking-tight">
            {displayName}
          </h1>

          <p className="mt-1 text-sm text-slate-500 max-w-xl">
            Manage vehicle damage assessments, review assessment activity,
            and track submitted requests.
          </p>
        </div>

        <div className="shrink-0">
          <Link
            href="/service-center/new-assessment"
            id="new-assessment-primary-cta"
            className="inline-flex items-center gap-2 rounded-lg bg-[#0284C7] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0369A1] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] focus-visible:ring-offset-2 transition-colors"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>

            New Assessment
          </Link>

          <p className="mt-2 text-xs text-slate-400 max-w-[240px] leading-relaxed">
            Provide vehicle and incident information and submit visual evidence.
          </p>
        </div>
      </div>

      {/* Overview Metrics */}
      <section className="mt-8" aria-labelledby="metrics-heading">
        <div className="flex items-baseline justify-between mb-4">
          <h2
            id="metrics-heading"
            className="text-base font-semibold text-slate-800"
          >
            Assessment Activity
          </h2>

          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            Live assessment data
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {METRIC_CARDS.map((card) => (
            <div
              key={card.id}
              className="bg-white rounded-xl border border-slate-200 p-4"
            >
              <div
                className={`inline-flex h-8 w-8 rounded-lg ${card.bg} ${card.border} border items-center justify-center mb-3`}
              >
                <span className={`text-xs font-bold ${card.color}`}>
                  ●
                </span>
              </div>

              <p className="text-xl font-bold text-slate-800 tracking-tight">
                {metricValues[card.id]}
              </p>

              <p className="mt-0.5 text-xs font-semibold text-slate-700">
                {card.label}
              </p>

              <p className="mt-0.5 text-[11px] text-slate-400">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Assessments */}
        <section
          className="lg:col-span-2"
          aria-labelledby="recent-heading"
        >
          <div className="bg-white rounded-xl border border-slate-200">

            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2
                id="recent-heading"
                className="text-sm font-semibold text-slate-800"
              >
                Recent Assessments
              </h2>

              <Link
                href="/service-center/track"
                className="text-xs font-medium text-[#0284C7] hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="hidden sm:grid grid-cols-[1fr_1.2fr_auto_auto_auto] gap-4 px-5 py-2.5 bg-slate-50 border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <span>Assessment ID</span>
              <span>Vehicle</span>
              <span>Submitted</span>
              <span>Status</span>
              <span>Action</span>
            </div>

            {recentAssessments.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentAssessments.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_1.2fr_auto_auto_auto] gap-2 sm:gap-4 px-5 py-4 items-center"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        {assessment.id}
                      </p>

                      <p className="sm:hidden mt-1 text-[11px] text-slate-400">
                        {new Date(
                          assessment.createdAt
                        ).toLocaleDateString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-700">
                        {assessment.vehicle.manufacturer}{" "}
                        {assessment.vehicle.model}
                      </p>

                      <p className="text-[11px] text-slate-400">
                        {assessment.vehicle.registrationNumber}
                      </p>
                    </div>

                    <p className="hidden sm:block text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(
                        assessment.createdAt
                      ).toLocaleDateString()}
                    </p>

                    <div>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${assessment.status === "SUBMITTED"
                          ? "bg-blue-50 text-blue-700"
                          : assessment.status === "UNDER_REVIEW"
                            ? "bg-amber-50 text-amber-700"
                            : assessment.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                      >
                        {assessment.status.replace("_", " ")}
                      </span>
                    </div>

                    <Link
                      href={`/service-center/track/${assessment.id}`}
                      className="text-xs font-medium text-[#0284C7] hover:underline"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
                  <svg
                    className="h-6 w-6 text-slate-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>

                <p className="text-sm font-semibold text-slate-700">
                  No assessments yet
                </p>

                <p className="mt-1 text-xs text-slate-400 max-w-[260px]">
                  Submitted assessment requests will appear here. Start by
                  creating your first assessment.
                </p>

                <Link
                  href="/service-center/new-assessment"
                  className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0369A1] transition-colors"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>

                  Create New Assessment
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Assessment Workflow */}
        <section aria-labelledby="workflow-heading">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2
              id="workflow-heading"
              className="text-sm font-semibold text-slate-800 mb-4"
            >
              Assessment Workflow
            </h2>

            <ol className="space-y-4" role="list">
              {WORKFLOW_STEPS.map((item) => (
                <li
                  key={item.step}
                  className="flex items-start gap-3"
                >
                  <div className="shrink-0 h-6 w-6 rounded-full bg-[#0B1E48]/8 border border-[#0B1E48]/15 flex items-center justify-center mt-0.5">
                    <span className="text-[10px] font-bold text-[#0B1E48]">
                      {item.step}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
                    {item.text}
                  </p>
                </li>
              ))}
            </ol>

            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                AI analysis is performed automatically when an assessment is
                submitted. Generated results can be reviewed and tracked from
                this dashboard.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Quick Navigation */}
      <section
        className="mt-6"
        aria-label="Quick navigation"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

          <Link
            href="/service-center/new-assessment"
            className="group flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-4 hover:border-[#0284C7]/40 hover:shadow-sm transition-all"
          >
            <div className="shrink-0 h-9 w-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
              <svg
                className="h-4 w-4 text-blue-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 group-hover:text-[#0284C7] transition-colors">
                New Assessment
              </p>

              <p className="text-xs text-slate-400">
                Submit a damage report
              </p>
            </div>
          </Link>

          <Link
            href="/service-center/track"
            className="group flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-4 hover:border-[#0284C7]/40 hover:shadow-sm transition-all"
          >
            <div className="shrink-0 h-9 w-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
              <svg
                className="h-4 w-4 text-slate-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 group-hover:text-[#0284C7] transition-colors">
                Track Request
              </p>

              <p className="text-xs text-slate-400">
                Monitor assessment status
              </p>
            </div>
          </Link>

          <Link
            href="/service-center/backlog"
            className="group flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-4 hover:border-[#0284C7]/40 hover:shadow-sm transition-all"
          >
            <div className="shrink-0 h-9 w-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
              <svg
                className="h-4 w-4 text-slate-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 group-hover:text-[#0284C7] transition-colors">
                Backlog
              </p>

              <p className="text-xs text-slate-400">
                All previous assessments
              </p>
            </div>
          </Link>

        </div>
      </section>
    </main>
  );
}
