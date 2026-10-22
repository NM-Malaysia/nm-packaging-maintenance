
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";



const ALLOWED_ROLES = [
  "requestor",
  "department_hod",
  "maintenance_technician",
  "maintenance_supervisor",
  "maintenance_clerk",
  "admin",
];

export async function POST(request: Request) {
  try {
    // 1. Verify the currently signed-in user.
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please log in first." },
        { status: 401 }
      );
    }

    // 2. Only active admins can register employees.
    const { data: adminEmployee, error: adminError } =
      await supabase
        .from("employees")
        .select("role, is_active")
        .eq("id", user.id)
        .single();

    if (
      adminError ||
      !adminEmployee ||
      adminEmployee.role !== "admin" ||
      !adminEmployee.is_active
    ) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    // 3. Read and validate submitted information.
    const body = await request.json().catch(() => null);

    const employeeId =
      typeof body?.employee_id === "string"
        ? body.employee_id.trim()
        : "";

    const fullName =
      typeof body?.full_name === "string"
        ? body.full_name.trim()
        : "";

    const departmentId = body?.department_id;
    const role = body?.role;
    const password = body?.temporary_password;

    if (
      !/^[A-Za-z0-9_-]{1,50}$/.test(employeeId) ||
      !fullName ||
      fullName.length > 150 ||
      typeof departmentId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(departmentId) ||
      typeof role !== "string" ||
      !ALLOWED_ROLES.includes(role) ||
      typeof password !== "string" ||
      password.length < 12 ||
      password.length > 128
    ) {
      return NextResponse.json(
        { error: "Invalid employee details or password." },
        { status: 400 }
      );
    }

    // 4. Create a server-only privileged client.
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secret = process.env.SUPABASE_SERVER_SECRET_KEY;

    if (!url || !secret) {
      console.error("Supabase server configuration missing");

      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }

    const admin = createAdminClient(url, secret, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // 5. Check for duplicate employee IDs.
    const { data: existing, error: lookupError } =
      await admin
        .from("employees")
        .select("id")
        .eq("employee_id", employeeId)
        .maybeSingle();

    if (lookupError) throw lookupError;

    if (existing) {
      return NextResponse.json(
        { error: "Employee ID already exists." },
        { status: 409 }
      );
    }

    // 6. Confirm the department is active.
    const { data: department, error: deptError } =
      await admin
        .from("departments")
        .select("id")
        .eq("id", departmentId)
        .eq("is_active", true)
        .maybeSingle();

    if (deptError) throw deptError;

    if (!department) {
      return NextResponse.json(
        { error: "Invalid or inactive department." },
        { status: 400 }
      );
    }

    // 7. Generate a unique internal authentication email.
    // Employees never need to know or enter this email.
    // This is not a real mailbox.
    const internalEmail =
      `employee-${randomUUID()}@auth.nmpackaging.invalid`;

    // 8. Create the Supabase Authentication account.
    const { data: authData, error: createError } =
      await admin.auth.admin.createUser({
        email: internalEmail,
        password,
        email_confirm: true,
      });

    if (createError || !authData.user) {
      console.error("Employee auth creation error:", createError);

      return NextResponse.json(
        { error: "Unable to create employee account." },
        { status: 500 }
      );
    }

    const authId = authData.user.id;

    // 9. Save employee profile using the same Auth UUID.
    const { error: insertError } = await admin
      .from("employees")
      .insert({
        id: authId,
        employee_id: employeeId,
        full_name: fullName,
        department_id: departmentId,
        role,
        is_active: false,
        must_change_password: true,
      });

    if (insertError) {
      console.error("Employee profile insert error:", insertError);

      // Attempt to remove the newly created Auth account.
      const { error: cleanupError } =
        await admin.auth.admin.deleteUser(authId);

      if (cleanupError) {
        console.error(
          "Manual cleanup required for Auth ID:",
          authId,
          cleanupError
        );
      }

      return NextResponse.json(
        { error: "Unable to save employee details." },
        { status: 500 }
      );
    }

    // 10. Return success.
    return NextResponse.json(
      {
        success: true,
        message:
          "Employee registered successfully. Admin activation required.",
        employee_id: employeeId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Employee registration API error:", error);

    return NextResponse.json(
      { error: "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}