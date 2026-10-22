"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

const field = "mt-1 block min-w-0 w-full max-w-full rounded-lg border border-slate-300 bg-white p-3 text-base text-slate-900";

function SaveButton({ existing }: { existing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}
      className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-60">
      {pending ? "Saving..." : existing ? "Save part update" : "Add part record"}
    </button>
  );
}

export default function PartStatusForm({
  action, requestId, existing, initial,
}: {
  action: (data: FormData) => Promise<void>;
  requestId: string;
  existing: boolean;
  initial: Record<string, string>;
}) {
  const [values, setValues] = useState(initial);
  const status = values.status;
  const purchase = values.source === "purchase";
  const available = ["available", "issued"].includes(status);
  const issued = status === "issued";
  const cancelled = status === "cancelled";

  function set(key: string, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  function input(
    name: string,
    label: string,
    options: {
      type?: string;
      required?: boolean;
      maxLength?: number;
      min?: string;
      max?: string;
      step?: string;
    } = {},
  ) {
    return (
      <label className="block min-w-0">
        {label}
        <input name={name} value={values[name] ?? ""}
          onChange={(event) => set(name, event.target.value)}
          className={field} {...options}
          style={{ minWidth: 0, maxWidth: "100%", boxSizing: "border-box" }} />
      </label>
    );
  }

  function date(name: string, label: string, required = false) {
    return input(name, `${label} — Malaysia time`, {
      type: "datetime-local", required,
    });
  }

  return (
    <form action={action} className="mt-4 space-y-4 text-slate-900">
      <input type="hidden" name="request_id" value={requestId} />
      <input type="hidden" name="part_id" value={initial.part_id} />
      <input type="hidden" name="return_to" value={`/maintenance/${requestId}`} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="min-w-0">
          Part status
          <select name="status" value={status} required className={field}
            onChange={(event) => set("status", event.target.value)}>
            <option value="waiting">Waiting</option>
            <option value="available">Available</option>
            <option value="issued">Issued</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label className="min-w-0">
          Source
          <select name="source" value={values.source} required className={field}
            onChange={(event) => set("source", event.target.value)}>
            <option value="" disabled>Select confirmed source</option>
            <option value="store">Store on hand</option>
            <option value="purchase">Purchase required</option>
          </select>
        </label>
        {input("part_code", "Confirmed part code", { required: true, maxLength: 100 })}
        {input("part_name", "Part name", { required: true, maxLength: 200 })}
        {input("quantity", "Quantity", {
          type: "number", required: true, min: "0.01",
          max: "9999999999.99", step: "0.01",
        })}
        {date("needed_at", "Part needed", true)}
      </div>

      {purchase && (
        <fieldset className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
          <legend className="px-2 font-semibold">Purchase follow-up</legend>
          {input("purchase_reference", "Purchase reference", { maxLength: 200 })}
          {date("ordered_at", "Actual order time")}
        </fieldset>
      )}

      {available && (
        <fieldset className="rounded-lg border p-4">
          <legend className="px-2 font-semibold">Part availability</legend>
          {date("available_at", "Actual availability time", true)}
        </fieldset>
      )}

      {issued && (
        <fieldset className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
          <legend className="px-2 font-semibold">Issue / MIV details</legend>
          {date("issued_at", "Actual issue time", true)}
          {input("miv_number", "MIV number — optional, can be added later", { maxLength: 100 })}
        </fieldset>
      )}

      {/* Keep existing MIV references until the issue stage. */}
      {!issued && (
        <input type="hidden" name="miv_number" value={values.miv_number ?? ""} />
      )}
      {/* Preserve an already recorded availability time when cancelling. */}
      {cancelled && (
        <input type="hidden" name="available_at" value={initial.available_at ?? ""} />
      )}

      <label className="block">
        Defect / reason for replacement
        <textarea name="defect_details" rows={3} maxLength={5000}
          value={values.defect_details}
          onChange={(event) => set("defect_details", event.target.value)}
          className={field} />
      </label>
      <label className="block">
        {cancelled ? "Cancellation reason — required" : "Follow-up notes"}
        <textarea name="notes" rows={3} maxLength={5000} required={cancelled}
          value={values.notes}
          onChange={(event) => set("notes", event.target.value)}
          className={field} />
      </label>

      <p className="text-sm text-slate-600" aria-live="polite">
        {status === "waiting"
          ? "Waiting: availability and issue dates are not submitted."
          : status === "available"
          ? "Available: record when the part actually became available."
          : issued
          ? "Issued: availability and issue times are required. Part details lock after saving; the MIV number can be added later."
          : "Cancelled: explain why the part is no longer required. Saving locks this record."}
        {" "}Use actual dates in chronological order.
      </p>
      {initial.status === "available" && status === "waiting" && (
        <p role="alert" className="text-sm text-amber-800">
          Returning to Waiting clears the saved availability date.
        </p>
      )}
      <SaveButton existing={existing} />
    </form>
  );
}
