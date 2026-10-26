import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { Language } from "@/utils/language";
import { dashboardText } from "@/utils/dashboardTranslations";

const root = "/preventive-maintenance/master-plan";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const words: Record<string, [string, string, string]> = {
  "Linked PM MRF": ["MRF PM berkaitan", "关联的保养 MRF", "सम्बन्धित PM MRF"],
  "Issue PM MRF": ["Keluarkan MRF PM", "签发保养 MRF", "PM MRF जारी गर्नुहोस्"],
  "Paper MRF number": ["Nombor MRF kertas", "纸本 MRF 编号", "कागजी MRF नम्बर"],
  "Additional instructions": ["Arahan tambahan", "补充说明", "थप निर्देशन"],
  "Department": ["Jabatan", "部门", "विभाग"],
  "Status": ["Status", "状态", "स्थिति"],
  "Open MRF": ["Buka MRF", "打开 MRF", "MRF खोल्नुहोस्"],
  "MRF issued. Department HOD approval is required before work starts.": [
    "MRF dikeluarkan. Kelulusan Ketua Jabatan diperlukan sebelum kerja bermula.",
    "MRF 已签发。开始工作前必须获得部门主管批准。",
    "MRF जारी भयो। काम सुरु गर्नुअघि विभाग प्रमुखको स्वीकृति आवश्यक छ।"
  ],
  "Enter the five-digit paper MRF number.": [
    "Masukkan nombor MRF kertas lima digit.",
    "请输入五位数纸本 MRF 编号。",
    "पाँच अङ्कको कागजी MRF नम्बर लेख्नुहोस्।"
  ],
  "The MRF or PM date already has a record. Refresh and check before retrying.": [
    "Nombor MRF atau tarikh PM sudah mempunyai rekod. Muat semula dan semak sebelum cuba lagi.",
    "此 MRF 编号或保养日期已有记录。请刷新并检查后再试。",
    "यो MRF नम्बर वा PM मितिको अभिलेख पहिले नै छ। रिफ्रेस गरेर जाँच्नुहोस्।"
  ],
  "Assign this asset to an active department in the register first.": [
    "Tetapkan aset ini kepada jabatan aktif dalam daftar terlebih dahulu.",
    "请先在资产档案中为此资产设置启用的所属部门。",
    "पहिले दर्तामा यस सम्पत्तिलाई सक्रिय विभागमा तोक्नुहोस्।"
  ],
  "Add the activity checklist before issuing its MRF.": [
    "Tambah senarai semak aktiviti sebelum mengeluarkan MRF.",
    "请先添加此保养活动的检查清单，再签发 MRF。",
    "MRF जारी गर्नुअघि गतिविधिको जाँचसूची थप्नुहोस्।"
  ],
  "MRF was not issued. Refresh and check the asset, checklist and your permissions.": [
    "MRF tidak dikeluarkan. Muat semula dan semak aset, senarai semak serta kebenaran anda.",
    "MRF 未签发。请刷新并检查资产、检查清单和账户权限。",
    "MRF जारी भएन। रिफ्रेस गरेर सम्पत्ति, जाँचसूची र अनुमति जाँच्नुहोस्।"
  ],
  "Linked MRF could not be checked. Please refresh.": [
    "MRF berkaitan tidak dapat disemak. Sila muat semula.",
    "无法检查关联 MRF。请刷新。",
    "सम्बन्धित MRF जाँच्न सकिएन। कृपया रिफ्रेस गर्नुहोस्।"
  ],
  "No linked MRF is visible under your account permissions.": [
    "Tiada MRF berkaitan boleh dilihat mengikut kebenaran akaun anda.",
    "您的账户权限内暂无可见的关联 MRF。",
    "तपाईंको खाताको अनुमतिमा सम्बन्धित MRF देखिँदैन।"
  ],
  "The asset department will receive the approval request. The planned date stays unchanged.": [
    "Jabatan aset akan menerima permohonan kelulusan. Tarikh dirancang tidak berubah.",
    "审批申请将发送至资产所属部门。原计划日期保持不变。",
    "सम्पत्तिको विभागले स्वीकृति अनुरोध पाउनेछ। योजनाबद्ध मिति परिवर्तन हुँदैन।"
  ],
};

