import { ArrowUpRight, Clock3, Package, Plus, Truck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const shipments = [
  {
    id: "PKG-48291",
    recipient: "Nur Aisyah",
    route: "Kuala Lumpur → Johor Bahru",
    date: "7 Nov 2026",
    status: "On the way",
    color: "bg-[#fff1e5] text-[#a8531d] ring-[#f2d1b6]",
  },
  {
    id: "PKG-48276",
    recipient: "Daniel Lee",
    route: "Petaling Jaya → Ipoh",
    date: "7 Nov 2026",
    status: "In transit",
    color: "bg-[#efeee9] text-[#393832] ring-[#d8d5cd]",
  },
  {
    id: "PKG-48260",
    recipient: "Siti Hawa",
    route: "Shah Alam → Melaka",
    date: "6 Nov 2026",
    status: "Delivered",
    color: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  },
];

function MetricCard({
  title,
  value,
  note,
  icon,
  featured = false,
}: {
  title: string;
  value: string;
  note: string;
  icon: ReactNode;
  featured?: boolean;
}) {
  return (
    <article
      className={`relative overflow-hidden rounded-2xl border p-5 shadow-[0_8px_24px_rgba(27,31,34,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(27,31,34,0.12)] ${
        featured
          ? "border-[#1c1c19] bg-[#1c1c19] text-white shadow-[0_10px_26px_rgba(24,25,26,0.2)]"
          : "border-[#c6cbcd] bg-white text-[#1c1c19]"
      }`}
    >
      {featured && (
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-0 h-3 w-12 -translate-x-1/2 rounded-b-sm bg-[#f4b77f]/80 shadow-sm"
        />
      )}
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium ${featured ? "text-[#f4b77f]" : "text-[#78756f]"}`}>
            {title}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <span
          aria-hidden="true"
          className={`grid size-10 place-items-center rounded-2xl ${
            featured
              ? "bg-[#f4b77f] text-[#1c1c19]"
              : "bg-[#fce6d5] text-[#a8531d]"
          }`}
        >
          {icon}
        </span>
      </div>
      <p className={`relative z-10 mt-5 text-xs ${featured ? "text-[#f4b77f]" : "text-[#78756f]"}`}>
        {note}
      </p>
    </article>
  );
}

export default function Home() {
  return (
    <div
      className="min-h-screen bg-[#e5e7e8] px-4 py-6 sm:px-7 sm:py-8"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 18% 0%, rgba(255,255,255,0.88) 0%, transparent 58%), linear-gradient(135deg, #eef0f1 0%, #ffffff 52%, #e9ebec 100%)",
      }}
    >
      <div className="mx-auto max-w-7xl">
        <header className="mb-7 flex flex-col gap-4 px-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-[#b5531f]">OVERVIEW</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#1c1c19] sm:text-4xl">
              Your shipping, at a glance.
            </h1>
            <p className="mt-2 text-sm text-[#78756f]">
              Monitor parcels and keep deliveries moving.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-[#393127] bg-[#1c1c19] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#353128] sm:self-auto"
            href="/shipping"
          >
            <Plus className="text-[#f4b77f]" size={17} aria-hidden="true" />
            New shipment
            <ArrowUpRight className="text-[#f4b77f]" size={15} aria-hidden="true" />
          </Link>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,2.05fr)_minmax(300px,0.95fr)]">
          <div className="min-w-0 space-y-5">
            <section className="grid gap-5 sm:grid-cols-3" aria-label="Shipment metrics">
              <MetricCard
                featured
                icon={<Package size={19} />}
                note="↑ 12.4% from last month"
                title="Total parcels"
                value="248"
              />
              <MetricCard
                icon={<Clock3 size={19} />}
                note="18 parcels need an update"
                title="Pending pickup"
                value="64"
              />
              <MetricCard
                icon={<Truck size={19} />}
                note="↑ 8 deliveries today"
                title="Out for delivery"
                value="32"
              />
            </section>

            <section className="rounded-[22px] border border-[#c6cbcd] bg-white p-5 shadow-[0_10px_28px_rgba(37,43,47,0.08)] sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[#1c1c19]">Shipment activity</h2>
                  <p className="mt-1 text-sm text-[#78756f]">
                    An example overview of parcels and deliveries this year.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium text-[#66635b]">
                  <span className="flex items-center gap-1.5">
                    <i className="size-2 rounded-sm bg-[#292824]" /> Parcels
                  </span>
                  <span className="flex items-center gap-1.5">
                    <i className="size-2 rounded-sm bg-[#f4b77f]" /> Delivered
                  </span>
                  <span className="rounded-md bg-[#edf0f1] px-3 py-2">Monthly</span>
                </div>
              </div>
              <div
                className="mt-7 h-52 rounded-xl border border-dashed border-[#aeb6ba] bg-[#e5e8e9] px-4 pt-4 sm:h-60"
                style={{
                  backgroundImage:
                    "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.8) 0%, transparent 72%), linear-gradient(180deg, #f7f8f8, #e9ebec)",
                }}
              >
                <div
                  className="flex h-full items-end gap-2 sm:gap-3"
                  aria-label="Monthly shipment chart"
                >
                  {[38, 54, 54, 30, 20, 45, 60, 56, 43, 68, 48, 57].map(
                    (height, index) => (
                      <div
                        className="flex h-full flex-1 flex-col justify-end gap-2"
                        key={index}
                      >
                        <div
                          className="relative rounded-t-md bg-gradient-to-t from-[#1c1c19] via-[#554132] to-[#e8874c] opacity-90"
                          style={{ height: `${height}%` }}
                        >
                          <span className="absolute inset-x-0 top-0 h-1.5 bg-[#f4b77f]" />
                        </div>
                        <span className="text-center text-[10px] font-medium text-[#969188]">
                          {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][index]}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </section>

            <section
              className="overflow-hidden rounded-[22px] border border-[#c6cbcd] bg-white shadow-[0_10px_28px_rgba(37,43,47,0.08)]"
              id="shipments"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-6">
                <div>
                  <h2 className="text-lg font-semibold text-[#1c1c19]">Recent shipments</h2>
                  <p className="mt-1 text-sm text-[#78756f]">
                    Track a parcel from collection to delivery.
                  </p>
                </div>
                <span className="rounded-md bg-[#edf0f1] px-3 py-2 text-xs font-semibold text-[#555d61]">
                  Sample data
                </span>
              </div>
              <div className="overflow-x-auto border-t border-[#d9dddf]">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="bg-[#f1f3f4] text-xs font-semibold text-[#555d61]">
                    <tr>
                      <th className="px-5 py-3 sm:px-6">Tracking ID</th>
                      <th className="px-5 py-3">Recipient</th>
                      <th className="px-5 py-3">Route</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3 sm:px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e6e9ea] text-[#5f5f5b]">
                    {shipments.map((shipment) => (
                      <tr className="transition-colors hover:bg-[#f6f8f8]" key={shipment.id}>
                        <td className="px-5 py-4 font-semibold text-[#1c1c19] sm:px-6">
                          #{shipment.id}
                        </td>
                        <td className="px-5 py-4">{shipment.recipient}</td>
                        <td className="px-5 py-4 text-[#78756f]">{shipment.route}</td>
                        <td className="px-5 py-4 text-[#78756f]">{shipment.date}</td>
                        <td className="px-5 py-4 sm:px-6">
                          <span
                            className={`rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${shipment.color}`}
                          >
                            {shipment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <aside className="min-w-0 space-y-5">
            <section
              className="rounded-[22px] border border-[#c6cbcd] bg-white p-5 shadow-[0_10px_28px_rgba(37,43,47,0.08)] sm:p-6"
              id="tracking"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#78756f]">Live tracking</p>
                  <h2 className="mt-1 text-xl font-semibold text-[#1c1c19]">#PKG-48291</h2>
                </div>
                <span className="rounded-full bg-[#f5d9bb] px-3 py-1.5 text-xs font-semibold text-[#a8531d] ring-1 ring-inset ring-[#e6c19a]">
                  On the way
                </span>
              </div>
              <ol className="mt-7 space-y-6 border-l border-dashed border-[#d6d1c7] pl-5 text-sm">
                <li className="relative">
                  <i className="absolute -left-[25px] top-1 size-2.5 rounded-full bg-[#1c1c19] ring-4 ring-white" />
                  <p className="font-semibold text-[#292824]">Parcel collected</p>
                  <p className="mt-1 text-xs text-[#78756f]">Kuala Lumpur hub · 9:10 AM</p>
                </li>
                <li className="relative">
                  <i className="absolute -left-[25px] top-1 size-2.5 rounded-full bg-[#e8874c] ring-4 ring-white" />
                  <p className="font-semibold text-[#292824]">In transit</p>
                  <p className="mt-1 text-xs text-[#78756f]">Sorted for delivery · 12:40 PM</p>
                </li>
                <li className="relative">
                  <i className="absolute -left-[25px] top-1 size-2.5 rounded-full bg-[#dedbd4] ring-4 ring-white" />
                  <p className="font-semibold text-[#78756f]">Out for delivery</p>
                  <p className="mt-1 text-xs text-[#969188]">Estimated today · 5:30 PM</p>
                </li>
              </ol>
              <Link
                className="mt-7 block rounded-xl border border-[#292824] bg-[#1c1c19] py-3 text-center text-sm font-semibold text-[#f4b77f] transition hover:bg-[#353128]"
                href="/register"
              >
                Track your parcel
              </Link>
            </section>

            <section className="rounded-[22px] border border-[#c6cbcd] bg-white p-5 shadow-[0_10px_28px_rgba(37,43,47,0.08)] sm:p-6">
              <h2 className="text-lg font-semibold text-[#1c1c19]">Delivery estimates</h2>
              <p className="mt-1 text-sm text-[#78756f]">
                Typical delivery times from our hub.
              </p>
              <div className="mt-6 space-y-5">
                {[
                  ["Within Klang Valley", "1–2 business days", "w-[42%]", "bg-[#1c1c19]"],
                  ["West Malaysia", "2–4 business days", "w-[65%]", "bg-[#e8874c]"],
                  ["East Malaysia", "4–6 business days", "w-[82%]", "bg-[#f4b77f]"],
                ].map(([area, time, width, color]) => (
                  <div key={area}>
                    <div className="mb-2 flex justify-between gap-3 text-sm">
                      <span className="font-semibold text-[#393832]">{area}</span>
                      <span className="text-[#78756f]">{time}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-md bg-[#e3e6e7]">
                      <div className={`h-full rounded-full ${width} ${color}`} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
