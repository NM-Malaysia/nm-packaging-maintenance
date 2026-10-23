import "server-only";
import type { Language } from "./language";

const translations: Record<string, Record<string, string>> = {
  "Parts Follow-up & MIV Records": {
    "ms": "Susulan Alat Ganti & Rekod MIV",
    "zh": "备件跟进与MIV记录",
    "ne": "स्पेयर पार्ट्स फलो-अप र MIV अभिलेख"
  },
  "All MRFs · Parts Follow-up / MIV Pending →": {
    "ms": "Semua MRF · Susulan Alat Ganti / MIV Belum Diisi →",
    "zh": "所有MRF · 备件跟进 / 待填写MIV →",
    "ne": "सबै MRF · पार्ट्स फलो-अप / MIV बाँकी →"
  },
  "The clerk records part availability and issues against this MRF. Waiting time runs from Part needed to Available.": {
    "ms": "Kerani merekodkan ketersediaan dan pengeluaran alat ganti untuk MRF ini. Masa menunggu dikira dari masa diperlukan hingga tersedia.",
    "zh": "文员记录此MRF的备件到位及领用情况。等待时间从需要备件起计算至备件到位。",
    "ne": "क्लर्कले यस MRF का पार्ट्सको उपलब्धता र वितरण रेकर्ड गर्छन्। प्रतीक्षा समय पार्ट्स आवश्यक भएको समयदेखि उपलब्ध हुँदासम्म गणना हुन्छ।"
  },
  "Parts records could not be loaded. Please refresh.": {
    "ms": "Rekod alat ganti tidak dapat dimuatkan. Sila muat semula.",
    "zh": "无法加载备件记录，请刷新。",
    "ne": "पार्ट्सका अभिलेख लोड भएनन्। कृपया रिफ्रेस गर्नुहोस्।"
  },
  "Code not confirmed": {
    "ms": "Kod belum disahkan",
    "zh": "编码未确认",
    "ne": "कोड पुष्टि भएको छैन"
  },
  "Quantity:": {
    "ms": "Kuantiti:",
    "zh": "数量：",
    "ne": "परिमाण:"
  },
  "Store on hand": {
    "ms": "Stok tersedia di stor",
    "zh": "仓库现有库存",
    "ne": "स्टोरमा मौज्दात"
  },
  "Purchase required": {
    "ms": "Pembelian diperlukan",
    "zh": "需要采购",
    "ne": "खरिद आवश्यक"
  },
  "Source awaiting clerk check": {
    "ms": "Sumber menunggu semakan kerani",
    "zh": "来源待文员确认",
    "ne": "स्रोत क्लर्कको जाँचको प्रतीक्षामा"
  },
  "Needed": {
    "ms": "Diperlukan",
    "zh": "需要时间",
    "ne": "आवश्यक भएको समय"
  },
  "Ordered": {
    "ms": "Dipesan",
    "zh": "订购时间",
    "ne": "अर्डर गरिएको समय"
  },
  "Available": {
    "ms": "Tersedia",
    "zh": "到位时间",
    "ne": "उपलब्ध भएको समय"
  },
  "Issued": {
    "ms": "Dikeluarkan",
    "zh": "领用时间",
    "ne": "वितरण भएको समय"
  },
  "Not recorded": {
    "ms": "Belum direkodkan",
    "zh": "未记录",
    "ne": "रेकर्ड गरिएको छैन"
  },
  "Malaysia time": {
    "ms": "Waktu Malaysia",
    "zh": "马来西亚时间",
    "ne": "मलेसियाको समय"
  },
  "Recorded wait:": {
    "ms": "Masa menunggu direkodkan:",
    "zh": "记录等待时间：",
    "ne": "रेकर्ड गरिएको प्रतीक्षा समय:"
  },
  "minutes": {
    "ms": "minit",
    "zh": "分钟",
    "ne": "मिनेट"
  },
  "Purchase reference:": {
    "ms": "Rujukan pembelian:",
    "zh": "采购参考编号：",
    "ne": "खरिद सन्दर्भ:"
  },
  "Defect / reason:": {
    "ms": "Kerosakan / sebab:",
    "zh": "故障 / 原因：",
    "ne": "खराबी / कारण:"
  },
  "MIV Pending": {
    "ms": "MIV Belum Diisi",
    "zh": "待填写MIV",
    "ne": "MIV बाँकी"
  },
  "Update part record": {
    "ms": "Kemas kini rekod alat ganti",
    "zh": "更新备件记录",
    "ne": "पार्ट्सको अभिलेख अद्यावधिक गर्नुहोस्"
  },
  "No parts recorded for this MRF.": {
    "ms": "Tiada alat ganti direkodkan untuk MRF ini.",
    "zh": "此MRF暂无备件记录。",
    "ne": "यस MRF मा कुनै पार्ट्स रेकर्ड गरिएको छैन।"
  },
  "Your assignment could not be checked. Please refresh.": {
    "ms": "Penugasan anda tidak dapat disemak. Sila muat semula.",
    "zh": "无法检查您的任务分配，请刷新。",
    "ne": "तपाईंको जिम्मेवारी जाँच गर्न सकिएन। कृपया रिफ्रेस गर्नुहोस्।"
  },
  "+ Request Part": {
    "ms": "+ Mohon Alat Ganti",
    "zh": "+ 申请备件",
    "ne": "+ पार्ट्स अनुरोध गर्नुहोस्"
  },
  "Send the part requirement to the maintenance clerk for checking. Enter the part code only if known.": {
    "ms": "Hantar keperluan alat ganti kepada kerani penyelenggaraan untuk semakan. Isi kod alat ganti jika diketahui sahaja.",
    "zh": "将备件需求发送给维修文员检查。知道备件编码时才填写。",
    "ne": "पार्ट्सको आवश्यकता जाँचका लागि मर्मत क्लर्कलाई पठाउनुहोस्। थाहा भएमा मात्र पार्ट्सको कोड भर्नुहोस्।"
  },
  "Part name / description": {
    "ms": "Nama / keterangan alat ganti",
    "zh": "备件名称 / 描述",
    "ne": "पार्ट्सको नाम / विवरण"
  },
  "Part code — optional": {
    "ms": "Kod alat ganti — pilihan",
    "zh": "备件编码 — 选填",
    "ne": "पार्ट्सको कोड — ऐच्छिक"
  },
  "Quantity required": {
    "ms": "Kuantiti diperlukan",
    "zh": "所需数量",
    "ne": "आवश्यक परिमाण"
  },
  "Defect / reason for replacement": {
    "ms": "Kerosakan / sebab penggantian",
    "zh": "故障 / 更换原因",
    "ne": "खराबी / बदल्नुको कारण"
  },
  "The request starts as Pending Clerk Check. The clerk records availability, purchase follow-up and MIV details. This does not change the overall MRF status.": {
    "ms": "Permohonan bermula dengan status Menunggu Semakan Kerani. Kerani merekodkan ketersediaan, susulan pembelian dan butiran MIV. Ini tidak mengubah status keseluruhan MRF.",
    "zh": "申请初始状态为待文员检查。文员负责记录备件到位、采购跟进及MIV详情。这不会更改MRF整体状态。",
    "ne": "अनुरोध सुरुमा क्लर्कको जाँच बाँकी अवस्थामा रहन्छ। क्लर्कले उपलब्धता, खरिद फलो-अप र MIV विवरण रेकर्ड गर्छन्। यसले समग्र MRF को स्थिति परिवर्तन गर्दैन।"
  },
  "Submit Part Request": {
    "ms": "Hantar Permohonan Alat Ganti",
    "zh": "提交备件申请",
    "ne": "पार्ट्स अनुरोध पठाउनुहोस्"
  },
  "+ Add Part / MIV Record": {
    "ms": "+ Tambah Rekod Alat Ganti / MIV",
    "zh": "+ 添加备件 / MIV记录",
    "ne": "+ पार्ट्स / MIV अभिलेख थप्नुहोस्"
  },
  "For example: Fuji8 control circuit board": {
    "ms": "Contoh: Papan litar kawalan Fuji8",
    "zh": "例如：Fuji8控制电路板",
    "ne": "उदाहरण: Fuji8 नियन्त्रण सर्किट बोर्ड"
  },
  "pending clerk check": {
    "ms": "menunggu semakan kerani",
    "zh": "待文员检查",
    "ne": "क्लर्कको जाँच बाँकी"
  },
  "waiting": {
    "ms": "menunggu",
    "zh": "等待中",
    "ne": "प्रतीक्षामा"
  },
  "available": {
    "ms": "tersedia",
    "zh": "已到位",
    "ne": "उपलब्ध"
  },
  "issued": {
    "ms": "dikeluarkan",
    "zh": "已领用",
    "ne": "वितरण भएको"
  },
  "cancelled": {
    "ms": "dibatalkan",
    "zh": "已取消",
    "ne": "रद्द गरिएको"
  }
};

export function partsText(language: Language, text: string): string {
  return language === "en" ? text : translations[text]?.[language] ?? text;
}
