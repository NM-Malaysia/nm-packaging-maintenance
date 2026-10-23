import "server-only";
import type { Language } from "./language";

const translations: Record<string, Record<string, string>> = {
  "Handover details could not be loaded. Please refresh.": {
    "ms": "Butiran serah terima tidak dapat dimuatkan. Sila muat semula.",
    "zh": "无法加载交接详情，请刷新。",
    "ne": "हस्तान्तरण विवरण लोड भएन। कृपया रिफ्रेस गर्नुहोस्।"
  },
  "Completed maintenance handover": {
    "ms": "Serah terima kerja penyelenggaraan yang selesai",
    "zh": "已完成维修的交接",
    "ne": "पूरा भएको मर्मतको हस्तान्तरण"
  },
  "Verify checklist → Maintenance sign-off → Requestor acceptance": {
    "ms": "Sahkan senarai semak → Tandatangan penyelenggaraan → Penerimaan pemohon",
    "zh": "验证检查清单 → 维修方签署 → 申请人验收",
    "ne": "जाँचसूची प्रमाणित गर्नुहोस् → मर्मत पक्षको हस्ताक्षर → अनुरोधकर्ताको स्वीकृति"
  },
  "Handover checklist": {
    "ms": "Senarai semak serah terima",
    "zh": "交接检查清单",
    "ne": "हस्तान्तरण जाँचसूची"
  },
  "Machine functions correctly": {
    "ms": "Mesin berfungsi dengan betul",
    "zh": "机器各项功能正常",
    "ne": "मेसिनका कार्यहरू ठीक छन्"
  },
  "Bolts and nuts are tightened": {
    "ms": "Bolt dan nat telah diketatkan",
    "zh": "螺栓与螺母已紧固",
    "ne": "बोल्ट र नट कसिएका छन्"
  },
  "Workplace is clean": {
    "ms": "Tempat kerja bersih",
    "zh": "工作区域已清洁",
    "ne": "कार्यस्थल सफा छ"
  },
  "No temporary modifications remain": {
    "ms": "Tiada pengubahsuaian sementara yang masih ada",
    "zh": "已无临时改装遗留",
    "ne": "कुनै अस्थायी परिमार्जन बाँकी छैन"
  },
  "Checklist remarks": {
    "ms": "Catatan senarai semak",
    "zh": "检查清单备注",
    "ne": "जाँचसूची टिप्पणी"
  },
  "Tick only items you have verified. Resolve outstanding items before signing.": {
    "ms": "Tandakan hanya item yang telah anda sahkan. Selesaikan perkara tertunggak sebelum menandatangani.",
    "zh": "仅勾选您已验证的项目。签署前请解决待处理事项。",
    "ne": "आफूले प्रमाणित गरेका बुँदाहरूमा मात्र चिन्ह लगाउनुहोस्। हस्ताक्षर गर्नुअघि बाँकी काम समाधान गर्नुहोस्।"
  },
  "Update verified checklist": {
    "ms": "Kemas kini senarai semak yang disahkan",
    "zh": "更新已验证的检查清单",
    "ne": "प्रमाणित जाँचसूची अद्यावधिक गर्नुहोस्"
  },
  "Save verified checklist": {
    "ms": "Simpan senarai semak yang disahkan",
    "zh": "保存已验证的检查清单",
    "ne": "प्रमाणित जाँचसूची बचत गर्नुहोस्"
  },
  "Checklist verified:": {
    "ms": "Senarai semak disahkan:",
    "zh": "检查清单验证时间：",
    "ne": "जाँचसूची प्रमाणित भएको समय:"
  },
  "Malaysia time": {
    "ms": "Waktu Malaysia",
    "zh": "马来西亚时间",
    "ne": "मलेसियाको समय"
  },
  "Maintenance handover": {
    "ms": "Serah terima penyelenggaraan",
    "zh": "维修方交接",
    "ne": "मर्मत पक्षको हस्तान्तरण"
  },
  "Requestor acceptance": {
    "ms": "Penerimaan pemohon",
    "zh": "申请人验收",
    "ne": "अनुरोधकर्ताको स्वीकृति"
  },
  "Signed": {
    "ms": "Ditandatangani",
    "zh": "已签署",
    "ne": "हस्ताक्षर गरिएको"
  },
  "Pending": {
    "ms": "Menunggu",
    "zh": "待办理",
    "ne": "बाँकी"
  },
  "by you": {
    "ms": "oleh anda",
    "zh": "由您签署",
    "ne": "तपाईंले हस्ताक्षर गरेको"
  },
  "Signing as:": {
    "ms": "Menandatangani sebagai:",
    "zh": "签署人：",
    "ne": "हस्ताक्षरकर्ता:"
  },
  "Maintenance handover comments": {
    "ms": "Ulasan serah terima penyelenggaraan",
    "zh": "维修方交接意见",
    "ne": "मर्मत हस्तान्तरण टिप्पणी"
  },
  "Requestor acceptance comments": {
    "ms": "Ulasan penerimaan pemohon",
    "zh": "申请人验收意见",
    "ne": "अनुरोधकर्ताको स्वीकृति टिप्पणी"
  },
  "I confirm the verified maintenance work is ready for handover.": {
    "ms": "Saya mengesahkan kerja penyelenggaraan yang telah disahkan sedia untuk diserah terima.",
    "zh": "我确认已验证的维修工作可以交接。",
    "ne": "प्रमाणित मर्मत कार्य हस्तान्तरणका लागि तयार छ भनेर म पुष्टि गर्छु।"
  },
  "I have checked the handover and accept the completed maintenance work.": {
    "ms": "Saya telah memeriksa serah terima dan menerima kerja penyelenggaraan yang selesai.",
    "zh": "我已检查交接情况，并接受已完成的维修工作。",
    "ne": "मैले हस्तान्तरण जाँच गरी पूरा भएको मर्मत कार्य स्वीकार गरेको छु।"
  },
  "Your signature locks the checklist. Requestor acceptance is still required.": {
    "ms": "Tandatangan anda mengunci senarai semak. Penerimaan pemohon masih diperlukan.",
    "zh": "签署后检查清单将锁定，仍需申请人验收。",
    "ne": "तपाईंको हस्ताक्षरपछि जाँचसूची लक हुन्छ। अनुरोधकर्ताको स्वीकृति अझै आवश्यक छ।"
  },
  "Acceptance records your signature and closes this MRF.": {
    "ms": "Penerimaan merekodkan tandatangan anda dan menutup MRF ini.",
    "zh": "验收将记录您的签署并关闭此MRF。",
    "ne": "स्वीकृतिले तपाईंको हस्ताक्षर रेकर्ड गरी यो MRF बन्द गर्छ।"
  },
  "Sign Maintenance Handover": {
    "ms": "Tandatangani Serah Terima Penyelenggaraan",
    "zh": "签署维修交接",
    "ne": "मर्मत हस्तान्तरणमा हस्ताक्षर गर्नुहोस्"
  },
  "Accept Handover & Close MRF": {
    "ms": "Terima Serah Terima & Tutup MRF",
    "zh": "接受交接并关闭MRF",
    "ne": "हस्तान्तरण स्वीकार गरी MRF बन्द गर्नुहोस्"
  },
  "Awaiting checklist verification by the maintenance supervisor or Admin.": {
    "ms": "Menunggu pengesahan senarai semak oleh penyelia penyelenggaraan atau Pentadbir.",
    "zh": "等待维修主管或管理员验证检查清单。",
    "ne": "मर्मत सुपरभाइजर वा प्रशासकबाट जाँचसूची प्रमाणीकरणको प्रतीक्षामा।"
  },
  "Awaiting maintenance handover signature.": {
    "ms": "Menunggu tandatangan serah terima penyelenggaraan.",
    "zh": "等待维修方签署交接。",
    "ne": "मर्मत हस्तान्तरण हस्ताक्षरको प्रतीक्षामा।"
  },
  "Awaiting acceptance by the original requestor or their Department HOD using a different account.": {
    "ms": "Menunggu penerimaan oleh pemohon asal atau HOD jabatan mereka menggunakan akaun yang berbeza.",
    "zh": "等待原申请人或其部门主管使用不同账号验收。",
    "ne": "मूल अनुरोधकर्ता वा उनीहरूको विभाग प्रमुखले फरक खाताबाट स्वीकार गर्ने प्रतीक्षामा।"
  },
  "MRF Closed": {
    "ms": "MRF Ditutup",
    "zh": "MRF已关闭",
    "ne": "MRF बन्द भयो"
  }
};

export function handoverText(language: Language, text: string): string {
  return language === "en" ? text : translations[text]?.[language] ?? text;
}
