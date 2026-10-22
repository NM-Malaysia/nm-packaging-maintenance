import { maintenanceResult } from "./maintenanceNavigation";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

async function completeRepair(formData: FormData) {
  "use server";

  const requestId = String(formData.get("request_id") ?? "");
  const summary = String(formData.get("repair_summary") ?? "").trim();
  const restored = String(formData.get("restored_at") ?? "");
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuid.test(requestId) || !summary || summary.length > 10000
      || formData.get("confirmed") !== "yes"
      || (restored && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(restored))) {
    redirect(maintenanceResult(formData, "repair_invalid"));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("complete_mrf_repair", {
    p_request: requestId,
    p_summary: summary,
    p_downtime_ended_at: restored ? restored + ":00+08:00" : null,
  });

  if (error) {
    console.error("Repair completion failed:", error.message);
    redirect(maintenanceResult(formData, "repair_failed"));
  }

  revalidatePath("/");
  revalidatePath("/maintenance", "layout");
  redirect(maintenanceResult(formData, "repair_completed"));
}

export default async function RepairCompletion({
  requestId,
}: {
  requestId: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: employee } = await supabase
    .from("employees")
    .select("role, is_active, must_change_password")
    .eq("id", user.id)
    .maybeSingle();

  if (!employee?.is_active || employee.must_change_password
      || !["admin", "maintenance_supervisor"].includes(employee.role)) {
    return null;
  }

  const [requestResult, repairResult] = await Promise.all([
    supabase.from("maintenance_requests")
      .select("mrf_number, status, downtime_applicable, downtime_started_at, downtime_ended_at")
      .eq("id", requestId).single(),
    supabase.from("repair_records")
      .select("repair_summary, repair_reviewed_at, actual_downtime_minutes")
      .eq("request_id", requestId).maybeSingle(),
  ]);

  if (requestResult.error || repairResult.error) {
    return <p role="alert" className="mt-4 text-red-700">
      Repair completion details could not be loaded. Please refresh.
    </p>;
  }

  const request = requestResult.data;
  const repair = repairResult.data;
  const temporaryResult = await supabase.from("temporary_repair_followups")
    .select("id").eq("request_id", requestId)
    .is("resolved_at", null).limit(1);

  if (temporaryResult.error) {
    return <p role="alert" className="mt-4 text-red-700">
      Temporary repair follow-up could not be checked. Please refresh.
    </p>;
  }
  if (temporaryResult.data?.length) {
    return <p className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
      Overall repair completion is blocked while temporary repair follow-up is pending.
      Complete and review the linked permanent-repair task, then resolve the follow-up.
    </p>;
  }

  const formatTime = (value: string) => new Date(value).toLocaleString(
    "en-MY", { timeZone: "Asia/Kuala_Lumpur" }
  );

  if (repair?.repair_reviewed_at) {
    return (
      <section className="mt-5 rounded-lg border border-green-200 bg-green-50 p-5">
        <h3 className="font-semibold">Overall repair completion recorded</h3>
        <p className="mt-2 whitespace-pre-wrap">{repair.repair_summary}</p>
        <p className="mt-2 text-sm">
          Confirmed: {formatTime(repair.repair_reviewed_at)} (Malaysia time)
        </p>
        {request.downtime_ended_at && (
          <p className="mt-1 text-sm">
            Machine restored: {formatTime(request.downtime_ended_at)} (Malaysia time)
          </p>
        )}
        {repair.actual_downtime_minutes !== null && (
          <p className="mt-1 text-sm">
            Machine downtime: {repair.actual_downtime_minutes} minutes
            (rounded up).
          </p>
        )}
        <p className="mt-2 text-sm">
          Final approvals and handover are separate from repair completion.
        </p>
      </section>
    );
  }

  if (request.status !== "in_progress") return null;

  return (
    <details className="mt-5 rounded-lg border border-slate-300 bg-white p-5">
      <summary className="cursor-pointer font-semibold text-blue-700">
        Overall Repair Completion — MRF {request.mrf_number}
      </summary>
      <p className="mt-3 text-sm text-slate-600">
        Complete and review all tasks and finish all personal work first.
        This changes the MRF to Repair Completed; handover remains pending.
      </p>
      <form action={completeRepair} className="mt-4 space-y-4">
        <input type="hidden" name="request_id" value={requestId} />
        <label className="block">
          <span className="font-medium">Repair summary and test results</span>
          <textarea name="repair_summary" required maxLength={10000} rows={4}
            className="mt-2 block w-full rounded-lg border border-slate-300 p-3" />
        </label>
        {request.downtime_applicable && (
          <div>
            <p className="text-sm text-slate-600">
              Downtime started: {request.downtime_started_at
                ? formatTime(request.downtime_started_at) + " (Malaysia time)"
                : "Not recorded — this must be corrected before completion."}
            </p>
            <label className="mt-3 block">
              <span className="font-medium">Actual machine restoration time — Malaysia time</span>
              {request.downtime_ended_at ? (
                <p className="mt-2 text-sm text-green-800">
                  Restart already recorded: {formatTime(request.downtime_ended_at)}
                  {" (Malaysia time). This time will be preserved."}
                </p>
              ) : (
                <input type="datetime-local" name="restored_at" required
                  className="mt-2 block rounded-lg border border-slate-300 p-3" />
              )}
            </label>
            <p className="mt-2 text-sm text-slate-500">
              Enter when the machine actually returned to operation.
              This is separate from staff working time.
            </p>
          </div>
        )}
        <label className="flex items-start gap-3">
          <input type="checkbox" name="confirmed" value="yes" required
            className="mt-1 h-5 w-5" />
          <span>I have reviewed the work, verified repair completion and recorded the test results.</span>
        </label>
        <button className="rounded-lg bg-green-700 px-5 py-3 font-semibold text-white">
          Confirm Repair Completed
        </button>
      </form>
    </details>
  );
}
