import DashboardNavigation from "../DashboardNavigation";
import { getMyLanguage } from "@/utils/language";
import { reportText } from "@/utils/reportTranslations";
import PartsReport from "./PartsReport";
import EquipmentReport, { type EquipmentBreakdownData } from "./EquipmentReport";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

type Query = Record<string, string | string[] | undefined>;
type Report = EquipmentBreakdownData & {
  generated_at: string;
  summary: {
    total: number;
    open: number;
    closed: number;
    rejected: number;
    downtime_minutes: number;
    downtime_records: number;
    downtime_unresolved: number;
    average_repair_hours: number | null;
    repair_records: number;
    average_closure_hours: number | null;
    closure_records: number;
    staff_work_hours: number;
  };
  statuses: { status: string; count: number }[];
  staff: {
    employee_id: string;
    employee_number: string;
    full_name: string;
    running_sessions: number;
    work_hours: number;
  }[];
};

const statusLabels: Record<string, string> = {
  submitted: "Awaiting HOD approval",
  hod_approved: "Ready to Start",
  in_progress: "In Progress",
  waiting_spare_parts: "Waiting for Parts",
  follow_up_required: "Follow-up Required",
  repair_completed: "Repair Completed",
  handover_pending: "Handover Pending",
  closed: "Closed",
  rejected: "Rejected",
};

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + "T00:00:00Z");
  return Number.isFinite(parsed.getTime())
    && parsed.toISOString().slice(0, 10) === value;
}

function decimal(value: number | null, unit: string) {
  return value === null ? "Unavailable"
    : Number(value).toLocaleString("en-MY", {
        minimumFractionDigits: 2, maximumFractionDigits: 2,
      }) + " " + unit;
}

