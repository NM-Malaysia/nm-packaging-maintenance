import "server-only";
import type { Language } from "./language";

const translations: Record<string, Record<string, string>> = {
  "← Dashboard": {
    "ms": "← Papan Pemuka",
    "zh": "← 仪表板",
    "ne": "← ड्यासबोर्ड"
  },
  "Maintenance Reports": {
    "ms": "Laporan Penyelenggaraan",
    "zh": "维修报告",
    "ne": "मर्मत प्रतिवेदन"
  },
  "Maintenance performance overview": {
    "ms": "Gambaran prestasi penyelenggaraan",
    "zh": "维修绩效概览",
    "ne": "मर्मत कार्यसम्पादनको अवलोकन"
  },
  "MRF submitted from — Malaysia date": {
    "ms": "MRF dihantar dari — Tarikh Malaysia",
    "zh": "MRF提交起始日期 — 马来西亚日期",
    "ne": "MRF पेश भएको मितिदेखि — मलेसियाको मिति"
  },
  "MRF submitted to — Malaysia date": {
    "ms": "MRF dihantar hingga — Tarikh Malaysia",
    "zh": "MRF提交截止日期 — 马来西亚日期",
    "ne": "MRF पेश भएको मितिसम्म — मलेसियाको मिति"
  },
  "Apply dates": {
    "ms": "Gunakan tarikh",
    "zh": "应用日期",
    "ne": "मिति लागू गर्नुहोस्"
  },
  "All dates": {
    "ms": "Semua tarikh",
    "zh": "所有日期",
    "ne": "सबै मितिहरू"
  },
  "MRFs submitted {from} to {to}.": {
    "ms": "MRF dihantar dari {from} hingga {to}.",
    "zh": "提交日期从{from}至{to}的MRF。",
    "ne": "{from} देखि {to} सम्म पेश भएका MRF।"
  },
  "from the beginning": {
    "ms": "awal rekod",
    "zh": "最早记录",
    "ne": "सुरुदेखि"
  },
  "the latest date": {
    "ms": "tarikh terkini",
    "zh": "最新日期",
    "ne": "पछिल्लो मिति"
  },
  "All submission dates.": {
    "ms": "Semua tarikh penghantaran.",
    "zh": "所有提交日期。",
    "ne": "सबै पेश गरिएका मितिहरू।"
  },
  "Shows their current status and all linked recorded work, including work performed outside the submission date range.": {
    "ms": "Menunjukkan status semasa dan semua rekod kerja berkaitan, termasuk kerja di luar julat tarikh penghantaran.",
    "zh": "显示这些MRF的当前状态及全部关联工作记录，包括在所选提交日期范围之外进行的工作。",
    "ne": "तिनको हालको स्थिति र सबै सम्बन्धित कामका अभिलेख देखाउँछ, जसमा पेश गरिएको मिति दायराबाहिर गरिएको काम पनि समावेश हुन्छ।"
  },
  "Enter valid dates. The start date must not exceed the end date.": {
    "ms": "Masukkan tarikh yang sah. Tarikh mula tidak boleh melebihi tarikh akhir.",
    "zh": "请输入有效日期，起始日期不能晚于截止日期。",
    "ne": "मान्य मितिहरू भर्नुहोस्। सुरु मिति अन्तिम मितिभन्दा पछि हुन मिल्दैन।"
  },
  "Reports could not be loaded. Refresh and try again.": {
    "ms": "Laporan tidak dapat dimuatkan. Muat semula dan cuba lagi.",
    "zh": "无法加载报告，请刷新重试。",
    "ne": "प्रतिवेदन लोड भएन। रिफ्रेस गरी फेरि प्रयास गर्नुहोस्।"
  },
  "Updated:": {
    "ms": "Dikemas kini:",
    "zh": "更新时间：",
    "ne": "अद्यावधिक:"
  },
  "Malaysia time": {
    "ms": "Waktu Malaysia",
    "zh": "马来西亚时间",
    "ne": "मलेसियाको समय"
  },
  "Refresh to update.": {
    "ms": "Muat semula untuk kemas kini.",
    "zh": "刷新以更新。",
    "ne": "अद्यावधिक गर्न रिफ्रेस गर्नुहोस्।"
  },
  "No MRFs match these submission dates.": {
    "ms": "Tiada MRF sepadan dengan tarikh penghantaran ini.",
    "zh": "没有符合这些提交日期的MRF。",
    "ne": "यी पेश मितिहरूसँग मिल्ने MRF छैनन्।"
  },
  "Report totals": {
    "ms": "Jumlah laporan",
    "zh": "报告汇总",
    "ne": "प्रतिवेदनको कुल विवरण"
  },
  "Total MRFs": {
    "ms": "Jumlah MRF",
    "zh": "MRF总数",
    "ne": "कुल MRF"
  },
  "All statuses in the selected submission dates": {
    "ms": "Semua status dalam tarikh penghantaran terpilih",
    "zh": "所选提交日期内的全部状态",
    "ne": "छानिएका पेश मितिहरूका सबै स्थितिहरू"
  },
  "Open MRFs": {
    "ms": "MRF terbuka",
    "zh": "未关闭MRF",
    "ne": "खुला MRF"
  },
  "Includes pending approvals and handovers": {
    "ms": "Termasuk kelulusan dan serah terima tertangguh",
    "zh": "包括待审批及待交接项目",
    "ne": "बाँकी स्वीकृति र हस्तान्तरण समावेश"
  },
  "Closed MRFs": {
    "ms": "MRF ditutup",
    "zh": "已关闭MRF",
    "ne": "बन्द MRF"
  },
  "{count} rejected MRFs shown separately": {
    "ms": "{count} MRF ditolak ditunjukkan berasingan",
    "zh": "另列{count}项被拒绝的MRF",
    "ne": "{count} अस्वीकृत MRF अलग देखाइएको"
  },
  "Recorded machine downtime": {
    "ms": "Masa henti mesin direkodkan",
    "zh": "已记录机器停机时长",
    "ne": "रेकर्ड गरिएको मेसिन बन्द समय"
  },
  "{count} valid start/end records": {
    "ms": "{count} rekod mula/akhir yang sah",
    "zh": "{count}项有效起止时间记录",
    "ne": "{count} मान्य सुरु/अन्त्य अभिलेख"
  },
  "Average submission → repair": {
    "ms": "Purata penghantaran → pembaikan selesai",
    "zh": "平均提交至维修完成时长",
    "ne": "पेशदेखि मर्मत पूरा हुँदासम्म औसत समय"
  },
  "{count} valid repair-review timestamps": {
    "ms": "{count} cap masa semakan pembaikan yang sah",
    "zh": "{count}项有效维修审核时间记录",
    "ne": "{count} मान्य मर्मत समीक्षा समय अभिलेख"
  },
  "Average submission → closure": {
    "ms": "Purata penghantaran → penutupan",
    "zh": "平均提交至关闭时长",
    "ne": "पेशदेखि बन्द हुँदासम्म औसत समय"
  },
  "{count} valid closed MRF timestamps": {
    "ms": "{count} cap masa penutupan MRF yang sah",
    "zh": "{count}项有效MRF关闭时间记录",
    "ne": "{count} मान्य MRF बन्द समय अभिलेख"
  },
  "Recorded staff working time": {
    "ms": "Masa bekerja kakitangan direkodkan",
    "zh": "已记录人员工作时长",
    "ne": "रेकर्ड गरिएको कर्मचारी काम समय"
  },
  "Personal and task sessions combined; pauses excluded": {
    "ms": "Gabungan sesi kerja individu dan tugasan; tidak termasuk jeda",
    "zh": "合计个人及任务工作时段，不包括暂停时间",
    "ne": "व्यक्तिगत र कार्य सत्रहरूको योग; रोकिएको समय बाहेक"
  },
  "Downtime awaiting valid end record": {
    "ms": "Masa henti menunggu rekod akhir yang sah",
    "zh": "待补有效结束记录的停机项目",
    "ne": "मान्य अन्त्य अभिलेख बाँकी रहेको बन्द समय"
  },
  "Applicable MRFs with missing or invalid start/end times": {
    "ms": "MRF berkaitan dengan masa mula/akhir yang tiada atau tidak sah",
    "zh": "涉及停机但起止时间缺失或无效的MRF",
    "ne": "सुरु/अन्त्य समय नभएका वा अमान्य भएका सम्बन्धित MRF"
  },
  "Unavailable": {
    "ms": "Tidak tersedia",
    "zh": "无法获取",
    "ne": "उपलब्ध छैन"
  },
  "min": {
    "ms": "min",
    "zh": "分钟",
    "ne": "मिनेट"
  },
  "h": {
    "ms": "j",
    "zh": "小时",
    "ne": "घण्टा"
  },
  "MRFs by current status": {
    "ms": "MRF mengikut status semasa",
    "zh": "按当前状态统计MRF",
    "ne": "हालको स्थितिअनुसार MRF"
  },
  "Awaiting HOD approval": {
    "ms": "Menunggu kelulusan HOD",
    "zh": "待部门主管审批",
    "ne": "विभाग प्रमुखको स्वीकृति बाँकी"
  },
  "Ready to Start": {
    "ms": "Sedia untuk Bermula",
    "zh": "待开始",
    "ne": "सुरु गर्न तयार"
  },
  "In Progress": {
    "ms": "Sedang Dijalankan",
    "zh": "进行中",
    "ne": "काम भइरहेको"
  },
  "Waiting for Parts": {
    "ms": "Menunggu Alat Ganti",
    "zh": "等待备件",
    "ne": "स्पेयर पार्ट्सको प्रतीक्षामा"
  },
  "Follow-up Required": {
    "ms": "Perlu Susulan",
    "zh": "需要跟进",
    "ne": "फलो-अप आवश्यक"
  },
  "Repair Completed": {
    "ms": "Pembaikan Selesai",
    "zh": "维修已完成",
    "ne": "मर्मत पूरा भएको"
  },
  "Handover Pending": {
    "ms": "Menunggu Serah Terima",
    "zh": "待交接",
    "ne": "हस्तान्तरण बाँकी"
  },
  "Closed": {
    "ms": "Ditutup",
    "zh": "已关闭",
    "ne": "बन्द भएको"
  },
  "Rejected": {
    "ms": "Ditolak",
    "zh": "已拒绝",
    "ne": "अस्वीकृत"
  },
  "No status records.": {
    "ms": "Tiada rekod status.",
    "zh": "暂无状态记录。",
    "ne": "स्थिति अभिलेख छैनन्।"
  },
  "Staff working time": {
    "ms": "Masa bekerja kakitangan",
    "zh": "人员工作时长",
    "ne": "कर्मचारीको काम समय"
  },
  "Sums recorded sessions for the selected MRFs, including running sessions up to the report time. Overlapping sessions are counted separately; this is not attendance or payroll time.": {
    "ms": "Menjumlahkan sesi kerja direkodkan untuk MRF terpilih, termasuk sesi yang masih berjalan hingga masa laporan. Sesi bertindih dikira berasingan; ini bukan masa kehadiran atau penggajian.",
    "zh": "合计所选MRF的已记录工作时段，包括截至报告时间仍在进行的时段。重叠时段分别计入；此数据不用于考勤或薪资计算。",
    "ne": "छानिएका MRF का रेकर्ड गरिएका सत्रहरूको योग, प्रतिवेदन समयसम्म चलिरहेका सत्रसहित। एकै समयमा भएका सत्रहरू अलग गणना हुन्छन्; यो हाजिरी वा तलब गणनाको समय होइन।"
  },
  "Employee": {
    "ms": "Kakitangan",
    "zh": "员工",
    "ne": "कर्मचारी"
  },
  "Employee number": {
    "ms": "Nombor pekerja",
    "zh": "员工编号",
    "ne": "कर्मचारी नम्बर"
  },
  "Working hours": {
    "ms": "Jam bekerja",
    "zh": "工作小时数",
    "ne": "काम गरेको घण्टा"
  },
  "Running sessions": {
    "ms": "Sesi sedang berjalan",
    "zh": "进行中的工作时段",
    "ne": "चलिरहेका सत्रहरू"
  },
  "No recorded work sessions for these MRFs.": {
    "ms": "Tiada sesi kerja direkodkan untuk MRF ini.",
    "zh": "这些MRF暂无工作时段记录。",
    "ne": "यी MRF का लागि कामका सत्र रेकर्ड छैनन्।"
  },
  "Lead times use elapsed calendar hours, including waiting and pauses. Missing or invalid timestamps are excluded from averages. Downtime totals sum individual MRF records and may overlap on the same machine; they are not plant availability. Each MRF currently records one downtime interval.": {
    "ms": "Tempoh penyelesaian menggunakan jam kalendar berlalu, termasuk menunggu dan jeda. Cap masa yang tiada atau tidak sah dikecualikan daripada purata. Jumlah masa henti menjumlahkan rekod MRF individu dan mungkin bertindih pada mesin yang sama; ia bukan ukuran ketersediaan kilang. Setiap MRF kini merekodkan satu selang masa henti.",
    "zh": "周期按实际经过的日历小时计算，包括等待及暂停时间。时间记录缺失或无效的项目不计入平均值。停机总时长为各MRF记录之和，同一机器的记录可能重叠；此数据不代表全厂设备可用率。目前每项MRF记录一个停机区间。",
    "ne": "अवधि बितेका क्यालेन्डर घण्टामा गणना हुन्छ, प्रतीक्षा र रोकिएको समयसहित। नभएका वा अमान्य समय अभिलेख औसतमा समावेश हुँदैनन्। बन्द समयको कुल योग प्रत्येक MRF को अभिलेखबाट हुन्छ र एउटै मेसिनमा दोहोरिन सक्छ; यो कारखानाको उपलब्धता दर होइन। हाल प्रत्येक MRF मा एउटा बन्द समय अन्तराल रेकर्ड हुन्छ।"
  }
};

export function reportText(
  language: Language,
  text: string,
  values: Record<string, string | number> = {},
): string {
  const translated = language === "en" ? text : translations[text]?.[language] ?? text;
  return translated.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
  );
}
