import "server-only";
import type { Language } from "./language";

const translations: Record<string, Record<string, string>> = {
  "Task assignment could not be checked. Please refresh.": {
    "ms": "Penugasan tugasan tidak dapat disemak. Sila muat semula.",
    "zh": "无法检查任务分配，请刷新。",
    "ne": "कार्यको जिम्मेवारी जाँच गर्न सकिएन। कृपया रिफ्रेस गर्नुहोस्।"
  },
  "Your task record could not be loaded. Please refresh.": {
    "ms": "Rekod tugasan anda tidak dapat dimuatkan. Sila muat semula.",
    "zh": "无法加载您的任务记录，请刷新。",
    "ne": "तपाईंको कार्य अभिलेख लोड भएन। कृपया रिफ्रेस गर्नुहोस्।"
  },
  "Start Task": {
    "ms": "Mula Tugasan",
    "zh": "开始任务",
    "ne": "कार्य सुरु गर्नुहोस्"
  },
  "This task is completed.": {
    "ms": "Tugasan ini telah selesai.",
    "zh": "此任务已完成。",
    "ne": "यो कार्य पूरा भएको छ।"
  },
  "Task not started. Supervisor must set the MRF to In Progress before you start.": {
    "ms": "Tugasan belum bermula. Penyelia mesti menetapkan MRF kepada Sedang Dijalankan sebelum anda bermula.",
    "zh": "任务尚未开始。开始前，主管须将MRF设为进行中。",
    "ne": "कार्य सुरु भएको छैन। सुरु गर्नुअघि सुपरभाइजरले MRF लाई काम भइरहेको अवस्थामा राख्नुपर्छ।"
  },
  "My work on this task": {
    "ms": "Kerja saya untuk tugasan ini",
    "zh": "我在此任务中的工作",
    "ne": "यस कार्यमा मेरो काम"
  },
  "Started:": {
    "ms": "Mula:",
    "zh": "开始时间：",
    "ne": "सुरु भएको समय:"
  },
  "Malaysia time": {
    "ms": "Waktu Malaysia",
    "zh": "马来西亚时间",
    "ne": "मलेसियाको समय"
  },
  "Sessions could not be loaded.": {
    "ms": "Sesi kerja tidak dapat dimuatkan.",
    "zh": "无法加载工作时段。",
    "ne": "कामका सत्रहरू लोड भएनन्।"
  },
  "My part finished": {
    "ms": "Bahagian saya selesai",
    "zh": "我的部分已完成",
    "ne": "मेरो भाग पूरा भयो"
  },
  "Working": {
    "ms": "Sedang bekerja",
    "zh": "工作中",
    "ne": "काम भइरहेको"
  },
  "Paused": {
    "ms": "Dijeda",
    "zh": "已暂停",
    "ne": "रोकिएको"
  },
  "Excludes pauses. Refresh to update working time.": {
    "ms": "Tidak termasuk masa jeda. Muat semula untuk mengemas kini masa bekerja.",
    "zh": "不包括暂停时间。刷新以更新工作时长。",
    "ne": "रोकिएको समय समावेश छैन। कामको समय अद्यावधिक गर्न रिफ्रेस गर्नुहोस्।"
  },
  "Pause Task": {
    "ms": "Jeda Tugasan",
    "zh": "暂停任务",
    "ne": "कार्य रोक्नुहोस्"
  },
  "Resume Task": {
    "ms": "Sambung Tugasan",
    "zh": "继续任务",
    "ne": "कार्य पुनः सुरु गर्नुहोस्"
  },
  "Save edited notes before pausing or resuming.": {
    "ms": "Simpan catatan yang disunting sebelum menjeda atau menyambung.",
    "zh": "暂停或继续前，请先保存已编辑的备注。",
    "ne": "रोक्नु वा पुनः सुरु गर्नुअघि सम्पादित टिप्पणी बचत गर्नुहोस्।"
  },
  "Task work sessions": {
    "ms": "Sesi kerja tugasan",
    "zh": "任务工作时段",
    "ne": "कार्यका काम सत्रहरू"
  },
  "My part finished:": {
    "ms": "Bahagian saya selesai:",
    "zh": "我的部分完成时间：",
    "ne": "मेरो भाग पूरा भएको समय:"
  },
  "Awaiting supervisor review of the task.": {
    "ms": "Menunggu semakan penyelia bagi tugasan ini.",
    "zh": "等待主管审核此任务。",
    "ne": "कार्यको सुपरभाइजर समीक्षाको प्रतीक्षामा।"
  },
  "My task work details": {
    "ms": "Butiran kerja tugasan saya",
    "zh": "我的任务工作详情",
    "ne": "मेरो कार्यको काम विवरण"
  },
  "Finish My Part records your completion and locks your notes. The supervisor reviews the overall task separately.": {
    "ms": "Selesaikan Bahagian Saya merekodkan penyelesaian anda dan mengunci catatan. Penyelia menyemak keseluruhan tugasan secara berasingan.",
    "zh": "“完成我的部分”会记录您的完成时间并锁定备注。主管将另行审核整体任务。",
    "ne": "मेरो भाग पूरा गर्नुहोस् बटनले तपाईंको काम पूरा भएको रेकर्ड गरी टिप्पणी लक गर्छ। सुपरभाइजरले समग्र कार्यको अलग समीक्षा गर्छन्।"
  },
  "Save Task Notes": {
    "ms": "Simpan Catatan Tugasan",
    "zh": "保存任务备注",
    "ne": "कार्य टिप्पणी बचत गर्नुहोस्"
  },
  "Finish My Part": {
    "ms": "Selesaikan Bahagian Saya",
    "zh": "完成我的部分",
    "ne": "मेरो भाग पूरा गर्नुहोस्"
  },
  "No task notes recorded.": {
    "ms": "Tiada catatan tugasan direkodkan.",
    "zh": "尚未记录任务备注。",
    "ne": "कुनै कार्य टिप्पणी रेकर्ड गरिएको छैन।"
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

export function taskWorkText(language: Language, text: string): string {
  return language === "en" ? text : translations[text]?.[language] ?? text;
}
