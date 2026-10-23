import "server-only";
import type { Language } from "./language";

const translations: Record<string, Record<string, string>> = {
  "Repair completion details could not be loaded. Please refresh.": {
    "ms": "Butiran penyelesaian pembaikan tidak dapat dimuatkan. Sila muat semula.",
    "zh": "无法加载维修完成详情，请刷新。",
    "ne": "मर्मत पूरा भएको विवरण लोड भएन। कृपया रिफ्रेस गर्नुहोस्।"
  },
  "Temporary repair follow-up could not be checked. Please refresh.": {
    "ms": "Susulan pembaikan sementara tidak dapat disemak. Sila muat semula.",
    "zh": "无法检查临时维修跟进，请刷新。",
    "ne": "अस्थायी मर्मतको फलो-अप जाँच गर्न सकिएन। कृपया रिफ्रेस गर्नुहोस्।"
  },
  "Overall repair completion is blocked while temporary repair follow-up is pending. Complete and review the linked permanent-repair task, then resolve the follow-up.": {
    "ms": "Penyelesaian keseluruhan pembaikan disekat selagi susulan pembaikan sementara belum selesai. Lengkapkan dan semak tugasan pembaikan kekal yang dipautkan, kemudian selesaikan susulan.",
    "zh": "临时维修跟进未解决前，无法确认整体维修完成。请完成并审核关联的永久维修任务，再解决跟进。",
    "ne": "अस्थायी मर्मतको फलो-अप बाँकी हुँदा समग्र मर्मत पूरा भएको पुष्टि गर्न मिल्दैन। जोडिएको स्थायी मर्मत कार्य पूरा गरी समीक्षा गर्नुहोस्, त्यसपछि फलो-अप समाधान गर्नुहोस्।"
  },
  "Overall repair completion recorded": {
    "ms": "Penyelesaian keseluruhan pembaikan direkodkan",
    "zh": "已记录整体维修完成",
    "ne": "समग्र मर्मत पूरा भएको रेकर्ड गरियो"
  },
  "Confirmed:": {
    "ms": "Disahkan:",
    "zh": "确认时间：",
    "ne": "पुष्टि भएको समय:"
  },
  "Machine restored:": {
    "ms": "Mesin kembali beroperasi:",
    "zh": "机器恢复运行时间：",
    "ne": "मेसिन पुनः सञ्चालन भएको समय:"
  },
  "Malaysia time": {
    "ms": "Waktu Malaysia",
    "zh": "马来西亚时间",
    "ne": "मलेसियाको समय"
  },
  "Machine downtime:": {
    "ms": "Masa henti mesin:",
    "zh": "机器停机时长：",
    "ne": "मेसिन बन्द रहेको समय:"
  },
  "minutes (rounded up).": {
    "ms": "minit (dibundarkan ke atas).",
    "zh": "分钟（向上取整）。",
    "ne": "मिनेट (माथिल्लो पूर्ण मिनेटमा गणना गरिएको)।"
  },
  "Final approvals and handover are separate from repair completion.": {
    "ms": "Kelulusan akhir dan serah terima adalah berasingan daripada penyelesaian pembaikan.",
    "zh": "最终审批和交接须在维修完成后另行办理。",
    "ne": "अन्तिम स्वीकृति र हस्तान्तरण मर्मत पूरा भएको पुष्टिबाट अलग चरण हुन्।"
  },
  "Overall Repair Completion": {
    "ms": "Penyelesaian Keseluruhan Pembaikan",
    "zh": "整体维修完成确认",
    "ne": "समग्र मर्मत पूरा भएको पुष्टि"
  },
  "Complete and review all tasks and finish all personal work first. This changes the MRF to Repair Completed; handover remains pending.": {
    "ms": "Lengkapkan dan semak semua tugasan serta selesaikan semua kerja individu dahulu. Ini menukar status MRF kepada Pembaikan Selesai; serah terima masih belum selesai.",
    "zh": "请先完成并审核所有任务，且所有人员须完成各自工作。此操作将MRF设为维修已完成，交接仍待办理。",
    "ne": "पहिले सबै कार्य पूरा गरी समीक्षा गर्नुहोस् र सबै व्यक्तिगत काम सक्नुहोस्। यसले MRF लाई मर्मत पूरा भएको स्थितिमा राख्छ; हस्तान्तरण अझै बाँकी रहन्छ।"
  },
  "Repair summary and test results": {
    "ms": "Ringkasan pembaikan dan keputusan ujian",
    "zh": "维修总结与测试结果",
    "ne": "मर्मत सारांश र परीक्षण नतिजा"
  },
  "Downtime started:": {
    "ms": "Masa henti bermula:",
    "zh": "停机开始时间：",
    "ne": "मेसिन बन्द हुन सुरु भएको समय:"
  },
  "Not recorded — this must be corrected before completion.": {
    "ms": "Belum direkodkan — ini mesti dibetulkan sebelum penyelesaian.",
    "zh": "未记录 — 确认完成前必须补正。",
    "ne": "रेकर्ड गरिएको छैन — पूरा भएको पुष्टि गर्नुअघि सच्याउनुपर्छ।"
  },
  "Actual machine restoration time — Malaysia time": {
    "ms": "Masa sebenar mesin kembali beroperasi — Waktu Malaysia",
    "zh": "机器实际恢复运行时间 — 马来西亚时间",
    "ne": "मेसिन वास्तवमा पुनः सञ्चालन भएको समय — मलेसियाको समय"
  },
  "Restart already recorded:": {
    "ms": "Masa mula semula telah direkodkan:",
    "zh": "已记录重新运行时间：",
    "ne": "पुनः सञ्चालन समय पहिले नै रेकर्ड गरिएको छ:"
  },
  "This time will be preserved.": {
    "ms": "Masa ini akan dikekalkan.",
    "zh": "此时间将予以保留。",
    "ne": "यो समय कायम राखिनेछ।"
  },
  "Enter when the machine actually returned to operation. This is separate from staff working time.": {
    "ms": "Masukkan masa mesin benar-benar kembali beroperasi. Ini berasingan daripada masa bekerja kakitangan.",
    "zh": "请填写机器实际恢复运行的时间。此时间与人员工作时长分别记录。",
    "ne": "मेसिन वास्तवमा पुनः सञ्चालन भएको समय भर्नुहोस्। यो कर्मचारीको काम गरेको समयभन्दा अलग हो।"
  },
  "I have reviewed the work, verified repair completion and recorded the test results.": {
    "ms": "Saya telah menyemak kerja, mengesahkan pembaikan selesai dan merekodkan keputusan ujian.",
    "zh": "我已审核工作、确认维修完成，并记录测试结果。",
    "ne": "मैले कामको समीक्षा गरी मर्मत पूरा भएको प्रमाणित गरेको छु र परीक्षण नतिजा रेकर्ड गरेको छु।"
  },
  "Confirm Repair Completed": {
    "ms": "Sahkan Pembaikan Selesai",
    "zh": "确认维修完成",
    "ne": "मर्मत पूरा भएको पुष्टि गर्नुहोस्"
  }
};

export function repairCompletionText(language: Language, text: string): string {
  return language === "en" ? text : translations[text]?.[language] ?? text;
}
