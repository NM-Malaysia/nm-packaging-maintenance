import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Language } from "@/utils/language";
import { pmMasterPlanText } from "@/utils/pmMasterPlanTranslations";
import { createClient } from "@/utils/supabase/server";

type Activity = {
  id: string;
  machine_id: string;
  title: string;
  instructions: string;
  frequency_months: number;
  first_planned_date: string;
  revision: number;
};
type Asset = { id: string; machine_code: string; machine_name: string };
const field = "mt-2 block w-full rounded-lg border border-slate-300 bg-white p-2 text-base text-slate-900";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

async function manage(form: FormData) {
  "use server";
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

  const id = String(form.get("activity_id") ?? "");
  const revision = Number(form.get("revision"));
  const action = String(form.get("action") ?? "");
  const reason = String(form.get("reason") ?? "").trim();
  if (rawYear !== year || !uuid.test(id)
      || !Number.isSafeInteger(revision) || revision < 1
      || !["edit", "remove"].includes(action)
      || !reason || reason.length > 1000
      || form.get("confirmed") !== "yes") {
    redirect(destination("manage_invalid"));
  }

  const machine = String(form.get("machine_id") ?? "");
  const title = String(form.get("title") ?? "").trim();
  const instructions = String(form.get("instructions") ?? "").trim();
  const frequency = Number(form.get("frequency_months"));
  const first = String(form.get("first_planned_date") ?? "");

  if (action === "edit" && (
    !uuid.test(machine) || !title || title.length > 200
    || instructions.length > 5000
    || !Number.isInteger(frequency) || frequency < 1 || frequency > 12
    || !validDate(first) || Number(first.slice(0, 4)) !== year
  )) redirect(destination("manage_invalid"));

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { error } = await supabase.rpc("manage_pm_annual_activity", {
    p_activity: id,
    p_expected_revision: revision,
    p_action: action,
    p_reason: reason,
    p_machine: action === "edit" ? machine : null,
    p_title: action === "edit" ? title : null,
    p_instructions: instructions,
    p_frequency_months: action === "edit" ? frequency : null,
    p_first_planned_date: action === "edit" ? first : null,
  });
  if (error) {
    console.error("Manage annual PM activity failed:", error.message);
    redirect(destination(error.code === "23505" ? "duplicate" : "manage_failed"));
  }
  revalidatePath("/preventive-maintenance/master-plan");
  redirect(destination("saved"));
}

export default function AnnualActivityControls({
  activity, assets, canEdit, year, page, language,
}: {
  activity: Activity;
  assets: Asset[];
  canEdit: boolean;
  year: number;
  page: number;
  language: Language;
}) {
  const t = (text: string) => pmMasterPlanText(language, text);
  const hidden = (action: string) => (
    <>
      <input type="hidden" name="activity_id" value={activity.id} />
      <input type="hidden" name="revision" value={activity.revision} />
      <input type="hidden" name="action" value={action} />
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="page" value={page} />
    </>
  );

  return (
    <div className="mt-3 space-y-3">
      {canEdit && (
        <details>
          <summary className="cursor-pointer font-semibold text-blue-700">
            {t("Edit activity")}
          </summary>
          <form action={manage} className="mt-3 w-72 space-y-3 rounded-lg border bg-slate-50 p-3">
            {hidden("edit")}
            <label className="block font-medium">
              {t("Equipment / Facility")} *
              <select name="machine_id" required defaultValue={activity.machine_id} className={field}>
                {assets.map(asset => <option key={asset.id} value={asset.id}>
                  {asset.machine_code} · {asset.machine_name}
                </option>)}
              </select>
            </label>
            <label className="block font-medium">
              {t("PM activity")} *
              <input name="title" required maxLength={200}
                defaultValue={activity.title} className={field} />
            </label>
            <label className="block font-medium">
              {t("Interval (months)")} *
              <select name="frequency_months" required
                defaultValue={activity.frequency_months} className={field}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(value =>
                  <option key={value} value={value}>{value}</option>
                )}
              </select>
            </label>
            <label className="block font-medium">
              {t("First planned date")} *
              <input name="first_planned_date" type="date" required
                min={`${year}-01-01`} max={`${year}-12-31`}
                defaultValue={activity.first_planned_date} className={field} />
            </label>
            <label className="block font-medium">
              {t("Instructions")}
              <textarea name="instructions" rows={3} maxLength={5000}
                defaultValue={activity.instructions} className={field} />
            </label>
            <label className="block font-medium">
              {t("Reason for change")} *
              <textarea name="reason" rows={2} required maxLength={1000} className={field} />
            </label>
            <p className="text-xs text-slate-600">
              {t("Changing the asset, interval or first date replaces unused planned dates. Previous dates remain in history.")}
            </p>
            <label className="flex items-start gap-2">
              <input name="confirmed" value="yes" type="checkbox" required className="mt-1" />
              <span>{t("I confirm these changes.")}</span>
            </label>
            <button className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white">
              {t("Save changes")}
            </button>
          </form>
        </details>
      )}

      <details>
        <summary className="cursor-pointer font-semibold text-red-700">
          {t("Remove activity")}
        </summary>
        <form action={manage} className="mt-3 w-72 space-y-3 rounded-lg border border-red-200 bg-red-50 p-3">
          {hidden("remove")}
          <p className="font-medium">{activity.title}</p>
          <p className="text-sm">
            {t("This removes the activity from the active plan and cancels its unused dates. History is retained.")}
          </p>
          <label className="block font-medium">
            {t("Reason for removal")} *
            <textarea name="reason" required rows={2} maxLength={1000} className={field} />
          </label>
          <label className="flex items-start gap-2">
            <input name="confirmed" value="yes" type="checkbox" required className="mt-1" />
            <span>{t("I confirm removal of this activity.")}</span>
          </label>
          <button className="rounded-lg bg-red-700 px-4 py-2 font-semibold text-white">
            {t("Confirm removal")}
          </button>
        </form>
      </details>
    </div>
  );
}
