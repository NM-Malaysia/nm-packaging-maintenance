
"use client";

import { createEmployeeText, type CreateEmployeeLanguage } from "@/utils/createEmployeeTranslations";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Department = {
  id: string;
  name: string;
};

export default function CreateEmployeeForm({
  departments,
  language = "en",
}: {
  departments: Department[];
  language?: CreateEmployeeLanguage;
}) {
  const t = (text: string) => createEmployeeText(language, text);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");
    setLoading(true);

    const form = event.currentTarget;
    const data = new FormData(form);

    const payload = {
      employee_id: String(data.get("employee_id") ?? "").trim(),
      full_name: String(data.get("full_name") ?? "").trim(),
      department_id: String(data.get("department_id") ?? ""),
      role: String(data.get("role") ?? ""),
      temporary_password: String(
        data.get("temporary_password") ?? ""
      ),
    };

    try {
      const response = await fetch(
        "/api/admin/employees",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to create employee."
        );
      }

      setSuccess(
        "Employee created successfully. " +
        "Admin activation is required."
      );

      form.reset();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="employee_id" className="mb-2 block text-sm font-medium">{t("Employee ID *")}</label>
        <input
          id="employee_id"
          name="employee_id"
          required
          maxLength={50}
          pattern="[A-Za-z0-9_-]+"
          placeholder={t("Existing company Employee ID")}
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div>
        <label htmlFor="full_name" className="mb-2 block text-sm font-medium">{t("Full Name *")}</label>
        <input
          id="full_name"
          name="full_name"
          required
          maxLength={150}
          placeholder={t("Employee full name")}
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div>
        <label htmlFor="department_id" className="mb-2 block text-sm font-medium">{t("Department *")}</label>
        <select
          id="department_id"
          name="department_id"
          required
          defaultValue=""
          className="w-full rounded-lg border p-3"
        >
          <option value="" disabled>{t("Select department")}</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="role" className="mb-2 block text-sm font-medium">{t("App Role *")}</label>
        <select
          id="role"
          name="role"
          required
          defaultValue=""
          className="w-full rounded-lg border p-3"
        >
          <option value="" disabled>{t("Select role")}</option>
          <option value="requestor">{t("Requestor")}</option>
          <option value="department_hod">{t("Department HOD")}</option>
          <option value="maintenance_technician">{t("Maintenance Technician")}</option>
         <option value="maintenance_supervisor">{t("Maintenance Supervisor")}</option>
<option value="maintenance_clerk">{t("Maintenance Clerk")}</option>
<option value="admin">{t("Admin")}</option>
</select>
      </div>

      <div>
        <label
          htmlFor="temporary_password"
          className="mb-2 block text-sm font-medium"
        >{t("Temporary Password *")}</label>
        <input
          id="temporary_password"
          name="temporary_password"
          type="password"
          required
          minLength={12}
          maxLength={128}
          autoComplete="new-password"
          className="w-full rounded-lg border p-3"
          placeholder={t("At least 12 characters")}
        />
        <p className="mt-2 text-xs text-slate-500">{t("Employee must change this password at first login.")}</p>
      </div>

      <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">{t("New employees remain Inactive until an Admin activates their account.")}</div>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {t(error)}
        </p>
      )}

      {success && (
        <p role="status" className="text-sm text-green-700">
          {t(success)}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || departments.length === 0}
        className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? t("Creating Employee...") : t("Create Employee")}
      </button>
    </form>
  );
}