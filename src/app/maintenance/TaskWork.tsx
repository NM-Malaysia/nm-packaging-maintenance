import { maintenanceResult } from "./maintenanceNavigation";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

async function updateTaskWork(formData: FormData) {
  "use server";

  const taskId = String(formData.get("task_id") ?? "");
  const action = String(formData.get("task_action") ?? "");
  const details = String(formData.get("work_details") ?? "").trim();
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuid.test(taskId)
      || !["start", "pause", "resume", "save", "finish"].includes(action)
      || details.length > 10000
      || (action === "finish" && !details)) {
    redirect(maintenanceResult(formData, "task_work_invalid"));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("update_my_task_work", {
    p_task: taskId,
    p_action: action,
    p_details: details,
  });

  if (error) {
    console.error("Task work update failed:", error.message);
    redirect(maintenanceResult(formData, "task_work_failed"));
  }

  revalidatePath("/maintenance", "layout");
  revalidatePath("/");
  redirect(maintenanceResult(formData, "task_work_" + action));
}

export default async function TaskWork({
  taskId,
  requestStatus,
  taskStatus,
}: {
  taskId: string;
  requestStatus: string;
  taskStatus: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const membership = await supabase
    .from("maintenance_task_members")
    .select("id")
    .eq("task_id", taskId)
    .eq("employee_id", user.id)
    .maybeSingle();

  if (membership.error) {
    return <p className="mt-3 text-red-700">
      Task assignment could not be checked. Please refresh.
    </p>;
  }
  if (!membership.data) return null;

  const { data: record, error } = await supabase
    .from("task_work_records")
    .select("id, started_at, work_details, completed_at")
    .eq("task_id", taskId)
    .eq("employee_id", user.id)
    .maybeSingle();

  if (error) {
    return <p className="mt-3 text-red-700">
      Your task record could not be loaded. Please refresh.
    </p>;
  }

  const canWork = ["in_progress", "waiting_spare_parts",
    "follow_up_required"].includes(requestStatus)
    && taskStatus !== "completed";

  if (!record) {
    return (
      <div className="mt-4 border-t pt-4">
        {canWork && requestStatus === "in_progress" ? (
          <form action={updateTaskWork}>
            <input type="hidden" name="task_id" value={taskId} />
            <button name="task_action" value="start"
              className="rounded-lg bg-green-700 px-4 py-2 font-semibold text-white">
              Start Task
            </button>
          </form>
        ) : (
          <p className="text-sm text-slate-600">
            {taskStatus === "completed"
              ? "This task is completed."
              : "Task not started. Supervisor must set the MRF to In Progress before you start."}
          </p>
        )}
      </div>
    );
  }

  const { data: sessions, error: sessionError } = await supabase
    .from("task_work_sessions")
    .select("id, started_at, ended_at")
    .eq("work_record_id", record.id)
    .order("started_at", { ascending: true });

  const running = (sessions ?? []).some((session) => !session.ended_at);
  const now = Date.now();
  const seconds = Math.floor((sessions ?? []).reduce((total, session) =>
    total + Math.max(0,
      (session.ended_at ? new Date(session.ended_at).getTime() : now)
      - new Date(session.started_at).getTime()), 0) / 1000);
  const duration = `${Math.floor(seconds / 3600)}h ${
    Math.floor(seconds % 3600 / 60)}m ${seconds % 60}s`;
  const editable = canWork && !record.completed_at;
  const formatTime = (value: string) => new Date(value).toLocaleString(
    "en-MY", { timeZone: "Asia/Kuala_Lumpur" }
  );

  return (
    <div className="mt-4 border-t pt-4">
      <h5 className="font-semibold">My work on this task</h5>
      <p className="mt-2 text-sm">Started: {formatTime(record.started_at)} (Malaysia time)</p>

      {sessionError ? (
        <p className="mt-2 text-red-700">Sessions could not be loaded.</p>
      ) : (
        <div className="mt-3 rounded-lg border bg-white p-3">
          <p className="font-medium">
            {record.completed_at ? "My part finished" : running ? "Working" : "Paused"}
            {" · "}{duration}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Excludes pauses. Refresh to update working time.
          </p>
          {editable && (running || requestStatus === "in_progress") && (
            <form action={updateTaskWork} className="mt-3">
              <input type="hidden" name="task_id" value={taskId} />
              <button name="task_action" value={running ? "pause" : "resume"}
                className="rounded-lg bg-amber-700 px-4 py-2 font-semibold text-white">
                {running ? "Pause Task" : "Resume Task"}
              </button>
              <p className="mt-2 text-sm text-slate-500">
                Save edited notes before pausing or resuming.
              </p>
            </form>
          )}
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer">Task work sessions</summary>
            <ul className="mt-2 space-y-2">
              {(sessions ?? []).map((session) => (
                <li key={session.id}>
                  {formatTime(session.started_at)} → {
                    session.ended_at ? formatTime(session.ended_at) : "Working"
                  } (Malaysia time)
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}

      {record.completed_at && (
        <p className="mt-3 font-medium text-green-800">
          My part finished: {formatTime(record.completed_at)} (Malaysia time).
          Awaiting supervisor review of the task.
        </p>
      )}

      {editable ? (
        <form action={updateTaskWork} className="mt-4">
          <input type="hidden" name="task_id" value={taskId} />
          <label className="block">
            <span className="text-sm font-medium">My task work details</span>
            <textarea name="work_details" rows={3} maxLength={10000}
              defaultValue={record.work_details}
              className="mt-2 block w-full rounded-lg border border-slate-300 bg-white p-3" />
          </label>
          <p className="mt-2 text-sm text-slate-600">
            Finish My Part records your completion and locks your notes.
            The supervisor reviews the overall task separately.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button name="task_action" value="save"
              className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white">
              Save Task Notes
            </button>
            <button name="task_action" value="finish"
              className="rounded-lg bg-green-700 px-4 py-2 font-semibold text-white">
              Finish My Part
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-3 whitespace-pre-wrap">
          {record.work_details || "No task notes recorded."}
        </p>
      )}
    </div>
  );
}
