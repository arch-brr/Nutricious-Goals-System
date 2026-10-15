"use client";

import { signOut } from "@/app/auth/actions";
import { ThemeToggle } from "./ThemeToggle";

type Props = {
  user: {
    id: string;
    email?: string;
    displayName?: string;
    timezone?: string;
  } | null;
  configured: boolean;
};

export function SettingsView({ user, configured }: Props) {
  return (
    <div>
      <div className="stitch-console-header">
        <div>
          <div className="stitch-console-eyebrow">
            <span>PREFERENCES</span>
            <span>•</span>
            <span>Account & System</span>
          </div>
          <h2 className="stitch-console-title">Account &amp; App Settings</h2>
          <p style={{ fontSize: 13, color: "var(--on-surface-variant)", marginTop: 4 }}>
            Manage your personal profile, local timezone, and data persistence preferences.
          </p>
        </div>
      </div>

      <div className="settings-grid">
        <article className="stitch-module-card" style={{ padding: "24px" }}>
          <div className="stitch-card-top" style={{ marginBottom: 12 }}>
            <div className="stitch-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span className="stitch-card-badge">Personal Account</span>
          </div>

          <h3 className="stitch-card-title" style={{ fontSize: 16, marginBottom: 14 }}>User Profile</h3>

          <div>
            <div className="info-block">
              <span className="info-block-label">Display Name</span>
              <span className="info-block-value">{user?.displayName || "Not specified"}</span>
            </div>

            <div className="info-block">
              <span className="info-block-label">Email Address</span>
              <span className="info-block-value">{user?.email || "Local account"}</span>
            </div>

            <div className="info-block">
              <span className="info-block-label">Timezone Basis</span>
              <span className="info-block-value">
                {user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"}
              </span>
              <span className="info-block-desc">
                Plan dates and consumption logs calculate on this local day boundary.
              </span>
            </div>

            <div className="info-block" style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <span className="info-block-label">Appearance Theme</span>
                <div className="info-block-desc" style={{ marginTop: 2 }}>
                  Switch between calm Botanical Light and focused Dark Mode.
                </div>
              </div>
              <ThemeToggle showLabel className="has-label" />
            </div>
          </div>

          <form action={signOut} style={{ marginTop: 20 }}>
            <button
              type="submit"
              className="stitch-card-btn"
              style={{ width: "100%", justifyContent: "center", color: "#ba1a1a", borderColor: "#ffdad6" }}
            >
              <span>Sign Out of Nutricious</span>
            </button>
          </form>
        </article>

        <article className="stitch-module-card" style={{ padding: "24px" }}>
          <div className="stitch-card-top" style={{ marginBottom: 12 }}>
            <div className="stitch-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <span className="stitch-card-badge">
              {configured ? "Supabase Active" : "Prototype Mode"}
            </span>
          </div>

          <h3 className="stitch-card-title" style={{ fontSize: 16, marginBottom: 14 }}>Database &amp; Security</h3>

          <div>
            <div className="info-block" style={{ padding: "16px 14px" }}>
              <div className="db-status-row">
                <span
                  className="db-status-pill"
                  style={{
                    backgroundColor: configured ? "#1b6b52" : "#d89b66",
                    boxShadow: configured ? "0 0 8px #9de9c9" : "none",
                  }}
                />
                <div>
                  <div className="info-block-value">
                    {configured ? "Cloud PostgreSQL Connected" : "Local Standalone Mode"}
                  </div>
                  <div className="info-block-desc">
                    {configured
                      ? "Supabase Auth with cookie-based SSR sessions"
                      : "Configure NEXT_PUBLIC_SUPABASE_URL in environment"}
                  </div>
                </div>
              </div>
            </div>

            <div className="info-block">
              <span className="info-block-label">Row Level Security (RLS)</span>
              <div className="info-block-desc" style={{ marginTop: 4 }}>
                All foods, meal plans, items, and consumption logs are strictly protected in the data layer. Direct row isolation prevents cross-user access even if API parameters are modified.
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
