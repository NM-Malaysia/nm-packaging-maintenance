
"use client";

import { loginText, isLoginLanguage, type LoginLanguage } from "@/utils/loginTranslations";
import { useState, type FormEvent } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [language, setLanguage] = useState<LoginLanguage>("en");
  const t = (text: string) => loginText(language, text);
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!employeeId.trim() || !password) {
      setMessage("Please enter your Employee ID and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/employee-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          employeeId: employeeId.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "Login failed.");
        return;
      }

      // Login successful: server has set Supabase session cookies.
      setPassword("");
      window.location.assign("/");
    } catch {
      setMessage("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main lang={language} className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <div className="mb-4 text-5xl">⚙️</div>

          <h1 className="text-2xl font-bold text-slate-900">
            NM PACKAGING
          </h1>

          <p className="mt-2 text-sm text-slate-600">{t("Maintenance / Repair / Modification")}</p>

          <p className="text-sm text-slate-600">{t("Request Management System")}</p>
        </div>


        <div className="mb-6">
          <label htmlFor="login-language"
            className="mb-2 block text-sm font-medium text-slate-900">
            {t("Language")}
          </label>
          <select
            id="login-language"
            value={language}
            disabled={loading}
            onChange={(event) => {
              const next = event.target.value;
              if (isLoginLanguage(next)) setLanguage(next);
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900"
          >
            <option value="en">English</option>
            <option value="ms">Bahasa Melayu</option>
            <option value="zh">中文</option>
            <option value="ne">नेपाली</option>
          </select>
        </div>

        <h2 className="mb-6 text-xl font-semibold text-slate-900">{t("Employee Login")}</h2>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label
              htmlFor="employeeId"
              className="mb-2 block text-sm font-medium"
            >{t("Employee ID")}</label>

            <input
              id="employeeId"
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder={t("Enter Employee ID")}
              autoComplete="username"
              required
              disabled={loading}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium"
            >{t("Password")}</label>

            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("Enter Password")}
              autoComplete="current-password"
              required
              disabled={loading}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="mt-2 text-sm text-blue-700"
            >
              {showPassword ? t("Hide password") : t("Show password")}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
          >
            {loading ? t("Signing In...") : t("Sign In")}
          </button>

          <div className="text-center">
            <Link
              href="/forgot-password"
              className="text-sm text-blue-700 hover:underline"
            >{t("Forgot Password?")}</Link>
          </div>

          {message && (
            <p role="alert" className="text-sm text-red-700">
              {t(message)}
            </p>
          )}
        </form>

        <p className="mt-8 text-center text-xs text-slate-500">{t("Authorized NM PACKAGING employees only.")}<br />{t("Accounts are managed by the Administrator.")}</p>
      </div>
    </main>
  );
}