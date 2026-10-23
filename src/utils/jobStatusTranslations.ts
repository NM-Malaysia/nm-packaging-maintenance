import "server-only";
import type { Language } from "./language";
import { maintenanceText } from "./maintenanceTranslations";

const translations: Record<string, Record<string, string>> = {
  "In Progress": {
    "ms": "Sedang Dijalankan",
    "zh": "进行中",
    "ne": "काम भइरहेको"
  },
  "Waiting for Spare Parts": {
    "ms": "Menunggu Alat Ganti",
    "zh": "等待备件",
    "ne": "स्पेयर पार्ट्सको प्रतीक्षामा"
  },
  "Follow-up Required": {
    "ms": "Perlu Susulan",
    "zh": "需要跟进",
    "ne": "फलो-अप आवश्यक"
  },
  "Update overall job status": {
    "ms": "Kemas kini status keseluruhan kerja",
    "zh": "更新整体工作状态",
    "ne": "समग्र कामको स्थिति अद्यावधिक गर्नुहोस्"
  },
  "New status": {
    "ms": "Status baharu",
    "zh": "新状态",
    "ne": "नयाँ स्थिति"
  },
  "Select status": {
    "ms": "Pilih status",
    "zh": "选择状态",
    "ne": "स्थिति छान्नुहोस्"
  },
  "Reason / outstanding action": {
    "ms": "Sebab / tindakan belum selesai",
    "zh": "原因 / 待处理事项",
    "ne": "कारण / बाँकी काम"
  },
  "For example: Waiting for bearing No. 1234.": {
    "ms": "Contoh: Menunggu galas No. 1234.",
    "zh": "例如：等待1234号轴承。",
    "ne": "उदाहरण: 1234 नम्बरको बेयरिङको प्रतीक्षामा।"
  },
  "Team members must pause or finish their work before changing the job to Waiting for Spare Parts or Follow-up Required.": {
    "ms": "Ahli pasukan mesti menjeda atau menyelesaikan kerja mereka sebelum menukar status kerja kepada Menunggu Alat Ganti atau Perlu Susulan.",
    "zh": "将工作状态改为等待备件或需要跟进前，团队成员必须先暂停或完成自己的工作。",
    "ne": "कामको स्थिति स्पेयर पार्ट्सको प्रतीक्षामा वा फलो-अप आवश्यकमा बदल्नुअघि टोली सदस्यहरूले आफ्नो काम रोक्न वा पूरा गर्नुपर्छ।"
  },
  "Save job status": {
    "ms": "Simpan status kerja",
    "zh": "保存工作状态",
    "ne": "कामको स्थिति बचत गर्नुहोस्"
  },
  "Job status history": {
    "ms": "Sejarah status kerja",
    "zh": "工作状态历史",
    "ne": "कामको स्थिति इतिहास"
  },
  "Status history could not be loaded. Please refresh.": {
    "ms": "Sejarah status tidak dapat dimuatkan. Sila muat semula.",
    "zh": "无法加载状态历史，请刷新。",
    "ne": "स्थिति इतिहास लोड भएन। कृपया रिफ्रेस गर्नुहोस्।"
  },
  "Malaysia time": {
    "ms": "Waktu Malaysia",
    "zh": "马来西亚时间",
    "ne": "मलेसियाको समय"
  },
  "No supervisor status changes recorded yet.": {
    "ms": "Belum ada perubahan status oleh penyelia direkodkan.",
    "zh": "尚未记录主管的状态变更。",
    "ne": "सुपरभाइजरले गरेका स्थिति परिवर्तनहरू अझै रेकर्ड भएका छैनन्।"
  }
};

// Additional history status translations
Object.assign(translations, {
  "repair completed": {
    "ms": "Pembaikan Selesai",
    "zh": "维修已完成",
    "ne": "मर्मत पूरा भएको"
  },
  "handover pending": {
    "ms": "Menunggu Serah Terima",
    "zh": "待交接",
    "ne": "हस्तान्तरण बाँकी"
  },
  "closed": {
    "ms": "Ditutup",
    "zh": "已关闭",
    "ne": "बन्द भएको"
  }
});

export function jobStatusText(language: Language, text: string): string {
  return language === "en" ? text
    : translations[text]?.[language] ?? maintenanceText(language, text);
}
