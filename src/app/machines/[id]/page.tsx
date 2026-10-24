import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import DashboardNavigation from "../../DashboardNavigation";
import { createClient } from "@/utils/supabase/server";
import { getMyLanguage } from "@/utils/language";
import { dashboardText } from "@/utils/dashboardTranslations";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
};

const words: Record<string, [string, string, string]> = {
  "Equipment maintenance history": [
    "Sejarah penyelenggaraan peralatan", "设备维修历史", "उपकरण मर्मत इतिहास"
  ],
  "Back to Machine Register": [
    "Kembali ke Daftar Mesin", "返回设备档案", "मेसिन दर्तामा फर्कनुहोस्"
  ],
  "Equipment unavailable or access denied.": [
    "Peralatan tidak tersedia atau akses ditolak.", "设备不可用或无查看权限。", "उपकरण उपलब्ध छैन वा पहुँच अनुमति छैन।"
  ],
  "History could not be loaded. Please refresh.": [
    "Sejarah tidak dapat dimuatkan. Sila muat semula.", "无法加载历史记录。请刷新。", "इतिहास लोड भएन। कृपया रिफ्रेस गर्नुहोस्।"
  ],
  "Only linked MRFs visible under your account permissions are shown.": [
    "Hanya MRF terpaut yang boleh dilihat mengikut kebenaran akaun anda dipaparkan.",
    "仅显示与此设备关联且在您账户权限内的 MRF。",
    "तपाईंको खाताको अनुमतिअनुसार देखिने सम्बन्धित MRF मात्र देखाइन्छ।"
  ],
  "Older requests without an equipment link are not included.": [
    "Permohonan lama tanpa pautan peralatan tidak disertakan.",
    "未关联设备的旧申请不包含在内。",
    "उपकरणसँग नजोडिएका पुराना अनुरोध समावेश हुँदैनन्।"
  ],
  "Linked MRFs": ["MRF terpaut", "关联 MRF", "सम्बन्धित MRF"],
  "No linked MRFs are available.": [
    "Tiada MRF terpaut tersedia.", "暂无可查看的关联 MRF。", "सम्बन्धित MRF उपलब्ध छैनन्।"
  ],
  "Location": ["Lokasi", "位置", "स्थान"],
  "Work requested": ["Kerja dimohon", "申请工作内容", "अनुरोध गरिएको काम"],
  "Repair summary": ["Ringkasan pembaikan", "维修总结", "मर्मत सारांश"],
  "Repair summary unavailable.": [
    "Ringkasan pembaikan tidak tersedia.", "维修总结暂不可用。", "मर्मत सारांश उपलब्ध छैन।"
  ],
  "Submitted": ["Dihantar", "提交时间", "पठाइएको"],
  "Malaysia time": ["Waktu Malaysia", "马来西亚时间", "मलेसिया समय"],
  "Recorded downtime (minutes)": [
    "Masa henti direkodkan (minit)", "已记录停机时间（分钟）", "अभिलेख गरिएको बन्द समय (मिनेट)"
  ],
  "Downtime has not ended or dates are incomplete.": [
    "Masa henti belum tamat atau tarikh tidak lengkap.",
    "停机尚未结束或日期记录不完整。",
    "बन्द समय समाप्त भएको छैन वा मिति अपूर्ण छन्।"
  ],
  "View MRF details": ["Lihat butiran MRF", "查看 MRF 详情", "MRF विवरण हेर्नुहोस्"],
  "Previous": ["Sebelumnya", "上一页", "अघिल्लो"],
  "Next": ["Seterusnya", "下一页", "अर्को"],
  "Page": ["Halaman", "页", "पृष्ठ"],
};

