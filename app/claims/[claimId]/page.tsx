"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type AnyObject = Record<string, any>;


function getNested(
  obj: AnyObject,
  paths: string[],
  fallback: any = null
) {
  for (const path of paths) {
    const value: any = path
      .split(".")
      .reduce<any>((current, key) => {
        if (current == null) {
          return undefined;
        }

        return current[key];
      }, obj as any);

    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return fallback;
}


function formatStatus(status: string | null | undefined) {
  if (!status) return "Pending";

  return status
    .toString()
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status: string | null | undefined) {
  const normalized = String(status || "").toUpperCase();

  if (
    normalized.includes("COMPLETED") ||
    normalized.includes("MATCH") ||
    normalized.includes("APPROVED")
  ) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (
    normalized.includes("FAILED") ||
    normalized.includes("REJECTED") ||
    normalized.includes("ERROR")
  ) {
    return "bg-red-50 text-red-700 border-red-200";
  }

  if (
    normalized.includes("REVIEW") ||
    normalized.includes("PARTIAL") ||
    normalized.includes("MISSING")
  ) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  return "bg-blue-50 text-blue-700 border-blue-200";
}

function numberValue(value: any) {
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[₹,$]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function money(value: any) {
  const amount = numberValue(value);

  if (amount === null) return "Not available";

  return `₹${amount.toLocaleString("en-IN")}`;
}

function percentage(value: any) {
  const numeric = numberValue(value);

  if (numeric === null) return "Not available";

  const normalized = numeric <= 1 ? numeric * 100 : numeric;

  return `${Math.round(normalized)}%`;
}

export default function CustomerAssessmentPage() {
  const params = useParams<{ claimId: string }>();
  const router = useRouter();

  const claimId = params?.claimId;

  const [claim, setClaim] = useState<AnyObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadClaim = useCallback(
    async (showRefreshing = false) => {
      if (!claimId) return;

      try {
        if (showRefreshing) {
          setRefreshing(true);
        }

        const response = await fetch(`/api/claims/${claimId}`, {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || "Unable to load claim."
          );
        }

        setClaim(data?.claim ?? data);
        setError("");
      } catch (err: any) {
        setError(
          err?.message || "Unable to load assessment."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [claimId]
  );

  useEffect(() => {
    loadClaim();

    const interval = window.setInterval(() => {
      loadClaim();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [loadClaim]);

  const assessment = claim?.aiAssessment ?? {};

  const computerVision =
    assessment?.computerVision ?? {};

  const nlp = assessment?.nlp ?? {};

  const evidence =
    assessment?.evidenceComparison ?? {};

  const missingEvidence =
    assessment?.missingEvidence ?? {};

  const rag =
    assessment?.rag ?? {};

  const llm =
    assessment?.llm ?? {};

  const cvResult =
    computerVision?.result ?? {};

  const detections = useMemo(() => {
    const images = Array.isArray(cvResult?.images)
      ? cvResult.images
      : [];

    const result: AnyObject[] = [];

    for (const image of images) {
      const imageDetections =
        Array.isArray(image?.detections)
          ? image.detections
          : [];

      for (const detection of imageDetections) {
        result.push({
          ...detection,
          imageName:
            image?.filename ||
            image?.originalName ||
            image?.name ||
            "Vehicle image",
        });
      }
    }

    return result;
  }, [cvResult]);

  const damageTypes = useMemo(() => {
    const values = new Set<string>();

    for (const detection of detections) {
      const value =
        detection?.className ??
        detection?.class ??
        detection?.label ??
        detection?.damageType ??
        detection?.name;

      if (value) {
        values.add(String(value));
      }
    }

    const fallback =
      cvResult?.damageTypes ??
      cvResult?.detectedDamage ??
      cvResult?.damages ??
      [];

    if (Array.isArray(fallback)) {
      fallback.forEach((item: any) => {
        const value =
          typeof item === "string"
            ? item
            : item?.name ??
              item?.label ??
              item?.damageType;

        if (value) {
          values.add(String(value));
        }
      });
    }

    return Array.from(values);
  }, [cvResult, detections]);

  const affectedParts = useMemo(() => {
    const values = new Set<string>();

    const directParts =
      cvResult?.affectedParts ??
      cvResult?.parts ??
      cvResult?.damagedParts ??
      [];

    if (Array.isArray(directParts)) {
      directParts.forEach((item: any) => {
        const value =
          typeof item === "string"
            ? item
            : item?.name ??
              item?.label ??
              item?.part;

        if (value) {
          values.add(String(value));
        }
      });
    }

    for (const detection of detections) {
      const value =
        detection?.part ??
        detection?.vehiclePart ??
        detection?.component;

      if (value) {
        values.add(String(value));
      }
    }

    return Array.from(values);
  }, [cvResult, detections]);

  const severity = getNested(
    cvResult,
    [
      "severity",
      "overallSeverity",
      "severityLevel",
      "assessment.severity",
    ],
    null
  );

  const confidence = getNested(
    cvResult,
    [
      "confidence",
      "overallConfidence",
      "assessment.confidence",
    ],
    null
  );

  const estimatedCost = getNested(
    cvResult,
    [
      "estimatedRepairCost",
      "repairCost",
      "estimatedCost",
      "claimValue",
      "estimatedClaimValue",
      "assessment.estimatedRepairCost",
    ],
    null
  );

  const reportedDamage =
    evidence?.result?.damage
      ?.reported_by_customer ?? [];

  const detectedDamage =
    evidence?.result?.damage
      ?.detected_by_cv ?? [];

  const supportedDamage =
    evidence?.result?.damage
      ?.supported ?? [];

  const reportedParts =
    evidence?.result?.parts
      ?.reported_by_customer ?? [];

  const detectedParts =
    evidence?.result?.parts
      ?.detected_by_cv ?? [];

  const missingItems =
    missingEvidence?.result?.items ?? [];

  const evidenceStatus =
    evidence?.result?.status ??
    evidence?.status;

  const requiresReview =
    evidence?.result?.requires_review === true;

  const isProcessing =
    ["QUEUED", "PROCESSING", "PENDING"].includes(
      String(
        assessment?.status || ""
      ).toUpperCase()
    ) ||
    ["QUEUED", "PROCESSING", "PENDING"].includes(
      String(
        computerVision?.status || ""
      ).toUpperCase()
    );

  const claimStatus =
    claim?.status ?? "SUBMITTED";

  const customerName =
    claim?.customer?.name ??
    claim?.customerName ??
    "Customer";

  const vehicleName =
    [
      claim?.vehicle?.manufacturer,
      claim?.vehicle?.model,
      claim?.vehicle?.variant,
    ]
      .filter(Boolean)
      .join(" ") || "Vehicle";

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 rounded bg-slate-200" />

            <div className="h-28 rounded-2xl bg-white" />

            <div className="grid gap-5 md:grid-cols-3">
              <div className="h-40 rounded-2xl bg-white" />
              <div className="h-40 rounded-2xl bg-white" />
              <div className="h-40 rounded-2xl bg-white" />
            </div>

            <div className="h-80 rounded-2xl bg-white" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !claim) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            !
          </div>

          <h1 className="text-xl font-semibold text-slate-900">
            Assessment unavailable
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error ||
              "We could not find this claim."}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/claims/new")
            }
            className="mt-6 rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            Create another claim
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mb-3 text-sm text-slate-500 hover:text-slate-900"
            >
              ← Back to home
            </button>

            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              AI Vehicle Assessment
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Review the analysis generated for your vehicle claim.
            </p>
          </div>

          <button
            type="button"
            disabled={refreshing}
            onClick={() => loadClaim(true)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {refreshing
              ? "Refreshing..."
              : "Refresh assessment"}
          </button>
        </header>

        {/* Claim summary */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Claim
              </p>

              <h2 className="mt-1 text-lg font-semibold text-slate-900">
                {claim?.id || claimId}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {customerName} · {vehicleName}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${statusClass(
                  claimStatus
                )}`}
              >
                {formatStatus(claimStatus)}
              </span>

              {requiresReview && (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
                  Human review required
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Processing pipeline */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="font-semibold text-slate-900">
              Assessment progress
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Each stage uses a different part of the AutoInsight pipeline.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <PipelineStep
              label="Image analysis"
              status={computerVision?.status}
            />

            <PipelineStep
              label="Damage detection"
              status={computerVision?.status}
            />

            <PipelineStep
              label="Description analysis"
              status={nlp?.status}
            />

            <PipelineStep
              label="Evidence comparison"
              status={evidence?.status}
            />

            <PipelineStep
              label="Insurance guidance"
              status={rag?.status}
            />
          </div>

          {isProcessing && (
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-600" />

              <div>
                <p className="text-sm font-medium text-blue-900">
                  Your assessment is still being processed.
                </p>

                <p className="mt-0.5 text-xs text-blue-700">
                  This page will automatically update when new results become available.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* AI results */}
        <section className="mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-950">
              AI Damage Assessment
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Results generated from the submitted vehicle images.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ResultCard
              label="Damage detected"
              value={
                damageTypes.length > 0
                  ? String(damageTypes.length)
                  : detections.length > 0
                    ? String(detections.length)
                    : "—"
              }
              detail={
                damageTypes.length > 0
                  ? damageTypes
                      .slice(0, 2)
                      .join(", ")
                  : "Waiting for model result"
              }
            />

            <ResultCard
              label="Severity"
              value={
                severity
                  ? formatStatus(String(severity))
                  : "Pending"
              }
              detail="AI severity assessment"
            />

            <ResultCard
              label="Confidence"
              value={percentage(confidence)}
              detail="Model confidence"
            />

            <ResultCard
              label="Estimated repair"
              value={money(estimatedCost)}
              detail="AI estimate when available"
            />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* Detected damage */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">
              Detected damage
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Damage identified by the computer-vision model.
            </p>

            {damageTypes.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {damageTypes.map((damage) => (
                  <span
                    key={damage}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  >
                    {formatStatus(damage)}
                  </span>
                ))}
              </div>
            ) : (
              <EmptyState text="No detected damage is available yet." />
            )}

            <div className="mt-6 border-t border-slate-100 pt-5">
              <h3 className="text-sm font-semibold text-slate-800">
                Affected components
              </h3>

              {affectedParts.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {affectedParts.map((part) => (
                    <li
                      key={part}
                      className="flex items-center gap-2 text-sm text-slate-600"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      {formatStatus(part)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-400">
                  Component detection is unavailable or still processing.
                </p>
              )}
            </div>
          </section>

          {/* Evidence comparison */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Evidence check
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Comparison between your description and visual evidence.
                </p>
              </div>

              {evidenceStatus && (
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(
                    evidenceStatus
                  )}`}
                >
                  {formatStatus(evidenceStatus)}
                </span>
              )}
            </div>

            <div className="mt-5 space-y-4">
              <EvidenceRow
                label="Reported damage"
                values={reportedDamage}
              />

              <EvidenceRow
                label="Visually detected damage"
                values={detectedDamage}
              />

              <EvidenceRow
                label="Supported by both"
                values={supportedDamage}
              />

              {reportedParts.length > 0 && (
                <EvidenceRow
                  label="Reported parts"
                  values={reportedParts}
                />
              )}

              {detectedParts.length > 0 && (
                <EvidenceRow
                  label="Detected parts"
                  values={detectedParts}
                />
              )}
            </div>

            {requiresReview && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">
                  Additional review may be required
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-800">
                  The submitted description and visual evidence do not completely
                  agree. A human reviewer can inspect the evidence before a final
                  decision.
                </p>
              </div>
            )}
          </section>

          {/* Missing evidence */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">
              Missing evidence
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Information the system may need for a stronger assessment.
            </p>

            {missingItems.length > 0 ? (
              <div className="mt-5 space-y-3">
                {missingItems.map(
                  (item: any, index: number) => (
                    <div
                      key={`${item}-${index}`}
                      className="flex gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4"
                    >
                      <span className="mt-0.5 text-amber-600">
                        !
                      </span>

                      <p className="text-sm text-amber-900">
                        {formatStatus(
                          typeof item === "string"
                            ? item
                            : item?.message ??
                                item?.type ??
                                "Additional evidence"
                        )}
                      </p>
                    </div>
                  )
                )}
              </div>
            ) : (
              <EmptyState
                text={
                  String(
                    missingEvidence?.status || ""
                  ).toUpperCase() === "PENDING"
                    ? "Evidence check is still processing."
                    : "No missing evidence has been reported."
                }
              />
            )}
          </section>

          {/* Insurance guidance */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">
              Insurance guidance
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Guidance retrieved from the insurance knowledge base.
            </p>

            {rag?.result ? (
              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {typeof rag.result === "string"
                    ? rag.result
                    : rag.result?.answer ??
                      rag.result?.response ??
                      JSON.stringify(
                        rag.result,
                        null,
                        2
                      )}
                </p>
              </div>
            ) : (
              <EmptyState
                text={
                  rag?.status
                    ? `Insurance guidance: ${formatStatus(
                        rag.status
                      )}`
                    : "Insurance guidance is not available yet."
                }
              />
            )}
          </section>
        </div>

        {/* LLM explanation */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="font-semibold text-slate-900">
              Assessment explanation
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Human-readable explanation generated from the AI assessment.
            </p>
          </div>

          {llm?.result ? (
            <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-5">
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {typeof llm.result === "string"
                  ? llm.result
                  : llm.result?.answer ??
                    llm.result?.response ??
                    llm.result?.summary ??
                    JSON.stringify(
                      llm.result,
                      null,
                      2
                    )}
              </p>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-900">
                {llm?.status
                  ? `LLM assessment: ${formatStatus(
                      llm.status
                    )}`
                  : "AI explanation is not available yet."}
              </p>

              <p className="mt-1 text-xs text-blue-700">
                The explanation will appear automatically once the
                LLM service returns a result.
              </p>
            </div>
          )}
        </section>

        {/* Review */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                Claim review
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                AI supports the assessment; the final claim decision
                remains with the authorized reviewer.
              </p>
            </div>

            <span
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${statusClass(
                claim?.review?.status
              )}`}
            >
              {formatStatus(
                claim?.review?.status ||
                  "WAITING_FOR_REVIEW"
              )}
            </span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <InfoItem
              label="Claim status"
              value={formatStatus(claimStatus)}
            />

            <InfoItem
              label="Review status"
              value={formatStatus(
                claim?.review?.status ||
                  "Waiting"
              )}
            />

            <InfoItem
              label="Decision"
              value={
                claim?.review?.decision
                  ? formatStatus(
                      claim.review.decision
                    )
                  : "Pending"
              }
            />
          </div>
        </section>

        <footer className="py-8 text-center text-xs text-slate-400">
          AutoInsight AI assessment · Claim{" "}
          {claim?.id || claimId}
        </footer>
      </div>
    </main>
  );
}

function PipelineStep({
  label,
  status,
}: {
  label: string;
  status?: string;
}) {
  const normalized =
    String(status || "").toUpperCase();

  const completed =
    normalized === "COMPLETED";

  const failed =
    normalized === "FAILED" ||
    normalized === "ERROR" ||
    normalized === "AI_SERVICE_UNAVAILABLE";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          completed
            ? "bg-emerald-100 text-emerald-700"
            : failed
              ? "bg-red-100 text-red-700"
              : "bg-blue-100 text-blue-700"
        }`}
      >
        {completed
          ? "✓"
          : failed
            ? "!"
            : "…"}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-800">
          {label}
        </p>

        <p className="text-xs text-slate-400">
          {formatStatus(status || "PENDING")}
        </p>
      </div>
    </div>
  );
}

function ResultCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-3 break-words text-2xl font-bold text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {detail}
      </p>
    </div>
  );
}

function EvidenceRow({
  label,
  values,
}: {
  label: string;
  values: any[];
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      {Array.isArray(values) &&
      values.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {values.map(
            (value, index) => (
              <span
                key={`${String(
                  value
                )}-${index}`}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600"
              >
                {formatStatus(
                  typeof value === "string"
                    ? value
                    : value?.name ??
                        value?.label ??
                        value?.part ??
                        "Item"
                )}
              </span>
            )
          )}
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-400">
          None available
        </p>
      )}
    </div>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="mt-5 rounded-xl border border-dashed border-slate-200 p-5 text-center">
      <p className="text-sm text-slate-400">
        {text}
      </p>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}
