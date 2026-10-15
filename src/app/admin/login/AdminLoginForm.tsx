"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { adminLogin, type AuthState } from "@/app/auth/actions";
import { ThemeToggle } from "@/components/ThemeToggle";

const initialAuthState: AuthState = {
  error: null,
  success: null,
};

export function AdminLoginForm() {
  const [state, formAction, isPending] = useActionState(adminLogin, initialAuthState);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="admin-login-card">
      {/* Security accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600" />

      <div className="admin-login-topbar">
        <div className="admin-login-brand">
          <div className="admin-login-icon-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase text-[var(--primary)]">
              GOVERNANCE PORTAL
            </div>
            <div className="text-base font-extrabold text-[var(--on-surface)]">
              Admin Console Login
            </div>
          </div>
        </div>
        <ThemeToggle />
      </div>

      <div className="admin-login-notice">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2, color: "var(--primary)" }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div>
          <strong className="text-[var(--on-surface)]">Restricted Access:</strong> Authorized administrative personnel only. System activity is logged and monitored for security.
        </div>
      </div>

      {state?.error && (
        <div className="stitch-alert stitch-alert-error mb-4" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{state.error}</span>
        </div>
      )}

      <form action={formAction} className="stitch-form">
        <div className="stitch-field-group">
          <label className="stitch-field-label" htmlFor="admin-email">
            Admin Email
          </label>
          <div className="stitch-field-icon-wrap">
            <span className="stitch-field-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </span>
            <input
              id="admin-email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="stitch-auth-input has-icon"
              disabled={isPending}
            />
          </div>
        </div>

        <div className="stitch-field-group">
          <label className="stitch-field-label" htmlFor="admin-password">
            Admin Password
          </label>
          <div className="stitch-field-icon-wrap">
            <span className="stitch-field-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input
              id="admin-password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your admin password"
              className="stitch-auth-input has-icon"
              disabled={isPending}
            />
            <button
              type="button"
              className="stitch-pwd-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="stitch-auth-submit-btn mt-3"
          disabled={isPending}
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <span className="auth-spinner" />
              <span>Verifying Credentials...</span>
            </span>
          ) : (
            "Authenticate Administrator"
          )}
        </button>
      </form>

      <div className="admin-login-footer">
        <Link href="/">
          ← Return to Public Nutricious Home
        </Link>
      </div>
    </div>
  );
}
