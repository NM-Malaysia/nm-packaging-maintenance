import "server-only";
import type { Language } from "./language";

const translations: Record<string, Record<string, string>> = {
  "Temporary repair records could not be loaded. Please refresh.": {
    "ms": "Rekod pembaikan sementara tidak dapat dimuatkan. Sila muat semula.",
    "zh": "无法加载临时维修记录，请刷新。",
    "ne": "अस्थायी मर्मतका अभिलेख लोड भएनन्। कृपया रिफ्रेस गर्नुहोस्।"
  },
  "Temporary repair & permanent follow-up": {
    "ms": "Pembaikan sementara & susulan pembaikan kekal",
    "zh": "临时维修与永久维修跟进",
    "ne": "अस्थायी मर्मत र स्थायी मर्मतको फलो-अप"
  },
  "Permanent repair follow-up resolved": {
    "ms": "Susulan pembaikan kekal diselesaikan",
    "zh": "永久维修跟进已解决",
    "ne": "स्थायी मर्मतको फलो-अप समाधान भयो"
  },
  "Temporary Repair — Follow-up Pending": {
    "ms": "Pembaikan Sementara — Susulan Belum Selesai",
    "zh": "临时维修 — 待跟进",
    "ne": "अस्थायी मर्मत — फलो-अप बाँकी"
  },
  "Machine restarted:": {
    "ms": "Mesin dimulakan semula:",
    "zh": "机器重新运行时间：",
    "ne": "मेसिन पुनः सञ्चालन भएको समय:"
  },
  "Malaysia time": {
    "ms": "Waktu Malaysia",
    "zh": "马来西亚时间",
    "ne": "मलेसियाको समय"
  },
  "Responsible:": {
    "ms": "Penanggungjawab:",
    "zh": "负责人：",
    "ne": "जिम्मेवार व्यक्ति:"
  },
  "Could not load name": {
    "ms": "Nama tidak dapat dimuatkan",
    "zh": "无法加载姓名",
    "ne": "नाम लोड भएन"
  },
  "See linked permanent-repair task": {
    "ms": "Lihat tugasan pembaikan kekal yang dipautkan",
    "zh": "请查看关联的永久维修任务",
    "ne": "जोडिएको स्थायी मर्मत कार्य हेर्नुहोस्"
  },
  "Target date:": {
    "ms": "Tarikh sasaran:",
    "zh": "目标日期：",
    "ne": "लक्षित मिति:"
  },
  "OVERDUE": {
    "ms": "LEWAT TEMPOH",
    "zh": "已逾期",
    "ne": "म्याद नाघेको"
  },
  "Resolved:": {
    "ms": "Diselesaikan:",
    "zh": "解决时间：",
    "ne": "समाधान भएको समय:"
  },
  "MRF stays open. Repair completion and closure are blocked until this follow-up is resolved.": {
    "ms": "MRF kekal terbuka. Pembaikan tidak boleh disahkan selesai dan MRF tidak boleh ditutup sehingga susulan ini diselesaikan.",
    "zh": "MRF保持开放。此跟进解决前，无法确认维修完成或关闭MRF。",
    "ne": "MRF खुला रहन्छ। यो फलो-अप समाधान नभएसम्म मर्मत पूरा भएको पुष्टि गर्न वा MRF बन्द गर्न मिल्दैन।"
  },
  "Permanent repair verification notes": {
    "ms": "Catatan pengesahan pembaikan kekal",
    "zh": "永久维修验证备注",
    "ne": "स्थायी मर्मत प्रमाणीकरण टिप्पणी"
  },
  "I verified that the permanent repair is complete and the temporary fix is no longer outstanding.": {
    "ms": "Saya telah mengesahkan pembaikan kekal selesai dan tiada lagi pembaikan sementara yang belum diselesaikan.",
    "zh": "我已确认永久维修完成，临时维修已无待处理事项。",
    "ne": "मैले स्थायी मर्मत पूरा भएको र अस्थायी मर्मतको कुनै काम बाँकी नरहेको प्रमाणित गरेको छु।"
  },
  "Resolve Temporary Repair Follow-up": {
    "ms": "Selesaikan Susulan Pembaikan Sementara",
    "zh": "解决临时维修跟进",
    "ne": "अस्थायी मर्मतको फलो-अप समाधान गर्नुहोस्"
  },
  "Overall Repair Completion remains a separate step.": {
    "ms": "Pengesahan keseluruhan pembaikan selesai masih merupakan langkah berasingan.",
    "zh": "整体维修完成确认仍需另行操作。",
    "ne": "समग्र मर्मत पूरा भएको पुष्टि गर्ने चरण अलग छ।"
  },
  "Set the MRF to In Progress, complete the linked “Permanent repair after temporary fix” task and confirm its supervisor review. Then return here to resolve the follow-up.": {
    "ms": "Tetapkan MRF kepada Sedang Dijalankan, lengkapkan tugasan berkaitan “Permanent repair after temporary fix” dan sahkan semakan penyelia. Kemudian kembali ke sini untuk menyelesaikan susulan.",
    "zh": "将MRF设为进行中，完成关联的“Permanent repair after temporary fix”任务，并由主管确认审核。然后返回此处解决跟进。",
    "ne": "MRF लाई काम भइरहेको अवस्थामा राख्नुहोस्, जोडिएको “Permanent repair after temporary fix” कार्य पूरा गरी सुपरभाइजरको समीक्षा पुष्टि गर्नुहोस्। त्यसपछि फलो-अप समाधान गर्न यहाँ फर्कनुहोस्।"
  },
  "+ Record Temporary Repair — Machine Restarted": {
    "ms": "+ Rekod Pembaikan Sementara — Mesin Dimulakan Semula",
    "zh": "+ 记录临时维修 — 机器已重新运行",
    "ne": "+ अस्थायी मर्मत रेकर्ड गर्नुहोस् — मेसिन पुनः सञ्चालन भयो"
  },
  "Maintenance staff list unavailable. Refresh to try again.": {
    "ms": "Senarai kakitangan penyelenggaraan tidak tersedia. Muat semula untuk mencuba lagi.",
    "zh": "无法加载维修人员名单，请刷新重试。",
    "ne": "मर्मत कर्मचारीको सूची उपलब्ध छैन। रिफ्रेस गरी फेरि प्रयास गर्नुहोस्।"
  },
  "Temporary fix, operating limitations and permanent work required": {
    "ms": "Pembaikan sementara, had operasi dan kerja pembaikan kekal yang diperlukan",
    "zh": "临时维修措施、运行限制及所需永久维修",
    "ne": "अस्थायी मर्मत, सञ्चालनका सीमाहरू र आवश्यक स्थायी मर्मत"
  },
  "Responsible for permanent repair": {
    "ms": "Penanggungjawab pembaikan kekal",
    "zh": "永久维修负责人",
    "ne": "स्थायी मर्मतको जिम्मेवार व्यक्ति"
  },
  "Select technician or supervisor": {
    "ms": "Pilih juruteknik atau penyelia",
    "zh": "选择技术员或主管",
    "ne": "प्राविधिक वा सुपरभाइजर छान्नुहोस्"
  },
  "Permanent repair target date": {
    "ms": "Tarikh sasaran pembaikan kekal",
    "zh": "永久维修目标日期",
    "ne": "स्थायी मर्मतको लक्षित मिति"
  },
  "Actual machine restart — Malaysia time": {
    "ms": "Masa sebenar mesin dimulakan semula — Waktu Malaysia",
    "zh": "机器实际重新运行时间 — 马来西亚时间",
    "ne": "मेसिन वास्तवमा पुनः सञ्चालन भएको समय — मलेसियाको समय"
  },
  "I verified the restart time and recorded the outstanding permanent repair.": {
    "ms": "Saya telah mengesahkan masa mesin dimulakan semula dan merekodkan pembaikan kekal yang belum selesai.",
    "zh": "我已确认重新运行时间，并记录尚待完成的永久维修。",
    "ne": "मैले पुनः सञ्चालन भएको समय प्रमाणित गरी बाँकी स्थायी मर्मत रेकर्ड गरेको छु।"
  },
  "Pause or finish running work first. Saving creates and assigns a permanent-repair task under this MRF, records the restart and sets Follow-up Required.": {
    "ms": "Jeda atau selesaikan kerja yang sedang berjalan dahulu. Menyimpan akan mencipta dan menugaskan kerja pembaikan kekal di bawah MRF ini, merekodkan masa mesin dimulakan semula dan menetapkan status Perlu Susulan.",
    "zh": "请先暂停或完成正在进行的工作。保存后，系统将在此MRF下创建并分配永久维修任务，记录重新运行时间，并将状态设为需要跟进。",
    "ne": "पहिले चलिरहेको काम रोक्नुहोस् वा पूरा गर्नुहोस्। बचत गर्दा यस MRF अन्तर्गत स्थायी मर्मत कार्य सिर्जना र जिम्मेवारी तोकिन्छ, पुनः सञ्चालन समय रेकर्ड हुन्छ र फलो-अप आवश्यक स्थिति सेट हुन्छ।"
  },
  "Save Temporary Repair & Follow-up": {
    "ms": "Simpan Pembaikan Sementara & Susulan",
    "zh": "保存临时维修与跟进",
    "ne": "अस्थायी मर्मत र फलो-अप बचत गर्नुहोस्"
  }
};

export function temporaryRepairText(language: Language, text: string): string {
  return language === "en" ? text : translations[text]?.[language] ?? text;
}
