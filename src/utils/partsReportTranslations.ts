import "server-only";
import type { Language } from "./language";

const translations: Record<string, Record<string, string>> = {
  "Parts follow-up report": {
    "ms": "Laporan susulan alat ganti",
    "zh": "备件跟进报告",
    "ne": "स्पेयर पार्ट्स फलो-अप प्रतिवेदन"
  },
  "Parts report could not be loaded. Refresh and try again.": {
    "ms": "Laporan alat ganti tidak dapat dimuatkan. Muat semula dan cuba lagi.",
    "zh": "无法加载备件报告，请刷新重试。",
    "ne": "पार्ट्स प्रतिवेदन लोड भएन। रिफ्रेस गरी फेरि प्रयास गर्नुहोस्।"
  },
  "Uses the MRF submission dates selected above and includes all linked part records, even when their events fall outside that date range. Updated: {updated} (Malaysia time).": {
    "ms": "Menggunakan tarikh penghantaran MRF yang dipilih di atas dan merangkumi semua rekod alat ganti berkaitan, termasuk peristiwa di luar julat tarikh tersebut. Dikemas kini: {updated} (Waktu Malaysia).",
    "zh": "按上方所选MRF提交日期筛选，并包括全部关联备件记录，即使备件相关事件发生在该日期范围之外。更新时间：{updated}（马来西亚时间）。",
    "ne": "माथि छानिएका MRF पेश मितिहरू प्रयोग गरी सबै सम्बन्धित पार्ट्स अभिलेख समावेश गर्छ, घटनाहरू उक्त मिति दायराबाहिर भए पनि। अद्यावधिक: {updated} (मलेसियाको समय)।"
  },
  "Part records": {
    "ms": "Rekod alat ganti",
    "zh": "备件记录数",
    "ne": "पार्ट्स अभिलेख"
  },
  "Pending clerk check": {
    "ms": "Menunggu semakan kerani",
    "zh": "待文员检查",
    "ne": "क्लर्कको जाँच बाँकी"
  },
  "Waiting": {
    "ms": "Menunggu",
    "zh": "等待中",
    "ne": "प्रतीक्षामा"
  },
  "Available to issue": {
    "ms": "Tersedia untuk dikeluarkan",
    "zh": "可领用",
    "ne": "वितरणका लागि उपलब्ध"
  },
  "Issued records": {
    "ms": "Rekod pengeluaran",
    "zh": "领用记录数",
    "ne": "वितरण अभिलेख"
  },
  "MIV pending": {
    "ms": "MIV belum diisi",
    "zh": "待填写MIV",
    "ne": "MIV बाँकी"
  },
  "Average recorded wait": {
    "ms": "Purata masa menunggu direkodkan",
    "zh": "平均记录等待时长",
    "ne": "औसत रेकर्ड गरिएको प्रतीक्षा समय"
  },
  "Longest recorded wait": {
    "ms": "Masa menunggu terpanjang direkodkan",
    "zh": "最长记录等待时长",
    "ne": "सबैभन्दा लामो रेकर्ड गरिएको प्रतीक्षा समय"
  },
  "Not available": {
    "ms": "Tidak tersedia",
    "zh": "无法获取",
    "ne": "उपलब्ध छैन"
  },
  "h": {
    "ms": "j",
    "zh": "小时",
    "ne": "घण्टा"
  },
  "Waiting time = Part needed → Available. {samples} valid records contribute to the waiting figures. Cancelled and still-waiting records are excluded from these averages. {cancelled} cancelled record(s) are retained in the total count. MIV Pending is a subset of Issued.": {
    "ms": "Masa menunggu = Alat ganti diperlukan → Tersedia. {samples} rekod sah digunakan untuk angka masa menunggu. Rekod dibatalkan dan masih menunggu dikecualikan daripada purata ini. {cancelled} rekod dibatalkan dikekalkan dalam jumlah rekod. MIV Belum Diisi ialah sebahagian daripada rekod Dikeluarkan.",
    "zh": "等待时间＝需要备件 → 备件到位。等待数据采用{samples}项有效记录，平均值不包括已取消及仍在等待的记录。总记录数仍包含{cancelled}项已取消记录。待填写MIV属于已领用记录的一部分。",
    "ne": "प्रतीक्षा समय = पार्ट्स आवश्यक भएको समय → उपलब्ध भएको समय। प्रतीक्षा तथ्याङ्कमा {samples} मान्य अभिलेख प्रयोग हुन्छन्। रद्द भएका र अझै प्रतीक्षामा रहेका अभिलेख यी औसतमा समावेश हुँदैनन्। कुल सङ्ख्यामा {cancelled} रद्द अभिलेख समावेश छन्। MIV बाँकी अभिलेख वितरण भइसकेकाको एक हिस्सा हो।"
  },
  "Issued parts by machine and part code": {
    "ms": "Alat ganti dikeluarkan mengikut mesin dan kod",
    "zh": "按机器及备件编码统计领用情况",
    "ne": "मेसिन र पार्ट्स कोडअनुसार वितरित पार्ट्स"
  },
  "Showing {shown} of {groups} groups, ranked by issue-record count, up to 50 groups. Quantities are summed within each machine/part-code group. Part name is a representative recorded label. Issued does not confirm installation or a recurring defect.": {
    "ms": "Menunjukkan {shown} daripada {groups} kumpulan, disusun mengikut bilangan rekod pengeluaran, maksimum 50 kumpulan. Kuantiti dijumlahkan dalam setiap kumpulan mesin/kod alat ganti. Nama alat ganti ialah label wakil daripada rekod. Pengeluaran tidak mengesahkan pemasangan atau kerosakan berulang.",
    "zh": "显示{groups}组中的{shown}组，按领用记录数排序，最多显示50组。数量按每个机器及备件编码分组汇总。备件名称采用记录中的代表名称。已领用不代表已安装，也不直接证明故障重复发生。",
    "ne": "वितरण अभिलेख सङ्ख्याअनुसार क्रमबद्ध {groups} समूहमध्ये {shown} समूह देखाइएका छन्, बढीमा 50 समूह। प्रत्येक मेसिन/पार्ट्स कोड समूहभित्र परिमाण जोडिन्छ। पार्ट्सको नाम अभिलेखबाट लिइएको प्रतिनिधि नाम हो। वितरण भएकोले जडान भएको वा खराबी दोहोरिएको पुष्टि गर्दैन।"
  },
  "Machine": {
    "ms": "Mesin",
    "zh": "机器",
    "ne": "मेसिन"
  },
  "Part code / name": {
    "ms": "Kod / nama alat ganti",
    "zh": "备件编码 / 名称",
    "ne": "पार्ट्स कोड / नाम"
  },
  "Issue records": {
    "ms": "Rekod pengeluaran",
    "zh": "领用记录数",
    "ne": "वितरण अभिलेख"
  },
  "Distinct MRFs": {
    "ms": "MRF berbeza",
    "zh": "不同MRF数",
    "ne": "फरक MRF सङ्ख्या"
  },
  "Issued quantity": {
    "ms": "Kuantiti dikeluarkan",
    "zh": "领用数量",
    "ne": "वितरित परिमाण"
  },
  "No issued parts for these MRFs.": {
    "ms": "Tiada alat ganti dikeluarkan untuk MRF ini.",
    "zh": "这些MRF暂无备件领用记录。",
    "ne": "यी MRF का लागि कुनै पार्ट्स वितरण भएको छैन।"
  },
  "Defect / replacement reason history": {
    "ms": "Sejarah kerosakan / sebab penggantian",
    "zh": "故障 / 更换原因历史",
    "ne": "खराबी / बदल्नुको कारण इतिहास"
  },
  "Showing the latest {shown} of {total} non-cancelled records with a recorded reason, up to 100. Compare reasons and repair findings to investigate repeat problems. All displayed times are Malaysia time.": {
    "ms": "Menunjukkan {shown} rekod terkini daripada {total} rekod tidak dibatalkan yang mempunyai sebab direkodkan, maksimum 100. Bandingkan sebab dan penemuan pembaikan untuk menyiasat masalah berulang. Semua masa dipaparkan dalam waktu Malaysia.",
    "zh": "显示{total}项已记录原因且未取消的记录中最新的{shown}项，最多100项。请结合原因与维修发现调查重复问题。所有显示时间均为马来西亚时间。",
    "ne": "कारण रेकर्ड भएका र रद्द नभएका {total} अभिलेखमध्ये पछिल्ला {shown} देखाइएका छन्, बढीमा 100। दोहोरिने समस्या जाँच गर्न कारण र मर्मतका निष्कर्ष तुलना गर्नुहोस्। सबै समय मलेसियाको समयमा देखाइन्छ।"
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
  "Needed:": {
    "ms": "Diperlukan:",
    "zh": "需要时间：",
    "ne": "आवश्यक भएको समय:"
  },
  "Recorded wait:": {
    "ms": "Masa menunggu direkodkan:",
    "zh": "记录等待时长：",
    "ne": "रेकर्ड गरिएको प्रतीक्षा समय:"
  },
  "Issued:": {
    "ms": "Dikeluarkan:",
    "zh": "领用时间：",
    "ne": "वितरण भएको समय:"
  },
  "MIV Pending": {
    "ms": "MIV Belum Diisi",
    "zh": "待填写MIV",
    "ne": "MIV बाँकी"
  },
  "No recorded part reasons for these MRFs.": {
    "ms": "Tiada sebab alat ganti direkodkan untuk MRF ini.",
    "zh": "这些MRF暂无备件原因记录。",
    "ne": "यी MRF का लागि पार्ट्सको कारण रेकर्ड गरिएको छैन।"
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

export function partsReportText(
  language: Language,
  text: string,
  values: Record<string, string | number> = {},
): string {
  const translated = language === "en" ? text : translations[text]?.[language] ?? text;
  return translated.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
  );
}
