"use client";

import { signOut } from "@/app/auth/actions";
import { ThemeToggle } from "./ThemeToggle";
import { COUNTRY_OPTIONS, getBMICategory } from "@/lib/nutrition/recommendations";

type Props = {
  user: {
    id: string;
    email?: string;
    displayName?: string;
    timezone?: string;
    role?: "user" | "admin";
    dietaryPreference?: string;
    region?: string;
    country?: string;
    bmi?: number | null;
    heightCm?: number | null;
    weightKg?: number | null;
  } | null;
  configured: boolean;
};

export function SettingsView({ user, configured }: Props) {
  const countryObj = COUNTRY_OPTIONS.find(
    (c) => c.id === (user?.country || "").toLowerCase()
  );

  const bmiValue = user?.bmi ? Number(user.bmi) : null;
  const bmiInfo = bmiValue ? getBMICategory(bmiValue) : null;

  return (
    <div>
      <div className="stitch-console-header">
        <div>
          <div className="stitch-console-eyebrow">
            <span>PREFERENCES</span>
            <span>•</span>
            <span>Account & Health Baseline</span>
          </div>
          <h2 className="stitch-console-title">Account &amp; Health Settings</h2>
          <p style={{ fontSize: 13, color: "var(--on-surface-variant)", marginTop: 4 }}>
            Manage your personal profile, country dietary preferences, and personal health metrics.
          </p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Left Card: User Profile & Preferences */}
        <article className="stitch-module-card" style={{ padding: "24px" }}>
          <div className="stitch-card-top" style={{ marginBottom: 12 }}>
            <div className="stitch-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span className="stitch-card-badge">
              {user?.role === "admin" ? "Administrator" : "Personal Account"}
            </span>
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
              <span className="info-block-label">Country Cuisine Preference</span>
              <span className="info-block-value">
                {countryObj ? `${countryObj.flag} ${countryObj.label}` : "🌍 Global / International"}
              </span>
              <span className="info-block-desc">
                Automatically shapes whole food recommendations and authentic meal ideas.
              </span>
            </div>

            <div className="info-block">
              <span className="info-block-label">Dietary Focus</span>
              <span className="info-block-value capitalize">
                {user?.dietaryPreference ? user.dietaryPreference.replace("_", " ") : "Mediterranean & Balanced"}
              </span>
              <span className="info-block-desc">
                Sets default macronutrient distribution and nutritional guidelines.
              </span>
            </div>

            <div className="info-block">
              <span className="info-block-label">Timezone Basis</span>
              <span className="info-block-value">
                {user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"}
              </span>
              <span className="info-block-desc">
                Daily meal plans and consumption logs track on this local day boundary.
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

        {/* Right Card: Body Metrics & Data Privacy */}
        <article className="stitch-module-card" style={{ padding: "24px" }}>
          <div className="stitch-card-top" style={{ marginBottom: 12 }}>
            <div className="stitch-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </div>
            <span className="stitch-card-badge">
              Health Baseline
            </span>
          </div>

          <h3 className="stitch-card-title" style={{ fontSize: 16, marginBottom: 14 }}>Body Metrics (BMI)</h3>

          <div>
            <div className="info-block">
              <span className="info-block-label">Height &amp; Weight</span>
              <span className="info-block-value">
                {user?.heightCm && user?.weightKg
                  ? `${user.heightCm} cm • ${user.weightKg} kg`
                  : "Not provided during sign up"}
              </span>
            </div>

            <div className="info-block">
              <span className="info-block-label">Body Mass Index (BMI)</span>
              {bmiValue && bmiInfo ? (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 22, fontWeight: 700, fontFamily: "monospace", color: "var(--on-surface)" }}>
                      {bmiValue}
                    </span>
                    <span
                      style={{
                        padding: "2px 10px",
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
                        backgroundColor: bmiInfo.bgLight,
                        color: bmiInfo.color,
                      }}
                    >
                      {bmiInfo.label}
                    </span>
                  </div>
                  <div className="info-block-desc" style={{ marginTop: 4 }}>
                    {bmiInfo.desc}
                  </div>
                </div>
              ) : (
                <span className="info-block-value text-muted" style={{ fontSize: 13, fontWeight: "normal" }}>
                  Set your height and weight on registration to calculate your baseline BMI.
                </span>
              )}
            </div>

            <div className="info-block" style={{ marginTop: 16 }}>
              <span className="info-block-label">Informational Health Note</span>
              <div className="info-block-desc" style={{ marginTop: 4 }}>
                BMI is an informational reference metric for personal dietary context. It does not replace clinical body composition analysis or medical consultation.
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border-subtle)", marginTop: 18, paddingTop: 16 }}>
              <div className="stitch-console-eyebrow" style={{ marginBottom: 8 }}>
                <span>DATA PRIVACY & STORAGE</span>
              </div>
              <div className="db-status-row" style={{ alignItems: "center" }}>
                <span
                  className="db-status-pill"
                  style={{
                    backgroundColor: configured ? "#1b6b52" : "#d89b66",
                    boxShadow: configured ? "0 0 8px #9de9c9" : "none",
                  }}
                />
                <div>
                  <div className="info-block-value" style={{ fontSize: 13 }}>
                    {configured ? "Cloud Data Storage Active" : "Local Standalone Mode"}
                  </div>
                  <div className="info-block-desc">
                    All meals, custom recipes, and dietary logs are strictly private to your authenticated account.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
