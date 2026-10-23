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

// Employee status API message translations
Object.assign(translations, {
  "Please log in first.": {
    "ms": "Sila log masuk dahulu.",
    "zh": "请先登录。",
    "ne": "कृपया पहिले साइन इन गर्नुहोस्।"
  },
  "Active Admin access required.": {
    "ms": "Akses Pentadbir aktif diperlukan.",
    "zh": "需要已启用的管理员账号权限。",
    "ne": "सक्रिय प्रशासकको पहुँच आवश्यक छ।"
  },
  "Employee ID is required.": {
    "ms": "ID pekerja diperlukan.",
    "zh": "必须提供员工编号。",
    "ne": "कर्मचारी नम्बर आवश्यक छ।"
  },
  "Unable to check employee details.": {
    "ms": "Butiran pekerja tidak dapat disemak.",
    "zh": "无法检查员工资料。",
    "ne": "कर्मचारी विवरण जाँच गर्न सकिएन।"
  },
  "Employee not found.": {
    "ms": "Pekerja tidak ditemui.",
    "zh": "找不到该员工。",
    "ne": "कर्मचारी भेटिएन।"
  },
  "Invalid employee status action.": {
    "ms": "Tindakan status pekerja tidak sah.",
    "zh": "员工状态操作无效。",
    "ne": "कर्मचारीको स्थिति परिवर्तन कार्य अमान्य छ।"
  },
  "Employee is already active.": {
    "ms": "Pekerja sudah aktif.",
    "zh": "该员工账号已启用。",
    "ne": "कर्मचारी पहिले नै सक्रिय छन्।"
  },
  "Employee is already inactive.": {
    "ms": "Pekerja sudah tidak aktif.",
    "zh": "该员工账号已停用。",
    "ne": "कर्मचारी पहिले नै निष्क्रिय छन्।"
  },
  "Unable to verify active Admin accounts.": {
    "ms": "Akaun Pentadbir aktif tidak dapat disahkan.",
    "zh": "无法核实已启用的管理员账号。",
    "ne": "सक्रिय प्रशासक खाताहरू प्रमाणित गर्न सकिएन।"
  },
  "Cannot deactivate the last active Admin account.": {
    "ms": "Akaun Pentadbir aktif terakhir tidak boleh dinyahaktifkan.",
    "zh": "不能停用最后一个已启用的管理员账号。",
    "ne": "अन्तिम सक्रिय प्रशासक खाता निष्क्रिय गर्न मिल्दैन।"
  },
  "Unable to change employee status. The employee may be the last active Admin.": {
    "ms": "Status pekerja tidak dapat diubah. Pekerja ini mungkin Pentadbir aktif terakhir.",
    "zh": "无法更改员工状态。该员工可能是最后一位已启用的管理员。",
    "ne": "कर्मचारीको स्थिति परिवर्तन गर्न सकिएन। उनी अन्तिम सक्रिय प्रशासक हुन सक्छन्।"
  },
  "Employee activated successfully.": {
    "ms": "Pekerja berjaya diaktifkan.",
    "zh": "员工账号已成功启用。",
    "ne": "कर्मचारी सफलतापूर्वक सक्रिय गरियो।"
  },
  "Employee deactivated successfully.": {
    "ms": "Pekerja berjaya dinyahaktifkan.",
    "zh": "员工账号已成功停用。",
    "ne": "कर्मचारी सफलतापूर्वक निष्क्रिय गरियो।"
  },
  "An unexpected server error occurred.": {
    "ms": "Ralat pelayan tidak dijangka berlaku.",
    "zh": "发生意外服务器错误。",
    "ne": "सर्भरमा अनपेक्षित त्रुटि भयो।"
  }
});

export function employeeStatusText(language: EmployeeStatusLanguage, text: string): string {
  return language === "en" ? text : translations[text]?.[language] ?? text;
}
