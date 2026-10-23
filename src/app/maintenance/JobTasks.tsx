import { getMyLanguage } from "@/utils/language";
import { jobTasksText } from "@/utils/jobTasksTranslations";
import { maintenanceResult } from "./maintenanceNavigation";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import TaskWork from "./TaskWork";
import TaskReview from "./TaskReview";

type Staff = {
  id: string;
  employee_id: string;
  full_name: string;
  role: string;
};

type TeamMember = {
  employee_id: string;
  full_name: string;
  employee_number: string;
};

async function addTask(formData: FormData) {
  "use server";

  const requestId = String(formData.get("request_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const members = formData.getAll("member_ids").map(String);
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuid.test(requestId) || !title || title.length > 200
      || description.length > 5000 || members.length === 0
      || members.some((id) => !uuid.test(id))) {
    redirect(maintenanceResult(formData, "task_invalid"));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("add_maintenance_task", {
    p_request: requestId,
    p_title: title,
    p_description: description,
    p_members: members,
  });

  if (error) {
    console.error("Add task failed:", error.message);
    redirect(maintenanceResult(formData, "task_failed"));
  }

  revalidatePath("/maintenance", "layout");
  redirect(maintenanceResult(formData, "task_added"));
}

export default async function JobTasks({
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
  const t = (text: string) => jobTasksText(language, text);

  const canAdd = Boolean(
    employee?.is_active && !employee.must_change_password
    && ["admin", "maintenance_supervisor"].includes(employee.role)
    && ["hod_approved", "in_progress", "waiting_spare_parts",
        "follow_up_required"].includes(status)
  );

  const { data: tasks, error: taskError } = await supabase
    .from("maintenance_tasks")
    .select("id, title, description, status, created_at")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });

  const teamResult = await supabase.rpc("list_request_team", {
    p_requests: [requestId],
  });
  const team: TeamMember[] = teamResult.data ?? [];
  const names = new Map(team.map((member) => [
    member.employee_id,
    `${member.full_name} (${member.employee_number})`,
  ]));

  let staff: Staff[] = [];
  let staffError = false;
  if (canAdd) {
    const result = await supabase.rpc("list_assignable_maintenance_staff");
    staff = result.data ?? [];
    staffError = Boolean(result.error);
  }

  const taskMembers = new Map<string, string[]>();
  let memberError = false;
  if (tasks?.length) {
    const result = await supabase
      .from("maintenance_task_members")
      .select("task_id, employee_id")
      .in("task_id", tasks.map((task) => task.id));
    memberError = Boolean(result.error);
    for (const member of result.data ?? []) {
      const entries = taskMembers.get(member.task_id) ?? [];
      entries.push(names.get(member.employee_id)
        ?? (member.employee_id === user.id ? t("You") : t("Team member")));
      taskMembers.set(member.task_id, entries);
    }
  }

  return (
    <section className="mt-5 border-t pt-5">
      <h3 className="text-lg font-semibold">{t("Tasks under this MRF")}</h3>
      <p className="mt-1 text-sm text-slate-600">{t("Additional tasks stay linked to this MRF. Earlier work records remain unchanged.")}</p>

      {taskError ? (
        <p role="alert" className="mt-3 text-red-700">{t("Tasks could not be loaded. Please refresh.")}</p>
      ) : tasks?.length ? (
        <div className="mt-4 space-y-3">
          {tasks.map((task) => (
            <article key={task.id}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <h4 className="font-semibold">{task.title}</h4>
                <span className="text-sm text-blue-800">
                  {t(task.status.replaceAll("_", " "))}
                </span>
              </div>
              {task.description && (
                <p className="mt-2 whitespace-pre-wrap">{task.description}</p>
              )}
              <p className="mt-2 text-sm text-slate-600">
                {t("Assigned:")} {memberError || teamResult.error
                  ? t("Team details could not be loaded")
                  : (taskMembers.get(task.id) ?? []).join(", ") || t("No members")}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {t("Created:")} {new Date(task.created_at).toLocaleString("en-MY", {
                  timeZone: "Asia/Kuala_Lumpur",
                })} ({t("Malaysia time")})
              </p>
              <TaskWork taskId={task.id}
                requestStatus={status} taskStatus={task.status} />
              <TaskReview taskId={task.id}
                requestId={requestId} requestStatus={status} />
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">{t("No additional tasks have been created.")}</p>
      )}

      {canAdd && (
        <details className="mt-5 rounded-lg border border-slate-200 p-4">
          <summary className="cursor-pointer font-semibold text-blue-700">{t("+ Add Task")}</summary>
          {staffError ? (
            <p className="mt-3 text-red-700">{t("Staff list could not be loaded. Please refresh.")}</p>
          ) : !staff.length ? (
            <p className="mt-3">{t("No active maintenance staff available.")}</p>
          ) : (
            <form action={addTask} className="mt-4 space-y-4">
              <input type="hidden" name="request_id" value={requestId} />
              <label className="block">
                <span className="font-medium">{t("Task title")}</span>
                <input name="title" required maxLength={200}
                  placeholder={t("Replace bearing No. 1234")}
                  className="mt-2 block w-full rounded-lg border border-slate-300 p-3" />
              </label>
              <label className="block">
                <span className="font-medium">{t("Task instructions")}</span>
                <textarea name="description" maxLength={5000} rows={3}
                  className="mt-2 block w-full rounded-lg border border-slate-300 p-3" />
              </label>
              <fieldset>
                <legend className="font-medium">{t("Assign team members")}</legend>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {staff.map((member) => (
                    <label key={member.id}
                      className="flex items-start gap-3 rounded-lg border p-3">
                      <input type="checkbox" name="member_ids" value={member.id}
                        className="mt-1 h-5 w-5" />
                      <span>
                        {member.full_name} ({member.employee_id})
                        <span className="block text-sm text-slate-500">
                          {t(member.role.replaceAll("_", " "))}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <button type="submit"
                className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white">{t("Create task")}</button>
            </form>
          )}
        </details>
      )}
    </section>
  );
}
