import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  languages,
  isLanguage,
  navigationText,
  type Language,
} from "@/utils/language";

async function saveLanguage(formData: FormData) {
  "use server";

  const language = String(formData.get("language_code") ?? "");
  if (!isLanguage(language)) throw new Error("Unsupported language.");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("set_my_language", {
    p_language: language,
  });

  if (error) {
    throw new Error("Language could not be saved. Please try again.");
  }

  revalidatePath("/", "layout");
}

export default function LanguageSelector({
  language,
}: {
  language: Language;
}) {
  const text = navigationText(language);

  return (
    <form action={saveLanguage}
      className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-2">
        <span>{text.language}</span>
        <select name="language_code" defaultValue={language}
          className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900">
          {Object.entries(languages).map(([code, label]) => (
            <option key={code} value={code} lang={code}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit"
        className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 hover:bg-slate-100">
        {text.apply}
      </button>
    </form>
  );
}
