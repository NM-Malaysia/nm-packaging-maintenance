import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: employeeId } = await context.params;

    // Step 1: Verify the signed-in user
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

    // Step 2: Verify active Admin permission
    const { data: admin, error: adminError } =
      await supabase
        .from("employees")
        .select("role, is_active")
        .eq("id", user.id)
        .single();

    if (
      adminError ||
      !admin ||
      admin.role !== "admin" ||
      !admin.is_active
    ) {
      return NextResponse.json(
        { error: "Active Admin access required." },
        { status: 403 }
      );
    }

    // Step 3: Check the employee database ID
    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required." },
        { status: 400 }
      );
    }

    // Step 4: Find the employee
    const adminSupabase = createAdminClient();

    const { data: targetEmployee, error: targetError } =
      await adminSupabase
        .from("employees")
        .select("id, employee_id, role, is_active")
        .eq("id", employeeId)
        .maybeSingle();

    if (targetError) {
      return NextResponse.json(
        { error: "Unable to check employee details." },
        { status: 500 }
      );
    }

    if (!targetEmployee) {
      return NextResponse.json(
        { error: "Employee not found." },
        { status: 404 }
      );
    }

    // Step 5: Read the requested action
    const body = await request.json().catch(() => null);
    const action = body?.action;

    if (action !== "activate" && action !== "deactivate") {
      return NextResponse.json(
        { error: "Invalid employee status action." },
        { status: 400 }
      );
    }

    // Step 6: Prevent unnecessary status changes
    if (
      (action === "activate" && targetEmployee.is_active) ||
      (action === "deactivate" && !targetEmployee.is_active)
    ) {
      return NextResponse.json(
        {
          error: `Employee is already ${
            targetEmployee.is_active ? "active" : "inactive"
          }.`,
        },
        { status: 409 }
      );
    }
// Protect the last active Admin
if (
  action === "deactivate" &&
  targetEmployee.role === "admin"
) {
  const { count, error: countError } = await adminSupabase
    .from("employees")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")
    .eq("is_active", true);

  if (countError || count === null) {
    return NextResponse.json(
      { error: "Unable to verify active Admin accounts." },
      { status: 500 }
    );
  }

  if (count <= 1) {
    return NextResponse.json(
      {
        error:
          "Cannot deactivate the last active Admin account.",
      },
      { status: 409 }
    );
  }
}
    // Step 7: Update employee status securely
const { error: updateError } = await adminSupabase.rpc(
  "set_employee_active_status",
  {
    p_admin_id: user.id,
    p_employee_id: employeeId,
    p_active: action === "activate",
  }
);

if (updateError) {
  console.error(
    "Employee status update error:",
    updateError.message
  );

  return NextResponse.json(
    {
      error:
        "Unable to change employee status. " +
        "The employee may be the last active Admin.",
    },
    { status: 409 }
  );
}

    return NextResponse.json({
      success: true,
      message:
        action === "activate"
          ? "Employee activated successfully."
          : "Employee deactivated successfully.",
    });
  } catch (error) {
    console.error("Employee status API error:", error);

    return NextResponse.json(
      { error: "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}