
import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishable =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const secret = process.env.SUPABASE_SERVER_SECRET_KEY;

    if (!url || !publishable || !secret) {
      throw new Error("Missing Supabase server configuration.");
    }

    // Use the authenticated employee's session.
    // Never accept an employee ID from the browser.
    const response = NextResponse.json({
      success: true,
      message: "Password changed. Please sign in again.",
    });

    const supabase = createServerClient(url, publishable, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please sign in again." },
        { status: 401 }
      );
    }

    const admin = createAdminClient(url, secret, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: employee, error: employeeError } = await admin
      .from("employees")
      .select("id, is_active, must_change_password")
      .eq("id", user.id)
      .maybeSingle();

    if (
      employeeError ||
      !employee ||
      !employee.is_active ||
      employee.must_change_password !== true
    ) {
      return NextResponse.json(
        { error: "Password change is not permitted." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const password = body?.password;
    const confirmPassword = body?.confirmPassword;

    if (
      typeof password !== "string" ||
      typeof confirmPassword !== "string" ||
      password.length < 12 ||
      password.length > 128 ||
      password !== confirmPassword
    ) {
      return NextResponse.json(
        {
          error:
            "Passwords must match and contain 12–128 characters.",
        },
        { status: 400 }
      );
    }

    // Change the password for the authenticated user.
    const { error: passwordError } =
      await supabase.auth.updateUser({ password });

    if (passwordError) {
      return NextResponse.json(
        {
          error:
            "Password update failed. Please try again.",
        },
        { status: 400 }
      );
    }

    // Clear the first-login requirement using server-only
    // credentials, without granting employees UPDATE access.
    const { data: updatedEmployee, error: updateError } =
      await admin
        .from("employees")
        .update({ must_change_password: false })
        .eq("id", user.id)
        .eq("must_change_password", true)
        .select("id, must_change_password")
        .single();

    if (
      updateError ||
      !updatedEmployee ||
      updatedEmployee.must_change_password !== false
    ) {
      console.error(
        "Password changed but employee flag update failed:",
        updateError
      );

      return NextResponse.json(
        {
          error:
            "Password changed, but account setup is incomplete. Contact your administrator.",
        },
        { status: 500 }
      );
    }

    // End the current session after successful setup.
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      console.error("Sign out after password change:", signOutError);
    }

    return response;
  } catch (error) {
    console.error("Change password API error:", error);

    return NextResponse.json(
      {
        error: "Unable to complete password change.",
      },
      { status: 500 }
    );
  }
}