import "server-only";
import type { Language } from "./language";

const translations: Record<string, Record<string, string>> = {
  "← Dashboard": {
    "ms": "← Papan Pemuka",
    "zh": "← 仪表板",
    "ne": "← ड्यासबोर्ड"
  },
  "Repair Approvals": {
    "ms": "Kelulusan Pembaikan",
    "zh": "维修审批",
    "ne": "मर्मत स्वीकृतिहरू"
  },
  "Completed repairs and pending handovers visible under your account permissions.": {
    "ms": "Pembaikan selesai dan serah terima tertangguh yang boleh dilihat mengikut kebenaran akaun anda.",
    "zh": "显示您账号权限范围内已完成的维修及待交接项目。",
    "ne": "तपाईंको खाताको अनुमतिअनुसार देखिने पूरा भएका मर्मत र बाँकी हस्तान्तरणहरू।"
  },
  "Show all repairs": {
    "ms": "Tunjukkan semua pembaikan",
    "zh": "显示所有维修",
    "ne": "सबै मर्मत देखाउनुहोस्"
  },
  "Approval recorded successfully.": {
    "ms": "Kelulusan berjaya direkodkan.",
    "zh": "审批已成功记录。",
    "ne": "स्वीकृति सफलतापूर्वक रेकर्ड भयो।"
  },
  "Enter comments and tick the review confirmation.": {
    "ms": "Masukkan ulasan dan tandakan pengesahan semakan.",
    "zh": "请填写意见并勾选审核确认。",
    "ne": "टिप्पणी भर्नुहोस् र समीक्षा पुष्टि बाकसमा चिन्ह लगाउनुहोस्।"
  },
  "Approval was not saved. Check the MRF stage and your role, then refresh. The terminal contains the exact error.": {
    "ms": "Kelulusan tidak disimpan. Semak peringkat MRF dan peranan anda, kemudian muat semula. Ralat terperinci terdapat dalam terminal.",
    "zh": "审批未保存。请检查MRF阶段及您的角色后刷新。具体错误可在终端查看。",
    "ne": "स्वीकृति बचत भएन। MRF को चरण र आफ्नो भूमिका जाँच गरी रिफ्रेस गर्नुहोस्। विस्तृत त्रुटि टर्मिनलमा छ।"
  },
  "Repairs could not be loaded.": {
    "ms": "Pembaikan tidak dapat dimuatkan.",
    "zh": "无法加载维修记录。",
    "ne": "मर्मत अभिलेख लोड भएनन्।"
  },
  "View full work and task details →": {
    "ms": "Lihat butiran penuh kerja dan tugasan →",
    "zh": "查看完整工作及任务详情 →",
    "ne": "काम र कार्यको पूरा विवरण हेर्नुहोस् →"
  },
  "No completed repairs are available for your account.": {
    "ms": "Tiada pembaikan selesai tersedia untuk akaun anda.",
    "zh": "您的账号暂无可查看的已完成维修。",
    "ne": "तपाईंको खाताका लागि पूरा भएका मर्मत उपलब्ध छैनन्।"
  },
  "Approval pages": {
    "ms": "Halaman kelulusan",
    "zh": "审批分页",
    "ne": "स्वीकृति पृष्ठहरू"
  },
  "← Previous": {
    "ms": "← Sebelumnya",
    "zh": "← 上一页",
    "ne": "← अघिल्लो"
  },
  "Next →": {
    "ms": "Seterusnya →",
    "zh": "下一页 →",
    "ne": "अर्को →"
  },
  "Page {page} of {pages}": {
    "ms": "Halaman {page} daripada {pages}",
    "zh": "第{page}页，共{pages}页",
    "ne": "पृष्ठ {page} / {pages}"
  },
  "admin": {
    "ms": "pentadbir",
    "zh": "管理员",
    "ne": "प्रशासक"
  },
  "department hod": {
    "ms": "HOD jabatan",
    "zh": "部门主管",
    "ne": "विभाग प्रमुख"
  },
  "repair completed": {
    "ms": "pembaikan selesai",
    "zh": "维修已完成",
    "ne": "मर्मत पूरा भएको"
  },
  "handover pending": {
    "ms": "menunggu serah terima",
    "zh": "待交接",
    "ne": "हस्तान्तरण बाँकी"
  }
};

export function repairApprovalPageText(
  language: Language,
  text: string,
  values: Record<string, string | number> = {},
): string {
  const translated = language === "en" ? text : translations[text]?.[language] ?? text;
  return translated.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
  );
}
