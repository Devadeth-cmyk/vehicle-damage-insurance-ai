"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { DamageVisualizer } from "./damage-visualizer";
import {
  AssessmentStep,
  NewAssessmentFormData,
  DamagePhoto,
  PolicyDocument,
  AssessmentGenerationResponse,
} from "@/types/assessment";

const INITIAL_FORM_DATA: NewAssessmentFormData = {
  customerName: "",
  phoneNumber: "",
  emailAddress: "",
  address: "",
  registrationNumber: "",
  manufacturer: "",
  model: "",
  manufacturingYear: "",
  vehicleType: "",
  policyNumber: "",
  insuranceCompany: "",
  policyType: "",
  policyStartDate: "",
  policyExpiryDate: "",
  coverageType: "",
  policyDocument: null,
  damagePhotos: [],
  aiInspectionRequested: true,
  additionalDamage: "",
  otherRelevantInformation: "",
};

const STEPS_CONFIG: { step: AssessmentStep; title: string; short: string }[] = [
  { step: 1, title: "Customer Details", short: "Customer" },
  { step: 2, title: "Vehicle Details", short: "Vehicle" },
  { step: 3, title: "Policy Details", short: "Policy" },
  { step: 4, title: "Damage Photos", short: "Photos" },
  { step: 5, title: "AI Analysis", short: "AI Review" },
  { step: 6, title: "Additional Info", short: "Additional" },
  { step: 7, title: "Review & Submit", short: "Review" },
];

