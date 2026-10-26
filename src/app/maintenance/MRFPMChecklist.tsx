import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { Language } from "@/utils/language";

const words: Record<string, [string, string, string]> = {
  "PM execution checklist": ["Senarai semak pelaksanaan PM", "保养执行检查清单", "PM कार्यान्वयन जाँचसूची"],
  "Use the checklist captured when this MRF was issued.": [
    "Gunakan senarai semak yang direkodkan semasa MRF ini dikeluarkan.",
    "使用签发此 MRF 时保存的检查清单。",
    "यो MRF जारी हुँदा सुरक्षित गरिएको जाँचसूची प्रयोग गर्नुहोस्।"
  ],
  "Pass": ["Lulus", "合格", "उत्तीर्ण"],
  "Fail": ["Gagal", "不合格", "अनुत्तीर्ण"],
  "Not Applicable": ["Tidak berkenaan", "不适用", "लागू हुँदैन"],
  "Not recorded": ["Belum direkodkan", "尚未记录", "अभिलेख छैन"],
  "Select result": ["Pilih keputusan", "选择结果", "नतिजा छान्नुहोस्"],
  "Notes — required for Fail or Not Applicable": [
    "Nota — wajib untuk Gagal atau Tidak berkenaan",
    "备注 — 不合格或不适用时必填",
    "टिप्पणी — अनुत्तीर्ण वा लागू नहुने भए आवश्यक"
  ],
  "Save result": ["Simpan keputusan", "保存结果", "नतिजा सुरक्षित गर्नुहोस्"],
  "Checklist result saved.": ["Keputusan disimpan.", "检查结果已保存。", "जाँच नतिजा सुरक्षित भयो।"],
  "Result was not saved. Refresh and check the latest result, notes and your work status.": [
    "Keputusan tidak disimpan. Muat semula dan semak keputusan terkini, nota serta status kerja anda.",
    "结果未保存。请刷新并检查最新结果、备注和您的工作状态。",
    "नतिजा सुरक्षित भएन। रिफ्रेस गरेर पछिल्लो नतिजा, टिप्पणी र कामको स्थिति जाँच्नुहोस्।"
  ],
  "Checklist could not be loaded. Please refresh.": [
    "Senarai semak tidak dapat dimuatkan. Sila muat semula.",
    "无法加载检查清单。请刷新。",
    "जाँचसूची लोड भएन। कृपया रिफ्रेस गर्नुहोस्।"
  ],
  "Assigned technicians can update results after starting their work while the MRF is In Progress. Complete the checklist before finishing your personal work.": [
    "Juruteknik ditugaskan boleh mengemas kini keputusan selepas memulakan kerja ketika MRF Sedang Dijalankan. Lengkapkan senarai semak sebelum menamatkan kerja sendiri.",
    "MRF 进行中时，已开始工作的指定技术员可以更新结果。请在结束个人工作前完成检查清单。",
    "MRF काम भइरहेको अवस्थामा काम सुरु गरेका तोकिएका प्राविधिकले नतिजा अद्यावधिक गर्न सक्छन्। व्यक्तिगत काम सक्नुअघि जाँचसूची पूरा गर्नुहोस्।"
  ],
  "Recorded": ["Direkodkan", "记录时间", "अभिलेख समय"],
  "Malaysia time": ["Waktu Malaysia", "马来西亚时间", "मलेसिया समय"],
  "The issued PM checklist is missing. Contact your supervisor.": [
    "Senarai semak PM yang dikeluarkan tiada. Hubungi penyelia anda.",
    "缺少签发时的保养检查清单。请联系主管。",
    "जारी गरिएको PM जाँचसूची छैन। सुपरभाइजरलाई सम्पर्क गर्नुहोस्।"
  ]
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function saveResult(form: FormData) {
  "use server";
  const id = String(form.get("request_id") ?? "");
  if (!uuid.test(id)) redirect("/maintenance");
  const destination = (result: string) => `/maintenance/${id}?result=${result}`;
  const position = Number(form.get("position"));
  const rawRevision = String(form.get("revision") ?? "");
  const revision = Number(rawRevision);
  const result = String(form.get("check_result") ?? "");
  const notes = String(form.get("notes") ?? "").trim();
  if (!Number.isInteger(position) || position < 1 || position > 100
      || !rawRevision || !Number.isSafeInteger(revision) || revision < 0
      || !["pass", "fail", "not_applicable"].includes(result)
      || notes.length > 5000 || (result !== "pass" && !notes)) {
    redirect(destination("pm_check_failed"));
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { error } = await supabase.rpc("save_mrf_pm_check", {
    p_request: id,
    p_position: position,
    p_result: result,
    p_notes: notes,
    p_expected_revision: revision,
  });
  if (error) {
    console.error("MRF PM checklist save failed:", error.message);
    redirect(destination("pm_check_failed"));
  }
  revalidatePath("/maintenance", "layout");
  revalidatePath("/preventive-maintenance/master-plan", "layout");
  revalidatePath("/");
  revalidatePath("/my-actions");
  redirect(destination("pm_check_saved"));
}

export default async function MRFPMChecklist({
  requestId, language, result,
}: { requestId: string; language: Language; result?: string }) {
  const index = { ms: 0, zh: 1, ne: 2 };
  const t = (text: string) => language === "en"
    ? text : words[text]?.[index[language]] ?? text;
  const supabase = await createClient();
  const { data: request, error: requestError } = await supabase
    .from("maintenance_requests")
    .select("pm_occurrence_id,pm_checklist_items,status")
    .eq("id", requestId).maybeSingle();
  if (requestError) return <p role="alert" className="mt-5 text-red-700">
    {t("Checklist could not be loaded. Please refresh.")}
  </p>;
  if (!request?.pm_occurrence_id) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const [checks, membership, work, employee] = await Promise.all([
    supabase.from("mrf_pm_check_results")
      .select("position,result,notes,checked_by,checked_at,revision")
      .eq("request_id", requestId).order("position"),
    supabase.from("request_team_members").select("employee_id")
      .eq("request_id", requestId).eq("employee_id", user.id).maybeSingle(),
    supabase.from("request_work_records").select("started_at,completed_at")
      .eq("request_id", requestId).eq("employee_id", user.id).maybeSingle(),
    supabase.from("employees").select("role,is_active,must_change_password")
      .eq("id", user.id).maybeSingle(),
  ]);
  if (checks.error || membership.error || work.error || employee.error) {
    return <p role="alert" className="mt-5 text-red-700">
      {t("Checklist could not be loaded. Please refresh.")}
    </p>;
  }
  const editable = request.status === "in_progress"
    && Boolean(membership.data && work.data?.started_at && !work.data.completed_at)
    && Boolean(employee.data?.is_active && !employee.data.must_change_password)
    && ["maintenance_technician", "maintenance_supervisor"].includes(employee.data?.role ?? "");
  const items: string[] = request.pm_checklist_items ?? [];
  const byPosition = new Map((checks.data ?? []).map(check => [check.position, check]));
  const labels: Record<string, string> = {
    pass: "Pass", fail: "Fail", not_applicable: "Not Applicable",
  };

  return (
    <section className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-5">
      <h3 className="text-lg font-semibold">{t("PM execution checklist")}</h3>
      <p className="mt-2 text-sm text-slate-600">
        {t("Use the checklist captured when this MRF was issued.")}
      </p>
      <p className="mt-2 text-sm text-slate-600">
        {t("Assigned technicians can update results after starting their work while the MRF is In Progress. Complete the checklist before finishing your personal work.")}
      </p>
      {result?.startsWith("pm_check_") && <p role="status"
        className="mt-4 rounded-lg border bg-white p-3">
        {t(result === "pm_check_saved" ? "Checklist result saved."
          : "Result was not saved. Refresh and check the latest result, notes and your work status.")}
      </p>}
      {!items.length && <p role="alert" className="mt-4 text-red-700">
        {t("The issued PM checklist is missing. Contact your supervisor.")}
      </p>}
      <div className="mt-4 space-y-4">
        {items.map((item, offset) => {
          const position = offset + 1;
          const check = byPosition.get(position);
          return <article key={position} className="rounded-lg border bg-white p-4">
            <h4 className="font-semibold">{position}. {item}</h4>
            <p className={"mt-2 font-medium " + (
              check?.result === "fail" ? "text-red-700"
                : check?.result === "pass" ? "text-green-800" : "text-slate-600"
            )}>{t(check ? labels[check.result] ?? "Not recorded" : "Not recorded")}</p>
            {check && <p className="mt-2 text-xs text-slate-500">
              {t("Recorded")}: {new Date(check.checked_at).toLocaleString(
                language === "en" ? "en-MY" : language,
                { timeZone: "Asia/Kuala_Lumpur" }
              )} ({t("Malaysia time")})
            </p>}
            {editable ? <form action={saveResult}
              key={`${position}-${check?.revision ?? 0}`} className="mt-4 space-y-3">
              <input type="hidden" name="request_id" value={requestId} />
              <input type="hidden" name="position" value={position} />
              <input type="hidden" name="revision" value={check?.revision ?? 0} />
              <label className="block">
                <span className="text-sm font-medium">{t("Select result")}</span>
                <select name="check_result" required defaultValue={check?.result ?? ""}
                  className="mt-2 block w-full rounded-lg border bg-white p-3">
                  <option value="" disabled>{t("Select result")}</option>
                  {Object.entries(labels).map(([value, label]) =>
                    <option key={value} value={value}>{t(label)}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium">
                  {t("Notes — required for Fail or Not Applicable")}
                </span>
                <textarea name="notes" rows={3} maxLength={5000}
                  defaultValue={check?.notes ?? ""}
                  className="mt-2 block w-full rounded-lg border p-3" />
              </label>
              <button className="rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white">
                {t("Save result")}
              </button>
            </form> : check?.notes ? <p className="mt-3 whitespace-pre-wrap break-words">
              {check.notes}
            </p> : null}
          </article>;
        })}
      </div>
    </section>
  );
}
