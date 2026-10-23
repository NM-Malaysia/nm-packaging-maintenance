import "server-only";
import type { Language } from "./language";

const translations: Record<string, Record<string, string>> = {
  "← Back to dashboard": {
    "ms": "← Kembali ke papan pemuka",
    "zh": "← 返回仪表板",
    "ne": "← ड्यासबोर्डमा फर्कनुहोस्"
  },
  "HOD Request Approvals": {
    "ms": "Kelulusan Permohonan oleh HOD",
    "zh": "部门主管申请审批",
    "ne": "विभाग प्रमुखको अनुरोध स्वीकृति"
  },
  "Reviewer:": {
    "ms": "Penyemak:",
    "zh": "审核人：",
    "ne": "समीक्षक:"
  },
  "Oldest 100 submitted requests visible under your account permissions. Decisions are recorded with your identity and signing time.": {
    "ms": "100 permohonan terawal yang boleh dilihat mengikut kebenaran akaun anda. Keputusan direkodkan bersama identiti dan masa tandatangan anda.",
    "zh": "显示您账号权限范围内最早提交的100项申请。审批决定将记录您的身份及签署时间。",
    "ne": "तपाईंको खाताको अनुमतिअनुसार देखिने सबैभन्दा पुराना 100 पेश गरिएका अनुरोधहरू। निर्णयसँग तपाईंको पहिचान र हस्ताक्षर समय रेकर्ड हुन्छ।"
  },
  "Approval saved. The request is now HOD Approved.": {
    "ms": "Kelulusan disimpan. Permohonan kini berstatus Diluluskan HOD.",
    "zh": "批准已保存，申请现为部门主管已批准。",
    "ne": "स्वीकृति बचत भयो। अनुरोध अब विभाग प्रमुखबाट स्वीकृत छ।"
  },
  "Rejection saved. The request is now Rejected.": {
    "ms": "Penolakan disimpan. Permohonan kini berstatus Ditolak.",
    "zh": "拒绝决定已保存，申请现为已拒绝。",
    "ne": "अस्वीकृति बचत भयो। अनुरोध अब अस्वीकृत छ।"
  },
  "Select a valid decision. Rejection requires comments.": {
    "ms": "Pilih keputusan yang sah. Penolakan memerlukan ulasan.",
    "zh": "请选择有效决定。拒绝申请时必须填写意见。",
    "ne": "मान्य निर्णय छान्नुहोस्। अस्वीकार गर्दा टिप्पणी अनिवार्य छ।"
  },
  "Review was not confirmed. Refresh and check the request status before retrying. Your account may lack permission, or another reviewer may have already processed it.": {
    "ms": "Semakan tidak disahkan. Muat semula dan semak status permohonan sebelum mencuba lagi. Akaun anda mungkin tiada kebenaran, atau penyemak lain telah memprosesnya.",
    "zh": "审核未确认。请刷新并检查申请状态后重试。您的账号可能没有权限，或其他审核人已处理此申请。",
    "ne": "समीक्षा पुष्टि भएन। फेरि प्रयास गर्नुअघि रिफ्रेस गरी अनुरोधको स्थिति जाँच गर्नुहोस्। तपाईंको खातामा अनुमति नहुन सक्छ वा अर्को समीक्षकले प्रक्रिया पूरा गरिसकेको हुन सक्छ।"
  },
  "Unable to load requests. Refresh or contact your administrator.": {
    "ms": "Permohonan tidak dapat dimuatkan. Muat semula atau hubungi pentadbir.",
    "zh": "无法加载申请，请刷新或联系管理员。",
    "ne": "अनुरोधहरू लोड भएनन्। रिफ्रेस गर्नुहोस् वा प्रशासकलाई सम्पर्क गर्नुहोस्।"
  },
  "No submitted requests are awaiting your review.": {
    "ms": "Tiada permohonan yang menunggu semakan anda.",
    "zh": "暂无等待您审核的已提交申请。",
    "ne": "तपाईंको समीक्षाको प्रतीक्षामा कुनै पेश गरिएको अनुरोध छैन।"
  },
  "Machine": {
    "ms": "Mesin",
    "zh": "机器",
    "ne": "मेसिन"
  },
  "Department": {
    "ms": "Jabatan",
    "zh": "部门",
    "ne": "विभाग"
  },
  "Request type": {
    "ms": "Jenis permohonan",
    "zh": "申请类型",
    "ne": "अनुरोधको प्रकार"
  },
  "Submitted — Malaysia time": {
    "ms": "Dihantar — Waktu Malaysia",
    "zh": "提交时间 — 马来西亚时间",
    "ne": "पेश गरिएको समय — मलेसियाको समय"
  },
  "Downtime applies": {
    "ms": "Melibatkan masa henti",
    "zh": "是否涉及停机",
    "ne": "मेसिन बन्द समय लागू हुन्छ"
  },
  "Yes": {
    "ms": "Ya",
    "zh": "是",
    "ne": "हो"
  },
  "No": {
    "ms": "Tidak",
    "zh": "否",
    "ne": "होइन"
  },
  "Downtime started — Malaysia time": {
    "ms": "Masa henti bermula — Waktu Malaysia",
    "zh": "停机开始时间 — 马来西亚时间",
    "ne": "मेसिन बन्द हुन सुरु भएको समय — मलेसियाको समय"
  },
  "Work requested": {
    "ms": "Kerja dimohon",
    "zh": "申请维修内容",
    "ne": "अनुरोध गरिएको काम"
  },
  "Decision *": {
    "ms": "Keputusan *",
    "zh": "审批决定 *",
    "ne": "निर्णय *"
  },
  "Select decision": {
    "ms": "Pilih keputusan",
    "zh": "选择决定",
    "ne": "निर्णय छान्नुहोस्"
  },
  "Approve request": {
    "ms": "Luluskan permohonan",
    "zh": "批准申请",
    "ne": "अनुरोध स्वीकृत गर्नुहोस्"
  },
  "Reject request": {
    "ms": "Tolak permohonan",
    "zh": "拒绝申请",
    "ne": "अनुरोध अस्वीकार गर्नुहोस्"
  },
  "Comments — required for rejection": {
    "ms": "Ulasan — wajib untuk penolakan",
    "zh": "意见 — 拒绝时必填",
    "ne": "टिप्पणी — अस्वीकार गर्दा अनिवार्य"
  },
  "Clicking Confirm records your decision and changes the request status.": {
    "ms": "Klik Sahkan untuk merekodkan keputusan anda dan menukar status permohonan.",
    "zh": "点击确认将记录您的决定并更改申请状态。",
    "ne": "पुष्टि गर्दा तपाईंको निर्णय रेकर्ड हुन्छ र अनुरोधको स्थिति परिवर्तन हुन्छ।"
  },
  "Confirm decision for MRF": {
    "ms": "Sahkan keputusan untuk MRF",
    "zh": "确认审批决定 — MRF",
    "ne": "निर्णय पुष्टि गर्नुहोस् — MRF"
  },
  "repair": {
    "ms": "pembaikan",
    "zh": "维修",
    "ne": "मर्मत"
  },
  "maintenance": {
    "ms": "penyelenggaraan",
    "zh": "保养",
    "ne": "नियमित मर्मतसम्भार"
  },
  "modification": {
    "ms": "pengubahsuaian",
    "zh": "改装",
    "ne": "परिमार्जन"
  }
};

export function hodApprovalText(language: Language, text: string): string {
  return language === "en" ? text : translations[text]?.[language] ?? text;
}
