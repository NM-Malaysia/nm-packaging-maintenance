
import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const employeeId = body.employeeId;
    const password = body.password;

    if (
      typeof employeeId !== "string" ||
      typeof password !== "string" ||
      !employeeId.trim() ||
      !password ||
      employeeId.length > 100
    ) {
      return NextResponse.json(
        { error: "Invalid Employee ID or password." },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secret = process.env.SUPABASE_SERVER_SECRET_KEY;
    const publishable =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !secret || !publishable) {
      throw new Error("Missing server authentication configuration");
    }

    // Privileged client is used only for employee lookup.
    const admin = createAdminClient(url, secret, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: employee, error: employeeError } = await admin
      .from("employees")
      .select("id, employee_id, role, is_active, must_change_password")
      .eq("employee_id", employeeId.trim())
      .maybeSingle();

    if (employeeError) throw employeeError;

    if (!employee || !employee.is_active) {
      return NextResponse.json(
        { error: "Invalid Employee ID or password." },
        { status: 401 }
      );
    }

    const { data: userData, error: userError } =
      await admin.auth.admin.getUserById(employee.id);

    if (userError || !userData.user?.email) {
      return NextResponse.json(
        { error: "Invalid Employee ID or password." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
  success: true,
  message: "Login successful.",
  mustChangePassword: employee.must_change_password === true,
});

    // Browser session is stored using Supabase SSR cookies.
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

    const { data: sessionData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password,
      });

    if (
      loginError ||
      !sessionData.user ||
      sessionData.user.id !== employee.id
    ) {
      return NextResponse.json(
        { error: "Invalid Employee ID or password." },
        { status: 401 }
      );
    }

    return response;
  } catch (error) {
    console.error("Employee login API error:", error);

    return NextResponse.json(
      { error: "Unable to complete login. Please try again." },
      { status: 500 }
    );
  }
}