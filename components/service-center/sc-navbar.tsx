"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { SessionUser } from "@/types/auth";

interface NavItem {
  id: string;
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", href: "/service-center" },
  { id: "new-assessment", label: "New Assessment", href: "/service-center/new-assessment" },
  { id: "track", label: "Track Request", href: "/service-center/track" },
  { id: "backlog", label: "Backlog", href: "/service-center/backlog" },
];

interface ScNavbarProps {
  user: SessionUser | null;
}

export function ScNavbar({ user }: ScNavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const displayName = user?.serviceCenterName || user?.name || "Service Center";

  function isActive(href: string) {
    if (href === "/service-center") {
      return pathname === "/service-center";
    }
    return pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">

          {/* Brand */}
          <Link
            href="/service-center"
            className="flex items-center gap-2.5 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] rounded-lg"
            aria-label="AutoInsight Service Center Home"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B1E48] shrink-0">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2.5L4.5 5.5V11.2C4.5 16.1 7.7 20.6 12 21.8C16.3 20.6 19.5 16.1 19.5 11.2V5.5L12 2.5Z"
                  fill="currentColor"
                  fillOpacity="0.3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M8.2 12.5L9.2 9.5C9.4 9 9.8 8.6 10.4 8.6H13.6C14.2 8.6 14.6 9 14.8 9.5L15.8 12.5"
                  stroke="white"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 12.8C7 12.4 7.3 12 7.7 12H16.3C16.7 12 17 12.4 17 12.8V15.2C17 15.6 16.7 16 16.3 16H7.7C7.3 16 7 15.6 7 15.2V12.8Z"
                  stroke="white"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
                <circle cx="9" cy="14" r="0.75" fill="white" />
                <circle cx="15" cy="14" r="0.75" fill="white" />
              </svg>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-extrabold tracking-tight text-[#0B1E48]">
                Auto<span className="text-[#0284C7]">Insight</span>
              </span>
              <span className="text-[10px] font-medium text-slate-400 tracking-wide">
                Service Center
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Service Center navigation">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-[#0284C7]/8 text-[#0284C7] font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right: User + Logout */}
          <div className="flex items-center gap-2 shrink-0">
            {/* User info — hidden on small screens */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
              <div className="h-6 w-6 rounded-full bg-[#0B1E48] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-slate-700 max-w-[140px] truncate">
                {displayName}
              </span>
            </div>

            <LogoutButton className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors" />

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="8" x2="21" y2="8" />
                  <line x1="3" y1="16" x2="21" y2="16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200 py-3 space-y-1">
            {/* Mobile user info */}
            <div className="flex items-center gap-2 px-3 py-2 mb-2">
              <div className="h-7 w-7 rounded-full bg-[#0B1E48] text-white flex items-center justify-center text-xs font-bold shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-800 truncate max-w-[200px]">
                  {displayName}
                </span>
                <span className="text-[10px] text-slate-400">{user?.email}</span>
              </div>
            </div>

            {NAV_ITEMS.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-[#0284C7]/8 text-[#0284C7] font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
