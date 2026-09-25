"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import Link from "next/link";

type Step = 1 | 2 | 3 | 4 | 5 | 6;

type FormData = {
  registrationNumber: string;
  manufacturer: string;
  model: string;
  manufacturingYear: string;

  accidentDate: string;
  accidentTime: string;
  location: string;
  incidentType: string;
  damageDescription: string;
  incidentDetails: string;

  policyNumber: string;
  insuranceCompany: string;
  policyType: string;
  policyStartDate: string;
  policyExpiryDate: string;
  coverageType: string;

  damageImages: File[];

  additionalInformation: string;
  injuries: string;
  policeReport: string;
};

const steps = [
  "Vehicle",
  "Incident",
  "Insurance",
  "Damage",
  "Additional",
  "Review",
];

const initialForm: FormData = {
  registrationNumber: "",
  manufacturer: "",
  model: "",
  manufacturingYear: "",

  accidentDate: "",
  accidentTime: "",
  location: "",
  incidentType: "",
  damageDescription: "",
  incidentDetails: "",

  policyNumber: "",
  insuranceCompany: "",
  policyType: "",
  policyStartDate: "",
  policyExpiryDate: "",
  coverageType: "",

  damageImages: [],

  additionalInformation: "",
  injuries: "",
  policeReport: "",
};

