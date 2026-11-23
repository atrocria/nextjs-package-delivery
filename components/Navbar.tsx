"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  // Hide dashboard navigation on the PLOP landing page
  if (pathname === "/") {
    return null;
  }

  return (
    <header className="bg-[var(--background)] px-4 pt-4 sm:px-7 sm:pt-7">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-7xl items-center justify-between rounded-3xl bg-[var(--background)] px-4 py-3 sm:px-6"
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

        <div className="hidden items-center gap-1 rounded-2xl bg-slate-50 p-1 text-sm font-medium text-slate-600 md:flex">
          <Link
            className={`rounded-xl px-4 py-2 shadow-sm ${
              pathname === "/dashboard"
                ? "bg-blue-600 text-white"
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
            className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 sm:px-4"
            href="/register"
          >
            Register
          </Link>
        </div>
      </nav>
    </header>
  );
}
