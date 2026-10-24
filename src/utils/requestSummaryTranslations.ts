import "server-only";
import type { Language } from "./language";

const translations: Record<string, Record<string, string>> = {
  "Work category": {
    "ms": "Kategori kerja",
    "zh": "工作类别",
    "ne": "कामको वर्ग"
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
  "Work subject": {
    "ms": "Tajuk kerja",
    "zh": "工作事项",
    "ne": "कामको विषय"
  },
  "Equipment / Work subject": {
    "ms": "Peralatan / Tajuk kerja",
    "zh": "设备／工作事项",
    "ne": "उपकरण / कामको विषय"
  },
  "Work location": {
    "ms": "Lokasi kerja",
    "zh": "工作位置",
    "ne": "कामको स्थान"
  },
  "Not specified": {
    "ms": "Tidak dinyatakan",
    "zh": "未指定",
    "ne": "उल्लेख गरिएको छैन"
  },
  "Not recorded": {
    "ms": "Tidak direkodkan",
    "zh": "未记录",
    "ne": "अभिलेख गरिएको छैन"
  }
};

export function requestSummaryText(language: Language, text: string): string {
  return language === "en" ? text : translations[text]?.[language] ?? text;
}
