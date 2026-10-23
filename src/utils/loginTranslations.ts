export type LoginLanguage = "en" | "ms" | "zh" | "ne";

export function isLoginLanguage(value: string): value is LoginLanguage {
  return ["en", "ms", "zh", "ne"].includes(value);
}

const translations: Record<string, Record<string, string>> = {
  "Language": {
    "ms": "Bahasa",
    "zh": "语言",
    "ne": "भाषा"
  },
  "Maintenance / Repair / Modification": {
    "ms": "Penyelenggaraan / Pembaikan / Pengubahsuaian",
    "zh": "保养 / 维修 / 改装",
    "ne": "नियमित मर्मतसम्भार / मर्मत / परिमार्जन"
  },
  "Request Management System": {
    "ms": "Sistem Pengurusan Permohonan",
    "zh": "申请管理系统",
    "ne": "अनुरोध व्यवस्थापन प्रणाली"
  },
  "Employee Login": {
    "ms": "Log Masuk Pekerja",
    "zh": "员工登录",
    "ne": "कर्मचारी लगइन"
  },
  "Employee ID": {
    "ms": "ID Pekerja",
    "zh": "员工编号",
    "ne": "कर्मचारी नम्बर"
  },
  "Enter Employee ID": {
    "ms": "Masukkan ID Pekerja",
    "zh": "输入员工编号",
    "ne": "कर्मचारी नम्बर भर्नुहोस्"
  },
  "Password": {
    "ms": "Kata Laluan",
    "zh": "密码",
    "ne": "पासवर्ड"
  },
  "Enter Password": {
    "ms": "Masukkan Kata Laluan",
    "zh": "输入密码",
    "ne": "पासवर्ड भर्नुहोस्"
  },
  "Hide password": {
    "ms": "Sembunyikan kata laluan",
    "zh": "隐藏密码",
    "ne": "पासवर्ड लुकाउनुहोस्"
  },
  "Show password": {
    "ms": "Tunjukkan kata laluan",
    "zh": "显示密码",
    "ne": "पासवर्ड देखाउनुहोस्"
  },
  "Signing In...": {
    "ms": "Sedang Log Masuk...",
    "zh": "正在登录…",
    "ne": "साइन इन हुँदैछ..."
  },
  "Sign In": {
    "ms": "Log Masuk",
    "zh": "登录",
    "ne": "साइन इन गर्नुहोस्"
  },
  "Forgot Password?": {
    "ms": "Lupa Kata Laluan?",
    "zh": "忘记密码？",
    "ne": "पासवर्ड बिर्सनुभयो?"
  },
  "Please enter your Employee ID and password.": {
    "ms": "Sila masukkan ID Pekerja dan kata laluan anda.",
    "zh": "请输入员工编号和密码。",
    "ne": "कृपया आफ्नो कर्मचारी नम्बर र पासवर्ड भर्नुहोस्।"
  },
  "Login failed.": {
    "ms": "Log masuk gagal.",
    "zh": "登录失败。",
    "ne": "लगइन असफल भयो।"
  },
  "Unable to connect. Please try again.": {
    "ms": "Tidak dapat menyambung. Sila cuba lagi.",
    "zh": "无法连接，请重试。",
    "ne": "जडान हुन सकेन। कृपया फेरि प्रयास गर्नुहोस्।"
  },
  "Authorized NM PACKAGING employees only.": {
    "ms": "Untuk pekerja NM PACKAGING yang dibenarkan sahaja.",
    "zh": "仅限获授权的NM PACKAGING员工使用。",
    "ne": "अधिकृत NM PACKAGING कर्मचारीका लागि मात्र।"
  },
  "Accounts are managed by the Administrator.": {
    "ms": "Akaun diuruskan oleh Pentadbir.",
    "zh": "账号由管理员管理。",
    "ne": "खाताहरू प्रशासकले व्यवस्थापन गर्छन्।"
  }
};

// Login API error translations
Object.assign(translations, {
  "Invalid Employee ID or password.": {
    "ms": "ID Pekerja atau kata laluan tidak sah.",
    "zh": "员工编号或密码不正确。",
    "ne": "कर्मचारी नम्बर वा पासवर्ड गलत छ।"
  },
  "Unable to complete login. Please try again.": {
    "ms": "Log masuk tidak dapat diselesaikan. Sila cuba lagi.",
    "zh": "无法完成登录，请重试。",
    "ne": "लगइन पूरा गर्न सकिएन। कृपया फेरि प्रयास गर्नुहोस्।"
  }
});

export function loginText(language: LoginLanguage, text: string): string {
  return language === "en" ? text : translations[text]?.[language] ?? text;
}
