
const features = [
  { icon: "📝", title: "Maintenance Requests", description: "Submit and track maintenance, repair, and modification requests." },
  { icon: "🔧", title: "Maintenance Team", description: "Manage assigned jobs, repairs, spare parts, and handover." },
  { icon: "🏭", title: "Machine Register", description: "View equipment records, QR codes, and maintenance history." },
  { icon: "📅", title: "Preventive Maintenance", description: "Manage scheduled inspections, checklists, and reminders." },
  { icon: "📦", title: "Spare Parts Inventory", description: "Track stock quantities, parts usage, and replenishment." },
  { icon: "📊", title: "Reports & Dashboard", description: "Monitor downtime, job progress, and maintenance performance." },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 px-6 py-6 text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <div className="rounded-xl bg-blue-600 p-3 text-3xl">
            🔧
          </div>
          <div>
            <h1 className="text-xl font-bold">
              NM PACKAGING (M) SDN. BHD.
            </h1>
            <p className="text-sm text-slate-300">
              Maintenance Management System
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <section className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">
            Maintenance Dashboard
          </h2>
          <p className="mt-2 text-slate-600">
            Welcome to the NM PACKAGING maintenance portal.
          </p>
        </section>

        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Open MRFs", value: "0" },
            { label: "Pending Approvals", value: "0" },
            { label: "Overdue PM Tasks", value: "0" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl bg-white p-6 shadow-sm"
            >
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {item.value}
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 text-3xl">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-slate-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                {feature.description}
              </p>
              <span className="mt-5 inline-block text-sm font-medium text-blue-700">
                Coming soon
              </span>
            </div>
          ))}
        </section>

        <footer className="mt-12 text-center text-sm text-slate-500">
          © 2026 NM PACKAGING (M) SDN. BHD.
        </footer>
      </div>
    </main>
  );
}