import "server-only";
import type { Language } from "./language";

const translations: Record<string, Record<string, string>> = {
  "Task review could not be loaded. Please refresh.": {
    "ms": "Semakan tugasan tidak dapat dimuatkan. Sila muat semula.",
    "zh": "无法加载任务审核，请刷新。",
    "ne": "कार्य समीक्षा लोड भएन। कृपया रिफ्रेस गर्नुहोस्।"
  },
  "Supervisor task review": {
    "ms": "Semakan tugasan oleh penyelia",
    "zh": "主管任务审核",
    "ne": "सुपरभाइजरको कार्य समीक्षा"
  },
  "Assigned team member": {
    "ms": "Ahli pasukan yang ditugaskan",
    "zh": "已分配的团队成员",
    "ne": "जिम्मेवारी दिइएको टोली सदस्य"
  },
  "Not started": {
    "ms": "Belum bermula",
    "zh": "未开始",
    "ne": "सुरु नभएको"
  },
  "Personal work finished": {
    "ms": "Kerja individu selesai",
    "zh": "个人工作已完成",
    "ne": "व्यक्तिगत काम पूरा भएको"
  },
  "Personal work unfinished": {
    "ms": "Kerja individu belum selesai",
    "zh": "个人工作未完成",
    "ne": "व्यक्तिगत काम अधुरो"
  },
  "Started:": {
    "ms": "Mula:",
    "zh": "开始时间：",
    "ne": "सुरु भएको समय:"
  },
  "Finished:": {
    "ms": "Selesai:",
    "zh": "完成时间：",
    "ne": "पूरा भएको समय:"
  },
  "Malaysia time": {
    "ms": "Waktu Malaysia",
    "zh": "马来西亚时间",
    "ne": "मलेसियाको समय"
  },
  "Working time:": {
    "ms": "Masa bekerja:",
    "zh": "工作时长：",
    "ne": "काम गरेको समय:"
  },
  "Unavailable": {
    "ms": "Tidak tersedia",
    "zh": "无法获取",
    "ne": "उपलब्ध छैन"
  },
  "excludes pauses": {
    "ms": "tidak termasuk masa jeda",
    "zh": "不包括暂停时间",
    "ne": "रोकिएको समय समावेश छैन"
  },
  "No work details recorded.": {
    "ms": "Tiada butiran kerja direkodkan.",
    "zh": "尚未记录工作详情。",
    "ne": "कामको विवरण रेकर्ड गरिएको छैन।"
  },
  "Task completed after review": {
    "ms": "Tugasan selesai selepas semakan",
    "zh": "任务经审核后已完成",
    "ne": "समीक्षापछि कार्य पूरा भयो"
  },
  "Review / verification notes": {
    "ms": "Catatan semakan / pengesahan",
    "zh": "审核 / 验证备注",
    "ne": "समीक्षा / प्रमाणीकरण टिप्पणी"
  },
  "I have reviewed the work and verified this task is complete.": {
    "ms": "Saya telah menyemak kerja dan mengesahkan tugasan ini selesai.",
    "zh": "我已审核工作并确认此任务完成。",
    "ne": "मैले कामको समीक्षा गरी यो कार्य पूरा भएको प्रमाणित गरेको छु।"
  },
  "This completes this task only. The overall MRF stays open.": {
    "ms": "Ini menyelesaikan tugasan ini sahaja. MRF keseluruhan kekal terbuka.",
    "zh": "此操作仅完成本任务，整体MRF仍保持开放。",
    "ne": "यसले यो कार्य मात्र पूरा गर्छ। समग्र MRF खुला रहन्छ।"
  },
  "Confirm Task Completed": {
    "ms": "Sahkan Tugasan Selesai",
    "zh": "确认任务完成",
    "ne": "कार्य पूरा भएको पुष्टि गर्नुहोस्"
  },
  "Every assigned person must finish their part with notes before task completion can be confirmed. Refresh after they finish.": {
    "ms": "Setiap orang yang ditugaskan mesti menyelesaikan bahagian mereka dengan catatan sebelum penyelesaian tugasan boleh disahkan. Muat semula selepas mereka selesai.",
    "zh": "确认任务完成前，每位已分配人员都必须完成自己的部分并填写备注。完成后请刷新。",
    "ne": "कार्य पूरा भएको पुष्टि गर्नुअघि जिम्मेवारी पाएका प्रत्येक व्यक्तिले टिप्पणीसहित आफ्नो भाग पूरा गर्नुपर्छ। उनीहरूले पूरा गरेपछि रिफ्रेस गर्नुहोस्।"
  },
  "Work-session data could not be loaded.": {
    "ms": "Data sesi kerja tidak dapat dimuatkan.",
    "zh": "无法加载工作时段数据。",
    "ne": "कामका सत्रहरूको विवरण लोड भएन।"
  },
  "Task completion review becomes available when the task and MRF are both In Progress.": {
    "ms": "Semakan penyelesaian tugasan tersedia apabila tugasan dan MRF kedua-duanya berstatus Sedang Dijalankan.",
    "zh": "任务和MRF均处于进行中时，才可进行任务完成审核。",
    "ne": "कार्य र MRF दुवै काम भइरहेको अवस्थामा हुँदा कार्य पूरा भएको समीक्षा उपलब्ध हुन्छ।"
  },
  "h": {
    "ms": "j",
    "zh": "小时",
    "ne": "घण्टा"
  },
  "m": {
    "ms": "min",
    "zh": "分",
    "ne": "मिनेट"
  },
  "s": {
    "ms": "s",
    "zh": "秒",
    "ne": "सेकेन्ड"
  }
};

export function taskReviewText(language: Language, text: string): string {
  return language === "en" ? text : translations[text]?.[language] ?? text;
}