export function NewAssessmentWizard() {
  const [currentStep, setCurrentStep] = useState<AssessmentStep>(1);
  const [formData, setFormData] = useState<NewAssessmentFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentGenerationResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Field change handler
  const updateField = (field: keyof NewAssessmentFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Step Validation
  const validateStep = (step: AssessmentStep): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.customerName.trim()) newErrors.customerName = "Customer name is required";
      if (!formData.phoneNumber.trim()) {
        newErrors.phoneNumber = "Phone number is required";
      } else if (!/^[0-9+()\- ]{7,20}$/.test(formData.phoneNumber.trim())) {
        newErrors.phoneNumber = "Please enter a valid phone number";
      }
      if (!formData.emailAddress.trim()) {
        newErrors.emailAddress = "Email address is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress.trim())) {
        newErrors.emailAddress = "Please enter a valid email address";
      }
      if (!formData.address.trim()) newErrors.address = "Address is required";
    }

    if (step === 2) {
      if (!formData.registrationNumber.trim()) newErrors.registrationNumber = "Registration number is required";
      if (!formData.manufacturer.trim()) newErrors.manufacturer = "Manufacturer / Make is required";
      if (!formData.model.trim()) newErrors.model = "Model is required";
      if (!formData.manufacturingYear.trim()) {
        newErrors.manufacturingYear = "Manufacturing year is required";
      } else {
        const year = parseInt(formData.manufacturingYear, 10);
        if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
          newErrors.manufacturingYear = "Enter a valid 4-digit year";
        }
      }
      if (!formData.vehicleType) newErrors.vehicleType = "Please select vehicle type";
    }

    if (step === 3) {
      if (!formData.policyNumber.trim()) newErrors.policyNumber = "Policy number is required";
      if (!formData.insuranceCompany.trim()) newErrors.insuranceCompany = "Insurance company is required";
      if (!formData.policyType) newErrors.policyType = "Policy type is required";
      if (!formData.policyStartDate) newErrors.policyStartDate = "Policy start date is required";
      if (!formData.policyExpiryDate) newErrors.policyExpiryDate = "Policy expiry date is required";
      if (!formData.coverageType) newErrors.coverageType = "Coverage type is required";
      if (formData.policyStartDate && formData.policyExpiryDate) {
        if (new Date(formData.policyStartDate) > new Date(formData.policyExpiryDate)) {
          newErrors.policyExpiryDate = "Expiry date must be after start date";
        }
      }
    }

    if (step === 4) {
      if (formData.damagePhotos.length === 0) {
        newErrors.damagePhotos = "Please upload at least 1 image showing the vehicle damage";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 7) {
        setCurrentStep((prev) => (prev + 1) as AssessmentStep);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as AssessmentStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goToStep = (step: AssessmentStep) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Image handlers
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    // Validate image format
    const validImages = files.filter((file) => file.type.startsWith("image/"));
    if (validImages.length < files.length) {
      setErrors((prev) => ({
        ...prev,
        damagePhotos: "Some files were skipped. Only images (.jpg, .jpeg, .png, .webp) are allowed. Videos are not supported.",
      }));
    }

    const newPhotos: DamagePhoto[] = validImages.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
    }));

    setFormData((prev) => ({
      ...prev,
      damagePhotos: [...prev.damagePhotos, ...newPhotos],
    }));

    if (errors.damagePhotos && newPhotos.length > 0) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.damagePhotos;
        return next;
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = (id: string) => {
    setFormData((prev) => {
      const photoToRemove = prev.damagePhotos.find((p) => p.id === id);
      if (photoToRemove) {
        URL.revokeObjectURL(photoToRemove.previewUrl);
      }
      return {
        ...prev,
        damagePhotos: prev.damagePhotos.filter((p) => p.id !== id),
      };
    });
  };

  const handlePolicyDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const doc: PolicyDocument = {
      name: file.name,
      size: file.size,
      type: file.type,
    };
    updateField("policyDocument", doc);
  };

  const handleGenerateAssessment = async () => {
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const payload = new FormData();
      payload.append("customerName", formData.customerName);
      payload.append("phoneNumber", formData.phoneNumber);
      payload.append("emailAddress", formData.emailAddress);
      payload.append("address", formData.address);

      payload.append("registrationNumber", formData.registrationNumber);
      payload.append("manufacturer", formData.manufacturer);
      payload.append("model", formData.model);
      payload.append("manufacturingYear", formData.manufacturingYear);
      payload.append("vehicleType", formData.vehicleType);

      payload.append("policyNumber", formData.policyNumber);
      payload.append("insuranceCompany", formData.insuranceCompany);
      payload.append("policyType", formData.policyType);
      payload.append("policyStartDate", formData.policyStartDate);
      payload.append("policyExpiryDate", formData.policyExpiryDate);
      payload.append("coverageType", formData.coverageType);

      payload.append("additionalDamage", formData.additionalDamage);
      payload.append("otherRelevantInformation", formData.otherRelevantInformation);
      payload.append("aiInspectionRequested", String(formData.aiInspectionRequested));

      // Append damage photos
      formData.damagePhotos.forEach((photo) => {
        payload.append("photos", photo.file, photo.name);
      });

      const response = await fetch("/api/service-center/generate-assessment", {
        method: "POST",
        body: payload,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with status ${response.status}`);
      }

      const data: AssessmentGenerationResponse = await response.json();
      setAssessmentResult(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setSubmissionError(err.message || "An unexpected error occurred during assessment generation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ════════════════ SUCCESS SCREEN WITH REAL AI RESULTS ════════════════
  if (assessmentResult) {
    const ai = assessmentResult.aiAnalysis;
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Banner Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1">
                  Assessment Generated
                </span>
                <h1 className="text-xl font-bold text-[#0B1E48]">
                  Assessment Report: {assessmentResult.assessmentId}
                </h1>
                <p className="text-xs text-slate-500">
                  Generated on {new Date(assessmentResult.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/service-center"
                className="inline-flex items-center justify-center rounded-lg bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0369A1] transition-colors"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  setFormData(INITIAL_FORM_DATA);
                  setCurrentStep(1);
                  setAssessmentResult(null);
                }}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                New Assessment
              </button>
            </div>
          </div>

          {/* Vehicle & Policy Overview */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Vehicle</span>
              <strong className="font-semibold text-slate-800 font-mono">
                {assessmentResult.vehicle.registrationNumber}
              </strong>
              <p className="text-[11px] text-slate-500">
                {assessmentResult.vehicle.manufacturer} {assessmentResult.vehicle.model} ({assessmentResult.vehicle.year})
              </p>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Customer</span>
              <strong className="font-semibold text-slate-800">
                {assessmentResult.customer.name}
              </strong>
              <p className="text-[11px] text-slate-500">{assessmentResult.customer.phone}</p>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Policy / Insurer</span>
              <strong className="font-semibold text-slate-800">
                {assessmentResult.policy.policyNumber}
              </strong>
              <p className="text-[11px] text-slate-500">{assessmentResult.policy.insuranceCompany}</p>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Coverage</span>
              <strong className="font-semibold text-slate-800">
                {assessmentResult.policy.coverageType}
              </strong>
              <p className="text-[11px] text-slate-500">{assessmentResult.policy.policyType}</p>
            </div>
          </div>
        </div>

        {/* ─── Real AI Damage Analysis Section ─────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-purple-600 animate-pulse" />
                <h2 className="text-base font-bold text-[#0B1E48]">
                  AI Computer Vision Damage Findings
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real damage localization and severity outputs from CARDD YOLO & Severity inference models.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                {ai.totalDetectionsCount} {ai.totalDetectionsCount === 1 ? "Damage Detected" : "Damages Detected"}
              </span>
            </div>
          </div>

          {/* Parts Model Limitation Notice (Strictly as required) */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3.5 flex gap-3 text-xs text-amber-900">
            <svg className="h-5 w-5 text-amber-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <p className="font-bold text-amber-950">Parts Detection Status:</p>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                Parts detection is currently <strong className="font-semibold">UNAVAILABLE</strong> because the external model checkpoint (<code className="bg-amber-100 px-1 py-0.5 rounded text-[11px]">models/parts/parts.pt</code>) is invalid/empty in the AI repository. Damage type, bounding boxes, and severity classifications shown below are real outputs from the operational models.
              </p>
            </div>
          </div>

          {/* Per Image Results with Bounding Box Visualizer */}
          <div className="space-y-6">
            {ai.results.map((imgRes, idx) => {
              // Lookup corresponding previewUrl from the submitted photos by filename or index
              const matchingPhoto = formData.damagePhotos.find((p) => p.name === imgRes.imageName) || formData.damagePhotos[idx];
              const displayUrl = matchingPhoto ? matchingPhoto.previewUrl : null;

              return (
                <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/30 space-y-4 p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        #{idx + 1}
                      </span>
                      <span className="text-sm font-semibold text-slate-800">{imgRes.imageName}</span>
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        imgRes.status === "PROCESSED"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {imgRes.status}
                    </span>
                  </div>

                  {/* Visual Image Overlay Component */}
                  {displayUrl && (
                    <div className="bg-slate-900/5 rounded-xl p-2 sm:p-4 border border-slate-200/80">
                      <DamageVisualizer
                        imageUrl={displayUrl}
                        imageName={imgRes.imageName}
                        detections={imgRes.detections}
                      />
                    </div>
                  )}

                  {/* Detections Data Table */}
                  <div>
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

          {/* Additional Notes Summary */}
          {(assessmentResult.additionalNotes.additionalDamage || assessmentResult.additionalNotes.otherRelevantInformation) && (
            <div className="pt-4 border-t border-slate-200 space-y-3 text-xs">
              <h4 className="font-semibold text-slate-800">Adjuster & Supplementary Notes</h4>
              {assessmentResult.additionalNotes.additionalDamage && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700 block mb-0.5">Additional Damage Notes:</span>
                  <p className="text-slate-600">{assessmentResult.additionalNotes.additionalDamage}</p>
                </div>
              )}
              {assessmentResult.additionalNotes.otherRelevantInformation && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700 block mb-0.5">Other Relevant Information:</span>
                  <p className="text-slate-600">{assessmentResult.additionalNotes.otherRelevantInformation}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════════════════ WIZARD STEPS 1 TO 7 ════════════════
  return (
    <div className="space-y-6">
      {/* ─── Step Indicator / Stepper ───────────────────────────────── */}
      <nav aria-label="Progress" className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <ol className="flex items-center justify-between overflow-x-auto gap-2 py-1">
          {STEPS_CONFIG.map((s, idx) => {
            const isCompleted = currentStep > s.step;
            const isCurrent = currentStep === s.step;
            return (
              <li key={s.step} className="flex-1 min-w-[70px] sm:min-w-[110px] relative">
                <button
                  type="button"
                  onClick={() => isCompleted && goToStep(s.step)}
                  disabled={!isCompleted || isSubmitting}
                  className={`w-full group flex flex-col items-center text-center ${
                    isCompleted ? "cursor-pointer" : "cursor-default"
                  }`}
                >
                  <div className="flex items-center justify-center w-full relative mb-1.5">
                    {/* Connecting line */}
                    {idx !== 0 && (
                      <div
                        className={`absolute left-0 top-1/2 -translate-y-1/2 w-1/2 h-0.5 ${
                          isCompleted || isCurrent ? "bg-[#0284C7]" : "bg-slate-200"
                        }`}
                      />
                    )}
                    {idx !== STEPS_CONFIG.length - 1 && (
                      <div
                        className={`absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-0.5 ${
                          isCompleted ? "bg-[#0284C7]" : "bg-slate-200"
                        }`}
                      />
                    )}
                    {/* Circle */}
                    <div
                      className={`relative z-10 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                        isCompleted
                          ? "bg-[#0284C7] text-white ring-4 ring-blue-50"
                          : isCurrent
                          ? "bg-[#0B1E48] text-white ring-4 ring-slate-100 font-bold"
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        s.step
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-[11px] sm:text-xs font-medium truncate max-w-full ${
                      isCurrent
                        ? "text-[#0B1E48] font-bold"
                        : isCompleted
                        ? "text-slate-700"
                        : "text-slate-400"
                    }`}
                  >
                    <span className="hidden sm:inline">{s.title}</span>
                    <span className="sm:hidden">{s.short}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* ─── Form Container ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Section Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0284C7]">
                Step {currentStep} of 7
              </span>
              {currentStep === 5 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                  AI Preview
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-[#0B1E48] mt-0.5">
              {STEPS_CONFIG[currentStep - 1].title}
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            {currentStep < 7 ? "Fields marked * are required" : "Final Verification"}
          </span>
        </div>

        <div className="p-6 sm:p-8">
          {/* ════════════════ Step 1: Customer Details ════════════════ */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <p className="text-xs text-slate-500">
                Enter contact and identification information for the vehicle owner or claimant.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="customerName" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Customer Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => updateField("customerName", e.target.value)}
                    placeholder="e.g. Johnathan Miller"
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none transition-colors ${
                      errors.customerName
                        ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                        : "border-slate-300 focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                    }`}
                  />
                  {errors.customerName && (
                    <p className="mt-1 text-xs text-rose-500">{errors.customerName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => updateField("phoneNumber", e.target.value)}
                    placeholder="e.g. +1 (555) 019-2834"
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none transition-colors ${
                      errors.phoneNumber
                        ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                        : "border-slate-300 focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                    }`}
                  />
                  {errors.phoneNumber && (
                    <p className="mt-1 text-xs text-rose-500">{errors.phoneNumber}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="emailAddress" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="emailAddress"
                    value={formData.emailAddress}
                    onChange={(e) => updateField("emailAddress", e.target.value)}
                    placeholder="e.g. customer@example.com"
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none transition-colors ${
                      errors.emailAddress
                        ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                        : "border-slate-300 focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                    }`}
                  />
                  {errors.emailAddress && (
                    <p className="mt-1 text-xs text-rose-500">{errors.emailAddress}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="address" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Residential / Postal Address <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="address"
                    rows={3}
                    value={formData.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="e.g. 742 Evergreen Terrace, Springfield, OR 97477"
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none transition-colors ${
                      errors.address
                        ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                        : "border-slate-300 focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                    }`}
                  />
                  {errors.address && (
                    <p className="mt-1 text-xs text-rose-500">{errors.address}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ Step 2: Vehicle Details ════════════════ */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <p className="text-xs text-slate-500">
                Specify the vehicle specifications and identification markers.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label htmlFor="registrationNumber" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Registration / License Plate <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={(e) => updateField("registrationNumber", e.target.value.toUpperCase())}
                    placeholder="e.g. ABC-1234"
                    className={`w-full uppercase font-mono rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none transition-colors ${
                      errors.registrationNumber
                        ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                        : "border-slate-300 focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                    }`}
                  />
                  {errors.registrationNumber && (
                    <p className="mt-1 text-xs text-rose-500">{errors.registrationNumber}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="manufacturer" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Manufacturer / Make <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => updateField("manufacturer", e.target.value)}
                    placeholder="e.g. Toyota, Honda, Ford"
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none transition-colors ${
                      errors.manufacturer
                        ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                        : "border-slate-300 focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                    }`}
                  />
                  {errors.manufacturer && (
                    <p className="mt-1 text-xs text-rose-500">{errors.manufacturer}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="model" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Model <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="model"
                    value={formData.model}
                    onChange={(e) => updateField("model", e.target.value)}
                    placeholder="e.g. Camry, Civic, F-150"
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none transition-colors ${
                      errors.model
                        ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                        : "border-slate-300 focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                    }`}
                  />
                  {errors.model && (
                    <p className="mt-1 text-xs text-rose-500">{errors.model}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="manufacturingYear" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Manufacturing Year <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="manufacturingYear"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    value={formData.manufacturingYear}
                    onChange={(e) => updateField("manufacturingYear", e.target.value)}
                    placeholder="e.g. 2022"
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none transition-colors ${
                      errors.manufacturingYear
                        ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                        : "border-slate-300 focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                    }`}
                  />
                  {errors.manufacturingYear && (
                    <p className="mt-1 text-xs text-rose-500">{errors.manufacturingYear}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="vehicleType" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Vehicle Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="vehicleType"
                    value={formData.vehicleType}
                    onChange={(e) => updateField("vehicleType", e.target.value)}
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 outline-none bg-white transition-colors ${
                      errors.vehicleType
                        ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                        : "border-slate-300 focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                    }`}
                  >
                    <option value="">Select vehicle type</option>
                    <option value="Sedan">Sedan</option>
                    <option value="SUV">SUV / Crossover</option>
                    <option value="Hatchback">Hatchback</option>
                    <option value="Truck">Pickup Truck</option>
                    <option value="Van">Van / Minivan</option>
                    <option value="Coupe">Coupe / Convertible</option>
                    <option value="Commercial">Commercial / Heavy Vehicle</option>
                    <option value="Motorcycle">Motorcycle / Two-Wheeler</option>
                  </select>
                  {errors.vehicleType && (
                    <p className="mt-1 text-xs text-rose-500">{errors.vehicleType}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ Step 3: Policy Details ════════════════ */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <p className="text-xs text-slate-500">
                Provide insurance policy information to enable coverage verification.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label htmlFor="policyNumber" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Policy Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="policyNumber"
                    value={formData.policyNumber}
                    onChange={(e) => updateField("policyNumber", e.target.value)}
                    placeholder="e.g. POL-98472-TX"
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none transition-colors ${
                      errors.policyNumber
                        ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                        : "border-slate-300 focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                    }`}
                  />
                  {errors.policyNumber && (
                    <p className="mt-1 text-xs text-rose-500">{errors.policyNumber}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="insuranceCompany" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Insurance Company <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="insuranceCompany"
                    value={formData.insuranceCompany}
                    onChange={(e) => updateField("insuranceCompany", e.target.value)}
                    placeholder="e.g. State Mutual, Geico, Allstate"
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none transition-colors ${
                      errors.insuranceCompany
                        ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                        : "border-slate-300 focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                    }`}
                  />
                  {errors.insuranceCompany && (
                    <p className="mt-1 text-xs text-rose-500">{errors.insuranceCompany}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="policyType" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Policy Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="policyType"
                    value={formData.policyType}
                    onChange={(e) => updateField("policyType", e.target.value)}
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 outline-none bg-white transition-colors ${
                      errors.policyType
                        ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                        : "border-slate-300 focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                    }`}
                  >
                    <option value="">Select policy type</option>
                    <option value="Comprehensive">Comprehensive Auto Policy</option>
                    <option value="Third-Party">Third-Party Only</option>
                    <option value="Collision">Collision & Liability</option>
                    <option value="Commercial Fleet">Commercial Fleet Policy</option>
                  </select>
                  {errors.policyType && (
                    <p className="mt-1 text-xs text-rose-500">{errors.policyType}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="policyStartDate" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Policy Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="policyStartDate"
                    value={formData.policyStartDate}
                    onChange={(e) => updateField("policyStartDate", e.target.value)}
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors ${
                      errors.policyStartDate
                        ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                        : "border-slate-300 focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                    }`}
                  />
                  {errors.policyStartDate && (
                    <p className="mt-1 text-xs text-rose-500">{errors.policyStartDate}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="policyExpiryDate" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Policy Expiry Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="policyExpiryDate"
                    value={formData.policyExpiryDate}
                    onChange={(e) => updateField("policyExpiryDate", e.target.value)}
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors ${
                      errors.policyExpiryDate
                        ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                        : "border-slate-300 focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                    }`}
                  />
                  {errors.policyExpiryDate && (
                    <p className="mt-1 text-xs text-rose-500">{errors.policyExpiryDate}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="coverageType" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Coverage Level <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="coverageType"
                    value={formData.coverageType}
                    onChange={(e) => updateField("coverageType", e.target.value)}
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 outline-none bg-white transition-colors ${
                      errors.coverageType
                        ? "border-rose-400 bg-rose-50/20 focus:border-rose-500"
                        : "border-slate-300 focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                    }`}
                  >
                    <option value="">Select coverage type</option>
                    <option value="Full Coverage (Zero Depreciation)">Full Coverage (Zero Depreciation)</option>
                    <option value="Standard Comprehensive">Standard Comprehensive</option>
                    <option value="Basic Liability Only">Basic Liability Only</option>
                    <option value="Custom Endorsement">Custom Endorsement / Fleet</option>
                  </select>
                  {errors.coverageType && (
                    <p className="mt-1 text-xs text-rose-500">{errors.coverageType}</p>
                  )}
                </div>

                {/* Optional Policy Document Upload */}
                <div className="sm:col-span-2 lg:col-span-3 pt-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Policy Document / Certificate <span className="text-slate-400 font-normal">(Optional PDF/Scan)</span>
                  </label>
                  
                  {formData.policyDocument ? (
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          PDF
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{formData.policyDocument.name}</p>
                          <p className="text-[11px] text-slate-400">
                            {(formData.policyDocument.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateField("policyDocument", null)}
                        className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-3 p-4 border border-dashed border-slate-300 rounded-lg hover:border-[#0284C7] cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <svg className="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span className="text-xs text-slate-600">
                        Click to attach policy copy (.pdf, .png, .jpg)
                      </span>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        className="hidden"
                        onChange={handlePolicyDocUpload}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ Step 4: Damage Photos ════════════════ */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Visual Damage Evidence</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload multiple clear photos of the damaged vehicle areas from different angles.
                </p>
              </div>

              {/* Guidance Notice Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <svg className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <div className="text-xs text-slate-700 space-y-1">
                  <p className="font-semibold text-blue-900">Photography Guidelines for Best Results:</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                    <li>Capture full view of all damaged vehicle panels (bumper, fender, door, hood, etc.).</li>
                    <li>Include both wide-angle context shots and close-up detail shots.</li>
                    <li>Ensure adequate lighting with minimal glare or heavy shadow.</li>
                    <li><strong className="text-slate-800">Note:</strong> Video uploads are not supported. Upload high-resolution images only (.jpg, .png, .webp).</li>
                  </ul>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                  errors.damagePhotos
                    ? "border-rose-300 bg-rose-50/20 hover:border-rose-400"
                    : "border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0284C7]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div className="h-12 w-12 rounded-full bg-blue-100 text-[#0284C7] flex items-center justify-center mx-auto mb-3">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  Click to upload damage photos
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  PNG, JPG, JPEG, WEBP up to 15MB each (Multiple selection supported)
                </p>
              </div>
              {errors.damagePhotos && (
                <p className="text-xs text-rose-500 font-medium">{errors.damagePhotos}</p>
              )}

              {/* Photo Previews Grid */}
              {formData.damagePhotos.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-slate-700">
                      Uploaded Photos ({formData.damagePhotos.length})
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        formData.damagePhotos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
                        updateField("damagePhotos", []);
                      }}
                      className="text-xs text-rose-600 hover:text-rose-700 font-medium"
                    >
                      Remove All
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {formData.damagePhotos.map((photo, index) => (
                      <div
                        key={photo.id}
                        className="group relative rounded-lg border border-slate-200 overflow-hidden bg-slate-100 aspect-square flex flex-col"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.previewUrl}
                          alt={`Damage preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePhoto(photo.id);
                            }}
                            className="p-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 shadow-md transition-colors"
                            title="Remove Photo"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                        <div className="absolute bottom-0 inset-x-0 bg-slate-950/70 backdrop-blur-xs p-1.5">
                          <p className="text-[10px] text-white truncate font-mono">
                            Photo {index + 1}: {photo.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════ Step 5: AI-Identified Damage Details ════════════════ */}
          {currentStep === 5 && (
            <div className="space-y-6">
              {/* AI Disclaimers & Notice */}
              <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    AI
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-purple-950">
                      Automated Computer Vision & Severity Engine
                    </h3>
                    <p className="text-xs text-purple-700">
                      Damage Detection Model Integration
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mt-2">
                  When enabled, your uploaded photos will be automatically analyzed by the integrated CARDD damage detection and severity evaluation models upon submission.
                </p>
              </div>

              {/* Realistic Empty Placeholder State */}
              <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/50">
                <div className="h-12 w-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-3">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-slate-800">
                  Ready to Execute on Submit
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                  Computer vision analysis will run against your {formData.damagePhotos.length} uploaded photo(s) when you click Generate Assessment.
                </p>

                {/* Model pipeline stages */}
                <div className="mt-6 max-w-md mx-auto bg-white border border-slate-200 rounded-lg p-4 text-left space-y-2.5">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Pipeline Modules:
                  </p>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>Damage Localization (CARDD YOLO Model: Active)</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>Severity Classifier (Active)</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-400">
                    <span className="h-2 w-2 rounded-full bg-slate-300 shrink-0" />
                    <span>Parts Segmentation (Bypassed due to invalid parts.pt)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">Enable Automated AI Analysis on Submit</p>
                  <p className="text-slate-400">Trigger computer vision pipelines upon assessment creation</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.aiInspectionRequested}
                  onChange={(e) => updateField("aiInspectionRequested", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#0284C7] focus:ring-[#0284C7]"
                />
              </div>
            </div>
          )}

          {/* ════════════════ Step 6: Additional Damage / Info ════════════════ */}
          {currentStep === 6 && (
            <div className="space-y-5">
              <p className="text-xs text-slate-500">
                Provide notes on non-visible structural damage, internal mechanical issues, or any other relevant claim context.
              </p>

              <div>
                <label htmlFor="additionalDamage" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Additional Damage Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  id="additionalDamage"
                  rows={4}
                  value={formData.additionalDamage}
                  onChange={(e) => updateField("additionalDamage", e.target.value)}
                  placeholder="Describe internal, mechanical, suspension, radiator, or non-visible impact damage..."
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7] transition-colors"
                />
              </div>

              <div>
                <label htmlFor="otherRelevantInformation" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Other Relevant Information / Adjuster Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  id="otherRelevantInformation"
                  rows={4}
                  value={formData.otherRelevantInformation}
                  onChange={(e) => updateField("otherRelevantInformation", e.target.value)}
                  placeholder="Add details regarding towing records, police accident report IDs, witness testimonies, or prior vehicle condition..."
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7] transition-colors"
                />
              </div>
            </div>
          )}

          {/* ════════════════ Step 7: Review & Submit ════════════════ */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Review Assessment Summary</h3>
                  <p className="text-xs text-slate-500">
                    Verify all details before initiating the assessment generation.
                  </p>
                </div>
              </div>

              {/* Error banner if submission failed */}
              {submissionError && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex gap-3 text-xs text-rose-700">
                  <svg className="h-5 w-5 text-rose-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <div>
                    <strong className="font-semibold text-rose-900">Submission Error:</strong>
                    <p className="mt-0.5">{submissionError}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Customer Summary */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-[#0B1E48] uppercase tracking-wider">
                      1. Customer Details
                    </h4>
                    <button
                      type="button"
                      onClick={() => goToStep(1)}
                      disabled={isSubmitting}
                      className="text-xs text-[#0284C7] hover:underline font-medium disabled:opacity-50"
                    >
                      Edit
                    </button>
                  </div>
                  <dl className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Name:</dt>
                      <dd className="font-medium text-slate-800">{formData.customerName || "—"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Phone:</dt>
                      <dd className="font-medium text-slate-800">{formData.phoneNumber || "—"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Email:</dt>
                      <dd className="font-medium text-slate-800">{formData.emailAddress || "—"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Address:</dt>
                      <dd className="font-medium text-slate-800 text-right max-w-[200px] truncate">{formData.address || "—"}</dd>
                    </div>
                  </dl>
                </div>

                {/* 2. Vehicle Summary */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-[#0B1E48] uppercase tracking-wider">
                      2. Vehicle Details
                    </h4>
                    <button
                      type="button"
                      onClick={() => goToStep(2)}
                      disabled={isSubmitting}
                      className="text-xs text-[#0284C7] hover:underline font-medium disabled:opacity-50"
                    >
                      Edit
                    </button>
                  </div>
                  <dl className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Reg Plate:</dt>
                      <dd className="font-mono font-bold text-slate-800">{formData.registrationNumber || "—"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Make & Model:</dt>
                      <dd className="font-medium text-slate-800">{formData.manufacturer} {formData.model}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Year:</dt>
                      <dd className="font-medium text-slate-800">{formData.manufacturingYear || "—"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Type:</dt>
                      <dd className="font-medium text-slate-800">{formData.vehicleType || "—"}</dd>
                    </div>
                  </dl>
                </div>

                {/* 3. Policy Summary */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-[#0B1E48] uppercase tracking-wider">
                      3. Policy Details
                    </h4>
                    <button
                      type="button"
                      onClick={() => goToStep(3)}
                      disabled={isSubmitting}
                      className="text-xs text-[#0284C7] hover:underline font-medium disabled:opacity-50"
                    >
                      Edit
                    </button>
                  </div>
                  <dl className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Policy No:</dt>
                      <dd className="font-mono font-semibold text-slate-800">{formData.policyNumber || "—"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Insurer:</dt>
                      <dd className="font-medium text-slate-800">{formData.insuranceCompany || "—"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Coverage:</dt>
                      <dd className="font-medium text-slate-800">{formData.coverageType || "—"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Valid Period:</dt>
                      <dd className="font-medium text-slate-800">
                        {formData.policyStartDate || "—"} to {formData.policyExpiryDate || "—"}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* 4. Evidence & Damage Summary */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-[#0B1E48] uppercase tracking-wider">
                      4. Photos & Additional Info
                    </h4>
                    <button
                      type="button"
                      onClick={() => goToStep(4)}
                      disabled={isSubmitting}
                      className="text-xs text-[#0284C7] hover:underline font-medium disabled:opacity-50"
                    >
                      Edit
                    </button>
                  </div>
                  <dl className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Attached Photos:</dt>
                      <dd className="font-semibold text-slate-800">{formData.damagePhotos.length} Images</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">AI Analysis:</dt>
                      <dd className="font-medium text-purple-700">
                        {formData.aiInspectionRequested ? "Enabled (CV Inference)" : "Disabled"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Additional Damage:</dt>
                      <dd className="font-medium text-slate-800 max-w-[180px] truncate">
                        {formData.additionalDamage || "None specified"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Adjuster Notes:</dt>
                      <dd className="font-medium text-slate-800 max-w-[180px] truncate">
                        {formData.otherRelevantInformation || "None specified"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── Navigation Buttons Footer ────────────────────────────── */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Previous Step
              </button>
            ) : (
              <Link
                href="/service-center"
                className="inline-flex items-center text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                ← Cancel & Return
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep < 7 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0284C7] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0369A1] transition-colors"
              >
                Continue to Step {currentStep + 1}
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerateAssessment}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0B1E48] px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#0284C7] transition-all disabled:opacity-75 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Running AI Computer Vision Analysis...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 text-[#0284C7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                      <line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                    Generate Assessment
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