export default function NewClaimPage() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState<FormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [claimId, setClaimId] = useState("");

  const progress = useMemo(
    () => Math.round((currentStep / steps.length) * 100),
    [currentStep]
  );

  function updateField(
    field: keyof FormData,
    value: string | File[]
  ) {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    setMessage("");
  }

  function validateStep(step: Step): boolean {
    if (step === 1) {
      if (
        !formData.registrationNumber.trim() ||
        !formData.manufacturer.trim() ||
        !formData.model.trim() ||
        !formData.manufacturingYear.trim()
      ) {
        setMessage(
          "Please complete all vehicle details before continuing."
        );
        return false;
      }
    }

    if (step === 2) {
      if (
        !formData.accidentDate.trim() ||
        !formData.accidentTime.trim() ||
        !formData.location.trim() ||
        !formData.incidentType.trim() ||
        !formData.damageDescription.trim() ||
        !formData.incidentDetails.trim()
      ) {
        setMessage(
          "Please complete all incident details before continuing."
        );
        return false;
      }
    }

    if (step === 3) {
      if (
        !formData.policyNumber.trim() ||
        !formData.insuranceCompany.trim() ||
        !formData.policyType.trim() ||
        !formData.policyStartDate.trim() ||
        !formData.policyExpiryDate.trim() ||
        !formData.coverageType.trim()
      ) {
        setMessage(
          "Please complete all insurance details before continuing."
        );
        return false;
      }
    }

    if (step === 4) {
      if (formData.damageImages.length === 0) {
        setMessage(
          "Please upload at least one vehicle damage image before continuing."
        );
        return false;
      }
    }

    if (step === 5) {
      if (
        !formData.injuries.trim() ||
        !formData.policeReport.trim()
      ) {
        setMessage(
          "Please complete the required additional information before continuing."
        );
        return false;
      }
    }

    setMessage("");
    return true;
  }

  function nextStep() {
    if (!validateStep(currentStep)) {
      return;
    }

    if (currentStep < 6) {
      setCurrentStep((currentStep + 1) as Step);
    }
  }

  function previousStep() {
    setMessage("");

    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  }

  function handleImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    setFormData((previous) => ({
      ...previous,
      damageImages: files,
    }));

    setMessage("");
  }

  async function submitClaim(event: FormEvent) {
    event.preventDefault();

    if (!validateStep(5)) {
      setCurrentStep(5);
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const payload = new FormData();

      payload.append(
        "claim",
        JSON.stringify({
          registrationNumber: formData.registrationNumber,
          manufacturer: formData.manufacturer,
          model: formData.model,
          manufacturingYear: formData.manufacturingYear,

          accidentDate: formData.accidentDate,
          accidentTime: formData.accidentTime,
          location: formData.location,
          incidentType: formData.incidentType,
          damageDescription: formData.damageDescription,
          incidentDetails: formData.incidentDetails,

          policyNumber: formData.policyNumber,
          insuranceCompany: formData.insuranceCompany,
          policyType: formData.policyType,
          policyStartDate: formData.policyStartDate,
          policyExpiryDate: formData.policyExpiryDate,
          coverageType: formData.coverageType,

          additionalInformation:
            formData.additionalInformation,
          injuries: formData.injuries,
          policeReport: formData.policeReport,
        })
      );

      for (const image of formData.damageImages) {
        payload.append("images", image);
      }

      const response = await fetch("/api/claims", {
        method: "POST",
        body: payload,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to submit claim."
        );
      }

      setClaimId(data.claimId);

      if (data.aiStatus === "AI_SERVICE_UNAVAILABLE") {
        setMessage(
          "Claim submitted successfully, but the AI assessment service is currently unavailable."
        );
        return;
      }

      window.location.href = `/claims/${data.claimId}`;
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while submitting the claim."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-slate-500 hover:text-slate-900"
          >
            ← Back to AutoInsight
          </Link>

          <h1 className="mt-4 text-3xl font-semibold text-slate-900">
            New Insurance Claim
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Submit your vehicle, incident, insurance and damage
            information for AI-assisted preliminary assessment.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8 rounded-2xl border bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              Step {currentStep} of 6
            </span>

            <span className="text-sm text-slate-500">
              {progress}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-900 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {steps.map((step, index) => {
              const number = index + 1;
              const active = number === currentStep;
              const completed = number < currentStep;

              return (
                <button
                  key={step}
                  type="button"
                  disabled={!completed || submitting}
                  onClick={() => {
                    if (completed) {
                      setMessage("");
                      setCurrentStep(number as Step);
                    }
                  }}
                  className={`rounded-lg px-2 py-2 text-xs font-medium ${
                    active
                      ? "bg-slate-900 text-white"
                      : completed
                        ? "bg-slate-100 text-slate-800 hover:bg-slate-200"
                        : "text-slate-400"
                  }`}
                >
                  {number}. {step}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={submitClaim}>
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            {/* STEP 1 */}
            {currentStep === 1 && (
              <section>
                <h2 className="text-xl font-semibold">
                  Vehicle Details
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Tell us which vehicle is involved in the claim.
                </p>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Registration Number"
                    value={formData.registrationNumber}
                    onChange={(value) =>
                      updateField("registrationNumber", value)
                    }
                    placeholder="KL 01 AB 1234"
                  />

                  <Field
                    label="Manufacturer"
                    value={formData.manufacturer}
                    onChange={(value) =>
                      updateField("manufacturer", value)
                    }
                    placeholder="Hyundai"
                  />

                  <Field
                    label="Model"
                    value={formData.model}
                    onChange={(value) =>
                      updateField("model", value)
                    }
                    placeholder="Creta"
                  />

                  <Field
                    label="Manufacturing Year"
                    value={formData.manufacturingYear}
                    onChange={(value) =>
                      updateField("manufacturingYear", value)
                    }
                    placeholder="2022"
                    type="number"
                  />
                </div>
              </section>
            )}

            {/* STEP 2 */}
            {currentStep === 2 && (
              <section>
                <h2 className="text-xl font-semibold">
                  Incident Details
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Describe what happened and when it occurred.
                </p>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Accident Date"
                    type="date"
                    value={formData.accidentDate}
                    onChange={(value) =>
                      updateField("accidentDate", value)
                    }
                  />

                  <Field
                    label="Accident Time"
                    type="time"
                    value={formData.accidentTime}
                    onChange={(value) =>
                      updateField("accidentTime", value)
                    }
                  />

                  <Field
                    label="Incident Location"
                    value={formData.location}
                    onChange={(value) =>
                      updateField("location", value)
                    }
                    placeholder="NH 66, Thiruvananthapuram"
                  />

                  <SelectField
                    label="Incident Type"
                    value={formData.incidentType}
                    onChange={(value) =>
                      updateField("incidentType", value)
                    }
                    options={[
                      "Collision",
                      "Road Accident",
                      "Weather Related",
                      "Vandalism",
                      "Other",
                    ]}
                  />
                </div>

                <div className="mt-5">
                  <TextArea
                    label="What damage occurred?"
                    value={formData.damageDescription}
                    onChange={(value) =>
                      updateField("damageDescription", value)
                    }
                    placeholder="Describe the visible damage..."
                  />
                </div>

                <div className="mt-5">
                  <TextArea
                    label="Additional Incident Details"
                    value={formData.incidentDetails}
                    onChange={(value) =>
                      updateField("incidentDetails", value)
                    }
                    placeholder="Explain how the incident happened..."
                  />
                </div>
              </section>
            )}

            {/* STEP 3 */}
            {currentStep === 3 && (
              <section>
                <h2 className="text-xl font-semibold">
                  Insurance / Policy
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Provide the insurance information associated with
                  this vehicle.
                </p>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Policy Number"
                    value={formData.policyNumber}
                    onChange={(value) =>
                      updateField("policyNumber", value)
                    }
                    placeholder="POL-KL-2026-45821"
                  />

                  <Field
                    label="Insurance Company"
                    value={formData.insuranceCompany}
                    onChange={(value) =>
                      updateField("insuranceCompany", value)
                    }
                    placeholder="ICICI Lombard"
                  />

                  <SelectField
                    label="Policy Type"
                    value={formData.policyType}
                    onChange={(value) =>
                      updateField("policyType", value)
                    }
                    options={[
                      "Comprehensive",
                      "Third Party",
                      "Own Damage",
                    ]}
                  />

                  <SelectField
                    label="Coverage Type"
                    value={formData.coverageType}
                    onChange={(value) =>
                      updateField("coverageType", value)
                    }
                    options={[
                      "Own Damage + Third Party",
                      "Own Damage",
                      "Third Party",
                      "Other",
                    ]}
                  />

                  <Field
                    label="Policy Start Date"
                    type="date"
                    value={formData.policyStartDate}
                    onChange={(value) =>
                      updateField("policyStartDate", value)
                    }
                  />

                  <Field
                    label="Policy Expiry Date"
                    type="date"
                    value={formData.policyExpiryDate}
                    onChange={(value) =>
                      updateField("policyExpiryDate", value)
                    }
                  />
                </div>

                <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  Policy information will later be used by the
                  insurance knowledge/RAG layer to provide
                  policy-grounded guidance.
                </div>
              </section>
            )}

            {/* STEP 4 */}
            {currentStep === 4 && (
              <section>
                <h2 className="text-xl font-semibold">
                  Damage Evidence
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Upload clear images showing the vehicle damage.
                </p>

                <div className="mt-6">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">
                      Vehicle Damage Images
                    </span>

                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImages}
                      className="mt-2 block w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
                    />
                  </label>
                </div>

                {formData.damageImages.length > 0 && (
                  <div className="mt-5 rounded-xl bg-slate-50 p-4">
                    <p className="text-sm font-medium">
                      {formData.damageImages.length} image(s)
                      selected
                    </p>

                    <ul className="mt-2 space-y-1 text-sm text-slate-500">
                      {formData.damageImages.map((image) => (
                        <li key={image.name}>
                          {image.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-5">
                  <p className="font-medium text-slate-800">
                    AI evidence processing
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Submitted images are intended for computer
                    vision analysis to identify visible damage,
                    affected components and severity. The submitted
                    description can then be compared with the visual
                    evidence to identify inconsistencies or additional
                    damage requiring review.
                  </p>
                </div>
              </section>
            )}

            {/* STEP 5 */}
            {currentStep === 5 && (
              <section>
                <h2 className="text-xl font-semibold">
                  Additional Information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add information that may help the assessment.
                </p>

                <div className="mt-6 space-y-5">
                  <SelectField
                    label="Were there any injuries?"
                    value={formData.injuries}
                    onChange={(value) =>
                      updateField("injuries", value)
                    }
                    options={[
                      "No",
                      "Yes - Minor",
                      "Yes - Serious",
                      "Unknown",
                    ]}
                  />

                  <SelectField
                    label="Police Report Available?"
                    value={formData.policeReport}
                    onChange={(value) =>
                      updateField("policeReport", value)
                    }
                    options={[
                      "No",
                      "Yes",
                      "Not Applicable",
                    ]}
                  />

                  <TextArea
                    label="Other Relevant Information"
                    value={formData.additionalInformation}
                    onChange={(value) =>
                      updateField(
                        "additionalInformation",
                        value
                      )
                    }
                    placeholder="Add any other information relevant to the claim..."
                  />
                </div>

                <div className="mt-6 rounded-xl bg-slate-50 p-4">
                  <p className="font-medium text-slate-800">
                    AI assessment preparation
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    The complete claim combines vehicle information,
                    incident description, policy information and
                    visual evidence. These inputs can be processed
                    together for multimodal assessment.
                  </p>
                </div>
              </section>
            )}

            {/* STEP 6 */}
            {currentStep === 6 && (
              <section>
                <h2 className="text-xl font-semibold">
                  Review & Submit
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Review the information before submitting your claim.
                </p>

                <div className="mt-6 space-y-5">
                  <ReviewSection title="Vehicle">
                    <ReviewRow
                      label="Registration"
                      value={formData.registrationNumber}
                    />

                    <ReviewRow
                      label="Vehicle"
                      value={`${formData.manufacturer} ${formData.model}`}
                    />

                    <ReviewRow
                      label="Year"
                      value={formData.manufacturingYear}
                    />
                  </ReviewSection>

                  <ReviewSection title="Incident">
                    <ReviewRow
                      label="Date"
                      value={formData.accidentDate}
                    />

                    <ReviewRow
                      label="Type"
                      value={formData.incidentType}
                    />

                    <ReviewRow
                      label="Location"
                      value={formData.location}
                    />

                    <ReviewRow
                      label="Damage"
                      value={formData.damageDescription}
                    />
                  </ReviewSection>

                  <ReviewSection title="Insurance">
                    <ReviewRow
                      label="Policy"
                      value={formData.policyNumber}
                    />

                    <ReviewRow
                      label="Company"
                      value={formData.insuranceCompany}
                    />

                    <ReviewRow
                      label="Type"
                      value={formData.policyType}
                    />

                    <ReviewRow
                      label="Coverage"
                      value={formData.coverageType}
                    />
                  </ReviewSection>

                  <ReviewSection title="Evidence">
                    <ReviewRow
                      label="Images"
                      value={`${formData.damageImages.length} image(s)`}
                    />
                  </ReviewSection>

                  <div className="rounded-xl bg-slate-50 p-5">
                    <p className="font-medium text-slate-800">
                      What happens after submission?
                    </p>

                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                      <p>1. Claim is stored and assigned an ID.</p>
                      <p>2. Visual evidence is prepared for AI analysis.</p>
                      <p>3. Damage and affected parts can be detected.</p>
                      <p>4. NLP can analyse the incident description.</p>
                      <p>5. Text and visual evidence can be compared.</p>
                      <p>6. Insurance knowledge can be retrieved through RAG.</p>
                      <p>7. An AI-generated assessment can be prepared.</p>
                      <p>8. Human/service-center review remains part of the process.</p>
                    </div>
                  </div>

                  {message && (
                    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
                      {message}

                      {claimId && (
                        <p className="mt-2 font-semibold">
                          Claim ID: {claimId}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Validation message */}
            {message && currentStep < 6 && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {message}
              </div>
            )}

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between border-t pt-6">
              <button
                type="button"
                onClick={previousStep}
                disabled={currentStep === 1 || submitting}
                className="rounded-xl border px-5 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              {currentStep < 6 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={submitting}
                  className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white disabled:opacity-50"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white disabled:opacity-50"
                >
                  {submitting
                    ? "Submitting..."
                    : "Submit Claim"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

/* ---------- Reusable UI ---------- */

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-500"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
      >
        <option value="">Select...</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label}
      </span>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={5}
        className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-500"
      />
    </label>
  );
}

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border p-5">
      <h3 className="font-semibold text-slate-900">
        {title}
      </h3>

      <div className="mt-4 space-y-3">
        {children}
      </div>
    </div>
  );
}

function ReviewRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 pb-3 last:border-0 last:pb-0 sm:flex-row sm:justify-between">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="max-w-xl text-sm font-medium text-slate-800 sm:text-right">
        {value || "Not provided"}
      </span>
    </div>
  );
}

