import { maintenanceResult } from "./maintenanceNavigation";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

type MemberName = {
  employee_id: string;
  full_name: string;
  employee_number: string;
};

async function completeTask(formData: FormData) {
  "use server";

  const taskId = String(formData.get("task_id") ?? "");
  const notes = String(formData.get("review_notes") ?? "").trim();
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuid.test(taskId) || !notes || notes.length > 5000
      || formData.get("confirmed") !== "yes") {
    redirect(maintenanceResult(formData, "review_invalid"));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("complete_maintenance_task", {
    p_task: taskId,
    p_notes: notes,
  });

  if (error) {
    console.error("Task review failed:", error.message);
    redirect(maintenanceResult(formData, "review_failed"));
  }

  revalidatePath("/maintenance", "layout");
  revalidatePath("/");
  redirect(maintenanceResult(formData, "task_completed"));
}

export default async function TaskReview({
  taskId,
  requestId,
  requestStatus,
}: {
  taskId: string;
  requestId: string;
  requestStatus: string;
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

  const [taskResult, memberResult, workResult, nameResult] = await Promise.all([
    supabase.from("maintenance_tasks")
      .select("status, completed_at, review_notes")
      .eq("id", taskId).single(),
    supabase.from("maintenance_task_members")
      .select("employee_id").eq("task_id", taskId),
    supabase.from("task_work_records")
      .select("id, employee_id, started_at, completed_at, work_details")
      .eq("task_id", taskId),
    supabase.rpc("list_request_team", { p_requests: [requestId] }),
  ]);

  if (taskResult.error || memberResult.error
      || workResult.error || nameResult.error) {
    return <p role="alert" className="mt-4 text-red-700">
      Task review could not be loaded. Please refresh.
    </p>;
  }

  const records = workResult.data ?? [];
  const members = memberResult.data ?? [];
  const names: MemberName[] = nameResult.data ?? [];
  const nameMap = new Map(names.map((member) => [
    member.employee_id,
    `${member.full_name} (${member.employee_number})`,
  ]));

  let sessionError = false;
  const durations = new Map<string, number>();
  let running = false;

  if (records.length) {
    const result = await supabase.from("task_work_sessions")
      .select("work_record_id, started_at, ended_at")
      .in("work_record_id", records.map((record) => record.id));
    sessionError = Boolean(result.error);
    const now = Date.now();

    for (const session of result.data ?? []) {
      if (!session.ended_at) running = true;
      const milliseconds = Math.max(0,
        (session.ended_at ? new Date(session.ended_at).getTime() : now)
        - new Date(session.started_at).getTime());
      durations.set(session.work_record_id,
        (durations.get(session.work_record_id) ?? 0) + milliseconds);
    }
  }

  const workMap = new Map(records.map((record) => [record.employee_id, record]));
  const ready = members.length > 0 && !sessionError && !running
    && members.every((member) => {
      const record = workMap.get(member.employee_id);
      return record?.completed_at && record.work_details.trim();
    });

  const formatTime = (value: string) => new Date(value).toLocaleString(
    "en-MY", { timeZone: "Asia/Kuala_Lumpur" }
  );

  return (
    <div className="mt-5 border-t pt-4">
      <h5 className="font-semibold">Supervisor task review</h5>
      <div className="mt-3 space-y-3">
        {members.map((member) => {
          const record = workMap.get(member.employee_id);
          const seconds = Math.floor(
            (record ? durations.get(record.id) ?? 0 : 0) / 1000
          );
          return (
            <div key={member.employee_id}
              className="rounded-lg border bg-white p-4">
              <p className="font-semibold">
                {nameMap.get(member.employee_id) ?? "Assigned team member"}
              </p>
              <p className="mt-1 text-sm">
                {!record ? "Not started"
                  : record.completed_at ? "Personal work finished"
                  : "Personal work unfinished"}
              </p>
              {record && (
                <>
                  <p className="mt-1 text-sm text-slate-600">
                    Started: {formatTime(record.started_at)}
                    {record.completed_at
                      ? ` · Finished: ${formatTime(record.completed_at)}` : ""}
                    {" (Malaysia time)"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Working time: {sessionError ? "Unavailable"
                      : `${Math.floor(seconds / 3600)}h ${
                          Math.floor(seconds % 3600 / 60)}m ${seconds % 60}s`}
                    {" · excludes pauses"}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap">
                    {record.work_details || "No work details recorded."}
                  </p>
                </>
              )}
            </div>
          );
        })}
      </div>

      {taskResult.data.status === "completed" ? (
        <div className="mt-4 rounded-lg bg-green-50 p-4 text-green-900">
          <p className="font-semibold">Task completed after review</p>
          {taskResult.data.completed_at && (
            <p className="mt-1 text-sm">
              {formatTime(taskResult.data.completed_at)} (Malaysia time)
            </p>
          )}
          <p className="mt-2 whitespace-pre-wrap">{taskResult.data.review_notes}</p>
        </div>
      ) : taskResult.data.status === "in_progress"
          && requestStatus === "in_progress" ? (
        ready ? (
          <form action={completeTask} className="mt-4 space-y-3">
            <input type="hidden" name="task_id" value={taskId} />
            <label className="block">
              <span className="font-medium">Review / verification notes</span>
              <textarea name="review_notes" required maxLength={5000} rows={3}
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white p-3" />
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" name="confirmed" value="yes" required
                className="mt-1 h-5 w-5" />
              <span>I have reviewed the work and verified this task is complete.</span>
            </label>
            <p className="text-sm text-slate-600">
              This completes this task only. The overall MRF stays open.
            </p>
            <button className="rounded-lg bg-green-700 px-5 py-3 font-semibold text-white">
              Confirm Task Completed
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-amber-800">
            Every assigned person must finish their part with notes before
            task completion can be confirmed. Refresh after they finish.
            {sessionError ? " Work-session data could not be loaded." : ""}
          </p>
        )
      ) : (
        <p className="mt-4 text-sm text-slate-600">
          Task completion review becomes available when the task and MRF
          are both In Progress.
        </p>
      )}
    </div>
  );
}
