import Link from "next/link";
import { revalidatePath } from "next/cache";
import { maintenanceBack } from "./maintenanceNavigation";

const priorityLabels: Record<string, string> = {
  "1": "Urgent", "2": "High", "3": "Normal", "4": "Low",
};

const sortLabels: Record<string, string> = {
  oldest: "Oldest submitted first",
  newest: "Newest submitted first",
  priority: "Highest priority first",
  idle: "No update longest — open MRFs",
  progress: "In Progress longest",
};

async function changePriority(formData: FormData) {
  "use server";

  const requestId = String(formData.get("request_id") ?? "");
  const priority = String(formData.get("priority") ?? "");
  const back = maintenanceBack(String(formData.get("back") ?? ""));
  const target = new URL(back, "https://maintenance.invalid");
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuid.test(requestId) || !/^[1-4]$/.test(priority)) {
    target.searchParams.set("result", "priority_invalid");
    redirect(target.pathname + target.search);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("set_mrf_priority", {
    p_request: requestId,
    p_priority: Number(priority),
  });

  if (error) console.error("Priority update failed:", error.message);
  revalidatePath("/maintenance", "layout");
  target.searchParams.set("result",
    error ? "priority_failed" : "priority_saved");
  redirect(target.pathname + target.search);
}

import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

type Query = Record<string, string | string[] | undefined>;
type RequestRow = {
  id: string;
  mrf_number: string;
  machine_name: string;
  department: string;
  description: string;
  status: string;
  submitted_at: string;
  priority: number;
  mrf_last_activity: string | null;
  mrf_in_progress_since: string | null;
};
type Member = {
  request_id: string;
  employee_id: string;
  full_name: string;
  employee_number: string;
};

const labels: Record<string, string> = {
  hod_approved: "Ready to Start",
  in_progress: "In Progress",
  waiting_spare_parts: "Waiting for Parts",
  follow_up_required: "Follow-up Required",
  repair_completed: "Repair Completed",
  handover_pending: "Handover Pending",
  closed: "Closed",
};
const active = [
  "hod_approved", "in_progress", "waiting_spare_parts",
  "follow_up_required", "repair_completed", "handover_pending",
];
const tabs = [
  ["active", "Active Jobs"],
  ["my", "My Jobs"],
  ["waiting", "Waiting for Parts"],
  ["review", "Pending Review"],
  ["completed", "Completed"],
];

