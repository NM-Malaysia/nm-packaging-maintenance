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
  "Forgot Password": {
    "ms": "Lupa Kata Laluan",
    "zh": "忘记密码",
    "ne": "पासवर्ड बिर्सनुभयो"
  },
  "Registered Email Address": {
    "ms": "Alamat E-mel Berdaftar",
    "zh": "已登记的电子邮箱",
    "ne": "दर्ता गरिएको इमेल ठेगाना"
  },
  "Enter your registered email": {
    "ms": "Masukkan e-mel berdaftar anda",
    "zh": "输入已登记的电子邮箱",
    "ne": "आफ्नो दर्ता गरिएको इमेल भर्नुहोस्"
  },
  "Sending...": {
    "ms": "Menghantar...",
    "zh": "正在发送…",
    "ne": "पठाउँदैछ..."
  },
  "Send Recovery Email": {
    "ms": "Hantar E-mel Pemulihan",
    "zh": "发送密码恢复邮件",
    "ne": "पासवर्ड पुनःप्राप्ति इमेल पठाउनुहोस्"
  },
  "Return to Login": {
    "ms": "Kembali ke Log Masuk",
    "zh": "返回登录",
    "ne": "लगइनमा फर्कनुहोस्"
  },
  "Unable to send recovery email. Please try again later or contact your administrator.": {
    "ms": "E-mel pemulihan tidak dapat dihantar. Sila cuba lagi kemudian atau hubungi pentadbir.",
    "zh": "无法发送密码恢复邮件。请稍后重试或联系管理员。",
    "ne": "पुनःप्राप्ति इमेल पठाउन सकिएन। पछि फेरि प्रयास गर्नुहोस् वा प्रशासकलाई सम्पर्क गर्नुहोस्।"
  },
  "If this email belongs to an account, a password recovery link will be sent.": {
    "ms": "Jika e-mel ini dikaitkan dengan akaun, pautan pemulihan kata laluan akan dihantar.",
    "zh": "如果此邮箱关联了账号，系统将发送密码恢复链接。",
    "ne": "यो इमेल कुनै खातासँग सम्बन्धित भएमा पासवर्ड पुनःप्राप्ति लिङ्क पठाइनेछ।"
  },
  "If your account has no accessible email address, contact your administrator for a password reset.": {
    "ms": "Jika akaun anda tiada alamat e-mel yang boleh diakses, hubungi pentadbir untuk menetapkan semula kata laluan.",
    "zh": "如果您的账号没有可访问的邮箱，请联系管理员重置密码。",
    "ne": "तपाईंको खातामा पहुँचयोग्य इमेल छैन भने पासवर्ड रिसेट गर्न प्रशासकलाई सम्पर्क गर्नुहोस्।"
  }
};

export function forgotPasswordText(language: LoginLanguage, text: string): string {
  return language === "en" ? text : translations[text]?.[language] ?? text;
}
