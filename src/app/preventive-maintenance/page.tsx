import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import DashboardNavigation from "../DashboardNavigation";
import PMChecklist from "./PMChecklist";
import PMServicePanel from "./PMServicePanel";
import { pmServiceText } from "@/utils/pmServiceTranslations";
import { createClient } from "@/utils/supabase/server";
import { getMyLanguage } from "@/utils/language";

type Props = {
  searchParams: Promise<{ page?: string; view?: string; result?: string; start?: string }>;
};
type Plan = {
  id: string;
  machine_id: string;
  title: string;
  instructions: string;
  interval_days: number;
  next_due_date: string;
  is_active: boolean;
};
type Equipment = {
  id: string; machine_code: string; machine_name: string; is_active: boolean;
};
type Person = {
  id: string; employee_id: string; full_name: string;
};
type Member = {
  plan_id: string; employee_id: string; employee_number: string;
  full_name: string; role: string;
  is_active: boolean; must_change_password: boolean;
};

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const field = "mt-2 block w-full min-w-0 rounded-lg border border-slate-300 bg-white p-3 text-base text-slate-900";
const words: Record<string, [string, string, string]> = {
  "Checklist saved.": ["Senarai semak disimpan.", "检查清单已保存。", "जाँचसूची सुरक्षित भयो।"],
  "Enter 1 to 100 checklist items, up to 500 characters each.": [
    "Masukkan 1 hingga 100 item, maksimum 500 aksara setiap item.",
    "请输入 1 至 100 项，每项最多 500 个字符。",
    "१ देखि १०० जाँच बुँदा लेख्नुहोस्, प्रत्येक बढीमा ५०० अक्षर।"
  ],
  "Checklist was not saved. Refresh and try again.": [
    "Senarai semak tidak disimpan. Muat semula dan cuba lagi.",
    "检查清单未保存。请刷新后重试。",
    "जाँचसूची सुरक्षित भएन। रिफ्रेस गरी फेरि प्रयास गर्नुहोस्।"
  ],
  "Preventive Maintenance": ["Penyelenggaraan Pencegahan", "预防性保养", "निवारक मर्मत"],
  "Dashboard": ["Papan Pemuka", "仪表板", "ड्यासबोर्ड"],
  "Equipment schedules and assigned maintenance teams.": [
    "Jadual peralatan dan pasukan penyelenggaraan yang ditugaskan.",
    "设备保养计划及负责团队。",
    "उपकरण तालिका र तोकिएका मर्मत टोलीहरू।"
  ],
  "Add schedule": ["Tambah jadual", "添加保养计划", "तालिका थप्नुहोस्"],
  "Edit schedule": ["Sunting jadual", "编辑保养计划", "तालिका सम्पादन गर्नुहोस्"],
  "Equipment": ["Peralatan", "设备", "उपकरण"],
  "Select equipment": ["Pilih peralatan", "选择设备", "उपकरण छान्नुहोस्"],
  "Schedule title": ["Tajuk jadual", "计划名称", "तालिकाको शीर्षक"],
  "Instructions": ["Arahan", "保养说明", "निर्देशन"],
  "Interval (days)": ["Sela (hari)", "保养间隔（天）", "अन्तराल (दिन)"],
  "Next due date — Malaysia date": [
    "Tarikh perlu seterusnya — tarikh Malaysia", "下次到期日—马来西亚日期", "अर्को देय मिति — मलेसिया मिति"
  ],
  "Assign team members": ["Tugaskan ahli pasukan", "分配团队成员", "टोली सदस्य तोक्नुहोस्"],
  "Status": ["Status", "状态", "स्थिति"],
  "Active": ["Aktif", "启用", "सक्रिय"],
  "Inactive": ["Tidak aktif", "停用", "निष्क्रिय"],
  "Save schedule": ["Simpan jadual", "保存计划", "तालिका सुरक्षित गर्नुहोस्"],
  "Schedule saved.": ["Jadual disimpan.", "计划已保存。", "तालिका सुरक्षित भयो।"],
  "Check all required fields and select at least one team member.": [
    "Semak semua medan wajib dan pilih sekurang-kurangnya seorang ahli.",
    "请检查必填项，并至少选择一位团队成员。",
    "आवश्यक विवरण जाँच्नुहोस् र कम्तीमा एक सदस्य छान्नुहोस्।"
  ],
  "Schedule was not saved. Refresh and check the equipment and assigned team.": [
    "Jadual tidak disimpan. Muat semula dan semak peralatan serta pasukan.",
    "计划未保存。请刷新并检查设备及负责团队。",
    "तालिका सुरक्षित भएन। रिफ्रेस गरी उपकरण र टोली जाँच्नुहोस्।"
  ],
  "Schedules could not be loaded. Please refresh.": [
    "Jadual tidak dapat dimuatkan. Sila muat semula.", "无法加载计划，请刷新。", "तालिका लोड भएन। कृपया रिफ्रेस गर्नुहोस्।"
  ],
  "Equipment could not be loaded. Please refresh.": [
    "Peralatan tidak dapat dimuatkan. Sila muat semula.", "无法加载设备，请刷新。", "उपकरण लोड भएन। कृपया रिफ्रेस गर्नुहोस्।"
  ],
  "Team list could not be loaded. Please refresh.": [
    "Senarai pasukan tidak dapat dimuatkan. Sila muat semula.", "无法加载团队名单，请刷新。", "टोली सूची लोड भएन। कृपया रिफ्रेस गर्नुहोस्।"
  ],
  "No active equipment or assignable staff are available.": [
    "Tiada peralatan aktif atau kakitangan boleh ditugaskan.",
    "暂无可用的启用设备或可分配人员。",
    "सक्रिय उपकरण वा तोक्न मिल्ने कर्मचारी उपलब्ध छैनन्।"
  ],
  "Overdue": ["Lewat tempoh", "已逾期", "म्याद नाघेको"],
  "Due today": ["Perlu hari ini", "今日到期", "आज देय"],
  "Upcoming": ["Akan datang", "未到期", "आगामी"],
  "Assigned team": ["Pasukan ditugaskan", "负责团队", "तोकिएको टोली"],
  "You are assigned": ["Anda ditugaskan", "您已被分配", "तपाईंलाई तोकिएको छ"],
  "Unavailable for active assignment": [
    "Tidak tersedia untuk penugasan aktif", "暂不可分配至启用计划", "सक्रिय जिम्मेवारीका लागि उपलब्ध छैन"
  ],
  "No schedules in this view.": [
    "Tiada jadual dalam paparan ini.", "此分类暂无计划。", "यस दृश्यमा तालिका छैनन्।"
  ],
  "Previous": ["Sebelumnya", "上一页", "अघिल्लो"],
  "Next": ["Seterusnya", "下一页", "अर्को"],
  "Page": ["Halaman", "页", "पृष्ठ"],
  "Matching schedules": ["Jadual sepadan", "符合条件的计划", "मिल्ने तालिकाहरू"],
  "Equipment unavailable": ["Peralatan tidak tersedia", "设备暂不可用", "उपकरण उपलब्ध छैन"],
  "Select one or more technicians or supervisors.": [
    "Pilih seorang atau lebih juruteknik atau penyelia.",
    "选择一位或多位技术员或主管。",
    "एक वा बढी प्राविधिक वा सुपरभाइजर छान्नुहोस्।"
  ],
  "This page manages schedules only. Completion checklists and service records will be added next. Due dates do not advance automatically yet.": [
    "Halaman ini mengurus jadual sahaja. Senarai semak penyiapan dan rekod servis akan ditambah seterusnya. Tarikh perlu belum bergerak secara automatik.",
    "此页面目前管理保养计划。下一步将添加完成检查清单和保养记录。到期日暂不会自动顺延。",
    "यस पृष्ठले तालिका मात्र व्यवस्थापन गर्छ। सम्पन्न जाँचसूची र सेवा अभिलेख अर्को चरणमा थपिनेछन्। देय मिति अहिले स्वतः अगाडि सर्दैन।"
  ],
};

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

