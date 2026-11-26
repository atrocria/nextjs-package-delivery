"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";

  if (pathname === "/" || pathname === "/shipping") {
    return null;
  }

  return (
    <header
      className={`px-4 pt-4 sm:px-7 sm:pt-7 ${
        isDashboard ? "bg-[#e5e7e8]" : "bg-[var(--background)]"
      }`}
      style={
        isDashboard
          ? {
              backgroundImage:
                "radial-gradient(ellipse at 18% 0%, rgba(255,255,255,0.88) 0%, transparent 58%), linear-gradient(135deg, #eef0f1 0%, #ffffff 52%, #e9ebec 100%)",
            }
          : undefined
      }
    >
      <nav
        aria-label="Main navigation"
        className={`mx-auto flex max-w-7xl items-center justify-between rounded-3xl px-4 py-3 sm:px-6 ${
          isDashboard ? "bg-[#e5e7e8]" : "bg-[var(--background)]"
        }`}
      >
        <Link
          className="flex items-center gap-3 font-bold tracking-tight text-slate-950"
          href="/"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-slate-950 text-sm text-white">
            P!p
          </span>
          <span>Plop!</span>
        </Link>

        <div
          className={`hidden items-center gap-1 rounded-2xl p-1 text-sm font-medium md:flex ${
            isDashboard
              ? "bg-[#d5d9db] text-[#41484c]"
              : "bg-slate-50 text-slate-600"
          }`}
        >
          <Link
            className={`rounded-xl px-4 py-2 shadow-sm ${
              isDashboard
                ? "bg-slate-950 text-[#f4b77f] ring-1 ring-inset ring-[#e8874c]/50"
                : "hover:text-slate-950"
            }`}
            href="/dashboard"
          >
            Dashboard
          </Link>

          <Link
            className={`rounded-xl px-4 py-2 ${
              pathname === "/shipping"
                ? "bg-blue-600 text-white"
                : "hover:text-slate-950"
            }`}
            href="/shipping"
          >
            Shipping
          </Link>

          <Link
            className="rounded-xl px-4 py-2 hover:text-slate-950"
            href="/#tracking"
          >
            Tracking
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link
            className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:px-4"
            href="/login"
          >
            Sign in
          </Link>
          <Link
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition sm:px-4 ${
              isDashboard
                ? "bg-slate-950 text-[#f4b77f] hover:bg-[#353128]"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
            href="/register"
          >
            Register
          </Link>
        </div>
      </nav>
    </header>
  );
}
