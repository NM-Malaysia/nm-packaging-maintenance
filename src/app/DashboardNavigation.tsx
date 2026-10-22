import { NotificationBell } from "./MyActions";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

async function signOut() {
  "use server";
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) throw new Error("Sign out failed. Please try again.");
  redirect("/login");
}

export default function DashboardNavigation({
  name,
  role,
}: {
  name: string;
  role: string;
}) {
  const canSubmit = ["requestor", "department_hod"].includes(role);
  const canApprove = ["department_hod", "admin"].includes(role);

  return (
    <nav aria-label="Main navigation"
      className="border-b bg-white px-6 py-4 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-semibold">{name}</p>
          <p className="text-sm capitalize text-slate-500">
            {role.replaceAll("_", " ")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-5 text-sm font-medium">
          <Link href="/" className="text-blue-700 hover:underline">Dashboard</Link>
          <Link href="/#latest-requests" className="text-blue-700 hover:underline">
            Requests
          </Link>
          {canSubmit && (
            <Link href="/requests/new" className="text-blue-700 hover:underline">
              New Request
            </Link>
          )}
          {canApprove && (
            <Link href="/approvals" className="text-blue-700 hover:underline">
              HOD Approvals
            </Link>
          )}
          {role === "admin" && (
            <Link href="/admin/employees" className="text-blue-700 hover:underline">
              Employees
            </Link>
          )}
          <NotificationBell />
          <form action={signOut}>
            <button type="submit"
              className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-100">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
