"use server";

import { createClient } from "@/utils/supabase/server";

export type RequestState = { error?: string; mrf?: string };

export async function submitRequest(
  _previous: RequestState,
  form: FormData
): Promise<RequestState> {
  const mrf = String(form.get("mrf_number") ?? "").trim();
  const category = String(form.get("work_category") ?? "");
  const machineId = String(form.get("machine_id") ?? "");
  let machine = String(form.get("machine_name") ?? "").trim();
  const location = String(form.get("work_location") ?? "").trim();
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const description = String(form.get("description") ?? "").trim();
  const type = String(form.get("request_type") ?? "");
  const downtime = form.get("downtime_applicable") === "on";
  const started = String(form.get("downtime_started_at") ?? "");

  if (!/^[0-9]{5}$/.test(mrf)) return { error: "Enter the five-digit paper MRF number, including leading zeros." };
  if (!["equipment", "facilities", "other"].includes(category)) {
    return { error: "Select a work category." };
  }
  if (location.length > 200) return { error: "Enter a location of up to 200 characters." };
  if (category === "equipment") {
    if (!uuid.test(machineId)) return { error: "Select registered equipment." };
  } else {
    if (machineId || !machine || machine.length > 200 || !location) {
      return { error: "Enter a work subject and location, each up to 200 characters." };
    }
    if (downtime || started) {
      return { error: "Machine downtime applies only to equipment requests." };
    }
  }
  if (!description || description.length > 10000) return { error: "Enter maintenance details of up to 10,000 characters." };
  if (!["repair", "maintenance", "modification"].includes(type)) return { error: "Select a request type." };

  let downtimeStartedAt: string | null = null;
  if (downtime) {
    // The form explicitly collects Malaysia time, independent of browser timezone.
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(started)) return { error: "Enter the downtime start date and time." };
    const date = new Date(`${started}:00+08:00`);
    if (!Number.isFinite(date.getTime()) || date.getTime() > Date.now()) return { error: "Downtime start must be a valid date and cannot be in the future." };
    downtimeStartedAt = date.toISOString();
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: "Your session expired. Please sign in again." };
    const { data: employee, error: employeeError } = await supabase.from("employees")
      .select("id, role, is_active, must_change_password, department_id")
      .eq("id", user.id).maybeSingle();
    if (employeeError || !employee || !employee.is_active || !["requestor", "department_hod"].includes(employee.role)) {
      return { error: "Only active Requestors and Department HODs can submit requests." };
    }
    if (employee.must_change_password) return { error: "Complete your first-login password change before submitting." };
    const { data: department, error: departmentError } = await supabase.from("departments")
      .select("name").eq("id", employee.department_id).maybeSingle();
    if (departmentError || !department) return { error: "Unable to confirm your department. Contact your administrator." };

    if (category === "equipment") {
      const { data: equipment, error: equipmentError } = await supabase
        .from("machines")
        .select("machine_name")
        .eq("id", machineId)
        .eq("is_active", true)
        .maybeSingle();
      if (equipmentError || !equipment) {
        return { error: "Selected equipment is unavailable. Refresh and select active equipment." };
      }
      machine = equipment.machine_name;
    }

    // Submit using the employee session and existing request/audit triggers.
    const { error } = await supabase.from("maintenance_requests").insert({
      mrf_number: mrf,
      requestor_id: user.id,
      department: department.name,
      machine_name: machine,
      work_category: category,
      machine_id: category === "equipment" ? machineId : null,
      work_location: location,
      request_type: type,
      description,
      downtime_applicable: downtime,
      downtime_started_at: downtimeStartedAt,
    });
    if (error) {
      if (error.code === "23505") return { error: "This MRF number already exists. Check the paper form number before submitting again." };
      return { error: "Submission was not confirmed. Check your connection and account permissions. If you are unsure whether it saved, ask the maintenance clerk to check the MRF number before retrying." };
    }
    return { mrf };
  } catch {
    return { error: "Submission was not confirmed. Check whether this MRF number was saved before retrying." };
  }
}
