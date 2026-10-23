import "server-only";
import type { Language } from "./language";
import { maintenanceText } from "./maintenanceTranslations";
import { dashboardText } from "./dashboardTranslations";

const translations: Record<string, Record<string, string>> = {
  "← Back to maintenance list": {
    "ms": "← Kembali ke senarai penyelenggaraan",
    "zh": "← 返回维修列表",
    "ne": "← मर्मत सूचीमा फर्कनुहोस्"
  },
  "MRF Details": {
    "ms": "Butiran MRF",
    "zh": "MRF 详情",
    "ne": "MRF विवरण"
  },
  "Work, tasks and history for this MRF.": {
    "ms": "Kerja, tugas dan sejarah untuk MRF ini.",
    "zh": "此 MRF 的工作、任务和历史记录。",
    "ne": "यस MRF का काम, कार्य र इतिहास।"
  },
  "Requests or assignments could not be loaded. Please refresh.": {
    "ms": "Permohonan atau penugasan tidak dapat dimuatkan. Sila muat semula.",
    "zh": "无法加载申请或分配记录。请刷新页面。",
    "ne": "अनुरोध वा जिम्मेवारी विवरण लोड भएन। कृपया रिफ्रेस गर्नुहोस्।"
  },
  "Assigned": {
    "ms": "Ditugaskan",
    "zh": "分配时间",
    "ne": "तोकिएको"
  },
  "Malaysia time": {
    "ms": "Waktu Malaysia",
    "zh": "马来西亚时间",
    "ne": "मलेसिया समय"
  },
  "Your work record could not be loaded. Please refresh.": {
    "ms": "Rekod kerja anda tidak dapat dimuatkan. Sila muat semula.",
    "zh": "无法加载您的工作记录。请刷新页面。",
    "ne": "तपाईंको कामको अभिलेख लोड भएन। कृपया रिफ्रेस गर्नुहोस्।"
  },
  "Your work started": {
    "ms": "Kerja anda bermula",
    "zh": "您的工作开始时间",
    "ne": "तपाईंको काम सुरु भएको समय"
  },
  "Start Work records your own start time. The first team member to start moves this request to In Progress.": {
    "ms": "Mula Kerja merekodkan masa mula anda sendiri. Ahli pasukan pertama yang bermula menukar permohonan ini kepada Sedang Dijalankan.",
    "zh": "开始工作会记录您个人的开始时间。第一位开始工作的团队成员会将此申请转为进行中。",
    "ne": "काम सुरु गर्दा तपाईंको व्यक्तिगत सुरु समय अभिलेख हुन्छ। सुरु गर्ने पहिलो टोली सदस्यले यो अनुरोधलाई काम भइरहेको स्थितिमा सार्छ।"
  },
  "Start Work": {
    "ms": "Mula Kerja",
    "zh": "开始工作",
    "ne": "काम सुरु गर्नुहोस्"
  },
  "Starting work is unavailable at this request stage.": {
    "ms": "Kerja tidak boleh dimulakan pada peringkat permohonan ini.",
    "zh": "此申请阶段暂不能开始工作。",
    "ne": "अनुरोधको यस चरणमा काम सुरु गर्न मिल्दैन।"
  },
  "Team member list could not be loaded.": {
    "ms": "Senarai ahli pasukan tidak dapat dimuatkan.",
    "zh": "无法加载团队成员列表。",
    "ne": "टोली सदस्य सूची लोड भएन।"
  },
  "No active technicians or supervisors are available.": {
    "ms": "Tiada juruteknik atau penyelia aktif tersedia.",
    "zh": "暂无可分配的在职技术员或主管。",
    "ne": "सक्रिय प्राविधिक वा सुपरभाइजर उपलब्ध छैनन्।"
  },
  "Assign job team": {
    "ms": "Tugaskan pasukan kerja",
    "zh": "分配工作团队",
    "ne": "कामको टोली तोक्नुहोस्"
  },
  "Select one or more technicians or supervisors. Unchecking a member removes them when you save.": {
    "ms": "Pilih seorang atau lebih juruteknik atau penyelia. Membatalkan pilihan ahli akan mengeluarkannya apabila anda menyimpan.",
    "zh": "选择一位或多位技术员或主管。取消勾选成员后，保存时会将其移出团队。",
    "ne": "एक वा बढी प्राविधिक वा सुपरभाइजर छान्नुहोस्। सदस्यको चिन्ह हटाएपछि सुरक्षित गर्दा उनी टोलीबाट हट्छन्।"
  },
  "Save job team": {
    "ms": "Simpan pasukan kerja",
    "zh": "保存工作团队",
    "ne": "कामको टोली सुरक्षित गर्नुहोस्"
  },
  "This MRF is unavailable or you do not have permission to view it.": {
    "ms": "MRF ini tidak tersedia atau anda tiada kebenaran untuk melihatnya.",
    "zh": "此 MRF 不可用，或您没有查看权限。",
    "ne": "यो MRF उपलब्ध छैन वा तपाईंलाई हेर्ने अनुमति छैन।"
  }
};

