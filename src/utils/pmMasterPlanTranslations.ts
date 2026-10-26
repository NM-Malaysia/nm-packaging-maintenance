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

// Annual activity management
Object.assign(words, {
  "Edit activity": {
    "ms": "Sunting aktiviti",
    "zh": "编辑项目",
    "ne": "गतिविधि सम्पादन गर्नुहोस्"
  },
  "Remove activity": {
    "ms": "Keluarkan aktiviti",
    "zh": "移除项目",
    "ne": "गतिविधि हटाउनुहोस्"
  },
  "Reason for change": {
    "ms": "Sebab perubahan",
    "zh": "修改原因",
    "ne": "परिवर्तनको कारण"
  },
  "Reason for removal": {
    "ms": "Sebab dikeluarkan",
    "zh": "移除原因",
    "ne": "हटाउने कारण"
  },
  "Save changes": {
    "ms": "Simpan perubahan",
    "zh": "保存修改",
    "ne": "परिवर्तन सुरक्षित गर्नुहोस्"
  },
  "Confirm removal": {
    "ms": "Sahkan pengeluaran",
    "zh": "确认移除",
    "ne": "हटाउने पुष्टि गर्नुहोस्"
  },
  "I confirm these changes.": {
    "ms": "Saya mengesahkan perubahan ini.",
    "zh": "我确认以上修改。",
    "ne": "म यी परिवर्तन पुष्टि गर्छु।"
  },
  "I confirm removal of this activity.": {
    "ms": "Saya mengesahkan aktiviti ini dikeluarkan.",
    "zh": "我确认移除此项目。",
    "ne": "म यो गतिविधि हटाउने पुष्टि गर्छु।"
  },
  "Changing the asset, interval or first date replaces unused planned dates. Previous dates remain in history.": {
    "ms": "Menukar aset, sela atau tarikh pertama menggantikan tarikh dirancang yang belum digunakan. Tarikh terdahulu kekal dalam sejarah.",
    "zh": "更改资产、周期或首次日期会替换尚未使用的计划日期，原日期仍保留在历史中。",
    "ne": "सम्पत्ति, अन्तराल वा पहिलो मिति परिवर्तन गर्दा प्रयोग नभएका योजनाबद्ध मिति बदलिन्छन्। अघिल्ला मिति इतिहासमा रहन्छन्।"
  },
  "This removes the activity from the active plan and cancels its unused dates. History is retained.": {
    "ms": "Ini mengeluarkan aktiviti daripada pelan aktif dan membatalkan tarikh yang belum digunakan. Sejarah dikekalkan.",
    "zh": "此操作将从当前计划移除项目并取消未使用的日期，历史记录会保留。",
    "ne": "यसले सक्रिय योजनाबाट गतिविधि हटाउँछ र प्रयोग नभएका मिति रद्द गर्छ। इतिहास सुरक्षित रहन्छ।"
  },
  "Enter valid details, a reason and confirmation.": {
    "ms": "Masukkan butiran sah, sebab dan pengesahan.",
    "zh": "请填写有效资料、原因，并勾选确认。",
    "ne": "मान्य विवरण, कारण र पुष्टि दिनुहोस्।"
  },
  "Change was not saved. Refresh and retry. Activities with service history cannot have their asset or schedule replaced.": {
    "ms": "Perubahan tidak disimpan. Muat semula dan cuba lagi. Aset atau jadual aktiviti dengan sejarah servis tidak boleh diganti.",
    "zh": "修改未保存。请刷新后重试。已有保养记录的项目不能更换资产或计划日期安排。",
    "ne": "परिवर्तन सुरक्षित भएन। रिफ्रेस गरी फेरि प्रयास गर्नुहोस्। सेवा इतिहास भएका गतिविधिको सम्पत्ति वा तालिका बदल्न मिल्दैन।"
  }
});

