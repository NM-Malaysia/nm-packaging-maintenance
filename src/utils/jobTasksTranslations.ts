import "server-only";
import type { Language } from "./language";

const translations: Record<string, Record<string, string>> = {
  "Tasks under this MRF": {
    "ms": "Tugasan di bawah MRF ini",
    "zh": "此MRF下的任务",
    "ne": "यस MRF अन्तर्गतका कार्यहरू"
  },
  "Additional tasks stay linked to this MRF. Earlier work records remain unchanged.": {
    "ms": "Tugasan tambahan kekal dipautkan kepada MRF ini. Rekod kerja terdahulu tidak berubah.",
    "zh": "新增任务保持关联至此MRF，之前的工作记录保持不变。",
    "ne": "थप कार्यहरू यस MRF सँग जोडिएका रहन्छन्। अघिल्ला कामका अभिलेख परिवर्तन हुँदैनन्।"
  },
  "Tasks could not be loaded. Please refresh.": {
    "ms": "Tugasan tidak dapat dimuatkan. Sila muat semula.",
    "zh": "无法加载任务，请刷新。",
    "ne": "कार्यहरू लोड भएनन्। कृपया रिफ्रेस गर्नुहोस्।"
  },
  "You": {
    "ms": "Anda",
    "zh": "您",
    "ne": "तपाईं"
  },
  "Team member": {
    "ms": "Ahli pasukan",
    "zh": "团队成员",
    "ne": "टोली सदस्य"
  },
  "Assigned:": {
    "ms": "Ditugaskan kepada:",
    "zh": "已分配：",
    "ne": "जिम्मेवारी दिइएका:"
  },
  "Team details could not be loaded": {
    "ms": "Butiran pasukan tidak dapat dimuatkan",
    "zh": "无法加载团队详情",
    "ne": "टोलीको विवरण लोड भएन"
  },
  "No members": {
    "ms": "Tiada ahli",
    "zh": "无成员",
    "ne": "कुनै सदस्य छैन"
  },
  "Created:": {
    "ms": "Dicipta:",
    "zh": "创建时间：",
    "ne": "सिर्जना भएको समय:"
  },
  "Malaysia time": {
    "ms": "Waktu Malaysia",
    "zh": "马来西亚时间",
    "ne": "मलेसियाको समय"
  },
  "No additional tasks have been created.": {
    "ms": "Tiada tugasan tambahan dicipta.",
    "zh": "尚未创建额外任务。",
    "ne": "कुनै थप कार्य सिर्जना गरिएको छैन।"
  },
  "+ Add Task": {
    "ms": "+ Tambah Tugasan",
    "zh": "+ 添加任务",
    "ne": "+ कार्य थप्नुहोस्"
  },
  "Staff list could not be loaded. Please refresh.": {
    "ms": "Senarai kakitangan tidak dapat dimuatkan. Sila muat semula.",
    "zh": "无法加载人员名单，请刷新。",
    "ne": "कर्मचारी सूची लोड भएन। कृपया रिफ्रेस गर्नुहोस्।"
  },
  "No active maintenance staff available.": {
    "ms": "Tiada kakitangan penyelenggaraan aktif tersedia.",
    "zh": "没有可用的在职维修人员。",
    "ne": "कुनै सक्रिय मर्मत कर्मचारी उपलब्ध छैन।"
  },
  "Task title": {
    "ms": "Tajuk tugasan",
    "zh": "任务标题",
    "ne": "कार्यको शीर्षक"
  },
  "Task instructions": {
    "ms": "Arahan tugasan",
    "zh": "任务说明",
    "ne": "कार्य निर्देशन"
  },
  "Assign team members": {
    "ms": "Tugaskan ahli pasukan",
    "zh": "分配团队成员",
    "ne": "टोली सदस्यहरू तोक्नुहोस्"
  },
  "Create task": {
    "ms": "Cipta tugasan",
    "zh": "创建任务",
    "ne": "कार्य सिर्जना गर्नुहोस्"
  },
  "Replace bearing No. 1234": {
    "ms": "Ganti galas No. 1234",
    "zh": "更换1234号轴承",
    "ne": "1234 नम्बरको बेयरिङ बदल्नुहोस्"
  },
  "pending": {
    "ms": "belum selesai",
    "zh": "待处理",
    "ne": "बाँकी"
  },
  "assigned": {
    "ms": "ditugaskan",
    "zh": "已分配",
    "ne": "जिम्मेवारी तोकिएको"
  },
  "not started": {
    "ms": "belum bermula",
    "zh": "未开始",
    "ne": "सुरु नभएको"
  },
  "in progress": {
    "ms": "sedang dijalankan",
    "zh": "进行中",
    "ne": "काम भइरहेको"
  },
  "completed": {
    "ms": "selesai",
    "zh": "已完成",
    "ne": "पूरा भएको"
  },
  "cancelled": {
    "ms": "dibatalkan",
    "zh": "已取消",
    "ne": "रद्द गरिएको"
  },
  "maintenance technician": {
    "ms": "juruteknik penyelenggaraan",
    "zh": "维修技术员",
    "ne": "मर्मत प्राविधिक"
  },
  "maintenance supervisor": {
    "ms": "penyelia penyelenggaraan",
    "zh": "维修主管",
    "ne": "मर्मत सुपरभाइजर"
  },
  "admin": {
    "ms": "pentadbir",
    "zh": "管理员",
    "ne": "प्रशासक"
  }
};

export function jobTasksText(language: Language, text: string): string {
  return language === "en" ? text : translations[text]?.[language] ?? text;
}
