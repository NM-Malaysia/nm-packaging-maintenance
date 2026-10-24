import { requestSummaryText } from "@/utils/requestSummaryTranslations";
import DashboardNavigation from "../DashboardNavigation";
import { getMyLanguage } from "@/utils/language";
import { hodApprovalText } from "@/utils/hodApprovalTranslations";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

async function reviewRequest(form: FormData) {
  "use server";

  const requestId = String(form.get("request_id") ?? "");
  const decision = String(form.get("decision") ?? "");
  const comments = String(form.get("comments") ?? "").trim();
  let failed = false;

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId) ||
    !["approved", "rejected"].includes(decision) ||
    comments.length > 5000 ||
    (decision === "rejected" && !comments)
  ) {
    redirect("/approvals?result=invalid");
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } =
      await supabase.auth.getUser();

    if (authError || !user) {
      failed = true;
    } else {
      const { error } = await supabase.rpc("review_request_hod", {
        p_request: requestId,
        p_decision: decision,
        p_comments: comments,
      });
      failed = Boolean(error);
    }
  } catch {
    failed = true;
  }

  if (failed) redirect("/approvals?result=failed");

  revalidatePath("/");
  revalidatePath("/approvals");
  redirect("/approvals?result=" + decision);
}

type Props = {
  searchParams: Promise<{ result?: string }>;
};

async function ApprovalContent({ searchParams }: Props) {
  await connection();

  const supabase = await createClient();
  const { data: { user }, error: authError } =
    await supabase.auth.getUser();

  if (authError || !user) redirect("/login");

  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("full_name, role, is_active, must_change_password")
    .eq("id", user.id)
    .maybeSingle();

  if (employeeError || !employee || !employee.is_active) {
    redirect("/login?error=access_denied");
  }

  if (employee.must_change_password) redirect("/change-password");
  if (!["department_hod", "admin"].includes(employee.role)) redirect("/");

  const language = await getMyLanguage();
  const t = (text: string) => {
    const summary = requestSummaryText(language, text);
    return summary !== text ? summary : hodApprovalText(language, text);
  };
  const categoryLabels: Record<string, string> = {
    equipment: "Machine / Equipment",
    facilities: "Building / Facilities",
    other: "Other Maintenance Work",
  };

  const { result } = await searchParams;

  // Existing RLS limits which requests this employee can see.
  const { data: requests, error } = await supabase
    .from("maintenance_requests")
    .select("id, mrf_number, machine_name, work_category, work_location, department, description, request_type, submitted_at, downtime_applicable, downtime_started_at")
    .eq("status", "submitted")
    .order("submitted_at")
    .limit(100);

  const messages: Record<string, string> = {
    approved: "Approval saved. The request is now HOD Approved.",
    rejected: "Rejection saved. The request is now Rejected.",
    invalid: "Select a valid decision. Rejection requires comments.",
    failed: "Review was not confirmed. Refresh and check the request status before retrying. Your account may lack permission, or another reviewer may have already processed it.",
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <DashboardNavigation name={employee.full_name} role={employee.role} />
      <div className="p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-blue-700 underline">{t("← Back to dashboard")}</Link>

        <p className="mt-6 text-sm font-semibold text-slate-600">
          NM PACKAGING (M) SDN. BHD.
        </p>
        <h1 className="mt-2 text-3xl font-bold">{t("HOD Request Approvals")}</h1>
        <p className="mt-2 text-slate-600">
          {t("Reviewer:")} {employee.full_name}
        </p>
        <p className="mb-6 mt-2 text-sm text-slate-500">{t("Oldest 100 submitted requests visible under your account permissions. Decisions are recorded with your identity and signing time.")}</p>

        {result && messages[result] && (
          <p role="status" className="mb-6 rounded-lg border bg-white p-4">
            {t(messages[result])}
          </p>
        )}

        {error ? (
          <p role="alert" className="rounded-xl bg-white p-6 text-red-700">{t("Unable to load requests. Refresh or contact your administrator.")}</p>
        ) : requests?.length === 0 ? (
          <p className="rounded-xl bg-white p-6">{t("No submitted requests are awaiting your review.")}</p>
        ) : (
          <div className="space-y-6">
            {(requests ?? []).map((request) => (
              <section key={request.id} className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold">MRF {request.mrf_number}</h2>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold">{t("Work category")}</dt>
                    <dd>{t(categoryLabels[request.work_category ?? ""] ?? "Not specified")}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">
                      {t(request.work_category === "equipment"
                        ? "Machine / Equipment"
                        : request.work_category === "facilities" || request.work_category === "other"
                        ? "Work subject" : "Equipment / Work subject")}
                    </dt>
                    <dd className="break-words">{request.machine_name}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">{t("Work location")}</dt>
                    <dd className="whitespace-pre-wrap break-words">
                      {request.work_location || t("Not recorded")}
                    </dd>
                  </div>
                  <div><dt className="font-semibold">{t("Department")}</dt><dd>{request.department}</dd></div>
                  <div><dt className="font-semibold">{t("Request type")}</dt><dd className="capitalize">{t(request.request_type)}</dd></div>
                  <div>
                    <dt className="font-semibold">{t("Submitted — Malaysia time")}</dt>
                    <dd>{new Date(request.submitted_at).toLocaleString("en-MY", {
                      timeZone: "Asia/Kuala_Lumpur",
                    })}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">{t("Downtime applies")}</dt>
                    <dd>{request.downtime_applicable ? t("Yes") : t("No")}</dd>
                  </div>
                  {request.downtime_applicable && request.downtime_started_at && (
                    <div>
                      <dt className="font-semibold">{t("Downtime started — Malaysia time")}</dt>
                      <dd>{new Date(request.downtime_started_at).toLocaleString("en-MY", {
                        timeZone: "Asia/Kuala_Lumpur",
                      })}</dd>
                    </div>
                  )}
                </dl>

                <h3 className="mt-5 font-semibold">{t("Work requested")}</h3>
                <p className="mt-2 whitespace-pre-wrap break-words text-slate-700">
                  {request.description}
                </p>

                <form action={reviewRequest} className="mt-6 space-y-4 border-t pt-5">
                  <input type="hidden" name="request_id" value={request.id} />
                  <div>
                    <label htmlFor={`decision-${request.id}`} className="font-medium">{t("Decision *")}</label>
                    <select
                      id={`decision-${request.id}`}
                      name="decision"
                      required
                      defaultValue=""
                      className="mt-2 w-full rounded-lg border p-3"
                    >
                      <option value="" disabled>{t("Select decision")}</option>
                      <option value="approved">{t("Approve request")}</option>
                      <option value="rejected">{t("Reject request")}</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`comments-${request.id}`} className="font-medium">{t("Comments — required for rejection")}</label>
                    <textarea
                      id={`comments-${request.id}`}
                      name="comments"
                      maxLength={5000}
                      rows={3}
                      className="mt-2 w-full rounded-lg border p-3"
                    />
                  </div>
                  <p className="text-sm text-slate-500">{t("Clicking Confirm records your decision and changes the request status.")}</p>
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white"
                  >
                    {t("Confirm decision for MRF")} {request.mrf_number}
                  </button>
                </form>
              </section>
            ))}
          </div>
        )}
      </div>
      </div>
    </main>
  );
}

export default function ApprovalPage(props: Props) {
  return (
    <Suspense fallback={<main className="p-8">Loading approvals…</main>}>
      <ApprovalContent {...props} />
    </Suspense>
  );
}
