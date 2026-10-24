import { requestSummaryText } from "@/utils/requestSummaryTranslations";
import DashboardNavigation from "../DashboardNavigation";
import { getMyLanguage } from "@/utils/language";
import { mrfDetailText } from "@/utils/mrfDetailTranslations";
import PartsFollowup from "./PartsFollowup";
import TemporaryRepair from "./TemporaryRepair";
import Handover from "./Handover";
import RepairApprovals from "./RepairApprovals";
import { maintenanceBack, maintenanceResult } from "./maintenanceNavigation";
import DetailForms from "./DetailForms";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import WorkDetails from "./WorkDetails";
import JobStatus from "./JobStatus";
import RepairCompletion from "./RepairCompletion";
import JobTasks from "./JobTasks";

type Technician = {
  id: string;
  employee_id: string;
  full_name: string;
  role: string;
};

type Assignment = {
  request_id: string;
  employee_id: string;
  full_name: string;
  employee_number: string;
  assigned_at: string;
};

async function startWork(formData: FormData) {
  "use server";

  const requestId = String(formData.get("request_id") ?? "");
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuid.test(requestId)) redirect(maintenanceResult(formData, "invalid"));

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("start_assigned_work", {
    p_request: requestId,
  });

  if (error) {
    console.error("Start work failed:", error.message);
    redirect(maintenanceResult(formData, "start_failed"));
  }

  revalidatePath("/");
  revalidatePath("/maintenance", "layout");
  redirect(maintenanceResult(formData, "started"));
}

async function assignRequest(formData: FormData) {
  "use server";

  const requestId = String(formData.get("request_id") ?? "");
  const memberIds = formData.getAll("member_ids").map(String);
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuid.test(requestId) || memberIds.length === 0
      || memberIds.some((id) => !uuid.test(id))) {
    redirect(maintenanceResult(formData, "invalid"));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { error } = await supabase.rpc("assign_maintenance_team", {
    p_request: requestId,
    p_members: memberIds,
  });

  if (error) {
    console.error("Maintenance assignment failed:", error.message);
    redirect(maintenanceResult(formData, "failed"));
  }

  revalidatePath("/");
  revalidatePath("/maintenance", "layout");
  redirect(maintenanceResult(formData, "assigned"));
}

