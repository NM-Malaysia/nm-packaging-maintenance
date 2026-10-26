import "server-only";
import type { Language } from "./language";

const words: Record<string, Record<string, string>> = {
  "Annual PM Master Plan": {
    "ms": "Pelan Induk PM Tahunan",
    "zh": "年度 PM 总计划",
    "ne": "वार्षिक PM मूल योजना"
  },
  "Dashboard": {
    "ms": "Papan Pemuka",
    "zh": "仪表板",
    "ne": "ड्यासबोर्ड"
  },
  "Year": {
    "ms": "Tahun",
    "zh": "年份",
    "ne": "वर्ष"
  },
  "Show plan": {
    "ms": "Papar pelan",
    "zh": "查看计划",
    "ne": "योजना देखाउनुहोस्"
  },
  "Create annual plan": {
    "ms": "Cipta pelan tahunan",
    "zh": "创建年度计划",
    "ne": "वार्षिक योजना बनाउनुहोस्"
  },
  "Plan title": {
    "ms": "Tajuk pelan",
    "zh": "计划名称",
    "ne": "योजनाको शीर्षक"
  },
  "No master plan exists for this year.": {
    "ms": "Tiada pelan induk bagi tahun ini.",
    "zh": "此年份尚未建立总计划。",
    "ne": "यस वर्षको मूल योजना छैन।"
  },
  "Add PM activity": {
    "ms": "Tambah aktiviti PM",
    "zh": "添加 PM 项目",
    "ne": "PM गतिविधि थप्नुहोस्"
  },
  "Equipment / Facility": {
    "ms": "Peralatan / Kemudahan",
    "zh": "设备／设施",
    "ne": "उपकरण / सुविधा"
  },
  "Select registered asset": {
    "ms": "Pilih aset berdaftar",
    "zh": "选择已登记资产",
    "ne": "दर्ता गरिएको सम्पत्ति छान्नुहोस्"
  },
  "PM activity": {
    "ms": "Aktiviti PM",
    "zh": "PM 保养项目",
    "ne": "PM गतिविधि"
  },
  "Interval (months)": {
    "ms": "Sela (bulan)",
    "zh": "周期（月）",
    "ne": "अन्तराल (महिना)"
  },
  "First planned date": {
    "ms": "Tarikh pertama dirancang",
    "zh": "首次计划日期",
    "ne": "पहिलो योजनाबद्ध मिति"
  },
  "Instructions": {
    "ms": "Arahan",
    "zh": "保养说明",
    "ne": "निर्देशन"
  },
  "Add activity and planned dates": {
    "ms": "Tambah aktiviti dan tarikh dirancang",
    "zh": "添加项目并生成计划日期",
    "ne": "गतिविधि र योजनाबद्ध मिति थप्नुहोस्"
  },
  "Planned dates are generated within the selected year. Technician assignment is not required during annual planning.": {
    "ms": "Tarikh dirancang dijana dalam tahun dipilih. Penugasan juruteknik tidak diperlukan semasa perancangan tahunan.",
    "zh": "计划日期仅在所选年度内生成。年度规划阶段无需分配技术员。",
    "ne": "योजनाबद्ध मितिहरू चयन गरिएको वर्षभित्र बनाइन्छन्। वार्षिक योजना बनाउँदा प्राविधिक तोक्न आवश्यक छैन।"
  },
  "Saved successfully.": {
    "ms": "Berjaya disimpan.",
    "zh": "保存成功。",
    "ne": "सफलतापूर्वक सुरक्षित भयो।"
  },
  "Check the required fields and dates.": {
    "ms": "Semak medan wajib dan tarikh.",
    "zh": "请检查必填项和日期。",
    "ne": "आवश्यक विवरण र मिति जाँच्नुहोस्।"
  },
  "This activity already exists for this asset in the annual plan.": {
    "ms": "Aktiviti ini sudah wujud bagi aset ini dalam pelan tahunan.",
    "zh": "此资产在年度计划中已有同名项目。",
    "ne": "यो सम्पत्तिको लागि वार्षिक योजनामा यो गतिविधि पहिले नै छ।"
  },
  "The change was not saved. Refresh and try again.": {
    "ms": "Perubahan tidak disimpan. Muat semula dan cuba lagi.",
    "zh": "修改未保存。请刷新后重试。",
    "ne": "परिवर्तन सुरक्षित भएन। रिफ्रेस गरी फेरि प्रयास गर्नुहोस्।"
  },
  "Master plan could not be loaded.": {
    "ms": "Pelan induk tidak dapat dimuatkan.",
    "zh": "无法加载总计划。",
    "ne": "मूल योजना लोड भएन।"
  },
  "Asset list could not be loaded.": {
    "ms": "Senarai aset tidak dapat dimuatkan.",
    "zh": "无法加载资产列表。",
    "ne": "सम्पत्ति सूची लोड भएन।"
  },
  "No active registered assets are available.": {
    "ms": "Tiada aset berdaftar aktif tersedia.",
    "zh": "暂无启用的登记资产。",
    "ne": "सक्रिय दर्ता सम्पत्ति उपलब्ध छैनन्।"
  },
  "Equipment & Facilities Register": {
    "ms": "Daftar Peralatan & Kemudahan",
    "zh": "设备及设施档案",
    "ne": "उपकरण तथा सुविधा दर्ता"
  },
  "Activities": {
    "ms": "Aktiviti",
    "zh": "保养项目数",
    "ne": "गतिविधिहरू"
  },
  "Planned dates": {
    "ms": "Tarikh dirancang",
    "zh": "计划日期",
    "ne": "योजनाबद्ध मितिहरू"
  },
  "No PM activities have been added.": {
    "ms": "Tiada aktiviti PM ditambah.",
    "zh": "尚未添加 PM 项目。",
    "ne": "PM गतिविधि थपिएका छैनन्।"
  },
  "Asset unavailable": {
    "ms": "Aset tidak tersedia",
    "zh": "资产暂不可用",
    "ne": "सम्पत्ति उपलब्ध छैन"
  },
  "Previous": {
    "ms": "Sebelumnya",
    "zh": "上一页",
    "ne": "अघिल्लो"
  },
  "Next": {
    "ms": "Seterusnya",
    "zh": "下一页",
    "ne": "अर्को"
  },
  "Page": {
    "ms": "Halaman",
    "zh": "页",
    "ne": "पृष्ठ"
  },
  "The grid shows planned dates. Original plan dates are retained for comparison with actual work.": {
    "ms": "Jadual menunjukkan tarikh dirancang. Tarikh asal dikekalkan untuk perbandingan dengan kerja sebenar.",
    "zh": "表格显示计划日期。原计划日期将保留，用于对照实际执行情况。",
    "ne": "तालिकाले योजनाबद्ध मिति देखाउँछ। वास्तविक कामसँग तुलना गर्न मूल मिति सुरक्षित रहन्छ।"
  },
  "Asset list exceeds the current selection limit. Register selection needs narrowing before adding activities.": {
    "ms": "Senarai aset melebihi had pilihan semasa. Pilihan perlu dikecilkan sebelum menambah aktiviti.",
    "zh": "资产数量超过当前选择上限，添加项目前需要缩小选择范围。",
    "ne": "सम्पत्ति सूची हालको छनोट सीमाभन्दा बढी छ। गतिविधि थप्नुअघि छनोट सीमित गर्नुपर्छ।"
  }
};

export function pmMasterPlanText(language: Language, text: string): string {
  return language === "en" ? text : words[text]?.[language] ?? text;
}
