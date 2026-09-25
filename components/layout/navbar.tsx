"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SessionUser, UserRole } from "@/types/auth";

interface NavItem {
  id: string;
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "new-claim", label: "New Claim", href: "/claims/new" },
  { id: "track-request", label: "Track Request", href: "#track-request" },
];

export function Navbar() {
  const router = useRouter();
  const [activeItem, setActiveItem] = useState<string>("home");
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => setCurrentUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            onClick={() => setActiveItem("home")}
            className="group flex items-center gap-3.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg p-1"
            aria-label="AutoInsight Home"
          >
            {/* Shield Logo with front-facing car symbol */}
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0284C7] to-[#0369A1] shadow-md shadow-blue-500/20 text-white transition-transform duration-200 group-hover:scale-105">
              <svg
                className="h-7 w-7 text-white"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Shield Path with subtle inner border */}
                <path
                  d="M12 2.5L4.5 5.5V11.2C4.5 16.1 7.7 20.6 12 21.8C16.3 20.6 19.5 16.1 19.5 11.2V5.5L12 2.5Z"
                  fill="currentColor"
                  fillOpacity="0.25"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                {/* Front-view modern Car */}
                <path
                  d="M8.2 12.5L9.2 9.5C9.4 9 9.8 8.6 10.4 8.6H13.6C14.2 8.6 14.6 9 14.8 9.5L15.8 12.5"
                  stroke="white"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 12.8C7 12.4 7.3 12 7.7 12H16.3C16.7 12 17 12.4 17 12.8V15.2C17 15.6 16.7 16 16.3 16H7.7C7.3 16 7 15.6 7 15.2V12.8Z"
                  stroke="white"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <circle cx="9" cy="14" r="0.8" fill="white" />
                <circle cx="15" cy="14" r="0.8" fill="white" />
                <line x1="11" y1="14.2" x2="13" y2="14.2" stroke="white" strokeWidth="1" strokeLinecap="round" />
                <path d="M7.8 16V17C7.8 17.3 7.5 17.5 7.2 17.5H7C6.7 17.5 6.5 17.3 6.5 17V15.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M16.2 16V17C16.2 17.3 16.5 17.5 16.8 17.5H17C17.3 17.5 17.5 17.3 17.5 17V15.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>

            {/* Brand Text & Tagline */}
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-[#0B1E48] leading-none">
                Auto<span className="text-[#0284C7]">Insight</span>
              </span>
              <span className="mt-1 text-[10px] font-medium tracking-wide text-slate-500">
                Smarter Assessments. Faster Support.
              </span>
            </div>
          </Link>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8">
          {NAV_ITEMS.map((item) => {
            const isActive = activeItem === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={() => {
                  setActiveItem(item.id);
                }}
                className={`py-2 text-sm font-semibold transition-all duration-200 ease-out inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] rounded-sm ${
                  isActive
                    ? "text-[#0284C7] -translate-y-0.5 [text-shadow:_0_2px_8px_rgba(2,132,199,0.35)]"
                    : "text-[#0B1E48] hover:text-[#0284C7]"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Right side: Login / User button & Portal Switcher */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-20 bg-slate-100 animate-pulse rounded-lg" />
          ) : currentUser ? (
            <div className="flex items-center gap-2.5">
              {currentUser.role === UserRole.ADMIN && (
                <Link
                  href="/admin"
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  Admin Portal →
                </Link>
              )}

              {currentUser.role === UserRole.SERVICE_CENTER && currentUser.status === "approved" && (
                <Link
                  href="/service-center"
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  Service Portal →
                </Link>
              )}

              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-lg px-2.5 py-1.5">
                <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-[#0B1E48] to-[#0284C7] text-white flex items-center justify-center text-[10px] font-bold">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 leading-tight max-w-[120px] truncate">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 capitalize leading-none">
                    {currentUser.role}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center text-xs font-semibold text-rose-600 hover:text-rose-800 px-2 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                title="Sign out"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#0B1E48] transition-colors duration-200 hover:text-[#0284C7] hover:bg-slate-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7]"
              >
                <svg
                  className="h-5 w-5 stroke-current fill-none transition-colors duration-200"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Login</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
