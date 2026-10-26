import "server-only";
import type { Language } from "./language";

const words: Record<string, Record<string, string>> = {
  "PM service": {
    "ms": "Servis PM",
    "zh": "PM 保养执行",
    "ne": "PM सेवा"
  },
  "Back to PM schedules": {
    "ms": "Kembali ke jadual PM",
    "zh": "返回保养计划",
    "ne": "PM तालिकामा फर्कनुहोस्"
  },
  "Start PM Service": {
    "ms": "Mula Servis PM",
    "zh": "开始 PM 保养",
    "ne": "PM सेवा सुरु गर्नुहोस्"
  },
  "View latest service": {
    "ms": "Lihat servis terkini",
    "zh": "查看最近保养记录",
    "ne": "पछिल्लो सेवा हेर्नुहोस्"
  },
  "Service records unavailable. Please refresh.": {
    "ms": "Rekod servis tidak tersedia. Sila muat semula.",
    "zh": "无法加载保养记录，请刷新。",
    "ne": "सेवा अभिलेख उपलब्ध छैन। कृपया रिफ्रेस गर्नुहोस्।"
  },
  "Unable to start service. Check the checklist, equipment and assigned team, then retry.": {
    "ms": "Tidak dapat memulakan servis. Semak senarai semak, peralatan dan pasukan, kemudian cuba lagi.",
    "zh": "无法开始保养。请检查清单、设备和负责团队后重试。",
    "ne": "सेवा सुरु भएन। जाँचसूची, उपकरण र टोली जाँचेर फेरि प्रयास गर्नुहोस्।"
  },
  "Service unavailable or access denied.": {
    "ms": "Servis tidak tersedia atau akses ditolak.",
    "zh": "保养记录不可用或无查看权限。",
    "ne": "सेवा उपलब्ध छैन वा पहुँच अनुमति छैन।"
  },
  "In Progress": {
    "ms": "Sedang dijalankan",
    "zh": "进行中",
    "ne": "काम भइरहेको"
  },
  "Awaiting Review": {
    "ms": "Menunggu semakan",
    "zh": "待审核",
    "ne": "समीक्षा पर्खिरहेको"
  },
  "Completed": {
    "ms": "Selesai",
    "zh": "已完成",
    "ne": "सम्पन्न"
  },
  "Scheduled due date": {
    "ms": "Tarikh perlu dijadualkan",
    "zh": "计划到期日",
    "ne": "निर्धारित देय मिति"
  },
  "Started": {
    "ms": "Bermula",
    "zh": "开始时间",
    "ne": "सुरु भएको"
  },
  "Malaysia time": {
    "ms": "Waktu Malaysia",
    "zh": "马来西亚时间",
    "ne": "मलेसिया समय"
  },
  "Service checklist": {
    "ms": "Senarai semak servis",
    "zh": "保养检查清单",
    "ne": "सेवा जाँचसूची"
  },
  "Select result": {
    "ms": "Pilih keputusan",
    "zh": "选择结果",
    "ne": "नतिजा छान्नुहोस्"
  },
  "Pass": {
    "ms": "Lulus",
    "zh": "通过",
    "ne": "ठीक"
  },
  "Fail": {
    "ms": "Gagal",
    "zh": "不通过",
    "ne": "असफल"
  },
  "Not applicable": {
    "ms": "Tidak berkenaan",
    "zh": "不适用",
    "ne": "लागू हुँदैन"
  },
  "Not checked": {
    "ms": "Belum diperiksa",
    "zh": "未检查",
    "ne": "जाँच गरिएको छैन"
  },
  "Notes — required for Fail or Not applicable": {
    "ms": "Nota — wajib bagi Gagal atau Tidak berkenaan",
    "zh": "备注—不通过或不适用时必填",
    "ne": "टिप्पणी — असफल वा लागू नहुनेमा अनिवार्य"
  },
  "Save result": {
    "ms": "Simpan keputusan",
    "zh": "保存结果",
    "ne": "नतिजा सुरक्षित गर्नुहोस्"
  },
  "Assigned team and work notes": {
    "ms": "Pasukan ditugaskan dan nota kerja",
    "zh": "负责团队及工作记录",
    "ne": "तोकिएको टोली र कामको टिप्पणी"
  },
  "Finished": {
    "ms": "Selesai",
    "zh": "已完成个人工作",
    "ne": "काम सकिएको"
  },
  "Unfinished": {
    "ms": "Belum selesai",
    "zh": "个人工作未完成",
    "ne": "काम नसकिएको"
  },
  "My work notes": {
    "ms": "Nota kerja saya",
    "zh": "我的工作记录",
    "ne": "मेरो कामको टिप्पणी"
  },
  "I have finished my assigned work. This locks my notes.": {
    "ms": "Saya telah menyelesaikan kerja yang ditugaskan. Nota saya akan dikunci.",
    "zh": "我已完成负责的工作，提交后将锁定个人记录。",
    "ne": "मैले तोकिएको काम सकेँ। यसले मेरो टिप्पणी लक गर्छ।"
  },
  "Finish My Part": {
    "ms": "Selesaikan Bahagian Saya",
    "zh": "完成我的部分",
    "ne": "मेरो भाग सक्नुहोस्"
  },
  "Record all checklist results before finishing your part.": {
    "ms": "Rekodkan semua keputusan sebelum menyelesaikan bahagian anda.",
    "zh": "请先记录所有检查结果，再完成个人工作。",
    "ne": "आफ्नो भाग सक्नुअघि सबै जाँच नतिजा लेख्नुहोस्।"
  },
  "Supervisor review": {
    "ms": "Semakan penyelia",
    "zh": "主管审核",
    "ne": "सुपरभाइजर समीक्षा"
  },
  "Review notes": {
    "ms": "Nota semakan",
    "zh": "审核意见",
    "ne": "समीक्षा टिप्पणी"
  },
  "Follow-up action — required if any check failed": {
    "ms": "Tindakan susulan — wajib jika ada pemeriksaan gagal",
    "zh": "后续措施—存在不通过项目时必填",
    "ne": "अनुगमन कार्य — कुनै जाँच असफल भएमा अनिवार्य"
  },
  "I have reviewed the results and recorded any required follow-up.": {
    "ms": "Saya telah menyemak keputusan dan merekodkan susulan yang diperlukan.",
    "zh": "我已审核结果，并记录所需后续措施。",
    "ne": "मैले नतिजा समीक्षा गरी आवश्यक अनुगमन लेखेको छु।"
  },
  "Confirm Service Completed": {
    "ms": "Sahkan Servis Selesai",
    "zh": "确认保养完成",
    "ne": "सेवा सम्पन्न पुष्टि गर्नुहोस्"
  },
  "Next due date is calculated from service completion date plus the saved interval. Follow-up notes do not create an MRF.": {
    "ms": "Tarikh perlu seterusnya dikira daripada tarikh servis selesai ditambah sela yang disimpan. Nota susulan tidak mencipta MRF.",
    "zh": "下次到期日按保养完成日期加已保存间隔计算。后续措施备注不会自动创建 MRF。",
    "ne": "अर्को देय मिति सेवा सकिएको मिति र सुरक्षित अन्तरालबाट गणना हुन्छ। अनुगमन टिप्पणीले MRF बनाउँदैन।"
  },
  "Saved successfully.": {
    "ms": "Berjaya disimpan.",
    "zh": "保存成功。",
    "ne": "सफलतापूर्वक सुरक्षित भयो।"
  },
  "Complete the required fields and confirmation.": {
    "ms": "Lengkapkan medan wajib dan pengesahan.",
    "zh": "请填写必填项并勾选确认。",
    "ne": "आवश्यक विवरण र पुष्टि पूरा गर्नुहोस्।"
  },
  "Update was not saved. Refresh and check your assignment and service stage.": {
    "ms": "Kemas kini tidak disimpan. Muat semula dan semak penugasan serta peringkat servis.",
    "zh": "更新未保存。请刷新并检查人员分配及保养阶段。",
    "ne": "अद्यावधिक सुरक्षित भएन। रिफ्रेस गरी जिम्मेवारी र सेवाको चरण जाँच्नुहोस्।"
  },
  "Recorded by": {
    "ms": "Direkodkan oleh",
    "zh": "记录人",
    "ne": "अभिलेख गर्ने"
  },
  "Completion recorded": {
    "ms": "Penyiapan direkodkan",
    "zh": "完成时间",
    "ne": "सम्पन्न समय"
  },
  "Review recorded": {
    "ms": "Semakan direkodkan",
    "zh": "审核时间",
    "ne": "समीक्षा समय"
  },
  "Service uses the checklist and team copied when it started.": {
    "ms": "Servis menggunakan senarai semak dan pasukan yang disalin semasa bermula.",
    "zh": "本次保养使用开始时保存的检查清单和团队。",
    "ne": "सेवा सुरु हुँदा प्रतिलिपि गरिएका जाँचसूची र टोली प्रयोग हुन्छन्।"
  }
};

