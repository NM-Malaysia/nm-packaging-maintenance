import "server-only";
import type { Language } from "./language";

const translations: Record<string, Record<string, string>> = {
  "← Back to Employee Management": {
    "ms": "← Kembali ke Pengurusan Pekerja",
    "zh": "← 返回员工管理",
    "ne": "← कर्मचारी व्यवस्थापनमा फर्कनुहोस्"
  },
  "Add Employee": {
    "ms": "Tambah Pekerja",
    "zh": "添加员工",
    "ne": "कर्मचारी थप्नुहोस्"
  },
  "Admin access only": {
    "ms": "Akses pentadbir sahaja",
    "zh": "仅管理员可访问",
    "ne": "प्रशासकलाई मात्र पहुँच"
  },
  "Employee Details": {
    "ms": "Butiran Pekerja",
    "zh": "员工详情",
    "ne": "कर्मचारी विवरण"
  }
};

export function addEmployeeText(language: Language, text: string): string {
  return language === "en" ? text : translations[text]?.[language] ?? text;
}
