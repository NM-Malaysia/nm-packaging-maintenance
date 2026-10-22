import Link from "next/link";
import IssuedPartMiv from "./IssuedPartMiv";
import PartStatusForm from "./PartStatusForm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { maintenanceResult } from "./maintenanceNavigation";

type Part = {
  id: string;
  part_code: string;
  part_name: string;
  quantity: number;
  source: string;
  status: string;
  needed_at: string;
  ordered_at: string | null;
  available_at: string | null;
  issued_at: string | null;
  miv_number: string;
  purchase_reference: string;
  defect_details: string;
  notes: string;
};

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const field = "mt-1 block min-w-0 w-full max-w-full rounded-lg border border-slate-300 bg-white p-3 text-base text-slate-900";
const openStatuses = [
  "hod_approved", "in_progress", "waiting_spare_parts", "follow_up_required",
];

function localTime(value: string | null | undefined) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

function displayTime(value: string | null) {
  return value
    ? new Date(value).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })
    : "Not recorded";
}


async function requestPart(formData: FormData) {
  "use server";

  const requestId = String(formData.get("request_id") ?? "");
  const code = String(formData.get("part_code") ?? "").trim();
  const name = String(formData.get("part_name") ?? "").trim();
  const quantity = String(formData.get("quantity") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!uuid.test(requestId) || code.length > 100
      || !name || name.length > 200
      || !/^\d{1,10}(\.\d{1,2})?$/.test(quantity)
      || Number(quantity) <= 0 || Number(quantity) >= 10000000000
      || !reason || reason.length > 5000) {
    redirect(maintenanceResult(formData, "parts_invalid"));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("request_mrf_part", {
    p_request: requestId,
    p_code: code,
    p_name: name,
    p_quantity: Number(quantity),
    p_reason: reason,
  });

  if (error) {
    console.error("Part request failed:", error.message);
    redirect(maintenanceResult(formData, "parts_failed"));
  }

  revalidatePath("/maintenance", "layout");
  revalidatePath("/");
  redirect(maintenanceResult(formData, "parts_requested"));
}

async function savePart(formData: FormData) {
  "use server";

  const requestId = String(formData.get("request_id") ?? "");
  const id = String(formData.get("part_id") ?? "");
  const code = String(formData.get("part_code") ?? "").trim();
  const name = String(formData.get("part_name") ?? "").trim();
  const quantity = String(formData.get("quantity") ?? "");
  const source = String(formData.get("source") ?? "");
  const status = String(formData.get("status") ?? "");
  const miv = String(formData.get("miv_number") ?? "").trim();
  const reference = String(formData.get("purchase_reference") ?? "").trim();
  const defect = String(formData.get("defect_details") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  const dateValue = (key: string) => String(formData.get(key) ?? "");
  const needed = dateValue("needed_at");
  const ordered = dateValue("ordered_at");
  const available = dateValue("available_at");
  const issued = dateValue("issued_at");
  const datePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
  const dates = [needed, ordered, available, issued];

  if (!uuid.test(requestId) || (id && !uuid.test(id))
      || !code || code.length > 100 || !name || name.length > 200
      || !/^\d{1,10}(\.\d{1,2})?$/.test(quantity)
      || Number(quantity) <= 0 || Number(quantity) >= 10000000000
      || !["store", "purchase"].includes(source)
      || !["waiting", "available", "issued", "cancelled"].includes(status)
      || !needed || dates.some((value) => value && !datePattern.test(value))
      || miv.length > 100 || reference.length > 200
      || defect.length > 5000 || notes.length > 5000
      || (source === "store" && (ordered || reference))
      || (status === "waiting" && (available || issued))
      || (status === "available" && (!available || issued))
      || (status === "issued" && (!available || !issued))
      || (status === "cancelled" && (issued || !notes))) {
    redirect(maintenanceResult(formData, "parts_invalid"));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const timestamp = (value: string) => value ? `${value}:00+08:00` : null;
  const { error } = await supabase.rpc("save_mrf_part_followup", {
    p_id: id || null,
    p_request: requestId,
    p_code: code,
    p_name: name,
    p_quantity: Number(quantity),
    p_source: source,
    p_status: status,
    p_needed_at: timestamp(needed),
    p_ordered_at: timestamp(ordered),
    p_available_at: timestamp(available),
    p_issued_at: timestamp(issued),
    p_miv: miv,
    p_purchase_reference: reference,
    p_defect: defect,
    p_notes: notes,
  });

  if (error) {
    console.error("Parts follow-up save failed:", error.message);
    redirect(maintenanceResult(formData, "parts_failed"));
  }

  revalidatePath("/maintenance", "layout");
  revalidatePath("/");
  redirect(maintenanceResult(formData, "parts_saved"));
}


function PartForm({ requestId, part }: { requestId: string; part?: Part }) {
  return (
    <PartStatusForm
      action={savePart}
      requestId={requestId}
      existing={Boolean(part)}
      initial={{
        part_id: part?.id ?? "",
        part_code: part?.part_code ?? "",
        part_name: part?.part_name ?? "",
        quantity: String(part?.quantity ?? 1),
        source: part?.source === "unconfirmed" ? "" : (part?.source ?? "store"),
        status: part?.status === "pending_clerk_check"
          ? "waiting" : (part?.status ?? "waiting"),
        needed_at: localTime(part?.needed_at),
        ordered_at: localTime(part?.ordered_at),
        available_at: localTime(part?.available_at),
        issued_at: localTime(part?.issued_at),
        miv_number: part?.miv_number ?? "",
        purchase_reference: part?.purchase_reference ?? "",
        defect_details: part?.defect_details ?? "",
        notes: part?.notes ?? "",
      }}
    />
  );
}

export default async function PartsFollowup({
  requestId, status,
}: { requestId: string; status: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: employee } = await supabase.from("employees")
    .select("role, is_active, must_change_password")
    .eq("id", user.id).maybeSingle();

  const canRecordMiv = Boolean(employee?.is_active
    && !employee.must_change_password
    && ["admin", "maintenance_clerk"].includes(employee.role));

  const canEdit = Boolean(employee?.is_active
    && !employee.must_change_password
    && ["admin", "maintenance_clerk"].includes(employee.role)
    && openStatuses.includes(status));


  let canRequest = false;
  let assignmentError = false;

  if (employee?.is_active && !employee.must_change_password
      && ["maintenance_technician", "maintenance_supervisor"].includes(employee.role)
      && ["in_progress", "waiting_spare_parts", "follow_up_required"].includes(status)) {
    const membership = await supabase.from("request_team_members")
      .select("id")
      .eq("request_id", requestId)
      .eq("employee_id", user.id)
      .maybeSingle();

    assignmentError = Boolean(membership.error);
    canRequest = !membership.error && Boolean(membership.data);
  }

  const { data, error } = await supabase.from("mrf_parts_followups")
    .select("id, part_code, part_name, quantity, source, status, needed_at, ordered_at, available_at, issued_at, miv_number, purchase_reference, defect_details, notes")
    .eq("request_id", requestId)
    .order("needed_at", { ascending: false });

  const parts = (data ?? []) as Part[];

  return (
    <section className="mt-5 border-t pt-5 text-slate-900">
      <h3 className="text-lg font-semibold">Parts Follow-up &amp; MIV Records</h3>
      {canRecordMiv && (
        <Link href="/parts-followup"
          className="mt-2 inline-block font-semibold text-blue-700 hover:underline">
          All MRFs · Parts Follow-up / MIV Pending →
        </Link>
      )}

      <p className="mt-1 text-sm text-slate-600">
        The clerk records part availability and issues against this MRF.
        Waiting time runs from Part needed to Available.
      </p>

      {error ? (
        <p role="alert" className="mt-3 text-red-700">
          Parts records could not be loaded. Please refresh.
        </p>
      ) : parts.length ? (
        <div className="mt-4 space-y-3">
          {parts.map((part) => (
            <article key={part.id} className="rounded-lg border bg-white p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <h4 className="font-semibold">{part.part_code || "Code not confirmed"} · {part.part_name}</h4>
                <span className="capitalize">{part.status.replaceAll("_", " ")}</span>
              </div>
              <p className="mt-2 text-sm">
                Quantity: {part.quantity} · {part.source === "store"
                  ? "Store on hand" : part.source === "purchase"
                    ? "Purchase required" : "Source awaiting clerk check"}
              </p>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                {([
                  ["Needed", part.needed_at], ["Ordered", part.ordered_at],
                  ["Available", part.available_at], ["Issued", part.issued_at],
                ] as const).map(([label, value]) => (
                  <div key={label}><dt className="text-slate-500">{label}</dt>
                    <dd>{displayTime(value)}{value ? " (Malaysia time)" : ""}</dd>
                  </div>
                ))}
              </dl>
              {part.available_at && (
                <p className="mt-2 text-sm">
                  Recorded wait: {Math.max(0, Math.round(
                    (Date.parse(part.available_at) - Date.parse(part.needed_at)) / 60000
                  ))} minutes
                </p>
              )}
              {part.miv_number && <p className="mt-2 text-sm">MIV: {part.miv_number}</p>}
              {part.purchase_reference && (
                <p className="mt-2 text-sm">Purchase reference: {part.purchase_reference}</p>
              )}
              {part.defect_details && (
                <p className="mt-2 whitespace-pre-wrap">Defect / reason: {part.defect_details}</p>
              )}
              {part.notes && <p className="mt-2 whitespace-pre-wrap">{part.notes}</p>}
              {part.status === "issued" && !part.miv_number.trim() && (
                <div className="mt-3 rounded-lg bg-amber-50 p-4">
                  <p className="font-semibold text-amber-900">MIV Pending</p>
                  {canRecordMiv && (
                    <IssuedPartMiv partId={part.id} requestId={requestId} />
                  )}
                </div>
              )}
              {canEdit && !["issued", "cancelled"].includes(part.status) && (
                <details className="mt-3">
                  <summary className="cursor-pointer font-medium text-blue-700">
                    Update part record
                  </summary>
                  <PartForm requestId={requestId} part={part} />
                </details>
              )}
            </article>
          ))}
        </div>
      ) : <p className="mt-3 text-sm text-slate-600">No parts recorded for this MRF.</p>}


      {assignmentError && (
        <p role="alert" className="mt-3 text-red-700">
          Your assignment could not be checked. Please refresh.
        </p>
      )}

      {canRequest && !error && (
        <details className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <summary className="cursor-pointer font-semibold text-blue-700">
            + Request Part
          </summary>
          <p className="mt-3 text-sm text-slate-600">
            Send the part requirement to the maintenance clerk for checking.
            Enter the part code only if known.
          </p>
          <form action={requestPart} className="mt-4 space-y-4">
            <input type="hidden" name="request_id" value={requestId} />
            <input type="hidden" name="return_to"
              value={`/maintenance/${requestId}`} />

            <label className="block">
              Part name / description
              <input name="part_name" required maxLength={200}
                placeholder="For example: Fuji8 control circuit board"
                className={field} />
            </label>
            <label className="block">
              Part code — optional
              <input name="part_code" maxLength={100} className={field} />
            </label>
            <label className="block">
              Quantity required
              <input name="quantity" type="number" required min="0.01"
                max="9999999999.99" step="0.01" defaultValue={1}
                className={field} />
            </label>
            <label className="block">
              Defect / reason for replacement
              <textarea name="reason" required maxLength={5000} rows={3}
                className={field} />
            </label>
            <p className="text-sm text-slate-600">
              The request starts as Pending Clerk Check.
              The clerk records availability, purchase follow-up and MIV details.
              This does not change the overall MRF status.
            </p>
            <button type="submit"
              className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white">
              Submit Part Request
            </button>
          </form>
        </details>
      )}

      {canEdit && !error && (
        <details className="mt-4 rounded-lg border bg-slate-50 p-4">
          <summary className="cursor-pointer font-semibold text-blue-700">
            + Add Part / MIV Record
          </summary>
          <PartForm requestId={requestId} />
        </details>
      )}
    </section>
  );
}
