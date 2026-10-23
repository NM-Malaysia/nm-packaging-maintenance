import "server-only";
import type { Language } from "./language";
const translations: Record<string, Record<string, string>> = {
  "Maintenance Management System": {
    "ms": "Sistem Pengurusan Penyelenggaraan",
    "zh": "维修管理系统",
    "ne": "मर्मत व्यवस्थापन प्रणाली"
  },
  "Maintenance Dashboard": {
    "ms": "Papan Pemuka Penyelenggaraan",
    "zh": "维修仪表板",
    "ne": "मर्मत ड्यासबोर्ड"
  },
  "Welcome to the NM PACKAGING maintenance portal.": {
    "ms": "Selamat datang ke portal penyelenggaraan NM PACKAGING.",
    "zh": "欢迎使用 NM PACKAGING 维修平台。",
    "ne": "NM PACKAGING मर्मत पोर्टलमा स्वागत छ।"
  },
  "HOD Approvals": {
    "ms": "Kelulusan Ketua Jabatan",
    "zh": "部门主管审批",
    "ne": "विभाग प्रमुखको स्वीकृति"
  },
  "Maintenance Requests": {
    "ms": "Permohonan Penyelenggaraan",
    "zh": "维修申请",
    "ne": "मर्मत अनुरोधहरू"
  },
  "Maintenance Team": {
    "ms": "Pasukan Penyelenggaraan",
    "zh": "维修团队",
    "ne": "मर्मत टोली"
  },
  "Machine Register": {
    "ms": "Daftar Mesin",
    "zh": "设备档案",
    "ne": "मेसिन दर्ता"
  },
  "Preventive Maintenance": {
    "ms": "Penyelenggaraan Pencegahan",
    "zh": "预防性保养",
    "ne": "निवारक मर्मत"
  },
  "Parts Follow-up & MIV": {
    "ms": "Susulan Alat Ganti & MIV",
    "zh": "备件跟进与 MIV",
    "ne": "पार्टपुर्जा अनुगमन र MIV"
  },
  "Reports & Dashboard": {
    "ms": "Laporan & Papan Pemuka",
    "zh": "报告与仪表板",
    "ne": "प्रतिवेदन र ड्यासबोर्ड"
  },
  "Employee Management": {
    "ms": "Pengurusan Pekerja",
    "zh": "员工管理",
    "ne": "कर्मचारी व्यवस्थापन"
  },
  "Repair Approvals": {
    "ms": "Kelulusan Pembaikan",
    "zh": "维修完成审批",
    "ne": "मर्मत स्वीकृति"
  },
  "Handover": {
    "ms": "Serahan",
    "zh": "交接",
    "ne": "हस्तान्तरण"
  },
  "Accessible MRFs": {
    "ms": "MRF Boleh Diakses",
    "zh": "可访问的 MRF",
    "ne": "पहुँच भएका MRF"
  },
  "Submitted MRFs": {
    "ms": "MRF Dihantar",
    "zh": "已提交的 MRF",
    "ne": "पठाइएका MRF"
  },
  "Overdue PM Tasks": {
    "ms": "Tugas PM Lewat Tempoh",
    "zh": "逾期保养任务",
    "ne": "म्याद नाघेका PM कार्य"
  },
  "Unavailable": {
    "ms": "Tidak tersedia",
    "zh": "暂不可用",
    "ne": "उपलब्ध छैन"
  },
  "Not connected": {
    "ms": "Belum disambungkan",
    "zh": "尚未连接",
    "ne": "जडान गरिएको छैन"
  },
  "Latest Maintenance Requests": {
    "ms": "Permohonan Penyelenggaraan Terkini",
    "zh": "最新维修申请",
    "ne": "पछिल्ला मर्मत अनुरोधहरू"
  },
  "Coming soon": {
    "ms": "Akan datang",
    "zh": "即将推出",
    "ne": "चाँडै आउँदैछ"
  }
};
export function dashboardText(language: Language, text: string): string {
  return language === "en" ? text : translations[text]?.[language] ?? text;
}
