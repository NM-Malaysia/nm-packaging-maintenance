
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { supabase } from "../connection-test/supabase";

export default function ForgotPasswordPage() {
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
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">⚙️</div>
          <h1 className="text-2xl font-bold">NM PACKAGING</h1>
          <p className="mt-2 text-sm text-slate-600">
            Maintenance Request Management System
          </p>
        </div>

        <h2 className="mb-5 text-xl font-semibold">
          Forgot Password
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block mb-2 text-sm">
              Registered Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border p-3"
              placeholder="Enter your registered email"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-700 p-3 font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Recovery Email"}
          </button>

          {message && (
            <p role="status" className="text-sm text-blue-700">
              {message}
            </p>
          )}
        </form>

        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="text-blue-700">
            Return to Login
          </Link>
        </p>
      </div>
    </main>
  );
}