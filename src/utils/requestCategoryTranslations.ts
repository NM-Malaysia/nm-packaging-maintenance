import type { RequestFormLanguage } from "./requestFormTranslations";

const translations: Record<string, Record<string, string>> = {
  "Work category *": {
    "ms": "Kategori kerja *",
    "zh": "工作类别 *",
    "ne": "कामको वर्ग *"
  },
  "Machine / Equipment": {
    "ms": "Mesin / Peralatan",
    "zh": "机器／设备",
    "ne": "मेसिन / उपकरण"
  },
  "Building / Facilities": {
    "ms": "Bangunan / Kemudahan",
    "zh": "建筑／设施",
    "ne": "भवन / सुविधा"
  },
  "Other Maintenance Work": {
    "ms": "Kerja Penyelenggaraan Lain",
    "zh": "其他维修工作",
    "ne": "अन्य मर्मत कार्य"
  },
  "Registered equipment *": {
    "ms": "Peralatan berdaftar *",
    "zh": "已登记设备 *",
    "ne": "दर्ता गरिएको उपकरण *"
  },
  "Select equipment": {
    "ms": "Pilih peralatan",
    "zh": "选择设备",
    "ne": "उपकरण छान्नुहोस्"
  },
  "Equipment could not be loaded. Refresh and try again.": {
    "ms": "Peralatan tidak dapat dimuatkan. Muat semula dan cuba lagi.",
    "zh": "无法加载设备，请刷新后重试。",
    "ne": "उपकरण लोड भएन। रिफ्रेस गरेर फेरि प्रयास गर्नुहोस्।"
  },
  "No active equipment is registered. Contact Admin or Maintenance Supervisor.": {
    "ms": "Tiada peralatan aktif didaftarkan. Hubungi Admin atau Penyelia Penyelenggaraan.",
    "zh": "暂无已登记的启用设备，请联系管理员或维修主管。",
    "ne": "सक्रिय उपकरण दर्ता गरिएको छैन। प्रशासक वा मर्मत सुपरभाइजरलाई सम्पर्क गर्नुहोस्।"
  },
  "Registered location:": {
    "ms": "Lokasi berdaftar:",
    "zh": "登记位置：",
    "ne": "दर्ता गरिएको स्थान:"
  },
  "Work subject *": {
    "ms": "Tajuk kerja *",
    "zh": "工作事项 *",
    "ne": "कामको विषय *"
  },
  "For example: Office roof leak": {
    "ms": "Contoh: Bumbung pejabat bocor",
    "zh": "例如：办公室屋顶漏水",
    "ne": "उदाहरण: कार्यालयको छत चुहिएको"
  },
  "Work location — optional": {
    "ms": "Lokasi kerja — pilihan",
    "zh": "工作位置 — 可选",
    "ne": "कामको स्थान — ऐच्छिक"
  },
  "Work location *": {
    "ms": "Lokasi kerja *",
    "zh": "工作位置 *",
    "ne": "कामको स्थान *"
  },
  "For example: Printing area / office / toilet": {
    "ms": "Contoh: Kawasan percetakan / pejabat / tandas",
    "zh": "例如：印刷区／办公室／厕所",
    "ne": "उदाहरण: प्रिन्टिङ क्षेत्र / कार्यालय / शौचालय"
  },
  "Leave blank to use the registered equipment location.": {
    "ms": "Biarkan kosong untuk menggunakan lokasi peralatan berdaftar.",
    "zh": "留空则使用设备的登记位置。",
    "ne": "दर्ता गरिएको उपकरणको स्थान प्रयोग गर्न खाली छोड्नुहोस्।"
  },
  "Select a work category.": {
    "ms": "Pilih kategori kerja.",
    "zh": "请选择工作类别。",
    "ne": "कामको वर्ग छान्नुहोस्।"
  },
  "Enter a location of up to 200 characters.": {
    "ms": "Masukkan lokasi sehingga 200 aksara.",
    "zh": "请输入位置，最多200个字符。",
    "ne": "बढीमा २०० अक्षरको स्थान लेख्नुहोस्।"
  },
  "Select registered equipment.": {
    "ms": "Pilih peralatan berdaftar.",
    "zh": "请选择已登记设备。",
    "ne": "दर्ता गरिएको उपकरण छान्नुहोस्।"
  },
  "Enter a work subject and location, each up to 200 characters.": {
    "ms": "Masukkan tajuk kerja dan lokasi, setiap satu sehingga 200 aksara.",
    "zh": "请输入工作事项和位置，每项最多200个字符。",
    "ne": "कामको विषय र स्थान लेख्नुहोस्, प्रत्येक बढीमा २०० अक्षर।"
  },
  "Machine downtime applies only to equipment requests.": {
    "ms": "Masa henti mesin hanya terpakai untuk permohonan peralatan.",
    "zh": "设备停机时间仅适用于机器／设备申请。",
    "ne": "मेसिन बन्द समय उपकरण अनुरोधमा मात्र लागू हुन्छ।"
  },
  "Selected equipment is unavailable. Refresh and select active equipment.": {
    "ms": "Peralatan dipilih tidak tersedia. Muat semula dan pilih peralatan aktif.",
    "zh": "所选设备不可用，请刷新并选择启用设备。",
    "ne": "छानिएको उपकरण उपलब्ध छैन। रिफ्रेस गरी सक्रिय उपकरण छान्नुहोस्।"
  }
};

export function requestCategoryText(language: RequestFormLanguage, text: string): string {
  return language === "en" ? text : translations[text]?.[language] ?? text;
}
