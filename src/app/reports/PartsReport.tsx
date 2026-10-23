import { getMyLanguage } from "@/utils/language";
import { partsReportText } from "@/utils/partsReportTranslations";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

type PartsReportData = {
  generated_at: string;
  summary: {
    total_records: number;
    pending_check: number;
    waiting: number;
    available: number;
    issued: number;
    cancelled: number;
    miv_pending: number;
    wait_samples: number;
    average_wait_hours: number | null;
    longest_wait_hours: number | null;
    defect_records: number;
  };
  frequency_groups: number;
  frequency: {
    machine_name: string;
    part_code: string;
    part_name: string;
    issue_records: number;
    mrf_count: number;
    issued_quantity: number;
  }[];
  history: {
    id: string;
    request_id: string;
    mrf_number: string;
    machine_name: string;
    part_code: string;
    part_name: string;
    quantity: number;
    status: string;
    needed_at: string;
    issued_at: string | null;
    miv_number: string;
    defect_details: string;
    wait_hours: number | null;
  }[];
};

function hours(value: number | null, t: (text: string) => string) {
  return value === null ? t("Not available")
    : `${Number(value).toLocaleString("en-MY", {
        minimumFractionDigits: 2, maximumFractionDigits: 2,
      })} ${t("h")}`;
}

function time(value: string) {
  return new Date(value).toLocaleString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
  });
}

export default async function PartsReport({
  from, to,
}: { from: string; to: string }) {
  const language = await getMyLanguage();
  const t = (text: string, values: Record<string, string | number> = {}) =>
    partsReportText(language, text, values);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("maintenance_parts_report", {
    p_from: from || null,
    p_to: to || null,
  });

  if (error || !data) {
    return (
      <section className="mt-6 rounded-xl border bg-white p-5">
        <h2 className="text-xl font-bold">{t("Parts follow-up report")}</h2>
        <p role="alert" className="mt-3 text-red-700">{t("Parts report could not be loaded. Refresh and try again.")}</p>
      </section>
    );
  }

  const report = data as PartsReportData;
  const summary = report.summary;

  return (
    <section className="mt-8 space-y-5 text-slate-900">
      <div>
        <h2 className="text-2xl font-bold">{t("Parts follow-up report")}</h2>
        <p className="mt-2 text-sm text-slate-600">
          {t("Uses the MRF submission dates selected above and includes all linked part records, even when their events fall outside that date range. Updated: {updated} (Malaysia time).", { updated: time(report.generated_at) })}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Part records", String(summary.total_records)],
          ["Pending clerk check", String(summary.pending_check)],
          ["Waiting", String(summary.waiting)],
          ["Available to issue", String(summary.available)],
          ["Issued records", String(summary.issued)],
          ["MIV pending", String(summary.miv_pending)],
          ["Average recorded wait", hours(summary.average_wait_hours, t)],
          ["Longest recorded wait", hours(summary.longest_wait_hours, t)],
        ].map(([label, value]) => (
          <article key={label} className="rounded-xl border bg-white p-5 shadow-sm">
            <h3 className="text-sm font-medium text-slate-600">{t(label)}</h3>
            <p className="mt-3 text-2xl font-bold text-blue-900">{value}</p>
          </article>
        ))}
      </div>

      <p className="text-sm text-slate-600">
        {t("Waiting time = Part needed → Available. {samples} valid records contribute to the waiting figures. Cancelled and still-waiting records are excluded from these averages. {cancelled} cancelled record(s) are retained in the total count. MIV Pending is a subset of Issued.", { samples: summary.wait_samples, cancelled: summary.cancelled })}</p>

      <section className="overflow-hidden rounded-xl border bg-white">
        <div className="p-5">
          <h3 className="text-xl font-bold">{t("Issued parts by machine and part code")}</h3>
          <p className="mt-2 text-sm text-slate-600">
            {t("Showing {shown} of {groups} groups, ranked by issue-record count, up to 50 groups. Quantities are summed within each machine/part-code group. Part name is a representative recorded label. Issued does not confirm installation or a recurring defect.", { shown: report.frequency.length, groups: report.frequency_groups })}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                {["Machine", "Part code / name", "Issue records", "Distinct MRFs", "Issued quantity"].map(label => (
                  <th key={label} className="p-4">{t(label)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.frequency.map(item => (
                <tr key={JSON.stringify([item.machine_name, item.part_code])}
                  className="border-t">
                  <td className="p-4 font-medium">{item.machine_name}</td>
                  <td className="p-4">
                    <p className="font-semibold">{item.part_code}</p>
                    <p className="mt-1 text-slate-600">{item.part_name}</p>
                  </td>
                  <td className="p-4">{item.issue_records}</td>
                  <td className="p-4">{item.mrf_count}</td>
                  <td className="p-4">{Number(item.issued_quantity).toLocaleString("en-MY")}</td>
                </tr>
              ))}
              {!report.frequency.length && (
                <tr><td colSpan={5} className="p-5 text-slate-500">{t("No issued parts for these MRFs.")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5">
        <h3 className="text-xl font-bold">{t("Defect / replacement reason history")}</h3>
        <p className="mt-2 text-sm text-slate-600">
          {t("Showing the latest {shown} of {total} non-cancelled records with a recorded reason, up to 100. Compare reasons and repair findings to investigate repeat problems. All displayed times are Malaysia time.", { shown: report.history.length, total: summary.defect_records })}</p>
        <div className="mt-4 space-y-3">
          {report.history.map(item => (
            <article key={item.id} className="rounded-lg border bg-slate-50 p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <Link href={`/maintenance/${item.request_id}`}
                  className="font-semibold text-blue-700 hover:underline">
                  MRF {item.mrf_number} · {item.machine_name} →
                </Link>
                <span className="text-sm capitalize">
                  {t(item.status.replaceAll("_", " "))}
                </span>
              </div>
              <p className="mt-2 font-medium">
                {item.part_code || t("Code not confirmed")} · {item.part_name}
              </p>
              <p className="mt-1 text-sm">{t("Quantity:")} {item.quantity}</p>
              <p className="mt-2 whitespace-pre-wrap">{item.defect_details}</p>
              <p className="mt-3 text-sm text-slate-600">
                {t("Needed:")} {time(item.needed_at)}
                {" · "}{t("Recorded wait:")}{" "}{hours(item.wait_hours, t)}
              </p>
              {item.issued_at && (
                <p className="mt-1 text-sm text-slate-600">
                  {t("Issued:")} {time(item.issued_at)}
                  {" · "}{item.miv_number
                    ? `MIV: ${item.miv_number}` : t("MIV Pending")}
                </p>
              )}
            </article>
          ))}
          {!report.history.length && (
            <p className="text-sm text-slate-500">{t("No recorded part reasons for these MRFs.")}</p>
          )}
        </div>
      </section>
    </section>
  );
}
