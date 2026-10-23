import "server-only";
import type { Language } from "./language";

const translations: Record<string, Record<string, string>> = {
  "My Actions": {
    "ms": "Tindakan Saya",
    "zh": "我的待办",
    "ne": "मेरा कार्यहरू"
  },
  "Notifications unavailable. Open My Actions.": {
    "ms": "Notifikasi tidak tersedia. Buka Tindakan Saya.",
    "zh": "通知暂不可用。请打开我的待办。",
    "ne": "सूचनाहरू उपलब्ध छैनन्। मेरा कार्यहरू खोल्नुहोस्।"
  },
  "My Actions, {count} unread": {
    "ms": "Tindakan Saya, {count} belum dibaca",
    "zh": "我的待办，{count} 项未读",
    "ne": "मेरा कार्यहरू, {count} नपढिएका"
  },
  "Unavailable": {
    "ms": "Tidak tersedia",
    "zh": "暂不可用",
    "ne": "उपलब्ध छैन"
  },
  "View all →": {
    "ms": "Lihat semua →",
    "zh": "查看全部 →",
    "ne": "सबै हेर्नुहोस् →"
  },
  "Actions are temporarily unavailable.": {
    "ms": "Tindakan tidak tersedia buat sementara waktu.",
    "zh": "待办暂时不可用。",
    "ne": "कार्यहरू अस्थायी रूपमा उपलब्ध छैनन्।"
  },
  "{total} outstanding · {unread} unread": {
    "ms": "{total} belum selesai · {unread} belum dibaca",
    "zh": "{total} 项待办 · {unread} 项未读",
    "ne": "{total} बाँकी · {unread} नपढिएका"
  },
  "Reading clears the unread indicator. The action remains until the required work is completed. Refresh to update.": {
    "ms": "Membaca memadam penanda belum dibaca. Tindakan kekal sehingga kerja yang diperlukan selesai. Muat semula untuk kemas kini.",
    "zh": "阅读后会清除未读标记。完成所需工作后，待办才会消失。刷新页面以更新。",
    "ne": "पढेपछि नपढिएको चिन्ह हट्छ। आवश्यक काम पूरा नभएसम्म कार्य रहन्छ। अद्यावधिक गर्न रिफ्रेस गर्नुहोस्।"
  },
  "Your actions could not be loaded. Please refresh.": {
    "ms": "Tindakan anda tidak dapat dimuatkan. Sila muat semula.",
    "zh": "无法加载您的待办。请刷新页面。",
    "ne": "तपाईंका कार्यहरू लोड भएनन्। कृपया रिफ्रेस गर्नुहोस्।"
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
  "Unread": {
    "ms": "Belum dibaca",
    "zh": "未读",
    "ne": "नपढिएको"
  },
  "Read": {
    "ms": "Dibaca",
    "zh": "已读",
    "ne": "पढिएको"
  },
  "Action waiting": {
    "ms": "Tempoh menunggu tindakan",
    "zh": "待处理时长",
    "ne": "कार्य पर्खिएको समय"
  },
  "Since": {
    "ms": "Sejak",
    "zh": "开始于",
    "ne": "देखि"
  },
  "Malaysia time": {
    "ms": "Waktu Malaysia",
    "zh": "马来西亚时间",
    "ne": "मलेसिया समय"
  },
  "Mark as read": {
    "ms": "Tandakan telah dibaca",
    "zh": "标为已读",
    "ne": "पढिएको चिन्ह लगाउनुहोस्"
  },
  "No outstanding actions for your account.": {
    "ms": "Tiada tindakan belum selesai untuk akaun anda.",
    "zh": "您的账户暂无待办。",
    "ne": "तपाईंको खातामा कुनै बाँकी कार्य छैन।"
  },
  "No actions on this page. Return to page 1.": {
    "ms": "Tiada tindakan di halaman ini. Kembali ke halaman 1.",
    "zh": "本页没有待办。请返回第 1 页。",
    "ne": "यस पृष्ठमा कुनै कार्य छैन। पृष्ठ १ मा फर्कनुहोस्।"
  },
  "View all {count} actions →": {
    "ms": "Lihat semua {count} tindakan →",
    "zh": "查看全部 {count} 项待办 →",
    "ne": "सबै {count} कार्य हेर्नुहोस् →"
  },
  "Action pages": {
    "ms": "Halaman tindakan",
    "zh": "待办分页",
    "ne": "कार्य पृष्ठहरू"
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
  },
  "Page {page} of {pages}": {
    "ms": "Halaman {page} daripada {pages}",
    "zh": "第 {page} 页，共 {pages} 页",
    "ne": "पृष्ठ {page} / {pages}"
  },
  "← Dashboard": {
    "ms": "← Papan Pemuka",
    "zh": "← 仪表板",
    "ne": "← ड्यासबोर्ड"
  },
  "Notifications & My Actions": {
    "ms": "Notifikasi & Tindakan Saya",
    "zh": "通知与我的待办",
    "ne": "सूचनाहरू र मेरा कार्यहरू"
  },
  "The action changed or could not be marked as read. Check the current list and try again.": {
    "ms": "Tindakan telah berubah atau tidak dapat ditandakan sebagai dibaca. Semak senarai semasa dan cuba lagi.",
    "zh": "待办已变更或无法标为已读。请检查当前列表后重试。",
    "ne": "कार्य परिवर्तन भयो वा पढिएको चिन्ह लगाउन सकिएन। हालको सूची जाँचेर फेरि प्रयास गर्नुहोस्।"
  }
};

// Individual maintenance action translations
Object.assign(translations, {
  "Request needs HOD approval": {
    "ms": "Permohonan memerlukan kelulusan Ketua Jabatan",
    "zh": "申请待部门主管审批",
    "ne": "अनुरोधमा विभाग प्रमुखको स्वीकृति आवश्यक छ"
  },
  "Approved MRF needs a maintenance team": {
    "ms": "MRF diluluskan memerlukan pasukan penyelenggaraan",
    "zh": "已批准的 MRF 待分配维修团队",
    "ne": "स्वीकृत MRF मा मर्मत टोली तोक्न आवश्यक छ"
  },
  "You have an assigned maintenance job": {
    "ms": "Anda mempunyai kerja penyelenggaraan yang ditugaskan",
    "zh": "您有一项已分配的维修工作",
    "ne": "तपाईंलाई मर्मत कार्य तोकिएको छ"
  },
  "Your maintenance work is unfinished": {
    "ms": "Kerja penyelenggaraan anda belum selesai",
    "zh": "您的维修工作尚未完成",
    "ne": "तपाईंको मर्मत कार्य अझै पूरा भएको छैन"
  },
  "Recorded work is finished: review overall repair": {
    "ms": "Kerja yang direkodkan selesai: semak keseluruhan pembaikan",
    "zh": "已记录的工作已完成：请审核整体维修",
    "ne": "अभिलेख गरिएको काम सकियो: समग्र मर्मत समीक्षा गर्नुहोस्"
  },
  "Completed repair needs manager approval": {
    "ms": "Pembaikan selesai memerlukan kelulusan pengurus",
    "zh": "已完成的维修待经理审批",
    "ne": "सम्पन्न मर्मतमा प्रबन्धकको स्वीकृति आवश्यक छ"
  },
  "Completed repair needs your department HOD approval": {
    "ms": "Pembaikan selesai memerlukan kelulusan Ketua Jabatan anda",
    "zh": "已完成的维修待您部门主管审批",
    "ne": "सम्पन्न मर्मतमा तपाईंको विभाग प्रमुखको स्वीकृति आवश्यक छ"
  },
  "Verified checklist: maintenance handover needs signing": {
    "ms": "Senarai semak disahkan: serahan penyelenggaraan perlu ditandatangani",
    "zh": "检查清单已核实：待维修方签署交接",
    "ne": "जाँचसूची प्रमाणित: मर्मत हस्तान्तरणमा हस्ताक्षर आवश्यक छ"
  },
  "Handover checklist needs verification": {
    "ms": "Senarai semak serahan perlu disahkan",
    "zh": "交接检查清单待核实",
    "ne": "हस्तान्तरण जाँचसूची प्रमाणित गर्न आवश्यक छ"
  },
  "Maintenance handover is signed: inspect and accept": {
    "ms": "Serahan penyelenggaraan ditandatangani: periksa dan terima",
    "zh": "维修方已签署交接：请检查并验收",
    "ne": "मर्मत हस्तान्तरणमा हस्ताक्षर भयो: निरीक्षण गरी स्वीकार गर्नुहोस्"
  },
  "Review request": {
    "ms": "Semak permohonan",
    "zh": "审核申请",
    "ne": "अनुरोध समीक्षा गर्नुहोस्"
  },
  "Assign team": {
    "ms": "Tugaskan pasukan",
    "zh": "分配团队",
    "ne": "टोली तोक्नुहोस्"
  },
  "View / start work": {
    "ms": "Lihat / mula kerja",
    "zh": "查看／开始工作",
    "ne": "काम हेर्नुहोस् / सुरु गर्नुहोस्"
  },
  "View / continue work": {
    "ms": "Lihat / teruskan kerja",
    "zh": "查看／继续工作",
    "ne": "काम हेर्नुहोस् / जारी राख्नुहोस्"
  },
  "View / start task": {
    "ms": "Lihat / mula tugas",
    "zh": "查看／开始任务",
    "ne": "कार्य हेर्नुहोस् / सुरु गर्नुहोस्"
  },
  "View / continue task": {
    "ms": "Lihat / teruskan tugas",
    "zh": "查看／继续任务",
    "ne": "कार्य हेर्नुहोस् / जारी राख्नुहोस्"
  },
  "Review task": {
    "ms": "Semak tugas",
    "zh": "审核任务",
    "ne": "कार्य समीक्षा गर्नुहोस्"
  },
  "Review repair": {
    "ms": "Semak pembaikan",
    "zh": "审核维修",
    "ne": "मर्मत समीक्षा गर्नुहोस्"
  },
  "Review repair approval": {
    "ms": "Semak kelulusan pembaikan",
    "zh": "审核维修完成审批",
    "ne": "मर्मत स्वीकृति समीक्षा गर्नुहोस्"
  },
  "Open handover": {
    "ms": "Buka serahan",
    "zh": "查看交接",
    "ne": "हस्तान्तरण खोल्नुहोस्"
  },
  "Review / accept handover": {
    "ms": "Semak / terima serahan",
    "zh": "审核／验收交接",
    "ne": "हस्तान्तरण समीक्षा / स्वीकार गर्नुहोस्"
  },
  "Add MIV number": {
    "ms": "Tambah nombor MIV",
    "zh": "填写 MIV 编号",
    "ne": "MIV नम्बर थप्नुहोस्"
  },
  "Review part": {
    "ms": "Semak alat ganti",
    "zh": "查看备件",
    "ne": "पार्टपुर्जा समीक्षा गर्नुहोस्"
  },
  "Review follow-up": {
    "ms": "Semak susulan",
    "zh": "查看后续跟进",
    "ne": "अनुगमन समीक्षा गर्नुहोस्"
  },
  "Your task is unfinished: ": {
    "ms": "Tugas anda belum selesai: ",
    "zh": "您的任务尚未完成：",
    "ne": "तपाईंको कार्य अझै पूरा भएको छैन: "
  },
  "Team work finished: review task ": {
    "ms": "Kerja pasukan selesai: semak tugas ",
    "zh": "团队工作已完成：请审核任务 ",
    "ne": "टोलीको काम सकियो: कार्य समीक्षा गर्नुहोस् "
  },
  "Check requested part: ": {
    "ms": "Semak alat ganti yang diminta: ",
    "zh": "检查所需备件：",
    "ne": "अनुरोध गरिएको पार्टपुर्जा जाँच्नुहोस्: "
  },
  "Follow up waiting part: ": {
    "ms": "Susuli alat ganti yang ditunggu: ",
    "zh": "跟进等待中的备件：",
    "ne": "पर्खिरहेको पार्टपुर्जा अनुगमन गर्नुहोस्: "
  },
  "Part available: arrange issue — ": {
    "ms": "Alat ganti tersedia: atur pengeluaran — ",
    "zh": "备件已到位：安排领用 — ",
    "ne": "पार्टपुर्जा उपलब्ध: जारी गर्ने व्यवस्था गर्नुहोस् — "
  },
  "Add MIV number for issued part: ": {
    "ms": "Tambah nombor MIV bagi alat ganti yang dikeluarkan: ",
    "zh": "已领用备件待填写 MIV 编号：",
    "ne": "जारी गरिएको पार्टपुर्जाको MIV नम्बर थप्नुहोस्: "
  },
  "Permanent repair follow-up due ": {
    "ms": "Tarikh sasaran susulan pembaikan kekal: ",
    "zh": "永久维修跟进目标日期：",
    "ne": "स्थायी मर्मत अनुगमनको लक्षित मिति: "
  }
});

export function actionText(
  language: Language,
  text: string,
  values: Record<string, string | number> = {},
): string {
  const translated = language === "en" ? text : translations[text]?.[language] ?? text;
  return translated.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match);
}

const titlePrefixes: string[] = ["Your task is unfinished: ", "Team work finished: review task ", "Check requested part: ", "Follow up waiting part: ", "Part available: arrange issue — ", "Add MIV number for issued part: ", "Permanent repair follow-up due "];

export function actionTitle(language: Language, title: string): string {
  if (language === "en") return title;
  const exact = translations[title]?.[language];
  if (exact !== undefined) return exact;
  for (const prefix of titlePrefixes) {
    if (title.startsWith(prefix)) {
      return (translations[prefix]?.[language] ?? prefix) + title.slice(prefix.length);
    }
  }
  return title;
}
