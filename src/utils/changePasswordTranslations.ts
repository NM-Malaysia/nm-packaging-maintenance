import type { LoginLanguage } from "./loginTranslations";

const dictionary: Record<string, Record<string, string>> = {
  "Language": {
    "ms": "Bahasa",
    "zh": "语言",
    "ne": "भाषा"
  },
  "Maintenance Request Management System": {
    "ms": "Sistem Pengurusan Permintaan Penyelenggaraan",
    "zh": "维修申请管理系统",
    "ne": "मर्मत अनुरोध व्यवस्थापन प्रणाली"
  },
  "Change Temporary Password": {
    "ms": "Tukar Kata Laluan Sementara",
    "zh": "更改临时密码",
    "ne": "अस्थायी पासवर्ड परिवर्तन गर्नुहोस्"
  },
  "Welcome": {
    "ms": "Selamat datang",
    "zh": "欢迎",
    "ne": "स्वागत छ"
  },
  "Your account requires a password change before you can access the Maintenance Dashboard.": {
    "ms": "Anda perlu menukar kata laluan sebelum mengakses papan pemuka penyelenggaraan.",
    "zh": "您必须先更改密码，才能进入维修仪表板。",
    "ne": "मर्मत ड्यासबोर्ड खोल्नुअघि तपाईंले पासवर्ड परिवर्तन गर्नुपर्छ।"
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
  "Changing Password...": {
    "ms": "Sedang menukar kata laluan...",
    "zh": "正在更改密码…",
    "ne": "पासवर्ड परिवर्तन हुँदैछ..."
  },
  "Change Password": {
    "ms": "Tukar Kata Laluan",
    "zh": "更改密码",
    "ne": "पासवर्ड परिवर्तन गर्नुहोस्"
  },
  "Return to Login": {
    "ms": "Kembali ke Log Masuk",
    "zh": "返回登录",
    "ne": "लगइनमा फर्कनुहोस्"
  },
  "Password must contain 12–128 characters.": {
    "ms": "Kata laluan mesti mengandungi 12–128 aksara.",
    "zh": "密码必须包含12至128个字符。",
    "ne": "पासवर्डमा १२–१२८ अक्षर हुनुपर्छ।"
  },
  "Passwords do not match.": {
    "ms": "Kata laluan tidak sepadan.",
    "zh": "两次输入的密码不一致。",
    "ne": "पासवर्डहरू मिलेनन्।"
  },
  "Password change failed.": {
    "ms": "Penukaran kata laluan gagal.",
    "zh": "密码更改失败。",
    "ne": "पासवर्ड परिवर्तन असफल भयो।"
  },
  "Password changed successfully. Please sign in again.": {
    "ms": "Kata laluan berjaya ditukar. Sila log masuk semula.",
    "zh": "密码已成功更改，请重新登录。",
    "ne": "पासवर्ड सफलतापूर्वक परिवर्तन भयो। कृपया फेरि लगइन गर्नुहोस्।"
  },
  "Unable to connect. Please try again.": {
    "ms": "Tidak dapat menyambung. Sila cuba lagi.",
    "zh": "无法连接，请重试。",
    "ne": "जडान हुन सकेन। कृपया फेरि प्रयास गर्नुहोस्।"
  }
};

export function changePasswordText(language: LoginLanguage, text: string): string {
  return language === "en" ? text : dictionary[text]?.[language] ?? text;
}

// Password change API error translations
Object.assign(dictionary, {
  "Please sign in again.": {
    "ms": "Sila log masuk semula.",
    "zh": "请重新登录。",
    "ne": "कृपया फेरि लगइन गर्नुहोस्।"
  },
  "Password change is not permitted.": {
    "ms": "Penukaran kata laluan tidak dibenarkan.",
    "zh": "不允许更改密码。",
    "ne": "पासवर्ड परिवर्तन गर्न अनुमति छैन।"
  },
  "Passwords must match and contain 12–128 characters.": {
    "ms": "Kata laluan mesti sepadan dan mengandungi 12–128 aksara.",
    "zh": "两次输入的密码必须一致，并包含12至128个字符。",
    "ne": "पासवर्डहरू मिल्नुपर्छ र १२–१२८ अक्षर हुनुपर्छ।"
  },
  "Password update failed. Please try again.": {
    "ms": "Kemas kini kata laluan gagal. Sila cuba lagi.",
    "zh": "密码更新失败，请重试。",
    "ne": "पासवर्ड अद्यावधिक असफल भयो। कृपया फेरि प्रयास गर्नुहोस्।"
  },
  "Password changed, but account setup is incomplete. Contact your administrator.": {
    "ms": "Kata laluan telah ditukar, tetapi persediaan akaun belum lengkap. Hubungi pentadbir anda.",
    "zh": "密码已更改，但账户设置尚未完成。请联系管理员。",
    "ne": "पासवर्ड परिवर्तन भयो, तर खाता सेटअप पूरा भएको छैन। आफ्नो प्रशासकलाई सम्पर्क गर्नुहोस्।"
  },
  "Unable to complete password change.": {
    "ms": "Tidak dapat menyelesaikan penukaran kata laluan.",
    "zh": "无法完成密码更改。",
    "ne": "पासवर्ड परिवर्तन पूरा गर्न सकिएन।"
  }
});
