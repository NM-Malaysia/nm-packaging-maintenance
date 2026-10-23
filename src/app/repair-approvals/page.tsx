import { getMyLanguage } from "@/utils/language";
import { repairApprovalPageText } from "@/utils/repairApprovalPageTranslations";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import RepairApprovals from "../maintenance/RepairApprovals";

type Query = { result?: string; request?: string; page?: string };

async function Content({ searchParams }: { searchParams: Promise<Query> }) {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: employee, error } = await supabase.from("employees")
    .select("full_name,role,is_active,must_change_password")
    .eq("id", user.id).maybeSingle();

  if (error || !employee?.is_active) redirect("/login?error=access_denied");
  if (employee.must_change_password) redirect("/change-password");
  if (!["admin", "department_hod"].includes(employee.role)) redirect("/");

  const language = await getMyLanguage();
  const t = (text: string, values: Record<string, string | number> = {}) =>
    repairApprovalPageText(language, text, values);

  const params = await searchParams;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const selected = uuid.test(params.request ?? "") ? params.request : undefined;
  const number = Number(params.page);
  const page = Number.isSafeInteger(number) && number > 0 ? number : 1;

  let query = supabase.from("maintenance_requests")
    .select("id,mrf_number,machine_name,department,description,status", { count: "exact" })
    .in("status", ["repair_completed", "handover_pending"]);
  if (selected) query = query.eq("id", selected);

  const result = await query.order("submitted_at", { ascending: true })
    .order("id", { ascending: true })
    .range((page - 1) * 20, page * 20 - 1);
  const pages = Math.max(1, Math.ceil((result.count ?? 0) / 20));

  function href(target: number) {
    const query = new URLSearchParams({ page: String(target) });
    if (selected) query.set("request", selected);
    return "/repair-approvals?" + query.toString();
  }
  if (!result.error && page > pages) redirect(href(pages));

  const messages: Record<string, string> = {
    repair_approval_saved: "Approval recorded successfully.",
    repair_approval_invalid: "Enter comments and tick the review confirmation.",
    repair_approval_failed: "Approval was not saved. Check the MRF stage and your role, then refresh. The terminal contains the exact error.",
  };

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-blue-700 hover:underline">{t("← Dashboard")}</Link>
        <h1 className="mt-5 text-3xl font-bold">{t("Repair Approvals")}</h1>
        <p className="mt-2 text-slate-600">
          {employee.full_name} · {t(employee.role.replaceAll("_", " "))}
        </p>
        <p className="mt-2 text-sm text-slate-600">{t("Completed repairs and pending handovers visible under your account permissions.")}</p>
        {selected && <Link href="/repair-approvals"
          className="mt-3 inline-block text-blue-700 hover:underline">{t("Show all repairs")}</Link>}
        {params.result && messages[params.result] && (
          <p role="status" className="mt-4 rounded-lg border bg-white p-4">
            {t(messages[params.result])}
          </p>
        )}
        {result.error ? (
          <p role="alert" className="mt-5 text-red-700">{t("Repairs could not be loaded.")}</p>
        ) : (
          <div className="mt-6 space-y-5">
            {(result.data ?? []).map(request => (
              <article key={request.id} className="rounded-xl border bg-white p-5">
                <div className="flex flex-wrap justify-between gap-3">
                  <h2 className="text-xl font-bold">MRF {request.mrf_number} · {request.machine_name}</h2>
                  <span className="text-sm capitalize text-blue-800">{t(request.status.replaceAll("_", " "))}</span>
                </div>
                <p className="mt-2 text-slate-600">{request.department}</p>
                <p className="mt-3 whitespace-pre-wrap">{request.description}</p>
                {employee.role === "admin" && (
                  <Link href={"/maintenance/" + request.id}
                    className="mt-3 inline-block text-blue-700 hover:underline">{t("View full work and task details →")}</Link>
                )}
                <RepairApprovals requestId={request.id} />
              </article>
            ))}
            {!result.data?.length && <p className="rounded-xl bg-white p-6">{t("No completed repairs are available for your account.")}</p>}
          </div>
        )}
        {!result.error && (
          <nav aria-label={t("Approval pages")} className="mt-5 flex justify-between gap-4 text-sm">
            {page > 1 ? <Link href={href(page - 1)} className="text-blue-700">{t("← Previous")}</Link> : <span />}
            <span>{t("Page {page} of {pages}", { page, pages })}</span>
            {page < pages ? <Link href={href(page + 1)} className="text-blue-700">{t("Next →")}</Link> : <span />}
          </nav>
        )}
      </div>
    </main>
  );
}

export default function Page({ searchParams }: { searchParams: Promise<Query> }) {
  return <Suspense fallback={<p className="p-8">Loading repair approvals...</p>}>
    <Content searchParams={searchParams} />
  </Suspense>;
}
