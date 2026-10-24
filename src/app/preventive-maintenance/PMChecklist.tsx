import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { Language } from "@/utils/language";

const words: Record<string, [string, string, string]> = {
  "Service checklist": ["Senarai semak servis", "保养检查清单", "सेवा जाँचसूची"],
  "No checklist has been set up yet.": [
    "Senarai semak belum ditetapkan.", "尚未设置检查清单。", "जाँचसूची अझै तयार गरिएको छैन।"
  ],
  "Add checklist": ["Tambah senarai semak", "添加检查清单", "जाँचसूची थप्नुहोस्"],
  "Edit checklist": ["Sunting senarai semak", "编辑检查清单", "जाँचसूची सम्पादन गर्नुहोस्"],
  "Checklist items": ["Item senarai semak", "检查项目", "जाँच बुँदाहरू"],
  "Enter one item per line. Up to 100 items, 500 characters each.": [
    "Masukkan satu item setiap baris. Maksimum 100 item, 500 aksara setiap item.",
    "每行输入一个项目。最多 100 项，每项最多 500 个字符。",
    "प्रत्येक पङ्क्तिमा एउटा बुँदा लेख्नुहोस्। बढीमा १०० बुँदा, प्रत्येक ५०० अक्षर।"
  ],
  "Save checklist": ["Simpan senarai semak", "保存检查清单", "जाँचसूची सुरक्षित गर्नुहोस्"],
  "Version": ["Versi", "版本", "संस्करण"],
  "Checklist could not be loaded. Please refresh.": [
    "Senarai semak tidak dapat dimuatkan. Sila muat semula.",
    "无法加载检查清单，请刷新。",
    "जाँचसूची लोड भएन। कृपया रिफ्रेस गर्नुहोस्।"
  ],
  "Changes create a new version. Previous versions are retained.": [
    "Perubahan mencipta versi baharu. Versi terdahulu dikekalkan.",
    "修改后将创建新版本，之前的版本会保留。",
    "परिवर्तनले नयाँ संस्करण बनाउँछ। अघिल्ला संस्करण सुरक्षित रहन्छन्।"
  ],
};

async function saveChecklist(form: FormData) {
  "use server";
  const plan = String(form.get("plan_id") ?? "");
  const text = String(form.get("items") ?? "");
  const view = form.get("view") === "inactive" ? "inactive" : "active";
  const number = Number(form.get("page"));
  const page = Number.isSafeInteger(number) && number > 0 && number <= 100000
    ? number : 1;
  const destination = (result: string) =>
    "/preventive-maintenance?" + new URLSearchParams({
      view, page: String(page), result,
    });
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const items = text.split(/\r?\n/).map(item => item.trim()).filter(Boolean);
  const length = (value: string) => Array.from(value).length;

  if (!uuid.test(plan) || text.length > 100000
      || items.length < 1 || items.length > 100
      || items.some(item => length(item) > 500)) {
    redirect(destination("checklist_invalid"));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { error } = await supabase.rpc("save_pm_checklist", {
    p_plan: plan,
    p_items: items,
  });
  if (error) {
    console.error("PM checklist save failed:", error.message);
    redirect(destination("checklist_failed"));
  }

  revalidatePath("/preventive-maintenance");
  redirect(destination("checklist_saved"));
}

export default async function PMChecklist({
  planId, canManage, language, page, view,
}: {
  planId: string;
  canManage: boolean;
  language: Language;
  page: number;
  view: string;
}) {
  const index = { ms: 0, zh: 1, ne: 2 };
  const t = (text: string) => language === "en"
    ? text : words[text]?.[index[language]] ?? text;
  const supabase = await createClient();
  const { data, error } = await supabase.from("pm_checklist_versions")
    .select("id, version, items")
    .eq("plan_id", planId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return <p role="alert" className="mt-4 text-sm text-red-700">
      {t("Checklist could not be loaded. Please refresh.")}
    </p>;
  }

  const items: string[] = data?.items ?? [];
  return (
    <section className="mt-5 border-t pt-4">
      <h3 className="font-semibold">{t("Service checklist")}</h3>
      {data ? (
        <>
          <p className="mt-1 text-xs text-slate-500">
            {t("Version")} {data.version}
          </p>
          <ol className="mt-3 list-decimal space-y-2 pl-6">
            {items.map((item, position) => (
              <li key={position} className="whitespace-pre-wrap break-words">{item}</li>
            ))}
          </ol>
        </>
      ) : (
        <p className="mt-2 text-sm text-slate-600">
          {t("No checklist has been set up yet.")}
        </p>
      )}

      {canManage && (
        <details className="mt-4">
          <summary className="cursor-pointer font-semibold text-blue-700">
            {t(data ? "Edit checklist" : "Add checklist")}
          </summary>
          <form action={saveChecklist} className="mt-3 space-y-3">
            <input type="hidden" name="plan_id" value={planId} />
            <input type="hidden" name="page" value={page} />
            <input type="hidden" name="view" value={view} />
            <label className="block font-medium">
              {t("Checklist items")} *
              <textarea name="items" required rows={7} maxLength={100000}
                defaultValue={items.join("\n")}
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white p-3 text-base text-slate-900" />
            </label>
            <p className="text-sm text-slate-600">
              {t("Enter one item per line. Up to 100 items, 500 characters each.")}
            </p>
            <p className="text-sm text-slate-600">
              {t("Changes create a new version. Previous versions are retained.")}
            </p>
            <button className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white">
              {t("Save checklist")}
            </button>
          </form>
        </details>
      )}
    </section>
  );
}
