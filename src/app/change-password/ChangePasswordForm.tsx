
"use client";

import { useState, type FormEvent } from "react";

export default function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading || completed) return;

    if (password.length < 12 || password.length > 128) {
      setMessage("Password must contain 12–128 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ password, confirmPassword }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "Password change failed.");
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setCompleted(true);
      setMessage("Password changed successfully. Please sign in again.");
    } catch {
      setMessage("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (completed) {
    return (
      <div className="mt-6 space-y-4">
        <p role="status" className="text-sm text-green-700">
          {message}
        </p>
        <a
          href="/login"
          className="block rounded-lg bg-blue-700 p-3 text-center font-semibold text-white"
        >
          Return to Login
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="newPassword" className="mb-2 block text-sm">
          New Password
        </label>
        <input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={12}
          maxLength={128}
          required
          disabled={loading}
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-2 block text-sm">
          Confirm New Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          minLength={12}
          maxLength={128}
          required
          disabled={loading}
          className="w-full rounded-lg border p-3"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-blue-700 p-3 font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Changing Password..." : "Change Password"}
      </button>

      {message && (
        <p role="alert" className="text-sm text-red-700">
          {message}
        </p>
      )}
    </form>
  );
}