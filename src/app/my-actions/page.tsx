import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DashboardNavigation from "../DashboardNavigation";
import MyActions from "../MyActions";

async function Content({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: employee, error } = await supabase.from("employees")
    .select("full_name, role, is_active, must_change_password")
    .eq("id", user.id).maybeSingle();

  if (error || !employee?.is_active) redirect("/login?error=access_denied");
  if (employee.must_change_password) redirect("/change-password");

  const params = await searchParams;
  const rawPage = typeof params.page === "string" ? params.page : "1";
  const page = Math.max(1, Math.min(100000, Number.parseInt(rawPage, 10) || 1));

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <DashboardNavigation name={employee.full_name} role={employee.role} />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link href="/" className="text-blue-700 hover:underline">← Dashboard</Link>
        <h1 className="my-5 text-2xl font-bold">Notifications &amp; My Actions</h1>
        {params.result === "changed" && (
          <p role="status" className="mb-4 rounded-lg border bg-white p-4">
            The action changed or could not be marked as read.
            Check the current list and try again.
          </p>
        )}
        <MyActions page={page} />
      </div>
    </main>
  );
}

export default function Page(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<p className="p-8 text-slate-900">Loading your actions...</p>}>
      <Content {...props} />
    </Suspense>
  );
}
