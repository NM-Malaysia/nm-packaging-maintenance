import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { maintenanceResult } from "./maintenanceNavigation";

async function addMiv(formData: FormData) {
  "use server";

  const id = String(formData.get("part_id") ?? "");
  const miv = String(formData.get("miv_number") ?? "").trim();
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuid.test(id) || !miv || miv.length > 100) {
    redirect(maintenanceResult(formData, "parts_invalid"));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("add_issued_part_miv", {
    p_id: id,
    p_miv: miv,
  });

  if (error) {
    console.error("Add issued part MIV failed:", error.message);
    redirect(maintenanceResult(formData, "parts_failed"));
  }

  revalidatePath("/maintenance", "layout");
  revalidatePath("/");
  redirect(maintenanceResult(formData, "parts_saved"));
}

export default function IssuedPartMiv({
  partId, requestId,
}: { partId: string; requestId: string }) {
  return (
    <details className="mt-3 text-slate-900">
      <summary className="cursor-pointer font-semibold text-blue-700">
        Add MIV Number
      </summary>
      <form action={addMiv} className="mt-3 space-y-3">
        <input type="hidden" name="part_id" value={partId} />
        <input type="hidden" name="return_to"
          value={`/maintenance/${requestId}`} />
        <label className="block">
          MIV number
          <input name="miv_number" required maxLength={100}
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-3 text-base text-slate-900" />
        </label>
        <p className="text-sm text-slate-600">
          Several items may share this MIV number.
          Check the number before saving; it locks after recording.
        </p>
        <button type="submit"
          className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white">
          Save MIV Number
        </button>
      </form>
    </details>
  );
}
