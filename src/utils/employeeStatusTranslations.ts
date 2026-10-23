export type EmployeeStatusLanguage = "en" | "ms" | "zh" | "ne";

const translations: Record<string, Record<string, string>> = {
  "Deactivate": {
    "ms": "Nyahaktifkan",
    "zh": "停用",
    "ne": "निष्क्रिय गर्नुहोस्"
  },
  "Activate": {
    "ms": "Aktifkan",
    "zh": "启用",
    "ne": "सक्रिय गर्नुहोस्"
  },
  "Confirm Employee Deactivation": {
    "ms": "Sahkan Penyahaktifan Pekerja",
    "zh": "确认停用员工",
    "ne": "कर्मचारी निष्क्रिय गर्ने पुष्टि"
  },
  "Confirm Employee Activation": {
    "ms": "Sahkan Pengaktifan Pekerja",
    "zh": "确认启用员工",
    "ne": "कर्मचारी सक्रिय गर्ने पुष्टि"
  },
  "Deactivate this employee?": {
    "ms": "Nyahaktifkan pekerja ini?",
    "zh": "确定停用此员工？",
    "ne": "यो कर्मचारीलाई निष्क्रिय गर्ने?"
  },
  "Activate this employee?": {
    "ms": "Aktifkan pekerja ini?",
    "zh": "确定启用此员工？",
    "ne": "यो कर्मचारीलाई सक्रिय गर्ने?"
  },
  "Employee ID:": {
    "ms": "ID Pekerja:",
    "zh": "员工编号：",
    "ne": "कर्मचारी नम्बर:"
  },
  "Warning: Deactivating an employee will prevent them from accessing the maintenance system. The last active Admin account is protected.": {
    "ms": "Amaran: Menyahaktifkan pekerja akan menghalang akses mereka ke sistem penyelenggaraan. Akaun Pentadbir aktif terakhir dilindungi.",
    "zh": "警告：停用员工后，该员工将无法访问维修系统。系统会保护最后一个已启用的管理员账号。",
    "ne": "चेतावनी: कर्मचारीलाई निष्क्रिय गर्दा मर्मत प्रणालीमा उनीहरूको पहुँच बन्द हुन्छ। अन्तिम सक्रिय प्रशासक खाता सुरक्षित छ।"
  },
  "Unable to update employee status.": {
    "ms": "Status pekerja tidak dapat dikemas kini.",
    "zh": "无法更新员工状态。",
    "ne": "कर्मचारीको स्थिति अद्यावधिक गर्न सकिएन।"
  },
  "An unexpected error occurred.": {
    "ms": "Ralat tidak dijangka berlaku.",
    "zh": "发生意外错误。",
    "ne": "अनपेक्षित त्रुटि भयो।"
  },
  "Cancel": {
    "ms": "Batal",
    "zh": "取消",
    "ne": "रद्द गर्नुहोस्"
  },
  "Processing...": {
    "ms": "Memproses...",
    "zh": "正在处理…",
    "ne": "प्रक्रिया हुँदैछ..."
  },
  "Confirm Deactivation": {
    "ms": "Sahkan Penyahaktifan",
    "zh": "确认停用",
    "ne": "निष्क्रिय गर्ने पुष्टि गर्नुहोस्"
  },
  "Confirm Activation": {
    "ms": "Sahkan Pengaktifan",
    "zh": "确认启用",
    "ne": "सक्रिय गर्ने पुष्टि गर्नुहोस्"
  },
  "Confirming sends the employee status change for processing.": {
    "ms": "Pengesahan menghantar perubahan status pekerja untuk diproses.",
    "zh": "点击确认将提交员工状态变更。",
    "ne": "पुष्टि गर्दा कर्मचारीको स्थिति परिवर्तन प्रक्रियाका लागि पठाइन्छ।"
  }
};

export function employeeStatusText(language: EmployeeStatusLanguage, text: string): string {
  return language === "en" ? text : translations[text]?.[language] ?? text;
}
