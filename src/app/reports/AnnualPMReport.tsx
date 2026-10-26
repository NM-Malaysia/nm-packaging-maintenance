import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import type { Language } from "@/utils/language";
import { dashboardText } from "@/utils/dashboardTranslations";

type Query = Record<string, string | string[] | undefined>;
type Category = "upcoming" | "due_today" | "overdue" | "awaiting_closure" | "closed";
type Report = {
  generated_at: string;
  total_matching: number;
  summary: {
    total: number;
    has_plan: boolean;
    upcoming: number;
    due_today: number;
    overdue: number;
    awaiting_closure: number;
    closed: number;
  };
  rows: {
    occurrence_id: string;
    planned_date: string;
    activity_title: string;
    machine_code: string;
    machine_name: string;
    request_id: string | null;
    mrf_number: string | null;
    mrf_status: string | null;
    verified_at: string | null;
    closed_at: string | null;
    category: Category;
    overdue_days: number;
    can_open_mrf: boolean;
  }[];
};
const words: Record<string, [string, string, string]> = {
  "Annual PM report": ["Laporan PM tahunan", "年度保养报告", "वार्षिक PM प्रतिवेदन"],
  "Plan year": ["Tahun pelan", "计划年份", "योजना वर्ष"],
  "PM status": ["Status PM", "保养状态", "PM स्थिति"],
  "All": ["Semua", "全部", "सबै"],
  "Upcoming": ["Akan datang", "未到期", "आगामी"],
  "Due today": ["Perlu hari ini", "今日到期", "आज देय"],
  "Overdue": ["Lewat tempoh", "已逾期", "म्याद नाघेको"],
  "Awaiting closure": ["Menunggu penutupan", "待关闭", "बन्द गर्न बाँकी"],
  "Closed": ["Ditutup", "已关闭", "बन्द"],
  "Show PM report": ["Papar laporan PM", "显示保养报告", "PM प्रतिवेदन देखाउनुहोस्"],
  "Open Master Plan": ["Buka Pelan Induk", "打开总计划", "मुख्य योजना खोल्नुहोस्"],
  "Equipment / Facility": ["Peralatan / Kemudahan", "设备 / 设施", "उपकरण / सुविधा"],
  "PM activity": ["Aktiviti PM", "保养活动", "PM गतिविधि"],
  "Planned date": ["Tarikh dirancang", "计划日期", "योजनाबद्ध मिति"],
  "Verified PM completion": ["Penyiapan PM disahkan", "保养完成确认", "प्रमाणित PM सम्पन्न"],
  "Closure date": ["Tarikh penutupan", "关闭日期", "बन्द मिति"],
  "Overdue days": ["Hari lewat tempoh", "逾期天数", "म्याद नाघेका दिन"],
  "Not issued": ["Belum dikeluarkan", "尚未签发", "जारी भएको छैन"],
  "Matching PM jobs": ["Kerja PM sepadan", "符合条件的保养工作", "मिल्ने PM काम"],
  "Planned PM jobs": ["Kerja PM dirancang", "计划保养次数", "योजनाबद्ध PM काम"],
  "No matching PM jobs.": ["Tiada kerja PM sepadan.", "暂无符合条件的保养工作。", "मिल्ने PM काम छैन।"],
  "No Master Plan exists for this year.": [
    "Tiada Pelan Induk untuk tahun ini.", "此年份尚未建立总计划。", "यस वर्षको मुख्य योजना छैन।"
  ],
  "PM report could not be loaded. Please refresh.": [
    "Laporan PM tidak dapat dimuatkan. Sila muat semula.",
    "无法加载保养报告。请刷新。",
    "PM प्रतिवेदन लोड भएन। कृपया रिफ्रेस गर्नुहोस्।"
  ],
  "Previous": ["Sebelumnya", "上一页", "अघिल्लो"],
  "Next": ["Seterusnya", "下一页", "अर्को"],
  "Page": ["Halaman", "页", "पृष्ठ"],
  "Malaysia time": ["Waktu Malaysia", "马来西亚时间", "मलेसिया समय"],
  "Filters use the PM plan year, independently of the MRF submission-date filters below. Overdue means the planned date has passed without verified completion.": [
    "Penapis menggunakan tahun pelan PM, berasingan daripada penapis tarikh penghantaran MRF di bawah. Lewat tempoh bermaksud tarikh dirancang telah berlalu tanpa penyiapan disahkan.",
    "本报告按保养计划年份筛选，与下方 MRF 提交日期筛选独立。逾期表示计划日期已过，但完成尚未确认。",
    "फिल्टर PM योजना वर्षमा आधारित छ र तलको MRF पठाइएको मितिको फिल्टरबाट स्वतन्त्र छ। योजनाबद्ध मिति बितेर पनि सम्पन्न प्रमाणित नभए म्याद नाघेको मानिन्छ।"
  ]
};

