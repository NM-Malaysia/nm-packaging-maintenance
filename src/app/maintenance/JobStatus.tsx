import { getMyLanguage } from "@/utils/language";
import { jobStatusText } from "@/utils/jobStatusTranslations";
import { maintenanceResult } from "./maintenanceNavigation";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

const labels: Record<string, string> = {
  in_progress: "In Progress",
  waiting_spare_parts: "Waiting for Spare Parts",
  follow_up_required: "Follow-up Required",
};

async function updateStatus(formData: FormData) {
  "use server";

  const requestId = String(formData.get("request_id") ?? "");
  const next = String(formData.get("next_status") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuid.test(requestId)
      || !["in_progress", "waiting_spare_parts", "follow_up_required"].includes(next)
      || reason.length < 1 || reason.length > 5000) {
    redirect(maintenanceResult(formData, "status_invalid"));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("set_maintenance_job_status", {
    p_request: requestId,
    p_next: next,
    p_reason: reason,
  });

  if (error) {
    console.error("Job status update failed:", error.message);
    redirect(maintenanceResult(formData, "status_failed"));
  }

  revalidatePath("/");
  revalidatePath("/maintenance", "layout");
  redirect(maintenanceResult(formData, "status_saved"));
}

export default async function JobStatus({
  requestId,
  status,
}: {
  requestId: string;
  status: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: employee } = await supabase
    .from("employees")
    .select("role, is_active, must_change_password")
    .eq("id", user.id)
    .maybeSingle();

  const language = await getMyLanguage();
  const t = (text: string) => jobStatusText(language, text);

  const canManage = Boolean(
    employee?.is_active
    && !employee.must_change_password
    && ["admin", "maintenance_supervisor"].includes(employee.role)
  );

  const { data: history, error } = await supabase
    .from("request_status_notes")
    .select("id, previous_status, new_status, reason, recorded_at")
    .eq("request_id", requestId)
    .order("recorded_at", { ascending: false })
    .limit(20);

  return (
    <section className="mt-5 border-t pt-5">
      {canManage && labels[status] && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
          <h3 className="font-semibold">{t("Update overall job status")}</h3>
          <form action={updateStatus} className="mt-4 space-y-4">
            <input type="hidden" name="request_id" value={requestId} />
            <label className="block">
              <span className="block text-sm font-medium">{t("New status")}</span>
              <select name="next_status" required defaultValue=""
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3">
                <option value="" disabled>{t("Select status")}</option>
                {Object.entries(labels)
                  .filter(([value]) => value !== status)
                  .map(([value, label]) => (
                    <option key={value} value={value}>{t(label)}</option>
                  ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-sm font-medium">{t("Reason / outstanding action")}</span>
              <textarea name="reason" required maxLength={5000} rows={3}
                placeholder={t("For example: Waiting for bearing No. 1234.")}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3" />
            </label>
            <p className="text-sm text-slate-600">{t("Team members must pause or finish their work before changing the job to Waiting for Spare Parts or Follow-up Required.")}</p>
            <button type="submit"
              className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white">{t("Save job status")}</button>
          </form>
        </div>
      )}

      <h3 className="mt-4 font-semibold">{t("Job status history")}</h3>
      {error ? (
        <p role="alert" className="mt-2 text-red-700">{t("Status history could not be loaded. Please refresh.")}</p>
      ) : history?.length ? (
        <ul className="mt-3 space-y-3">
          {history.map((entry) => (
            <li key={entry.id}
              className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="font-medium">
                {t(labels[entry.previous_status] ?? entry.previous_status.replaceAll("_", " "))}
                {" → "}
                {t(labels[entry.new_status] ?? entry.new_status.replaceAll("_", " "))}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{t(entry.reason)}</p>
              <p className="mt-2 text-sm text-slate-500">
                {new Date(entry.recorded_at).toLocaleString("en-MY", {
                  timeZone: "Asia/Kuala_Lumpur",
                })} ({t("Malaysia time")})
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">{t("No supervisor status changes recorded yet.")}</p>
      )}
    </section>
  );
}
