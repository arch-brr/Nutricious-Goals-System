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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    setClientError(null);
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
    <main className="stitch-auth-page">
      {/* Ambient background glow spots matching Stitch reference */}
      <div className="stitch-auth-glow-1" />
      <div className="stitch-auth-glow-2" />

      <div className="stitch-auth-card">
        {/* ================================================================= */}
        {/* LEFT PANEL: Brand & Immersion (lg:col-span-5 in Stitch reference) */}
        {/* ================================================================= */}
        <div className="stitch-auth-sidebar">
          {/* Subtle curved biophilic background overlay */}
          <div className="stitch-auth-sidebar-bg-curve" aria-hidden="true">
            <svg viewBox="0 0 400 600" fill="none" className="w-full h-full">
              <path
                d="M-50 150 C 120 180, 220 50, 420 180 C 450 200, 380 480, 100 520 Z"
                fill="currentColor"
              />
              <circle cx="320" cy="110" r="140" fill="currentColor" />
            </svg>
          </div>

          {/* Top Branding Pill */}
          <div className="stitch-auth-brand-wrap">
            <div className="stitch-auth-brand-mark">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
            </div>
            <div>
              <span className="stitch-auth-brand-title block">Nutricious</span>
              <span className="stitch-auth-brand-sub block">Goals Platform</span>
            </div>
          </div>

          {/* Mid Narrative & Micro Metric */}
          <div className="stitch-auth-narrative">
            <div className="stitch-auth-status-pill">
              <span className="w-2 h-2 rounded-full bg-[var(--tertiary-fixed)] animate-pulse" />
              Mindful Nutrition &amp; Wellness
            </div>

            <h1 className="stitch-auth-hero-heading">
              Harmonize your vitality with conscious intake.
            </h1>

            <p className="stitch-auth-hero-desc">
              Access individualized macro schedules, dynamic nutrient trajectories, and mindful holistic meal orchestration designed for sustainable wellness.
            </p>

            {/* Dynamic Micro-Badge Card */}
            <div className="stitch-auth-micro-card">
              <div className="stitch-auth-micro-header">
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                  </svg>
                  Hydration &amp; Botanical Balance
                </span>
                <span className="font-bold text-[var(--primary-fixed)]">92%</span>
              </div>
              <div className="stitch-auth-micro-bar">
                <div className="stitch-auth-micro-fill" style={{ width: "92%" }} />
              </div>
            </div>
          </div>

          {/* Bottom Security / Credential */}
          <div className="stitch-auth-sidebar-foot">
            <div className="stitch-auth-shield-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div>
              <div className="stitch-auth-shield-title">Private &amp; Secure</div>
              <div className="stitch-auth-shield-desc">Encrypted User Data Protection</div>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* RIGHT PANEL: Auth Center (lg:col-span-7 in Stitch reference)       */}
        {/* ================================================================== */}
        <div className="stitch-auth-main">
          <div>
            {/* Top Switcher & Header */}
            <div className="stitch-auth-header-row">
              <div>
                <span className="stitch-auth-kicker">PORTAL AUTHENTICATION</span>
                <h2 className="stitch-auth-title">Welcome Back</h2>
              </div>

              {/* Mode Toggle Switcher */}
              <div className="stitch-auth-toggle-pill" role="tablist" aria-label="Authentication modes">
                <span className="stitch-auth-toggle-btn active" role="tab" aria-selected="true">
                  Sign In
                </span>
                <Link href="/register" className="stitch-auth-toggle-btn" role="tab" aria-selected="false">
                  Sign Up
                </Link>
              </div>
            </div>

            <p className="stitch-auth-subtitle">
              Simplify your nutrition, log mindful meals, and stay aligned with your seasonal goals.
            </p>

            {/* Error and Success Alerts */}
            {errorMessage && (
              <div className="stitch-alert stitch-alert-error" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div>{errorMessage}</div>
              </div>
            )}

            {state?.success && (
              <div className="stitch-alert stitch-alert-success" role="status">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <div>{state.success}</div>
              </div>
            )}

            {/* Authentication Form */}
            <form action={formAction} onSubmit={handleSubmit} className="stitch-form" noValidate>
              {/* Username / Email Field */}
              <div className="stitch-field-group">
                <label className="stitch-field-label" htmlFor="email">
                  Username or Registered Email
                </label>
                <div className="stitch-input-container">
                  <span className="stitch-input-icon" aria-hidden="true">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <circle cx="12" cy="12" r="4" />
                      <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
                    </svg>
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="samantha@nutricious.io"
                    className="stitch-auth-input"
                    disabled={isPending}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="stitch-field-group">
                <div className="stitch-field-label-row">
                  <label className="stitch-field-label" htmlFor="password">
                    Account Password
                  </label>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      setClientError("Password reset is managed by your administrator.");
                    }}
                    className="text-[12px] text-[var(--secondary)] font-medium hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="stitch-input-container">
                  <span className="stitch-input-icon" aria-hidden="true">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="stitch-auth-input"
                    disabled={isPending}
                  />
                  <button
                    type="button"
                    className="stitch-pwd-toggle"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Options Row */}
              <div className="stitch-options-row">
                <label className="stitch-checkbox-label">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded text-primary focus:ring-0 accent-primary cursor-pointer"
                  />
                  <span>Keep me authenticated for 30 days</span>
                </label>
                <span className="stitch-tls-badge">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--tertiary)]" />
                  Encrypted Connection
                </span>
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                className="stitch-auth-submit-btn"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Access Wellness Dashboard</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer / Disclaimers / Legal */}
          <div className="stitch-auth-footer">
            <div className="stitch-auth-links-row">
              <div className="flex items-center gap-3">
                <a href="#privacy">Privacy Policy</a>
                <span>•</span>
                <a href="#terms">Terms of Service</a>
                <span>•</span>
                <a href="#disclosures">Nutrition Disclosures</a>
              </div>
              <span className="text-[10px] text-outline font-mono">v4.8.2-prod</span>
            </div>

            <p className="stitch-auth-disclaimer">
              *Disclaimer: The Nutricious Goals System provides nutritional analytics and lifestyle tracking for educational and dietary empowerment. Consult a registered dietitian or licensed healthcare provider before making major dietary changes.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
