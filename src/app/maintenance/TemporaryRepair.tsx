import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { maintenanceResult } from "./maintenanceNavigation";

async function updateTemporaryRepair(formData: FormData) {
  "use server";

  const action = String(formData.get("temporary_action") ?? "");
  const requestId = String(formData.get("request_id") ?? "");
  const details = String(formData.get("details") ?? "").trim();
  const responsible = String(formData.get("responsible") ?? "");
  const target = String(formData.get("target_date") ?? "");
  const restored = String(formData.get("restored_at") ?? "");
  const followup = String(formData.get("followup_id") ?? "");
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const go = (result: string) => maintenanceResult(formData, result);

  if (!uuid.test(requestId) || !details || details.length > 5000
      || formData.get("confirmed") !== "yes"
      || !["record", "resolve"].includes(action)) {
    redirect(go("temporary_invalid"));
  }

  if (action === "record" && (
    !uuid.test(responsible)
    || !/^\d{4}-\d{2}-\d{2}$/.test(target)
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(restored)
  )) redirect(go("temporary_invalid"));

  if (action === "resolve" && !uuid.test(followup)) {
    redirect(go("temporary_invalid"));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Ensure the selected follow-up belongs to the displayed MRF.
  if (action === "resolve") {
    const check = await supabase.from("temporary_repair_followups")
      .select("id").eq("id", followup).eq("request_id", requestId).maybeSingle();
    if (check.error || !check.data) redirect(go("temporary_failed"));
  }

  const result = action === "record"
    ? await supabase.rpc("record_temporary_repair", {
        p_request: requestId,
        p_details: details,
        p_responsible: responsible,
        p_target_date: target,
        p_restored_at: restored + ":00+08:00",
      })
    : await supabase.rpc("resolve_temporary_repair", {
        p_followup: followup,
        p_notes: details,
      });

  if (result.error) {
    console.error("Temporary repair update failed:", result.error.message);
    redirect(go("temporary_failed"));
  }

  revalidatePath("/");
  revalidatePath("/maintenance", "layout");
  redirect(go(action === "record" ? "temporary_recorded" : "temporary_resolved"));
}

type Person = {
  id: string;
  employee_id: string;
  full_name: string;
};
type TeamPerson = {
  employee_id: string;
  employee_number: string;
  full_name: string;
};

export default async function TemporaryRepair({
  requestId, status,
}: { requestId: string; status: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: employee } = await supabase.from("employees")
    .select("role,is_active,must_change_password")
    .eq("id", user.id).maybeSingle();
  if (!employee?.is_active || employee.must_change_password) return null;

  const canManage = ["admin", "maintenance_supervisor"].includes(employee.role);
  const editable = ["in_progress", "waiting_spare_parts", "follow_up_required"].includes(status);

  const result = await supabase.from("temporary_repair_followups")
    .select("id,task_id,temporary_repair_details,responsible_employee_id,target_date,machine_restored_at,recorded_at,resolved_at,resolution_notes")
    .eq("request_id", requestId)
    .order("recorded_at", { ascending: false });

  if (result.error) return <p role="alert" className="mt-5 text-red-700">
    Temporary repair records could not be loaded. Please refresh.
  </p>;

  const entries = result.data ?? [];
  const pending = entries.find(item => !item.resolved_at);
  let staff: Person[] = [];
  let staffError = false;
  if (canManage && editable && !pending) {
    const people = await supabase.rpc("list_assignable_maintenance_staff");
    staff = people.data ?? [];
    staffError = Boolean(people.error);
  }

  const names = new Map<string, string>();
  for (const person of staff) names.set(person.id, `${person.full_name} (${person.employee_id})`);
  let namesError = false;
  if (entries.length) {
    const team = await supabase.rpc("list_request_team", { p_requests: [requestId] });
    namesError = Boolean(team.error);
    for (const person of (team.data ?? []) as TeamPerson[]) {
      names.set(person.employee_id, `${person.full_name} (${person.employee_number})`);
    }
  }

  let taskReady = false;
  if (pending && canManage) {
    const task = await supabase.from("maintenance_tasks")
      .select("status,reviewed_by").eq("id", pending.task_id).maybeSingle();
    taskReady = !task.error && task.data?.status === "completed"
      && Boolean(task.data.reviewed_by);
  }

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  const time = (value: string) => new Date(value).toLocaleString(
    "en-MY", { timeZone: "Asia/Kuala_Lumpur" }
  );

  if (!entries.length && !(canManage && editable)) return null;

  return (
    <section className="mt-5 border-t pt-5">
      <h3 className="text-lg font-semibold">Temporary repair & permanent follow-up</h3>

      {entries.map(item => (
        <div key={item.id} className={"mt-4 rounded-lg border p-5 " +
          (item.resolved_at ? "border-green-200 bg-green-50" : "border-amber-300 bg-amber-50")}>
          <h4 className="font-semibold">
            {item.resolved_at ? "Permanent repair follow-up resolved"
              : "Temporary Repair — Follow-up Pending"}
          </h4>
          <p className="mt-2 whitespace-pre-wrap">{item.temporary_repair_details}</p>
          <p className="mt-3 text-sm">
            Machine restarted: {time(item.machine_restored_at)} (Malaysia time)
          </p>
          <p className="mt-2 text-sm">
            Responsible: {names.get(item.responsible_employee_id)
              ?? (namesError ? "Could not load name" : "See linked permanent-repair task")}
          </p>
          <p className="mt-2 text-sm">
            Target date: {item.target_date}
            {!item.resolved_at && item.target_date < today ? " · OVERDUE" : ""}
          </p>
          {item.resolved_at ? (
            <>
              <p className="mt-3 whitespace-pre-wrap">{item.resolution_notes}</p>
              <p className="mt-2 text-sm">Resolved: {time(item.resolved_at)} (Malaysia time)</p>
            </>
          ) : (
            <p className="mt-3 text-sm font-medium">
              MRF stays open. Repair completion and closure are blocked until this follow-up is resolved.
            </p>
          )}
        </div>
      ))}

      {pending && canManage && (
        status === "in_progress" && taskReady ? (
          <form action={updateTemporaryRepair} className="mt-4 space-y-3 rounded-lg border p-4">
            <input type="hidden" name="return_to" value={"/maintenance/" + requestId} />
            <input type="hidden" name="request_id" value={requestId} />
            <input type="hidden" name="followup_id" value={pending.id} />
            <input type="hidden" name="temporary_action" value="resolve" />
            <label className="block">
              <span className="font-medium">Permanent repair verification notes</span>
              <textarea name="details" rows={3} required maxLength={5000}
                className="mt-2 block w-full rounded-lg border p-3" />
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" name="confirmed" value="yes" required className="mt-1 h-5 w-5" />
              <span>I verified that the permanent repair is complete and the temporary fix is no longer outstanding.</span>
            </label>
            <button className="rounded-lg bg-green-700 px-5 py-3 font-semibold text-white">
              Resolve Temporary Repair Follow-up
            </button>
            <p className="text-sm text-slate-600">
              Overall Repair Completion remains a separate step.
            </p>
          </form>
        ) : (
          <p className="mt-4 text-sm text-slate-600">
            Set the MRF to In Progress, complete the linked
            “Permanent repair after temporary fix” task and confirm its supervisor review.
            Then return here to resolve the follow-up.
          </p>
        )
      )}

      {canManage && editable && !pending && (
        <details className="mt-4 rounded-lg border border-amber-300 p-4">
          <summary className="cursor-pointer font-semibold text-amber-900">
            + Record Temporary Repair — Machine Restarted
          </summary>
          {staffError || !staff.length ? (
            <p className="mt-3 text-red-700">Maintenance staff list unavailable. Refresh to try again.</p>
          ) : (
            <form action={updateTemporaryRepair} className="mt-4 space-y-4">
              <input type="hidden" name="return_to" value={"/maintenance/" + requestId} />
              <input type="hidden" name="request_id" value={requestId} />
              <input type="hidden" name="temporary_action" value="record" />
              <label className="block">
                <span className="font-medium">Temporary fix, operating limitations and permanent work required</span>
                <textarea name="details" rows={4} required maxLength={5000}
                  className="mt-2 block w-full rounded-lg border p-3" />
              </label>
              <label className="block">
                <span className="font-medium">Responsible for permanent repair</span>
                <select name="responsible" required defaultValue=""
                  className="mt-2 block w-full rounded-lg border bg-white p-3">
                  <option value="" disabled>Select technician or supervisor</option>
                  {staff.map(person => <option key={person.id} value={person.id}>
                    {person.full_name} ({person.employee_id})
                  </option>)}
                </select>
              </label>
              <label className="block">
                <span className="font-medium">Permanent repair target date</span>
                <input type="date" name="target_date" min={today} required
                  className="mt-2 block rounded-lg border p-3" />
              </label>
              <label className="block">
                <span className="font-medium">Actual machine restart — Malaysia time</span>
                <input type="datetime-local" name="restored_at" required
                  className="mt-2 block rounded-lg border p-3" />
              </label>
              <label className="flex items-start gap-3">
                <input type="checkbox" name="confirmed" value="yes" required className="mt-1 h-5 w-5" />
                <span>I verified the restart time and recorded the outstanding permanent repair.</span>
              </label>
              <p className="text-sm text-slate-600">
                Pause or finish running work first. Saving creates and assigns a permanent-repair
                task under this MRF, records the restart and sets Follow-up Required.
              </p>
              <button className="rounded-lg bg-amber-700 px-5 py-3 font-semibold text-white">
                Save Temporary Repair & Follow-up
              </button>
            </form>
          )}
        </details>
      )}
    </section>
  );
}
