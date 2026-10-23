import "server-only";
import type { Language } from "./language";

const translations: Record<string, Record<string, string>> = {
  "← Back to Dashboard": {
    "ms": "← Kembali ke Papan Pemuka",
    "zh": "← 返回仪表板",
    "ne": "← ड्यासबोर्डमा फर्कनुहोस्"
  },
  "Employee Management": {
    "ms": "Pengurusan Pekerja",
    "zh": "员工管理",
    "ne": "कर्मचारी व्यवस्थापन"
  },
  "Admin access only": {
    "ms": "Akses pentadbir sahaja",
    "zh": "仅管理员可访问",
    "ne": "प्रशासकलाई मात्र पहुँच"
  },
  "Registered Employees": {
    "ms": "Pekerja Berdaftar",
    "zh": "已登记员工",
    "ne": "दर्ता भएका कर्मचारी"
  },
  "+ Add Employee": {
    "ms": "+ Tambah Pekerja",
    "zh": "+ 添加员工",
    "ne": "+ कर्मचारी थप्नुहोस्"
  },
  "Unable to load employee records. Please check the database permissions.": {
    "ms": "Rekod pekerja tidak dapat dimuatkan. Sila semak kebenaran pangkalan data.",
    "zh": "无法加载员工记录，请检查数据库权限。",
    "ne": "कर्मचारी अभिलेख लोड भएनन्। कृपया डाटाबेसको अनुमति जाँच गर्नुहोस्।"
  },
  "Employee ID": {
    "ms": "ID Pekerja",
    "zh": "员工编号",
    "ne": "कर्मचारी नम्बर"
  },
  "Full Name": {
    "ms": "Nama Penuh",
    "zh": "姓名",
    "ne": "पूरा नाम"
  },
  "Department": {
    "ms": "Jabatan",
    "zh": "部门",
    "ne": "विभाग"
  },
  "Role": {
    "ms": "Peranan",
    "zh": "角色",
    "ne": "भूमिका"
  },
  "Status": {
    "ms": "Status",
    "zh": "状态",
    "ne": "स्थिति"
  },
  "Actions": {
    "ms": "Tindakan",
    "zh": "操作",
    "ne": "कार्यहरू"
  },
  "Not assigned": {
    "ms": "Belum ditetapkan",
    "zh": "未分配",
    "ne": "तोकिएको छैन"
  },
  "Active": {
    "ms": "Aktif",
    "zh": "已启用",
    "ne": "सक्रिय"
  },
  "Inactive": {
    "ms": "Tidak aktif",
    "zh": "已停用",
    "ne": "निष्क्रिय"
  },
  "No employee records available.": {
    "ms": "Tiada rekod pekerja tersedia.",
    "zh": "暂无员工记录。",
    "ne": "कर्मचारी अभिलेख उपलब्ध छैनन्।"
  },
  "admin": {
    "ms": "pentadbir",
    "zh": "管理员",
    "ne": "प्रशासक"
  },
  "requestor": {
    "ms": "pemohon",
    "zh": "申请人",
    "ne": "अनुरोधकर्ता"
  },
  "department hod": {
    "ms": "HOD jabatan",
    "zh": "部门主管",
    "ne": "विभाग प्रमुख"
  },
  "maintenance technician": {
    "ms": "juruteknik penyelenggaraan",
    "zh": "维修技术员",
    "ne": "मर्मत प्राविधिक"
  },
  "maintenance supervisor": {
    "ms": "penyelia penyelenggaraan",
    "zh": "维修主管",
    "ne": "मर्मत सुपरभाइजर"
  },
  "maintenance clerk": {
    "ms": "kerani penyelenggaraan",
    "zh": "维修文员",
    "ne": "मर्मत क्लर्क"
  }
};

export function employeeText(language: Language, text: string): string {
  return language === "en" ? text : translations[text]?.[language] ?? text;
}
