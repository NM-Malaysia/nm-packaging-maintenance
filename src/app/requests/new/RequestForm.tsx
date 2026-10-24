"use client";

import { requestFormText, type RequestFormLanguage } from "@/utils/requestFormTranslations";
import { requestCategoryText } from "@/utils/requestCategoryTranslations";
import Link from "next/link";
import { useActionState, useState } from "react";
import { submitRequest, type RequestState } from "./actions";

type Equipment = {
  id: string;
  machine_code: string;
  machine_name: string;
  location: string;
};

export default function RequestForm({
  name, department, language = "en", machines, equipmentError = false,
}: {
  name: string;
  department: string;
  language?: RequestFormLanguage;
  machines: Equipment[];
  equipmentError?: boolean;
}) {
  const t = (text: string, values: Record<string, string | number> = {}) => {
    const translated = requestCategoryText(language, text);
    return translated !== text ? translated : requestFormText(language, text, values);
  };
  const [state, action, pending] = useActionState<RequestState, FormData>(submitRequest, {});
  const [category, setCategory] = useState("equipment");
  const [machineId, setMachineId] = useState("");
  const [downtime, setDowntime] = useState(false);
  const equipment = category === "equipment";
  const selected = machines.find(machine => machine.id === machineId);
  const input = "mt-2 block min-w-0 w-full rounded-lg border border-slate-300 bg-white p-3 text-base text-slate-900";

  if (state.mrf) return (
    <section role="status" className="rounded-xl border border-green-200 bg-green-50 p-6 text-green-900">
      <h2 className="text-xl font-bold">{t("MRF {mrf} submitted", { mrf: state.mrf })}</h2>
      <p className="mt-2">{t("Your maintenance request has been recorded with status Submitted.")}</p>
      <div className="mt-5 flex flex-wrap gap-5">
        <a href="/requests/new" className="font-semibold underline">{t("Submit another request")}</a>
        <Link href="/" className="underline">{t("Back to dashboard")}</Link>
      </div>
    </section>
  );

  return (
    <form action={action} className="space-y-6 rounded-xl bg-white p-6 shadow-sm">
      <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
        <p><strong>{t("Requestor:")}</strong> {name}</p>
        <p className="mt-1"><strong>{t("Department:")}</strong> {department}</p>
        <p className="mt-2">{t("Submission date and time are recorded automatically.")}</p>
      </div>
      <fieldset disabled={pending} className="space-y-5 disabled:opacity-60">
        <legend className="sr-only">{t("Maintenance request details")}</legend>
        <div>
          <label htmlFor="mrf_number" className="font-medium">{t("Paper MRF number *")}</label>
          <input id="mrf_number" name="mrf_number" type="text" inputMode="numeric"
            pattern="[0-9]{5}" minLength={5} maxLength={5} required
            placeholder={t("e.g. 00125")} className={input} aria-describedby="mrf-help" />
          <p id="mrf-help" className="mt-2 text-sm text-slate-500">
            {t("Enter exactly five digits from your existing paper form.")}
          </p>
        </div>

        <div>
          <label htmlFor="work_category" className="font-medium">{t("Work category *")}</label>
          <select id="work_category" name="work_category" value={category} required
            className={input} onChange={event => {
              setCategory(event.target.value);
              setDowntime(false);
            }}>
            <option value="equipment">{t("Machine / Equipment")}</option>
            <option value="facilities">{t("Building / Facilities")}</option>
            <option value="other">{t("Other Maintenance Work")}</option>
          </select>
        </div>

        {equipment ? (
          <div>
            <label htmlFor="machine_id" className="font-medium">
              {t("Registered equipment *")}
            </label>
            <select id="machine_id" name="machine_id" required value={machineId}
              className={input} disabled={equipmentError || !machines.length}
              onChange={event => setMachineId(event.target.value)}>
              <option value="" disabled>{t("Select equipment")}</option>
              {machines.map(machine => (
                <option key={machine.id} value={machine.id}>
                  {machine.machine_code} · {machine.machine_name}
                  {machine.location ? " · " + machine.location : ""}
                </option>
              ))}
            </select>
            {equipmentError ? (
              <p role="alert" className="mt-2 text-sm text-red-700">
                {t("Equipment could not be loaded. Refresh and try again.")}
              </p>
            ) : !machines.length ? (
              <p className="mt-2 text-sm text-amber-800">
                {t("No active equipment is registered. Contact Admin or Maintenance Supervisor.")}
              </p>
            ) : null}
            {selected?.location && (
              <p className="mt-2 text-sm text-slate-600">
                {t("Registered location:")} {selected.location}
              </p>
            )}
          </div>
        ) : (
          <div>
            <label htmlFor="machine_name" className="font-medium">
              {t("Work subject *")}
            </label>
            <input id="machine_name" name="machine_name" required maxLength={200}
              placeholder={t("For example: Office roof leak")} className={input} />
          </div>
        )}

        <div>
          <label htmlFor="work_location" className="font-medium">
            {t(equipment ? "Work location — optional" : "Work location *")}
          </label>
          <input id="work_location" name="work_location" required={!equipment}
            maxLength={200} className={input}
            placeholder={t("For example: Printing area / office / toilet")} />
          {equipment && (
            <p className="mt-2 text-sm text-slate-500">
              {t("Leave blank to use the registered equipment location.")}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="request_type" className="font-medium">{t("Request type *")}</label>
          <select id="request_type" name="request_type" required defaultValue="" className={input}>
            <option value="" disabled>{t("Select request type")}</option>
            <option value="repair">{t("Repair")}</option>
            <option value="maintenance">{t("Maintenance")}</option>
            <option value="modification">{t("Modification")}</option>
          </select>
        </div>
        <div>
          <label htmlFor="description" className="font-medium">
            {t("Maintenance / repair / modification details *")}
          </label>
          <textarea id="description" name="description" required maxLength={10000}
            rows={6} placeholder={t("Describe the fault, location and work required.")}
            className={input} />
        </div>

        {equipment && (
          <>
            <label className="flex items-center gap-3 font-medium">
              <input type="checkbox" name="downtime_applicable" checked={downtime}
                onChange={event => setDowntime(event.target.checked)} className="h-5 w-5" />
              {t("Machine / equipment downtime applies")}
            </label>
            {downtime && (
              <div>
                <label htmlFor="downtime_started_at" className="font-medium">
                  {t("Downtime started — Malaysia time (UTC+8) *")}
                </label>
                <input id="downtime_started_at" name="downtime_started_at"
                  type="datetime-local" required step={60} className={input} />
              </div>
            )}
          </>
        )}
        {state.error && (
          <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">{t(state.error)}</p>
        )}
        <button type="submit"
          disabled={pending || (equipment && (equipmentError || !machines.length))}
          className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
          {pending ? t("Submitting…") : t("Submit maintenance request")}
        </button>
      </fieldset>
    </form>
  );
}
