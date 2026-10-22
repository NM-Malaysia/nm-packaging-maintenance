import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

const tabs: Record<string, string> = {
  miv_pending: "MIV Pending",
  pending_clerk_check: "Pending Check",
  waiting: "Waiting / Purchase",
  available: "Available to Issue",
  issued: "Issued",
  cancelled: "Cancelled",
};

type Item = {
  id: string;
  request_id: string;
  part_code: string;
  part_name: string;
  quantity: number;
  status: string;
  source: string;
  needed_at: string;
  issued_at: string | null;
  miv_number: string;
  maintenance_requests: {
    mrf_number: string;
    machine_name: string;
    status: string;
  } | null;
};

async function saveMiv(formData: FormData) {
  "use server";

  const ids = [...new Set(formData.getAll("part_ids").map(String))];
  const miv = String(formData.get("miv_number") ?? "").trim();
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!ids.length || ids.length > 100 || ids.some((id) => !uuid.test(id))
      || !miv || miv.length > 100 || formData.get("confirmed") !== "yes") {
    redirect("/parts-followup?result=invalid");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase.rpc("add_parts_miv_batch", {
    p_ids: ids,
    p_miv: miv,
  });

  if (error) {
    console.error("Bulk MIV save failed:", error.message);
    redirect("/parts-followup?result=failed");
  }

  revalidatePath("/parts-followup");
  revalidatePath("/maintenance", "layout");
  revalidatePath("/");
  redirect(`/parts-followup?result=saved&count=${Number(data) || ids.length}`);
}