// Annual activity checklists
Object.assign(words, {
  "View / Edit checklist": {
    "ms": "Lihat / Sunting senarai semak",
    "zh": "查看／编辑检查清单",
    "ne": "जाँचसूची हेर्नुहोस् / सम्पादन गर्नुहोस्"
  },
  "Checklist version": {
    "ms": "Versi senarai semak",
    "zh": "检查清单版本",
    "ne": "जाँचसूची संस्करण"
  },
  "No checklist has been set up for this activity.": {
    "ms": "Senarai semak belum ditetapkan untuk aktiviti ini.",
    "zh": "此项目尚未设置检查清单。",
    "ne": "यस गतिविधिको जाँचसूची अझै तयार गरिएको छैन।"
  },
  "Add checklist": {
    "ms": "Tambah senarai semak",
    "zh": "添加检查清单",
    "ne": "जाँचसूची थप्नुहोस्"
  },
  "Edit checklist": {
    "ms": "Sunting senarai semak",
    "zh": "编辑检查清单",
    "ne": "जाँचसूची सम्पादन गर्नुहोस्"
  },
  "Checklist items": {
    "ms": "Item senarai semak",
    "zh": "检查项目",
    "ne": "जाँच बुँदाहरू"
  },
  "Save checklist": {
    "ms": "Simpan senarai semak",
    "zh": "保存检查清单",
    "ne": "जाँचसूची सुरक्षित गर्नुहोस्"
  },
  "Enter one item per line. Up to 100 items, 500 characters each.": {
    "ms": "Masukkan satu item setiap baris. Maksimum 100 item, 500 aksara setiap item.",
    "zh": "每行输入一个项目。最多 100 项，每项最多 500 个字符。",
    "ne": "प्रत्येक पङ्क्तिमा एउटा बुँदा लेख्नुहोस्। बढीमा १०० बुँदा, प्रत्येक ५०० अक्षर।"
  },
  "Changes create a new checklist version. Annual planned dates remain unchanged.": {
    "ms": "Perubahan mencipta versi senarai semak baharu. Tarikh dirancang tahunan tidak berubah.",
    "zh": "修改后将创建新的检查清单版本，年度计划日期保持不变。",
    "ne": "परिवर्तनले नयाँ जाँचसूची संस्करण बनाउँछ। वार्षिक योजनाबद्ध मिति बदलिँदैनन्।"
  },
  "Checklist could not be loaded. Please refresh.": {
    "ms": "Senarai semak tidak dapat dimuatkan. Sila muat semula.",
    "zh": "无法加载检查清单，请刷新。",
    "ne": "जाँचसूची लोड भएन। कृपया रिफ्रेस गर्नुहोस्।"
  },
  "Enter 1 to 100 checklist items, up to 500 characters each.": {
    "ms": "Masukkan 1 hingga 100 item, maksimum 500 aksara setiap item.",
    "zh": "请输入 1 至 100 项，每项最多 500 个字符。",
    "ne": "१ देखि १०० जाँच बुँदा लेख्नुहोस्, प्रत्येक बढीमा ५०० अक्षर।"
  },
  "Another user changed this checklist. Refresh and check the latest version before saving.": {
    "ms": "Pengguna lain telah mengubah senarai semak ini. Muat semula dan semak versi terkini sebelum menyimpan.",
    "zh": "其他用户已修改此检查清单。请刷新并检查最新版本后再保存。",
    "ne": "अर्को प्रयोगकर्ताले जाँचसूची परिवर्तन गरेका छन्। सुरक्षित गर्नुअघि रिफ्रेस गरी नयाँ संस्करण जाँच्नुहोस्।"
  },
  "Checklist was not saved. Refresh and try again.": {
    "ms": "Senarai semak tidak disimpan. Muat semula dan cuba lagi.",
    "zh": "检查清单未保存。请刷新后重试。",
    "ne": "जाँचसूची सुरक्षित भएन। रिफ्रेस गरी फेरि प्रयास गर्नुहोस्।"
  }
});