export default async function AnnualPMReport({
  language, query,
}: { language: Language; query: Query }) {
  const index = { ms: 0, zh: 1, ne: 2 };
  const t = (text: string) => language === "en"
    ? text : words[text]?.[index[language]] ?? dashboardText(language, text);
  const value = (key: string) => typeof query[key] === "string" ? query[key] as string : "";
  const currentYear = Number(new Intl.DateTimeFormat("en-MY", {
    year: "numeric", timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date()));
  const rawYear = Number(value("pm_year"));
  const year = Number.isInteger(rawYear) && rawYear >= 2020 && rawYear <= 2100
    ? rawYear : currentYear;
  const options = [
    ["all", "All"], ["upcoming", "Upcoming"], ["due_today", "Due today"],
    ["overdue", "Overdue"], ["awaiting_closure", "Awaiting closure"], ["closed", "Closed"],
  ] as const;
  const rawFilter = value("pm_filter");
  const filter = options.some(([key]) => key === rawFilter) ? rawFilter : "all";
  const rawPage = Number(value("pm_page"));
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 && rawPage <= 100000 ? rawPage : 1;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("annual_pm_report", {
    p_year: year, p_filter: filter, p_page: page,
  });
  const report = data as Report | null;
  const pages = Math.max(1, Math.ceil((report?.total_matching ?? 0) / 50));
  const colour = (category: string) =>
    category === "overdue" ? "border-red-300 bg-red-50 text-red-900"
      : category === "closed" ? "border-green-200 bg-green-50 text-green-900"
      : ["due_today", "awaiting_closure"].includes(category)
      ? "border-amber-300 bg-amber-50 text-amber-900"
      : "border-blue-200 bg-blue-50 text-blue-900";
  const label = (category: string) => t(options.find(([key]) => key === category)?.[1] ?? category);
  const time = (date: string | null) => date
    ? new Date(date).toLocaleString(language === "en" ? "en-MY" : language, {
        timeZone: "Asia/Kuala_Lumpur",
      }) : "—";
  function href(target: number, targetFilter = filter) {
    const params = new URLSearchParams({
      pm_year: String(year), pm_filter: targetFilter, pm_page: String(target),
    });
    for (const key of ["from", "to"]) {
      if (value(key)) params.set(key, value(key));
    }
    return "/reports?" + params.toString() + "#annual-pm-report";
  }

  return (
    <section id="annual-pm-report" className="mt-6 rounded-xl border bg-white p-5">
      <div className="flex flex-wrap justify-between gap-3">
        <h2 className="text-2xl font-bold">{t("Annual PM report")}</h2>
        <Link href={`/preventive-maintenance/master-plan?year=${year}`}
          className="font-semibold text-blue-700 underline">{t("Open Master Plan")} →</Link>
      </div>
      <p className="mt-3 text-sm text-slate-600">
        {t("Filters use the PM plan year, independently of the MRF submission-date filters below. Overdue means the planned date has passed without verified completion.")}
      </p>
      <form action="/reports#annual-pm-report"
        className="mt-4 flex flex-wrap items-end gap-4">
        {["from", "to"].map(key => value(key)
          ? <input key={key} type="hidden" name={key} value={value(key)} /> : null)}
        <label className="text-sm font-medium">
          {t("Plan year")}
          <input key={year} name="pm_year" type="number" min={2020} max={2100}
            required defaultValue={year} className="mt-2 block w-32 rounded-lg border p-3" />
        </label>
        <label className="text-sm font-medium">
          {t("PM status")}
          <select key={filter} name="pm_filter" defaultValue={filter}
            className="mt-2 block rounded-lg border bg-white p-3">
            {options.map(([key, name]) => <option key={key} value={key}>{t(name)}</option>)}
          </select>
        </label>
        <button className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white">
          {t("Show PM report")}
        </button>
      </form>
      {error || !report ? <p role="alert" className="mt-5 text-red-700">
        {t("PM report could not be loaded. Please refresh.")}
      </p> : <>
        {!report.summary.has_plan && <p className="mt-4">{t("No Master Plan exists for this year.")}</p>}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {options.filter(([key]) => key !== "all").map(([key, name]) =>
            <Link key={key} href={href(1, key)}
              className={`rounded-lg border p-4 hover:underline ${colour(key)}`}>
              <span className="text-sm font-medium">{t(name)}</span>
              <strong className="mt-2 block text-2xl">
                {report.summary[key as Category]}
              </strong>
            </Link>
          )}
        </div>
        <p className="mt-4 text-sm text-slate-600">
          {t("Planned PM jobs")}: {report.summary.total}
          {" · "}{t("Matching PM jobs")}: {report.total_matching}
          {" · "}{time(report.generated_at)} ({t("Malaysia time")})
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-slate-100">
              <tr>{["Equipment / Facility", "PM activity", "Planned date", "PM status",
                "MRF", "Verified PM completion", "Closure date", "Overdue days"].map(name =>
                <th key={name} className="p-3">{t(name)}</th>)}</tr>
            </thead>
            <tbody>
              {report.rows.map(row => <tr key={row.occurrence_id}
                className={`border-t ${colour(row.category)}`}>
                <td className="p-3 font-medium">{row.machine_code} · {row.machine_name}</td>
                <td className="p-3">
                  <Link href={`/preventive-maintenance/master-plan/assign/${row.occurrence_id}`}
                    className="font-semibold text-blue-800 underline">{row.activity_title}</Link>
                </td>
                <td className="p-3 whitespace-nowrap">{row.planned_date}</td>
                <td className="p-3 font-semibold">{label(row.category)}</td>
                <td className="p-3">
                  {row.request_id && row.mrf_number ? <>
                    {row.can_open_mrf
                      ? <Link href={`/maintenance/${row.request_id}`}
                          className="font-semibold text-blue-800 underline">{row.mrf_number}</Link>
                      : <span>{row.mrf_number}</span>}
                    <p className="mt-1 text-xs">{t((row.mrf_status ?? "").replaceAll("_", " "))}</p>
                  </> : t("Not issued")}
                </td>
                <td className="p-3">{time(row.verified_at)}</td>
                <td className="p-3">{time(row.closed_at)}</td>
                <td className="p-3 font-semibold">{row.overdue_days || "—"}</td>
              </tr>)}
              {!report.rows.length && <tr><td colSpan={8} className="p-5">
                {t("No matching PM jobs.")}
              </td></tr>}
            </tbody>
          </table>
        </div>
        <nav className="mt-5 flex justify-between gap-3 text-sm">
          {page > 1 ? <Link href={href(Math.min(page - 1, pages))}
            className="text-blue-700">← {t("Previous")}</Link> : <span />}
          <span>{t("Page")} {page} / {pages}</span>
          {page < pages ? <Link href={href(page + 1)}
            className="text-blue-700">{t("Next")} →</Link> : <span />}
        </nav>
      </>}
    </section>
  );
}