async function Content({ params, searchParams }: Props) {
  await connection();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuid.test(id)) redirect("/machines");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("full_name, role, is_active, must_change_password")
    .eq("id", user.id).maybeSingle();
  if (employeeError || !employee?.is_active) redirect("/login?error=access_denied");
  if (employee.must_change_password) redirect("/change-password");
  if (!["admin", "maintenance_supervisor", "maintenance_technician",
        "maintenance_clerk"].includes(employee.role)) redirect("/machines");

  const language = await getMyLanguage();
  const index = { ms: 0, zh: 1, ne: 2 };
  const t = (text: string) => language === "en" ? text
    : words[text]?.[index[language]] ?? dashboardText(language, text);
  const number = Number(query.page);
  const page = Number.isSafeInteger(number) && number > 0 && number <= 100000
    ? number : 1;

  const { data: machine, error: machineError } = await supabase
    .from("machines")
    .select("id, machine_code, machine_name, location")
    .eq("id", id).maybeSingle();

  if (machineError || !machine) {
    return (
      <main className="min-h-screen bg-slate-100 text-slate-900">
        <DashboardNavigation name={employee.full_name} role={employee.role} />
        <div className="mx-auto max-w-6xl p-6">
          <Link href="/machines" className="text-blue-700 underline">
            ← {t("Back to Machine Register")}
          </Link>
          <p role="alert" className="mt-5">{t("Equipment unavailable or access denied.")}</p>
        </div>
      </main>
    );
  }

  const result = await supabase.from("maintenance_requests")
    .select("id, mrf_number, machine_name, description, status, submitted_at, work_location, downtime_applicable, downtime_started_at, downtime_ended_at",
      { count: "exact" })
    .eq("machine_id", id)
    .order("submitted_at", { ascending: false })
    .order("id", { ascending: false })
    .range((page - 1) * 20, page * 20 - 1);

  const pages = Math.max(1, Math.ceil((result.count ?? 0) / 20));
  if (!result.error && page > pages) redirect(`/machines/${id}?page=${pages}`);

  const requests = result.error ? [] : result.data ?? [];
  const repairs = requests.length
    ? await supabase.from("repair_records")
        .select("request_id, repair_summary")
        .in("request_id", requests.map(item => item.id))
    : { data: [], error: null };
  const summaries = new Map((repairs.data ?? []).map(item =>
    [item.request_id, item.repair_summary]
  ));

  const time = (value: string) => new Date(value).toLocaleString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
  });

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <DashboardNavigation name={employee.full_name} role={employee.role} />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link href="/machines" className="text-blue-700 hover:underline">
          ← {t("Back to Machine Register")}
        </Link>
        <h1 className="mt-5 text-2xl font-bold">{t("Equipment maintenance history")}</h1>
        <h2 className="mt-3 text-xl font-semibold">
          {machine.machine_code} · {machine.machine_name}
        </h2>
        {machine.location && <p className="mt-2">
          {t("Location")}: {machine.location}
        </p>}
        <p className="mt-3 text-sm text-slate-600">
          {t("Only linked MRFs visible under your account permissions are shown.")}
          {" "}{t("Older requests without an equipment link are not included.")}
        </p>

        {result.error ? (
          <p role="alert" className="mt-6 rounded-lg bg-white p-5 text-red-700">
            {t("History could not be loaded. Please refresh.")}
          </p>
        ) : (
          <>
            <p className="mt-5 font-semibold">{t("Linked MRFs")}: {result.count ?? 0}</p>
            <div className="mt-4 space-y-4">
              {requests.map(request => {
                const start = Date.parse(request.downtime_started_at ?? "");
                const end = Date.parse(request.downtime_ended_at ?? "");
                const minutes = Number.isFinite(start) && Number.isFinite(end)
                  && end >= start ? Math.ceil((end - start) / 60000) : null;
                return (
                  <article key={request.id} className="rounded-xl border bg-white p-5">
                    <div className="flex flex-wrap justify-between gap-3">
                      <h3 className="font-bold">
                        MRF {request.mrf_number} · {request.machine_name}
                      </h3>
                      <span className="text-sm text-blue-800">
                        {t(request.status.replaceAll("_", " "))}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {t("Submitted")}: {time(request.submitted_at)} ({t("Malaysia time")})
                    </p>
                    {request.work_location && <p className="mt-2 text-sm">
                      {t("Location")}: {request.work_location}
                    </p>}
                    <h4 className="mt-4 text-sm font-semibold">{t("Work requested")}</h4>
                    <p className="mt-1 whitespace-pre-wrap break-words">{request.description}</p>
                    {repairs.error ? (
                      <p className="mt-3 text-sm text-amber-800">{t("Repair summary unavailable.")}</p>
                    ) : summaries.get(request.id) ? (
                      <>
                        <h4 className="mt-4 text-sm font-semibold">{t("Repair summary")}</h4>
                        <p className="mt-1 whitespace-pre-wrap break-words">{summaries.get(request.id)}</p>
                      </>
                    ) : null}
                    {request.downtime_applicable && (
                      <p className="mt-3 text-sm text-slate-600">
                        {minutes === null
                          ? t("Downtime has not ended or dates are incomplete.")
                          : `${t("Recorded downtime (minutes)")}: ${minutes}`}
                      </p>
                    )}
                    <Link href={`/maintenance/${request.id}`}
                      className="mt-4 inline-block font-semibold text-blue-700 hover:underline">
                      {t("View MRF details")} →
                    </Link>
                  </article>
                );
              })}
              {!requests.length && <p className="rounded-xl bg-white p-5">
                {t("No linked MRFs are available.")}
              </p>}
            </div>
            <nav aria-label={t("Page")} className="mt-6 flex justify-between gap-4">
              {page > 1 ? <Link href={`/machines/${id}?page=${page - 1}`}
                className="text-blue-700">← {t("Previous")}</Link> : <span />}
              <span>{t("Page")} {page} / {pages}</span>
              {page < pages ? <Link href={`/machines/${id}?page=${page + 1}`}
                className="text-blue-700">{t("Next")} →</Link> : <span />}
            </nav>
          </>
        )}
      </div>
    </main>
  );
}

export default function Page(props: Props) {
  return (
    <Suspense fallback={<p className="p-8">Loading...</p>}>
      <Content {...props} />
    </Suspense>
  );
}
