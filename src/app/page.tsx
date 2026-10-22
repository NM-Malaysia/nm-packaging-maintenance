
import Link from "next/link";
import DashboardNavigation from "./DashboardNavigation";
import { connection } from "next/server";
import { Suspense } from "react";
import RecoveryRedirect from "./RecoveryRedirect";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

const features = [
  {
    icon: "📝",
    title: "Maintenance Requests",
    description:
      "Submit and track maintenance, repair, and modification requests.",
  },
  {
    icon: "🔧",
    title: "Maintenance Team",
    description:
      "Manage assigned jobs, repairs, spare parts, and handover.",
  },
  {
    icon: "🏭",
    title: "Machine Register",
    description:
      "View equipment records, QR codes, and maintenance history.",
  },
  {
    icon: "📅",
    title: "Preventive Maintenance",
    description:
      "Manage scheduled inspections, checklists, and reminders.",
  },
  {
    icon: "📦",
    title: "Spare Parts Inventory",
    description:
      "Track stock quantities, parts usage, and replenishment.",
  },
  {
    icon: "📊",
    title: "Reports & Dashboard",
    description:
      "Monitor downtime, job progress, and maintenance performance.",
  },

  {
  icon: "👥",
  title: "Employee Management",
  description:
    "Register employees, assign departments, and manage accounts.",
},
];


