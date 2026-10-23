import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import DashboardNavigation from "../DashboardNavigation";
import { createClient } from "@/utils/supabase/server";
import { getMyLanguage } from "@/utils/language";
import { machineText } from "@/utils/machineTranslations";

type Query = { page?: string; result?: string };
type Department = { id: string; name: string; is_active: boolean };
type Machine = {
  id: string;
  machine_code: string;
  machine_name: string;
  department_id: string | null;
  location: string;
  notes: string;
  is_active: boolean;
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const field = "mt-1 block w-full min-w-0 rounded-lg border border-slate-300 bg-white p-3 text-base text-slate-900";

async function saveMachine(form: FormData) {
  "use server";
  const id = String(form.get("machine_id") ?? "");
  const code = String(form.get("machine_code") ?? "").trim();
  const name = String(form.get("machine_name") ?? "").trim();
  const department = String(form.get("department_id") ?? "");
  const location = String(form.get("location") ?? "").trim();
  const notes = String(form.get("notes") ?? "").trim();
  const active = String(form.get("is_active") ?? "");
  const rawPage = Number(form.get("page"));
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 && rawPage <= 100000
    ? rawPage : 1;
  const destination = (result: string) =>
    "/machines?" + new URLSearchParams({ page: String(page), result });

  if ((id && !uuid.test(id)) || !/^[A-Za-z0-9_-]{1,50}$/.test(code)
      || !name || name.length > 200
      || (department && !uuid.test(department))
      || location.length > 200 || notes.length > 5000
      || !["true", "false"].includes(active)) {
    redirect(destination("invalid"));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("save_machine", {
    p_code: code,
    p_name: name,
    p_department: department || null,
    p_location: location,
    p_notes: notes,
    p_active: active === "true",
    p_id: id || null,
  });

  if (error) {
    console.error("Save equipment failed:", error.message);
    redirect(destination(error.code === "23505" ? "duplicate" : "failed"));
  }

  revalidatePath("/machines");
  revalidatePath("/requests/new");
  revalidatePath("/");
  redirect(destination("saved"));
}

function EquipmentFields({ machine, departments, page, t }: {
  machine?: Machine;
  departments: Department[];
  page: number;
  t: (text: string) => string;
}) {
  return (
    <>
      <input type="hidden" name="machine_id" value={machine?.id ?? ""} />
      <input type="hidden" name="page" value={page} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block min-w-0 text-sm font-medium">
          {t("Machine / equipment code")} *
          <input name="machine_code" required maxLength={50}
            pattern="[A-Za-z0-9_-]+"
            defaultValue={machine?.machine_code ?? ""} className={field} />
        </label>
        <label className="block min-w-0 text-sm font-medium">
          {t("Machine / equipment name")} *
          <input name="machine_name" required maxLength={200}
            defaultValue={machine?.machine_name ?? ""} className={field} />
        </label>
        <label className="block min-w-0 text-sm font-medium">
          {t("Department")}
          <select name="department_id" defaultValue={machine?.department_id ?? ""}
            className={field}>
            <option value="">{t("Not assigned")}</option>
            {departments
              .filter(d => d.is_active || d.id === machine?.department_id)
              .map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </label>
        <label className="block min-w-0 text-sm font-medium">
          {t("Location")}
          <input name="location" maxLength={200}
            defaultValue={machine?.location ?? ""} className={field} />
        </label>
        <label className="block min-w-0 text-sm font-medium">
          {t("Status")}
          <select name="is_active"
            defaultValue={String(machine?.is_active ?? true)} className={field}>
            <option value="true">{t("Active")}</option>
            <option value="false">{t("Inactive")}</option>
          </select>
        </label>
      </div>
      <label className="block text-sm font-medium">
        {t("Notes")}
        <textarea name="notes" rows={3} maxLength={5000}
          defaultValue={machine?.notes ?? ""} className={field} />
      </label>
      <p className="text-sm text-slate-600">
        {t("Use a unique code containing letters, numbers, hyphens or underscores.")}
      </p>
      <button type="submit"
        className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white">
        {t("Save equipment")}
      </button>
    </>
  );
}

async function Content({ searchParams }: { searchParams: Promise<Query> }) {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: employee, error } = await supabase.from("employees")
    .select("full_name, role, is_active, must_change_password")
    .eq("id", user.id).maybeSingle();
  if (error || !employee?.is_active) redirect("/login?error=access_denied");
  if (employee.must_change_password) redirect("/change-password");

  const canManage = ["admin", "maintenance_supervisor"].includes(employee.role);
  const language = await getMyLanguage();
  const t = (text: string) => machineText(language, text);
  const params = await searchParams;
  const number = Number(params.page);
  const page = Number.isSafeInteger(number) && number > 0 && number <= 100000
    ? number : 1;

  const [machines, departmentResult] = await Promise.all([
    supabase.from("machines")
      .select("id, machine_code, machine_name, department_id, location, notes, is_active",
        { count: "exact" })
      .order("machine_code")
      .order("id")
      .range((page - 1) * 20, page * 20 - 1),
    supabase.from("departments").select("id, name, is_active").order("name"),
  ]);
  const pages = Math.max(1, Math.ceil((machines.count ?? 0) / 20));
  if (!machines.error && page > pages) redirect("/machines?page=" + pages);

  const departments: Department[] = departmentResult.data ?? [];
  const names = new Map(departments.map(d => [d.id, d.name]));
  const messages: Record<string, string> = {
    saved: "Equipment saved.",
    invalid: "Check the equipment details.",
    duplicate: "This equipment code already exists.",
    failed: "Equipment could not be saved. Refresh and try again.",
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <DashboardNavigation name={employee.full_name} role={employee.role} />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-bold">{t("Machine Register")}</h1>
        <p className="mt-2 text-slate-600">
          {t("Register equipment before selecting it in a new MRF.")}
        </p>
        {params.result && messages[params.result] && (
          <p role="status" className="mt-4 rounded-lg border bg-white p-4">
            {t(messages[params.result])}
          </p>
        )}
        {departmentResult.error && (
          <p role="alert" className="mt-4 text-red-700">
            {t("Departments could not be loaded. Refresh before editing.")}
          </p>
        )}
        {canManage && !departmentResult.error && (
          <details className="mt-6 rounded-xl border bg-white p-5">
            <summary className="cursor-pointer font-semibold text-blue-700">
              + {t("Add equipment")}
            </summary>
            <form action={saveMachine} className="mt-4 space-y-4">
              <EquipmentFields departments={departments} page={page} t={t} />
            </form>
          </details>
        )}

        <h2 className="mt-8 text-xl font-bold">{t("Equipment records")}</h2>
        <p className="mt-2 text-sm text-slate-600">
          {t("Inactive equipment remains in the register for history.")}
        </p>
        {machines.error ? (
          <p role="alert" className="mt-4 text-red-700">
            {t("Equipment could not be loaded.")}
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {(machines.data ?? []).map((machine: Machine) => (
              <article key={machine.id} className="rounded-xl border bg-white p-5">
                <div className="flex flex-wrap justify-between gap-3">
                  <h3 className="font-bold">
                    {machine.machine_code} · {machine.machine_name}
                  </h3>
                  <span className={machine.is_active ? "text-green-800" : "text-amber-800"}>
                    {t(machine.is_active ? "Active" : "Inactive")}
                  </span>
                </div>
                {!departmentResult.error && (
                  <p className="mt-2 text-sm text-slate-600">
                    {t("Department")}: {names.get(machine.department_id ?? "") ?? t("Not assigned")}
                  </p>
                )}
                {machine.location && (
                  <p className="mt-2 text-sm">{t("Location")}: {machine.location}</p>
                )}
                {machine.notes && <p className="mt-2 whitespace-pre-wrap break-words">{machine.notes}</p>}
                {canManage && !departmentResult.error && (
                  <details className="mt-4 border-t pt-4">
                    <summary className="cursor-pointer font-semibold text-blue-700">
                      {t("Edit equipment")}
                    </summary>
                    <form action={saveMachine} className="mt-4 space-y-4">
                      <EquipmentFields machine={machine} departments={departments}
                        page={page} t={t} />
                    </form>
                  </details>
                )}
              </article>
            ))}
            {!machines.data?.length && (
              <p className="rounded-xl bg-white p-5">{t("No equipment records available.")}</p>
            )}
          </div>
        )}
        {!machines.error && (
          <nav className="mt-6 flex items-center justify-between gap-4">
            {page > 1 ? <Link href={"/machines?page=" + (page - 1)}
              className="text-blue-700">{t("Previous")}</Link> : <span />}
            <span className="text-sm">{t("Page")} {page} / {pages}</span>
            {page < pages ? <Link href={"/machines?page=" + (page + 1)}
              className="text-blue-700">{t("Next")}</Link> : <span />}
          </nav>
        )}
      </div>
    </main>
  );
}

export default function Page(props: { searchParams: Promise<Query> }) {
  return (
    <Suspense fallback={<p className="p-8">Loading...</p>}>
      <Content {...props} />
    </Suspense>
  );
}
