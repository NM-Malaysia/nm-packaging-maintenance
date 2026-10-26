import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { Language } from "@/utils/language";
import { pmServiceText } from "@/utils/pmServiceTranslations";

async function start(form: FormData) {
  "use server";
  const plan = String(form.get("plan_id") ?? "");
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuid.test(plan)) redirect("/preventive-maintenance?start=failed");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await supabase.rpc("start_pm_service", { p_plan: plan });
  if (error || typeof data !== "string" || !uuid.test(data)) {
    console.error("Start PM service failed:", error?.message);
    redirect("/preventive-maintenance?start=failed");
  }
  revalidatePath("/preventive-maintenance");
  redirect("/preventive-maintenance/services/" + data);
}

export default async function PMServicePanel({ planId, active, canStart, language }: {
  planId: string; active: boolean; canStart: boolean; language: Language;
}) {
  const t = (text: string) => pmServiceText(language, text);
  const supabase = await createClient();
  const { data, error } = await supabase.from("pm_services")
    .select("id, status")
    .eq("plan_id", planId)
    .order("started_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(1).maybeSingle();
  if (error) return <p role="alert" className="mt-4 text-red-700">
    {t("Service records unavailable. Please refresh.")}
  </p>;
  return (
    <div className="mt-5 flex flex-wrap items-center gap-4">
      {data && <Link href={`/preventive-maintenance/services/${data.id}`}
        className="font-semibold text-blue-700 hover:underline">
        {t("View latest service")} →
      </Link>}
      {active && canStart && (!data || data.status === "completed") && (
        <form action={start}>
          <input type="hidden" name="plan_id" value={planId} />
          <button className="rounded-lg bg-green-700 px-4 py-3 font-semibold text-white">
            {t("Start PM Service")}
          </button>
        </form>
      )}
    </div>
  );
}
