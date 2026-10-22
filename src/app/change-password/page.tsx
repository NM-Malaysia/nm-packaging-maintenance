
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ChangePasswordForm from "./ChangePasswordForm";
import { connection } from "next/server";
import { Suspense } from "react";

async function ProtectedChangePasswordPage() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("employee_id, full_name, is_active, must_change_password")
    .eq("id", user.id)
    .maybeSingle();

  if (employeeError || !employee || !employee.is_active) {
    redirect("/login?error=access_denied");
  }

  if (employee.must_change_password !== true) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <div className="mb-4 text-5xl">🔐</div>

          <h1 className="text-2xl font-bold text-slate-900">
            NM PACKAGING
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Maintenance Request Management System
          </p>
        </div>

        <h2 className="mb-3 text-xl font-semibold text-slate-900">
          Change Temporary Password
        </h2>

        <p className="mb-4 text-sm text-slate-600">
          Welcome, {employee.full_name}.
        </p>

        <p className="text-sm text-slate-600">
          Your account requires a password change before you can
          access the Maintenance Dashboard.
        </p>

        <ChangePasswordForm />
      </section>
    </main>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-100">
          <p className="text-slate-600">
            Checking employee account...
          </p>
        </main>
      }
    >
      <ProtectedChangePasswordPage />
    </Suspense>
  );
}