async function issue(form: FormData) {
  "use server";
  const id = String(form.get("occurrence_id") ?? "");
  if (!uuid.test(id)) redirect(root);
  const rawPage = Number(form.get("page"));
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 && rawPage <= 100000
    ? rawPage : 1;
  const destination = (result: string) =>
    `${root}/assign/${id}?page=${page}&mrf_result=${result}`;
  const mrf = String(form.get("mrf_number") ?? "").trim();
  const notes = String(form.get("notes") ?? "").trim();
  if (!/^[0-9]{5}$/.test(mrf) || notes.length > 5000) {
    redirect(destination("invalid"));
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { error } = await supabase.rpc("issue_pm_annual_mrf", {
    p_occurrence: id, p_mrf_number: mrf, p_notes: notes,
  });
  if (error) {
    console.error("Issue annual PM MRF failed:", error.message);
    const message = error.message.toLowerCase();
    const result = error.code === "23505" || message.includes("already has an mrf")
      ? "duplicate"
      : message.includes("active department") ? "department"
      : message.includes("checklist before") ? "checklist" : "failed";
    redirect(destination(result));
  }
  revalidatePath(root, "layout");
  revalidatePath("/");
  revalidatePath("/approvals");
  revalidatePath("/my-actions");
  revalidatePath("/maintenance", "layout");
  redirect(destination("issued"));
}

export default async function PMMrf({
  occurrenceId, page, language, role, result, unavailable,
}: {
  occurrenceId: string; page: number; language: Language;
  role: string; result?: string; unavailable: boolean;
}) {
  const index = { ms: 0, zh: 1, ne: 2 };
  const t = (text: string) => language === "en"
    ? text : words[text]?.[index[language]] ?? dashboardText(language, text);
  const supabase = await createClient();
  const { data, error } = await supabase.from("maintenance_requests")
    .select("id,mrf_number,status,department")
    .eq("pm_occurrence_id", occurrenceId)
    .neq("status", "rejected")
    .maybeSingle();
  const canIssue = ["admin", "maintenance_clerk"].includes(role);
  const messages: Record<string, string> = {
    issued: "MRF issued. Department HOD approval is required before work starts.",
    invalid: "Enter the five-digit paper MRF number.",
    duplicate: "The MRF or PM date already has a record. Refresh and check before retrying.",
    department: "Assign this asset to an active department in the register first.",
    checklist: "Add the activity checklist before issuing its MRF.",
    failed: "MRF was not issued. Refresh and check the asset, checklist and your permissions.",
  };
  return (
    <section className="mt-5 rounded-xl border border-blue-200 bg-white p-5">
      <h2 className="text-lg font-semibold">{t("Linked PM MRF")}</h2>
      {result && messages[result] && <p role="status"
        className="mt-3 rounded-lg bg-blue-50 p-3">{t(messages[result])}</p>}
      {error ? <p role="alert" className="mt-3 text-red-700">
        {t("Linked MRF could not be checked. Please refresh.")}
      </p> : data ? <div className="mt-3 space-y-2">
        <p className="font-semibold">MRF {data.mrf_number}</p>
        <p>{t("Department")}: {data.department}</p>
        <p>{t("Status")}: {t(data.status.replaceAll("_", " "))}</p>
        <Link href={`/maintenance/${data.id}`}
          className="inline-block font-semibold text-blue-700 underline">
          {t("Open MRF")} →
        </Link>
      </div> : canIssue && !unavailable ? (
        <form action={issue} className="mt-4 space-y-4">
          <input type="hidden" name="occurrence_id" value={occurrenceId} />
          <input type="hidden" name="page" value={page} />
          <p className="text-sm text-slate-600">
            {t("The asset department will receive the approval request. The planned date stays unchanged.")}
          </p>
          <label className="block font-medium">
            {t("Paper MRF number")} *
            <input name="mrf_number" required inputMode="numeric"
              pattern="[0-9]{5}" minLength={5} maxLength={5}
              className="mt-2 block w-full rounded-lg border p-3" />
          </label>
          <label className="block font-medium">
            {t("Additional instructions")}
            <textarea name="notes" rows={3} maxLength={5000}
              className="mt-2 block w-full rounded-lg border p-3" />
          </label>
          <button className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white">
            {t("Issue PM MRF")}
          </button>
        </form>
      ) : <p className="mt-3 text-sm text-slate-600">
        {t("No linked MRF is visible under your account permissions.")}
      </p>}
    </section>
  );
}
