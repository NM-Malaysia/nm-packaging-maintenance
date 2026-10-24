import "server-only";
import type { Language } from "./language";
const translations: Record<string, Record<string, string>> = {
  "Maintenance Management System": {
    "ms": "Sistem Pengurusan Penyelenggaraan",
    "zh": "维修管理系统",
    "ne": "मर्मत व्यवस्थापन प्रणाली"
  },
  "Maintenance Dashboard": {
    "ms": "Papan Pemuka Penyelenggaraan",
    "zh": "维修仪表板",
    "ne": "मर्मत ड्यासबोर्ड"
  },
  "Welcome to the NM PACKAGING maintenance portal.": {
    "ms": "Selamat datang ke portal penyelenggaraan NM PACKAGING.",
    "zh": "欢迎使用 NM PACKAGING 维修平台。",
    "ne": "NM PACKAGING मर्मत पोर्टलमा स्वागत छ।"
  },
  "HOD Approvals": {
    "ms": "Kelulusan Ketua Jabatan",
    "zh": "部门主管审批",
    "ne": "विभाग प्रमुखको स्वीकृति"
  },
  "Maintenance Requests": {
    "ms": "Permohonan Penyelenggaraan",
    "zh": "维修申请",
    "ne": "मर्मत अनुरोधहरू"
  },
  "Maintenance Team": {
    "ms": "Pasukan Penyelenggaraan",
    "zh": "维修团队",
    "ne": "मर्मत टोली"
  },
  "Machine Register": {
    "ms": "Daftar Mesin",
    "zh": "设备档案",
    "ne": "मेसिन दर्ता"
  },
  "Preventive Maintenance": {
    "ms": "Penyelenggaraan Pencegahan",
    "zh": "预防性保养",
    "ne": "निवारक मर्मत"
  },
  "Parts Follow-up & MIV": {
    "ms": "Susulan Alat Ganti & MIV",
    "zh": "备件跟进与 MIV",
    "ne": "पार्टपुर्जा अनुगमन र MIV"
  },
  "Reports & Dashboard": {
    "ms": "Laporan & Papan Pemuka",
    "zh": "报告与仪表板",
    "ne": "प्रतिवेदन र ड्यासबोर्ड"
  },
  "Employee Management": {
    "ms": "Pengurusan Pekerja",
    "zh": "员工管理",
    "ne": "कर्मचारी व्यवस्थापन"
  },
  "Repair Approvals": {
    "ms": "Kelulusan Pembaikan",
    "zh": "维修完成审批",
    "ne": "मर्मत स्वीकृति"
  },
  "Handover": {
    "ms": "Serahan",
    "zh": "交接",
    "ne": "हस्तान्तरण"
  },
  "Accessible MRFs": {
    "ms": "MRF Boleh Diakses",
    "zh": "可访问的 MRF",
    "ne": "पहुँच भएका MRF"
  },
  "Submitted MRFs": {
    "ms": "MRF Dihantar",
    "zh": "已提交的 MRF",
    "ne": "पठाइएका MRF"
  },
  "Overdue PM Tasks": {
    "ms": "Tugas PM Lewat Tempoh",
    "zh": "逾期保养任务",
    "ne": "म्याद नाघेका PM कार्य"
  },
  "Unavailable": {
    "ms": "Tidak tersedia",
    "zh": "暂不可用",
    "ne": "उपलब्ध छैन"
  },
  "Not connected": {
    "ms": "Belum disambungkan",
    "zh": "尚未连接",
    "ne": "जडान गरिएको छैन"
  },
  "Latest Maintenance Requests": {
    "ms": "Permohonan Penyelenggaraan Terkini",
    "zh": "最新维修申请",
    "ne": "पछिल्ला मर्मत अनुरोधहरू"
  },
  "Coming soon": {
    "ms": "Akan datang",
    "zh": "即将推出",
    "ne": "चाँडै आउँदैछ"
  }
};
// Dashboard detail translations
Object.assign(translations, {
  "Submit and track maintenance, repair, and modification requests.": {
    "ms": "Hantar dan jejak permohonan penyelenggaraan, pembaikan dan pengubahsuaian.",
    "zh": "提交及跟进保养、维修和改造申请。",
    "ne": "मर्मत, सम्भार र परिमार्जनका अनुरोध पठाउनुहोस् र अनुगमन गर्नुहोस्।"
  },
  "Manage assigned jobs, repairs, spare parts, and handover.": {
    "ms": "Urus kerja yang ditugaskan, pembaikan, alat ganti dan serahan.",
    "zh": "管理已分配工作、维修、备件和交接。",
    "ne": "तोकिएका काम, मर्मत, पार्टपुर्जा र हस्तान्तरण व्यवस्थापन गर्नुहोस्।"
  },
  "View equipment records, QR codes, and maintenance history.": {
    "ms": "Lihat rekod peralatan, kod QR dan sejarah penyelenggaraan.",
    "zh": "查看设备记录、二维码和维修历史。",
    "ne": "उपकरण अभिलेख, QR कोड र मर्मत इतिहास हेर्नुहोस्।"
  },
  "Manage scheduled inspections, checklists, and reminders.": {
    "ms": "Urus pemeriksaan berjadual, senarai semak dan peringatan.",
    "zh": "管理定期检查、检查清单和提醒。",
    "ne": "निर्धारित निरीक्षण, जाँचसूची र सम्झना व्यवस्थापन गर्नुहोस्।"
  },
  "Track part requests, purchase follow-up, issue dates, and MIV records across MRFs.": {
    "ms": "Jejak permintaan alat ganti, susulan pembelian, tarikh pengeluaran dan rekod MIV merentas MRF.",
    "zh": "跟进各 MRF 的备件申请、采购进度、领用日期和 MIV 记录。",
    "ne": "विभिन्न MRF का पार्टपुर्जा अनुरोध, खरिद अनुगमन, जारी मिति र MIV अभिलेख हेर्नुहोस्।"
  },
  "Monitor downtime, job progress, and maintenance performance.": {
    "ms": "Pantau masa henti, kemajuan kerja dan prestasi penyelenggaraan.",
    "zh": "监控停机时间、工作进度和维修表现。",
    "ne": "मेसिन बन्द समय, कामको प्रगति र मर्मत कार्यसम्पादन अनुगमन गर्नुहोस्।"
  },
  "Register employees, assign departments, and manage accounts.": {
    "ms": "Daftar pekerja, tetapkan jabatan dan urus akaun.",
    "zh": "登记员工、分配部门和管理账户。",
    "ne": "कर्मचारी दर्ता, विभाग तोक्ने र खाता व्यवस्थापन गर्नुहोस्।"
  },
  "+ New request →": {
    "ms": "+ Permohonan baharu →",
    "zh": "+ 新建申请 →",
    "ne": "+ नयाँ अनुरोध →"
  },
  "Open maintenance jobs →": {
    "ms": "Buka kerja penyelenggaraan →",
    "zh": "查看维修工作 →",
    "ne": "मर्मत कार्यहरू खोल्नुहोस् →"
  },
  "Available to maintenance staff": {
    "ms": "Untuk kakitangan penyelenggaraan",
    "zh": "供维修人员使用",
    "ne": "मर्मत कर्मचारीका लागि उपलब्ध"
  },
  "Open parts follow-up & MIV →": {
    "ms": "Buka susulan alat ganti & MIV →",
    "zh": "查看备件跟进与 MIV →",
    "ne": "पार्टपुर्जा अनुगमन र MIV खोल्नुहोस् →"
  },
  "Open maintenance reports →": {
    "ms": "Buka laporan penyelenggaraan →",
    "zh": "查看维修报告 →",
    "ne": "मर्मत प्रतिवेदन खोल्नुहोस् →"
  },
  "Available to Admin and Maintenance Supervisor": {
    "ms": "Untuk Admin dan Penyelia Penyelenggaraan",
    "zh": "供管理员和维修主管使用",
    "ne": "प्रशासक र मर्मत सुपरभाइजरका लागि उपलब्ध"
  },
  "Manage employees →": {
    "ms": "Urus pekerja →",
    "zh": "管理员工 →",
    "ne": "कर्मचारी व्यवस्थापन गर्नुहोस् →"
  },
  "View requests →": {
    "ms": "Lihat permohonan →",
    "zh": "查看申请 →",
    "ne": "अनुरोधहरू हेर्नुहोस् →"
  },
  "Quick actions": {
    "ms": "Tindakan pantas",
    "zh": "快捷操作",
    "ne": "द्रुत कार्यहरू"
  },
  "Latest 10 requests visible under your account permissions. Refresh this page to update.": {
    "ms": "10 permohonan terkini mengikut kebenaran akaun anda. Muat semula halaman untuk kemas kini.",
    "zh": "显示您账户权限内最新的 10 项申请。刷新页面以更新。",
    "ne": "तपाईंको खाताको अनुमतिअनुसार पछिल्ला १० अनुरोध। अद्यावधिक गर्न पृष्ठ रिफ्रेस गर्नुहोस्।"
  },
  "Some request data could not be loaded. Please refresh or contact your administrator.": {
    "ms": "Sebahagian data permohonan tidak dapat dimuatkan. Muat semula atau hubungi pentadbir.",
    "zh": "部分申请数据无法加载。请刷新页面或联系管理员。",
    "ne": "केही अनुरोध विवरण लोड भएन। रिफ्रेस गर्नुहोस् वा प्रशासकलाई सम्पर्क गर्नुहोस्।"
  },
  "MRF No.": {
    "ms": "No. MRF",
    "zh": "MRF 编号",
    "ne": "MRF नम्बर"
  },
  "Machine": {
    "ms": "Mesin",
    "zh": "设备",
    "ne": "मेसिन"
  },
  "Department": {
    "ms": "Jabatan",
    "zh": "部门",
    "ne": "विभाग"
  },
  "Status": {
    "ms": "Status",
    "zh": "状态",
    "ne": "स्थिति"
  },
  "Submitted — Malaysia time": {
    "ms": "Dihantar — waktu Malaysia",
    "zh": "提交时间 — 马来西亚时间",
    "ne": "पठाइएको — मलेसिया समय"
  },
  "Submitted": {
    "ms": "Dihantar",
    "zh": "已提交",
    "ne": "पठाइएको"
  },
  "Malaysia time": {
    "ms": "Waktu Malaysia",
    "zh": "马来西亚时间",
    "ne": "मलेसिया समय"
  },
  "No requests are visible under your account permissions.": {
    "ms": "Tiada permohonan boleh dilihat mengikut kebenaran akaun anda.",
    "zh": "您的账户权限内暂无可见申请。",
    "ne": "तपाईंको खाताको अनुमतिमा कुनै अनुरोध देखिँदैन।"
  },
  "submitted": {
    "ms": "Dihantar",
    "zh": "已提交",
    "ne": "पठाइएको"
  },
  "hod approved": {
    "ms": "Diluluskan HOD",
    "zh": "部门主管已批准",
    "ne": "विभाग प्रमुखबाट स्वीकृत"
  },
  "in progress": {
    "ms": "Sedang dijalankan",
    "zh": "进行中",
    "ne": "काम भइरहेको"
  },
  "waiting spare parts": {
    "ms": "Menunggu alat ganti",
    "zh": "等待备件",
    "ne": "पार्टपुर्जा पर्खिरहेको"
  },
  "follow up required": {
    "ms": "Susulan diperlukan",
    "zh": "待后续跟进",
    "ne": "अनुगमन आवश्यक"
  },
  "repair completed": {
    "ms": "Pembaikan selesai",
    "zh": "维修已完成",
    "ne": "मर्मत सम्पन्न"
  },
  "handover pending": {
    "ms": "Menunggu serahan",
    "zh": "待交接",
    "ne": "हस्तान्तरण पर्खिरहेको"
  },
  "closed": {
    "ms": "Ditutup",
    "zh": "已关闭",
    "ne": "बन्द"
  },
  "rejected": {
    "ms": "Ditolak",
    "zh": "已拒绝",
    "ne": "अस्वीकृत"
  }
});

