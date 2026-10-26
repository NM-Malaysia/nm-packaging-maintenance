import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import DashboardNavigation from "../../../DashboardNavigation";
import { createClient } from "@/utils/supabase/server";
import { getMyLanguage } from "@/utils/language";
import { pmServiceText } from "@/utils/pmServiceTranslations";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ result?: string }>;
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const field = "mt-2 block w-full rounded-lg border border-slate-300 bg-white p-3 text-base text-slate-900";
const labels: Record<string, string> = {
  in_progress: "In Progress", awaiting_review: "Awaiting Review", completed: "Completed",
  awaiting_acknowledgement: "Awaiting Production Manager Acknowledgement",
  pass: "Pass", fail: "Fail", not_applicable: "Not applicable",
};

async function update(form: FormData) {
  "use server";
  const id = String(form.get("service_id") ?? "");
  if (!uuid.test(id)) redirect("/preventive-maintenance");
  const destination = (result: string) =>
    `/preventive-maintenance/services/${id}?result=${result}`;
  const intent = String(form.get("intent") ?? "");
  const notes = String(form.get("notes") ?? "").trim();
  const followUp = String(form.get("follow_up") ?? "").trim();
  const result = String(form.get("check_result") ?? "");
  const position = Number(form.get("position"));

  if (!["check", "finish", "review", "acknowledge"].includes(intent)
      || notes.length > (intent === "finish" ? 10000 : 5000)
      || (intent !== "check" && (!notes || form.get("confirmed") !== "yes"))
      || (intent === "review" && followUp.length > 5000)
      || (intent === "check" && (
        !Number.isInteger(position) || position < 1 || position > 100
        || !["pass", "fail", "not_applicable"].includes(result)
        || (result !== "pass" && !notes)
      ))) redirect(destination("invalid"));

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  let error;
  if (intent === "check") {
    ({ error } = await supabase.rpc("save_pm_service_check", {
      p_service: id, p_position: position, p_result: result, p_notes: notes,
    }));
  } else if (intent === "finish") {
    ({ error } = await supabase.rpc("finish_my_pm_service", {
      p_service: id, p_notes: notes,
    }));
  } else if (intent === "review") {
    ({ error } = await supabase.rpc("review_pm_service", {
      p_service: id, p_notes: notes, p_follow_up: followUp,
    }));
  } else {
    ({ error } = await supabase.rpc("acknowledge_pm_service", {
      p_service: id, p_notes: notes,
    }));
  }
  if (error) {
    console.error("PM service update failed:", error.message);
    redirect(destination("failed"));
  }
  revalidatePath("/preventive-maintenance", "layout");
  revalidatePath("/");
  redirect(destination("saved"));
}

