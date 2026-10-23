
"use client";

import { forgotPasswordText } from "@/utils/forgotPasswordTranslations";
import { isLoginLanguage, type LoginLanguage } from "@/utils/loginTranslations";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { supabase } from "../connection-test/supabase";

export default function ForgotPasswordPage() {
  const [language, setLanguage] = useState<LoginLanguage>("en");
  const t = (text: string) => forgotPasswordText(language, text);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    setLoading(false);

    if (error) {
      setMessage(
        "Unable to send recovery email. Please try again later or contact your administrator."
      );
      return;
    }

    setMessage(
      "If this email belongs to an account, a password recovery link will be sent."
    );
  }

  return (
    <main lang={language} className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">⚙️</div>
          <h1 className="text-2xl font-bold">NM PACKAGING</h1>
          <p className="mt-2 text-sm text-slate-600">{t("Maintenance Request Management System")}</p>
        </div>


        <div className="mb-6">
          <label htmlFor="recovery-language"
            className="mb-2 block text-sm font-medium text-slate-900">
            {t("Language")}
          </label>
          <select
            id="recovery-language"
            value={language}
            disabled={loading}
            onChange={(event) => {
              const next = event.target.value;
              if (isLoginLanguage(next)) setLanguage(next);
            }}
            className="w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900"
          >
            <option value="en">English</option>
            <option value="ms">Bahasa Melayu</option>
            <option value="zh">中文</option>
            <option value="ne">नेपाली</option>
          </select>
        </div>

        <h2 className="mb-5 text-xl font-semibold">{t("Forgot Password")}</h2>

        <p className="mb-5 text-sm text-slate-600">
          {t("If your account has no accessible email address, contact your administrator for a password reset.")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block mb-2 text-sm">{t("Registered Email Address")}</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border p-3"
              placeholder={t("Enter your registered email")}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-700 p-3 font-semibold text-white disabled:opacity-50"
          >
            {loading ? t("Sending...") : t("Send Recovery Email")}
          </button>

          {message && (
            <p role="status" className="text-sm text-blue-700">
              {t(message)}
            </p>
          )}
        </form>

        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="text-blue-700">{t("Return to Login")}</Link>
        </p>
      </div>
    </main>
  );
}