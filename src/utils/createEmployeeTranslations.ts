export type CreateEmployeeLanguage = "en" | "ms" | "zh" | "ne";

const translations: Record<string, Record<string, string>> = {
  "Employee ID *": {
    "ms": "ID Pekerja *",
    "zh": "员工编号 *",
    "ne": "कर्मचारी नम्बर *"
  },
  "Existing company Employee ID": {
    "ms": "ID pekerja syarikat sedia ada",
    "zh": "公司现有员工编号",
    "ne": "कम्पनीको हालको कर्मचारी नम्बर"
  },
  "Full Name *": {
    "ms": "Nama Penuh *",
    "zh": "姓名 *",
    "ne": "पूरा नाम *"
  },
  "Employee full name": {
    "ms": "Nama penuh pekerja",
    "zh": "员工姓名",
    "ne": "कर्मचारीको पूरा नाम"
  },
  "Department *": {
    "ms": "Jabatan *",
    "zh": "部门 *",
    "ne": "विभाग *"
  },
  "Select department": {
    "ms": "Pilih jabatan",
    "zh": "选择部门",
    "ne": "विभाग छान्नुहोस्"
  },
  "App Role *": {
    "ms": "Peranan Aplikasi *",
    "zh": "应用角色 *",
    "ne": "एपको भूमिका *"
  },
  "Select role": {
    "ms": "Pilih peranan",
    "zh": "选择角色",
    "ne": "भूमिका छान्नुहोस्"
  },
  "Requestor": {
    "ms": "Pemohon",
    "zh": "申请人",
    "ne": "अनुरोधकर्ता"
  },
  "Department HOD": {
    "ms": "HOD Jabatan",
    "zh": "部门主管",
    "ne": "विभाग प्रमुख"
  },
  "Maintenance Technician": {
    "ms": "Juruteknik Penyelenggaraan",
    "zh": "维修技术员",
    "ne": "मर्मत प्राविधिक"
  },
  "Maintenance Supervisor": {
    "ms": "Penyelia Penyelenggaraan",
    "zh": "维修主管",
    "ne": "मर्मत सुपरभाइजर"
  },
  "Maintenance Clerk": {
    "ms": "Kerani Penyelenggaraan",
    "zh": "维修文员",
    "ne": "मर्मत क्लर्क"
  },
  "Admin": {
    "ms": "Pentadbir",
    "zh": "管理员",
    "ne": "प्रशासक"
  },
  "Temporary Password *": {
    "ms": "Kata Laluan Sementara *",
    "zh": "临时密码 *",
    "ne": "अस्थायी पासवर्ड *"
  },
  "At least 12 characters": {
    "ms": "Sekurang-kurangnya 12 aksara",
    "zh": "至少12个字符",
    "ne": "कम्तीमा 12 अक्षर"
  },
  "Employee must change this password at first login.": {
    "ms": "Pekerja mesti menukar kata laluan ini semasa log masuk pertama.",
    "zh": "员工首次登录时必须更改此密码。",
    "ne": "कर्मचारीले पहिलो लगइनमा यो पासवर्ड परिवर्तन गर्नुपर्छ।"
  },
  "New employees remain Inactive until an Admin activates their account.": {
    "ms": "Pekerja baharu kekal Tidak Aktif sehingga Pentadbir mengaktifkan akaun mereka.",
    "zh": "新员工账号保持停用，直到管理员启用账号。",
    "ne": "प्रशासकले खाता सक्रिय नगरेसम्म नयाँ कर्मचारी निष्क्रिय रहन्छन्।"
  },
  "Employee created successfully. Admin activation is required.": {
    "ms": "Pekerja berjaya dicipta. Pengaktifan oleh Pentadbir diperlukan.",
    "zh": "员工已成功创建，需由管理员启用账号。",
    "ne": "कर्मचारी सफलतापूर्वक सिर्जना भयो। प्रशासकबाट सक्रिय गर्न आवश्यक छ।"
  },
  "Unable to create employee.": {
    "ms": "Pekerja tidak dapat dicipta.",
    "zh": "无法创建员工。",
    "ne": "कर्मचारी सिर्जना गर्न सकिएन।"
  },
  "An unexpected error occurred.": {
    "ms": "Ralat tidak dijangka berlaku.",
    "zh": "发生意外错误。",
    "ne": "अनपेक्षित त्रुटि भयो।"
  },
  "Creating Employee...": {
    "ms": "Mencipta Pekerja...",
    "zh": "正在创建员工…",
    "ne": "कर्मचारी सिर्जना हुँदैछ..."
  },
  "Create Employee": {
    "ms": "Cipta Pekerja",
    "zh": "创建员工",
    "ne": "कर्मचारी सिर्जना गर्नुहोस्"
  }
};

export function createEmployeeText(language: CreateEmployeeLanguage, text: string): string {
  return language === "en" ? text : translations[text]?.[language] ?? text;
}