async function Reports({ searchParams }: { searchParams: Promise<Query> }) {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("full_name, role, is_active, must_change_password")
    .eq("id", user.id).maybeSingle();

  if (employeeError || !employee?.is_active) {
    redirect("/login?error=access_denied");
  }
  if (employee.must_change_password) redirect("/change-password");
  if (!["admin", "maintenance_supervisor"].includes(employee.role)) {
    redirect("/");
  }

  const language = await getMyLanguage();
  const t = (text: string, values: Record<string, string | number> = {}) =>
    reportText(language, text, values);
  const displayDecimal = (value: number | null, unit: string) =>
    value === null ? t("Unavailable") : decimal(value, t(unit));

  const raw = await searchParams;
  const value = (key: string) => typeof raw[key] === "string"
    ? raw[key] as string : "";
  const from = value("from");
  const to = value("to");
  const invalid = Boolean(
    (from && !validDate(from)) || (to && !validDate(to))
    || (from && to && from > to)
  );

  const result = invalid ? null : await supabase.rpc("maintenance_report", {
    p_from: from || null,
    p_to: to || null,
  });
  const report = result?.data as Report | null;
  const field = "mt-2 block min-w-0 w-full max-w-full box-border appearance-none rounded-lg border border-slate-300 bg-white p-3 text-base [&::-webkit-date-and-time-value]:text-left";

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <DashboardNavigation name={employee.full_name} role={employee.role} />
      <div className="px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <Link href="/" className="text-blue-700 hover:underline">{t("← Dashboard")}</Link>
        <h1 className="mt-5 text-3xl font-bold">{t("Maintenance Reports")}</h1>
        <p className="mt-2 text-slate-600">
          {employee.full_name} · {t("Maintenance performance overview")}
        </p>

        <form action="/reports" method="get"
          className="mt-6 grid gap-4 rounded-xl border bg-white p-5 sm:grid-cols-3">
          <label className="min-w-0 text-sm font-medium">{t("MRF submitted from — Malaysia date")}<input type="date" name="from"
              defaultValue={validDate(from) ? from : ""} className={field} />
          </label>
          <label className="min-w-0 text-sm font-medium">{t("MRF submitted to — Malaysia date")}<input type="date" name="to"
              defaultValue={validDate(to) ? to : ""} className={field} />
          </label>
          <div className="flex items-end gap-4">
            <button className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white">{t("Apply dates")}</button>
            <Link href="/reports" className="py-3 text-blue-700">{t("All dates")}</Link>
          </div>
        </form>

        <p className="mt-3 text-sm text-slate-600">
          {from || to
            ? t("MRFs submitted {from} to {to}.", { from: from || t("from the beginning"), to: to || t("the latest date") })
            : t("All submission dates.")}
          {" "}{t("Shows their current status and all linked recorded work, including work performed outside the submission date range.")}
        </p>

        {invalid ? (
          <p role="alert" className="mt-5 rounded-xl bg-white p-5 text-red-700">{t("Enter valid dates. The start date must not exceed the end date.")}</p>
        ) : result?.error || !report ? (
          <p role="alert" className="mt-5 rounded-xl bg-white p-5 text-red-700">{t("Reports could not be loaded. Refresh and try again.")}</p>
        ) : (
          <>
            <p className="mt-4 text-sm text-slate-500">
              {t("Updated:")} {new Date(report.generated_at).toLocaleString(
                "en-MY", { timeZone: "Asia/Kuala_Lumpur" }
              )} ({t("Malaysia time")}). {t("Refresh to update.")}
            </p>

            {report.summary.total === 0 && (
              <p className="mt-5 rounded-xl bg-white p-5">{t("No MRFs match these submission dates.")}</p>
            )}

            <section aria-label={t("Report totals")}
              className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Total MRFs", value: String(report.summary.total),
                  note: "All statuses in the selected submission dates" },
                { label: "Open MRFs", value: String(report.summary.open),
                  note: "Includes pending approvals and handovers" },
                { label: "Closed MRFs", value: String(report.summary.closed),
                  note: t("{count} rejected MRFs shown separately", { count: report.summary.rejected }) },
                { label: "Recorded machine downtime",
                  value: displayDecimal(report.summary.downtime_minutes, "min"),
                  note: t("{count} valid start/end records", { count: report.summary.downtime_records }) },
                { label: "Average submission → repair",
                  value: displayDecimal(report.summary.average_repair_hours, "h"),
                  note: t("{count} valid repair-review timestamps", { count: report.summary.repair_records }) },
                { label: "Average submission → closure",
                  value: displayDecimal(report.summary.average_closure_hours, "h"),
                  note: t("{count} valid closed MRF timestamps", { count: report.summary.closure_records }) },
                { label: "Recorded staff working time",
                  value: displayDecimal(report.summary.staff_work_hours, "h"),
                  note: "Personal and task sessions combined; pauses excluded" },
                { label: "Downtime awaiting valid end record",
                  value: String(report.summary.downtime_unresolved),
                  note: "Applicable MRFs with missing or invalid start/end times" },
              ].map(card => (
                <article key={card.label} className="rounded-xl border bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-medium text-slate-600">{t(card.label)}</h2>
                  <p className="mt-3 text-2xl font-bold text-blue-900">{card.value}</p>
                  <p className="mt-2 text-xs text-slate-500">{t(card.note)}</p>
                </article>
              ))}
            </section>

            <section className="mt-6 rounded-xl border bg-white p-5">
              <h2 className="text-xl font-bold">{t("MRFs by current status")}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {report.statuses.map(item => (
                  <div key={item.status}
                    className="flex justify-between gap-4 rounded-lg bg-slate-50 p-4">
                    <span>{t(statusLabels[item.status] ?? item.status.replaceAll("_", " "))}</span>
                    <strong>{item.count}</strong>
                  </div>
                ))}
                {!report.statuses.length && <p>{t("No status records.")}</p>}
              </div>
            </section>

            <section className="mt-6 overflow-hidden rounded-xl border bg-white">
              <div className="p-5">
                <h2 className="text-xl font-bold">{t("Staff working time")}</h2>
                <p className="mt-2 text-sm text-slate-600">{t("Sums recorded sessions for the selected MRFs, including running sessions up to the report time. Overlapping sessions are counted separately; this is not attendance or payroll time.")}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-4">{t("Employee")}</th>
                      <th className="p-4">{t("Employee number")}</th>
                      <th className="p-4">{t("Working hours")}</th>
                      <th className="p-4">{t("Running sessions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.staff.map(person => (
                      <tr key={person.employee_id} className="border-t">
                        <td className="p-4 font-medium">{person.full_name}</td>
                        <td className="p-4">{person.employee_number}</td>
                        <td className="p-4">{displayDecimal(person.work_hours, "h")}</td>
                        <td className="p-4">{person.running_sessions}</td>
                      </tr>
                    ))}
                    {!report.staff.length && (
                      <tr><td colSpan={4} className="p-6 text-slate-500">{t("No recorded work sessions for these MRFs.")}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <EquipmentReport report={report} language={language} />
            <PartsReport from={from} to={to} />

            <p className="mt-5 text-sm text-slate-600">{t("Lead times use elapsed calendar hours, including waiting and pauses. Missing or invalid timestamps are excluded from averages. Downtime totals sum individual MRF records and may overlap on the same machine; they are not plant availability. Each MRF currently records one downtime interval.")}</p>
          </>
        )}
      </div>
      </div>
    </main>
  );
}

export default function Page({ searchParams }: { searchParams: Promise<Query> }) {
  return (
    <Suspense fallback={<p className="p-8">Loading maintenance reports...</p>}>
      <Reports searchParams={searchParams} />
    </Suspense>
  );
}
