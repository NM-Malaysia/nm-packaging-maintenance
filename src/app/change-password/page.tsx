
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ChangePasswordContent from "./ChangePasswordContent";
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
        <ChangePasswordContent name={employee.full_name} />
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