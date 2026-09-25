import React from "react";
import { AssessmentStatus } from "@/types/assessment";

interface StatusBadgeProps {
  status: AssessmentStatus;
  size?: "sm" | "md";
}

export function AssessmentStatusBadge({ status, size = "md" }: StatusBadgeProps) {
  let label = status.replace("_", " ");
  let colorClass = "bg-slate-100 text-slate-700 border-slate-200";

  switch (status) {
    case "SUBMITTED":
      label = "Submitted";
      colorClass = "bg-blue-50 text-blue-700 border-blue-200";
      break;
    case "UNDER_REVIEW":
      label = "Under Review";
      colorClass = "bg-amber-50 text-amber-700 border-amber-200";
      break;
    case "APPROVED":
      label = "Approved";
      colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
      break;
    case "REJECTED":
      label = "Rejected";
      colorClass = "bg-rose-50 text-rose-700 border-rose-200";
      break;
  }

  const sizeClass = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${sizeClass} ${colorClass}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "SUBMITTED"
            ? "bg-blue-500"
            : status === "UNDER_REVIEW"
            ? "bg-amber-500"
            : status === "APPROVED"
            ? "bg-emerald-500"
            : "bg-rose-500"
        }`}
      />
      {label}
    </span>
  );
}
