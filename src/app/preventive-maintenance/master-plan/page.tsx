import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import DashboardNavigation from "../../DashboardNavigation";
import { createClient } from "@/utils/supabase/server";
import { getMyLanguage } from "@/utils/language";
import { pmMasterPlanText } from "@/utils/pmMasterPlanTranslations";

type Props = {
  searchParams: Promise<{ year?: string; page?: string; result?: string }>;
};
type Asset = {
  id: string; machine_code: string; machine_name: string;
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const field = "mt-2 block w-full min-w-0 rounded-lg border border-slate-300 bg-white p-3 text-base text-slate-900";

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

async function save(form: FormData) {
  "use server";
  const number = Number(form.get("year"));
  const year = Number.isInteger(number) && number >= 2020 && number <= 2100
    ? number : 2027;
  const destination = (result: string) =>
    `/preventive-maintenance/master-plan?year=${year}&result=${result}`;
  if (number !== year) redirect(destination("invalid"));

  const intent = String(form.get("intent") ?? "");
  const title = String(form.get("title") ?? "").trim();
  if (!title || title.length > 200 || !["create", "activity"].includes(intent)) {
    redirect(destination("invalid"));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let error;
  if (intent === "create") {
    ({ error } = await supabase.rpc("create_pm_annual_plan", {
      p_year: year, p_title: title,
    }));
  } else {
    const plan = String(form.get("annual_plan_id") ?? "");
    const machine = String(form.get("machine_id") ?? "");
    const instructions = String(form.get("instructions") ?? "").trim();
    const frequency = Number(form.get("frequency_months"));
    const first = String(form.get("first_planned_date") ?? "");
    if (!uuid.test(plan) || !uuid.test(machine)
        || instructions.length > 5000
        || !Number.isInteger(frequency) || frequency < 1 || frequency > 12
        || !validDate(first) || Number(first.slice(0, 4)) !== year) {
      redirect(destination("invalid"));
    }
    ({ error } = await supabase.rpc("add_pm_annual_activity", {
      p_annual_plan: plan,
      p_machine: machine,
      p_title: title,
      p_instructions: instructions,
      p_frequency_months: frequency,
      p_first_planned_date: first,
    }));
  }

  if (error) {
    console.error("Annual PM plan update failed:", error.message);
    redirect(destination(error.code === "23505" ? "duplicate" : "failed"));
  }
  revalidatePath("/preventive-maintenance/master-plan");
  redirect(destination("saved"));
}

async function Content({ searchParams }: Props) {
  await connection();
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

  const canManage = ["admin", "maintenance_supervisor"].includes(employee.role);
  const language = await getMyLanguage();
  const t = (text: string) => pmMasterPlanText(language, text);
  const params = await searchParams;
  const rawYear = Number(params.year);
  const year = Number.isInteger(rawYear) && rawYear >= 2020 && rawYear <= 2100
    ? rawYear : 2027;
  const rawPage = Number(params.page);
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 && rawPage <= 100000
    ? rawPage : 1;
  const href = (target: number) =>
    `/preventive-maintenance/master-plan?year=${year}&page=${target}`;

  const planResult = await supabase.from("pm_annual_plans")
    .select("id, title, plan_year").eq("plan_year", year).maybeSingle();
  const plan = planResult.data;

  const activityResult = plan && !planResult.error
    ? await supabase.from("pm_annual_activities")
        .select("id, machine_id, title, instructions, frequency_months, first_planned_date",
          { count: "exact" })
        .eq("annual_plan_id", plan.id)
        .order("machine_id").order("title").order("id")
        .range((page - 1) * 50, page * 50 - 1)
    : { data: [], error: null, count: 0 };
  const pages = Math.max(1, Math.ceil((activityResult.count ?? 0) / 50));
  if (plan && !activityResult.error && page > pages) redirect(href(pages));
  const activities = activityResult.data ?? [];
  const assetIds = [...new Set(activities.map(item => item.machine_id))];

  const [dateResult, namesResult, choicesResult] = await Promise.all([
    activities.length
      ? supabase.from("pm_annual_occurrences")
          .select("id, activity_id, planned_date")
          .in("activity_id", activities.map(item => item.id))
          .order("planned_date").order("id").range(0, 599)
      : Promise.resolve({ data: [], error: null }),
    assetIds.length
      ? supabase.from("machines").select("id, machine_code, machine_name")
          .in("id", assetIds)
      : Promise.resolve({ data: [], error: null }),
    canManage && plan
      ? supabase.from("machines")
          .select("id, machine_code, machine_name", { count: "exact" })
          .eq("is_active", true).order("machine_code").order("id").range(0, 999)
      : Promise.resolve({ data: [], error: null, count: 0 }),
  ]);
  const names = new Map((namesResult.data ?? []).map((asset: Asset) => [asset.id, asset]));
  const choices: Asset[] = choicesResult.data ?? [];
  const tooManyAssets = (choicesResult.count ?? 0) > 1000;
  const dates = dateResult.data ?? [];
  const loadError = Boolean(planResult.error || activityResult.error || dateResult.error);
  const months = Array.from({ length: 12 }, (_, month) =>
    new Intl.DateTimeFormat(language === "en" ? "en-MY" : language, {
      month: "short", timeZone: "UTC",
    }).format(new Date(Date.UTC(year, month, 1)))
  );
  const messages: Record<string, string> = {
    saved: "Saved successfully.",
    invalid: "Check the required fields and dates.",
    duplicate: "This activity already exists for this asset in the annual plan.",
    failed: "The change was not saved. Refresh and try again.",
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <DashboardNavigation name={employee.full_name} role={employee.role} />
      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
        <Link href="/" className="text-blue-700 hover:underline">← {t("Dashboard")}</Link>
        <h1 className="mt-5 text-3xl font-bold">{t("Annual PM Master Plan")}</h1>
        <form action="/preventive-maintenance/master-plan"
          className="mt-5 flex flex-wrap items-end gap-4">
          <label className="font-medium">
            {t("Year")}
            <input name="year" type="number" min={2020} max={2100}
              required defaultValue={year} className={field} />
          </label>
          <button className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white">
            {t("Show plan")}
          </button>
        </form>
        {params.result && messages[params.result] && (
          <p role="status" className="mt-4 rounded-lg border bg-white p-4">
            {t(messages[params.result])}
          </p>
        )}
        {loadError ? (
          <p role="alert" className="mt-5 text-red-700">{t("Master plan could not be loaded.")}</p>
        ) : !plan ? (
          <section className="mt-6 rounded-xl border bg-white p-5">
            <p>{t("No master plan exists for this year.")}</p>
            {canManage && <form action={save} className="mt-4 space-y-4">
              <input type="hidden" name="intent" value="create" />
              <input type="hidden" name="year" value={year} />
              <label className="block max-w-xl font-medium">
                {t("Plan title")} *
                <input name="title" required maxLength={200}
                  defaultValue={`PM Master Plan ${year}`} className={field} />
              </label>
              <button className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white">
                {t("Create annual plan")}
              </button>
            </form>}
          </section>
        ) : (
          <>
            <h2 className="mt-6 text-xl font-bold">{plan.title}</h2>
            <p className="mt-2 text-sm text-slate-600">
              {t("Planned dates are generated within the selected year. Technician assignment is not required during annual planning.")}
            </p>
            {canManage && (
              <details className="mt-5 rounded-xl border bg-white p-5">
                <summary className="cursor-pointer font-semibold text-blue-700">
                  + {t("Add PM activity")}
                </summary>
                {choicesResult.error ? <p role="alert" className="mt-4 text-red-700">
                  {t("Asset list could not be loaded.")}
                </p> : tooManyAssets ? <p role="alert" className="mt-4 text-amber-800">
                  {t("Asset list exceeds the current selection limit. Register selection needs narrowing before adding activities.")}
                </p> : !choices.length ? <p className="mt-4">
                  {t("No active registered assets are available.")}
                </p> : (
                  <form action={save} className="mt-4 space-y-4">
                    <input type="hidden" name="intent" value="activity" />
                    <input type="hidden" name="annual_plan_id" value={plan.id} />
                    <input type="hidden" name="year" value={year} />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="min-w-0 font-medium">
                        {t("Equipment / Facility")} *
                        <select name="machine_id" required defaultValue="" className={field}>
                          <option value="" disabled>{t("Select registered asset")}</option>
                          {choices.map(asset => <option key={asset.id} value={asset.id}>
                            {asset.machine_code} · {asset.machine_name}
                          </option>)}
                        </select>
                      </label>
                      <label className="font-medium">
                        {t("PM activity")} *
                        <input name="title" required maxLength={200} className={field} />
                      </label>
                      <label className="font-medium">
                        {t("Interval (months)")} *
                        <select name="frequency_months" defaultValue="1" required className={field}>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(value =>
                            <option key={value} value={value}>{value}</option>
                          )}
                        </select>
                      </label>
                      <label className="min-w-0 font-medium">
                        {t("First planned date")} *
                        <input name="first_planned_date" type="date" required
                          min={`${year}-01-01`} max={`${year}-12-31`} className={field} />
                      </label>
                    </div>
                    <label className="block font-medium">
                      {t("Instructions")}
                      <textarea name="instructions" rows={3} maxLength={5000} className={field} />
                    </label>
                    <button className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white">
                      {t("Add activity and planned dates")}
                    </button>
                  </form>
                )}
                <Link href="/machines" className="mt-4 inline-block text-blue-700 hover:underline">
                  {t("Equipment & Facilities Register")} →
                </Link>
              </details>
            )}

            {namesResult.error && <p role="alert" className="mt-4 text-red-700">
              {t("Asset list could not be loaded.")}
            </p>}
            <p className="mt-5 text-sm text-slate-600">
              {t("Activities")}: {activityResult.count ?? 0}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {t("The grid shows planned dates. Original plan dates are retained for comparison with actual work.")}
            </p>
            <div className="mt-4 overflow-x-auto rounded-xl border bg-white">
              <table className="w-full min-w-[1250px] text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-3">{t("Equipment / Facility")}</th>
                    <th className="p-3">{t("PM activity")}</th>
                    <th className="p-3">{t("Interval (months)")}</th>
                    {months.map((month, index) =>
                      <th key={index} className="min-w-16 p-3 text-center">{month}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {activities.map(activity => {
                    const asset = names.get(activity.machine_id);
                    const planned = dates.filter(date => date.activity_id === activity.id);
                    return (
                      <tr key={activity.id} className="border-t align-top">
                        <th scope="row" className="min-w-40 p-3 font-medium">
                          {asset ? `${asset.machine_code} · ${asset.machine_name}` : t("Asset unavailable")}
                        </th>
                        <td className="min-w-48 p-3">
                          <p className="font-semibold">{activity.title}</p>
                          {activity.instructions && <p className="mt-2 whitespace-pre-wrap break-words text-xs text-slate-600">
                            {activity.instructions}
                          </p>}
                        </td>
                        <td className="p-3 text-center">{activity.frequency_months}</td>
                        {months.map((_, month) => {
                          const entries = planned.filter(date =>
                            Number(date.planned_date.slice(5, 7)) === month + 1
                          );
                          return <td key={month} className="p-3 text-center">
                            {entries.length ? entries.map(date => (
                              <span key={date.id}
                                title={`${t("Planned dates")}: ${date.planned_date}`}
                                className="inline-block rounded-lg bg-blue-50 px-3 py-2 font-semibold text-blue-800">
                                {Number(date.planned_date.slice(8, 10))}
                              </span>
                            )) : <span className="text-slate-300">—</span>}
                          </td>;
                        })}
                      </tr>
                    );
                  })}
                  {!activities.length && <tr><td colSpan={15} className="p-6 text-slate-500">
                    {t("No PM activities have been added.")}
                  </td></tr>}
                </tbody>
              </table>
            </div>
            <nav className="mt-5 flex justify-between gap-4">
              {page > 1 ? <Link href={href(page - 1)} className="text-blue-700">
                ← {t("Previous")}
              </Link> : <span />}
              <span>{t("Page")} {page} / {pages}</span>
              {page < pages ? <Link href={href(page + 1)} className="text-blue-700">
                {t("Next")} →
              </Link> : <span />}
            </nav>
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
