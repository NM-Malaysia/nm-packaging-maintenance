import "server-only";
import type { Language } from "./language";

const translations: Record<string, Record<string, string>> = {
  "← Dashboard": {
    "ms": "← Papan Pemuka",
    "zh": "← 仪表板",
    "ne": "← ड्यासबोर्ड"
  },
  "Maintenance Handover": {
    "ms": "Serah Terima Penyelenggaraan",
    "zh": "维修交接",
    "ne": "मर्मत हस्तान्तरण"
  },
  "Pending handovers visible under your account permissions.": {
    "ms": "Serah terima tertangguh yang boleh dilihat mengikut kebenaran akaun anda.",
    "zh": "显示您账号权限范围内的待交接项目。",
    "ne": "तपाईंको खाताको अनुमतिअनुसार देखिने बाँकी हस्तान्तरणहरू।"
  },
  "Show pending handovers": {
    "ms": "Tunjukkan serah terima tertangguh",
    "zh": "显示待交接项目",
    "ne": "बाँकी हस्तान्तरणहरू देखाउनुहोस्"
  },
  "Handover checklist verified and saved.": {
    "ms": "Senarai semak serah terima disahkan dan disimpan.",
    "zh": "交接检查清单已验证并保存。",
    "ne": "हस्तान्तरण जाँचसूची प्रमाणित गरी बचत गरियो।"
  },
  "Maintenance handover signed. Requestor acceptance is pending.": {
    "ms": "Serah terima penyelenggaraan ditandatangani. Menunggu penerimaan pemohon.",
    "zh": "维修方已签署交接，等待申请人验收。",
    "ne": "मर्मत हस्तान्तरणमा हस्ताक्षर भयो। अनुरोधकर्ताको स्वीकृति बाँकी छ।"
  },
  "Handover accepted. This MRF is now Closed.": {
    "ms": "Serah terima diterima. MRF ini kini Ditutup.",
    "zh": "交接已验收，此MRF现已关闭。",
    "ne": "हस्तान्तरण स्वीकार भयो। यो MRF अब बन्द भयो।"
  },
  "Complete the required fields, checklist and confirmation.": {
    "ms": "Lengkapkan medan wajib, senarai semak dan pengesahan.",
    "zh": "请填写必填项目、完成检查清单并确认。",
    "ne": "अनिवार्य विवरण, जाँचसूची र पुष्टि पूरा गर्नुहोस्।"
  },
  "Handover was not saved. Refresh and check the stage and signing account. The terminal contains the exact error.": {
    "ms": "Serah terima tidak disimpan. Muat semula dan semak peringkat serta akaun penandatangan. Ralat terperinci terdapat dalam terminal.",
    "zh": "交接未保存。请刷新并检查当前阶段及签署账号。具体错误可在终端查看。",
    "ne": "हस्तान्तरण बचत भएन। रिफ्रेस गरी चरण र हस्ताक्षर गर्ने खाता जाँच गर्नुहोस्। विस्तृत त्रुटि टर्मिनलमा छ।"
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
  "No pending handovers are available for your account.": {
    "ms": "Tiada serah terima tertangguh tersedia untuk akaun anda.",
    "zh": "您的账号暂无待交接项目。",
    "ne": "तपाईंको खाताका लागि कुनै बाँकी हस्तान्तरण उपलब्ध छैन।"
  },
  "Handover pages": {
    "ms": "Halaman serah terima",
    "zh": "交接分页",
    "ne": "हस्तान्तरण पृष्ठहरू"
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
  "requestor": {
    "ms": "pemohon",
    "zh": "申请人",
    "ne": "अनुरोधकर्ता"
  },
  "maintenance supervisor": {
    "ms": "penyelia penyelenggaraan",
    "zh": "维修主管",
    "ne": "मर्मत सुपरभाइजर"
  },
  "maintenance technician": {
    "ms": "juruteknik penyelenggaraan",
    "zh": "维修技术员",
    "ne": "मर्मत प्राविधिक"
  },
  "maintenance clerk": {
    "ms": "kerani penyelenggaraan",
    "zh": "维修文员",
    "ne": "मर्मत क्लर्क"
  },
  "handover pending": {
    "ms": "menunggu serah terima",
    "zh": "待交接",
    "ne": "हस्तान्तरण बाँकी"
  },
  "closed": {
    "ms": "ditutup",
    "zh": "已关闭",
    "ne": "बन्द भएको"
  }
};

export function handoverPageText(
  language: Language,
  text: string,
  values: Record<string, string | number> = {},
): string {
  const translated = language === "en" ? text : translations[text]?.[language] ?? text;
  return translated.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
  );
}
