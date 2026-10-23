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

export function actionText(
  language: Language,
  text: string,
  values: Record<string, string | number> = {},
): string {
  const translated = language === "en" ? text : translations[text]?.[language] ?? text;
  return translated.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match);
}
