import EmployeeStatusButton from "./EmployeeStatusButton";
import { Suspense } from "react";
import { connection } from "next/server";

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

async function ProtectedEmployeeManagement() {
  await connection();
  const supabase = await createClient();

  // Check the signed-in user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }


  // Only active Admin employees may open this page
  const { data: currentEmployee, error: employeeError } =
    await supabase
      .from("employees")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

  if (
    employeeError ||
    !currentEmployee ||
    !currentEmployee.is_active ||
    currentEmployee.role !== "admin"
  ) {
    redirect("/");
  }

  // Load employees using the signed-in user's permissions
  const { data: employees, error: listError } = await supabase
    .from("employees")
    .select(
  "id, employee_id, full_name, role, is_active, department_id"
)
    .order("employee_id");

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name");

  const departmentNames = new Map(
    (departments ?? []).map((department) => [
      department.id,
      department.name,
    ])
  );

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-6 mb-6">
          <h1 className="text-3xl font-bold text-slate-900">
            Employee Management
          </h1>
          <p className="mt-2 text-slate-600">
            NM PACKAGING (M) SDN. BHD.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Admin access only
          </p>
        </div>

        <section className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
  <h2 className="text-lg font-semibold text-slate-900">
    Registered Employees
  </h2>

  <Link
    href="/admin/employees/new"
    className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
  >
    + Add Employee
  </Link>
</div>

          {listError ? (
            <p className="p-5 text-red-700">
              Unable to load employee records.
              Please check the database permissions.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="p-4">Employee ID</th>
                    <th className="p-4">Full Name</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(employees ?? []).map((employee) => (
                    <tr
                      key={employee.employee_id}
                      className="border-t border-slate-100"
                    >
                      <td className="p-4 font-medium">
                        {employee.employee_id}
                      </td>
                      <td className="p-4">
                        {employee.full_name}
                      </td>
                      <td className="p-4">
                        {departmentNames.get(
                          employee.department_id
                        ) ?? "Not assigned"}
                      </td>
                      <td className="p-4">
                        {employee.role.replaceAll("_", " ")}
                      </td>
                      <td className="p-4">
  <span
    className={
      employee.is_active
        ? "font-medium text-green-700"
        : "font-medium text-amber-700"
    }
  >
    {employee.is_active ? "Active" : "Inactive"}
  </span>
</td>

<td className="p-4">
  <EmployeeStatusButton
  employeeId={employee.id}
  employeeNumber={employee.employee_id}
  employeeName={employee.full_name}
  isActive={employee.is_active}
/>
</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {(employees ?? []).length === 0 && (
                <p className="p-5 text-slate-500">
                  No employee records available.
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
export default function EmployeeManagementPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-100 p-6">
          <p className="text-slate-600">
            Loading Employee Management...
          </p>
        </main>
      }
    >
      <ProtectedEmployeeManagement />
    </Suspense>
  );
}