import { getMyLanguage } from "@/utils/language";
import { repairApprovalsText } from "@/utils/repairApprovalsTranslations";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { maintenanceResult } from "./maintenanceNavigation";

async function approveRepair(formData: FormData) {
  "use server";

  const requestId = String(formData.get("request_id") ?? "");
  const stage = String(formData.get("stage") ?? "");
  const comments = String(formData.get("comments") ?? "").trim();
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  function destination(result: string) {
    const detail = maintenanceResult(formData, result);
    if (detail.startsWith("/maintenance/")) return detail;
    const query = new URLSearchParams({ result });
    if (uuid.test(requestId)) query.set("request", requestId);
    return "/repair-approvals?" + query.toString();
  }

  if (!uuid.test(requestId)
      || !["manager", "request_hod"].includes(stage)
      || !comments || comments.length > 5000
      || formData.get("confirmed") !== "yes") {
    redirect(destination("repair_approval_invalid"));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("approve_completed_repair", {
    p_request: requestId,
    p_stage: stage,
    p_comments: comments,
  });

  if (error) {
    console.error("Repair approval failed:", error.message);
    redirect(destination("repair_approval_failed"));
  }

  revalidatePath("/");
  revalidatePath("/maintenance", "layout");
  revalidatePath("/repair-approvals");
  redirect(destination("repair_approval_saved"));
}

export default async function RepairApprovals({
  requestId,
}: { requestId: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: employee } = await supabase.from("employees")
    .select("role,is_active,must_change_password")
    .eq("id", user.id).maybeSingle();

  if (!employee?.is_active || employee.must_change_password) return null;

  const language = await getMyLanguage();
  const t = (text: string) => repairApprovalsText(language, text);

  const [requestResult, repairResult, approvalResult] = await Promise.all([
    supabase.from("maintenance_requests")
      .select("status").eq("id", requestId).single(),
    supabase.from("repair_records")
      .select("repair_summary,repair_reviewed_at,actual_downtime_minutes")
      .eq("request_id", requestId).maybeSingle(),
    supabase.from("approvals")
      .select("id,approval_type,decision,comments,signed_at")
      .eq("request_id", requestId)
      .in("approval_type", ["maintenance_hod", "request_hod_completion"])
      .order("signed_at", { ascending: true })
      .order("id", { ascending: true }),
  ]);

  if (requestResult.error || repairResult.error || approvalResult.error) {
    return <p role="alert" className="mt-5 text-red-700">{t("Repair approvals could not be loaded. Please refresh.")}</p>;
  }

  const status = requestResult.data.status;
  if (!["repair_completed", "handover_pending", "closed"].includes(status)) return null;

  const repair = repairResult.data;
  if (!repair?.repair_reviewed_at) {
    return <p className="mt-5 text-amber-800">{t("Recorded supervisor repair completion is required before approval.")}</p>;
  }

  const cutoff = new Date(repair.repair_reviewed_at).getTime();
  const approvals = (approvalResult.data ?? []).filter(
    item => new Date(item.signed_at).getTime() >= cutoff
  );
  const manager = approvals.find(
    item => item.approval_type === "maintenance_hod" && item.decision === "approved"
  );
  const hod = approvals.find(
    item => item.approval_type === "request_hod_completion"
      && item.decision === "approved"
      && manager
      && new Date(item.signed_at).getTime() >= new Date(manager.signed_at).getTime()
  );

  const stage = status !== "repair_completed" ? null
    : employee.role === "admin" && !manager ? "manager"
    : employee.role === "department_hod" && manager && !hod ? "request_hod"
    : null;

  const formatTime = (value: string) => new Date(value).toLocaleString(
    "en-MY", { timeZone: "Asia/Kuala_Lumpur" }
  );

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-lg font-semibold">{t("Post-repair approvals")}</h3>
      <p className="mt-2 text-sm text-slate-600">{t("Manager approval → Requestor Department HOD approval → Handover")}</p>

      <div className="mt-4 rounded-lg bg-slate-50 p-4">
        <p className="font-semibold">{t("Repair summary")}</p>
        <p className="mt-2 whitespace-pre-wrap">{repair.repair_summary}</p>
        <p className="mt-2 text-sm text-slate-500">
          {t("Repair verified:")} {formatTime(repair.repair_reviewed_at)} ({t("Malaysia time")})
        </p>
        {repair.actual_downtime_minutes !== null && (
          <p className="mt-1 text-sm text-slate-600">
            {t("Machine downtime:")} {repair.actual_downtime_minutes} {t("minutes")}
          </p>
        )}
      </div>

      <ol className="mt-4 grid gap-3 sm:grid-cols-2">
        {[
          { title: "1. Maintenance Manager", approval: manager },
          { title: "2. Requestor Department HOD", approval: hod },
        ].map(item => (
          <li key={item.title} className="rounded-lg border p-4">
            <p className="font-semibold">{t(item.title)}</p>
            <p className={"mt-2 text-sm " +
              (item.approval ? "text-green-800" : "text-amber-800")}>
              {item.approval ? t("Approved") : t("Pending")}
            </p>
            {item.approval && (
              <>
                <p className="mt-2 whitespace-pre-wrap text-sm">{item.approval.comments}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {formatTime(item.approval.signed_at)} ({t("Malaysia time")})
                </p>
              </>
            )}
          </li>
        ))}
      </ol>

      {stage ? (
        <form action={approveRepair} className="mt-5 space-y-4">
          <input type="hidden" name="request_id" value={requestId} />
          <input type="hidden" name="stage" value={stage} />
          <label className="block">
            <span className="font-medium">
              {stage === "manager" ? t("Manager review comments") : t("Department HOD review comments")}
            </span>
            <textarea name="comments" required maxLength={5000} rows={3}
              className="mt-2 block w-full rounded-lg border border-slate-300 p-3" />
          </label>
          <label className="flex items-start gap-3">
            <input type="checkbox" name="confirmed" value="yes" required
              className="mt-1 h-5 w-5" />
            <span>{t("I have reviewed the repair and approve it for the next stage.")}</span>
          </label>
          <button className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white">
            {stage === "manager"
              ? t("Approve as Maintenance Manager")
              : t("Approve as Requestor Department HOD")}
          </button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-slate-600">
          {hod ? t("Both approvals recorded. Handover is separate from these approvals.")
            : manager ? t("Awaiting the requestor department's HOD approval.")
            : t("Awaiting Maintenance Manager (Admin) approval.")}
        </p>
      )}
    </section>
  );
}
