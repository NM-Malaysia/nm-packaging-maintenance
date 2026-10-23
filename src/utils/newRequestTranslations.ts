import "server-only";
import type { Language } from "./language";

const translations: Record<string, Record<string, string>> = {
  "← Back to dashboard": {
    "ms": "← Kembali ke papan pemuka",
    "zh": "← 返回仪表板",
    "ne": "← ड्यासबोर्डमा फर्कनुहोस्"
  },
  "New Maintenance Request": {
    "ms": "Permohonan Penyelenggaraan Baharu",
    "zh": "新维修申请",
    "ne": "नयाँ मर्मत अनुरोध"
  },
  "Maintenance / repair / modification request form": {
    "ms": "Borang permohonan penyelenggaraan / pembaikan / pengubahsuaian",
    "zh": "保养 / 维修 / 改装申请表",
    "ne": "नियमित मर्मतसम्भार / मर्मत / परिमार्जन अनुरोध फाराम"
  },
  "Only Requestors and Department HODs can submit MRFs under the current company permissions.": {
    "ms": "Hanya Pemohon dan HOD Jabatan boleh menghantar MRF mengikut kebenaran syarikat semasa.",
    "zh": "根据公司现行权限，仅申请人及部门主管可提交MRF。",
    "ne": "कम्पनीको हालको अनुमतिअनुसार अनुरोधकर्ता र विभाग प्रमुखले मात्र MRF पेश गर्न सक्छन्।"
  },
  "Unable to load your department. Contact your administrator.": {
    "ms": "Jabatan anda tidak dapat dimuatkan. Hubungi pentadbir.",
    "zh": "无法加载您的部门，请联系管理员。",
    "ne": "तपाईंको विभाग लोड भएन। प्रशासकलाई सम्पर्क गर्नुहोस्।"
  }
};

export function newRequestText(language: Language, text: string): string {
  return language === "en" ? text : translations[text]?.[language] ?? text;
}
