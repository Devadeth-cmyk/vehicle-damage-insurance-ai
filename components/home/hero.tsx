"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export function Hero() {
  const [activeBtn, setActiveBtn] = useState<string | null>(null);
  const router = useRouter();

  return (
    <section className="relative w-full overflow-hidden bg-white">
      {/* Background blend & ambient glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 right-[10%] -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-sky-200/40 via-blue-100/20 to-transparent rounded-full blur-3xl" />

        <div className="absolute top-1/2 right-[25%] -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-sky-200/40 opacity-70" />
        <div className="absolute top-1/2 right-[28%] -translate-y-1/2 w-[340px] h-[340px] rounded-full border border-sky-300/30 opacity-60" />
        <div className="absolute top-[28%] right-[22%] w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
        <div className="absolute top-[68%] right-[32%] w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px] lg:min-h-[640px] items-center gap-8 py-12 lg:py-0">

          {/* Left Column */}
          <div className="lg:col-span-6 z-20 flex flex-col justify-center max-w-xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl font-extrabold tracking-tight text-[#0B1E48]">
                Auto<span className="text-[#0284C7]">Insight</span>
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black tracking-tight text-[#0B1E48] leading-[1.15]">
              Understand Your Vehicle Damage with{" "}
              <span className="text-[#0284C7] inline-block font-black">
                AI
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-500 font-normal leading-relaxed">
              Upload vehicle images, videos, and accident details to receive a
              preliminary AI-powered damage assessment and claim guidance.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4">

              {/* Start Assessment */}
              <button
                type="button"
                onClick={() => router.push("/claims/new")}
                className={`inline-flex items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 text-sm sm:text-base font-semibold transition-all duration-200 active:translate-y-0 ${
                  activeBtn === "assessment"
                    ? "bg-[#0284C7] text-white shadow-lg shadow-sky-500/25 -translate-y-0.5"
                    : "border border-sky-200 bg-white/90 text-[#0B1E48] shadow-sm backdrop-blur-sm hover:border-sky-400 hover:text-[#0284C7] hover:bg-white hover:shadow hover:-translate-y-0.5"
                }`}
              >
                <svg
                  className={`w-4 h-4 stroke-current stroke-2 fill-none transition-colors ${
                    activeBtn === "assessment"
                      ? "text-white"
                      : "text-[#0284C7]"
                  }`}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>

                <span>Start Assessment</span>
              </button>

              {/* Track Existing Request */}
              <button
                type="button"
                onClick={() => setActiveBtn("track")}
                className={`inline-flex items-center justify-center gap-2.5 rounded-xl px-6 py-3.5 text-sm sm:text-base font-semibold transition-all duration-200 active:translate-y-0 ${
                  activeBtn === "track"
                    ? "bg-[#0284C7] text-white shadow-lg shadow-sky-500/25 -translate-y-0.5"
                    : "border border-sky-200 bg-white/90 text-[#0B1E48] shadow-sm backdrop-blur-sm hover:border-sky-400 hover:text-[#0284C7] hover:bg-white hover:shadow hover:-translate-y-0.5"
                }`}
              >
                <svg
                  className={`w-4 h-4 stroke-current stroke-2 fill-none transition-colors ${
                    activeBtn === "track"
                      ? "text-white"
                      : "text-[#0284C7]"
                  }`}
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path
                    strokeLinecap="round"
                    d="M21 21l-4.35-4.35"
                  />
                </svg>

                <span>Track Existing Request</span>
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-6 relative flex items-center justify-center lg:justify-end z-10">
            <div className="relative w-full max-w-[620px] lg:max-w-none">

              {/* Main Car Image */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-sky-900/10">
                <Image
                  src="/images/hero_car.jpg"
                  alt="AI Damaged Vehicle Assessment"
                  width={1280}
                  height={720}
                  priority
                  className="w-full h-auto object-cover scale-[1.03]"
                />

                <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none" />

                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/90 via-white/40 to-transparent pointer-events-none" />
              </div>

              {/* Floating AI Analysis Card */}
              <div className="absolute -top-4 right-2 sm:top-2 sm:right-4 z-30 w-64 sm:w-72 rounded-2xl bg-white/95 p-4 shadow-2xl shadow-slate-900/15 ring-1 ring-slate-100 backdrop-blur-md transition-all duration-300 hover:shadow-sky-500/15">

                <div className="flex items-center gap-2.5 mb-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0284C7] text-white shadow-sm shadow-sky-500/30">
                    <svg
                      className="h-4 w-4 fill-current"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 14.5h-2v-2h2v2zm0-4h-2V7h2v5.5z" />
                    </svg>
                  </div>

                  <span className="text-sm font-bold text-[#0B1E48]">
                    AI Analysis
                  </span>
                </div>

                <ul className="space-y-2 text-xs font-medium text-slate-600 mb-3">
                  <li className="flex items-center gap-2 text-slate-700">
                    <svg
                      className="h-4 w-4 text-[#0284C7] shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Damage detected</span>
                  </li>

                  <li className="flex items-center gap-2 text-slate-700">
                    <svg
                      className="h-4 w-4 text-[#0284C7] shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Severity estimation</span>
                  </li>

                  <li className="flex items-center gap-2 text-slate-700">
                    <svg
                      className="h-4 w-4 text-[#0284C7] shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Claim guidance</span>
                  </li>
                </ul>

                {/* Scanned Inspection Thumbnail */}
                <div className="relative rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                  <Image
                    src="/images/hero_car.jpg"
                    alt="Inspected Bumper Area"
                    width={280}
                    height={160}
                    className="w-full h-24 object-cover object-left"
                  />

                  <div className="absolute inset-2 rounded-lg border-2 border-[#0284C7] bg-[#0284C7]/15 flex items-end p-1.5 shadow-[0_0_12px_rgba(2,132,199,0.5)] animate-pulse">
                    <span className="text-[10px] font-semibold text-white bg-[#0284C7] px-1.5 py-0.5 rounded shadow">
                      Bumper: 89% Damage
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default Hero;