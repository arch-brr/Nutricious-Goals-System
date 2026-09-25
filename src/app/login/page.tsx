"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { login, type AuthState } from "@/app/auth/actions";

const initialState: AuthState = {
  error: null,
  success: null,
};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState);
  const [clientError, setClientError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    setClientError(null);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)?.value;

    if (!email || !email.includes("@")) {
      e.preventDefault();
      setClientError("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 6) {
      e.preventDefault();
      setClientError("Password must be at least 6 characters.");
      return;
    }
  }

  const errorMessage = clientError || state?.error;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <header className="auth-header">
          <div className="brand">
            <span className="brand-mark">n</span>
            <span>
              nutricious<span className="brand-dot">.</span>
            </span>
          </div>
          <h1>Welcome back</h1>
          <p>Sign in to your personal nutrition workspace</p>
        </header>

        {errorMessage && (
          <div className="alert-box alert-error" role="alert" style={{ marginBottom: 18 }}>
            <span>⚠️</span>
            <div>{errorMessage}</div>
          </div>
        )}

        {state?.success && (
          <div className="alert-box alert-success" role="status" style={{ marginBottom: 18 }}>
            <span>✓</span>
            <div>{state.success}</div>
          </div>
        )}

        <form action={formAction} onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className="form-input"
              disabled={isPending}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="form-input"
              disabled={isPending}
            />
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isPending}
          >
            {isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="auth-toggle">
          Don&apos;t have an account yet?
          <Link href="/register">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