async function MaintenanceList({ searchParams }: { searchParams: Promise<Query> }) {
  await connection();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("full_name, role, is_active, must_change_password")
    .eq("id", user.id)
    .maybeSingle();

  if (employeeError || !employee || !employee.is_active) {
    redirect("/login?error=access_denied");
  }
  if (employee.must_change_password) redirect("/change-password");

  if (!["admin", "maintenance_supervisor",
        "maintenance_technician", "maintenance_clerk"].includes(employee.role)) {
    redirect("/");
  }


  const raw = await searchParams;
  const value = (key: string) => typeof raw[key] === "string" ? raw[key] as string : "";
  const tab = tabs.some(([key]) => key === value("tab")) ? value("tab") : "active";
  const q = value("q").trim().slice(0, 100);
  const department = value("department").trim().slice(0, 100);
  const status = value("status");
  const priority = /^[1-4]$/.test(value("priority"))
    ? value("priority") : "";
  const sort = Object.keys(sortLabels).includes(value("sort"))
    ? value("sort") : "oldest";
  const canManagePriority = ["admin", "maintenance_supervisor"]
    .includes(employee.role);
  const from = value("from");
  const to = value("to");
  const validDate = (text: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
    const date = new Date(text + "T00:00:00Z");
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
  };
  const pageNumber = Number(value("page"));
  const current = Number.isSafeInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  const size = 20;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const member = tab === "my" ? user.id
    : uuid.test(value("member")) ? value("member") : "";

  const saved = new URLSearchParams();
  for (const key of ["q", "tab", "status", "department", "member", "from", "to", "priority", "sort"]) {
    const item = value(key);
    if (item) saved.set(key, item);
  }
  saved.set("tab", tab);
  function listHref(changes: Record<string, string>) {
    const query = new URLSearchParams(saved);
    for (const [key, item] of Object.entries(changes)) {
      if (item) query.set(key, item);
      else query.delete(key);
    }
    return "/maintenance?" + query.toString();
  }
  const back = listHref({ page: String(current) });

  const statuses = tab === "waiting" ? ["waiting_spare_parts"]
    : tab === "review" ? ["repair_completed", "handover_pending"]
    : tab === "completed" ? ["repair_completed", "handover_pending", "closed"]
    : active;

  const columns = "id,mrf_number,machine_name,department,description,status,submitted_at,priority,mrf_last_activity,mrf_in_progress_since";
  let query = supabase.from("maintenance_requests").select(
    member ? columns + ",request_team_members!inner(employee_id)" : columns,
    { count: "exact" }
  ).in("status", statuses);

  if (member) query = query.eq("request_team_members.employee_id", member);
  if (status && statuses.includes(status)) query = query.eq("status", status);

  const search = q.replace(/[^\p{L}\p{N}\s_-]/gu, " ").trim().replace(/_/g, " ");
  if (search) query = query.or(
    `mrf_number.ilike.%${search}%,machine_name.ilike.%${search}%,description.ilike.%${search}%`
  );
  if (department) {
    const text = department.replace(/[%_*,()]/g, " ").trim();
    if (text) query = query.ilike("department", "%" + text + "%");
  }
  if (validDate(from)) query = query.gte("submitted_at", from + "T00:00:00+08:00");
  if (validDate(to)) query = query.lte("submitted_at", to + "T23:59:59.999999+08:00");

  if (priority) query = query.eq("priority", Number(priority));
  if (sort === "idle") {
    query = query.neq("status", "closed")
      .order("mrf_last_activity", { ascending: true, nullsFirst: false });
  }
  if (sort === "progress") {
    query = query.eq("status", "in_progress")
      .order("mrf_in_progress_since", { ascending: true, nullsFirst: false });
  }
  if (sort === "priority") {
    query = query.order("priority", { ascending: true });
  }

  const result = await query
    .order("submitted_at", { ascending: sort !== "newest" })
    .order("id", { ascending: true })
    .range((current - 1) * size, current * size - 1);
  const requests = (result.data ?? []) as unknown as RequestRow[];
  const total = result.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / size));
  if (!result.error && current > pages) redirect(listHref({ page: String(pages) }));

  const teamResult = requests.length
    ? await supabase.rpc("list_request_team", { p_requests: requests.map(item => item.id) })
    : { data: [], error: null };
  const team = (teamResult.data ?? []) as Member[];
  const temporaryResult = requests.length
    ? await supabase.from("temporary_repair_followups")
        .select("request_id").in("request_id", requests.map(item => item.id))
        .is("resolved_at", null)
    : { data: [], error: null };
  const pendingTemporary = new Set(
    (temporaryResult.data ?? []).map(item => item.request_id)
  );


  let staff: { id: string; full_name: string; employee_id: string }[] = [];
  let staffError = false;
  if (["admin", "maintenance_supervisor"].includes(employee.role)) {
    const staffResult = await supabase.rpc("list_assignable_maintenance_staff");
    staff = staffResult.data ?? [];
    staffError = Boolean(staffResult.error);
  }
  const people = new Map<string, string>([[user.id, employee.full_name + " (you)"]]);
  for (const person of staff) {
    people.set(person.id, person.full_name + " (" + person.employee_id + ")");
  }
  if (member && !people.has(member)) people.set(member, "Selected team member");

  const loadedAt = Date.now();
  function elapsed(value: string | null) {
    if (!value) return "Unavailable";
    const timestamp = new Date(value).getTime();
    if (!Number.isFinite(timestamp)) return "Unavailable";
    const minutes = Math.floor(Math.max(0, loadedAt - timestamp) / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return hours < 24 ? `${hours}h ${minutes % 60}m`
      : `${Math.floor(hours / 24)}d ${hours % 24}h`;
  }

  const field = "mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <Link href="/" className="text-blue-700 hover:underline">← Dashboard</Link>
        <h1 className="mt-5 text-3xl font-bold text-slate-900">Maintenance Team</h1>
        <p className="mt-2 text-slate-600">
          {employee.full_name} · {employee.role.replaceAll("_", " ")}
        </p>
        {value("result") === "priority_saved" && (
          <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-green-800">
            Priority saved.
          </p>
        )}
        {["priority_failed", "priority_invalid"].includes(value("result")) && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-red-800">
            Priority could not be saved. Refresh and try again.
          </p>
        )}
        <nav aria-label="Job categories" className="mt-6 flex flex-wrap gap-2">
          {tabs.map(([key, title]) => (
            <Link key={key}
              href={listHref({ tab: key, status: "", page: "1" })}
              aria-current={tab === key ? "page" : undefined}
              className={"rounded-lg px-4 py-2 text-sm font-semibold " +
                (tab === key ? "bg-blue-700 text-white" : "border bg-white text-slate-700")}>
              {title}
            </Link>
          ))}
        </nav>

        <form action="/maintenance" method="get"
          className="mt-5 grid gap-4 rounded-xl border bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
          <input type="hidden" name="tab" value={tab} />
          <label className="text-sm font-medium">Priority
            <select name="priority" defaultValue={priority} className={field}>
              <option value="">All priorities</option>
              {Object.entries(priorityLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">Sort by
            <select name="sort" defaultValue={sort} className={field}>
              {Object.entries(sortLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">Search MRF / machine / description
            <input name="q" defaultValue={q} maxLength={100}
              placeholder="11234 or Fuji9" className={field} />
          </label>
          <label className="text-sm font-medium">Status
            <select name="status" defaultValue={statuses.includes(status) ? status : ""} className={field}>
              <option value="">All statuses in this tab</option>
              {statuses.map(item => <option key={item} value={item}>{labels[item]}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Department
            <input name="department" defaultValue={department}
              placeholder="Department name" maxLength={100} className={field} />
          </label>
          <label className="text-sm font-medium">Assigned person
            {tab === "my" ? (
              <>
                <input type="hidden" name="member" value={user.id} />
                <p className={field}>{employee.full_name} (you)</p>
              </>
            ) : (
              <select name="member" defaultValue={member} className={field}>
                <option value="">All team members</option>
                {[...people].map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
            )}
          </label>
          <label className="text-sm font-medium">Submitted from — Malaysia date
            <input type="date" name="from" defaultValue={validDate(from) ? from : ""} className={field} />
          </label>
          <label className="text-sm font-medium">Submitted to — Malaysia date
            <input type="date" name="to" defaultValue={validDate(to) ? to : ""} className={field} />
          </label>
          <div className="flex items-end gap-4">
            <button className="rounded-lg bg-blue-700 px-5 py-2 font-semibold text-white">
              Apply filters
            </button>
            <Link href="/maintenance" className="py-2 text-sm text-blue-700">Reset</Link>
          </div>
        </form>

        <p className="mt-3 text-sm text-slate-600">
          No update measures time since recorded activity, including priority changes.
          It does not mean nobody is working. In Progress includes paused time.
          Refresh to update durations.
          {sort === "idle" && " Closed MRFs are excluded."}
          {sort === "progress" && " Only In Progress MRFs are shown within the selected tab and filters."}
        </p>
        {tab === "review" && (
          <p className="mt-3 text-sm text-slate-600">
            Repairs awaiting final approval or handover. Individual task reviews are inside each MRF.
          </p>
        )}
        {staffError && <p role="alert" className="mt-3 text-red-700">
          The staff filter list could not be loaded. Refresh to try again.
        </p>}

        {temporaryResult.error && (
          <p role="alert" className="mt-3 text-red-700">
            Temporary repair indicators could not be loaded. Refresh to try again.
          </p>
        )}
        {result.error ? (
          <p role="alert" className="mt-5 rounded-xl bg-white p-5 text-red-700">
            Requests could not be loaded. Refresh and try again.
          </p>
        ) : (
          <>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
              <p>{total === 0 ? "No matching MRFs" :
                `Showing ${(current - 1) * size + 1}–${Math.min(current * size, total)} of ${total} MRFs`}</p>
              <p>{sortLabels[sort]} · 20 per page</p>
            </div>
            <div className="mt-3 overflow-x-auto rounded-xl border bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    {["MRF / Machine", "Department", "Status", "Priority", "Assigned team", "Submitted", "Activity / Time", ""].map(
                      (title, index) => <th key={index} className="px-4 py-3 font-semibold">{title}</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map(request => {
                    const members = team.filter(person => person.request_id === request.id);
                    const href = "/maintenance/" + request.id + "?" +
                      new URLSearchParams({ back }).toString();
                    return (
                      <tr key={request.id} className="hover:bg-blue-50/40">
                        <td className="min-w-52 px-4 py-4">
                          <Link href={href} className="font-bold text-blue-700 hover:underline">
                            {request.mrf_number} · {request.machine_name}
                          </Link>
                          <p className="mt-1 line-clamp-2 max-w-sm text-slate-500">{request.description}</p>
                        </td>
                        <td className="px-4 py-4">{request.department}</td>
                        <td className="px-4 py-4">
                          <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800">
                            {labels[request.status] ?? request.status}
                            {pendingTemporary.has(request.id) && (
                              <span className="mt-1 block font-semibold text-amber-800">
                                Temporary repair · Follow-up pending
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="min-w-40 px-4 py-4">
                          {canManagePriority && request.status !== "closed" ? (
                            <form action={changePriority} className="space-y-2">
                              <input type="hidden" name="request_id" value={request.id} />
                              <input type="hidden" name="back" value={back} />
                              <select name="priority"
                                aria-label={"Priority for MRF " + request.mrf_number}
                                defaultValue={String(request.priority)}
                                className={field}>
                                {Object.entries(priorityLabels).map(([value, label]) => (
                                  <option key={value} value={value}>{label}</option>
                                ))}
                              </select>
                              <button className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white">
                                Save priority
                              </button>
                            </form>
                          ) : (
                            <span className="font-semibold">
                              {priorityLabels[String(request.priority)] ?? "Normal"}
                            </span>
                          )}
                        </td>
                        <td className="min-w-40 px-4 py-4 text-slate-600">
                          {teamResult.error ? "Could not load team" :
                            members.map(person => person.full_name).join(", ") || "Not assigned"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                          {new Date(request.submitted_at).toLocaleDateString("en-MY", {
                            timeZone: "Asia/Kuala_Lumpur",
                          })}
                        </td>
                        <td className="min-w-44 px-4 py-4 text-xs text-slate-600">
                          <p>
                            {request.status === "closed" ? "Last activity: " : "No update: "}
                            {request.status === "closed"
                              ? (request.mrf_last_activity
                                ? new Date(request.mrf_last_activity).toLocaleString(
                                    "en-MY", { timeZone: "Asia/Kuala_Lumpur" })
                                : "Unavailable")
                              : elapsed(request.mrf_last_activity)}
                          </p>
                          {request.status === "in_progress" && (
                            <p className="mt-2">
                              In Progress: {elapsed(request.mrf_in_progress_since)}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <Link href={href} className="inline-block rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white">
                            Open
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {!requests.length && <tr><td colSpan={8} className="p-8 text-center text-slate-500">
                    No MRFs match these filters.
                  </td></tr>}
                </tbody>
              </table>
            </div>
            <nav aria-label="MRF pages" className="mt-5 flex items-center justify-between gap-4">
              {current > 1 ? <Link href={listHref({ page: String(current - 1) })}
                className="rounded-lg border bg-white px-4 py-2 text-sm text-blue-700">← Previous</Link> : <span />}
              <span className="text-sm text-slate-600">Page {current} of {pages}</span>
              {current < pages ? <Link href={listHref({ page: String(current + 1) })}
                className="rounded-lg border bg-white px-4 py-2 text-sm text-blue-700">Next →</Link> : <span />}
            </nav>
          </>
        )}
      </div>
    </main>
  );
}

export default function Page({ searchParams }: { searchParams: Promise<Query> }) {
  return <Suspense fallback={<p className="p-8">Loading maintenance requests...</p>}>
    <MaintenanceList searchParams={searchParams} />
  </Suspense>;
}
