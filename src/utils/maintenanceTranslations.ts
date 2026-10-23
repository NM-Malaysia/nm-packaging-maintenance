import "server-only";
import type { Language } from "./language";

const translations: Record<string, Record<string, string>> = {
  "← Dashboard": {
    "ms": "← Papan Pemuka",
    "zh": "← 仪表板",
    "ne": "← ड्यासबोर्ड"
  },
  "Maintenance Team": {
    "ms": "Pasukan Penyelenggaraan",
    "zh": "维修团队",
    "ne": "मर्मत टोली"
  },
  "Active Jobs": {
    "ms": "Kerja Aktif",
    "zh": "进行中的工作",
    "ne": "सक्रिय कामहरू"
  },
  "My Jobs": {
    "ms": "Kerja Saya",
    "zh": "我的工作",
    "ne": "मेरा कामहरू"
  },
  "Waiting for Parts": {
    "ms": "Menunggu Alat Ganti",
    "zh": "等待备件",
    "ne": "पार्टपुर्जा पर्खिरहेको"
  },
  "Pending Review": {
    "ms": "Menunggu Semakan",
    "zh": "待审核",
    "ne": "समीक्षा पर्खिरहेको"
  },
  "Completed": {
    "ms": "Selesai",
    "zh": "已完成",
    "ne": "सम्पन्न"
  },
  "Ready to Start": {
    "ms": "Sedia Dimulakan",
    "zh": "待开始",
    "ne": "सुरु गर्न तयार"
  },
  "In Progress": {
    "ms": "Sedang Dijalankan",
    "zh": "进行中",
    "ne": "काम भइरहेको"
  },
  "Follow-up Required": {
    "ms": "Susulan Diperlukan",
    "zh": "待后续跟进",
    "ne": "अनुगमन आवश्यक"
  },
  "Repair Completed": {
    "ms": "Pembaikan Selesai",
    "zh": "维修已完成",
    "ne": "मर्मत सम्पन्न"
  },
  "Handover Pending": {
    "ms": "Menunggu Serahan",
    "zh": "待交接",
    "ne": "हस्तान्तरण पर्खिरहेको"
  },
  "Closed": {
    "ms": "Ditutup",
    "zh": "已关闭",
    "ne": "बन्द"
  },
  "Urgent": {
    "ms": "Segera",
    "zh": "紧急",
    "ne": "अत्यावश्यक"
  },
  "High": {
    "ms": "Tinggi",
    "zh": "高",
    "ne": "उच्च"
  },
  "Normal": {
    "ms": "Biasa",
    "zh": "普通",
    "ne": "सामान्य"
  },
  "Low": {
    "ms": "Rendah",
    "zh": "低",
    "ne": "न्यून"
  },
  "Priority": {
    "ms": "Keutamaan",
    "zh": "优先级",
    "ne": "प्राथमिकता"
  },
  "All priorities": {
    "ms": "Semua keutamaan",
    "zh": "所有优先级",
    "ne": "सबै प्राथमिकता"
  },
  "Sort by": {
    "ms": "Susun mengikut",
    "zh": "排序方式",
    "ne": "क्रमबद्ध गर्ने आधार"
  },
  "Oldest submitted first": {
    "ms": "Permohonan terlama dahulu",
    "zh": "最早提交优先",
    "ne": "पहिले पठाइएका अगाडि"
  },
  "Newest submitted first": {
    "ms": "Permohonan terkini dahulu",
    "zh": "最新提交优先",
    "ne": "पछि पठाइएका अगाडि"
  },
  "Highest priority first": {
    "ms": "Keutamaan tertinggi dahulu",
    "zh": "最高优先级优先",
    "ne": "उच्चतम प्राथमिकता अगाडि"
  },
  "No update longest — open MRFs": {
    "ms": "Paling lama tanpa kemas kini — MRF terbuka",
    "zh": "最久未更新 — 未关闭的 MRF",
    "ne": "सबैभन्दा लामो समय अद्यावधिक नभएका — खुला MRF"
  },
  "In Progress longest": {
    "ms": "Paling lama sedang dijalankan",
    "zh": "进行中时间最长",
    "ne": "सबैभन्दा लामो समयदेखि काम भइरहेको"
  },
  "Search MRF / machine / description": {
    "ms": "Cari MRF / mesin / penerangan",
    "zh": "搜索 MRF／设备／描述",
    "ne": "MRF / मेसिन / विवरण खोज्नुहोस्"
  },
  "11234 or Fuji9": {
    "ms": "11234 atau Fuji9",
    "zh": "11234 或 Fuji9",
    "ne": "11234 वा Fuji9"
  },
  "Status": {
    "ms": "Status",
    "zh": "状态",
    "ne": "स्थिति"
  },
  "All statuses in this tab": {
    "ms": "Semua status dalam tab ini",
    "zh": "本分类的所有状态",
    "ne": "यस ट्याबका सबै स्थिति"
  },
  "Department": {
    "ms": "Jabatan",
    "zh": "部门",
    "ne": "विभाग"
  },
  "Department name": {
    "ms": "Nama jabatan",
    "zh": "部门名称",
    "ne": "विभागको नाम"
  },
  "Assigned person": {
    "ms": "Petugas ditugaskan",
    "zh": "已分配人员",
    "ne": "तोकिएको व्यक्ति"
  },
  "All team members": {
    "ms": "Semua ahli pasukan",
    "zh": "所有团队成员",
    "ne": "टोलीका सबै सदस्य"
  },
  "Submitted from — Malaysia date": {
    "ms": "Dihantar dari — tarikh Malaysia",
    "zh": "提交起始日期 — 马来西亚日期",
    "ne": "पठाइएको मितिदेखि — मलेसिया मिति"
  },
  "Submitted to — Malaysia date": {
    "ms": "Dihantar hingga — tarikh Malaysia",
    "zh": "提交截止日期 — 马来西亚日期",
    "ne": "पठाइएको मितिसम्म — मलेसिया मिति"
  },
  "Apply filters": {
    "ms": "Guna penapis",
    "zh": "应用筛选",
    "ne": "फिल्टर लागू गर्नुहोस्"
  },
  "Reset": {
    "ms": "Set semula",
    "zh": "重置",
    "ne": "रिसेट"
  },
  "MRF / Machine": {
    "ms": "MRF / Mesin",
    "zh": "MRF／设备",
    "ne": "MRF / मेसिन"
  },
  "Assigned team": {
    "ms": "Pasukan ditugaskan",
    "zh": "已分配团队",
    "ne": "तोकिएको टोली"
  },
  "Submitted": {
    "ms": "Dihantar",
    "zh": "已提交",
    "ne": "पठाइएको"
  },
  "Activity / Time": {
    "ms": "Aktiviti / Masa",
    "zh": "活动／时间",
    "ne": "गतिविधि / समय"
  },
  "Save priority": {
    "ms": "Simpan keutamaan",
    "zh": "保存优先级",
    "ne": "प्राथमिकता सुरक्षित गर्नुहोस्"
  },
  "Open": {
    "ms": "Buka",
    "zh": "打开",
    "ne": "खोल्नुहोस्"
  },
  "No MRFs match these filters.": {
    "ms": "Tiada MRF sepadan dengan penapis ini.",
    "zh": "没有符合筛选条件的 MRF。",
    "ne": "यी फिल्टरसँग मिल्ने MRF छैन।"
  },
  "Temporary repair · Follow-up pending": {
    "ms": "Pembaikan sementara · Susulan belum selesai",
    "zh": "临时维修 · 后续跟进未完成",
    "ne": "अस्थायी मर्मत · अनुगमन बाँकी"
  },
  "← Previous": {
    "ms": "← Sebelumnya",
    "zh": "← 上一页",
    "ne": "← अघिल्लो"
  },
  "Next →": {
    "ms": "Seterusnya →",
    "zh": "下一页 →",
    "ne": "अर्को →"
  }
};

