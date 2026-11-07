import Link from "next/link";

export default function Navbar() {
  return (
    <header className="bg-[#e9eef4] px-4 pt-4 sm:px-7 sm:pt-7">
      <nav aria-label="Main navigation" className="mx-auto flex max-w-7xl items-center justify-between rounded-3xl bg-white px-4 py-3 shadow-sm sm:px-6">
        <Link className="flex items-center gap-3 font-bold tracking-tight text-slate-950" href="/">
          <span className="grid size-9 place-items-center rounded-xl bg-slate-950 text-sm text-white">P</span>
          <span>ParcelFlow</span>
        </Link>
        <div className="hidden items-center gap-1 rounded-2xl bg-slate-50 p-1 text-sm font-medium text-slate-600 md:flex">
          <Link className="rounded-xl bg-blue-600 px-4 py-2 text-white shadow-sm" href="/">Dashboard</Link>
          <a className="rounded-xl px-4 py-2 hover:text-slate-950" href="#shipments">Shipping</a>
          <a className="rounded-xl px-4 py-2 hover:text-slate-950" href="#tracking">Tracking</a>
        </div>
        <Link className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 sm:px-4" href="/register">Register</Link>
      </nav>
    </header>
  );
}