async function Content({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const params = await searchParams;
  const value = (key: string) => typeof params[key] === "string" ? params[key] as string : "";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: employee } = await supabase.from("employees")
    .select("role, is_active, must_change_password")
    .eq("id", user.id).maybeSingle();

  if (!employee?.is_active) redirect("/login?error=access_denied");
  if (employee.must_change_password) redirect("/change-password");
  if (!["admin", "maintenance_clerk"].includes(employee.role)) redirect("/");

  const tab = Object.hasOwn(tabs, value("tab")) ? value("tab") : "miv_pending";
  const search = value("q").slice(0, 100);
  const pageNumber = Math.max(1, Math.min(100000, Number.parseInt(value("page"), 10) || 1));
  const pageSize = 20;

  let query = supabase.from("mrf_parts_followups")
    .select("id, request_id, part_code, part_name, quantity, status, source, needed_at, issued_at, miv_number, maintenance_requests!inner(mrf_number, machine_name, status)", { count: "exact" });

  if (tab === "miv_pending") {
    query = query.eq("status", "issued").eq("miv_number", "");
  } else {
    query = query.eq("status", tab);
  }

  // Only letters, numbers, spaces and hyphens enter filter expressions.
  const safe = search.replace(/[^\p{L}\p{N}\s-]/gu, " ").trim();
  let searchError = false;

  if (safe) {
    const parents = await supabase.from("maintenance_requests")
      .select("id")
      .or(`mrf_number.ilike.%${safe}%,machine_name.ilike.%${safe}%`)
      .limit(1000);

    searchError = Boolean(parents.error);
    const ids = (parents.data ?? []).map((row) => row.id);
    const filters = [
      `part_code.ilike.%${safe}%`,
      `part_name.ilike.%${safe}%`,
      `miv_number.ilike.%${safe}%`,
    ];
    if (ids.length) filters.push(`request_id.in.(${ids.join(",")})`);
    query = query.or(filters.join(","));
  }

  const { data, error, count } = await query
    .order("needed_at", { ascending: true })
    .order("id", { ascending: true })
    .range((pageNumber - 1) * pageSize, pageNumber * pageSize - 1);

  const items = (data ?? []) as unknown as Item[];
  const pages = Math.max(1, Math.ceil((count ?? 0) / pageSize));
  const href = (next: number) => `/parts-followup?${new URLSearchParams({
    tab, q: search, page: String(next),
  })}`;
  const format = (date: string | null) => date
    ? new Date(date).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })
    : "Not recorded";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="font-medium text-blue-700">← Dashboard</Link>
        <h1 className="mt-4 text-2xl font-bold">Parts Follow-up &amp; MIV Records</h1>
        <p className="mt-2 text-slate-600">
          Parts across MRFs. All displayed times are Malaysia time.
          Open an MRF to update availability or issue details.
        </p>

        {value("result") && (
          <p role="status" className="mt-4 rounded-lg border bg-white p-4">
            {value("result") === "saved"
              ? `MIV saved for ${Number.parseInt(value("count"), 10) || 0} selected item(s).`
              : value("result") === "invalid"
              ? "Select items, enter an MIV number and tick the confirmation."
              : "MIV was not saved. A selected item may already have another MIV number. Refresh and check the records."}
          </p>
        )}

        <nav className="mt-6 flex flex-wrap gap-2" aria-label="Part status">
          {Object.entries(tabs).map(([key, label]) => (
            <Link key={key}
              href={`/parts-followup?${new URLSearchParams({ tab: key, q: search })}`}
              aria-current={tab === key ? "page" : undefined}
              className={`rounded-lg border px-4 py-3 font-semibold ${
                tab === key ? "border-blue-700 bg-blue-700 text-white"
                  : "border-slate-300 bg-white text-slate-800"}`}>
              {label}
            </Link>
          ))}
        </nav>

        <form className="mt-5 flex flex-wrap gap-3" method="get">
          <input type="hidden" name="tab" value={tab} />
          <label className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Search MRF, machine, part or MIV</span>
            <input name="q" maxLength={100} defaultValue={search}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-base text-slate-900" />
          </label>
          <button className="self-end rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white">
            Search
          </button>
          <Link href={`/parts-followup?tab=${tab}`} className="self-end px-3 py-3 text-blue-700">
            Reset
          </Link>
        </form>

        {error || searchError ? (
          <p role="alert" className="mt-5 text-red-700">
            Parts could not be loaded. Please refresh.
          </p>
        ) : (
          <>
            <p className="mt-5 text-sm text-slate-600">
              {count ?? 0} item(s) · Page {pageNumber} of {pages} · 20 per page
            </p>

            {tab === "miv_pending" && items.length > 0 && (
              <form id="bulk-miv" action={saveMiv}
                className="mt-4 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-5">
                <h2 className="font-semibold">One MIV for selected items</h2>
                <p className="text-sm">
                  Tick the items below, then enter their shared voucher number.
                  Selection applies to this page only.
                </p>
                <label className="block">
                  MIV number
                  <input name="miv_number" required maxLength={100}
                    className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-3 text-base text-slate-900 sm:max-w-md" />
                </label>
                <label className="flex items-start gap-3">
                  <input type="checkbox" name="confirmed" value="yes" required
                    className="mt-1 h-5 w-5" />
                  <span>I checked that all selected items belong to this MIV. The number locks after saving.</span>
                </label>
                <button className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white">
                  Save MIV for Selected Items
                </button>
              </form>
            )}

            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <article key={item.id} className="rounded-xl border bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    {tab === "miv_pending" && (
                      <input type="checkbox" name="part_ids" value={item.id}
                        form="bulk-miv" className="mt-1 h-5 w-5 shrink-0"
                        aria-label={`Select ${item.part_name}, MRF ${item.maintenance_requests?.mrf_number}`} />
                    )}
                    <div className="min-w-0 flex-1">
                      <Link href={`/maintenance/${item.request_id}`}
                        className="font-semibold text-blue-700 hover:underline">
                        MRF {item.maintenance_requests?.mrf_number} · {item.maintenance_requests?.machine_name} →
                      </Link>
                      <h2 className="mt-2 font-semibold">
                        {item.part_code || "Code not confirmed"} · {item.part_name}
                      </h2>
                      <p className="mt-1 text-sm">
                        Quantity: {item.quantity} · {item.status.replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Needed: {format(item.needed_at)}
                      </p>
                      {item.issued_at && (
                        <p className="mt-1 text-sm text-slate-600">
                          Issued: {format(item.issued_at)}
                        </p>
                      )}
                      <p className="mt-2 text-sm font-medium">
                        {item.miv_number ? `MIV: ${item.miv_number}`
                          : item.status === "issued" ? "MIV Pending" : "MIV not recorded"}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
              {!items.length && (
                <p className="rounded-xl bg-white p-5">No items found in this tab.</p>
              )}
            </div>

            <nav className="mt-6 flex justify-between" aria-label="Pagination">
              {pageNumber > 1
                ? <Link href={href(pageNumber - 1)} className="text-blue-700">← Previous</Link>
                : <span />}
              {pageNumber < pages && (
                <Link href={href(pageNumber + 1)} className="text-blue-700">Next →</Link>
              )}
            </nav>
          </>
        )}
      </div>
    </main>
  );
}

export default function PartsFollowupPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<p className="p-8 text-slate-900">Loading parts follow-up...</p>}>
      <Content {...props} />
    </Suspense>
  );
}