// Maintenance list messages
Object.assign(translations, {
  "Assigned person": {
    "ms": "Petugas ditugaskan",
    "zh": "已分配人员",
    "ne": "तोकिएको व्यक्ति"
  },
  "Priority saved.": {
    "ms": "Keutamaan disimpan.",
    "zh": "优先级已保存。",
    "ne": "प्राथमिकता सुरक्षित गरियो।"
  },
  "Priority could not be saved. Refresh and try again.": {
    "ms": "Keutamaan tidak dapat disimpan. Muat semula dan cuba lagi.",
    "zh": "无法保存优先级。请刷新后重试。",
    "ne": "प्राथमिकता सुरक्षित भएन। रिफ्रेस गरेर फेरि प्रयास गर्नुहोस्।"
  },
  "No update measures time since recorded activity, including priority changes. It does not mean nobody is working. In Progress includes paused time. Refresh to update durations.": {
    "ms": "Tempoh tanpa kemas kini dikira sejak aktiviti direkodkan, termasuk perubahan keutamaan. Ini tidak bermakna tiada orang sedang bekerja. Tempoh Sedang Dijalankan termasuk masa dijeda. Muat semula untuk kemas kini tempoh.",
    "zh": "未更新时间从最近记录的活动起计算，包括优先级更改。这不代表没有人在工作。进行中时长包含暂停时间。刷新页面以更新时长。",
    "ne": "अद्यावधिक नभएको समय अभिलेख गरिएको पछिल्लो गतिविधिदेखि गणना हुन्छ, प्राथमिकता परिवर्तनसमेत। यसको अर्थ कसैले काम नगरेको होइन। काम भइरहेको समयमा रोकिएको समय पनि समावेश हुन्छ। अवधि अद्यावधिक गर्न रिफ्रेस गर्नुहोस्।"
  },
  "Closed MRFs are excluded.": {
    "ms": "MRF yang ditutup dikecualikan.",
    "zh": "不包括已关闭的 MRF。",
    "ne": "बन्द MRF समावेश हुँदैनन्।"
  },
  "Only In Progress MRFs are shown within the selected tab and filters.": {
    "ms": "Hanya MRF Sedang Dijalankan dipaparkan mengikut tab dan penapis dipilih.",
    "zh": "仅显示所选分类和筛选范围内进行中的 MRF。",
    "ne": "छानिएको ट्याब र फिल्टरअनुसार काम भइरहेका MRF मात्र देखाइन्छन्।"
  },
  "Repairs awaiting final approval or handover. Individual task reviews are inside each MRF.": {
    "ms": "Pembaikan menunggu kelulusan akhir atau serahan. Semakan tugas individu terdapat dalam setiap MRF.",
    "zh": "等待最终审批或交接的维修。各任务的审核位于对应 MRF 内。",
    "ne": "अन्तिम स्वीकृति वा हस्तान्तरण पर्खिरहेका मर्मत। प्रत्येक कार्यको समीक्षा सम्बन्धित MRF भित्र छ।"
  },
  "The staff filter list could not be loaded. Refresh to try again.": {
    "ms": "Senarai penapis kakitangan tidak dapat dimuatkan. Muat semula untuk cuba lagi.",
    "zh": "无法加载人员筛选列表。请刷新后重试。",
    "ne": "कर्मचारी फिल्टर सूची लोड भएन। रिफ्रेस गरेर फेरि प्रयास गर्नुहोस्।"
  },
  "Temporary repair indicators could not be loaded. Refresh to try again.": {
    "ms": "Penunjuk pembaikan sementara tidak dapat dimuatkan. Muat semula untuk cuba lagi.",
    "zh": "无法加载临时维修标记。请刷新后重试。",
    "ne": "अस्थायी मर्मत सूचक लोड भएनन्। रिफ्रेस गरेर फेरि प्रयास गर्नुहोस्।"
  },
  "Requests could not be loaded. Refresh and try again.": {
    "ms": "Permohonan tidak dapat dimuatkan. Muat semula dan cuba lagi.",
    "zh": "无法加载申请。请刷新后重试。",
    "ne": "अनुरोधहरू लोड भएनन्। रिफ्रेस गरेर फेरि प्रयास गर्नुहोस्।"
  },
  "No matching MRFs": {
    "ms": "Tiada MRF sepadan",
    "zh": "没有符合条件的 MRF",
    "ne": "मिल्ने MRF छैन"
  },
  "Showing {first}–{last} of {total} MRFs": {
    "ms": "Memaparkan {first}–{last} daripada {total} MRF",
    "zh": "显示第 {first}–{last} 项，共 {total} 项 MRF",
    "ne": "कुल {total} MRF मध्ये {first}–{last} देखाइएको"
  },
  "20 per page": {
    "ms": "20 setiap halaman",
    "zh": "每页 20 项",
    "ne": "प्रति पृष्ठ २०"
  },
  "Page {page} of {pages}": {
    "ms": "Halaman {page} daripada {pages}",
    "zh": "第 {page} 页，共 {pages} 页",
    "ne": "पृष्ठ {page} / {pages}"
  },
  "Could not load team": {
    "ms": "Pasukan tidak dapat dimuatkan",
    "zh": "无法加载团队",
    "ne": "टोली लोड भएन"
  },
  "Not assigned": {
    "ms": "Belum ditugaskan",
    "zh": "尚未分配",
    "ne": "तोकिएको छैन"
  },
  "Unavailable": {
    "ms": "Tidak tersedia",
    "zh": "暂不可用",
    "ne": "उपलब्ध छैन"
  },
  "Last activity: ": {
    "ms": "Aktiviti terakhir: ",
    "zh": "最近活动：",
    "ne": "पछिल्लो गतिविधि: "
  },
  "No update: ": {
    "ms": "Tanpa kemas kini: ",
    "zh": "未更新时长：",
    "ne": "अद्यावधिक नभएको समय: "
  },
  "In Progress: ": {
    "ms": "Sedang Dijalankan: ",
    "zh": "进行中时长：",
    "ne": "काम भइरहेको समय: "
  },
  "Selected team member": {
    "ms": "Ahli pasukan dipilih",
    "zh": "已选团队成员",
    "ne": "छानिएको टोली सदस्य"
  },
  "you": {
    "ms": "anda",
    "zh": "您",
    "ne": "तपाईं"
  },
  "Job categories": {
    "ms": "Kategori kerja",
    "zh": "工作分类",
    "ne": "कामका वर्गहरू"
  },
  "MRF pages": {
    "ms": "Halaman MRF",
    "zh": "MRF 分页",
    "ne": "MRF पृष्ठहरू"
  },
  "Priority for MRF {number}": {
    "ms": "Keutamaan MRF {number}",
    "zh": "MRF {number} 的优先级",
    "ne": "MRF {number} को प्राथमिकता"
  },
  "admin": {
    "ms": "Pentadbir",
    "zh": "管理员",
    "ne": "प्रशासक"
  },
  "maintenance supervisor": {
    "ms": "Penyelia penyelenggaraan",
    "zh": "维修主管",
    "ne": "मर्मत सुपरभाइजर"
  },
  "maintenance technician": {
    "ms": "Juruteknik penyelenggaraan",
    "zh": "维修技术员",
    "ne": "मर्मत प्राविधिक"
  },
  "maintenance clerk": {
    "ms": "Kerani penyelenggaraan",
    "zh": "维修文员",
    "ne": "मर्मत लिपिक"
  },
  "min": {
    "ms": "min",
    "zh": "分钟",
    "ne": "मिनेट"
  },
  "hr": {
    "ms": "jam",
    "zh": "小时",
    "ne": "घण्टा"
  },
  "day": {
    "ms": "hari",
    "zh": "天",
    "ne": "दिन"
  }
});

export function maintenanceText(
  language: Language,
  text: string,
  values: Record<string, string | number> = {},
): string {
  const translated = language === "en" ? text : translations[text]?.[language] ?? text;
  return translated.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match);
}