async function Content({ params, searchParams }: Props) {
  await connection();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!uuid.test(id)) redirect("/preventive-maintenance");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: employee, error: employeeError } = await supabase.from("employees")
    .select("full_name, role, is_active, must_change_password")
    .eq("id", user.id).maybeSingle();
  if (employeeError || !employee?.is_active) redirect("/login?error=access_denied");
  if (employee.must_change_password) redirect("/change-password");
  if (!["admin", "maintenance_supervisor", "maintenance_technician",
        "maintenance_clerk"].includes(employee.role)) redirect("/");

  const language = await getMyLanguage();
  const t = (text: string) => pmServiceText(language, text);
  const [serviceResult, memberResult, checkResult] = await Promise.all([
    supabase.from("pm_services")
      .select("id, title, instructions, machine_code, machine_name, scheduled_due_date, status, started_at, completed_at, reviewed_by, reviewed_at, review_notes, follow_up_notes, acknowledgement_required, acknowledged_by, acknowledged_at, acknowledgement_notes")
      .eq("id", id).maybeSingle(),
    supabase.from("pm_service_members")
      .select("employee_id, employee_number, full_name, work_notes, finished_at")
      .eq("service_id", id).order("full_name").order("employee_id"),
    supabase.from("pm_service_checks")
      .select("position, item, result, notes, checked_by, checked_at")
      .eq("service_id", id).order("position"),
  ]);
  const service = serviceResult.data;
  const failed = Boolean(serviceResult.error || memberResult.error || checkResult.error || !service);
  const members = memberResult.data ?? [];
  const checks = checkResult.data ?? [];
  const mine = members.find(member => member.employee_id === user.id);
  const names = new Map(members.map(member => [member.employee_id, member.full_name]));
  const canWork = !failed && service?.status === "in_progress"
    && Boolean(mine && !mine.finished_at)
    && ["maintenance_supervisor", "maintenance_technician"].includes(employee.role);
  const allChecked = checks.length > 0 && checks.every(check => check.result !== null);
  const canReview = !failed && service?.status === "awaiting_review"
    && ["admin", "maintenance_supervisor"].includes(employee.role);
  const hasFailures = checks.some(check => check.result === "fail");
  const awaitingAcknowledgement = service?.status === "awaiting_acknowledgement";
  const canAcknowledge = !failed && awaitingAcknowledgement
    && employee.role === "admin"
    && Boolean(service?.reviewed_by)
    && service?.reviewed_by !== user.id;
  const time = (value: string) => new Date(value).toLocaleString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
  }) + ` (${t("Malaysia time")})`;
  const messages: Record<string, string> = {
    saved: "Saved successfully.",
    invalid: "Complete the required fields and confirmation.",
    failed: "Update was not saved. Refresh and check your assignment and service stage.",
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <DashboardNavigation name={employee.full_name} role={employee.role} />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Link href="/preventive-maintenance" className="text-blue-700 hover:underline">
          ← {t("Back to PM schedules")}
        </Link>
        <h1 className="mt-5 text-2xl font-bold">{t("PM service")}</h1>
        {query.result && messages[query.result] && (
          <p role="status" className="mt-4 rounded-lg border bg-white p-4">
            {t(messages[query.result])}
          </p>
        )}
        {failed || !service ? (
          <p role="alert" className="mt-5 text-red-700">{t("Service unavailable or access denied.")}</p>
        ) : (
          <>
            <section className="mt-5 rounded-xl border bg-white p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <h2 className="text-xl font-bold">{service.title}</h2>
                <span className="font-semibold text-blue-800">{t(labels[service.status] ?? service.status)}</span>
              </div>
              <p className="mt-2 font-semibold">{service.machine_code} · {service.machine_name}</p>
              <p className="mt-2 text-sm">{t("Scheduled due date")}: {service.scheduled_due_date}</p>
              <p className="mt-1 text-sm">{t("Started")}: {time(service.started_at)}</p>
              {service.instructions && <p className="mt-3 whitespace-pre-wrap break-words">{service.instructions}</p>}
              <p className="mt-3 text-sm text-slate-600">
                {t("Service uses the checklist and team copied when it started.")}
              </p>
            </section>

            <section className="mt-5 rounded-xl border bg-white p-5">
              <h2 className="text-xl font-bold">{t("Service checklist")}</h2>
              <div className="mt-4 space-y-4">
                {checks.map(check => (
                  <article key={check.position} className="rounded-lg border p-4">
                    <h3 className="font-semibold">{check.position}. {check.item}</h3>
                    <p className="mt-2 font-medium">
                      {t(check.result ? labels[check.result] ?? check.result : "Not checked")}
                    </p>
                    {check.notes && <p className="mt-2 whitespace-pre-wrap break-words">{check.notes}</p>}
                    {check.checked_at && <p className="mt-2 text-xs text-slate-500">
                      {t("Recorded by")}: {names.get(check.checked_by ?? "") ?? "—"} · {time(check.checked_at)}
                    </p>}
                    {canWork && (
                      <form action={update} className="mt-3 space-y-3">
                        <input type="hidden" name="service_id" value={id} />
                        <input type="hidden" name="intent" value="check" />
                        <input type="hidden" name="position" value={check.position} />
                        <select name="check_result" required defaultValue={check.result ?? ""}
                          aria-label={`${check.position}. ${check.item}`} className={field}>
                          <option value="" disabled>{t("Select result")}</option>
                          {["pass", "fail", "not_applicable"].map(value =>
                            <option key={value} value={value}>{t(labels[value])}</option>
                          )}
                        </select>
                        <label className="block text-sm">
                          {t("Notes — required for Fail or Not applicable")}
                          <textarea name="notes" rows={2} maxLength={5000}
                            defaultValue={check.notes} className={field} />
                        </label>
                        <button className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white">
                          {t("Save result")}
                        </button>
                      </form>
                    )}
                  </article>
                ))}
              </div>
            </section>

            <section className="mt-5 rounded-xl border bg-white p-5">
              <h2 className="text-xl font-bold">{t("Assigned team and work notes")}</h2>
              <div className="mt-4 space-y-3">
                {members.map(member => (
                  <article key={member.employee_id} className="rounded-lg border p-4">
                    <h3 className="font-semibold">{member.full_name} ({member.employee_number})</h3>
                    <p className="mt-1 text-sm">
                      {t(member.finished_at ? "Finished" : "Unfinished")}
                      {member.finished_at ? ` · ${time(member.finished_at)}` : ""}
                    </p>
                    {member.work_notes && <p className="mt-2 whitespace-pre-wrap break-words">{member.work_notes}</p>}
                  </article>
                ))}
              </div>
              {canWork && (allChecked ? (
                <form action={update} className="mt-5 space-y-3">
                  <input type="hidden" name="service_id" value={id} />
                  <input type="hidden" name="intent" value="finish" />
                  <label className="block font-medium">
                    {t("My work notes")} *
                    <textarea name="notes" required maxLength={10000} rows={4}
                      defaultValue={mine?.work_notes ?? ""} className={field} />
                  </label>
                  <label className="flex items-start gap-3">
                    <input type="checkbox" name="confirmed" value="yes" required className="mt-1 h-5 w-5" />
                    <span>{t("I have finished my assigned work. This locks my notes.")}</span>
                  </label>
                  <button className="rounded-lg bg-green-700 px-5 py-3 font-semibold text-white">
                    {t("Finish My Part")}
                  </button>
                </form>
              ) : <p className="mt-4 text-sm text-amber-800">
                {t("Record all checklist results before finishing your part.")}
              </p>)}
            </section>

            {canReview && (
              <section className="mt-5 rounded-xl border bg-white p-5">
                <h2 className="text-xl font-bold">{t("Supervisor review")}</h2>
                <form action={update} className="mt-4 space-y-4">
                  <input type="hidden" name="service_id" value={id} />
                  <input type="hidden" name="intent" value="review" />
                  <label className="block font-medium">
                    {t("Review notes")} *
                    <textarea name="notes" required maxLength={5000} rows={3} className={field} />
                  </label>
                  <label className="block font-medium">
                    {t("Follow-up action — required if any check failed")}
                    <textarea name="follow_up" required={hasFailures}
                      maxLength={5000} rows={3} className={field} />
                  </label>
                  <label className="flex items-start gap-3">
                    <input type="checkbox" name="confirmed" value="yes" required className="mt-1 h-5 w-5" />
                    <span>{t("I have reviewed the results and recorded any required follow-up.")}</span>
                  </label>
                  <p className="text-sm text-slate-600">
                    {t("Verification sends this service to Production Manager acknowledgement. The service closes and its next due date updates after a different Admin acknowledges. Follow-up notes do not create an MRF.")}
                  </p>
                  <button className="rounded-lg bg-green-700 px-5 py-3 font-semibold text-white">
                    {t("Verify and Send to Production Manager")}
                  </button>
                </form>
              </section>
            )}

            {awaitingAcknowledgement && (
              <section className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-5">
                <h2 className="text-xl font-bold">{t("Production Manager acknowledgement")}</h2>
                {canAcknowledge ? (
                  <form action={update} className="mt-4 space-y-4">
                    <input type="hidden" name="service_id" value={id} />
                    <input type="hidden" name="intent" value="acknowledge" />
                    <label className="block font-medium">
                      {t("Acknowledgement notes")} *
                      <textarea name="notes" required maxLength={5000}
                        rows={3} className={field} />
                    </label>
                    <label className="flex items-start gap-3">
                      <input type="checkbox" name="confirmed" value="yes" required
                        className="mt-1 h-5 w-5" />
                      <span>{t("I acknowledge this PM service as Production Manager.")}</span>
                    </label>
                    <p className="text-sm text-slate-700">
                      {t("Acknowledgement closes this service and updates the next due date from the recorded work completion date.")}
                    </p>
                    <button className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white">
                      {t("Acknowledge and Close Service")}
                    </button>
                  </form>
                ) : (
                  <p className="mt-3 text-sm text-amber-900">
                    {t(employee.role === "admin" && service.reviewed_by === user.id
                      ? "You verified this service. A different Admin must acknowledge it."
                      : "Awaiting acknowledgement by an Admin who did not verify this service.")}
                  </p>
                )}
              </section>
            )}

            {(service.status === "completed" || awaitingAcknowledgement) && (
              <section className="mt-5 rounded-xl border bg-white p-5">
                <h2 className="text-xl font-bold">
                  {t(awaitingAcknowledgement
                    ? "Awaiting Production Manager Acknowledgement"
                    : "Completed")}
                </h2>
                {service.completed_at && <p className="mt-2 text-sm">
                  {t("Completion recorded")}: {time(service.completed_at)}
                </p>}
                {service.reviewed_at && <p className="mt-1 text-sm">
                  {t("Review recorded")}: {time(service.reviewed_at)}
                </p>}
                {service.acknowledged_at && (
                  <div className="mt-4 rounded-lg bg-green-50 p-4 text-green-900">
                    <h3 className="font-semibold">{t("Production Manager acknowledgement")}</h3>
                    <p className="mt-2 text-sm">
                      {t("Acknowledged")}: {time(service.acknowledged_at)}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap break-words">
                      {service.acknowledgement_notes}
                    </p>
                  </div>
                )}
                {service.status === "completed" && !service.acknowledgement_required && (
                  <p className="mt-3 text-sm text-slate-600">
                    {t("Completed before the acknowledgement requirement was introduced.")}
                  </p>
                )}
                <h3 className="mt-4 font-semibold">{t("Review notes")}</h3>
                <p className="mt-2 whitespace-pre-wrap break-words">{service.review_notes}</p>
                {service.follow_up_notes && <>
                  <h3 className="mt-4 font-semibold">{t("Follow-up action — required if any check failed")}</h3>
                  <p className="mt-2 whitespace-pre-wrap break-words">{service.follow_up_notes}</p>
                </>}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function Page(props: Props) {
  return <Suspense fallback={<p className="p-8">Loading...</p>}>
    <Content {...props} />
  </Suspense>;
}
