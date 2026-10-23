import type { LoginLanguage } from "./loginTranslations";

const translations: Record<string, Record<string, string>> = {
  "Language": {
    "ms": "Bahasa",
    "zh": "语言",
    "ne": "भाषा"
  },
  "Maintenance Request Management System": {
    "ms": "Sistem Pengurusan Permohonan Penyelenggaraan",
    "zh": "维修申请管理系统",
    "ne": "मर्मत अनुरोध व्यवस्थापन प्रणाली"
  },
  "Reset Password": {
    "ms": "Tetapkan Semula Kata Laluan",
    "zh": "重置密码",
    "ne": "पासवर्ड रिसेट गर्नुहोस्"
  },
  "Return to Login": {
    "ms": "Kembali ke Log Masuk",
    "zh": "返回登录",
    "ne": "लगइनमा फर्कनुहोस्"
  },
  "New Password": {
    "ms": "Kata Laluan Baharu",
    "zh": "新密码",
    "ne": "नयाँ पासवर्ड"
  },
  "Confirm New Password": {
    "ms": "Sahkan Kata Laluan Baharu",
    "zh": "确认新密码",
    "ne": "नयाँ पासवर्ड पुष्टि गर्नुहोस्"
  },
  "Updating...": {
    "ms": "Mengemas kini...",
    "zh": "正在更新…",
    "ne": "अद्यावधिक हुँदैछ..."
  },
  "Update Password": {
    "ms": "Kemas Kini Kata Laluan",
    "zh": "更新密码",
    "ne": "पासवर्ड अद्यावधिक गर्नुहोस्"
  },
  "Verifying your password recovery link...": {
    "ms": "Mengesahkan pautan pemulihan kata laluan anda...",
    "zh": "正在验证密码恢复链接…",
    "ne": "तपाईंको पासवर्ड पुनःप्राप्ति लिङ्क प्रमाणित हुँदैछ..."
  },
  "Recovery link expired or invalid. Request a new one.": {
    "ms": "Pautan pemulihan tamat tempoh atau tidak sah. Mohon pautan baharu.",
    "zh": "恢复链接已过期或无效，请申请新链接。",
    "ne": "पुनःप्राप्ति लिङ्कको म्याद सकिएको वा अमान्य छ। नयाँ लिङ्क अनुरोध गर्नुहोस्।"
  },
  "This is not a password recovery link.": {
    "ms": "Ini bukan pautan pemulihan kata laluan.",
    "zh": "这不是密码恢复链接。",
    "ne": "यो पासवर्ड पुनःप्राप्ति लिङ्क होइन।"
  },
  "Invalid recovery link.": {
    "ms": "Pautan pemulihan tidak sah.",
    "zh": "恢复链接无效。",
    "ne": "पुनःप्राप्ति लिङ्क अमान्य छ।"
  },
  "Recovery link expired or invalid.": {
    "ms": "Pautan pemulihan tamat tempoh atau tidak sah.",
    "zh": "恢复链接已过期或无效。",
    "ne": "पुनःप्राप्ति लिङ्कको म्याद सकिएको वा अमान्य छ।"
  },
  "Open this page using a new password recovery email link.": {
    "ms": "Buka halaman ini melalui pautan e-mel pemulihan kata laluan yang baharu.",
    "zh": "请通过新的密码恢复邮件链接打开此页面。",
    "ne": "नयाँ पासवर्ड पुनःप्राप्ति इमेल लिङ्कबाट यो पृष्ठ खोल्नुहोस्।"
  },
  "Use a password with at least 12 characters.": {
    "ms": "Gunakan kata laluan sekurang-kurangnya 12 aksara.",
    "zh": "请使用至少12个字符的密码。",
    "ne": "कम्तीमा 12 अक्षरको पासवर्ड प्रयोग गर्नुहोस्।"
  },
  "Passwords do not match.": {
    "ms": "Kata laluan tidak sepadan.",
    "zh": "两次输入的密码不一致。",
    "ne": "पासवर्डहरू मिलेनन्।"
  },
  "Password updated successfully.": {
    "ms": "Kata laluan berjaya dikemas kini.",
    "zh": "密码已成功更新。",
    "ne": "पासवर्ड सफलतापूर्वक अद्यावधिक भयो।"
  }
};

export function resetPasswordText(language: LoginLanguage, text: string): string {
  return language === "en" ? text : translations[text]?.[language] ?? text;
}
