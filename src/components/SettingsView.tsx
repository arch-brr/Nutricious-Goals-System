"use client";

import { useState } from "react";
import { signOut } from "@/app/auth/actions";
import { updateUserProfile } from "@/app/actions/profile";
import { ThemeToggle } from "./ThemeToggle";
import {
  COUNTRY_OPTIONS,
  DIETARY_PREFERENCES,
  HEALTH_CONDITIONS,
  calculateBMI,
  getBMICategory,
} from "@/lib/nutrition/recommendations";

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
    healthCondition?: string;
    bmi?: number | null;
    heightCm?: number | null;
    weightKg?: number | null;
  } | null;
  configured: boolean;
};

export function SettingsView({ user, configured }: Props) {
  // Editable State
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [heightCm, setHeightCm] = useState<string>(
    user?.heightCm ? String(user.heightCm) : ""
  );
  const [weightKg, setWeightKg] = useState<string>(
    user?.weightKg ? String(user.weightKg) : ""
  );
  const [bmiInput, setBmiInput] = useState<string>(
    user?.bmi ? String(user.bmi) : ""
  );
  const [country, setCountry] = useState(user?.country || "philippines");
  const [dietaryPreference, setDietaryPreference] = useState(
    user?.dietaryPreference || "asian_pacific"
  );
  const [healthCondition, setHealthCondition] = useState(
    user?.healthCondition || "proper_diet"
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Auto-calculated BMI based on height & weight
  const autoCalculatedBMI = (() => {
    const h = parseFloat(heightCm);
    const w = parseFloat(weightKg);
    if (!isNaN(h) && !isNaN(w) && h > 40 && w > 20) {
      return calculateBMI(h, w);
    }
    return null;
  })();

  // Effective BMI: either auto-calculated or direct user input
  const currentBMIValue = parseFloat(bmiInput) || autoCalculatedBMI || null;
  const currentBMICategory = currentBMIValue ? getBMICategory(currentBMIValue) : null;

  // Handle Height change: recalculate BMI
  const handleHeightChange = (val: string) => {
    setHeightCm(val);
    const h = parseFloat(val);
    const w = parseFloat(weightKg);
    if (!isNaN(h) && !isNaN(w) && h > 40 && w > 20) {
      setBmiInput(String(calculateBMI(h, w)));
    }
  };

  // Handle Weight change: recalculate BMI
  const handleWeightChange = (val: string) => {
    setWeightKg(val);
    const h = parseFloat(heightCm);
    const w = parseFloat(val);
    if (!isNaN(h) && !isNaN(w) && h > 40 && w > 20) {
      setBmiInput(String(calculateBMI(h, w)));
    }
  };

  // Save changes handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    const hNum = parseFloat(heightCm);
    const wNum = parseFloat(weightKg);
    const bmiNum = parseFloat(bmiInput) || (autoCalculatedBMI ?? null);

    try {
      const res = await updateUserProfile({
        displayName: displayName.trim(),
        heightCm: !isNaN(hNum) && hNum > 0 ? hNum : null,
        weightKg: !isNaN(wNum) && wNum > 0 ? wNum : null,
        bmi: bmiNum,
        country,
        dietaryPreference,
        healthCondition,
      });

      if (res.success) {
        setSaveSuccess("Profile and health metrics saved successfully!");
      } else {
        setSaveError(res.error || "Failed to update profile.");
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error updating profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const activeHealth = HEALTH_CONDITIONS.find((h) => h.id === healthCondition) || HEALTH_CONDITIONS[0];

  return (
    <div>
      <div className="stitch-console-header">
        <div>
          <div className="stitch-console-eyebrow">
            <span>PREFERENCES</span>
            <span>•</span>
            <span>Account &amp; Health Baseline</span>
          </div>
          <h2 className="stitch-console-title">Account &amp; Health Settings</h2>
          <p style={{ fontSize: 13, color: "var(--on-surface-variant)", marginTop: 4 }}>
            Update your display name, body metrics (BMI), health baseline, and personalized diet targets.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="stitch-alert stitch-alert-success" style={{ marginBottom: 16 }} role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <div>{saveSuccess}</div>
        </div>
      )}

      {saveError && (
        <div className="stitch-alert stitch-alert-error" style={{ marginBottom: 16 }} role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>{saveError}</div>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="settings-grid">
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

          <h3 className="stitch-card-title" style={{ fontSize: 16, marginBottom: 14 }}>
            Profile &amp; Preferences
          </h3>

          <div>
            {/* Display Name Edit */}
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label htmlFor="settings-display-name" className="info-block-label" style={{ display: "block", marginBottom: 4 }}>
                Display Name *
              </label>
              <input
                id="settings-display-name"
                type="text"
                className="form-input"
                placeholder="e.g. Maria Santos"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>

            {/* Email Address Read-only */}
            <div className="info-block" style={{ marginBottom: 14 }}>
              <span className="info-block-label">Email Address</span>
              <span className="info-block-value">{user?.email || "Local account"}</span>
            </div>

            {/* Country Cuisine Preference */}
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label htmlFor="settings-country" className="info-block-label" style={{ display: "block", marginBottom: 4 }}>
                Country Cuisine Preference
              </label>
              <select
                id="settings-country"
                className="form-select"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.flag} {c.label}
                  </option>
                ))}
              </select>
              <span className="info-block-desc" style={{ marginTop: 4, display: "block" }}>
                Shapes native dish suggestions (e.g. Tosilog, Sinigang, Tinola).
              </span>
            </div>

            {/* Dietary Focus */}
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label htmlFor="settings-diet" className="info-block-label" style={{ display: "block", marginBottom: 4 }}>
                Dietary Focus
              </label>
              <select
                id="settings-diet"
                className="form-select"
                value={dietaryPreference}
                onChange={(e) => setDietaryPreference(e.target.value)}
              >
                {DIETARY_PREFERENCES.map((dp) => (
                  <option key={dp.id} value={dp.id}>
                    {dp.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Theme Toggle */}
            <div className="info-block" style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
              <div>
                <span className="info-block-label">Appearance Theme</span>
                <div className="info-block-desc" style={{ marginTop: 2 }}>
                  Switch between Botanical Light and Dark Mode.
                </div>
              </div>
              <ThemeToggle showLabel className="has-label" />
            </div>
          </div>

          <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
            <button
              type="submit"
              disabled={isSaving}
              className="add-button"
              style={{ flex: 1, height: 42, justifyContent: "center" }}
            >
              {isSaving ? "Saving Changes..." : "✓ Save Profile Changes"}
            </button>
          </div>
        </article>

        {/* Right Card: Health Baseline & Body Metrics (BMI) */}
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

          <h3 className="stitch-card-title" style={{ fontSize: 16, marginBottom: 14 }}>
            Health Baseline &amp; BMI
          </h3>

          <div>
            {/* Health Condition / Illness Selector */}
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label htmlFor="settings-health-condition" className="info-block-label" style={{ display: "block", marginBottom: 4 }}>
                Health Condition / Specific Focus
              </label>
              <select
                id="settings-health-condition"
                className="form-select"
                value={healthCondition}
                onChange={(e) => setHealthCondition(e.target.value)}
              >
                {HEALTH_CONDITIONS.map((hc) => (
                  <option key={hc.id} value={hc.id}>
                    {hc.label}
                  </option>
                ))}
              </select>

              {/* Live Macro Breakdown Pill Box */}
              <div style={{ marginTop: 8, padding: 10, borderRadius: 10, backgroundColor: "var(--surface-container)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: 11, color: "var(--on-surface-variant)", marginBottom: 6 }}>
                  {activeHealth.description}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, backgroundColor: "var(--tertiary-container)", color: "var(--on-tertiary-container)" }}>
                    🍞 Carbs: {activeHealth.macroRatios.carbs}%
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, backgroundColor: "var(--secondary-container)", color: "var(--on-secondary-container)" }}>
                    🥑 Fats: {activeHealth.macroRatios.fat}%
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, backgroundColor: "var(--primary-container)", color: "var(--on-primary-container)" }}>
                    🍗 Protein: {activeHealth.macroRatios.protein}%
                  </span>
                </div>
              </div>
            </div>

            {/* Editable Height and Weight Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div className="form-group">
                <label htmlFor="settings-height" className="info-block-label" style={{ display: "block", marginBottom: 4 }}>
                  Height (cm)
                </label>
                <input
                  id="settings-height"
                  type="number"
                  step="0.1"
                  className="form-input"
                  placeholder="e.g. 165"
                  value={heightCm}
                  onChange={(e) => handleHeightChange(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="settings-weight" className="info-block-label" style={{ display: "block", marginBottom: 4 }}>
                  Weight (kg)
                </label>
                <input
                  id="settings-weight"
                  type="number"
                  step="0.1"
                  className="form-input"
                  placeholder="e.g. 62"
                  value={weightKg}
                  onChange={(e) => handleWeightChange(e.target.value)}
                />
              </div>
            </div>

            {/* Direct Editable BMI */}
            <div className="form-group" style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <label htmlFor="settings-bmi" className="info-block-label">
                  Body Mass Index (BMI)
                </label>
                {currentBMICategory && (
                  <span
                    style={{
                      padding: "2px 10px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                      backgroundColor: currentBMICategory.bgLight,
                      color: currentBMICategory.color,
                    }}
                  >
                    {currentBMICategory.label}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  id="settings-bmi"
                  type="number"
                  step="0.1"
                  className="form-input"
                  style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace" }}
                  placeholder="e.g. 22.4"
                  value={bmiInput}
                  onChange={(e) => setBmiInput(e.target.value)}
                />
                {autoCalculatedBMI && (
                  <button
                    type="button"
                    onClick={() => setBmiInput(String(autoCalculatedBMI))}
                    className="stitch-card-btn"
                    style={{ fontSize: 11, padding: "6px 10px", height: "auto", whiteSpace: "nowrap" }}
                  >
                    Auto ({autoCalculatedBMI})
                  </button>
                )}
              </div>
              {currentBMICategory && (
                <div className="info-block-desc" style={{ marginTop: 6 }}>
                  {currentBMICategory.desc}
                </div>
              )}
            </div>

            {/* Informational Health Disclaimer */}
            <div className="info-block" style={{ marginTop: 12 }}>
              <span className="info-block-label">Informational Health Notice</span>
              <div className="info-block-desc" style={{ marginTop: 4 }}>
                Nutrition summaries and BMI calculations are strictly informational for personal dietary tracking. They do not constitute clinical diagnosis or medical treatment advice.
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border-subtle)", marginTop: 18, paddingTop: 14 }}>
              <form action={signOut}>
                <button
                  type="submit"
                  className="stitch-card-btn"
                  style={{ width: "100%", justifyContent: "center", color: "#ba1a1a", borderColor: "#ffdad6" }}
                >
                  <span>Sign Out of Nutricious</span>
                </button>
              </form>
            </div>
          </div>
        </article>
      </form>
    </div>
  );
}
