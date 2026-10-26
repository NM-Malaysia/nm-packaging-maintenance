import "server-only";
import type { Language } from "./language";
import { machineText } from "./machineTranslations";

const words: Record<string, Record<string, string>> = {
  "Equipment & Facilities Register": {
    ms: "Daftar Peralatan & Kemudahan",
    zh: "设备与设施档案",
    ne: "उपकरण र सुविधा दर्ता"
  },
  "Asset code": {
    ms: "Kod aset", zh: "资产编号", ne: "सम्पत्ति कोड"
  },
  "Asset name": {
    ms: "Nama aset", zh: "资产名称", ne: "सम्पत्तिको नाम"
  },
  "Register machines, air conditioners and facilities for maintenance requests and PM planning.": {
    ms: "Daftar mesin, penghawa dingin dan kemudahan untuk permohonan penyelenggaraan dan perancangan PM.",
    zh: "登记机器、冷气和设施，用于维修申请及预防性保养计划。",
    ne: "मर्मत अनुरोध र PM योजनाका लागि मेसिन, एयर कन्डिसनर र सुविधाहरू दर्ता गर्नुहोस्।"
  },
  "Add asset": {
    ms: "Tambah aset", zh: "新增资产", ne: "सम्पत्ति थप्नुहोस्"
  },
  "Save asset": {
    ms: "Simpan aset", zh: "保存资产", ne: "सम्पत्ति सुरक्षित गर्नुहोस्"
  },
  "Edit asset": {
    ms: "Edit aset", zh: "编辑资产", ne: "सम्पत्ति सम्पादन गर्नुहोस्"
  },
  "Asset records": {
    ms: "Rekod aset", zh: "资产记录", ne: "सम्पत्तिका अभिलेख"
  },
  "Inactive assets remain in the register for history.": {
    ms: "Aset tidak aktif kekal dalam daftar untuk rekod sejarah.",
    zh: "停用的资产会保留在档案中，以保存历史记录。",
    ne: "निष्क्रिय सम्पत्तिहरू इतिहासका लागि दर्तामा रहन्छन्।"
  },
  "Assets could not be loaded.": {
    ms: "Aset tidak dapat dimuatkan.",
    zh: "无法加载资产。",
    ne: "सम्पत्तिहरू लोड भएनन्।"
  },
  "No asset records available.": {
    ms: "Tiada rekod aset tersedia.",
    zh: "暂无资产记录。",
    ne: "सम्पत्तिका अभिलेख उपलब्ध छैनन्।"
  },
  "Asset saved.": {
    ms: "Aset disimpan.", zh: "资产已保存。", ne: "सम्पत्ति सुरक्षित गरियो।"
  },
  "Check the asset details.": {
    ms: "Semak butiran aset.",
    zh: "请检查资产资料。",
    ne: "सम्पत्तिको विवरण जाँच्नुहोस्।"
  },
  "This asset code already exists.": {
    ms: "Kod aset ini sudah wujud.",
    zh: "此资产编号已存在。",
    ne: "यो सम्पत्ति कोड पहिले नै छ।"
  },
  "Asset could not be saved. Refresh and try again.": {
    ms: "Aset tidak dapat disimpan. Muat semula dan cuba lagi.",
    zh: "无法保存资产。请刷新后重试。",
    ne: "सम्पत्ति सुरक्षित भएन। रिफ्रेस गरेर फेरि प्रयास गर्नुहोस्।"
  }
};

export function assetRegisterText(language: Language, text: string): string {
  return language === "en"
    ? text
    : words[text]?.[language] ?? machineText(language, text);
}
