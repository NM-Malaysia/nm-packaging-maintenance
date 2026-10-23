import "server-only";
import type { Language } from "./language";

const translations: Record<string, Record<string, string>> = {
  "Repair approvals could not be loaded. Please refresh.": {
    "ms": "Kelulusan pembaikan tidak dapat dimuatkan. Sila muat semula.",
    "zh": "无法加载维修审批，请刷新。",
    "ne": "मर्मत स्वीकृतिहरू लोड भएनन्। कृपया रिफ्रेस गर्नुहोस्।"
  },
  "Recorded supervisor repair completion is required before approval.": {
    "ms": "Pengesahan penyelia bahawa pembaikan selesai mesti direkodkan sebelum kelulusan.",
    "zh": "审批前，必须先记录主管对维修完成的确认。",
    "ne": "स्वीकृतिअघि सुपरभाइजरले मर्मत पूरा भएको पुष्टि रेकर्ड गर्नुपर्छ।"
  },
  "Post-repair approvals": {
    "ms": "Kelulusan selepas pembaikan",
    "zh": "维修完成后审批",
    "ne": "मर्मतपछिका स्वीकृतिहरू"
  },
  "Manager approval → Requestor Department HOD approval → Handover": {
    "ms": "Kelulusan pengurus → Kelulusan HOD jabatan pemohon → Serah terima",
    "zh": "经理审批 → 申请部门主管审批 → 交接",
    "ne": "प्रबन्धकको स्वीकृति → अनुरोधकर्ता विभाग प्रमुखको स्वीकृति → हस्तान्तरण"
  },
  "Repair summary": {
    "ms": "Ringkasan pembaikan",
    "zh": "维修总结",
    "ne": "मर्मत सारांश"
  },
  "Repair verified:": {
    "ms": "Pembaikan disahkan:",
    "zh": "维修验证时间：",
    "ne": "मर्मत प्रमाणित भएको समय:"
  },
  "Malaysia time": {
    "ms": "Waktu Malaysia",
    "zh": "马来西亚时间",
    "ne": "मलेसियाको समय"
  },
  "Machine downtime:": {
    "ms": "Masa henti mesin:",
    "zh": "机器停机时长：",
    "ne": "मेसिन बन्द रहेको समय:"
  },
  "minutes": {
    "ms": "minit",
    "zh": "分钟",
    "ne": "मिनेट"
  },
  "1. Maintenance Manager": {
    "ms": "1. Pengurus Penyelenggaraan",
    "zh": "1. 维修经理",
    "ne": "1. मर्मत प्रबन्धक"
  },
  "2. Requestor Department HOD": {
    "ms": "2. HOD Jabatan Pemohon",
    "zh": "2. 申请部门主管",
    "ne": "2. अनुरोधकर्ता विभाग प्रमुख"
  },
  "Approved": {
    "ms": "Diluluskan",
    "zh": "已批准",
    "ne": "स्वीकृत"
  },
  "Pending": {
    "ms": "Menunggu",
    "zh": "待审批",
    "ne": "स्वीकृति बाँकी"
  },
  "Manager review comments": {
    "ms": "Ulasan semakan pengurus",
    "zh": "经理审核意见",
    "ne": "प्रबन्धकको समीक्षा टिप्पणी"
  },
  "Department HOD review comments": {
    "ms": "Ulasan semakan HOD jabatan",
    "zh": "部门主管审核意见",
    "ne": "विभाग प्रमुखको समीक्षा टिप्पणी"
  },
  "I have reviewed the repair and approve it for the next stage.": {
    "ms": "Saya telah menyemak pembaikan dan meluluskannya untuk peringkat seterusnya.",
    "zh": "我已审核维修情况，并批准进入下一阶段。",
    "ne": "मैले मर्मतको समीक्षा गरी अर्को चरणका लागि स्वीकृत गरेको छु।"
  },
  "Approve as Maintenance Manager": {
    "ms": "Luluskan sebagai Pengurus Penyelenggaraan",
    "zh": "以维修经理身份批准",
    "ne": "मर्मत प्रबन्धकको रूपमा स्वीकृत गर्नुहोस्"
  },
  "Approve as Requestor Department HOD": {
    "ms": "Luluskan sebagai HOD Jabatan Pemohon",
    "zh": "以申请部门主管身份批准",
    "ne": "अनुरोधकर्ता विभाग प्रमुखको रूपमा स्वीकृत गर्नुहोस्"
  },
  "Both approvals recorded. Handover is separate from these approvals.": {
    "ms": "Kedua-dua kelulusan direkodkan. Serah terima ialah langkah berasingan.",
    "zh": "两项审批均已记录。交接须另行办理。",
    "ne": "दुवै स्वीकृति रेकर्ड भए। हस्तान्तरण यी स्वीकृतिहरूभन्दा अलग चरण हो।"
  },
  "Awaiting the requestor department's HOD approval.": {
    "ms": "Menunggu kelulusan HOD jabatan pemohon.",
    "zh": "等待申请部门主管审批。",
    "ne": "अनुरोधकर्ता विभाग प्रमुखको स्वीकृतिको प्रतीक्षामा।"
  },
  "Awaiting Maintenance Manager (Admin) approval.": {
    "ms": "Menunggu kelulusan Pengurus Penyelenggaraan (Pentadbir).",
    "zh": "等待维修经理（管理员）审批。",
    "ne": "मर्मत प्रबन्धक (प्रशासक) को स्वीकृतिको प्रतीक्षामा।"
  }
};

export function repairApprovalsText(language: Language, text: string): string {
  return language === "en" ? text : translations[text]?.[language] ?? text;
}
