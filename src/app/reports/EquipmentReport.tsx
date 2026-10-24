import Link from "next/link";
import type { Language } from "@/utils/language";

type Totals = {
  total: number;
  open: number;
  closed: number;
  rejected: number;
  average_repair_hours: number | null;
  repair_records: number;
};

export type EquipmentBreakdownData = {
  report_version?: number;
  categories?: (Totals & { category: string })[];
  machines?: (Totals & {
    machine_id: string;
    machine_code: string | null;
    machine_name: string;
    downtime_minutes: number;
    downtime_records: number;
    downtime_unresolved: number;
  })[];
};

const words: Record<string, [string, string, string]> = {
  "MRFs by work category": [
    "MRF mengikut kategori kerja", "按工作类别统计 MRF", "कामको श्रेणीअनुसार MRF"
  ],
  "Machine / Equipment": ["Mesin / Peralatan", "机器／设备", "मेसिन / उपकरण"],
  "Building / Facilities": ["Bangunan / Kemudahan", "建筑／设施", "भवन / सुविधा"],
  "Other Maintenance Work": [
    "Kerja Penyelenggaraan Lain", "其他维修工作", "अन्य मर्मत कार्य"
  ],
  "Uncategorised / older records": [
    "Rekod tanpa kategori / lama", "未分类／旧记录", "श्रेणीविहीन / पुराना अभिलेख"
  ],
  "Category": ["Kategori", "类别", "श्रेणी"],
  "Total": ["Jumlah", "总数", "जम्मा"],
  "Open": ["Terbuka", "未关闭", "खुला"],
  "Closed": ["Ditutup", "已关闭", "बन्द"],
  "Rejected": ["Ditolak", "已拒绝", "अस्वीकृत"],
  "Registered equipment performance": [
    "Prestasi peralatan berdaftar", "已登记设备维修表现", "दर्ता भएका उपकरणको कार्यसम्पादन"
  ],
  "Equipment": ["Peralatan", "设备", "उपकरण"],
  "Recorded downtime (min)": [
    "Masa henti direkodkan (min)", "已记录停机时间（分钟）", "अभिलेख गरिएको बन्द समय (मिनेट)"
  ],
  "Awaiting downtime end": [
    "Menunggu rekod tamat masa henti", "待补全停机结束记录", "बन्द समय समाप्तिको अभिलेख पर्खिरहेको"
  ],
  "Average submission to repair (h)": [
    "Purata penghantaran hingga pembaikan (jam)",
    "提交至维修完成平均时间（小时）",
    "अनुरोधदेखि मर्मतसम्मको औसत समय (घण्टा)"
  ],
  "Valid records": ["Rekod sah", "有效记录", "मान्य अभिलेख"],
  "Unavailable": ["Tidak tersedia", "暂不可用", "उपलब्ध छैन"],
  "No linked equipment MRFs in these submission dates.": [
    "Tiada MRF peralatan terpaut dalam tarikh penghantaran ini.",
    "所选提交日期内暂无关联设备的 MRF。",
    "यी अनुरोध मितिहरूमा उपकरणसँग जोडिएका MRF छैनन्।"
  ],
  "Equipment breakdown is unavailable. Refresh after the report database update.": [
    "Pecahan peralatan tidak tersedia. Muat semula selepas kemas kini pangkalan data laporan.",
    "设备分类统计暂不可用。更新报告数据库后请刷新。",
    "उपकरण विवरण उपलब्ध छैन। प्रतिवेदन डाटाबेस अद्यावधिक भएपछि रिफ्रेस गर्नुहोस्।"
  ],
  "All categories contribute to the existing overall totals. Open includes pending approvals and handovers.": [
    "Semua kategori termasuk dalam jumlah keseluruhan sedia ada. Terbuka termasuk kelulusan dan serahan tertunda.",
    "所有类别均计入现有总体统计。未关闭包括待审批及待交接的申请。",
    "सबै श्रेणी विद्यमान कुलमा समावेश छन्। खुलामा बाँकी स्वीकृति र हस्तान्तरण पनि पर्छन्।"
  ],
  "Equipment is grouped by registered ID, using its current code and name. Facilities, other work and unlinked older records are excluded from this table.": [
    "Peralatan dikumpulkan mengikut ID berdaftar dengan kod dan nama semasa. Kemudahan, kerja lain dan rekod lama tanpa pautan tidak termasuk dalam jadual ini.",
    "设备按登记 ID 分组，显示当前编号和名称。设施、其他工作及未关联设备的旧记录不包含在此表内。",
    "उपकरण दर्ता ID अनुसार समूहबद्ध छन् र हालको कोड तथा नाम देखाइन्छ। सुविधा, अन्य काम र नजोडिएका पुराना अभिलेख यस तालिकामा समावेश छैनन्।"
  ],
  "Downtime sums completed intervals; overlapping MRFs may overlap in time. Repair lead time includes waiting and pauses. Missing timestamps are excluded from averages. Equipment links open all accessible history, without this report's date filter.": [
    "Masa henti menjumlahkan tempoh lengkap; masa antara MRF mungkin bertindih. Tempoh pembaikan termasuk menunggu dan jeda. Cap masa tiada tidak termasuk dalam purata. Pautan peralatan membuka semua sejarah yang boleh diakses tanpa penapis tarikh laporan ini.",
    "停机时间为已结束时段之和，不同 MRF 的时段可能重叠。维修周期包括等待及暂停。缺失时间记录不计入平均值。设备链接打开全部可访问历史，不沿用本报告的日期筛选。",
    "बन्द समय समाप्त अन्तरालहरूको योग हो; विभिन्न MRF का समय दोहोरिन सक्छन्। मर्मत अवधिमा पर्खाइ र विश्राम समावेश हुन्छन्। समय नभएका अभिलेख औसतमा पर्दैनन्। उपकरण लिङ्कले यस प्रतिवेदनको मिति फिल्टरबिना सबै पहुँचयोग्य इतिहास खोल्छ।"
  ],
};

