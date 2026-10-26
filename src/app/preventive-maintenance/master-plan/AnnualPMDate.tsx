import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import type { Language } from "@/utils/language";
import { dashboardText } from "@/utils/dashboardTranslations";

type LinkedMRF = {
  id: string;
  pm_occurrence_id: string;
  mrf_number: string;
  status: string;
  closed_at: string | null;
};
type Repair = {
  request_id: string;
  repair_reviewed_at: string | null;
};
type Progress = {
  requestId: string;
  mrf: string;
  status: string;
  verifiedAt: string | null;
  closedAt: string | null;
};

function batches(values: string[]) {
  const result: string[][] = [];
  for (let i = 0; i < values.length; i += 100) {
    result.push(values.slice(i, i + 100));
  }
  return result;
}

export async function loadPMProgress(occurrenceIds: string[]): Promise<{
  items: Map<string, Progress>;
  error: boolean;
}> {
  const items = new Map<string, Progress>();
  if (!occurrenceIds.length) return { items, error: false };
  const supabase = await createClient();

  // At most one non-rejected MRF per occurrence.
  // Use small batches to keep request URLs manageable.
  const requests = await Promise.all(
    batches(occurrenceIds).map(ids =>
      supabase.from("maintenance_requests")
        .select("id,pm_occurrence_id,mrf_number,status,closed_at")
        .in("pm_occurrence_id", ids)
        .neq("status", "rejected")
        .order("id").range(0, 99)
    )
  );
  if (requests.some(result => result.error)) return { items, error: true };
  const mrfs = requests.flatMap(result => result.data ?? []) as LinkedMRF[];

  const repairs = await Promise.all(
    batches(mrfs.map(mrf => mrf.id)).map(ids =>
      supabase.from("repair_records")
        .select("request_id,repair_reviewed_at")
        .in("request_id", ids).order("request_id").range(0, 99)
    )
  );
  if (repairs.some(result => result.error)) return { items, error: true };
  const repairRows = repairs.flatMap(result => result.data ?? []) as Repair[];
  const verified = new Map(repairRows.map(row =>
    [row.request_id, row.repair_reviewed_at]
  ));

  for (const mrf of mrfs) {
    items.set(mrf.pm_occurrence_id, {
      requestId: mrf.id,
      mrf: mrf.mrf_number,
      status: mrf.status,
      verifiedAt: verified.get(mrf.id) ?? null,
      closedAt: mrf.closed_at,
    });
  }
  return { items, error: false };
}

const words: Record<string, [string, string, string]> = {
  "Overdue PM": ["PM lewat tempoh", "保养已逾期", "PM म्याद नाघेको"],
  "PM due today": ["PM perlu hari ini", "保养今日到期", "PM आज देय"],
  "Awaiting closure": ["Menunggu penutupan", "待关闭", "बन्द गर्न बाँकी"],

  "Planned": ["Dirancang", "计划", "योजना"],
  "Verified PM completion": ["Penyiapan PM disahkan", "保养完成确认", "प्रमाणित PM सम्पन्न"],
  "Closed": ["Ditutup", "关闭", "बन्द"],
  "Not recorded": ["Belum direkodkan", "尚未记录", "अभिलेख छैन"],
  "No linked MRF visible": ["Tiada MRF berkaitan kelihatan", "暂无可见的关联 MRF", "सम्बन्धित MRF देखिँदैन"],
  "Progress unavailable": ["Kemajuan tidak tersedia", "无法加载进度", "प्रगति उपलब्ध छैन"],
  "Malaysia time": ["Waktu Malaysia", "马来西亚时间", "मलेसिया समय"],
  "Open planned PM details": ["Buka butiran PM dirancang", "打开计划保养详情", "योजनाबद्ध PM विवरण खोल्नुहोस्"]
};

export default function AnnualPMDate({
  occurrenceId, plannedDate, page, language, progress, unavailable,
}: {
  occurrenceId: string;
  plannedDate: string;
  page: number;
  language: Language;
  progress?: Progress;
  unavailable: boolean;
}) {
  const index = { ms: 0, zh: 1, ne: 2 };
  const t = (text: string) => language === "en"
    ? text : words[text]?.[index[language]] ?? dashboardText(language, text);
  const time = (value: string) => new Date(value).toLocaleString(
    language === "en" ? "en-MY" : language,
    {
      timeZone: "Asia/Kuala_Lumpur",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit"
    }
  );
  const closed = progress?.status === "closed";
  const verified = Boolean(progress?.verifiedAt);
  const parts = new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) =>
    parts.find(item => item.type === type)?.value ?? "";
  const today = `${part("year")}-${part("month")}-${part("day")}`;
  const overdue = !unavailable && !closed && !verified && plannedDate < today;
  const dueToday = !unavailable && !closed && !verified && plannedDate === today;
  const colour = unavailable
    ? "border-slate-300 bg-slate-50"
    : closed ? "border-green-200 bg-green-50"
    : verified || dueToday ? "border-amber-300 bg-amber-50"
    : overdue ? "border-red-300 bg-red-50"
    : "border-blue-200 bg-blue-50";

  return (
    <div className={`mb-2 min-w-36 rounded-lg border p-3 text-left ${colour}`}>
      <Link href={`/preventive-maintenance/master-plan/assign/${occurrenceId}?page=${page}`}
        title={t("Open planned PM details")}
        className="block font-semibold text-blue-800 underline hover:text-blue-600">
        {t("Planned")}: {plannedDate}
      </Link>
      {!unavailable && (overdue || dueToday || (verified && !closed)) && (
        <p className={`mt-2 text-xs font-bold ${overdue ? "text-red-800" : "text-amber-900"}`}>
          {t(overdue ? "Overdue PM" : dueToday ? "PM due today" : "Awaiting closure")}
        </p>
      )}
      {unavailable ? <p role="alert" className="mt-2 text-xs text-red-700">
        {t("Progress unavailable")}
      </p> : progress ? (
        <div className="mt-2 space-y-2 text-xs">
          <p className="font-semibold">MRF {progress.mrf}</p>
          <p className="font-medium">{t(progress.status.replaceAll("_", " "))}</p>
          {(verified || closed) && <p>
            {t("Verified PM completion")}:<br />
            {progress.verifiedAt ? time(progress.verifiedAt) : t("Not recorded")}
          </p>}
          {closed && <p>
            {t("Closed")}:<br />
            {progress.closedAt ? time(progress.closedAt) : t("Not recorded")}
          </p>}
          {(verified || closed) && <p className="text-slate-500">
            {t("Malaysia time")}
          </p>}
        </div>
      ) : <p className="mt-2 text-xs text-slate-600">
        {t("No linked MRF visible")}
      </p>}
    </div>
  );
}
