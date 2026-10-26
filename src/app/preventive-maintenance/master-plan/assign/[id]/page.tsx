import { Suspense } from "react";
import PMMrf from "./PMMrf";
import Link from "next/link";
import { connection } from "next/server";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import DashboardNavigation from "../../../../DashboardNavigation";
import { createClient } from "@/utils/supabase/server";
import { getMyLanguage } from "@/utils/language";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; result?: string; mrf_result?: string }>;
};
type Person = { id: string; employee_id: string; full_name: string };
const root = "/preventive-maintenance/master-plan";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const words: Record<string, [string, string, string]> = {
  "Back to Master Plan": ["Kembali ke Pelan Induk", "返回总计划", "मुख्य योजनामा फर्कनुहोस्"],
  "PM assignment": ["Penugasan PM", "保养人员分配", "PM जिम्मेवारी"],
  "Planned date": ["Tarikh dirancang", "计划日期", "योजनाबद्ध मिति"],
  "Assigned team": ["Pasukan ditugaskan", "负责团队", "तोकिएको टोली"],
  "Not assigned": ["Belum ditugaskan", "尚未分配", "तोकिएको छैन"],
  "Select technicians or supervisors": ["Pilih juruteknik atau penyelia", "选择技术员或主管", "प्राविधिक वा सुपरभाइजर छान्नुहोस्"],
  "Reason for assignment or change": ["Sebab penugasan atau perubahan", "分配或更改原因", "जिम्मेवारी वा परिवर्तनको कारण"],
  "Save assignment": ["Simpan penugasan", "保存人员分配", "जिम्मेवारी सुरक्षित गर्नुहोस्"],
  "Assignment saved.": ["Penugasan disimpan.", "人员分配已保存。", "जिम्मेवारी सुरक्षित भयो।"],
  "Assignment was not saved. Refresh and check the team before retrying.": [
    "Penugasan tidak disimpan. Muat semula dan semak pasukan sebelum cuba lagi.",
    "人员分配未保存。请刷新并检查团队后重试。",
    "जिम्मेवारी सुरक्षित भएन। रिफ्रेस गरेर टोली जाँच्नुहोस् र फेरि प्रयास गर्नुहोस्।"
  ],
  "Team details could not be loaded. Please refresh.": [
    "Butiran pasukan tidak dapat dimuatkan. Sila muat semula.",
    "无法加载团队资料。请刷新。",
    "टोली विवरण लोड भएन। कृपया रिफ्रेस गर्नुहोस्।"
  ],
  "No active technicians or supervisors available.": [
    "Tiada juruteknik atau penyelia aktif tersedia.",
    "暂无可分配的技术员或主管。",
    "सक्रिय प्राविधिक वा सुपरभाइजर उपलब्ध छैनन्।"
  ],
  "Uncheck everyone to remove the assignment. The planned date stays unchanged.": [
    "Nyahpilih semua untuk membuang penugasan. Tarikh dirancang tidak berubah.",
    "取消勾选所有人可清除分配。计划日期保持不变。",
    "जिम्मेवारी हटाउन सबैको चिन्ह हटाउनुहोस्। योजनाबद्ध मिति परिवर्तन हुँदैन।"
  ],
  "This planned date was cancelled.": [
    "Tarikh dirancang ini telah dibatalkan.", "此计划日期已取消。", "यो योजनाबद्ध मिति रद्द गरिएको छ।"
  ],
  "This occurrence has a service record. Team changes must be handled through service execution.": [
    "Tarikh ini mempunyai rekod servis. Perubahan pasukan perlu dibuat melalui pelaksanaan servis.",
    "此计划已有保养执行记录。人员变更需通过执行记录处理。",
    "यस मितिको सेवा अभिलेख छ। टोली परिवर्तन सेवा कार्यान्वयनबाट गर्नुपर्छ।"
  ],
  "Assignment history": ["Sejarah penugasan", "人员分配历史", "जिम्मेवारी इतिहास"],
  "No assignment changes recorded.": [
    "Tiada perubahan penugasan direkodkan.", "暂无人员分配变更记录。", "जिम्मेवारी परिवर्तन अभिलेख छैन।"
  ],
  "Latest 10 changes · Malaysia time": [
    "10 perubahan terkini · Waktu Malaysia", "最近 10 次变更 · 马来西亚时间", "पछिल्ला १० परिवर्तन · मलेसिया समय"
  ],
  "History could not be loaded.": [
    "Sejarah tidak dapat dimuatkan.", "无法加载历史记录。", "इतिहास लोड भएन।"
  ]
};
function pageNumber(value: unknown) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 && n <= 100000 ? n : 1;
}

