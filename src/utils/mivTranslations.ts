import "server-only";
import type { Language } from "./language";

const translations: Record<string, Record<string, string>> = {
  "Add MIV Number": {
    "ms": "Tambah Nombor MIV",
    "zh": "添加MIV编号",
    "ne": "MIV नम्बर थप्नुहोस्"
  },
  "MIV number": {
    "ms": "Nombor MIV",
    "zh": "MIV编号",
    "ne": "MIV नम्बर"
  },
  "Several items may share this MIV number. Check the number before saving; it locks after recording.": {
    "ms": "Beberapa item boleh menggunakan nombor MIV yang sama. Semak nombor sebelum menyimpan; nombor dikunci selepas direkodkan.",
    "zh": "多个项目可共用此MIV编号。保存前请核对编号，记录后将锁定。",
    "ne": "धेरै वस्तुहरूले एउटै MIV नम्बर प्रयोग गर्न सक्छन्। बचत गर्नुअघि नम्बर जाँच गर्नुहोस्; रेकर्ड भएपछि यो लक हुन्छ।"
  },
  "Save MIV Number": {
    "ms": "Simpan Nombor MIV",
    "zh": "保存MIV编号",
    "ne": "MIV नम्बर बचत गर्नुहोस्"
  }
};

export function mivText(language: Language, text: string): string {
  return language === "en" ? text : translations[text]?.[language] ?? text;
}
