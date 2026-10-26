import PMDashboardSummary from "./PMDashboardSummary";
import { getMyLanguage } from "@/utils/language";
import { dashboardText } from "@/utils/dashboardTranslations";
import MyActions from "./MyActions";

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
      "View equipment schedules, due dates, and assigned teams.",
  },
  {
    icon: "📦",
    title: "Parts Follow-up & MIV",
    description:
      "Track part requests, purchase follow-up, issue dates, and MIV records across MRFs.",
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
type DashboardQuery = { pm_year?: string | string[] };

async function ProtectedDashboard({
  searchParams,
}: { searchParams: Promise<DashboardQuery> }) {
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

const canManageParts = ["admin", "maintenance_clerk"].includes(employee.role);

const canSubmit = ["requestor", "department_hod"].includes(employee.role);
const canOpenMaintenance = [
  "admin", "maintenance_supervisor",
  "maintenance_technician", "maintenance_clerk",
].includes(employee.role);
const canReviewHod = ["department_hod", "admin"].includes(employee.role);


const summaryDefinitions = [
  {
    label: "Open MRFs",
    statuses: [
      "submitted", "hod_approved", "in_progress",
      "waiting_spare_parts", "follow_up_required",
      "repair_completed", "handover_pending",
    ],
  },
  { label: "In Progress", statuses: ["in_progress"] },
  { label: "Waiting for Spare Parts", statuses: ["waiting_spare_parts"] },
  { label: "Pending Repair Approval", statuses: ["repair_completed"] },
  { label: "Pending Handover", statuses: ["handover_pending"] },
  { label: "Closed MRFs", statuses: ["closed"] },
];

const [summaryResults, recentResult] = await Promise.all([
  Promise.all(summaryDefinitions.map((item) =>
    supabase.from("maintenance_requests")
      .select("id", { count: "exact", head: true })
      .in("status", item.statuses)
  )),
  supabase.from("maintenance_requests")
    .select("id, mrf_number, machine_name, department, status, submitted_at")
    .order("submitted_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(10),
]);

const language = await getMyLanguage();
const t = (text: string) => dashboardText(language, text);

const requestLoadError =
  summaryResults.some((result) => result.error || result.count === null)
  || recentResult.error;


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
              {t("Maintenance Management System")}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <section className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">
            {t("Maintenance Dashboard")}
          </h2>

          <p className="mt-2 text-slate-600">
            {t("Welcome to the NM PACKAGING maintenance portal.")}
          </p>
        </section>

        
        <MyActions compact />

        {canOpenMaintenance && (
          <PMDashboardSummary language={language}
            searchParams={searchParams} />
        )}

        {allowedRoles.includes(employee.role) && (
          <nav aria-label={t("Quick actions")}
            className="mb-8 grid gap-3 sm:max-w-4xl sm:grid-cols-2 lg:grid-cols-4">
            {canReviewHod && (
              <Link href="/approvals"
                className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-blue-700 px-5 py-3 text-center font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
                {t("HOD Approvals")} <span aria-hidden="true">→</span>
              </Link>
            )}
            {canOpenMaintenance && (
              <Link href="/maintenance"
                className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-blue-700 px-5 py-3 text-center font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
                {t("Maintenance Team")} <span aria-hidden="true">→</span>
              </Link>
            )}
            {canReviewHod && (
              <Link href="/repair-approvals"
                className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-blue-700 px-5 py-3 text-center font-semibold text-white transition hover:bg-blue-800">
                {t("Repair Approvals")} <span aria-hidden="true">→</span>
              </Link>
            )}
            <Link href="/handovers"
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-blue-700 px-5 py-3 text-center font-semibold text-white transition hover:bg-blue-800">
              {t("Handover")} <span aria-hidden="true">→</span>
            </Link>
          </nav>
        )}

        <section aria-label={t("MRF status summary")} className="mb-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {summaryDefinitions.map((item, index) => {
              const result = summaryResults[index];
              const unavailable = !result || result.error || result.count === null;
              return (
                <article key={item.label}
                  className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <h3 className="text-sm font-medium text-slate-600">
                    {t(item.label)}
                  </h3>
                  <p className="mt-3 break-words text-2xl font-bold text-slate-900 sm:text-3xl">
                    {unavailable ? t("Unavailable") : String(result.count)}
                  </p>
                </article>
              );
            })}
          </div>
          <p className="mt-3 text-sm text-slate-600">
            {t("Counts cover all MRFs visible to your account, with no date filter. Open includes submitted, HOD-approved, in-progress, waiting, follow-up, repair-completed and handover-pending requests. The stage counts overlap with Open. Refresh to update.")}
          </p>
        </section>

        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features
  .filter((feature) => {
  if (feature.title === "Preventive Maintenance") {
    return canOpenMaintenance;
  }
  if (feature.title === "Parts Follow-up & MIV") {
    return canManageParts;
  }

  if (employee.role === "admin") {
    return true;
  }

  if (employee.role === "maintenance_clerk") {
    return [
      "Maintenance Team",
      "Machine Register",
      "Parts Follow-up & MIV",
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
                {t(feature.title)}
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                {t(feature.description)}
              </p>

              {feature.title === "Maintenance Requests" && canSubmit ? (
                <Link
                  href="/requests/new"
                  className="mt-5 inline-block font-semibold text-blue-700 hover:underline"
                >
                  {t("+ New request \u2192")}
                </Link>
              ) : feature.title === "Maintenance Team" ? (
                canOpenMaintenance ? (
                  <Link href="/maintenance"
                    className="mt-5 inline-block font-semibold text-blue-700 hover:underline">
                    {t("Open maintenance jobs \u2192")}
                  </Link>
                ) : (
                  <span className="mt-5 inline-block text-sm text-slate-500">
                    {t("Available to maintenance staff")}
                  </span>
                )
              ) : feature.title === "Preventive Maintenance" ? (
                <Link href="/preventive-maintenance"
                  className="mt-5 inline-block font-semibold text-blue-700 hover:underline">
                  {t("Preventive Maintenance")} →
                </Link>
              ) : feature.title === "Parts Follow-up & MIV" ? (
                <Link href="/parts-followup"
                  className="mt-5 inline-block font-semibold text-blue-700 hover:underline">
                  {t("Open parts follow-up & MIV \u2192")}
                </Link>
              ) : feature.title === "Machine Register" ? (
                <Link href="/machines"
                  className="mt-5 inline-block font-semibold text-blue-700 hover:underline">
                  {t("Machine Register")} →
                </Link>
              ) : feature.title === "Reports & Dashboard" ? (
                ["admin", "maintenance_supervisor"].includes(employee.role) ? (
                  <Link href="/reports"
                    className="mt-5 inline-block font-semibold text-blue-700 hover:underline">
                    {t("Open maintenance reports \u2192")}
                  </Link>
                ) : (
                  <span className="mt-5 inline-block text-sm text-slate-500">
                    {t("Available to Admin and Maintenance Supervisor")}
                  </span>
                )
              ) : feature.title === "Employee Management" ? (
                <Link
                  href="/admin/employees"
                  className="mt-5 inline-block font-semibold text-blue-700 hover:underline"
                >
                  {t("Manage employees \u2192")}
                </Link>
              ) : (
                feature.title === "Maintenance Requests" ? (
                <Link
                  href="/#latest-requests"
                  className="mt-5 inline-block font-semibold text-blue-700 hover:underline"
                >
                  {t("View requests \u2192")}
                </Link>
              ) : (
                <span className="mt-5 inline-block text-sm text-slate-500">
                  {t("Coming soon")}
                </span>
              )
              )}
            </div>
          ))}
        </section>

        
        <section className="mt-8 overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h2 id="latest-requests" className="scroll-mt-6 text-xl font-bold text-slate-900">
              {t("Latest Maintenance Requests")}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {t("Latest 10 requests visible under your account permissions. Refresh this page to update.")}
            </p>
          </div>

          {requestLoadError && (
            <p role="alert" className="p-6 text-red-700">
              {t("Some request data could not be loaded. Please refresh or contact your administrator.")}
            </p>
          )}

          {!recentResult.error && (
            <div>
              <div className="divide-y divide-slate-200 text-slate-900 sm:hidden">
                {(recentResult.data ?? []).map((request) => (
                  <article key={request.id} className="space-y-3 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-bold text-blue-800">
                        MRF {request.mrf_number} · {request.machine_name}
                      </h3>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-800">
                        {t(request.status.replaceAll("_", " "))}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">{request.department}</p>
                    <p className="text-sm text-slate-600">
                      {t("Submitted")}: {new Date(request.submitted_at).toLocaleString(
                        "en-MY", { timeZone: "Asia/Kuala_Lumpur" }
                      )} ({t("Malaysia time")})
                    </p>
                  </article>
                ))}
              </div>
              <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-sm text-slate-900">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="p-4">{t("MRF No.")}</th>
                    <th className="p-4">{t("Machine")}</th>
                    <th className="p-4">{t("Department")}</th>
                    <th className="p-4">{t("Status")}</th>
                    <th className="p-4">{t("Submitted \u2014 Malaysia time")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(recentResult.data ?? []).map((request) => (
                    <tr key={request.id} className="border-t border-slate-100">
                      <td className="p-4 font-semibold">{request.mrf_number}</td>
                      <td className="p-4">{request.machine_name}</td>
                      <td className="p-4">{request.department}</td>
                      <td className="p-4 capitalize">
                        {t(request.status.replaceAll("_", " "))}
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
              </div>
              {recentResult.data?.length === 0 && (
                <p className="p-6 text-slate-500">
                  {t("No requests are visible under your account permissions.")}
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
export default function Home({
  searchParams,
}: { searchParams: Promise<DashboardQuery> }) {
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
      <ProtectedDashboard searchParams={searchParams} />
    </Suspense>
  );
}