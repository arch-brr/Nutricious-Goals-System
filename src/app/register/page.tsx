"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signup, type AuthState } from "@/app/auth/actions";

const initialState: AuthState = {
  error: null,
  success: null,
};

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(signup, initialState);
  const [clientError, setClientError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    setClientError(null);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)?.value;
    const confirmPassword = (form.elements.namedItem("confirmPassword") as HTMLInputElement)?.value;

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

    if (password !== confirmPassword) {
      e.preventDefault();
      setClientError("Passwords do not match.");
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
          <h1>Create your account</h1>
          <p>Begin your mindful nutrition and meal planning journey</p>
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
            <label htmlFor="displayName">Your name or nickname</label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              autoComplete="name"
              placeholder="e.g. Samantha"
              className="form-input"
              disabled={isPending}
            />
          </div>

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
            <label htmlFor="password">Password (min. 6 characters)</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="••••••••"
              className="form-input"
              disabled={isPending}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
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
            {isPending ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <div className="auth-toggle">
          Already have an account?
          <Link href="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
