"use client";

import { requestFormText, type RequestFormLanguage } from "@/utils/requestFormTranslations";
import Link from "next/link";
import { useActionState, useState } from "react";
import { submitRequest, type RequestState } from "./actions";

export default function RequestForm({ name, department, language = "en" }: {
  name: string; department: string; language?: RequestFormLanguage;
}) {
  const t = (text: string, values: Record<string, string | number> = {}) =>
    requestFormText(language, text, values);
  const [state, action, pending] = useActionState<RequestState, FormData>(submitRequest, {});
  const [downtime, setDowntime] = useState(false);
  const input = "mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900";
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
          <input id="mrf_number" name="mrf_number" type="text" inputMode="numeric" pattern="[0-9]{5}" minLength={5} maxLength={5} required placeholder={t("e.g. 00125")} className={input} aria-describedby="mrf-help" />
          <p id="mrf-help" className="mt-2 text-sm text-slate-500">{t("Enter exactly five digits from your existing paper form.")}</p>
        </div>
        <div>
          <label htmlFor="machine_name" className="font-medium">{t("Machine / equipment *")}</label>
          <input id="machine_name" name="machine_name" required maxLength={200} placeholder={t("e.g. Fuji8")} className={input} />
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
          <label htmlFor="description" className="font-medium">{t("Maintenance / repair / modification details *")}</label>
          <textarea id="description" name="description" required maxLength={10000} rows={6} placeholder={t("Describe the fault, location and work required.")} className={input} />
        </div>
        <label className="flex items-center gap-3 font-medium">
          <input type="checkbox" name="downtime_applicable" checked={downtime} onChange={e => setDowntime(e.target.checked)} className="h-5 w-5" />
          {t("Machine / equipment downtime applies")}
        </label>
        {downtime && <div>
          <label htmlFor="downtime_started_at" className="font-medium">{t("Downtime started — Malaysia time (UTC+8) *")}</label>
          <input id="downtime_started_at" name="downtime_started_at" type="datetime-local" required step={60} className={input} />
        </div>}
        {state.error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">{t(state.error)}</p>}
        <button type="submit" disabled={pending} className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white disabled:cursor-wait disabled:opacity-60">
          {pending ? t("Submitting…") : t("Submit maintenance request")}
        </button>
      </fieldset>
    </form>
  );
}
