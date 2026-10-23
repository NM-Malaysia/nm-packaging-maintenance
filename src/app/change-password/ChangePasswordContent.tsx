"use client";

import { useEffect, useState } from "react";
import { isLoginLanguage, type LoginLanguage } from "@/utils/loginTranslations";
import { changePasswordText } from "@/utils/changePasswordTranslations";
import ChangePasswordForm from "./ChangePasswordForm";

export default function ChangePasswordContent({ name }: { name: string }) {
  const [language, setLanguage] = useState<LoginLanguage>("en");
  const t = (text: string) => changePasswordText(language, text);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("nm-auth-language");
      if (saved && isLoginLanguage(saved)) setLanguage(saved);
    } catch {
      // The selector remains available when browser storage is unavailable.
    }
  }, []);

  return (
    <div lang={language} className="text-slate-900">
      <div className="mb-6 text-center">
        <div className="mb-4 text-5xl">🔐</div>
        <h1 className="text-2xl font-bold">NM PACKAGING</h1>
        <p className="mt-2 text-sm text-slate-600">
          {t("Maintenance Request Management System")}
        </p>
      </div>

      <label htmlFor="change-password-language" className="mb-2 block text-sm font-medium">
        {t("Language")}
      </label>
      <select
        id="change-password-language"
        value={language}
        onChange={(event) => {
          const next = event.target.value;
          if (isLoginLanguage(next)) {
            setLanguage(next);
            try {
              window.localStorage.setItem("nm-auth-language", next);
            } catch {
              // Keep the language selected on this page.
            }
          }
        }}
        className="mb-6 w-full rounded-lg border border-slate-300 bg-white p-3 text-base text-slate-900"
      >
        <option value="en">English</option>
        <option value="ms">Bahasa Melayu</option>
        <option value="zh">中文</option>
        <option value="ne">नेपाली</option>
      </select>

      <h2 className="mb-3 text-xl font-semibold">
        {t("Change Temporary Password")}
      </h2>
      <p className="mb-4 text-sm text-slate-600">
        {t("Welcome")}, {name}.
      </p>
      <p className="text-sm text-slate-600">
        {t("Your account requires a password change before you can access the Maintenance Dashboard.")}
      </p>
      <ChangePasswordForm language={language} />
    </div>
  );
}