export function dashboardText(language: Language, text: string): string {
  return language === "en" ? text : translations[text]?.[language] ?? text;
}

// Dashboard live MRF summary translations
Object.assign(translations, {
  "MRF status summary": {
    "ms": "Ringkasan status MRF",
    "zh": "MRF状态概览",
    "ne": "MRF स्थिति सारांश"
  },
  "Open MRFs": {
    "ms": "MRF Terbuka",
    "zh": "未关闭的MRF",
    "ne": "खुला MRF"
  },
  "In Progress": {
    "ms": "Sedang Dijalankan",
    "zh": "进行中",
    "ne": "काम भइरहेको"
  },
  "Waiting for Spare Parts": {
    "ms": "Menunggu Alat Ganti",
    "zh": "等待备件",
    "ne": "पार्टपुर्जा पर्खिरहेको"
  },
  "Pending Repair Approval": {
    "ms": "Menunggu Kelulusan Pembaikan",
    "zh": "待维修完成审批",
    "ne": "मर्मत स्वीकृति पर्खिरहेको"
  },
  "Pending Handover": {
    "ms": "Menunggu Serahan",
    "zh": "待交接",
    "ne": "हस्तान्तरण पर्खिरहेको"
  },
  "Closed MRFs": {
    "ms": "MRF Ditutup",
    "zh": "已关闭的MRF",
    "ne": "बन्द MRF"
  },
  "Counts cover all MRFs visible to your account, with no date filter. Open includes submitted, HOD-approved, in-progress, waiting, follow-up, repair-completed and handover-pending requests. The stage counts overlap with Open. Refresh to update.": {
    "ms": "Kiraan meliputi semua MRF yang boleh dilihat oleh akaun anda, tanpa penapis tarikh. MRF Terbuka merangkumi permohonan dihantar, diluluskan HOD, sedang dijalankan, menunggu alat ganti, memerlukan susulan, pembaikan selesai dan menunggu serahan. Kiraan peringkat turut termasuk dalam MRF Terbuka. Muat semula untuk mengemas kini.",
    "zh": "统计包含您账户可见的所有MRF，不设日期筛选。未关闭的MRF包括已提交、部门主管已批准、进行中、等待备件、待后续跟进、维修已完成及待交接的申请。各阶段数量也包含在未关闭总数中。刷新页面以更新。",
    "ne": "गणनामा तपाईंको खाताले देख्न सक्ने सबै MRF समावेश छन्, मिति फिल्टर छैन। खुला MRF मा पठाइएका, विभाग प्रमुखबाट स्वीकृत, काम भइरहेका, पार्टपुर्जा पर्खिरहेका, अनुगमन आवश्यक, मर्मत सम्पन्न र हस्तान्तरण बाँकी अनुरोध पर्छन्। चरणका गणना खुला MRF को कुलमा पनि समावेश छन्। अद्यावधिक गर्न रिफ्रेस गर्नुहोस्।"
  }
});

// PM dashboard schedule description
Object.assign(translations, {
  "View equipment schedules, due dates, and assigned teams.": {
    ms: "Lihat jadual peralatan, tarikh perlu dan pasukan yang ditugaskan.",
    zh: "查看设备保养计划、到期日期及负责团队。",
    ne: "उपकरण तालिका, देय मिति र तोकिएका टोलीहरू हेर्नुहोस्।",
  },
});