async function saveAssignment(form: FormData) {
  "use server";
  const id = String(form.get("occurrence_id") ?? "");
  if (!uuid.test(id)) redirect(root);
  const page = pageNumber(form.get("page"));
  const destination = (result: string) =>
    `${root}/assign/${id}?page=${page}&result=${result}`;
  const rawRevision = String(form.get("revision") ?? "");
  const revision = Number(rawRevision);
  const members = form.getAll("member_ids").map(String);
  const reason = String(form.get("reason") ?? "").trim();
  if (!rawRevision || !Number.isSafeInteger(revision) || revision < 0
      || members.length > 20 || new Set(members).size !== members.length
      || members.some(member => !uuid.test(member))
      || !reason || reason.length > 1000) {
    redirect(destination("failed"));
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { error } = await supabase.rpc("assign_pm_annual_occurrence", {
    p_occurrence: id,
    p_members: members,
    p_expected_revision: revision,
    p_reason: reason,
  });
  if (error) {
    console.error("Annual PM assignment failed:", error.message);
    redirect(destination("failed"));
  }
  revalidatePath(root, "layout");
  redirect(destination("saved"));
}

async function Content({ params, searchParams }: Props) {
  await connection();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!uuid.test(id)) notFound();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: employee, error } = await supabase.from("employees")
    .select("full_name,role,is_active,must_change_password")
    .eq("id", user.id).maybeSingle();
  if (error || !employee?.is_active) redirect("/login?error=access_denied");
  if (employee.must_change_password) redirect("/change-password");
  if (!["admin", "maintenance_supervisor", "maintenance_technician",
    "maintenance_clerk"].includes(employee.role)) redirect("/");
  const canManage = ["admin", "maintenance_supervisor"].includes(employee.role);
  const language = await getMyLanguage();
  const index = { ms: 0, zh: 1, ne: 2 };
  const t = (text: string) =>
    language === "en" ? text : words[text]?.[index[language]] ?? text;
  const page = pageNumber(query.page);

  const occurrenceResult = await supabase.from("pm_annual_occurrences")
    .select("id,activity_id,planned_date,is_cancelled,service_id,assignment_revision")
    .eq("id", id).maybeSingle();
  if (occurrenceResult.error) throw new Error("Unable to load planned PM date.");
  if (!occurrenceResult.data) notFound();
  const occurrence = occurrenceResult.data;
  const activityResult = await supabase.from("pm_annual_activities")
    .select("title,machine_id,annual_plan_id,is_removed")
    .eq("id", occurrence.activity_id).single();
  if (activityResult.error) throw new Error("Unable to load PM activity.");
  const activity = activityResult.data;

  const [planResult, assetResult, membersResult, staffResult, historyResult] =
    await Promise.all([
      supabase.from("pm_annual_plans").select("plan_year")
        .eq("id", activity.annual_plan_id).single(),
      supabase.from("machines").select("machine_code,machine_name")
        .eq("id", activity.machine_id).maybeSingle(),
      supabase.from("pm_annual_occurrence_members")
        .select("employee_id,employee_number,full_name")
        .eq("occurrence_id", id).order("employee_number"),
      canManage
        ? supabase.rpc("list_assignable_maintenance_staff")
        : Promise.resolve({ data: [], error: null }),
      supabase.from("pm_annual_assignment_changes")
        .select("id,reason,recorded_at,previous_members,new_members")
        .eq("occurrence_id", id).order("revision", { ascending: false }).limit(10),
    ]);
  if (planResult.error) throw new Error("Unable to load annual PM plan.");
  const back = `${root}?year=${planResult.data.plan_year}&page=${page}`;
  const members = membersResult.data ?? [];
  const selected = new Set(members.map(member => member.employee_id));
  const staff: Person[] = staffResult.data ?? [];
  const teamError = Boolean(membersResult.error || staffResult.error);
  const locked = occurrence.is_cancelled || activity.is_removed || Boolean(occurrence.service_id);
  const memberNames = (value: unknown) => {
    if (!Array.isArray(value)) return t("Not assigned");
    return value.map(item => {
      if (!item || typeof item !== "object") return "";
      return `${String(item.full_name ?? "")} (${String(item.employee_number ?? "")})`;
    }).filter(Boolean).join(", ") || t("Not assigned");
  };
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <DashboardNavigation name={employee.full_name} role={employee.role} />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link href={back} className="text-blue-700 underline">← {t("Back to Master Plan")}</Link>
        <h1 className="mt-5 text-2xl font-bold">
          {{
            en: "Planned PM details",
            ms: "Butiran PM dirancang",
            zh: "计划保养详情",
            ne: "योजनाबद्ध PM विवरण"
          }[language]}
        </h1>
        <h2 className="mt-3 text-xl font-semibold">{activity.title}</h2>
        {assetResult.data && <p className="mt-2">
          {assetResult.data.machine_code} · {assetResult.data.machine_name}
        </p>}
        <p className="mt-2 font-medium">{t("Planned date")}: {occurrence.planned_date}</p>
        {query.result && <p role="status" className="mt-4 rounded-lg border bg-white p-4">
          {t(query.result === "saved" ? "Assignment saved."
            : "Assignment was not saved. Refresh and check the team before retrying.")}
        </p>}
        <PMMrf occurrenceId={id} page={page} language={language}
          role={employee.role} result={query.mrf_result}
          unavailable={occurrence.is_cancelled || activity.is_removed || Boolean(occurrence.service_id)} />
        <section className="mt-5 rounded-xl border bg-white p-5">
          <h2 className="font-semibold">
            {{
              en: "Previous planning assignments — history only",
              ms: "Penugasan perancangan terdahulu — sejarah sahaja",
              zh: "先前计划人员分配 — 仅供历史查询",
              ne: "अघिल्ला योजना जिम्मेवारी — इतिहास मात्र"
            }[language]}
          </h2>
          <p className="mt-2 text-sm text-slate-600">{t("Latest 10 changes · Malaysia time")}</p>
          {historyResult.error ? <p role="alert" className="mt-3 text-red-700">
            {t("History could not be loaded.")}
          </p> : <div className="mt-3 space-y-3">
            {(historyResult.data ?? []).map(entry => <article key={entry.id}
              className="rounded-lg border bg-slate-50 p-4">
              <p className="break-words">{memberNames(entry.previous_members)}
                {" → "}{memberNames(entry.new_members)}</p>
              <p className="mt-2 whitespace-pre-wrap break-words">{entry.reason}</p>
              <p className="mt-2 text-sm text-slate-600">
                {new Date(entry.recorded_at).toLocaleString(
                  language === "en" ? "en-MY" : language,
                  { timeZone: "Asia/Kuala_Lumpur" }
                )}
              </p>
            </article>)}
            {!historyResult.data?.length && <p>{t("No assignment changes recorded.")}</p>}
          </div>}
        </section>
      </div>
    </main>
  );
}
export default function Page(props: Props) {
  return <Suspense fallback={<p className="p-8">Loading...</p>}>
    <Content {...props} />
  </Suspense>;
}
