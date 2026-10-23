import "server-only";
import type { Language } from "./language";

const translations: Record<string, Record<string, string>> = {
  "Your work details could not be loaded. Please refresh.": {
    "ms": "Butiran kerja anda tidak dapat dimuatkan. Sila muat semula.",
    "zh": "无法加载您的工作详情，请刷新。",
    "ne": "तपाईंको कामको विवरण लोड भएन। कृपया रिफ्रेस गर्नुहोस्।"
  },
  "My work details": {
    "ms": "Butiran kerja saya",
    "zh": "我的工作详情",
    "ne": "मेरो कामको विवरण"
  },
  "Work sessions could not be loaded. Refresh to try again.": {
    "ms": "Sesi kerja tidak dapat dimuatkan. Muat semula untuk mencuba lagi.",
    "zh": "无法加载工作时段，请刷新重试。",
    "ne": "कामका सत्रहरू लोड भएनन्। रिफ्रेस गरी फेरि प्रयास गर्नुहोस्।"
  },
  "Finished": {
    "ms": "Selesai",
    "zh": "已完成",
    "ne": "पूरा भएको"
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
  "Working time:": {
    "ms": "Masa bekerja:",
    "zh": "工作时长：",
    "ne": "काम गरेको समय:"
  },
  "Excludes paused time. Refresh to update the duration.": {
    "ms": "Tidak termasuk masa jeda. Muat semula untuk mengemas kini tempoh.",
    "zh": "不包括暂停时间。刷新以更新时长。",
    "ne": "रोकिएको समय समावेश छैन। समयावधि अद्यावधिक गर्न रिफ्रेस गर्नुहोस्।"
  },
  "Pause Work": {
    "ms": "Jeda Kerja",
    "zh": "暂停工作",
    "ne": "काम रोक्नुहोस्"
  },
  "Resume Work": {
    "ms": "Sambung Kerja",
    "zh": "继续工作",
    "ne": "काम पुनः सुरु गर्नुहोस्"
  },
  "Save any edited work details before pausing or resuming.": {
    "ms": "Simpan butiran kerja yang disunting sebelum menjeda atau menyambung.",
    "zh": "暂停或继续前，请先保存已编辑的工作详情。",
    "ne": "रोक्नु वा पुनः सुरु गर्नुअघि सम्पादित कामको विवरण बचत गर्नुहोस्।"
  },
  "Work sessions": {
    "ms": "Sesi kerja",
    "zh": "工作时段",
    "ne": "कामका सत्रहरू"
  },
  "Malaysia time": {
    "ms": "Waktu Malaysia",
    "zh": "马来西亚时间",
    "ne": "मलेसियाको समय"
  },
  "Your work finished:": {
    "ms": "Kerja anda selesai:",
    "zh": "您的工作完成时间：",
    "ne": "तपाईंको काम पूरा भएको समय:"
  },
  "Record your inspection, repair actions and findings.": {
    "ms": "Rekodkan pemeriksaan, tindakan pembaikan dan penemuan anda.",
    "zh": "记录您的检查、维修措施和发现。",
    "ne": "आफ्नो निरीक्षण, मर्मत कार्य र भेटिएका कुराहरू रेकर्ड गर्नुहोस्।"
  },
  "Finish My Work records your completion time and locks your entry. The overall request status stays unchanged for supervisor review.": {
    "ms": "Selesaikan Kerja Saya merekodkan masa penyelesaian anda dan mengunci catatan. Status keseluruhan permintaan kekal untuk semakan penyelia.",
    "zh": "“完成我的工作”会记录您的完成时间并锁定记录。申请整体状态保持不变，等待主管审核。",
    "ne": "मेरो काम पूरा गर्नुहोस् बटनले तपाईंको काम पूरा भएको समय रेकर्ड गरी प्रविष्टि लक गर्छ। सुपरभाइजरको समीक्षाका लागि समग्र अनुरोधको स्थिति परिवर्तन हुँदैन।"
  },
  "Save Work Details": {
    "ms": "Simpan Butiran Kerja",
    "zh": "保存工作详情",
    "ne": "कामको विवरण बचत गर्नुहोस्"
  },
  "Finish My Work": {
    "ms": "Selesaikan Kerja Saya",
    "zh": "完成我的工作",
    "ne": "मेरो काम पूरा गर्नुहोस्"
  },
  "No work details recorded.": {
    "ms": "Tiada butiran kerja direkodkan.",
    "zh": "尚未记录工作详情。",
    "ne": "कामको विवरण रेकर्ड गरिएको छैन।"
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

export function workDetailsText(language: Language, text: string): string {
  return language === "en" ? text : translations[text]?.[language] ?? text;
}