export function pmServiceText(language: Language, text: string): string {
  return language === "en" ? text : words[text]?.[language] ?? text;
}

// Production Manager acknowledgement
Object.assign(words, {
  "Awaiting Production Manager Acknowledgement": {
    "ms": "Menunggu Pengakuan Pengurus Pengeluaran",
    "zh": "待生产经理确认",
    "ne": "उत्पादन प्रबन्धकको पुष्टि पर्खिरहेको"
  },
  "Verify and Send to Production Manager": {
    "ms": "Sahkan dan Hantar kepada Pengurus Pengeluaran",
    "zh": "验证并提交生产经理",
    "ne": "प्रमाणित गरी उत्पादन प्रबन्धकलाई पठाउनुहोस्"
  },
  "Production Manager acknowledgement": {
    "ms": "Pengakuan Pengurus Pengeluaran",
    "zh": "生产经理确认",
    "ne": "उत्पादन प्रबन्धकको पुष्टि"
  },
  "Acknowledgement notes": {
    "ms": "Nota pengakuan",
    "zh": "确认意见",
    "ne": "पुष्टि टिप्पणी"
  },
  "Acknowledged": {
    "ms": "Diakui",
    "zh": "确认时间",
    "ne": "पुष्टि गरिएको"
  },
  "I acknowledge this PM service as Production Manager.": {
    "ms": "Saya mengakui servis PM ini sebagai Pengurus Pengeluaran.",
    "zh": "我以生产经理身份确认本次 PM 保养。",
    "ne": "म उत्पादन प्रबन्धकको रूपमा यो PM सेवा पुष्टि गर्छु।"
  },
  "Acknowledge and Close Service": {
    "ms": "Akui dan Tutup Servis",
    "zh": "确认并关闭保养记录",
    "ne": "पुष्टि गरी सेवा बन्द गर्नुहोस्"
  },
  "You verified this service. A different Admin must acknowledge it.": {
    "ms": "Anda mengesahkan servis ini. Admin lain mesti memberikan pengakuan.",
    "zh": "您已验证此保养，必须由另一位管理员确认。",
    "ne": "तपाईंले यो सेवा प्रमाणित गर्नुभयो। अर्को प्रशासकले पुष्टि गर्नुपर्छ।"
  },
  "Awaiting acknowledgement by an Admin who did not verify this service.": {
    "ms": "Menunggu pengakuan oleh Admin yang tidak mengesahkan servis ini.",
    "zh": "等待未参与本次验证的管理员确认。",
    "ne": "यो सेवा प्रमाणित नगरेका प्रशासकको पुष्टि पर्खिरहेको।"
  },
  "Acknowledgement closes this service and updates the next due date from the recorded work completion date.": {
    "ms": "Pengakuan menutup servis ini dan mengemas kini tarikh perlu seterusnya berdasarkan tarikh kerja selesai yang direkodkan.",
    "zh": "确认后将关闭本次保养，并以记录的工作完成日期计算下次到期日。",
    "ne": "पुष्टिले यो सेवा बन्द गर्छ र अभिलेख गरिएको काम सम्पन्न मितिबाट अर्को देय मिति अद्यावधिक गर्छ।"
  },
  "Verification sends this service to Production Manager acknowledgement. The service closes and its next due date updates after a different Admin acknowledges. Follow-up notes do not create an MRF.": {
    "ms": "Pengesahan menghantar servis ini untuk pengakuan Pengurus Pengeluaran. Servis ditutup dan tarikh perlu dikemas kini selepas Admin lain mengakui. Nota susulan tidak mencipta MRF.",
    "zh": "验证后将提交生产经理确认。另一位管理员确认后才会关闭记录并更新下次到期日。后续措施备注不会自动创建 MRF。",
    "ne": "प्रमाणीकरणपछि सेवा उत्पादन प्रबन्धकको पुष्टिमा जान्छ। अर्को प्रशासकले पुष्टि गरेपछि सेवा बन्द भई अर्को देय मिति अद्यावधिक हुन्छ। अनुगमन टिप्पणीले MRF बनाउँदैन।"
  },
  "Completed before the acknowledgement requirement was introduced.": {
    "ms": "Selesai sebelum keperluan pengakuan diperkenalkan.",
    "zh": "此记录在新增确认要求之前已完成。",
    "ne": "पुष्टि अनिवार्य हुनुअघि सम्पन्न गरिएको।"
  }
});
