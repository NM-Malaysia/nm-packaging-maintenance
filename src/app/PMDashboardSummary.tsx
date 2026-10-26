import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import type { Language } from "@/utils/language";

type Summary = {
  plan_year: number;
  as_of_date: string;
  has_plan: boolean;
  total: number;
  upcoming: number;
  due_today: number;
  overdue: number;
  awaiting_closure: number;
  closed: number;
};
const words: Record<string, [string, string, string]> = {
  "Annual PM summary": ["Ringkasan PM tahunan", "年度保养概况", "वार्षिक PM सारांश"],
  "Plan year": ["Tahun pelan", "计划年份", "योजना वर्ष"],
  "Show": ["Papar", "显示", "देखाउनुहोस्"],
  "Upcoming": ["Akan datang", "未到期", "आगामी"],
  "Due today": ["Perlu hari ini", "今日到期", "आज देय"],
  "Overdue": ["Lewat tempoh", "已逾期", "म्याद नाघेको"],
  "Awaiting closure": ["Menunggu penutupan", "待关闭", "बन्द गर्न बाँकी"],
  "Closed": ["Ditutup", "已关闭", "बन्द"],
  "Open annual Master Plan": ["Buka Pelan Induk tahunan", "打开年度总计划", "वार्षिक मुख्य योजना खोल्नुहोस्"],
  "No Master Plan exists for this year.": [
    "Tiada Pelan Induk untuk tahun ini.",
    "此年份尚未建立总计划。",
    "यस वर्षको मुख्य योजना छैन।"
  ],
  "PM summary could not be loaded. Please refresh.": [
    "Ringkasan PM tidak dapat dimuatkan. Sila muat semula.",
    "无法加载保养概况。请刷新。",
    "PM सारांश लोड भएन। कृपया रिफ्रेस गर्नुहोस्।"
  ],
  "Planned PM jobs": ["Kerja PM dirancang", "计划保养次数", "योजनाबद्ध PM काम"],
  "As of — Malaysia date": ["Setakat — tarikh Malaysia", "统计日期 — 马来西亚日期", "मलेसिया मितिअनुसार"],
  "Overdue means the planned date has passed without verified completion. Counts cover the selected plan year. Refresh to update.": [
    "Lewat tempoh bermaksud tarikh dirancang telah berlalu tanpa penyiapan disahkan. Kiraan meliputi tahun pelan dipilih. Muat semula untuk kemas kini.",
    "逾期表示计划日期已过，但保养完成尚未确认。数量按所选计划年份统计。刷新以更新。",
    "योजनाबद्ध मिति बितिसक्दा पनि सम्पन्न प्रमाणित नभएको काम म्याद नाघेको हो। गणना छानिएको योजना वर्षको हो। अद्यावधिक गर्न रिफ्रेस गर्नुहोस्।"
  ]
};

export default async function PMDashboardSummary({
  language, searchParams,
}: {
  language: Language;
  searchParams: Promise<{ pm_year?: string | string[] }>;
}) {
  const index = { ms: 0, zh: 1, ne: 2 };
  const t = (text: string) => language === "en"
    ? text : words[text]?.[index[language]] ?? text;
  const params = await searchParams;
  const raw = typeof params.pm_year === "string" ? Number(params.pm_year) : NaN;
  const currentYear = Number(new Intl.DateTimeFormat("en-MY", {
    year: "numeric", timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date()));
  const year = Number.isInteger(raw) && raw >= 2020 && raw <= 2100
    ? raw : currentYear;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("annual_pm_summary", { p_year: year });
  const summary = data as Summary | null;
  const cards = [
    { key: "upcoming", label: "Upcoming", colour: "border-blue-200 bg-blue-50 text-blue-900" },
    { key: "due_today", label: "Due today", colour: "border-amber-300 bg-amber-50 text-amber-900" },
    { key: "overdue", label: "Overdue", colour: "border-red-300 bg-red-50 text-red-800" },
    { key: "awaiting_closure", label: "Awaiting closure", colour: "border-amber-300 bg-amber-50 text-amber-900" },
    { key: "closed", label: "Closed", colour: "border-green-200 bg-green-50 text-green-900" },
  ] as const;

  return (
    <section id="pm-summary" className="mb-8 rounded-xl border bg-white p-5 text-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold">{t("Annual PM summary")}</h2>
        <Link href={`/preventive-maintenance/master-plan?year=${year}`}
          className="font-semibold text-blue-700 underline">
          {t("Open annual Master Plan")} →
        </Link>
      </div>
      <form action="/#pm-summary" className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-sm font-medium">
          {t("Plan year")}
          <input key={year} name="pm_year" type="number" required
            min={2020} max={2100} defaultValue={year}
            className="mt-2 block w-32 rounded-lg border bg-white p-3" />
        </label>
        <button className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white">
          {t("Show")}
        </button>
      </form>
      {error || !summary ? <p role="alert" className="mt-4 text-red-700">
        {t("PM summary could not be loaded. Please refresh.")}
      </p> : <>
        {!summary.has_plan && <p className="mt-4 text-slate-600">
          {t("No Master Plan exists for this year.")}
        </p>}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {cards.map(card => <article key={card.key}
            className={`rounded-xl border p-4 ${card.colour}`}>
            <h3 className="text-sm font-medium">{t(card.label)}</h3>
            <p className="mt-3 text-3xl font-bold">
              {Number(summary[card.key]).toLocaleString(language === "en" ? "en-MY" : language)}
            </p>
          </article>)}
        </div>
        <p className="mt-4 text-sm">
          {t("Planned PM jobs")}: {summary.total}
          {" · "}{t("As of — Malaysia date")}: {summary.as_of_date}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          {t("Overdue means the planned date has passed without verified completion. Counts cover the selected plan year. Refresh to update.")}
        </p>
      </>}
    </section>
  );
}
