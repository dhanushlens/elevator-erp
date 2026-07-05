"use client";

import { useState } from "react";
import Link from "next/link";
import { api, apiErrorMessage } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setMessage(res.data.message);
      if (res.data.resetUrl) setResetUrl(res.data.resetUrl);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {message && (
        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300">
          {message}
          {resetUrl && (
            <p className="mt-2 break-all">
              Dev reset link:{" "}
              <a href={resetUrl} className="font-medium underline">
                {resetUrl}
              </a>
            </p>
          )}
        </div>
      )}
      {error && (
        <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:bg-rose-900/20 dark:text-rose-300">
          {error}
        </div>
      )}
      <div>
        <label className="label">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="input"
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Sending..." : "Send reset link"}
      </button>
      <p className="text-center text-sm text-slate-500">
        <Link href="/login" className="font-medium text-aqua-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
