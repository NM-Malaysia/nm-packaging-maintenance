export type RequestFormLanguage = "en" | "ms" | "zh" | "ne";

const translations: Record<string, Record<string, string>> = {
  "MRF {mrf} submitted": {
    "ms": "MRF {mrf} dihantar",
    "zh": "MRF {mrf}已提交",
    "ne": "MRF {mrf} पेश भयो"
  },
  "Your maintenance request has been recorded with status Submitted.": {
    "ms": "Permohonan penyelenggaraan anda telah direkodkan dengan status Dihantar.",
    "zh": "您的维修申请已记录，状态为已提交。",
    "ne": "तपाईंको मर्मत अनुरोध पेश गरिएको स्थितिमा रेकर्ड भयो।"
  },
  "Submit another request": {
    "ms": "Hantar permohonan lain",
    "zh": "提交另一项申请",
    "ne": "अर्को अनुरोध पेश गर्नुहोस्"
  },
  "Back to dashboard": {
    "ms": "Kembali ke papan pemuka",
    "zh": "返回仪表板",
    "ne": "ड्यासबोर्डमा फर्कनुहोस्"
  },
  "Requestor:": {
    "ms": "Pemohon:",
    "zh": "申请人：",
    "ne": "अनुरोधकर्ता:"
  },
  "Department:": {
    "ms": "Jabatan:",
    "zh": "部门：",
    "ne": "विभाग:"
  },
  "Submission date and time are recorded automatically.": {
    "ms": "Tarikh dan masa penghantaran direkodkan secara automatik.",
    "zh": "提交日期和时间将自动记录。",
    "ne": "पेश गरिएको मिति र समय स्वतः रेकर्ड हुन्छ।"
  },
  "Maintenance request details": {
    "ms": "Butiran permohonan penyelenggaraan",
    "zh": "维修申请详情",
    "ne": "मर्मत अनुरोध विवरण"
  },
  "Paper MRF number *": {
    "ms": "Nombor MRF kertas *",
    "zh": "纸本MRF编号 *",
    "ne": "कागजी MRF नम्बर *"
  },
  "e.g. 00125": {
    "ms": "contoh: 00125",
    "zh": "例如：00125",
    "ne": "उदाहरण: 00125"
  },
  "Enter exactly five digits from your existing paper form.": {
    "ms": "Masukkan tepat lima digit daripada borang kertas sedia ada.",
    "zh": "请填写现有纸本表格上的五位数字编号。",
    "ne": "आफ्नो कागजी फारामको ठीक पाँच अङ्कको नम्बर भर्नुहोस्।"
  },
  "Machine / equipment *": {
    "ms": "Mesin / peralatan *",
    "zh": "机器 / 设备 *",
    "ne": "मेसिन / उपकरण *"
  },
  "e.g. Fuji8": {
    "ms": "contoh: Fuji8",
    "zh": "例如：Fuji8",
    "ne": "उदाहरण: Fuji8"
  },
  "Request type *": {
    "ms": "Jenis permohonan *",
    "zh": "申请类型 *",
    "ne": "अनुरोधको प्रकार *"
  },
  "Select request type": {
    "ms": "Pilih jenis permohonan",
    "zh": "选择申请类型",
    "ne": "अनुरोधको प्रकार छान्नुहोस्"
  },
  "Repair": {
    "ms": "Pembaikan",
    "zh": "维修",
    "ne": "मर्मत"
  },
  "Maintenance": {
    "ms": "Penyelenggaraan",
    "zh": "保养",
    "ne": "नियमित मर्मतसम्भार"
  },
  "Modification": {
    "ms": "Pengubahsuaian",
    "zh": "改装",
    "ne": "परिमार्जन"
  },
  "Maintenance / repair / modification details *": {
    "ms": "Butiran penyelenggaraan / pembaikan / pengubahsuaian *",
    "zh": "保养 / 维修 / 改装详情 *",
    "ne": "नियमित मर्मतसम्भार / मर्मत / परिमार्जन विवरण *"
  },
  "Describe the fault, location and work required.": {
    "ms": "Terangkan kerosakan, lokasi dan kerja yang diperlukan.",
    "zh": "请描述故障、位置及所需工作。",
    "ne": "खराबी, स्थान र आवश्यक कामको विवरण लेख्नुहोस्।"
  },
  "Machine / equipment downtime applies": {
    "ms": "Melibatkan masa henti mesin / peralatan",
    "zh": "涉及机器 / 设备停机",
    "ne": "मेसिन / उपकरण बन्द समय लागू हुन्छ"
  },
  "Downtime started — Malaysia time (UTC+8) *": {
    "ms": "Masa henti bermula — Waktu Malaysia (UTC+8) *",
    "zh": "停机开始时间 — 马来西亚时间（UTC+8）*",
    "ne": "मेसिन बन्द हुन सुरु भएको समय — मलेसियाको समय (UTC+8) *"
  },
  "Submitting…": {
    "ms": "Menghantar…",
    "zh": "正在提交…",
    "ne": "पेश हुँदैछ…"
  },
  "Submit maintenance request": {
    "ms": "Hantar permohonan penyelenggaraan",
    "zh": "提交维修申请",
    "ne": "मर्मत अनुरोध पेश गर्नुहोस्"
  }
};