export function mrfDetailText(language: Language, text: string): string {
  if (language === "en") return text;
  const own = translations[text]?.[language];
  if (own !== undefined) return own;
  const shared = maintenanceText(language, text);
  return shared !== text ? shared : dashboardText(language, text);
}

// MRF result banner translations
Object.assign(translations, {
  "Part requested. Pending maintenance clerk check.": {
    "ms": "Alat ganti diminta. Menunggu semakan kerani penyelenggaraan.",
    "zh": "已申请备件，等待维修文员核查。",
    "ne": "पार्टपुर्जा अनुरोध गरियो। मर्मत लिपिकको जाँच पर्खिरहेको छ।"
  },
  "Part record saved.": {
    "ms": "Rekod alat ganti disimpan.",
    "zh": "备件记录已保存。",
    "ne": "पार्टपुर्जाको अभिलेख सुरक्षित गरियो।"
  },
  "Check the part fields, dates and MIV requirements.": {
    "ms": "Semak medan alat ganti, tarikh dan keperluan MIV.",
    "zh": "请检查备件资料、日期及MIV要求。",
    "ne": "पार्टपुर्जाका विवरण, मिति र MIV आवश्यकताहरू जाँच गर्नुहोस्।"
  },
  "Part record could not be saved. Check dates, permissions and whether the record is locked.": {
    "ms": "Rekod alat ganti tidak dapat disimpan. Semak tarikh, kebenaran dan sama ada rekod telah dikunci.",
    "zh": "无法保存备件记录。请检查日期、权限，以及记录是否已锁定。",
    "ne": "पार्टपुर्जाको अभिलेख सुरक्षित भएन। मिति, अनुमति र अभिलेख लक भएको छ कि छैन जाँच गर्नुहोस्।"
  },
  "Temporary repair recorded. Machine restart saved, permanent-repair task assigned and follow-up pending.": {
    "ms": "Pembaikan sementara direkodkan. Masa mesin dimulakan semula disimpan, tugas pembaikan kekal ditugaskan dan susulan masih belum selesai.",
    "zh": "临时维修已记录，设备重启时间已保存，永久维修任务已分配，后续跟进尚未完成。",
    "ne": "अस्थायी मर्मत अभिलेख गरियो। मेसिन पुनः सुरु भएको समय सुरक्षित गरियो, स्थायी मर्मत कार्य तोकियो र अनुगमन बाँकी छ।"
  },
  "Permanent repair follow-up resolved. You can proceed to Overall Repair Completion when all work is ready.": {
    "ms": "Susulan pembaikan kekal diselesaikan. Teruskan ke Penyelesaian Pembaikan Keseluruhan apabila semua kerja sedia.",
    "zh": "永久维修跟进已解决。所有工作准备就绪后，可进行整体维修完成确认。",
    "ne": "स्थायी मर्मतको अनुगमन समाधान भयो। सबै काम तयार भएपछि समग्र मर्मत सम्पन्न पुष्टि गर्न सकिन्छ।"
  },
  "Complete the temporary repair details, responsible person, dates and confirmation.": {
    "ms": "Lengkapkan butiran pembaikan sementara, orang bertanggungjawab, tarikh dan pengesahan.",
    "zh": "请填写临时维修详情、负责人、日期并勾选确认。",
    "ne": "अस्थायी मर्मत विवरण, जिम्मेवार व्यक्ति, मिति र पुष्टि पूरा गर्नुहोस्।"
  },
  "Temporary repair update failed. Check the MRF stage, running sessions and linked task review. The terminal contains the exact reason.": {
    "ms": "Kemas kini pembaikan sementara gagal. Semak peringkat MRF, sesi kerja berjalan dan semakan tugas berkaitan. Sebab tepat terdapat dalam terminal.",
    "zh": "临时维修更新失败。请检查MRF阶段、运行中的工作计时及关联任务审核。具体原因请查看终端。",
    "ne": "अस्थायी मर्मत अद्यावधिक असफल भयो। MRF चरण, चलिरहेका कार्य सत्र र सम्बन्धित कार्य समीक्षा जाँच गर्नुहोस्। ठ्याक्कै कारण टर्मिनलमा छ।"
  },
  "Handover checklist verified and saved.": {
    "ms": "Senarai semak serahan disahkan dan disimpan.",
    "zh": "交接检查表已核实并保存。",
    "ne": "हस्तान्तरण जाँचसूची प्रमाणित गरी सुरक्षित गरियो।"
  },
  "Maintenance handover signed. Requestor acceptance is pending.": {
    "ms": "Serahan penyelenggaraan ditandatangani. Penerimaan pemohon masih belum selesai.",
    "zh": "维修交接已签署，等待申请人验收。",
    "ne": "मर्मत हस्तान्तरणमा हस्ताक्षर गरियो। अनुरोधकर्ताको स्वीकृति बाँकी छ।"
  },
  "Handover accepted. This MRF is now Closed.": {
    "ms": "Serahan diterima. MRF ini kini Ditutup.",
    "zh": "交接已验收，此MRF现已关闭。",
    "ne": "हस्तान्तरण स्वीकार गरियो। यो MRF अब बन्द छ।"
  },
  "Complete the required checklist, comments and confirmation.": {
    "ms": "Lengkapkan senarai semak wajib, ulasan dan pengesahan.",
    "zh": "请完成必填检查项目、备注并勾选确认。",
    "ne": "आवश्यक जाँचसूची, टिप्पणी र पुष्टि पूरा गर्नुहोस्।"
  },
  "Handover was not saved. Refresh and check the stage and account. Check the terminal for the exact reason.": {
    "ms": "Serahan tidak disimpan. Muat semula dan semak peringkat serta akaun. Semak terminal untuk sebab tepat.",
    "zh": "交接未保存。请刷新并检查当前阶段及账户。具体原因请查看终端。",
    "ne": "हस्तान्तरण सुरक्षित भएन। रिफ्रेस गरी चरण र खाता जाँच गर्नुहोस्। ठ्याक्कै कारण टर्मिनलमा हेर्नुहोस्।"
  },
  "Repair approval recorded successfully.": {
    "ms": "Kelulusan pembaikan berjaya direkodkan.",
    "zh": "维修审批已成功记录。",
    "ne": "मर्मत स्वीकृति सफलतापूर्वक अभिलेख गरियो।"
  },
  "Enter approval comments and tick the confirmation.": {
    "ms": "Masukkan ulasan kelulusan dan tandakan pengesahan.",
    "zh": "请输入审批备注并勾选确认。",
    "ne": "स्वीकृति टिप्पणी लेख्नुहोस् र पुष्टि चिन्ह लगाउनुहोस्।"
  },
  "Approval was not saved. Refresh and check your role and the MRF stage. Check the terminal for the exact reason.": {
    "ms": "Kelulusan tidak disimpan. Muat semula dan semak peranan serta peringkat MRF. Semak terminal untuk sebab tepat.",
    "zh": "审批未保存。请刷新并检查您的角色及MRF阶段。具体原因请查看终端。",
    "ne": "स्वीकृति सुरक्षित भएन। रिफ्रेस गरी आफ्नो भूमिका र MRF चरण जाँच गर्नुहोस्। ठ्याक्कै कारण टर्मिनलमा हेर्नुहोस्।"
  },
  "Overall repair completion saved. Final approvals and handover are still required.": {
    "ms": "Penyelesaian pembaikan keseluruhan disimpan. Kelulusan akhir dan serahan masih diperlukan.",
    "zh": "整体维修完成记录已保存，仍需完成最终审批和交接。",
    "ne": "समग्र मर्मत सम्पन्न अभिलेख सुरक्षित गरियो। अन्तिम स्वीकृति र हस्तान्तरण अझै आवश्यक छन्।"
  },
  "Enter a repair summary, valid restoration time where applicable, and tick the verification box.": {
    "ms": "Masukkan ringkasan pembaikan, masa pemulihan yang sah jika berkenaan, dan tandakan kotak pengesahan.",
    "zh": "请输入维修总结、适用时的有效恢复运行时间，并勾选核实确认框。",
    "ne": "मर्मत सारांश र लागू भएमा मान्य सञ्चालन पुनःस्थापना समय लेख्नुहोस्, अनि प्रमाणीकरण बाकसमा चिन्ह लगाउनुहोस्।"
  },
  "Repair completion was not saved. Check all tasks are reviewed, personal work is finished, and restoration time is valid. Check the terminal for the exact reason.": {
    "ms": "Penyelesaian pembaikan tidak disimpan. Pastikan semua tugas disemak, kerja peribadi selesai dan masa pemulihan sah. Semak terminal untuk sebab tepat.",
    "zh": "维修完成记录未保存。请确认所有任务已审核、个人工作已完成，以及恢复运行时间有效。具体原因请查看终端。",
    "ne": "मर्मत सम्पन्न अभिलेख सुरक्षित भएन। सबै कार्यको समीक्षा, व्यक्तिगत कामको समाप्ति र मान्य पुनःस्थापना समय जाँच गर्नुहोस्। ठ्याक्कै कारण टर्मिनलमा हेर्नुहोस्।"
  },
  "Task completion confirmed. The overall MRF remains open.": {
    "ms": "Penyelesaian tugas disahkan. MRF keseluruhan kekal terbuka.",
    "zh": "任务完成已确认，整体MRF仍保持未关闭。",
    "ne": "कार्य सम्पन्न पुष्टि गरियो। समग्र MRF खुला रहन्छ।"
  },
  "Enter review notes and confirm that you verified task completion.": {
    "ms": "Masukkan nota semakan dan sahkan bahawa penyelesaian tugas telah diperiksa.",
    "zh": "请输入审核备注，并确认您已核实任务完成情况。",
    "ne": "समीक्षा टिप्पणी लेख्नुहोस् र कार्य सम्पन्न भएको जाँच गरेको पुष्टि गर्नुहोस्।"
  },
  "Task completion was not saved. Refresh and check all assigned members have finished. Check the terminal if it continues.": {
    "ms": "Penyelesaian tugas tidak disimpan. Muat semula dan pastikan semua ahli ditugaskan telah selesai. Semak terminal jika masalah berterusan.",
    "zh": "任务完成记录未保存。请刷新并确认所有获分配成员已完成工作。如问题持续，请查看终端。",
    "ne": "कार्य सम्पन्न अभिलेख सुरक्षित भएन। रिफ्रेस गरी सबै तोकिएका सदस्यले काम सकेको जाँच गर्नुहोस्। समस्या जारी रहे टर्मिनल हेर्नुहोस्।"
  },
  "Your task work has started.": {
    "ms": "Kerja tugas anda telah bermula.",
    "zh": "您的任务工作已开始。",
    "ne": "तपाईंको कार्यको काम सुरु भयो।"
  },
  "Your task work is paused.": {
    "ms": "Kerja tugas anda dijeda.",
    "zh": "您的任务工作已暂停。",
    "ne": "तपाईंको कार्यको काम रोकिएको छ।"
  },
  "Your task work has resumed.": {
    "ms": "Kerja tugas anda disambung semula.",
    "zh": "您的任务工作已恢复。",
    "ne": "तपाईंको कार्यको काम पुनः सुरु भयो।"
  },
  "Your task notes were saved.": {
    "ms": "Nota tugas anda disimpan.",
    "zh": "您的任务备注已保存。",
    "ne": "तपाईंका कार्य टिप्पणी सुरक्षित गरियो।"
  },
  "Your part is finished. The task remains open for supervisor review.": {
    "ms": "Bahagian anda selesai. Tugas kekal terbuka untuk semakan penyelia.",
    "zh": "您的部分已完成，任务仍保持开放，等待主管审核。",
    "ne": "तपाईंको भाग सकियो। सुपरभाइजरको समीक्षाका लागि कार्य खुला रहन्छ।"
  },
  "Enter task notes before finishing, using no more than 10000 characters.": {
    "ms": "Masukkan nota tugas sebelum menamatkan kerja, tidak melebihi 10000 aksara.",
    "zh": "完成前请输入任务备注，最多10000个字符。",
    "ne": "समाप्त गर्नुअघि बढीमा १०००० अक्षरको कार्य टिप्पणी लेख्नुहोस्।"
  },
  "Task work was not updated. Refresh and check the MRF status and your assignment. Check the terminal if it continues.": {
    "ms": "Kerja tugas tidak dikemas kini. Muat semula dan semak status MRF serta penugasan anda. Semak terminal jika masalah berterusan.",
    "zh": "任务工作未更新。请刷新并检查MRF状态及您的任务分配。如问题持续，请查看终端。",
    "ne": "कार्यको काम अद्यावधिक भएन। रिफ्रेस गरी MRF स्थिति र आफ्नो जिम्मेवारी जाँच गर्नुहोस्। समस्या जारी रहे टर्मिनल हेर्नुहोस्।"
  },
  "Task created under the existing MRF and team assigned.": {
    "ms": "Tugas diwujudkan di bawah MRF sedia ada dan pasukan ditugaskan.",
    "zh": "已在现有MRF下创建任务并分配团队。",
    "ne": "हालको MRF अन्तर्गत कार्य सिर्जना गरी टोली तोकियो।"
  },
  "Enter a task title and select at least one team member.": {
    "ms": "Masukkan tajuk tugas dan pilih sekurang-kurangnya seorang ahli pasukan.",
    "zh": "请输入任务标题，并选择至少一位团队成员。",
    "ne": "कार्य शीर्षक लेख्नुहोस् र कम्तीमा एक टोली सदस्य छान्नुहोस्।"
  },
  "Task was not created. Refresh and try again. Check the terminal if it continues.": {
    "ms": "Tugas tidak diwujudkan. Muat semula dan cuba lagi. Semak terminal jika masalah berterusan.",
    "zh": "任务未创建。请刷新后重试。如问题持续，请查看终端。",
    "ne": "कार्य सिर्जना भएन। रिफ्रेस गरेर फेरि प्रयास गर्नुहोस्। समस्या जारी रहे टर्मिनल हेर्नुहोस्।"
  },
  "Job status and reason saved.": {
    "ms": "Status kerja dan sebab disimpan.",
    "zh": "工作状态及原因已保存。",
    "ne": "कामको स्थिति र कारण सुरक्षित गरियो।"
  },
  "Select a new status and enter a reason of 1 to 5000 characters.": {
    "ms": "Pilih status baharu dan masukkan sebab antara 1 hingga 5000 aksara.",
    "zh": "请选择新状态，并输入1至5000个字符的原因。",
    "ne": "नयाँ स्थिति छान्नुहोस् र १ देखि ५००० अक्षरको कारण लेख्नुहोस्।"
  },
  "Status was not changed. Refresh and confirm all running work sessions are paused or finished before placing the job on hold. Check the terminal if it continues.": {
    "ms": "Status tidak diubah. Muat semula dan pastikan semua sesi kerja berjalan dijeda atau selesai sebelum menangguhkan kerja. Semak terminal jika masalah berterusan.",
    "zh": "状态未更改。请刷新，并确认所有运行中的工作计时已暂停或结束后，再将工作设为等待状态。如问题持续，请查看终端。",
    "ne": "स्थिति परिवर्तन भएन। काम पर्खाइमा राख्नुअघि रिफ्रेस गरी सबै चलिरहेका कार्य सत्र रोकिएको वा सकिएको पुष्टि गर्नुहोस्। समस्या जारी रहे टर्मिनल हेर्नुहोस्।"
  },
  "Your work is paused. Working time has stopped.": {
    "ms": "Kerja anda dijeda. Pengiraan masa kerja dihentikan.",
    "zh": "您的工作已暂停，工作计时已停止。",
    "ne": "तपाईंको काम रोकियो। कामको समय गणना रोकिएको छ।"
  },
  "Your work has resumed. A new work session has started.": {
    "ms": "Kerja anda disambung semula. Sesi kerja baharu bermula.",
    "zh": "您的工作已恢复，新的工作计时已开始。",
    "ne": "तपाईंको काम पुनः सुरु भयो। नयाँ कार्य सत्र सुरु भयो।"
  },
  "The work session could not be changed. Refresh and try again.": {
    "ms": "Sesi kerja tidak dapat diubah. Muat semula dan cuba lagi.",
    "zh": "无法更改工作计时，请刷新后重试。",
    "ne": "कार्य सत्र परिवर्तन भएन। रिफ्रेस गरेर फेरि प्रयास गर्नुहोस्।"
  },
  "Your work details were saved.": {
    "ms": "Butiran kerja anda disimpan.",
    "zh": "您的工作详情已保存。",
    "ne": "तपाईंको कामको विवरण सुरक्षित गरियो।"
  },
  "Your work is finished. The request remains open for supervisor review.": {
    "ms": "Kerja anda selesai. Permohonan kekal terbuka untuk semakan penyelia.",
    "zh": "您的工作已完成，申请仍保持开放，等待主管审核。",
    "ne": "तपाईंको काम सकियो। सुपरभाइजरको समीक्षाका लागि अनुरोध खुला रहन्छ।"
  },
  "Enter work details before finishing, using no more than 10000 characters.": {
    "ms": "Masukkan butiran kerja sebelum menamatkan kerja, tidak melebihi 10000 aksara.",
    "zh": "完成前请输入工作详情，最多10000个字符。",
    "ne": "समाप्त गर्नुअघि बढीमा १०००० अक्षरको कामको विवरण लेख्नुहोस्।"
  },
  "Your work update was not saved. Refresh and check whether it is already finished. Check the terminal if the problem continues.": {
    "ms": "Kemas kini kerja anda tidak disimpan. Muat semula dan semak sama ada kerja sudah selesai. Semak terminal jika masalah berterusan.",
    "zh": "您的工作更新未保存。请刷新并检查工作是否已经完成。如问题持续，请查看终端。",
    "ne": "तपाईंको कामको अद्यावधिक सुरक्षित भएन। रिफ्रेस गरी काम पहिले नै सकिएको छ कि छैन जाँच गर्नुहोस्। समस्या जारी रहे टर्मिनल हेर्नुहोस्।"
  },
  "Your work start time was recorded. The request is now In Progress.": {
    "ms": "Masa mula kerja anda direkodkan. Permohonan kini Sedang Dijalankan.",
    "zh": "您的工作开始时间已记录，申请现为进行中。",
    "ne": "तपाईंको काम सुरु समय अभिलेख गरियो। अनुरोधमा अब काम भइरहेको छ।"
  },
  "Work could not be started. Refresh and try again. Check the Codespaces terminal if it continues.": {
    "ms": "Kerja tidak dapat dimulakan. Muat semula dan cuba lagi. Semak terminal Codespaces jika masalah berterusan.",
    "zh": "无法开始工作。请刷新后重试。如问题持续，请查看Codespaces终端。",
    "ne": "काम सुरु भएन। रिफ्रेस गरेर फेरि प्रयास गर्नुहोस्। समस्या जारी रहे Codespaces टर्मिनल हेर्नुहोस्।"
  },
  "Job team saved. The request status is unchanged.": {
    "ms": "Pasukan kerja disimpan. Status permohonan tidak berubah.",
    "zh": "工作团队已保存，申请状态保持不变。",
    "ne": "कामको टोली सुरक्षित गरियो। अनुरोधको स्थिति परिवर्तन भएको छैन।"
  },
  "Select at least one valid team member.": {
    "ms": "Pilih sekurang-kurangnya seorang ahli pasukan yang sah.",
    "zh": "请选择至少一位有效的团队成员。",
    "ne": "कम्तीमा एक मान्य टोली सदस्य छान्नुहोस्।"
  },
  "Assignment was not saved. Refresh and try again. If it continues, check the Codespaces terminal error.": {
    "ms": "Penugasan tidak disimpan. Muat semula dan cuba lagi. Jika masalah berterusan, semak ralat terminal Codespaces.",
    "zh": "分配未保存。请刷新后重试。如问题持续，请查看Codespaces终端错误。",
    "ne": "जिम्मेवारी सुरक्षित भएन। रिफ्रेस गरेर फेरि प्रयास गर्नुहोस्। समस्या जारी रहे Codespaces टर्मिनलको त्रुटि हेर्नुहोस्।"
  }
});
