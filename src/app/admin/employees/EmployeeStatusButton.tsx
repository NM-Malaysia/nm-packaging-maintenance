"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type EmployeeStatusButtonProps = {
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  isActive: boolean;
};

export default function EmployeeStatusButton({
  employeeId,
  employeeNumber,
  employeeName,
  isActive,
}: EmployeeStatusButtonProps) {
  const [showConfirmation, setShowConfirmation] =
    useState(false);

  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const action = isActive ? "Deactivate" : "Activate";
  async function handleConfirm() {
  if (isSubmitting) return;

  setIsSubmitting(true);
  setErrorMessage("");

  try {
    const response = await fetch(
      `/api/admin/employees/${employeeId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: isActive ? "deactivate" : "activate",
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error || "Unable to update employee status."
      );
    }

    setShowConfirmation(false);
    router.refresh();
  } catch (error) {
    setErrorMessage(
      error instanceof Error
        ? error.message
        : "An unexpected error occurred."
    );
  } finally {
    setIsSubmitting(false);
  }
}

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setErrorMessage("");
          setShowConfirmation(true);
        }}
        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        {action}
      </button>

      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">

            <h2 className="text-xl font-bold text-slate-900">
              Confirm Employee {action}
            </h2>

            <p className="mt-4 text-slate-700">
              Are you sure you want to{" "}
              {action.toLowerCase()}{" "}
              <strong>{employeeName}</strong>?
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Employee ID: {employeeNumber}
            </p>

            {/* Deactivation warning */}
            {isActive && (
              <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                Warning: Deactivating an employee will
                prevent them from accessing the
                maintenance system. The last active
                Admin account is protected.
              </p>
            )}

            {/* Error message */}
            {errorMessage && (
              <p
                role="alert"
                className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {errorMessage}
              </p>
            )}

            {/* Cancel and Confirm buttons */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage("");
                  setShowConfirmation(false);
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700"
              >
                Cancel
              </button>

              <button
  type="button"
  onClick={handleConfirm}
  disabled={isSubmitting}
  className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
>
  {isSubmitting ? "Processing..." : `Confirm ${action}`}
</button>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Confirmation is not enabled yet.
              No employee status will be changed.
            </p>

          </div>
        </div>
      )}
    </>
  );
}