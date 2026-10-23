export type PartFormLanguage = "en" | "ms" | "zh" | "ne";

const translations: Record<string, Record<string, string>> = {
  "Saving...": {
    "ms": "Menyimpan...",
    "zh": "正在保存…",
    "ne": "बचत हुँदैछ..."
  },
  "Save part update": {
    "ms": "Simpan kemas kini alat ganti",
    "zh": "保存备件更新",
    "ne": "पार्ट्सको अद्यावधिक बचत गर्नुहोस्"
  },
  "Add part record": {
    "ms": "Tambah rekod alat ganti",
    "zh": "添加备件记录",
    "ne": "पार्ट्सको अभिलेख थप्नुहोस्"
  },
  "Part status": {
    "ms": "Status alat ganti",
    "zh": "备件状态",
    "ne": "पार्ट्सको स्थिति"
  },
  "Waiting": {
    "ms": "Menunggu",
    "zh": "等待中",
    "ne": "प्रतीक्षामा"
  },
  "Available": {
    "ms": "Tersedia",
    "zh": "已到位",
    "ne": "उपलब्ध"
  },
  "Issued": {
    "ms": "Dikeluarkan",
    "zh": "已领用",
    "ne": "वितरण भएको"
  },
  "Cancelled": {
    "ms": "Dibatalkan",
    "zh": "已取消",
    "ne": "रद्द गरिएको"
  },
  "Source": {
    "ms": "Sumber",
    "zh": "来源",
    "ne": "स्रोत"
  },
  "Select confirmed source": {
    "ms": "Pilih sumber yang disahkan",
    "zh": "选择已确认来源",
    "ne": "पुष्टि भएको स्रोत छान्नुहोस्"
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
  "Confirmed part code": {
    "ms": "Kod alat ganti yang disahkan",
    "zh": "已确认备件编码",
    "ne": "पुष्टि भएको पार्ट्स कोड"
  },
  "Part name": {
    "ms": "Nama alat ganti",
    "zh": "备件名称",
    "ne": "पार्ट्सको नाम"
  },
  "Quantity": {
    "ms": "Kuantiti",
    "zh": "数量",
    "ne": "परिमाण"
  },
  "Part needed": {
    "ms": "Alat ganti diperlukan",
    "zh": "需要备件时间",
    "ne": "पार्ट्स आवश्यक भएको समय"
  },
  "Malaysia time": {
    "ms": "Waktu Malaysia",
    "zh": "马来西亚时间",
    "ne": "मलेसियाको समय"
  },
  "Purchase follow-up": {
    "ms": "Susulan pembelian",
    "zh": "采购跟进",
    "ne": "खरिद फलो-अप"
  },
  "Purchase reference": {
    "ms": "Rujukan pembelian",
    "zh": "采购参考编号",
    "ne": "खरिद सन्दर्भ"
  },
  "Actual order time": {
    "ms": "Masa pesanan sebenar",
    "zh": "实际订购时间",
    "ne": "वास्तविक अर्डर समय"
  },
  "Part availability": {
    "ms": "Ketersediaan alat ganti",
    "zh": "备件到位情况",
    "ne": "पार्ट्सको उपलब्धता"
  },
  "Actual availability time": {
    "ms": "Masa ketersediaan sebenar",
    "zh": "实际到位时间",
    "ne": "वास्तविक उपलब्धता समय"
  },
  "Issue / MIV details": {
    "ms": "Butiran pengeluaran / MIV",
    "zh": "领用 / MIV详情",
    "ne": "वितरण / MIV विवरण"
  },
  "Actual issue time": {
    "ms": "Masa pengeluaran sebenar",
    "zh": "实际领用时间",
    "ne": "वास्तविक वितरण समय"
  },
  "MIV number — optional, can be added later": {
    "ms": "Nombor MIV — pilihan, boleh ditambah kemudian",
    "zh": "MIV编号 — 选填，可稍后补充",
    "ne": "MIV नम्बर — ऐच्छिक, पछि थप्न सकिन्छ"
  },
  "Defect / reason for replacement": {
    "ms": "Kerosakan / sebab penggantian",
    "zh": "故障 / 更换原因",
    "ne": "खराबी / बदल्नुको कारण"
  },
  "Cancellation reason — required": {
    "ms": "Sebab pembatalan — wajib",
    "zh": "取消原因 — 必填",
    "ne": "रद्द गर्नुको कारण — अनिवार्य"
  },
  "Follow-up notes": {
    "ms": "Catatan susulan",
    "zh": "跟进备注",
    "ne": "फलो-अप टिप्पणी"
  },
  "Waiting: availability and issue dates are not submitted.": {
    "ms": "Menunggu: tarikh ketersediaan dan pengeluaran tidak dihantar.",
    "zh": "等待中：不提交到位和领用日期。",
    "ne": "प्रतीक्षामा: उपलब्धता र वितरण मिति पठाइँदैन।"
  },
  "Available: record when the part actually became available.": {
    "ms": "Tersedia: rekodkan masa alat ganti benar-benar tersedia.",
    "zh": "已到位：记录备件实际到位时间。",
    "ne": "उपलब्ध: पार्ट्स वास्तवमा उपलब्ध भएको समय रेकर्ड गर्नुहोस्।"
  },
  "Issued: availability and issue times are required. Part details lock after saving; the MIV number can be added later.": {
    "ms": "Dikeluarkan: masa ketersediaan dan pengeluaran wajib diisi. Butiran alat ganti dikunci selepas disimpan; nombor MIV boleh ditambah kemudian.",
    "zh": "已领用：必须填写到位和领用时间。保存后备件详情将锁定；MIV编号可稍后补充。",
    "ne": "वितरण भएको: उपलब्धता र वितरण समय अनिवार्य छन्। बचतपछि पार्ट्स विवरण लक हुन्छ; MIV नम्बर पछि थप्न सकिन्छ।"
  },
  "Cancelled: explain why the part is no longer required. Saving locks this record.": {
    "ms": "Dibatalkan: jelaskan sebab alat ganti tidak lagi diperlukan. Rekod dikunci selepas disimpan.",
    "zh": "已取消：说明不再需要此备件的原因。保存后记录将锁定。",
    "ne": "रद्द गरिएको: पार्ट्स अब किन आवश्यक छैन भनेर खुलाउनुहोस्। बचतपछि अभिलेख लक हुन्छ।"
  },
  "Use actual dates in chronological order.": {
    "ms": "Gunakan tarikh sebenar mengikut urutan masa.",
    "zh": "请按时间先后顺序填写实际日期。",
    "ne": "वास्तविक मितिहरू समयक्रमअनुसार प्रयोग गर्नुहोस्।"
  },
  "Returning to Waiting clears the saved availability date.": {
    "ms": "Kembali kepada Menunggu akan memadamkan tarikh ketersediaan yang disimpan.",
    "zh": "改回等待中将清除已保存的到位日期。",
    "ne": "प्रतीक्षामा फर्काउँदा बचत गरिएको उपलब्धता मिति हट्छ।"
  }
};

export function partFormText(language: PartFormLanguage, text: string): string {
  return language === "en" ? text : translations[text]?.[language] ?? text;
}
