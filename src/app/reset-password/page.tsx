
"use client";

import { resetPasswordText } from "@/utils/resetPasswordTranslations";
import { isLoginLanguage, type LoginLanguage } from "@/utils/loginTranslations";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../connection-test/supabase";

export default function ResetPasswordPage() {
  const [language, setLanguage] = useState<LoginLanguage>("en");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("nm-auth-language");
      if (saved && isLoginLanguage(saved)) setLanguage(saved);
    } catch {
      // Language selection still works if browser storage is unavailable.
    }
  }, []);

  const t = (text: string) => resetPasswordText(language, text);
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(
    "Verifying your password recovery link..."
  );
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let active = true;

    async function verifyRecovery() {
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = params.get("type");

      // Handle Supabase's token_hash recovery links.
      if (tokenHash && type === "recovery") {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });

        if (!active) return;

        // Remove recovery credentials from browser URL.
        window.history.replaceState(
          {},
          "",
          "/reset-password"
        );

        if (error) {
          setMessage("Recovery link expired or invalid. Request a new one.");
          return;
        }

        setReady(true);
        setMessage("");
        return;
      }

      // For legacy fragment-token links, Supabase JS
      // can detect and establish the session.
      const hash = window.location.hash;

      if (hash.includes("access_token=")) {
        const hashParams = new URLSearchParams(hash.slice(1));

        if (hashParams.get("type") !== "recovery") {
          setMessage("This is not a password recovery link.");
          return;
        }

        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        window.history.replaceState({}, "", "/reset-password");

        if (!accessToken || !refreshToken) {
          setMessage("Invalid recovery link.");
          return;
        }

        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!active) return;

        if (error) {
          setMessage("Recovery link expired or invalid.");
          return;
        }

        setReady(true);
        setMessage("");
        return;
      }

      setMessage("Open this page using a new password recovery email link.");
    }

    verifyRecovery();

    return () => {
      active = false;
    };
  }, []);

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!ready || loading) return;

    if (password.length < 12) {
      setMessage("Use a password with at least 12 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setCompleted(true);
    setPassword("");
    setConfirmPassword("");
    await supabase.auth.signOut();
    setMessage("Password updated successfully.");
    setLoading(false);
  }

  return (
    <main lang={language} className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">⚙️</div>
          <h1 className="text-2xl font-bold text-slate-900">
            NM PACKAGING
          </h1>
          <p className="mt-2 text-sm text-slate-600">{t("Maintenance Request Management System")}</p>
        </div>


        <div className="mb-6">
          <label htmlFor="reset-language"
            className="mb-2 block text-sm font-medium text-slate-900">
            {t("Language")}
          </label>
          <select
            id="reset-language"
            value={language}
            disabled={loading}
            onChange={(event) => {
              const next = event.target.value;
              if (isLoginLanguage(next)) {
                setLanguage(next);
                try {
                  window.localStorage.setItem("nm-auth-language", next);
                } catch {
                  // Keep the selected language for this page.
                }
              }
            }}
            className="w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900"
          >
            <option value="en">English</option>
            <option value="ms">Bahasa Melayu</option>
            <option value="zh">中文</option>
            <option value="ne">नेपाली</option>
          </select>
        </div>

        <h2 className="text-xl font-semibold mb-6">{t("Reset Password")}</h2>

        {completed ? (
          <button
            onClick={() => router.push("/login")}
            className="w-full rounded-lg bg-blue-700 p-3 text-white"
          >{t("Return to Login")}</button>
        ) : ready ? (
          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label className="block text-sm mb-2">{t("New Password")}</label>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={12}
                className="w-full rounded-lg border p-3"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">{t("Confirm New Password")}</label>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={12}
                className="w-full rounded-lg border p-3"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-700 p-3 font-semibold text-white disabled:opacity-50"
            >
              {loading ? t("Updating...") : t("Update Password")}
            </button>
          </form>
        ) : null}

        {message && (
          <p role="status" className="mt-5 text-sm text-blue-700">
            {t(message)}
          </p>
        )}
      </div>
    </main>
  );
}