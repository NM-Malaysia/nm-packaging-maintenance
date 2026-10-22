import CreateEmployeeForm from "./CreateEmployeeForm";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

async function ProtectedAddEmployeePage() {
  await connection();

  const supabase = await createClient();

  // Verify the signed-in user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Only active Admin employees can access this page
  const { data: employee, error: employeeError } =
    await supabase
      .from("employees")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

  if (
    employeeError ||
    !employee ||
    !employee.is_active ||
    employee.role !== "admin"
  ) {
    redirect("/");
  }

  // Load active departments
  const { data: departments, error: departmentsError } =
    await supabase
      .from("departments")
      .select("id, name")
      .eq("is_active", true)
      .order("name");

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/admin/employees"
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          ← Back to Employee Management
        </Link>

        <div className="mt-6 mb-6">
          <h1 className="text-3xl font-bold text-slate-900">
            Add Employee
          </h1>
          <p className="mt-2 text-slate-600">
            NM PACKAGING (M) SDN. BHD.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Admin access only
          </p>
        </div>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-slate-900">
            Employee Details
          </h2>

   <CreateEmployeeForm departments={departments ?? []} />      
            
        </section>
      </div>
    </main>
  );
}

export default function AddEmployeePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-100 p-6">
          <p className="text-slate-600">
            Loading Add Employee...
          </p>
        </main>
      }
    >
      <ProtectedAddEmployeePage />
    </Suspense>
  );
}