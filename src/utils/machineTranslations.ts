import "server-only";
import type { Language } from "./language";

const translations: Record<string, Record<string, string>> = {
  "Machine Register": {
    "ms": "Daftar Mesin",
    "zh": "设备档案",
    "ne": "मेसिन दर्ता"
  },
  "Register equipment before selecting it in a new MRF.": {
    "ms": "Daftar peralatan sebelum memilihnya dalam MRF baharu.",
    "zh": "先登记设备，再于新MRF中选择。",
    "ne": "नयाँ MRF मा छान्नुअघि उपकरण दर्ता गर्नुहोस्।"
  },
  "Add equipment": {
    "ms": "Tambah peralatan",
    "zh": "添加设备",
    "ne": "उपकरण थप्नुहोस्"
  },
  "Machine / equipment code": {
    "ms": "Kod mesin / peralatan",
    "zh": "机器／设备编号",
    "ne": "मेसिन / उपकरण कोड"
  },
  "Machine / equipment name": {
    "ms": "Nama mesin / peralatan",
    "zh": "机器／设备名称",
    "ne": "मेसिन / उपकरणको नाम"
  },
  "Department": {
    "ms": "Jabatan",
    "zh": "部门",
    "ne": "विभाग"
  },
  "Not assigned": {
    "ms": "Belum ditugaskan",
    "zh": "未分配",
    "ne": "तोकिएको छैन"
  },
  "Location": {
    "ms": "Lokasi",
    "zh": "位置",
    "ne": "स्थान"
  },
  "Notes": {
    "ms": "Nota",
    "zh": "备注",
    "ne": "टिप्पणी"
  },
  "Status": {
    "ms": "Status",
    "zh": "状态",
    "ne": "स्थिति"
  },
  "Active": {
    "ms": "Aktif",
    "zh": "启用",
    "ne": "सक्रिय"
  },
  "Inactive": {
    "ms": "Tidak aktif",
    "zh": "停用",
    "ne": "निष्क्रिय"
  },
  "Save equipment": {
    "ms": "Simpan peralatan",
    "zh": "保存设备",
    "ne": "उपकरण सुरक्षित गर्नुहोस्"
  },
  "Edit equipment": {
    "ms": "Edit peralatan",
    "zh": "编辑设备",
    "ne": "उपकरण सम्पादन गर्नुहोस्"
  },
  "Equipment saved.": {
    "ms": "Peralatan disimpan.",
    "zh": "设备已保存。",
    "ne": "उपकरण सुरक्षित गरियो।"
  },
  "Check the equipment details.": {
    "ms": "Semak butiran peralatan.",
    "zh": "请检查设备资料。",
    "ne": "उपकरण विवरण जाँच गर्नुहोस्।"
  },
  "This equipment code already exists.": {
    "ms": "Kod peralatan ini sudah wujud.",
    "zh": "此设备编号已存在。",
    "ne": "यो उपकरण कोड पहिले नै छ।"
  },
  "Equipment could not be saved. Refresh and try again.": {
    "ms": "Peralatan tidak dapat disimpan. Muat semula dan cuba lagi.",
    "zh": "无法保存设备，请刷新后重试。",
    "ne": "उपकरण सुरक्षित भएन। रिफ्रेस गरेर फेरि प्रयास गर्नुहोस्।"
  },
  "Equipment could not be loaded.": {
    "ms": "Peralatan tidak dapat dimuatkan.",
    "zh": "无法加载设备。",
    "ne": "उपकरण लोड भएन।"
  },
  "Departments could not be loaded. Refresh before editing.": {
    "ms": "Jabatan tidak dapat dimuatkan. Muat semula sebelum mengedit.",
    "zh": "无法加载部门，请刷新后再编辑。",
    "ne": "विभाग लोड भएनन्। सम्पादन गर्नुअघि रिफ्रेस गर्नुहोस्।"
  },
  "No equipment records available.": {
    "ms": "Tiada rekod peralatan.",
    "zh": "暂无设备记录。",
    "ne": "उपकरण अभिलेख उपलब्ध छैन।"
  },
  "Use a unique code containing letters, numbers, hyphens or underscores.": {
    "ms": "Gunakan kod unik dengan huruf, nombor, sempang atau garis bawah.",
    "zh": "请使用唯一编号，可包含字母、数字、连字符或下划线。",
    "ne": "अक्षर, अंक, हाइफन वा अन्डरस्कोर भएको अद्वितीय कोड प्रयोग गर्नुहोस्।"
  },
  "Inactive equipment remains in the register for history.": {
    "ms": "Peralatan tidak aktif kekal dalam daftar untuk sejarah.",
    "zh": "停用设备会保留在档案中供历史追溯。",
    "ne": "निष्क्रिय उपकरण इतिहासका लागि दर्तामा रहन्छ।"
  },
  "Equipment records": {
    "ms": "Rekod peralatan",
    "zh": "设备记录",
    "ne": "उपकरण अभिलेख"
  },
  "Previous": {
    "ms": "Sebelumnya",
    "zh": "上一页",
    "ne": "अघिल्लो"
  },
  "Next": {
    "ms": "Seterusnya",
    "zh": "下一页",
    "ne": "अर्को"
  },
  "Page": {
    "ms": "Halaman",
    "zh": "页码",
    "ne": "पृष्ठ"
  }
};

export function machineText(language: Language, text: string): string {
  return language === "en" ? text : translations[text]?.[language] ?? text;
}
