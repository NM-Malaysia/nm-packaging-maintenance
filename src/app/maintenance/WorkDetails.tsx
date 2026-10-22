import { maintenanceResult } from "./maintenanceNavigation";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

async function toggleWorkSession(formData: FormData) {
  "use server";

  const requestId = String(formData.get("request_id") ?? "");
  const action = String(formData.get("session_action") ?? "");
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuid.test(requestId) || !["pause", "resume"].includes(action)) {
    redirect(maintenanceResult(formData, "session_failed"));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("pause_resume_my_work", {
    p_request: requestId,
    p_action: action,
  });

  if (error) {
    console.error("Work session update failed:", error.message);
    redirect(maintenanceResult(formData, "session_failed"));
  }

  revalidatePath("/maintenance", "layout");
  redirect(maintenanceResult(formData, "" +
    (action === "pause" ? "work_paused" : "work_resumed")));
}

async function saveWork(formData: FormData) {
  "use server";

  const requestId = String(formData.get("request_id") ?? "");
  const details = String(formData.get("work_details") ?? "");
  const action = String(formData.get("work_action") ?? "");
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuid.test(requestId) || details.length > 10000
      || !["save", "finish"].includes(action)
      || (action === "finish" && !details.trim())) {
    redirect(maintenanceResult(formData, "work_invalid"));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("save_my_work", {
    p_request: requestId,
    p_details: details,
    p_finish: action === "finish",
  });

  if (error) {
    console.error("Save work failed:", error.message);
    redirect(maintenanceResult(formData, "work_failed"));
  }

  revalidatePath("/maintenance", "layout");
  revalidatePath("/");
  redirect(maintenanceResult(formData, "" +
    (action === "finish" ? "work_finished" : "work_saved")));
}

export default async function WorkDetails({
  requestId,
  status,
}: {
  requestId: string;
  status: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: record, error } = await supabase
    .from("request_work_records")
    .select("id, work_details, completed_at")
    .eq("request_id", requestId)
    .eq("employee_id", user.id)
    .maybeSingle();

  if (error) {
    return <p role="alert" className="mt-4 text-red-700">
      Your work details could not be loaded. Please refresh.
    </p>;
  }
  if (!record) return null;

  const { data: sessions, error: sessionError } = await supabase
    .from("work_sessions")
    .select("started_at, ended_at")
    .eq("work_record_id", record.id)
    .order("started_at", { ascending: true });

  const running = (sessions ?? []).some((session) => !session.ended_at);
  const loadedAt = Date.now();
  const totalSeconds = Math.floor((sessions ?? []).reduce((total, session) => {
    const end = session.ended_at
      ? new Date(session.ended_at).getTime() : loadedAt;
    return total + Math.max(0, end - new Date(session.started_at).getTime());
  }, 0) / 1000);
  const duration = `${Math.floor(totalSeconds / 3600)}h ${
    Math.floor((totalSeconds % 3600) / 60)
  }m ${totalSeconds % 60}s`;

  const editable = !record.completed_at && [
    "in_progress", "waiting_spare_parts", "follow_up_required",
  ].includes(status);

  return (
    <div className="mt-5 rounded-lg bg-slate-50 p-5">
      <h3 className="font-semibold">My work details</h3>

      {sessionError ? (
        <p role="alert" className="mt-3 text-red-700">
          Work sessions could not be loaded. Refresh to try again.
        </p>
      ) : (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4">
          <p className="font-medium">
            {record.completed_at ? "Finished" : running ? "Working" : "Paused"}
            {" · Working time: "}{duration}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Excludes paused time. Refresh to update the duration.
          </p>
          {editable && (
            <form action={toggleWorkSession} className="mt-3">
              <input type="hidden" name="request_id" value={requestId} />
              <input type="hidden" name="session_action"
                value={running ? "pause" : "resume"} />
              <button type="submit"
                className="rounded-lg bg-amber-700 px-5 py-3 font-semibold text-white">
                {running ? "Pause Work" : "Resume Work"}
              </button>
              <p className="mt-2 text-sm text-slate-600">
                Save any edited work details before pausing or resuming.
              </p>
            </form>
          )}
          {sessions && sessions.length > 0 && (
            <details className="mt-3 text-sm text-slate-600">
              <summary className="cursor-pointer">Work sessions</summary>
              <ul className="mt-2 space-y-2">
                {sessions.map((session, index) => (
                  <li key={`${session.started_at}-${index}`}>
                    {new Date(session.started_at).toLocaleString("en-MY", {
                      timeZone: "Asia/Kuala_Lumpur",
                    })}
                    {" → "}
                    {session.ended_at
                      ? new Date(session.ended_at).toLocaleString("en-MY", {
                          timeZone: "Asia/Kuala_Lumpur",
                        })
                      : "Working"}
                    {" (Malaysia time)"}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {record.completed_at && (
        <p className="mt-2 font-medium text-green-800">
          Your work finished: {new Date(record.completed_at).toLocaleString(
            "en-MY", { timeZone: "Asia/Kuala_Lumpur" }
          )} (Malaysia time)
        </p>
      )}

      {editable ? (
        <form action={saveWork} className="mt-3">
          <input type="hidden" name="request_id" value={requestId} />
          <label className="block">
            <span className="text-sm text-slate-600">
              Record your inspection, repair actions and findings.
            </span>
            <textarea name="work_details" rows={5} maxLength={10000}
              defaultValue={record.work_details}
              className="mt-2 block w-full rounded-lg border border-slate-300 bg-white p-3" />
          </label>
          <p className="mt-2 text-sm text-slate-600">
            Finish My Work records your completion time and locks your entry.
            The overall request status stays unchanged for supervisor review.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="submit" name="work_action" value="save"
              className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white">
              Save Work Details
            </button>
            <button type="submit" name="work_action" value="finish"
              className="rounded-lg bg-green-700 px-5 py-3 font-semibold text-white">
              Finish My Work
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-3 whitespace-pre-wrap text-slate-700">
          {record.work_details || "No work details recorded."}
        </p>
      )}
    </div>
  );
}