export default function EquipmentReport({ report, language }: {
  report: EquipmentBreakdownData;
  language: Language;
}) {
  const index = { ms: 0, zh: 1, ne: 2 };
  const t = (text: string) => language === "en"
    ? text : words[text]?.[index[language]] ?? text;
  const decimal = (value: number | null) => value === null
    ? t("Unavailable")
    : Number(value).toLocaleString("en-MY", {
        minimumFractionDigits: 2, maximumFractionDigits: 2,
      });

  if (report.report_version !== 2
      || !Array.isArray(report.categories) || !Array.isArray(report.machines)) {
    return <p role="alert" className="mt-6 rounded-xl border bg-white p-5 text-amber-800">
      {t("Equipment breakdown is unavailable. Refresh after the report database update.")}
    </p>;
  }

  const groups = [
    ["equipment", "Machine / Equipment"],
    ["facilities", "Building / Facilities"],
    ["other", "Other Maintenance Work"],
    ["uncategorised", "Uncategorised / older records"],
  ];
  const categories = new Map(report.categories.map(item => [item.category, item]));

  return (
    <>
      <section className="mt-6 overflow-hidden rounded-xl border bg-white">
        <div className="p-5">
          <h2 className="text-xl font-bold">{t("MRFs by work category")}</h2>
          <p className="mt-2 text-sm text-slate-600">
            {t("All categories contribute to the existing overall totals. Open includes pending approvals and handovers.")}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>{["Category", "Total", "Open", "Closed", "Rejected"].map(label =>
                <th key={label} className="p-4">{t(label)}</th>
              )}</tr>
            </thead>
            <tbody>
              {groups.map(([key, label]) => {
                const item = categories.get(key);
                return <tr key={key} className="border-t">
                  <th scope="row" className="p-4 font-medium">{t(label)}</th>
                  <td className="p-4">{item?.total ?? 0}</td>
                  <td className="p-4">{item?.open ?? 0}</td>
                  <td className="p-4">{item?.closed ?? 0}</td>
                  <td className="p-4">{item?.rejected ?? 0}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-xl border bg-white">
        <div className="p-5">
          <h2 className="text-xl font-bold">{t("Registered equipment performance")}</h2>
          <p className="mt-2 text-sm text-slate-600">
            {t("Equipment is grouped by registered ID, using its current code and name. Facilities, other work and unlinked older records are excluded from this table.")}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>{["Equipment", "Total", "Open", "Closed", "Rejected",
                "Recorded downtime (min)", "Awaiting downtime end",
                "Average submission to repair (h)"].map(label =>
                <th key={label} className="p-4">{t(label)}</th>
              )}</tr>
            </thead>
            <tbody>
              {report.machines.map(item => (
                <tr key={item.machine_id} className="border-t">
                  <th scope="row" className="min-w-44 p-4 font-medium">
                    <Link href={`/machines/${item.machine_id}`}
                      className="text-blue-700 hover:underline">
                      {item.machine_code ? `${item.machine_code} · ` : ""}
                      {item.machine_name} →
                    </Link>
                  </th>
                  <td className="p-4">{item.total}</td>
                  <td className="p-4">{item.open}</td>
                  <td className="p-4">{item.closed}</td>
                  <td className="p-4">{item.rejected}</td>
                  <td className="p-4">
                    {decimal(item.downtime_records > 0 ? item.downtime_minutes : null)}
                    <span className="mt-1 block text-xs text-slate-500">
                      {t("Valid records")}: {item.downtime_records}
                    </span>
                  </td>
                  <td className="p-4">{item.downtime_unresolved}</td>
                  <td className="p-4">
                    {decimal(item.average_repair_hours)}
                    <span className="mt-1 block text-xs text-slate-500">
                      {t("Valid records")}: {item.repair_records}
                    </span>
                  </td>
                </tr>
              ))}
              {!report.machines.length && (
                <tr><td colSpan={8} className="p-5 text-slate-500">
                  {t("No linked equipment MRFs in these submission dates.")}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="p-5 text-sm text-slate-600">
          {t("Downtime sums completed intervals; overlapping MRFs may overlap in time. Repair lead time includes waiting and pauses. Missing timestamps are excluded from averages. Equipment links open all accessible history, without this report's date filter.")}
        </p>
      </section>
    </>
  );
}
