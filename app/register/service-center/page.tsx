"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ServiceCenterRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    serviceCenterName: "",
    contactPerson: "",
    businessEmail: "",
    phone: "",
    address: "",
    registrationNumber: "",
    password: "",
    confirmPassword: "",
    supportingDocumentName: "business_registration_license.pdf",
  });

  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocumentFile(file);
      setFormData((prev) => ({
        ...prev,
        supportingDocumentName: file.name,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register-service-center", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceCenterName: formData.serviceCenterName,
          contactPerson: formData.contactPerson,
          businessEmail: formData.businessEmail,
          phone: formData.phone,
          address: formData.address,
          registrationNumber: formData.registrationNumber,
          supportingDocumentName: formData.supportingDocumentName,
          supportingDocumentData: documentFile ? `/uploads/${documentFile.name}` : undefined,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit application");
      }

      router.push(data.redirectUrl || "/auth/pending-approval");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-3 group focus:outline-none">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#0284C7] to-[#0369A1] shadow-md shadow-blue-500/20 text-white transition-transform duration-200 group-hover:scale-105">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </div>
            <span className="text-2xl font-black tracking-tight text-[#0B1E48]">
              Auto<span className="text-[#0284C7]">Insight</span>
            </span>
          </Link>

          <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
            Service Center Application
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Partner with AutoInsight to process intelligent vehicle assessments and claim estimates.
          </p>
        </div>

        {/* Informational Banner */}
        <div className="mt-6 rounded-xl bg-amber-50 p-4 border border-amber-200">
          <div className="flex">
            <div className="shrink-0 text-amber-500">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 text-xs text-amber-800 leading-relaxed">
              <span className="font-bold">Approval Requirement:</span> All Service Center registrations are placed in a{" "}
              <strong className="underline">Pending</strong> status. An AutoInsight Administrator must review and approve your business credentials before access to the Service Center portal is granted.
            </div>
          </div>
        </div>

        {/* Application Form Card */}
        <div className="mt-6 bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80 sm:px-10">
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200 text-sm font-medium text-red-800">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-[#0B1E48]">1. Business Information</h3>
              <p className="text-xs text-slate-500">Details about your repair shop or certified body center.</p>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Service Center Name *
                  </label>
                  <input
                    type="text"
                    name="serviceCenterName"
                    required
                    value={formData.serviceCenterName}
                    onChange={handleChange}
                    placeholder="e.g. Apex Precision Auto Body"
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 shadow-sm focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Primary Contact Person *
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    required
                    value={formData.contactPerson}
                    onChange={handleChange}
                    placeholder="e.g. John Mitchell (Manager)"
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 shadow-sm focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Business Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 012-3456"
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 shadow-sm focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Physical Facility Address *
                  </label>
                  <textarea
                    name="address"
                    rows={2}
                    required
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="1234 Motor Way, Suite 100, City, State, ZIP"
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-900 shadow-sm focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Verification & Compliance */}
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-[#0B1E48]">2. Verification & Licensing</h3>
              <p className="text-xs text-slate-500">Provide registration details for administrative review.</p>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Business Registration / License Number *
                  </label>
                  <input
                    type="text"
                    name="registrationNumber"
                    required
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    placeholder="e.g. LIC-CA-2024-998877"
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 shadow-sm focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 sm:text-sm font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Supporting Document (License / Insurance Proof)
                  </label>
                  <div className="mt-1.5 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-[#0284C7] transition-colors bg-slate-50/50">
                    <div className="space-y-1 text-center">
                      <svg className="mx-auto h-10 w-10 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-slate-600 justify-center">
                        <label className="relative cursor-pointer rounded-md font-semibold text-[#0284C7] hover:underline focus-within:outline-none">
                          <span>Upload a certificate/document</span>
                          <input type="file" className="sr-only" onChange={handleFileChange} />
                        </label>
                      </div>
                      <p className="text-xs text-slate-500">
                        {documentFile ? (
                          <span className="font-bold text-emerald-600">Selected: {documentFile.name}</span>
                        ) : (
                          "PDF, PNG, JPG up to 10MB (Sample: business_registration_license.pdf)"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Credentials */}
            <div>
              <h3 className="text-base font-bold text-[#0B1E48]">3. Account Credentials</h3>
              <p className="text-xs text-slate-500">Use these credentials to sign in and monitor your application status.</p>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Business Email *
                  </label>
                  <input
                    type="email"
                    name="businessEmail"
                    required
                    value={formData.businessEmail}
                    onChange={handleChange}
                    placeholder="contact@apexautobody.com"
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 shadow-sm focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 6 characters"
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 shadow-sm focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 shadow-sm focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-md shadow-blue-500/25 text-sm font-bold text-white bg-[#0284C7] hover:bg-[#0369A1] focus:outline-none focus:ring-2 focus:ring-[#0284C7] disabled:opacity-50 transition-all"
              >
                {loading ? "Submitting Application..." : "Submit Service Center Application"}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-4 text-center text-xs text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-[#0284C7] hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