async function savePlan(form: FormData) {
  "use server";
  const id = String(form.get("plan_id") ?? "");
  const machine = String(form.get("machine_id") ?? "");
  const title = String(form.get("title") ?? "").trim();
  const instructions = String(form.get("instructions") ?? "").trim();
  const interval = Number(form.get("interval_days"));
  const due = String(form.get("next_due_date") ?? "");
  const active = String(form.get("is_active") ?? "");
  const members = form.getAll("member_ids").map(String);

  if ((id && !uuid.test(id)) || !uuid.test(machine)
      || !title || title.length > 200 || instructions.length > 5000
      || !Number.isInteger(interval) || interval < 1 || interval > 3650
      || !validDate(due) || !["true", "false"].includes(active)
      || members.length < 1 || members.length > 20
      || new Set(members).size !== members.length
      || members.some(member => !uuid.test(member))) {
    redirect("/preventive-maintenance?result=invalid");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("save_pm_plan", {
    p_machine: machine,
    p_title: title,
    p_instructions: instructions,
    p_interval_days: interval,
    p_next_due_date: due,
    p_members: members,
    p_active: active === "true",
    p_id: id || null,
  });
  if (error) {
    console.error("PM schedule save failed:", error.message);
    redirect("/preventive-maintenance?result=failed");
  }

  revalidatePath("/preventive-maintenance");
  revalidatePath("/");
  redirect("/preventive-maintenance?view=" + (active === "true" ? "active" : "inactive") + "&result=saved");
}

function PlanForm({ plan, equipment, staff, members, t }: {
  plan?: Plan;
  equipment: Equipment[];
  staff: Person[];
  members: Member[];
  t: (text: string) => string;
}) {
  const selected = new Set(members.map(member => member.employee_id));
  const people = new Map(staff.map(person => [person.id, person]));
  for (const member of members) {
    if (!people.has(member.employee_id)) {
      people.set(member.employee_id, {
        id: member.employee_id,
        employee_id: member.employee_number,
        full_name: member.full_name,
      });
    }
  }
  const available = new Set(staff.map(person => person.id));

  return (
    <form action={savePlan} className="mt-4 space-y-4">
      <input type="hidden" name="plan_id" value={plan?.id ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="min-w-0 font-medium">
          {t("Equipment")} *
          <select name="machine_id" required defaultValue={plan?.machine_id ?? ""} className={field}>
            <option value="" disabled>{t("Select equipment")}</option>
            {equipment.filter(item => item.is_active || item.id === plan?.machine_id).map(item => (
              <option key={item.id} value={item.id}>
                {item.machine_code} · {item.machine_name}{item.is_active ? "" : ` (${t("Inactive")})`}
              </option>
            ))}
          </select>
        </label>
        <label className="font-medium">
          {t("Schedule title")} *
          <input name="title" required maxLength={200}
            defaultValue={plan?.title ?? ""} className={field} />
        </label>
        <label className="font-medium">
          {t("Interval (days)")} *
          <input type="number" name="interval_days" min={1} max={3650}
            step={1} required defaultValue={plan?.interval_days ?? 30} className={field} />
        </label>
        <label className="min-w-0 font-medium">
          {t("Next due date — Malaysia date")} *
          <input type="date" name="next_due_date" required
            defaultValue={plan?.next_due_date ?? ""} className={field} />
        </label>
        <label className="font-medium">
          {t("Status")}
          <select name="is_active" defaultValue={String(plan?.is_active ?? true)} className={field}>
            <option value="true">{t("Active")}</option>
            <option value="false">{t("Inactive")}</option>
          </select>
        </label>
      </div>
      <label className="block font-medium">
        {t("Instructions")}
        <textarea name="instructions" rows={3} maxLength={5000}
          defaultValue={plan?.instructions ?? ""} className={field} />
      </label>
      <fieldset>
        <legend className="font-medium">{t("Assign team members")} *</legend>
        <p className="mt-1 text-sm text-slate-600">{t("Select one or more technicians or supervisors.")}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {[...people.values()].map(person => (
            <label key={person.id} className="flex items-start gap-3 rounded-lg border p-3">
              <input type="checkbox" name="member_ids" value={person.id}
                defaultChecked={selected.has(person.id)} className="mt-1 h-5 w-5" />
              <span>
                {person.full_name} ({person.employee_id})
                {!available.has(person.id) && <span className="mt-1 block text-xs text-amber-800">
                  {t("Unavailable for active assignment")}
                </span>}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <button className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white">
        {t("Save schedule")}
      </button>
    </form>
  );
}

async function Content({ searchParams }: Props) {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: employee, error } = await supabase.from("employees")
    .select("full_name, role, is_active, must_change_password")
    .eq("id", user.id).maybeSingle();
  if (error || !employee?.is_active) redirect("/login?error=access_denied");
  if (employee.must_change_password) redirect("/change-password");
  if (!["admin", "maintenance_supervisor", "maintenance_technician",
        "maintenance_clerk"].includes(employee.role)) redirect("/");

  const language = await getMyLanguage();
  const index = { ms: 0, zh: 1, ne: 2 };
  const t = (text: string) => language === "en" ? text : words[text]?.[index[language]] ?? text;
  const canManage = ["admin", "maintenance_supervisor"].includes(employee.role);
  const params = await searchParams;
  const view = params.view === "inactive" ? "inactive" : "active";
  const number = Number(params.page);
  const page = Number.isSafeInteger(number) && number > 0 && number <= 100000 ? number : 1;
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());

  const [plansResult, equipmentResult] = await Promise.all([
    supabase.from("pm_plans")
      .select("id, machine_id, title, instructions, interval_days, next_due_date, is_active", { count: "exact" })
      .eq("is_active", view === "active")
      .order("next_due_date").order("id")
      .range((page - 1) * 20, page * 20 - 1),
    supabase.from("machines")
      .select("id, machine_code, machine_name, is_active")
      .order("machine_code").order("id"),
  ]);
  const pages = Math.max(1, Math.ceil((plansResult.count ?? 0) / 20));
  const href = (target: number) => `/preventive-maintenance?view=${view}&page=${target}`;
  if (!plansResult.error && page > pages) redirect(href(pages));

  const plans: Plan[] = plansResult.error ? [] : plansResult.data ?? [];
  const equipment: Equipment[] = equipmentResult.data ?? [];
  const machines = new Map(equipment.map(item => [item.id, item]));
  const teamResult = plans.length
    ? await supabase.rpc("list_pm_team", { p_plans: plans.map(plan => plan.id) })
    : { data: [], error: null };
  const members: Member[] = teamResult.data ?? [];

  const staffResult = canManage
    ? await supabase.rpc("list_assignable_maintenance_staff")
    : { data: [], error: null };
  const staff: Person[] = staffResult.data ?? [];
  const canCreate = canManage && !equipmentResult.error && !staffResult.error
    && equipment.some(item => item.is_active) && staff.length > 0;
  const messages: Record<string, string> = {
    saved: "Schedule saved.",
    checklist_saved: "Checklist saved.",
    checklist_invalid: "Enter 1 to 100 checklist items, up to 500 characters each.",
    checklist_failed: "Checklist was not saved. Refresh and try again.",
    invalid: "Check all required fields and select at least one team member.",
    failed: "Schedule was not saved. Refresh and check the equipment and assigned team.",
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <DashboardNavigation name={employee.full_name} role={employee.role} />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link href="/" className="text-blue-700 hover:underline">← {t("Dashboard")}</Link>
        <h1 className="mt-5 text-3xl font-bold">{t("Preventive Maintenance")}</h1>
        <p className="mt-2 text-slate-600">{t("Equipment schedules and assigned maintenance teams.")}</p>
        {/* Annual PM master plan entry */}
        <section className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <Link href="/preventive-maintenance/master-plan"
            className="inline-flex rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800">
            {{
              en: "Open annual PM Master Plan →",
              ms: "Buka Pelan Induk PM Tahunan →",
              zh: "打开年度预防性保养总计划 →",
              ne: "वार्षिक PM मुख्य योजना खोल्नुहोस् →"
            }[language]}
          </Link>
          <p className="mt-3 text-sm text-slate-700">
            {{
              en: "Plan activities and checklists across January to December for machines and facilities.",
              ms: "Rancang aktiviti dan senarai semak dari Januari hingga Disember untuk mesin dan kemudahan.",
              zh: "为机器及设施制定一月至十二月的保养活动与检查清单。",
              ne: "मेसिन र सुविधाहरूका लागि जनवरीदेखि डिसेम्बरसम्मका गतिविधि र जाँचसूची योजना बनाउनुहोस्।"
            }[language]}
          </p>
        </section>
        {params.start === "failed" && <p role="alert" className="mt-4 rounded-lg border bg-white p-4 text-red-700">
          {pmServiceText(language, "Unable to start service. Check the checklist, equipment and assigned team, then retry.")}
        </p>}
        {params.result && messages[params.result] && <p role="status" className="mt-4 rounded-lg border bg-white p-4">
          {t(messages[params.result])}
        </p>}
        {equipmentResult.error && <p role="alert" className="mt-4 text-red-700">
          {t("Equipment could not be loaded. Please refresh.")}
        </p>}
        {(teamResult.error || staffResult.error) && <p role="alert" className="mt-4 text-red-700">
          {t("Team list could not be loaded. Please refresh.")}
        </p>}

        {canCreate ? (
          <details className="mt-6 rounded-xl border bg-white p-5">
            <summary className="cursor-pointer font-semibold text-blue-700">+ {t("Add schedule")}</summary>
            <PlanForm equipment={equipment} staff={staff} members={[]} t={t} />
          </details>
        ) : canManage && !equipmentResult.error && !staffResult.error ? (
          <p className="mt-5 rounded-lg bg-white p-4">{t("No active equipment or assignable staff are available.")}</p>
        ) : null}

        <nav className="mt-6 flex gap-3">
          {["active", "inactive"].map(item => (
            <Link key={item} href={`/preventive-maintenance?view=${item}`}
              aria-current={view === item ? "page" : undefined}
              className={`rounded-lg border px-4 py-2 font-semibold ${view === item ? "bg-blue-700 text-white" : "bg-white text-blue-700"}`}>
              {t(item === "active" ? "Active" : "Inactive")}
            </Link>
          ))}
        </nav>

        {plansResult.error ? <p role="alert" className="mt-5 text-red-700">
          {t("Schedules could not be loaded. Please refresh.")}
        </p> : (
          <>
            <p className="mt-5 text-sm text-slate-600">{t("Matching schedules")}: {plansResult.count ?? 0}</p>
            <div className="mt-4 space-y-4">
              {plans.map(plan => {
                const machine = machines.get(plan.machine_id);
                const team = members.filter(member => member.plan_id === plan.id);
                const due = !plan.is_active ? "Inactive"
                  : plan.next_due_date < today ? "Overdue"
                  : plan.next_due_date === today ? "Due today" : "Upcoming";
                return (
                  <article key={plan.id} className="rounded-xl border bg-white p-5">
                    <div className="flex flex-wrap justify-between gap-3">
                      <h2 className="text-lg font-bold">{plan.title}</h2>
                      <span className={`rounded-full px-3 py-1 text-sm font-semibold ${due === "Overdue" ? "bg-red-50 text-red-800" : due === "Due today" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-700"}`}>
                        {t(due)}
                      </span>
                    </div>
                    <p className="mt-2 font-medium">
                      {machine ? `${machine.machine_code} · ${machine.machine_name}` : t("Equipment unavailable")}
                    </p>
                    <p className="mt-2 text-sm">{t("Next due date — Malaysia date")}: {plan.next_due_date}</p>
                    <p className="mt-1 text-sm">{t("Interval (days)")}: {plan.interval_days}</p>
                    {plan.instructions && <p className="mt-3 whitespace-pre-wrap break-words">{plan.instructions}</p>}
                    <p className="mt-3 text-sm font-semibold">{t("Assigned team")}</p>
                    {teamResult.error ? <p className="mt-1 text-sm text-red-700">
                      {t("Team list could not be loaded. Please refresh.")}
                    </p> : (
                      <ul className="mt-2 space-y-1 text-sm">
                        {team.map(member => (
                          <li key={member.employee_id}>
                            {member.full_name} ({member.employee_number})
                            {member.employee_id === user.id && <span className="ml-2 text-blue-700">· {t("You are assigned")}</span>}
                            {(!member.is_active || member.must_change_password ||
                              !["maintenance_supervisor", "maintenance_technician"].includes(member.role)) && (
                              <span className="ml-2 text-amber-800">· {t("Unavailable for active assignment")}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    <PMServicePanel planId={plan.id}
                      active={plan.is_active} language={language}
                      canStart={canManage || (!teamResult.error && team.some(member =>
                        member.employee_id === user.id &&
                        ["maintenance_supervisor", "maintenance_technician"].includes(employee.role)
                      ))} />
                    <PMChecklist planId={plan.id} canManage={canManage}
                      language={language} page={page} view={view} />
                    {canManage && !equipmentResult.error && !staffResult.error && !teamResult.error && (
                      <details className="mt-4 border-t pt-4">
                        <summary className="cursor-pointer font-semibold text-blue-700">{t("Edit schedule")}</summary>
                        <PlanForm plan={plan} equipment={equipment} staff={staff} members={team} t={t} />
                      </details>
                    )}
                  </article>
                );
              })}
              {!plans.length && <p className="rounded-xl bg-white p-5">{t("No schedules in this view.")}</p>}
            </div>
            <nav className="mt-6 flex justify-between gap-4">
              {page > 1 ? <Link href={href(page - 1)} className="text-blue-700">← {t("Previous")}</Link> : <span />}
              <span>{t("Page")} {page} / {pages}</span>
              {page < pages ? <Link href={href(page + 1)} className="text-blue-700">{t("Next")} →</Link> : <span />}
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
