import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Language } from "@/utils/language";
import { pmMasterPlanText } from "@/utils/pmMasterPlanTranslations";
import { createClient } from "@/utils/supabase/server";

async function saveChecklist(form: FormData) {
  "use server";
  const id = String(form.get("activity_id") ?? "");
  const version = Number(form.get("version"));
  const text = String(form.get("items") ?? "");
  const rawYear = Number(form.get("year"));
  const year = Number.isInteger(rawYear) && rawYear >= 2020 && rawYear <= 2100
    ? rawYear : 2027;
  const number = Number(form.get("page"));
  const page = Number.isSafeInteger(number) && number > 0 && number <= 100000
    ? number : 1;
  const destination = (result: string) =>
    "/preventive-maintenance/master-plan?" + new URLSearchParams({
      year: String(year), page: String(page), result,
    });
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const items = text.split(/\r?\n/).map(item => item.trim()).filter(Boolean);

  if (rawYear !== year || !uuid.test(id)
      || !Number.isSafeInteger(version) || version < 0
      || text.length > 100000
      || items.length < 1 || items.length > 100
      || items.some(item => Array.from(item).length > 500)) {
    redirect(destination("checklist_invalid"));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("save_pm_annual_checklist", {
    p_activity: id,
    p_items: items,
    p_expected_version: version,
  });
  if (error) {
    console.error("Annual PM checklist save failed:", error.message);
    redirect(destination(
      error.message.includes("Checklist changed")
        ? "checklist_changed" : "checklist_failed"
    ));
  }

  revalidatePath("/preventive-maintenance/master-plan");
  redirect(destination("saved"));
}

export default async function AnnualActivityChecklist({
  activityId, canManage, year, page, language,
}: {
  activityId: string;
  canManage: boolean;
  year: number;
  page: number;
  language: Language;
}) {
  const t = (text: string) => pmMasterPlanText(language, text);
  const supabase = await createClient();
  const { data, error } = await supabase.from("pm_annual_checklist_versions")
    .select("id, version, items, created_at")
    .eq("activity_id", activityId)
    .order("version", { ascending: false })
    .limit(1).maybeSingle();

  if (error) {
    return <p role="alert" className="mt-3 text-sm text-red-700">
      {t("Checklist could not be loaded. Please refresh.")}
    </p>;
  }

  const items: string[] = data?.items ?? [];
  return (
    <details className="mt-3">
      <summary className="cursor-pointer font-semibold text-blue-700">
        {t("View / Edit checklist")}
      </summary>
      <div className="mt-3 w-80 max-w-full rounded-lg border bg-slate-50 p-3">
        {data ? (
          <>
            <p className="text-xs text-slate-500">
              {t("Checklist version")}: {data.version}
            </p>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              {items.map((item, position) => (
                <li key={position} className="whitespace-pre-wrap break-words">
                  {item}
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p className="text-sm text-slate-600">
            {t("No checklist has been set up for this activity.")}
          </p>
        )}

        {canManage && (
          <details className="mt-4">
            <summary className="cursor-pointer font-semibold text-blue-700">
              {t(data ? "Edit checklist" : "Add checklist")}
            </summary>
            <form action={saveChecklist} className="mt-3 space-y-3">
              <input type="hidden" name="activity_id" value={activityId} />
              <input type="hidden" name="version" value={data?.version ?? 0} />
              <input type="hidden" name="year" value={year} />
              <input type="hidden" name="page" value={page} />
              <label className="block font-medium">
                {t("Checklist items")} *
                <textarea key={data?.id ?? "new"} name="items"
                  required rows={7} maxLength={100000}
                  defaultValue={items.join("\n")}
                  className="mt-2 block w-full rounded-lg border border-slate-300 bg-white p-3 text-base text-slate-900" />
              </label>
              <p className="text-xs text-slate-600">
                {t("Enter one item per line. Up to 100 items, 500 characters each.")}
              </p>
              <p className="text-xs text-slate-600">
                {t("Changes create a new checklist version. Annual planned dates remain unchanged.")}
              </p>
              <button className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white">
                {t("Save checklist")}
              </button>
            </form>
          </details>
        )}
      </div>
    </details>
  );
}
