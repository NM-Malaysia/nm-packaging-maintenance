import { getMyLanguage } from "@/utils/language";
import { handoverText } from "@/utils/handoverTranslations";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { maintenanceResult } from "./maintenanceNavigation";

async function updateHandover(formData: FormData) {
  "use server";

  const requestId = String(formData.get("request_id") ?? "");
  const action = String(formData.get("handover_action") ?? "");
  const comments = String(formData.get("comments") ?? "").trim();
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  function destination(result: string) {
    const detail = maintenanceResult(formData, result);
    if (detail.startsWith("/maintenance/")) return detail;
    const query = new URLSearchParams({ result });
    if (uuid.test(requestId)) query.set("request", requestId);
    return "/handovers?" + query.toString();
  }

  if (!uuid.test(requestId)
      || !["checks", "maintenance", "requestor"].includes(action)
      || comments.length > 5000
      || (action !== "checks" && (
        !comments || formData.get("confirmed") !== "yes"
      ))) {
    redirect(destination("handover_invalid"));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const result = action === "checks"
    ? await supabase.rpc("save_mrf_handover_checks", {
        p_request: requestId,
        p_machine_ok: formData.get("machine_ok") === "yes",
        p_bolts_tight: formData.get("bolts_tight") === "yes",
        p_workplace_clean: formData.get("workplace_clean") === "yes",
        p_no_temporary_modifications: formData.get("no_temporary") === "yes",
        p_remarks: comments,
      })
    : await supabase.rpc("sign_mrf_handover", {
        p_request: requestId,
        p_side: action,
        p_comments: comments,
      });

  if (result.error) {
    console.error("Handover update failed:", result.error.message);
    redirect(destination("handover_failed"));
  }

  revalidatePath("/");
  revalidatePath("/maintenance", "layout");
  revalidatePath("/repair-approvals");
  revalidatePath("/handovers");
  redirect(destination(
    action === "checks" ? "handover_checks_saved"
      : action === "maintenance" ? "handover_signed" : "handover_closed"
  ));
}

export default async function Handover({ requestId }: { requestId: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: employee } = await supabase.from("employees")
    .select("full_name,role,department_id,is_active,must_change_password")
    .eq("id", user.id).maybeSingle();
  if (!employee?.is_active || employee.must_change_password) return null;

  const language = await getMyLanguage();
  const t = (text: string) => handoverText(language, text);

  const [requestResult, checkResult, signatureResult] = await Promise.all([
    supabase.from("maintenance_requests")
      .select("status,department,requestor_id,closed_at")
      .eq("id", requestId).single(),
    supabase.from("handover_checks")
      .select("machine_function_ok,bolts_nuts_tight,workplace_clean,no_temporary_modifications,remarks,verified_employee_id,verified_at")
      .eq("request_id", requestId).maybeSingle(),
    supabase.from("approvals")
      .select("id,approval_type,decision,comments,signed_by,signed_at")
      .eq("request_id", requestId)
      .in("approval_type", ["maintenance_handover", "requestor_handover"])
      .order("signed_at", { ascending: true })
      .order("id", { ascending: true }),
  ]);

  if (requestResult.error || checkResult.error || signatureResult.error) {
    return <p role="alert" className="mt-5 text-red-700">{t("Handover details could not be loaded. Please refresh.")}</p>;
  }

  const request = requestResult.data;
  if (!["handover_pending", "closed"].includes(request.status)) return null;

  let ownDepartment = "";
  if (employee.role === "department_hod" && employee.department_id) {
    const department = await supabase.from("departments")
      .select("name").eq("id", employee.department_id).maybeSingle();
    ownDepartment = department.data?.name ?? "";
  }

  const checks = checkResult.data;
  const signatures = signatureResult.data ?? [];
  const verified = Boolean(
    checks?.machine_function_ok && checks.bolts_nuts_tight
    && checks.workplace_clean && checks.no_temporary_modifications
    && checks.verified_employee_id && checks.verified_at
  );
  const cutoff = checks?.verified_at
    ? new Date(checks.verified_at).getTime() : Infinity;
  const maintenance = signatures.find(item =>
    item.approval_type === "maintenance_handover"
    && item.decision === "approved"
    && new Date(item.signed_at).getTime() >= cutoff
  );
  const requestor = signatures.find(item =>
    item.approval_type === "requestor_handover"
    && item.decision === "approved"
    && maintenance
    && item.signed_by !== maintenance.signed_by
    && new Date(item.signed_at).getTime() >= new Date(maintenance.signed_at).getTime()
  );

  const pending = request.status === "handover_pending";
  const canMaintain = ["admin", "maintenance_supervisor"].includes(employee.role);
  const canAccept = request.requestor_id === user.id
    || (employee.role === "department_hod"
        && ownDepartment !== "" && ownDepartment === request.department);
  const side = !pending || !verified ? null
    : canMaintain && !maintenance ? "maintenance"
    : canAccept && maintenance && !requestor
      && maintenance.signed_by !== user.id ? "requestor" : null;

  const items = [
    { name: "machine_ok", label: "Machine functions correctly", checked: checks?.machine_function_ok },
    { name: "bolts_tight", label: "Bolts and nuts are tightened", checked: checks?.bolts_nuts_tight },
    { name: "workplace_clean", label: "Workplace is clean", checked: checks?.workplace_clean },
    { name: "no_temporary", label: "No temporary modifications remain", checked: checks?.no_temporary_modifications },
  ];
  const formatTime = (value: string) => new Date(value).toLocaleString(
    "en-MY", { timeZone: "Asia/Kuala_Lumpur" }
  );

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-lg font-semibold">{t("Completed maintenance handover")}</h3>
      <p className="mt-2 text-sm text-slate-600">{t("Verify checklist → Maintenance sign-off → Requestor acceptance")}</p>

      {pending && canMaintain && signatures.length === 0 ? (
        <form action={updateHandover} className="mt-5 space-y-4">
          <input type="hidden" name="request_id" value={requestId} />
          <input type="hidden" name="handover_action" value="checks" />
          <fieldset className="space-y-3">
            <legend className="mb-3 font-semibold">{t("Handover checklist")}</legend>
            {items.map(item => (
              <label key={item.name} className="flex items-start gap-3">
                <input type="checkbox" name={item.name} value="yes" required
                  defaultChecked={item.checked ?? false}
                  className="mt-1 h-5 w-5" />
                <span>{t(item.label)}</span>
              </label>
            ))}
          </fieldset>
          <label className="block">
            <span className="font-medium">{t("Checklist remarks")}</span>
            <textarea name="comments" rows={3} maxLength={5000}
              defaultValue={checks?.remarks ?? ""}
              className="mt-2 block w-full rounded-lg border border-slate-300 p-3" />
          </label>
          <p className="text-sm text-slate-600">{t("Tick only items you have verified. Resolve outstanding items before signing.")}</p>
          <button className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white">
            {verified ? t("Update verified checklist") : t("Save verified checklist")}
          </button>
        </form>
      ) : (
        <div className="mt-5 rounded-lg bg-slate-50 p-4">
          <h4 className="font-semibold">{t("Handover checklist")}</h4>
          <ul className="mt-3 space-y-2">
            {items.map(item => <li key={item.name}>
              {item.checked ? "✓" : "○"} {t(item.label)}
            </li>)}
          </ul>
          {checks?.remarks && <p className="mt-3 whitespace-pre-wrap">{checks.remarks}</p>}
        </div>
      )}

      {verified && checks?.verified_at && (
        <p className="mt-3 text-sm text-green-800">
          {t("Checklist verified:")} {formatTime(checks.verified_at)} ({t("Malaysia time")})
        </p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {[
          { title: "Maintenance handover", signature: maintenance },
          { title: "Requestor acceptance", signature: requestor },
        ].map(item => (
          <div key={item.title} className="rounded-lg border p-4">
            <h4 className="font-semibold">{t(item.title)}</h4>
            <p className={"mt-2 text-sm " +
              (item.signature ? "text-green-800" : "text-amber-800")}>
              {item.signature ? t("Signed") : t("Pending")}
              {item.signature?.signed_by === user.id ? " · " + t("by you") : ""}
            </p>
            {item.signature && (
              <>
                <p className="mt-2 whitespace-pre-wrap">{item.signature.comments}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {formatTime(item.signature.signed_at)} ({t("Malaysia time")})
                </p>
              </>
            )}
          </div>
        ))}
      </div>

      {side && (
        <form action={updateHandover} className="mt-5 space-y-4">
          <input type="hidden" name="request_id" value={requestId} />
          <input type="hidden" name="handover_action" value={side} />
          <p className="font-medium">{t("Signing as:")} {employee.full_name}</p>
          <label className="block">
            <span className="font-medium">
              {side === "maintenance" ? t("Maintenance handover comments") : t("Requestor acceptance comments")}
            </span>
            <textarea name="comments" required maxLength={5000} rows={3}
              className="mt-2 block w-full rounded-lg border border-slate-300 p-3" />
          </label>
          <label className="flex items-start gap-3">
            <input type="checkbox" name="confirmed" value="yes" required
              className="mt-1 h-5 w-5" />
            <span>{side === "maintenance"
              ? t("I confirm the verified maintenance work is ready for handover.")
              : t("I have checked the handover and accept the completed maintenance work.")}</span>
          </label>
          <p className="text-sm text-slate-600">
            {side === "maintenance"
              ? t("Your signature locks the checklist. Requestor acceptance is still required.")
              : t("Acceptance records your signature and closes this MRF.")}
          </p>
          <button className="rounded-lg bg-green-700 px-5 py-3 font-semibold text-white">
            {side === "maintenance" ? t("Sign Maintenance Handover") : t("Accept Handover & Close MRF")}
          </button>
        </form>
      )}

      {!side && pending && (
        <p className="mt-4 text-sm text-slate-600">
          {!verified ? t("Awaiting checklist verification by the maintenance supervisor or Admin.")
            : !maintenance ? t("Awaiting maintenance handover signature.")
            : t("Awaiting acceptance by the original requestor or their Department HOD using a different account.")}
        </p>
      )}

      {request.status === "closed" && (
        <div className="mt-5 rounded-lg bg-green-50 p-4 text-green-900">
          <p className="font-semibold">{t("MRF Closed")}</p>
          {request.closed_at && <p className="mt-1 text-sm">
            {formatTime(request.closed_at)} ({t("Malaysia time")})
          </p>}
        </div>
      )}
    </section>
  );
}
