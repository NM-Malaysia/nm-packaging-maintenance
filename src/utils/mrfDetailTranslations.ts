import "server-only";
import type { Language } from "./language";
import { maintenanceText } from "./maintenanceTranslations";
import { dashboardText } from "./dashboardTranslations";

const translations: Record<string, Record<string, string>> = {
  "← Back to maintenance list": {
    "ms": "← Kembali ke senarai penyelenggaraan",
    "zh": "← 返回维修列表",
    "ne": "← मर्मत सूचीमा फर्कनुहोस्"
  },
  "MRF Details": {
    "ms": "Butiran MRF",
    "zh": "MRF 详情",
    "ne": "MRF विवरण"
  },
  "Work, tasks and history for this MRF.": {
    "ms": "Kerja, tugas dan sejarah untuk MRF ini.",
    "zh": "此 MRF 的工作、任务和历史记录。",
    "ne": "यस MRF का काम, कार्य र इतिहास।"
  },
  "Requests or assignments could not be loaded. Please refresh.": {
    "ms": "Permohonan atau penugasan tidak dapat dimuatkan. Sila muat semula.",
    "zh": "无法加载申请或分配记录。请刷新页面。",
    "ne": "अनुरोध वा जिम्मेवारी विवरण लोड भएन। कृपया रिफ्रेस गर्नुहोस्।"
  },
  "Assigned": {
    "ms": "Ditugaskan",
    "zh": "分配时间",
    "ne": "तोकिएको"
  },
  "Malaysia time": {
    "ms": "Waktu Malaysia",
    "zh": "马来西亚时间",
    "ne": "मलेसिया समय"
  },
  "Your work record could not be loaded. Please refresh.": {
    "ms": "Rekod kerja anda tidak dapat dimuatkan. Sila muat semula.",
    "zh": "无法加载您的工作记录。请刷新页面。",
    "ne": "तपाईंको कामको अभिलेख लोड भएन। कृपया रिफ्रेस गर्नुहोस्।"
  },
  "Your work started": {
    "ms": "Kerja anda bermula",
    "zh": "您的工作开始时间",
    "ne": "तपाईंको काम सुरु भएको समय"
  },
  "Start Work records your own start time. The first team member to start moves this request to In Progress.": {
    "ms": "Mula Kerja merekodkan masa mula anda sendiri. Ahli pasukan pertama yang bermula menukar permohonan ini kepada Sedang Dijalankan.",
    "zh": "开始工作会记录您个人的开始时间。第一位开始工作的团队成员会将此申请转为进行中。",
    "ne": "काम सुरु गर्दा तपाईंको व्यक्तिगत सुरु समय अभिलेख हुन्छ। सुरु गर्ने पहिलो टोली सदस्यले यो अनुरोधलाई काम भइरहेको स्थितिमा सार्छ।"
  },
  "Start Work": {
    "ms": "Mula Kerja",
    "zh": "开始工作",
    "ne": "काम सुरु गर्नुहोस्"
  },
  "Starting work is unavailable at this request stage.": {
    "ms": "Kerja tidak boleh dimulakan pada peringkat permohonan ini.",
    "zh": "此申请阶段暂不能开始工作。",
    "ne": "अनुरोधको यस चरणमा काम सुरु गर्न मिल्दैन।"
  },
  "Team member list could not be loaded.": {
    "ms": "Senarai ahli pasukan tidak dapat dimuatkan.",
    "zh": "无法加载团队成员列表。",
    "ne": "टोली सदस्य सूची लोड भएन।"
  },
  "No active technicians or supervisors are available.": {
    "ms": "Tiada juruteknik atau penyelia aktif tersedia.",
    "zh": "暂无可分配的在职技术员或主管。",
    "ne": "सक्रिय प्राविधिक वा सुपरभाइजर उपलब्ध छैनन्।"
  },
  "Assign job team": {
    "ms": "Tugaskan pasukan kerja",
    "zh": "分配工作团队",
    "ne": "कामको टोली तोक्नुहोस्"
  },
  "Select one or more technicians or supervisors. Unchecking a member removes them when you save.": {
    "ms": "Pilih seorang atau lebih juruteknik atau penyelia. Membatalkan pilihan ahli akan mengeluarkannya apabila anda menyimpan.",
    "zh": "选择一位或多位技术员或主管。取消勾选成员后，保存时会将其移出团队。",
    "ne": "एक वा बढी प्राविधिक वा सुपरभाइजर छान्नुहोस्। सदस्यको चिन्ह हटाएपछि सुरक्षित गर्दा उनी टोलीबाट हट्छन्।"
  },
  "Save job team": {
    "ms": "Simpan pasukan kerja",
    "zh": "保存工作团队",
    "ne": "कामको टोली सुरक्षित गर्नुहोस्"
  },
  "This MRF is unavailable or you do not have permission to view it.": {
    "ms": "MRF ini tidak tersedia atau anda tiada kebenaran untuk melihatnya.",
    "zh": "此 MRF 不可用，或您没有查看权限。",
    "ne": "यो MRF उपलब्ध छैन वा तपाईंलाई हेर्ने अनुमति छैन।"
  }
};

export function mrfDetailText(language: Language, text: string): string {
  if (language === "en") return text;
  const own = translations[text]?.[language];
  if (own !== undefined) return own;
  const shared = maintenanceText(language, text);
  return shared !== text ? shared : dashboardText(language, text);
}
