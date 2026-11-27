"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isDashboard = pathname === "/dashboard";
  const activeTab =
    pathname === "/dashboard"
      ? 0
      : pathname === "/shipping"
        ? 1
        : pathname === "/"
          ? 2
          : -1;
  const [selectedTab, setSelectedTab] = useState<{
    pathname: string;
    tab: number;
  } | null>(null);
  const navigationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearSelection = () => {
      setSelectedTab(null);
      if (navigationTimeout.current) {
        clearTimeout(navigationTimeout.current);
        navigationTimeout.current = null;
      }
    };
    window.addEventListener("popstate", clearSelection);

    return () => {
      window.removeEventListener("popstate", clearSelection);
      if (navigationTimeout.current) {
          clearTimeout(navigationTimeout.current);
      }
    };
  }, []);

  function cancelTabNavigation() {
    setSelectedTab(null);
    if (navigationTimeout.current) {
      clearTimeout(navigationTimeout.current);
      navigationTimeout.current = null;
    }
  }

  function navigateToTab(event: MouseEvent<HTMLAnchorElement>, tab: number) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      tab === activeTab
    ) {
      return;
    }

    const href = event.currentTarget.getAttribute("href");
    if (!href) return;

    event.preventDefault();
    setSelectedTab({ pathname, tab });
    if (navigationTimeout.current) {
      clearTimeout(navigationTimeout.current);
    }
    navigationTimeout.current = setTimeout(() => {
      navigationTimeout.current = null;
      router.push(href);
    }, 320);
  }

  const displayedTab =
    selectedTab?.pathname === pathname
      ? selectedTab.tab
      : activeTab;

  if (pathname === "/" || pathname === "/shipping") {
    return null;
  }

  return (
    <header
      className={`px-4 pt-3 sm:px-7 sm:pt-4 ${
        isDashboard ? "dashboard-background" : "bg-[var(--background)]"
      }`}
    >
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-7xl items-center justify-between px-2 py-2 sm:px-6"
      >
        <Link
          className="brand-logo flex items-center text-[28px] font-bold leading-none tracking-[-1.5px] text-[#292923]"
          href="/"
          onClick={cancelTabNavigation}
        >
          plop<span className="text-[#ff914d]">.</span>
        </Link>

        <div className="relative hidden grid-cols-3 rounded-2xl bg-[#d5d9db] p-1 text-sm font-medium text-[#41484c] md:grid">
          {displayedTab >= 0 && (
            <span
              aria-hidden="true"
              className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-xl bg-[#090b14] transition-transform duration-300 ease-in-out motion-reduce:transition-none"
              style={{ transform: `translateX(${displayedTab * 100}%)` }}
            />
          )}
          <Link
            aria-current={displayedTab === 0 ? "page" : undefined}
            className={`relative z-10 rounded-xl px-4 py-2 text-center transition-colors ${
              displayedTab === 0 ? "text-white" : "hover:text-slate-950"
            }`}
            href="/dashboard"
            onClick={(event) => navigateToTab(event, 0)}
          >
            Dashboard
          </Link>

          <Link
            aria-current={displayedTab === 1 ? "page" : undefined}
            className={`relative z-10 rounded-xl px-4 py-2 text-center transition-colors ${
              displayedTab === 1 ? "text-white" : "hover:text-slate-950"
            }`}
            href="/shipping"
            onClick={(event) => navigateToTab(event, 1)}
          >
            Shipping
          </Link>

          <Link
            aria-current={displayedTab === 2 ? "page" : undefined}
            className={`relative z-10 rounded-xl px-4 py-2 text-center transition-colors ${
              displayedTab === 2 ? "text-white" : "hover:text-slate-950"
            }`}
            href="/#tracking"
            onClick={(event) => navigateToTab(event, 2)}
          >
            Tracking
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link
            className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:px-4"
            href="/login"
            onClick={cancelTabNavigation}
          >
            Sign in
          </Link>
          <Link
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition sm:px-4 ${
              isDashboard
                ? "bg-slate-950 text-white hover:bg-[#353128]"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
            href="/register"
            onClick={cancelTabNavigation}
          >
            Register
          </Link>
        </div>
      </nav>
    </header>
  );
}