async function MaintenanceContent({
  searchParams,
}: {
  searchParams: Promise<{ result?: string; request?: string; back?: string }>;
}) {
  await connection();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("full_name, role, is_active, must_change_password")
    .eq("id", user.id)
    .maybeSingle();

  if (employeeError || !employee || !employee.is_active) {
    redirect("/login?error=access_denied");
  }
  if (employee.must_change_password) redirect("/change-password");

  if (!["admin", "maintenance_supervisor",
        "maintenance_technician", "maintenance_clerk"].includes(employee.role)) {
    redirect("/");
  }

  const language = await getMyLanguage();
  const t = (text: string) => {
    const summary = requestSummaryText(language, text);
    return summary !== text ? summary : mrfDetailText(language, text);
  };
  const categoryLabels: Record<string, string> = {
    equipment: "Machine / Equipment",
    facilities: "Building / Facilities",
    other: "Other Maintenance Work",
  };

  const canAssign = ["admin", "maintenance_supervisor"].includes(employee.role);
  const params = await searchParams;

  const { data: requests, error: requestError } = await supabase
    .from("maintenance_requests")
    .select("id, mrf_number, machine_name, work_category, work_location, department, description, status")
    .eq("id", params.request ?? "")
    .order("submitted_at", { ascending: true })
    .limit(1);

  const ids = (requests ?? []).map((request) => request.id);
  let assignments: Assignment[] = [];
  let assignmentError = false;

  if (ids.length > 0) {
    const result = await supabase.rpc("list_request_team", {
      p_requests: ids,
    });
    assignments = result.data ?? [];
    assignmentError = Boolean(result.error);
  }

  let technicians: Technician[] = [];
  let technicianError = false;

  if (canAssign) {
    const result = await supabase.rpc("list_assignable_maintenance_staff");
    technicians = result.data ?? [];
    technicianError = Boolean(result.error);
  }

  const assignmentMap = new Map<string, Assignment[]>();
  for (const member of assignments) {
    const team = assignmentMap.get(member.request_id) ?? [];
    team.push(member);
    assignmentMap.set(member.request_id, team);
  }

  const workMap = new Map<string, string>();
  let workError = false;

  if (ids.length > 0) {
    const result = await supabase
      .from("request_work_records")
      .select("request_id, started_at")
      .eq("employee_id", user.id)
      .in("request_id", ids);

    workError = Boolean(result.error);
    for (const record of result.data ?? []) {
      workMap.set(record.request_id, record.started_at);
    }
  }

  const messages: Record<string, string> = {
    parts_requested: "Part requested. Pending maintenance clerk check.",
    parts_saved: "Part record saved.",
    parts_invalid: "Check the part fields, dates and MIV requirements.",
    parts_failed: "Part record could not be saved. Check dates, permissions and whether the record is locked.",

    temporary_recorded: "Temporary repair recorded. Machine restart saved, permanent-repair task assigned and follow-up pending.",
    temporary_resolved: "Permanent repair follow-up resolved. You can proceed to Overall Repair Completion when all work is ready.",
    temporary_invalid: "Complete the temporary repair details, responsible person, dates and confirmation.",
    temporary_failed: "Temporary repair update failed. Check the MRF stage, running sessions and linked task review. The terminal contains the exact reason.",

    handover_checks_saved: "Handover checklist verified and saved.",
    handover_signed: "Maintenance handover signed. Requestor acceptance is pending.",
    handover_closed: "Handover accepted. This MRF is now Closed.",
    handover_invalid: "Complete the required checklist, comments and confirmation.",
    handover_failed: "Handover was not saved. Refresh and check the stage and account. Check the terminal for the exact reason.",

    repair_approval_saved: "Repair approval recorded successfully.",
    repair_approval_invalid: "Enter approval comments and tick the confirmation.",
    repair_approval_failed: "Approval was not saved. Refresh and check your role and the MRF stage. Check the terminal for the exact reason.",

    repair_completed: "Overall repair completion saved. Final approvals and handover are still required.",
    repair_invalid: "Enter a repair summary, valid restoration time where applicable, and tick the verification box.",
    repair_failed: "Repair completion was not saved. Check all tasks are reviewed, personal work is finished, and restoration time is valid. Check the terminal for the exact reason.",
    task_completed: "Task completion confirmed. The overall MRF remains open.",
    review_invalid: "Enter review notes and confirm that you verified task completion.",
    review_failed: "Task completion was not saved. Refresh and check all assigned members have finished. Check the terminal if it continues.",
    task_work_start: "Your task work has started.",
    task_work_pause: "Your task work is paused.",
    task_work_resume: "Your task work has resumed.",
    task_work_save: "Your task notes were saved.",
    task_work_finish: "Your part is finished. The task remains open for supervisor review.",
    task_work_invalid: "Enter task notes before finishing, using no more than 10000 characters.",
    task_work_failed: "Task work was not updated. Refresh and check the MRF status and your assignment. Check the terminal if it continues.",
    task_added: "Task created under the existing MRF and team assigned.",
    task_invalid: "Enter a task title and select at least one team member.",
    task_failed: "Task was not created. Refresh and try again. Check the terminal if it continues.",
    status_saved: "Job status and reason saved.",
    status_invalid: "Select a new status and enter a reason of 1 to 5000 characters.",
    status_failed: "Status was not changed. Refresh and confirm all running work sessions are paused or finished before placing the job on hold. Check the terminal if it continues.",
    work_paused: "Your work is paused. Working time has stopped.",
    work_resumed: "Your work has resumed. A new work session has started.",
    session_failed: "The work session could not be changed. Refresh and try again.",
    work_saved: "Your work details were saved.",
    work_finished: "Your work is finished. The request remains open for supervisor review.",
    work_invalid: "Enter work details before finishing, using no more than 10000 characters.",
    work_failed: "Your work update was not saved. Refresh and check whether it is already finished. Check the terminal if the problem continues.",
    started: "Your work start time was recorded. The request is now In Progress.",
    start_failed: "Work could not be started. Refresh and try again. Check the Codespaces terminal if it continues.",
    assigned: "Job team saved. The request status is unchanged.",
    invalid: "Select at least one valid team member.",
    failed: "Assignment was not saved. Refresh and try again. If it continues, check the Codespaces terminal error.",
  };

  return (
    <DetailForms><main className="min-h-screen bg-slate-100 text-slate-900">
      <DashboardNavigation name={employee.full_name} role={employee.role} />
      <div className="px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Link href={maintenanceBack(params.back)} className="text-blue-700 hover:underline">
          {t("\u2190 Back to maintenance list")}
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-slate-900">
          {t("MRF Details")}
        </h1>
        <p className="mt-2 text-slate-600">
          {employee.full_name} · {t(employee.role.replaceAll("_", " "))}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          {t("Work, tasks and history for this MRF.")}
        </p>

        {params.result && messages[params.result] && (
          <p role="status" className="mt-6 rounded-xl border bg-white p-5">
            {t(messages[params.result])}
          </p>
        )}

        {requestError || assignmentError ? (
          <p role="alert" className="mt-6 rounded-xl bg-white p-6 text-red-700">
            {t("Requests or assignments could not be loaded. Please refresh.")}
          </p>
        ) : (
          <div className="mt-6 space-y-5">
            {(requests ?? []).map((request) => {
              const team = assignmentMap.get(request.id) ?? [];
              const selectedIds = new Set(
                team.map((member) => member.employee_id)
              );
              const editable = [
                "hod_approved", "in_progress",
                "waiting_spare_parts", "follow_up_required",
              ].includes(request.status);

              return (
                <section key={request.id}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap justify-between gap-3">
                    <h2 className="text-xl font-bold">
                      MRF {request.mrf_number} · {request.machine_name}
                    </h2>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-800">
                      {t(request.status.replaceAll("_", " "))}
                    </span>
                  </div>
                  <p className="mt-2 text-slate-600">{request.department}</p>
                  <dl className="mt-4 grid gap-4 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="font-semibold">{t("Work category")}</dt>
                      <dd className="mt-1">
                        {t(categoryLabels[request.work_category ?? ""] ?? "Not specified")}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold">
                        {t(request.work_category === "equipment"
                          ? "Machine / Equipment"
                          : request.work_category === "facilities" || request.work_category === "other"
                          ? "Work subject" : "Equipment / Work subject")}
                      </dt>
                      <dd className="mt-1 break-words">{request.machine_name}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="font-semibold">{t("Work location")}</dt>
                      <dd className="mt-1 whitespace-pre-wrap break-words">
                        {request.work_location || t("Not recorded")}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-4 whitespace-pre-wrap">{request.description}</p>
                  <div className="mt-4">
                    <h3 className="font-semibold">{t("Assigned team")}</h3>
                    {team.length === 0 ? (
                      <p className="mt-2 text-slate-600">{t("Not assigned")}</p>
                    ) : (
                      <ul className="mt-2 space-y-2">
                        {team.map((member) => (
                          <li key={member.employee_id}>
                            <span className="font-medium">
                              {member.full_name} ({member.employee_number})
                              {member.employee_id === user.id ? " — " + t("you") : ""}
                            </span>
                            <span className="block text-sm text-slate-500">
                              {t("Assigned")}: {new Date(member.assigned_at).toLocaleString(
                                "en-MY", { timeZone: "Asia/Kuala_Lumpur" }
                              )} ({t("Malaysia time")})
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {selectedIds.has(user.id)
                    && ["maintenance_technician", "maintenance_supervisor"].includes(employee.role)
                    && (
                    <div className="mt-5 border-t pt-5">
                      {workError ? (
                        <p role="alert" className="text-red-700">
                          {t("Your work record could not be loaded. Please refresh.")}
                        </p>
                      ) : workMap.has(request.id) ? (
                        <p className="font-medium text-green-800">
                          {t("Your work started")}: {new Date(
                            workMap.get(request.id)!
                          ).toLocaleString("en-MY", {
                            timeZone: "Asia/Kuala_Lumpur",
                          })} ({t("Malaysia time")})
                        </p>
                      ) : ["hod_approved", "in_progress"].includes(request.status) ? (
                        <form action={startWork}>
                          <input type="hidden" name="request_id" value={request.id} />
                          <p className="mb-3 text-sm text-slate-600">
                            {t("Start Work records your own start time. The first team member to start moves this request to In Progress.")}
                          </p>
                          <button type="submit"
                            className="rounded-lg bg-green-700 px-5 py-3 font-semibold text-white">
                            {t("Start Work")}
                          </button>
                        </form>
                      ) : (
                        <p className="text-sm text-slate-600">
                          {t("Starting work is unavailable at this request stage.")}
                        </p>
                      )}
                    </div>
                  )}

                  {selectedIds.has(user.id) && workMap.has(request.id) && (
                    <WorkDetails requestId={request.id} status={request.status} />
                  )}

                  <TemporaryRepair requestId={request.id} status={request.status} />

                  <PartsFollowup requestId={request.id} status={request.status} />

                  <JobTasks requestId={request.id} status={request.status} />

                  <JobStatus requestId={request.id} status={request.status} />
                  <RepairCompletion requestId={request.id} />
                  <RepairApprovals requestId={request.id} />
                  <Handover requestId={request.id} />

                  {canAssign && editable && (
                    technicianError ? (
                      <p className="mt-4 text-red-700">
                        {t("Team member list could not be loaded.")}
                      </p>
                    ) : technicians.length === 0 ? (
                      <p className="mt-4 text-amber-700">
                        {t("No active technicians or supervisors are available.")}
                      </p>
                    ) : (
                      <form action={assignRequest}
                        className="mt-5 border-t pt-5">
                        <input type="hidden" name="request_id" value={request.id} />
                        <fieldset>
                          <legend className="font-semibold">{t("Assign job team")}</legend>
                          <p className="mt-1 text-sm text-slate-600">
                            {t("Select one or more technicians or supervisors. Unchecking a member removes them when you save.")}
                          </p>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {technicians.map((member) => (
                              <label key={member.id}
                                className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4">
                                <input type="checkbox" name="member_ids"
                                  value={member.id}
                                  defaultChecked={selectedIds.has(member.id)}
                                  className="mt-1 h-5 w-5" />
                                <span>
                                  <span className="block font-medium">
                                    {member.full_name} ({member.employee_id})
                                  </span>
                                  <span className="text-sm text-slate-500">
                                    {t(member.role.replaceAll("_", " "))}
                                  </span>
                                </span>
                              </label>
                            ))}
                          </div>
                        </fieldset>
                        <button type="submit"
                          className="mt-5 rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white">
                          {t("Save job team")}
                        </button>
                      </form>
                    )
                  )}
                </section>
              );
            })}
            {requests?.length === 0 && (
              <p className="rounded-xl bg-white p-6">
                {t("This MRF is unavailable or you do not have permission to view it.")}
              </p>
            )}
          </div>
        )}
      </div>
      </div>
    </main></DetailForms>
  );
}

export default function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string; request?: string; back?: string }>;
}) {
  return (
    <Suspense fallback={<p className="p-8">Loading maintenance requests...</p>}>
      <MaintenanceContent searchParams={searchParams} />
    </Suspense>
  );
}
