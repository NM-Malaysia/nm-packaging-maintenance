import DashboardNavigation from "../../DashboardNavigation";
import { getMyLanguage } from "@/utils/language";
import { newRequestText } from "@/utils/newRequestTranslations";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import RequestForm from "./RequestForm";

async function NewRequest() {
  await connection();
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  const { data: employee, error: employeeError } = await supabase.from("employees")
    .select("full_name, role, is_active, must_change_password, department_id")
    .eq("id", user.id).maybeSingle();
  if (employeeError || !employee || !employee.is_active) redirect("/login?error=access_denied");
  if (employee.must_change_password) redirect("/change-password");
  const language = await getMyLanguage();
  const t = (text: string) => newRequestText(language, text);
  const allowed = ["requestor", "department_hod"].includes(employee.role);
  const { data: department, error: departmentError } = allowed
    ? await supabase.from("departments").select("name").eq("id", employee.department_id).maybeSingle()
    : { data: null, error: null };
  const equipmentResult = allowed
    ? await supabase.from("machines")
        .select("id, machine_code, machine_name, location")
        .eq("is_active", true)
        .order("machine_code")
    : { data: [], error: null };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <DashboardNavigation name={employee.full_name} role={employee.role} />
      <div className="px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-medium text-blue-700 underline">{t("← Back to dashboard")}</Link>
        <p className="mt-6 text-sm font-semibold text-slate-600">NM PACKAGING (M) SDN. BHD.</p>
        <h1 className="mt-2 text-3xl font-bold">{t("New Maintenance Request")}</h1>
        <p className="mb-6 mt-2 text-slate-600">{t("Maintenance / repair / modification request form")}</p>
        {!allowed ? <p role="alert" className="rounded-xl bg-white p-6">{t("Only Requestors and Department HODs can submit MRFs under the current company permissions.")}</p>
          : departmentError || !department ? <p role="alert" className="rounded-xl bg-white p-6">{t("Unable to load your department. Contact your administrator.")}</p>
          : <RequestForm name={employee.full_name} department={department.name} language={language}
              machines={equipmentResult.data ?? []}
              equipmentError={Boolean(equipmentResult.error)} />}
      </div>
      </div>
    </main>
  );
}

export default function NewRequestPage() {
  return <Suspense fallback={<main className="p-8">Loading request form…</main>}><NewRequest /></Suspense>;
}
