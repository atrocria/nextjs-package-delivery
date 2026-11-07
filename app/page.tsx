import Link from "next/link";

const shipments = [
  { id: "PKG-48291", recipient: "Nur Aisyah", route: "Kuala Lumpur → Johor Bahru", date: "7 Nov 2026", status: "On the way", color: "bg-amber-50 text-amber-700 ring-amber-200" },
  { id: "PKG-48276", recipient: "Daniel Lee", route: "Petaling Jaya → Ipoh", date: "7 Nov 2026", status: "In transit", color: "bg-blue-50 text-blue-700 ring-blue-200" },
  { id: "PKG-48260", recipient: "Siti Hawa", route: "Shah Alam → Melaka", date: "6 Nov 2026", status: "Delivered", color: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
];

function MetricCard({ title, value, note, icon, featured = false }: { title: string; value: string; note: string; icon: string; featured?: boolean }) {
  return (
    <article className={`rounded-3xl p-5 shadow-sm ${featured ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white" : "border border-slate-100 bg-white text-slate-950"}`}>
      <div className="flex items-start justify-between">
        <div><p className={`text-sm font-medium ${featured ? "text-blue-100" : "text-slate-500"}`}>{title}</p><p className="mt-3 text-3xl font-bold tracking-tight">{value}</p></div>
        <span aria-hidden="true" className={`grid size-10 place-items-center rounded-2xl text-lg ${featured ? "bg-white/15" : "bg-slate-50"}`}>{icon}</span>
      </div>
      <p className={`mt-5 text-xs ${featured ? "text-blue-100" : "text-slate-500"}`}>{note}</p>
    </article>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#e9eef4] px-4 py-4 sm:px-7 sm:py-7">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col gap-4 px-2 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-medium text-blue-700">OVERVIEW</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Deliver with confidence.</h1><p className="mt-2 text-sm text-slate-500">A simple parcel delivery workspace for customers, delivery personnel, and administrators.</p></div>
          <Link className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700" href="/register"><span className="mr-2 text-lg leading-none">+</span> Create an account</Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,2.05fr)_minmax(300px,0.95fr)]">
          <div className="space-y-5">
            <section className="grid gap-5 sm:grid-cols-3" aria-label="Shipment metrics">
              <MetricCard featured icon="▣" note="↑ 12.4% from last month" title="Total parcels" value="248" />
              <MetricCard icon="□" note="18 parcels need an update" title="Pending pickup" value="64" />
              <MetricCard icon="⌖" note="↑ 8 deliveries today" title="Out for delivery" value="32" />
            </section>

            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-950">Shipment activity</h2><p className="mt-1 text-sm text-slate-500">An example overview of parcels and deliveries this year.</p></div><div className="flex items-center gap-4 text-xs font-medium text-slate-600"><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-blue-600" /> Parcels</span><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-emerald-500" /> Delivered</span><span className="rounded-xl bg-slate-50 px-3 py-2">Monthly</span></div></div>
              <div className="mt-7 h-52 rounded-2xl bg-gradient-to-b from-blue-50 to-white px-4 pt-4 sm:h-60"><div className="flex h-full items-end gap-2 sm:gap-3" aria-label="Monthly shipment chart">{[38, 54, 54, 30, 20, 45, 60, 56, 43, 68, 48, 57].map((height, index) => <div className="flex h-full flex-1 flex-col justify-end gap-2" key={index}><div className="rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400 opacity-90" style={{ height: `${height}%` }} /><span className="text-center text-[10px] font-medium text-slate-400">{["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][index]}</span></div>)}</div></div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm" id="shipments">
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-6"><div><h2 className="text-lg font-bold text-slate-950">Recent shipments</h2><p className="mt-1 text-sm text-slate-500">Track a parcel from collection to delivery.</p></div><span className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">Sample data</span></div>
              <div className="overflow-x-auto border-t border-slate-100"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-50 text-xs font-medium text-slate-500"><tr><th className="px-5 py-3 sm:px-6">Tracking ID</th><th className="px-5 py-3">Recipient</th><th className="px-5 py-3">Route</th><th className="px-5 py-3">Date</th><th className="px-5 py-3 sm:px-6">Status</th></tr></thead><tbody className="divide-y divide-slate-100 text-slate-700">{shipments.map((shipment) => <tr key={shipment.id}><td className="px-5 py-4 font-semibold text-slate-950 sm:px-6">#{shipment.id}</td><td className="px-5 py-4">{shipment.recipient}</td><td className="px-5 py-4 text-slate-500">{shipment.route}</td><td className="px-5 py-4 text-slate-500">{shipment.date}</td><td className="px-5 py-4 sm:px-6"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${shipment.color}`}>{shipment.status}</span></td></tr>)}</tbody></table></div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6" id="tracking">
              <div className="flex items-center justify-between"><div><p className="text-sm font-medium text-slate-500">Live tracking</p><h2 className="mt-1 text-xl font-bold text-slate-950">#PKG-48291</h2></div><span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">On the way</span></div>
              <ol className="mt-7 space-y-6 border-l border-dashed border-slate-300 pl-5 text-sm"><li className="relative"><i className="absolute -left-[25px] top-1 size-2.5 rounded-full bg-slate-950 ring-4 ring-white" /><p className="font-semibold text-slate-900">Parcel collected</p><p className="mt-1 text-xs text-slate-500">Kuala Lumpur hub · 9:10 AM</p></li><li className="relative"><i className="absolute -left-[25px] top-1 size-2.5 rounded-full bg-blue-600 ring-4 ring-white" /><p className="font-semibold text-slate-900">In transit</p><p className="mt-1 text-xs text-slate-500">Sorted for delivery · 12:40 PM</p></li><li className="relative"><i className="absolute -left-[25px] top-1 size-2.5 rounded-full bg-slate-200 ring-4 ring-white" /><p className="font-semibold text-slate-500">Out for delivery</p><p className="mt-1 text-xs text-slate-400">Estimated today · 5:30 PM</p></li></ol>
              <Link className="mt-7 block rounded-2xl border border-blue-200 py-3 text-center text-sm font-semibold text-blue-700 transition hover:bg-blue-50" href="/register">Track your parcel</Link>
            </section>
            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-bold text-slate-950">Delivery estimates</h2><p className="mt-1 text-sm text-slate-500">Typical delivery times from our hub.</p><div className="mt-6 space-y-5">{[["Within Klang Valley", "1–2 business days", "w-[42%]", "bg-blue-600"], ["West Malaysia", "2–4 business days", "w-[65%]", "bg-emerald-500"], ["East Malaysia", "4–6 business days", "w-[82%]", "bg-amber-400"]].map(([area, time, width, color]) => <div key={area}><div className="mb-2 flex justify-between gap-3 text-sm"><span className="font-semibold text-slate-800">{area}</span><span className="text-slate-500">{time}</span></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${width} ${color}`} /></div></div>)}</div></section>
          </aside>
        </div>
      </div>
    </div>
  );
}