// Request submission error translations
Object.assign(translations, {
  "Enter the five-digit paper MRF number, including leading zeros.": {
    "ms": "Masukkan nombor MRF kertas lima digit, termasuk sifar di hadapan.",
    "zh": "请输入纸本MRF的五位数字编号，包括开头的零。",
    "ne": "अगाडिका शून्यसहित कागजी MRF को पाँच अङ्कको नम्बर भर्नुहोस्।"
  },
  "Enter a machine/equipment name of up to 200 characters.": {
    "ms": "Masukkan nama mesin/peralatan sehingga 200 aksara.",
    "zh": "请输入机器或设备名称，最多200个字符。",
    "ne": "200 अक्षरसम्मको मेसिन वा उपकरणको नाम भर्नुहोस्।"
  },
  "Enter maintenance details of up to 10,000 characters.": {
    "ms": "Masukkan butiran penyelenggaraan sehingga 10,000 aksara.",
    "zh": "请输入维修详情，最多10,000个字符。",
    "ne": "10,000 अक्षरसम्मको मर्मत विवरण भर्नुहोस्।"
  },
  "Select a request type.": {
    "ms": "Pilih jenis permohonan.",
    "zh": "请选择申请类型。",
    "ne": "अनुरोधको प्रकार छान्नुहोस्।"
  },
  "Enter the downtime start date and time.": {
    "ms": "Masukkan tarikh dan masa mula henti mesin.",
    "zh": "请输入停机开始日期和时间。",
    "ne": "मेसिन बन्द हुन सुरु भएको मिति र समय भर्नुहोस्।"
  },
  "Downtime start must be a valid date and cannot be in the future.": {
    "ms": "Masa mula henti mesin mesti sah dan tidak boleh pada masa hadapan.",
    "zh": "停机开始时间必须有效，且不能晚于当前时间。",
    "ne": "मेसिन बन्द हुन सुरु भएको मिति र समय मान्य हुनुपर्छ र भविष्यको हुन मिल्दैन।"
  },
  "Your session expired. Please sign in again.": {
    "ms": "Sesi anda telah tamat. Sila log masuk semula.",
    "zh": "您的登录会话已过期，请重新登录。",
    "ne": "तपाईंको सत्र समाप्त भयो। कृपया फेरि साइन इन गर्नुहोस्।"
  },
  "Only active Requestors and Department HODs can submit requests.": {
    "ms": "Hanya Pemohon dan HOD Jabatan yang aktif boleh menghantar permohonan.",
    "zh": "仅在职且账号启用的申请人及部门主管可提交申请。",
    "ne": "सक्रिय अनुरोधकर्ता र विभाग प्रमुखले मात्र अनुरोध पेश गर्न सक्छन्।"
  },
  "Complete your first-login password change before submitting.": {
    "ms": "Lengkapkan penukaran kata laluan log masuk pertama sebelum menghantar.",
    "zh": "提交前，请先完成首次登录的密码更改。",
    "ne": "पेश गर्नुअघि पहिलो लगइनको पासवर्ड परिवर्तन पूरा गर्नुहोस्।"
  },
  "Unable to confirm your department. Contact your administrator.": {
    "ms": "Jabatan anda tidak dapat disahkan. Hubungi pentadbir.",
    "zh": "无法确认您的部门，请联系管理员。",
    "ne": "तपाईंको विभाग पुष्टि गर्न सकिएन। प्रशासकलाई सम्पर्क गर्नुहोस्।"
  },
  "This MRF number already exists. Check the paper form number before submitting again.": {
    "ms": "Nombor MRF ini sudah wujud. Semak nombor borang kertas sebelum menghantar semula.",
    "zh": "此MRF编号已存在，请核对纸本表格编号后再提交。",
    "ne": "यो MRF नम्बर पहिले नै छ। फेरि पेश गर्नुअघि कागजी फारामको नम्बर जाँच गर्नुहोस्।"
  },
  "Submission was not confirmed. Check your connection and account permissions. If you are unsure whether it saved, ask the maintenance clerk to check the MRF number before retrying.": {
    "ms": "Penghantaran tidak disahkan. Semak sambungan dan kebenaran akaun anda. Jika tidak pasti sama ada rekod telah disimpan, minta kerani penyelenggaraan menyemak nombor MRF sebelum mencuba lagi.",
    "zh": "提交未确认。请检查网络连接及账号权限。如不确定是否已保存，请先请维修文员检查MRF编号，再重试。",
    "ne": "पेश भएको पुष्टि भएन। आफ्नो जडान र खाताको अनुमति जाँच गर्नुहोस्। बचत भयो कि भएन निश्चित नभएमा फेरि प्रयास गर्नुअघि मर्मत क्लर्कलाई MRF नम्बर जाँच गर्न भन्नुहोस्।"
  },
  "Submission was not confirmed. Check whether this MRF number was saved before retrying.": {
    "ms": "Penghantaran tidak disahkan. Semak sama ada nombor MRF ini telah disimpan sebelum mencuba lagi.",
    "zh": "提交未确认。重试前，请先检查此MRF编号是否已保存。",
    "ne": "पेश भएको पुष्टि भएन। फेरि प्रयास गर्नुअघि यो MRF नम्बर बचत भएको छ कि छैन जाँच गर्नुहोस्।"
  }
});

export function requestFormText(
  language: RequestFormLanguage,
  text: string,
  values: Record<string, string | number> = {},
): string {
  const translated = language === "en" ? text : translations[text]?.[language] ?? text;
  return translated.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
  );
}