// This component checks authentication on the server.
async function ProtectedDashboard() {
// Wait for an actual request before Supabase authentication.
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  

  if (error || !user) {
    redirect("/login");
  }
  
const { data: employee, error: employeeError } = await supabase
  .from("employees")
  .select("employee_id, full_name, role, is_active, must_change_password")
  .eq("id", user.id)
  .maybeSingle();

if (employeeError || !employee || !employee.is_active) {
  redirect("/login?error=access_denied");
}

const allowedRoles = [
  "requestor",
  "department_hod",
  "maintenance_technician",
  "maintenance_supervisor",
  "maintenance_clerk",
  "admin",
];

if (employee.must_change_password === true) {
  redirect("/change-password");
}

const canSubmit = ["requestor", "department_hod"].includes(employee.role);
const canOpenMaintenance = [
  "admin", "maintenance_supervisor",
  "maintenance_technician", "maintenance_clerk",
].includes(employee.role);
const canReviewHod = ["department_hod", "admin"].includes(employee.role);


const [totalResult, submittedResult, recentResult] = await Promise.all([
  supabase.from("maintenance_requests")
    .select("id", { count: "exact", head: true }),
  supabase.from("maintenance_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "submitted"),
  supabase.from("maintenance_requests")
    .select("id, mrf_number, machine_name, department, status, submitted_at")
    .order("submitted_at", { ascending: false })
    .limit(10),
]);

const requestLoadError =
  totalResult.error || submittedResult.error || recentResult.error;


  return (
    <main className="min-h-screen bg-slate-100">
      <RecoveryRedirect />
      <DashboardNavigation name={employee.full_name} role={employee.role} />

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

        
        {allowedRoles.includes(employee.role) && (
          <nav aria-label="Quick actions"
            className="mb-8 grid gap-3 sm:max-w-4xl sm:grid-cols-2 lg:grid-cols-4">
            {canReviewHod && (
              <Link href="/approvals"
                className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-blue-700 px-5 py-3 text-center font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
                HOD Approvals <span aria-hidden="true">→</span>
              </Link>
            )}
            {canOpenMaintenance && (
              <Link href="/maintenance"
                className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-blue-700 px-5 py-3 text-center font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
                Maintenance Team <span aria-hidden="true">→</span>
              </Link>
            )}
            {canReviewHod && (
              <Link href="/repair-approvals"
                className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-blue-700 px-5 py-3 text-center font-semibold text-white transition hover:bg-blue-800">
                Repair Approvals <span aria-hidden="true">→</span>
              </Link>
            )}
            <Link href="/handovers"
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-blue-700 px-5 py-3 text-center font-semibold text-white transition hover:bg-blue-800">
              Handover <span aria-hidden="true">→</span>
            </Link>
          </nav>
        )}

        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Accessible MRFs", value: totalResult.error ? "Unavailable" : String(totalResult.count ?? 0) },
            { label: "Submitted MRFs", value: submittedResult.error ? "Unavailable" : String(submittedResult.count ?? 0) },
            { label: "Overdue PM Tasks", value: "Not connected" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl bg-white p-6 shadow-sm"
            >
              <p className="text-sm text-slate-500">
                {item.label}
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {item.value}
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features
  .filter((feature) => {
  if (employee.role === "admin") {
    return true;
  }

  if (employee.role === "maintenance_clerk") {
    return [
      "Maintenance Team",
      "Machine Register",
      "Spare Parts Inventory",
    ].includes(feature.title);
  }

  return feature.title !== "Employee Management";
})
  .map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 text-3xl">
                {feature.icon}
              </div>

              <h3 className="text-lg font-semibold text-slate-900">
                {feature.title}
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                {feature.description}
              </p>

              {feature.title === "Maintenance Requests" && canSubmit ? (
                <Link
                  href="/requests/new"
                  className="mt-5 inline-block font-semibold text-blue-700 hover:underline"
                >
                  + New request →
                </Link>
              ) : feature.title === "Maintenance Team" ? (
                canOpenMaintenance ? (
                  <Link href="/maintenance"
                    className="mt-5 inline-block font-semibold text-blue-700 hover:underline">
                    Open maintenance jobs →
                  </Link>
                ) : (
                  <span className="mt-5 inline-block text-sm text-slate-500">
                    Available to maintenance staff
                  </span>
                )
              ) : feature.title === "Reports & Dashboard" ? (
                ["admin", "maintenance_supervisor"].includes(employee.role) ? (
                  <Link href="/reports"
                    className="mt-5 inline-block font-semibold text-blue-700 hover:underline">
                    Open maintenance reports →
                  </Link>
                ) : (
                  <span className="mt-5 inline-block text-sm text-slate-500">
                    Available to Admin and Maintenance Supervisor
                  </span>
                )
              ) : feature.title === "Employee Management" ? (
                <Link
                  href="/admin/employees"
                  className="mt-5 inline-block font-semibold text-blue-700 hover:underline"
                >
                  Manage employees →
                </Link>
              ) : (
                feature.title === "Maintenance Requests" ? (
                <Link
                  href="/#latest-requests"
                  className="mt-5 inline-block font-semibold text-blue-700 hover:underline"
                >
                  View requests →
                </Link>
              ) : (
                <span className="mt-5 inline-block text-sm text-slate-500">
                  Coming soon
                </span>
              )
              )}
            </div>
          ))}
        </section>

        
        <section className="mt-8 overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h2 id="latest-requests" className="scroll-mt-6 text-xl font-bold text-slate-900">
              Latest Maintenance Requests
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Latest 10 requests visible under your account permissions.
              Refresh this page to update.
            </p>
          </div>

          {requestLoadError && (
            <p role="alert" className="p-6 text-red-700">
              Some request data could not be loaded. Please refresh or contact
              your administrator.
            </p>
          )}

          {!recentResult.error && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="p-4">MRF No.</th>
                    <th className="p-4">Machine</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Submitted — Malaysia time</th>
                  </tr>
                </thead>
                <tbody>
                  {(recentResult.data ?? []).map((request) => (
                    <tr key={request.id} className="border-t border-slate-100">
                      <td className="p-4 font-semibold">{request.mrf_number}</td>
                      <td className="p-4">{request.machine_name}</td>
                      <td className="p-4">{request.department}</td>
                      <td className="p-4 capitalize">
                        {request.status.replaceAll("_", " ")}
                      </td>
                      <td className="p-4">
                        {new Date(request.submitted_at).toLocaleString("en-MY", {
                          timeZone: "Asia/Kuala_Lumpur",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recentResult.data?.length === 0 && (
                <p className="p-6 text-slate-500">
                  No requests are visible under your account permissions.
                </p>
              )}
            </div>
          )}
        </section>

<footer className="mt-12 text-center text-sm text-slate-500">
          © 2026 NM PACKAGING (M) SDN. BHD.
        </footer>
      </div>
    </main>
  );
}

// Suspense allows Next.js to wait for the authentication check
// instead of attempting to prerender it.
export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          <p className="text-slate-600">
            Checking employee login...
          </p>
        </main>
      }
    >
      <ProtectedDashboard />
    </Suspense>
  );
}