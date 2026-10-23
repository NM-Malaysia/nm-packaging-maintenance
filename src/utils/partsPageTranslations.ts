import "server-only";
import type { Language } from "./language";
import { partsText } from "./partsTranslations";

const translations: Record<string, Record<string, string>> = {
  "← Dashboard": {
    "ms": "← Papan Pemuka",
    "zh": "← 仪表板",
    "ne": "← ड्यासबोर्ड"
  },
  "Parts across MRFs. All displayed times are Malaysia time. Open an MRF to update availability or issue details.": {
    "ms": "Alat ganti merentas MRF. Semua masa dipaparkan dalam waktu Malaysia. Buka MRF untuk mengemas kini ketersediaan atau butiran pengeluaran.",
    "zh": "各MRF的备件记录。所有显示时间均为马来西亚时间。打开MRF可更新备件到位或领用详情。",
    "ne": "विभिन्न MRF का पार्ट्स। सबै समय मलेसियाको समयमा देखाइन्छ। उपलब्धता वा वितरण विवरण अद्यावधिक गर्न MRF खोल्नुहोस्।"
  },
  "MIV Pending": {
    "ms": "MIV Belum Diisi",
    "zh": "待填写MIV",
    "ne": "MIV बाँकी"
  },
  "Pending Check": {
    "ms": "Menunggu Semakan",
    "zh": "待检查",
    "ne": "जाँच बाँकी"
  },
  "Waiting / Purchase": {
    "ms": "Menunggu / Pembelian",
    "zh": "等待 / 采购",
    "ne": "प्रतीक्षा / खरिद"
  },
  "Available to Issue": {
    "ms": "Tersedia untuk Dikeluarkan",
    "zh": "可领用",
    "ne": "वितरणका लागि उपलब्ध"
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
  "Search MRF, machine, part or MIV": {
    "ms": "Cari MRF, mesin, alat ganti atau MIV",
    "zh": "搜索MRF、机器、备件或MIV",
    "ne": "MRF, मेसिन, पार्ट्स वा MIV खोज्नुहोस्"
  },
  "Search": {
    "ms": "Cari",
    "zh": "搜索",
    "ne": "खोज्नुहोस्"
  },
  "Reset": {
    "ms": "Set semula",
    "zh": "重置",
    "ne": "रिसेट"
  },
  "Parts could not be loaded. Please refresh.": {
    "ms": "Alat ganti tidak dapat dimuatkan. Sila muat semula.",
    "zh": "无法加载备件，请刷新。",
    "ne": "पार्ट्स लोड भएनन्। कृपया रिफ्रेस गर्नुहोस्।"
  },
  "{count} item(s) · Page {page} of {pages} · 20 per page": {
    "ms": "{count} item · Halaman {page} daripada {pages} · 20 setiap halaman",
    "zh": "共{count}项 · 第{page}页，共{pages}页 · 每页20项",
    "ne": "{count} वस्तु · पृष्ठ {page} / {pages} · प्रति पृष्ठ 20"
  },
  "One MIV for selected items": {
    "ms": "Satu MIV untuk item terpilih",
    "zh": "为所选项目填写同一个MIV",
    "ne": "छानिएका वस्तुहरूका लागि एउटै MIV"
  },
  "Tick the items below, then enter their shared voucher number. Selection applies to this page only.": {
    "ms": "Tandakan item di bawah, kemudian masukkan nombor baucar yang dikongsi. Pilihan hanya terpakai pada halaman ini.",
    "zh": "勾选下方项目，再输入共用凭单编号。选择仅适用于当前页。",
    "ne": "तलका वस्तुहरू छान्नुहोस् र तिनको साझा भौचर नम्बर भर्नुहोस्। छनोट यस पृष्ठमा मात्र लागू हुन्छ।"
  },
  "MIV number": {
    "ms": "Nombor MIV",
    "zh": "MIV编号",
    "ne": "MIV नम्बर"
  },
  "I checked that all selected items belong to this MIV. The number locks after saving.": {
    "ms": "Saya telah menyemak bahawa semua item terpilih tergolong dalam MIV ini. Nombor dikunci selepas disimpan.",
    "zh": "我已核对所有所选项目均属于此MIV。保存后编号将锁定。",
    "ne": "मैले सबै छानिएका वस्तुहरू यस MIV का हुन् भनेर जाँच गरेको छु। बचतपछि नम्बर लक हुन्छ।"
  },
  "Save MIV for Selected Items": {
    "ms": "Simpan MIV untuk Item Terpilih",
    "zh": "为所选项目保存MIV",
    "ne": "छानिएका वस्तुहरूको MIV बचत गर्नुहोस्"
  },
  "MIV saved for {count} selected item(s).": {
    "ms": "MIV disimpan untuk {count} item terpilih.",
    "zh": "已为{count}个所选项目保存MIV。",
    "ne": "{count} छानिएका वस्तुहरूको MIV बचत भयो।"
  },
  "Select items, enter an MIV number and tick the confirmation.": {
    "ms": "Pilih item, masukkan nombor MIV dan tandakan pengesahan.",
    "zh": "请选择项目、输入MIV编号并勾选确认。",
    "ne": "वस्तुहरू छान्नुहोस्, MIV नम्बर भर्नुहोस् र पुष्टि बाकसमा चिन्ह लगाउनुहोस्।"
  },
  "MIV was not saved. A selected item may already have another MIV number. Refresh and check the records.": {
    "ms": "MIV tidak disimpan. Item terpilih mungkin sudah mempunyai nombor MIV lain. Muat semula dan semak rekod.",
    "zh": "MIV未保存。所选项目可能已有其他MIV编号，请刷新并检查记录。",
    "ne": "MIV बचत भएन। छानिएको वस्तुमा अर्को MIV नम्बर हुन सक्छ। रिफ्रेस गरी अभिलेख जाँच गर्नुहोस्।"
  },
  "Needed:": {
    "ms": "Diperlukan:",
    "zh": "需要时间：",
    "ne": "आवश्यक भएको समय:"
  },
  "Issued:": {
    "ms": "Dikeluarkan:",
    "zh": "领用时间：",
    "ne": "वितरण भएको समय:"
  },
  "MIV not recorded": {
    "ms": "MIV belum direkodkan",
    "zh": "尚未记录MIV",
    "ne": "MIV रेकर्ड गरिएको छैन"
  },
  "No items found in this tab.": {
    "ms": "Tiada item ditemui dalam tab ini.",
    "zh": "此选项卡中没有项目。",
    "ne": "यस ट्याबमा कुनै वस्तु भेटिएन।"
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
  "Part status": {
    "ms": "Status alat ganti",
    "zh": "备件状态",
    "ne": "पार्ट्सको स्थिति"
  },
  "Pagination": {
    "ms": "Halaman",
    "zh": "分页",
    "ne": "पृष्ठहरू"
  },
  "Select {part}, MRF {mrf}": {
    "ms": "Pilih {part}, MRF {mrf}",
    "zh": "选择{part}，MRF {mrf}",
    "ne": "{part}, MRF {mrf} छान्नुहोस्"
  }
};

export function partsPageText(
  language: Language,
  text: string,
  values: Record<string, string | number> = {},
): string {
  const translated = language === "en" ? text
    : translations[text]?.[language] ?? partsText(language, text);
  return translated.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
  );
}
