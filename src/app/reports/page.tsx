import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

type Query = Record<string, string | string[] | undefined>;
type Report = {
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
  const field = "mt-2 block w-full rounded-lg border border-slate-300 bg-white p-3";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <Link href="/" className="text-blue-700 hover:underline">← Dashboard</Link>
        <h1 className="mt-5 text-3xl font-bold">Maintenance Reports</h1>
        <p className="mt-2 text-slate-600">
          {employee.full_name} · Maintenance performance overview
        </p>

        <form action="/reports" method="get"
          className="mt-6 grid gap-4 rounded-xl border bg-white p-5 sm:grid-cols-3">
          <label className="text-sm font-medium">
            MRF submitted from — Malaysia date
            <input type="date" name="from"
              defaultValue={validDate(from) ? from : ""} className={field} />
          </label>
          <label className="text-sm font-medium">
            MRF submitted to — Malaysia date
            <input type="date" name="to"
              defaultValue={validDate(to) ? to : ""} className={field} />
          </label>
          <div className="flex items-end gap-4">
            <button className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white">
              Apply dates
            </button>
            <Link href="/reports" className="py-3 text-blue-700">All dates</Link>
          </div>
        </form>

        <p className="mt-3 text-sm text-slate-600">
          {from || to
            ? `MRFs submitted ${from || "from the beginning"} to ${to || "the latest date"}.`
            : "All submission dates."}
          {" "}Shows their current status and all linked recorded work,
          including work performed outside the submission date range.
        </p>

        {invalid ? (
          <p role="alert" className="mt-5 rounded-xl bg-white p-5 text-red-700">
            Enter valid dates. The start date must not exceed the end date.
          </p>
        ) : result?.error || !report ? (
          <p role="alert" className="mt-5 rounded-xl bg-white p-5 text-red-700">
            Reports could not be loaded. Refresh and try again.
          </p>
        ) : (
          <>
            <p className="mt-4 text-sm text-slate-500">
              Updated: {new Date(report.generated_at).toLocaleString(
                "en-MY", { timeZone: "Asia/Kuala_Lumpur" }
              )} (Malaysia time). Refresh to update.
            </p>

            {report.summary.total === 0 && (
              <p className="mt-5 rounded-xl bg-white p-5">
                No MRFs match these submission dates.
              </p>
            )}

            <section aria-label="Report totals"
              className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Total MRFs", value: String(report.summary.total),
                  note: "All statuses in the selected submission dates" },
                { label: "Open MRFs", value: String(report.summary.open),
                  note: "Includes pending approvals and handovers" },
                { label: "Closed MRFs", value: String(report.summary.closed),
                  note: `${report.summary.rejected} rejected MRFs shown separately` },
                { label: "Recorded machine downtime",
                  value: decimal(report.summary.downtime_minutes, "min"),
                  note: `${report.summary.downtime_records} valid start/end records` },
                { label: "Average submission → repair",
                  value: decimal(report.summary.average_repair_hours, "h"),
                  note: `${report.summary.repair_records} valid repair-review timestamps` },
                { label: "Average submission → closure",
                  value: decimal(report.summary.average_closure_hours, "h"),
                  note: `${report.summary.closure_records} valid closed MRF timestamps` },
                { label: "Recorded staff working time",
                  value: decimal(report.summary.staff_work_hours, "h"),
                  note: "Personal and task sessions combined; pauses excluded" },
                { label: "Downtime awaiting valid end record",
                  value: String(report.summary.downtime_unresolved),
                  note: "Applicable MRFs with missing or invalid start/end times" },
              ].map(card => (
                <article key={card.label} className="rounded-xl border bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-medium text-slate-600">{card.label}</h2>
                  <p className="mt-3 text-2xl font-bold text-blue-900">{card.value}</p>
                  <p className="mt-2 text-xs text-slate-500">{card.note}</p>
                </article>
              ))}
            </section>

            <section className="mt-6 rounded-xl border bg-white p-5">
              <h2 className="text-xl font-bold">MRFs by current status</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {report.statuses.map(item => (
                  <div key={item.status}
                    className="flex justify-between gap-4 rounded-lg bg-slate-50 p-4">
                    <span>{statusLabels[item.status] ?? item.status.replaceAll("_", " ")}</span>
                    <strong>{item.count}</strong>
                  </div>
                ))}
                {!report.statuses.length && <p>No status records.</p>}
              </div>
            </section>

            <section className="mt-6 overflow-hidden rounded-xl border bg-white">
              <div className="p-5">
                <h2 className="text-xl font-bold">Staff working time</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Sums recorded sessions for the selected MRFs, including running
                  sessions up to the report time. Overlapping sessions are counted
                  separately; this is not attendance or payroll time.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-4">Employee</th>
                      <th className="p-4">Employee number</th>
                      <th className="p-4">Working hours</th>
                      <th className="p-4">Running sessions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.staff.map(person => (
                      <tr key={person.employee_id} className="border-t">
                        <td className="p-4 font-medium">{person.full_name}</td>
                        <td className="p-4">{person.employee_number}</td>
                        <td className="p-4">{decimal(person.work_hours, "h")}</td>
                        <td className="p-4">{person.running_sessions}</td>
                      </tr>
                    ))}
                    {!report.staff.length && (
                      <tr><td colSpan={4} className="p-6 text-slate-500">
                        No recorded work sessions for these MRFs.
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <p className="mt-5 text-sm text-slate-600">
              Lead times use elapsed calendar hours, including waiting and pauses.
              Missing or invalid timestamps are excluded from averages.
              Downtime totals sum individual MRF records and may overlap on the same
              machine; they are not plant availability. Each MRF currently records
              one downtime interval.
            </p>
          </>
        )}
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
