"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { login, signup, type AuthState } from "@/app/auth/actions";
import { ThemeToggle } from "./ThemeToggle";
import {
  DIETARY_PREFERENCES,
  COUNTRY_OPTIONS,
  HEALTH_CONDITIONS,
  getAutomatedDietForCountry,
  calculateBMI,
  getBMICategory,
} from "@/lib/nutrition/recommendations";

type Props = {
  initialAuthMode?: "none" | "login" | "register";
  configured?: boolean;
};

const initialAuthState: AuthState = {
  error: null,
  success: null,
};

type DietPreset = {
  id: string;
  name: string;
  tagline: string;
  calories: number;
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
};

const DIET_PRESETS: DietPreset[] = [
  {
    id: "balanced",
    name: "Gentle Vitality",
    tagline: "Balanced Mediterranean baseline",
    calories: 2000,
    proteinPct: 25,
    carbsPct: 50,
    fatPct: 25,
  },
  {
    id: "protein",
    name: "Active Botanical",
    tagline: "Higher protein for movement & repair",
    calories: 2250,
    proteinPct: 30,
    carbsPct: 45,
    fatPct: 25,
  },
  {
    id: "mindful",
    name: "Mindful Low-Carb",
    tagline: "Sustained satiety with healthy fats",
    calories: 1850,
    proteinPct: 30,
    carbsPct: 25,
    fatPct: 45,
  },
];

type DemoMeal = {
  id: string;
  slot: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  consumed: boolean;
};

const INITIAL_DEMO_MEALS: DemoMeal[] = [
  {
    id: "m-1",
    slot: "Breakfast",
    name: "Avocado Sourdough & Poached Egg",
    portion: "1 serving (185g)",
    calories: 360,
    protein: 15,
    carbs: 34,
    fat: 19,
    fiber: 7,
    consumed: true,
  },
  {
    id: "m-2",
    slot: "Lunch",
    name: "Wild Salmon & Quinoa Harvest Bowl",
    portion: "1 bowl (340g)",
    calories: 540,
    protein: 42,
    carbs: 48,
    fat: 20,
    fiber: 8,
    consumed: true,
  },
  {
    id: "m-3",
    slot: "Dinner",
    name: "Herb-Roasted Tempeh & Sweet Potato",
    portion: "1 plate (310g)",
    calories: 480,
    protein: 32,
    carbs: 52,
    fat: 16,
    fiber: 11,
    consumed: false,
  },
  {
    id: "m-4",
    slot: "Snack",
    name: "Greek Yogurt with Berries & Hemp Seeds",
    portion: "1 cup (210g)",
    calories: 230,
    protein: 20,
    carbs: 18,
    fat: 9,
    fiber: 4,
    consumed: false,
  },
];

export function InteractiveFrontpage({
  initialAuthMode = "none",
  configured = true,
}: Props) {
  // Auth Modal/Tab state
  const [authMode, setAuthMode] = useState<"none" | "login" | "register">(initialAuthMode);
  const [loginState, loginAction, isLoginPending] = useActionState(login, initialAuthState);
  const [registerState, registerAction, isRegisterPending] = useActionState(signup, initialAuthState);

  // Auth form fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regDietPreference, setRegDietPreference] = useState("asian_pacific");
  const [regCountry, setRegCountry] = useState("philippines");
  const [regHealthCondition, setRegHealthCondition] = useState("proper_diet");
  const [regHeightCm, setRegHeightCm] = useState("");
  const [regWeightKg, setRegWeightKg] = useState("");
  const [regBmi, setRegBmi] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [authClientError, setAuthClientError] = useState<string | null>(null);

  // Live BMI Calculation
  const liveBmi = (() => {
    const h = parseFloat(regHeightCm);
    const w = parseFloat(regWeightKg);
    if (h > 40 && w > 20) {
      return calculateBMI(h, w);
    }
    const direct = parseFloat(regBmi);
    return !isNaN(direct) && direct > 0 ? direct : null;
  })();

  const bmiCategory = liveBmi ? getBMICategory(liveBmi) : null;

  const handleCountryChange = (countryId: string) => {
    setRegCountry(countryId);
    const autoDiet = getAutomatedDietForCountry(countryId);
    setRegDietPreference(autoDiet);
  };

  // Password strength calculator
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "", class: "" };
    if (pwd.length < 6) return { score: 1, label: "Too Short", class: "weak" };
    let score = 1;
    if (pwd.length >= 8) score++;
    if (/[0-9]/.test(pwd) && /[a-zA-Z]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd) || pwd.length >= 12) score++;
    if (score === 1) return { score: 1, label: "Weak", class: "weak" };
    if (score === 2) return { score: 2, label: "Medium", class: "medium" };
    return { score: 3, label: "Strong", class: "strong" };
  };
  const pwdStrength = getPasswordStrength(regPassword);

  // Interactive Sandbox state: Macro Calibrator
  const [selectedPresetId, setSelectedPresetId] = useState("balanced");
  const [calorieSlider, setCalorieSlider] = useState(2000);
  const activePreset = DIET_PRESETS.find((p) => p.id === selectedPresetId) || DIET_PRESETS[0];

  // Calculated macro grams from slider
  const targetProteinGrams = Math.round((calorieSlider * (activePreset.proteinPct / 100)) / 4);
  const targetCarbsGrams = Math.round((calorieSlider * (activePreset.carbsPct / 100)) / 4);
  const targetFatGrams = Math.round((calorieSlider * (activePreset.fatPct / 100)) / 9);

  // Interactive Sandbox state: Live Meals
  const [demoMeals, setDemoMeals] = useState<DemoMeal[]>(INITIAL_DEMO_MEALS);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  // Calculations for simulator
  const plannedCalories = demoMeals.reduce((acc, m) => acc + m.calories, 0);
  const consumedCalories = demoMeals
    .filter((m) => m.consumed)
    .reduce((acc, m) => acc + m.calories, 0);
  const consumedProtein = demoMeals
    .filter((m) => m.consumed)
    .reduce((acc, m) => acc + m.protein, 0);
  const consumedCarbs = demoMeals
    .filter((m) => m.consumed)
    .reduce((acc, m) => acc + m.carbs, 0);
  const consumedFat = demoMeals
    .filter((m) => m.consumed)
    .reduce((acc, m) => acc + m.fat, 0);
  const consumedFiber = demoMeals
    .filter((m) => m.consumed)
    .reduce((acc, m) => acc + m.fiber, 0);

  const consumedPercentage = Math.min(
    100,
    Math.round((consumedCalories / (calorieSlider || 1)) * 100)
  );

  // Circular gauge offset (circumference = 2 * PI * 40 ~= 251.2)
  const gaugeCircumference = 251.2;
  const gaugeOffset = gaugeCircumference - (consumedPercentage / 100) * gaugeCircumference;

  // Toggle meal consumed
  const toggleMealConsumed = (id: string) => {
    setDemoMeals((prev) =>
      prev.map((m) => (m.id === id ? { ...m, consumed: !m.consumed } : m))
    );
  };

  // Add demo food item
  const addDemoFood = (name: string, slot: "Breakfast" | "Lunch" | "Dinner" | "Snack", cal: number, p: number, c: number, f: number, fib: number) => {
    const newItem: DemoMeal = {
      id: `m-${Date.now()}`,
      slot,
      name,
      portion: "1 standard serving",
      calories: cal,
      protein: p,
      carbs: c,
      fat: f,
      fiber: fib,
      consumed: false,
    };
    setDemoMeals((prev) => [...prev, newItem]);
    setQuickAddOpen(false);
  };

  const resetSimulator = () => {
    setDemoMeals(INITIAL_DEMO_MEALS);
    setCalorieSlider(2000);
    setSelectedPresetId("balanced");
  };

  // Client validation for auth forms
  const handleLoginSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setAuthClientError(null);
    if (!loginEmail || !loginEmail.includes("@")) {
      e.preventDefault();
      setAuthClientError("Please enter a valid email address.");
      return;
    }
    if (!loginPassword || loginPassword.length < 6) {
      e.preventDefault();
      setAuthClientError("Password must be at least 6 characters.");
      return;
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setAuthClientError(null);
    if (!regEmail || !regEmail.includes("@")) {
      e.preventDefault();
      setAuthClientError("Please enter a valid email address.");
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      e.preventDefault();
      setAuthClientError("Password must be at least 6 characters.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      e.preventDefault();
      setAuthClientError("Passwords do not match.");
      return;
    }
  };

  return (
    <div className="frontpage-root">
      {/* =========================================================================
          TOP NAV: Brand & Instant Actions
          ========================================================================= */}
      <header className="frontpage-navbar">
        <div className="frontpage-nav-inner">
          <Link href="/" className="frontpage-brand" aria-label="Nutricious Goals System Home">
            <div className="frontpage-logo-mark">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
            </div>
            <div className="frontpage-brand-text">
              <span className="brand-name">Nutricious</span>
              <span className="brand-tag">Botanical Wellness</span>
            </div>
          </Link>

          <nav className="frontpage-nav-links" aria-label="Landing page sections">
            <a href="#macro-sandbox" className="nav-link">Macro Sandbox</a>
            <a href="#meal-simulator" className="nav-link">Meal Simulator</a>
            <a href="#integrity-features" className="nav-link">Data Integrity</a>
            <a href="#science-philosophy" className="nav-link">Design Principles</a>
          </nav>

          <div className="frontpage-nav-actions">
            <ThemeToggle />

            <button
              type="button"
              onClick={() => {
                setAuthClientError(null);
                setAuthMode(authMode === "login" ? "none" : "login");
              }}
              className="btn-auth-signin"
            >
              <span>{authMode === "login" ? "Close Sign In" : "Sign In"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthClientError(null);
                setAuthMode("register");
              }}
              className="btn-auth-primary"
            >
              <span>Get Started</span>
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          HERO SECTION: Informative Narrative & Instant Exploration
          ========================================================================= */}
      <section className="frontpage-hero">
        <div className="hero-glow-1" aria-hidden="true" />
        <div className="hero-glow-2" aria-hidden="true" />

        <div className="hero-container">
          <div className="hero-eyebrow">
            <span className="hero-pulsing-dot" />
            <span>Personalized Nutrition &amp; Meal Planning</span>
          </div>

          <h1 className="hero-headline">
            Nourish with Purpose.<br />
            Track with <span className="text-gradient">Botanical Clarity.</span>
          </h1>

          <p className="hero-subline">
            Experience dietary mindfulness without fabricated metrics. Plan balanced weekly schedules,
            track consumption with strict unit integrity, and understand your macro vitality in an honest,
            calm workspace.
          </p>

          <div className="hero-cta-row">
            <a href="#macro-sandbox" className="hero-primary-btn">
              <span>Try Interactive Sandbox</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          {/* Value Micro-Pills */}
          <div className="hero-metric-strip">
            <div className="hero-metric-item">
              <span className="metric-val">100%</span>
              <span className="metric-lbl">Honest Nutrients (No 0 Defaults)</span>
            </div>
            <div className="hero-metric-divider" />
            <div className="hero-metric-item">
              <span className="metric-val">Strict</span>
              <span className="metric-lbl">Serving Basis Unit Matching</span>
            </div>
            <div className="hero-metric-divider" />
            <div className="hero-metric-item">
              <span className="metric-val">Auto</span>
              <span className="metric-lbl">Country-Specific Meal Sync</span>
            </div>
            <div className="hero-metric-divider" />
            <div className="hero-metric-item">
              <span className="metric-val">Private</span>
              <span className="metric-lbl">Encrypted Personal Data Storage</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          INTERACTIVE AUTH MODAL / DRAWER (When Sign In / Register is active)
          ========================================================================= */}
      {authMode !== "none" && (
        <div className="auth-overlay-backdrop" onClick={() => setAuthMode("none")}>
          <div className="auth-overlay-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="auth-overlay-close"
              onClick={() => setAuthMode("none")}
              aria-label="Close authentication panel"
            >
              ✕
            </button>

            {/* Header Block */}
            <div className="auth-header-block">
              <div className="auth-badge-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                </svg>
              </div>
              <h3 className="auth-modal-title">
                {authMode === "login" ? "Welcome Back" : "Begin Mindful Nutrition"}
              </h3>
              <p className="auth-modal-sub">
                {authMode === "login"
                  ? "Sign in to access your personal dietary plans, logs, and macro summaries."
                  : "Create your free account to track meals with scientific unit precision."}
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="auth-mode-tabs">
              <button
                type="button"
                className={`auth-mode-tab ${authMode === "login" ? "active" : ""}`}
                onClick={() => {
                  setAuthClientError(null);
                  setAuthMode("login");
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-mode-tab ${authMode === "register" ? "active" : ""}`}
                onClick={() => {
                  setAuthClientError(null);
                  setAuthMode("register");
                }}
              >
                Create Account
              </button>
            </div>

            {/* Error & Info Alerts */}
            {(authClientError || (authMode === "login" ? loginState?.error : registerState?.error)) && (
              <div className="stitch-alert stitch-alert-error" role="alert" style={{ marginBottom: 14 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{authClientError || (authMode === "login" ? loginState?.error : registerState?.error)}</span>
              </div>
            )}

            {(authMode === "login" ? loginState?.success : registerState?.success) && (
              <div className="stitch-alert stitch-alert-success" role="status" style={{ marginBottom: 14 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span>{authMode === "login" ? loginState?.success : registerState?.success}</span>
              </div>
            )}

            {/* LOGIN FORM */}
            {authMode === "login" ? (
              <form action={loginAction} onSubmit={handleLoginSubmit} className="stitch-form">
                <div className="stitch-field-group">
                  <label className="stitch-field-label" htmlFor="frontpage-login-email">
                    Email Address
                  </label>
                  <div className="stitch-field-icon-wrap">
                    <span className="stitch-field-icon" aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </span>
                    <input
                      id="frontpage-login-email"
                      name="email"
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. alex@example.com"
                      className="stitch-auth-input has-icon"
                      disabled={isLoginPending}
                    />
                  </div>
                </div>

                <div className="stitch-field-group">
                  <div className="stitch-field-label-row">
                    <label className="stitch-field-label" htmlFor="frontpage-login-password">
                      Password
                    </label>
                  </div>
                  <div className="stitch-field-icon-wrap">
                    <span className="stitch-field-icon" aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      id="frontpage-login-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="stitch-auth-input has-icon"
                      disabled={isLoginPending}
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
                  className="stitch-auth-submit-btn mt-2"
                  disabled={isLoginPending}
                >
                  {isLoginPending ? (
                    <span className="flex items-center gap-2">
                      <span className="auth-spinner" />
                      <span>Authenticating...</span>
                    </span>
                  ) : (
                    "Access Dashboard"
                  )}
                </button>
              </form>
            ) : (
              /* REGISTER FORM */
              <form action={registerAction} onSubmit={handleRegisterSubmit} className="stitch-form">
                <div className="stitch-field-group">
                  <label className="stitch-field-label" htmlFor="frontpage-reg-name">
                    Display Name
                  </label>
                  <div className="stitch-field-icon-wrap">
                    <span className="stitch-field-icon" aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      id="frontpage-reg-name"
                      name="displayName"
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Maria Santos"
                      className="stitch-auth-input has-icon"
                      disabled={isRegisterPending}
                    />
                  </div>
                </div>

                <div className="stitch-field-group">
                  <label className="stitch-field-label" htmlFor="frontpage-reg-email">
                    Email Address
                  </label>
                  <div className="stitch-field-icon-wrap">
                    <span className="stitch-field-icon" aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </span>
                    <input
                      id="frontpage-reg-email"
                      name="email"
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. maria@example.com"
                      className="stitch-auth-input has-icon"
                      disabled={isRegisterPending}
                    />
                  </div>
                </div>

                <div className="stitch-field-group">
                  <label className="stitch-field-label" htmlFor="frontpage-reg-password">
                    Password
                  </label>
                  <div className="stitch-field-icon-wrap">
                    <span className="stitch-field-icon" aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      id="frontpage-reg-password"
                      name="password"
                      type={showRegPassword ? "text" : "password"}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="stitch-auth-input has-icon"
                      disabled={isRegisterPending}
                    />
                    <button
                      type="button"
                      className="stitch-pwd-toggle"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      aria-label={showRegPassword ? "Hide password" : "Show password"}
                    >
                      {showRegPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {regPassword.length > 0 && (
                    <div className="pwd-strength-container">
                      <div className="pwd-strength-bar">
                        <div className={`pwd-strength-seg ${pwdStrength.score >= 1 ? `active-${pwdStrength.class}` : ""}`} />
                        <div className={`pwd-strength-seg ${pwdStrength.score >= 2 ? `active-${pwdStrength.class}` : ""}`} />
                        <div className={`pwd-strength-seg ${pwdStrength.score >= 3 ? `active-${pwdStrength.class}` : ""}`} />
                      </div>
                      <div className="pwd-strength-info">
                        <span className="text-muted">Password strength:</span>
                        <span className={`pwd-strength-label ${pwdStrength.class}`}>{pwdStrength.label}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="stitch-field-group">
                  <div className="stitch-field-label-row">
                    <label className="stitch-field-label" htmlFor="frontpage-reg-confirm">
                      Confirm Password
                    </label>
                    {regConfirmPassword.length > 0 && (
                      <span className={`pwd-match-pill ${regPassword === regConfirmPassword ? "matched" : "unmatched"}`}>
                        {regPassword === regConfirmPassword ? "✓ Matches" : "✕ Mismatch"}
                      </span>
                    )}
                  </div>
                  <div className="stitch-field-icon-wrap">
                    <span className="stitch-field-icon" aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      id="frontpage-reg-confirm"
                      name="confirmPassword"
                      type={showRegConfirm ? "text" : "password"}
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className="stitch-auth-input has-icon"
                      disabled={isRegisterPending}
                    />
                    <button
                      type="button"
                      className="stitch-pwd-toggle"
                      onClick={() => setShowRegConfirm(!showRegConfirm)}
                      aria-label={showRegConfirm ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showRegConfirm ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* COUNTRY PREFERENCE (Automates Diet Recommendation) */}
                <div className="stitch-field-group">
                  <label className="stitch-field-label" htmlFor="frontpage-reg-country">
                    Country &amp; Culinary Tradition
                  </label>
                  <select
                    id="frontpage-reg-country"
                    name="country"
                    value={regCountry}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="stitch-auth-input"
                    disabled={isRegisterPending}
                  >
                    {COUNTRY_OPTIONS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.flag} {c.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-muted mt-1 block">
                    Automatically syncs authentic local foods and calibrated macro archetypes.
                  </span>
                </div>

                {/* AUTOMATED DIETARY FOCUS */}
                <div className="stitch-field-group">
                  <div className="flex items-center justify-between">
                    <label className="stitch-field-label" htmlFor="frontpage-reg-diet">
                      Recommended Dietary Focus
                    </label>
                    <span className="text-[10px] text-primary font-bold">
                      ✓ Auto-Matched
                    </span>
                  </div>
                  <select
                    id="frontpage-reg-diet"
                    name="dietaryPreference"
                    value={regDietPreference}
                    onChange={(e) => setRegDietPreference(e.target.value)}
                    className="stitch-auth-input"
                    disabled={isRegisterPending}
                  >
                    {DIETARY_PREFERENCES.map((dp) => (
                      <option key={dp.id} value={dp.id}>
                        {dp.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* HEALTH CONDITION & SPECIFIC DIETARY NEEDS (Low-Carb, Renal, Chemo, Proper Diet) */}
                <div className="stitch-field-group">
                  <div className="flex items-center justify-between">
                    <label className="stitch-field-label" htmlFor="frontpage-reg-health">
                      Health Baseline &amp; Dietary Needs
                    </label>
                    <span className="text-[10px] text-primary font-bold">
                      {HEALTH_CONDITIONS.find((h) => h.id === regHealthCondition)?.tagline || "Personalized"}
                    </span>
                  </div>
                  <select
                    id="frontpage-reg-health"
                    name="healthCondition"
                    value={regHealthCondition}
                    onChange={(e) => setRegHealthCondition(e.target.value)}
                    className="stitch-auth-input"
                    disabled={isRegisterPending}
                  >
                    {HEALTH_CONDITIONS.map((hc) => (
                      <option key={hc.id} value={hc.id}>
                        {hc.label}
                      </option>
                    ))}
                  </select>
                  {/* Active Condition Macro Ratio Breakdown (Carbs, Fats, Protein) */}
                  {(() => {
                    const activeCond = HEALTH_CONDITIONS.find((h) => h.id === regHealthCondition);
                    if (!activeCond) return null;
                    return (
                      <div className="mt-2 p-2 rounded-lg bg-[var(--surface-container)] border border-[var(--border-subtle)] text-xs">
                        <div className="text-[11px] text-muted mb-1.5">{activeCond.description}</div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5 rounded bg-[var(--tertiary-container)] text-[var(--on-tertiary-container)]">
                            🍞 Carbs: {activeCond.macroRatios.carbs}%
                          </span>
                          <span className="inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5 rounded bg-[var(--secondary-container)] text-[var(--on-secondary-container)]">
                            🥑 Fats: {activeCond.macroRatios.fat}%
                          </span>
                          <span className="inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5 rounded bg-[var(--primary-container)] text-[var(--on-primary-container)]">
                            🍗 Protein: {activeCond.macroRatios.protein}%
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* BMI & BODY METRICS (Optional / Recommended) */}
                <div className="p-3 rounded-xl bg-[var(--surface-container-low)] border border-[var(--border-subtle)] my-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-[var(--on-surface)]">
                      BMI &amp; Body Metrics
                    </label>
                    <span className="text-[10px] text-muted font-medium">
                      Calculates baseline targets
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-[var(--on-surface-variant)] block mb-1" htmlFor="reg-height">
                        Height (cm)
                      </label>
                      <input
                        id="reg-height"
                        name="heightCm"
                        type="number"
                        step="0.5"
                        min="50"
                        max="260"
                        value={regHeightCm}
                        onChange={(e) => setRegHeightCm(e.target.value)}
                        placeholder="e.g. 165"
                        className="stitch-input"
                        disabled={isRegisterPending}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[var(--on-surface-variant)] block mb-1" htmlFor="reg-weight">
                        Weight (kg)
                      </label>
                      <input
                        id="reg-weight"
                        name="weightKg"
                        type="number"
                        step="0.5"
                        min="20"
                        max="300"
                        value={regWeightKg}
                        onChange={(e) => setRegWeightKg(e.target.value)}
                        placeholder="e.g. 58"
                        className="stitch-input"
                        disabled={isRegisterPending}
                      />
                    </div>
                  </div>

                  {liveBmi ? (
                    <div className="mt-2.5 p-2 rounded-lg bg-[var(--surface-container-lowest)] border border-[var(--border-subtle)] flex items-center justify-between text-xs">
                      <span className="text-[var(--on-surface-variant)]">
                        Your Calculated BMI:
                      </span>
                      <span className="font-bold font-mono" style={{ color: bmiCategory?.color }}>
                        {liveBmi} — {bmiCategory?.label}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <label className="text-[11px] text-[var(--on-surface-variant)] block mb-1" htmlFor="reg-direct-bmi">
                        Or enter BMI directly:
                      </label>
                      <input
                        id="reg-direct-bmi"
                        name="bmi"
                        type="number"
                        step="0.1"
                        min="10"
                        max="60"
                        value={regBmi}
                        onChange={(e) => setRegBmi(e.target.value)}
                        placeholder="e.g. 21.3"
                        className="stitch-input"
                        disabled={isRegisterPending}
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="stitch-auth-submit-btn mt-2"
                  disabled={isRegisterPending}
                >
                  {isRegisterPending ? (
                    <span className="flex items-center gap-2">
                      <span className="auth-spinner" />
                      <span>Creating Profile...</span>
                    </span>
                  ) : (
                    "Create Free Account"
                  )}
                </button>
              </form>
            )}

            <div className="auth-overlay-footer">
              <span className="text-xs text-muted">Your personal nutrition data is private and securely encrypted.</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          INTERACTIVE WIDGET #1: MACRO & CALORIE BALANCER SANDBOX
          ========================================================================= */}
      <section id="macro-sandbox" className="frontpage-section">
        <div className="section-head">
          <div className="section-eyebrow">INTERACTIVE ENGINE • NO FABRICATED DATA</div>
          <h2 className="section-title">Daily Macro Calibrator &amp; Vitality Engine</h2>
          <p className="section-subtitle">
            Interact with our strict nutrition calculation engine in real-time. Adjust your daily calorie
            target and choose an archetype to watch macro distributions balance dynamically.
          </p>
        </div>

        <div className="sandbox-card">
          <div className="sandbox-grid">
            {/* Left: Interactive Controls */}
            <div className="sandbox-controls">
              <div className="control-group">
                <label className="control-label">Choose Dietary Blueprint</label>
                <div className="preset-pill-row">
                  {DIET_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className={`preset-pill ${selectedPresetId === preset.id ? "active" : ""}`}
                      onClick={() => {
                        setSelectedPresetId(preset.id);
                        setCalorieSlider(preset.calories);
                      }}
                    >
                      <span className="preset-name">{preset.name}</span>
                      <span className="preset-sub">{preset.tagline}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Calorie Slider */}
              <div className="control-group mt-4">
                <div className="slider-label-row">
                  <label className="control-label">Daily Calorie Target</label>
                  <span className="slider-val-badge">{calorieSlider.toLocaleString()} kcal</span>
                </div>
                <input
                  type="range"
                  min="1400"
                  max="3500"
                  step="50"
                  value={calorieSlider}
                  onChange={(e) => setCalorieSlider(Number(e.target.value))}
                  className="interactive-range"
                />
                <div className="slider-ticks">
                  <span>1,400 kcal (Gentle)</span>
                  <span>2,400 kcal (Active)</span>
                  <span>3,500 kcal (Athletic)</span>
                </div>
              </div>

              {/* Dynamic Gram Metrics */}
              <div className="macro-targets-grid">
                <div className="macro-target-card protein">
                  <div className="macro-target-head">
                    <span className="macro-dot" style={{ backgroundColor: "var(--primary)" }} />
                    <span className="macro-name">PROTEIN ({activePreset.proteinPct}%)</span>
                  </div>
                  <div className="macro-target-val">{targetProteinGrams}g</div>
                  <span className="macro-target-sub">{targetProteinGrams * 4} kcal energy</span>
                </div>

                <div className="macro-target-card carbs">
                  <div className="macro-target-head">
                    <span className="macro-dot" style={{ backgroundColor: "var(--tertiary-container)" }} />
                    <span className="macro-name">CARBS ({activePreset.carbsPct}%)</span>
                  </div>
                  <div className="macro-target-val">{targetCarbsGrams}g</div>
                  <span className="macro-target-sub">{targetCarbsGrams * 4} kcal energy</span>
                </div>

                <div className="macro-target-card fats">
                  <div className="macro-target-head">
                    <span className="macro-dot" style={{ backgroundColor: "var(--secondary)" }} />
                    <span className="macro-name">FATS ({activePreset.fatPct}%)</span>
                  </div>
                  <div className="macro-target-val">{targetFatGrams}g</div>
                  <span className="macro-target-sub">{targetFatGrams * 9} kcal energy</span>
                </div>
              </div>
            </div>

            {/* Right: Live Visual Feedback */}
            <div className="sandbox-visual-panel">
              <div className="sandbox-visual-header">
                <span className="badge-live-calculation">● Live Calculation Engine</span>
                <button type="button" onClick={resetSimulator} className="btn-reset-simulator">
                  Reset
                </button>
              </div>

              <div className="circular-gauge-container">
                <svg className="circular-gauge-svg" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="var(--surface-container-highest)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset={gaugeOffset}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
                  />
                </svg>
                <div className="circular-gauge-content">
                  <span className="gauge-kicker">CONSUMED</span>
                  <span className="gauge-number">{consumedCalories.toLocaleString()}</span>
                  <span className="gauge-denom">/ {calorieSlider.toLocaleString()} kcal</span>
                </div>
              </div>

              {/* Progress and status */}
              <div className="gauge-status-block">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-on-surface">Target Pace</span>
                  <span className="font-bold text-primary">{consumedPercentage}%</span>
                </div>
                <div className="gauge-bar-track">
                  <div
                    className="gauge-bar-fill"
                    style={{ width: `${consumedPercentage}%`, backgroundColor: "var(--primary)" }}
                  />
                </div>
                <p className="text-[11px] text-muted mt-2 text-center">
                  {calorieSlider - consumedCalories > 0
                    ? `${(calorieSlider - consumedCalories).toLocaleString()} kcal remaining to baseline`
                    : `Goal met for this sample schedule!`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          INTERACTIVE WIDGET #2: MEAL PLANNING & CONSUMPTION LOG SANDBOX
          ========================================================================= */}
      <section id="meal-simulator" className="frontpage-section">
        <div className="section-head">
          <div className="section-eyebrow">MINDFUL MEAL TRACKING • DISTINCT LOGGING</div>
          <h2 className="section-title">Try Interactive Meal Planning &amp; Logging</h2>
          <p className="section-subtitle">
            In Nutricious Goals, a planned meal is not automatically marked eaten. Click <strong>&quot;Log as Consumed&quot;</strong> on
            any item below to see actual diary capture and nutrient snapshotting in action.
          </p>
        </div>

        <div className="simulator-card">
          <div className="simulator-topbar">
            <div>
              <h3 className="text-base font-bold text-on-surface">Today&apos;s Simulated Course</h3>
              <span className="text-xs text-muted">
                {demoMeals.filter((m) => m.consumed).length} of {demoMeals.length} meals logged as consumed
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-add-sample"
                onClick={() => setQuickAddOpen(!quickAddOpen)}
              >
                + Add Wholesome Dish
              </button>
            </div>
          </div>

          {/* Quick Add Tray */}
          {quickAddOpen && (
            <div className="quick-add-tray">
              <span className="text-xs font-semibold text-on-surface block mb-2">
                Select a nutrient-dense food to add to your simulated schedule:
              </span>
              <div className="tray-buttons">
                <button
                  type="button"
                  className="tray-item-btn"
                  onClick={() => addDemoFood("Chia Seed & Coconut Pudding", "Breakfast", 210, 6, 22, 12, 9)}
                >
                  + Chia &amp; Coconut Pudding (210 kcal)
                </button>
                <button
                  type="button"
                  className="tray-item-btn"
                  onClick={() => addDemoFood("Mediterranean Lentil & Kale Soup", "Lunch", 340, 22, 46, 8, 12)}
                >
                  + Lentil &amp; Kale Soup (340 kcal)
                </button>
                <button
                  type="button"
                  className="tray-item-btn"
                  onClick={() => addDemoFood("Steamed Edamame with Sea Salt", "Snack", 120, 11, 9, 5, 4)}
                >
                  + Steamed Edamame (120 kcal)
                </button>
              </div>
            </div>
          )}

          {/* Meal Items Grid */}
          <div className="meal-items-grid">
            {demoMeals.map((meal) => (
              <article key={meal.id} className={`interactive-meal-card ${meal.consumed ? "consumed" : ""}`}>
                <div className="meal-card-top">
                  <span className={`slot-badge ${meal.slot.toLowerCase()}`}>{meal.slot}</span>
                  <span className={`status-pill ${meal.consumed ? "eaten" : "planned"}`}>
                    {meal.consumed ? "✓ Logged Consumed" : "Scheduled"}
                  </span>
                </div>

                <h4 className="meal-card-title">{meal.name}</h4>
                <div className="meal-card-portion">{meal.portion}</div>

                <div className="meal-card-macros">
                  <div className="macro-mini">
                    <strong>{meal.calories}</strong>
                    <span>kcal</span>
                  </div>
                  <div className="macro-mini">
                    <strong>{meal.protein}g</strong>
                    <span>protein</span>
                  </div>
                  <div className="macro-mini">
                    <strong>{meal.carbs}g</strong>
                    <span>carbs</span>
                  </div>
                  <div className="macro-mini">
                    <strong>{meal.fat}g</strong>
                    <span>fat</span>
                  </div>
                  <div className="macro-mini fiber">
                    <strong>{meal.fiber}g</strong>
                    <span>fiber</span>
                  </div>
                </div>

                <button
                  type="button"
                  className={`btn-toggle-consumed ${meal.consumed ? "unlog" : "log"}`}
                  onClick={() => toggleMealConsumed(meal.id)}
                >
                  {meal.consumed ? "↩ Undo Consumption Log" : "✓ Log as Consumed"}
                </button>
              </article>
            ))}
          </div>

          {/* Live Aggregated Breakdown */}
          <div className="simulator-breakdown-bar">
            <div className="breakdown-col">
              <span className="lbl">Logged Calories</span>
              <strong className="val">{consumedCalories} kcal</strong>
            </div>
            <div className="breakdown-col">
              <span className="lbl">Logged Protein</span>
              <strong className="val">{consumedProtein}g</strong>
            </div>
            <div className="breakdown-col">
              <span className="lbl">Logged Carbs</span>
              <strong className="val">{consumedCarbs}g</strong>
            </div>
            <div className="breakdown-col">
              <span className="lbl">Logged Fats</span>
              <strong className="val">{consumedFat}g</strong>
            </div>
            <div className="breakdown-col">
              <span className="lbl">Logged Dietary Fiber</span>
              <strong className="val">{consumedFiber}g</strong>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION #3: SCIENTIFIC ACCURACY & HEALTH INTEGRITY
          ========================================================================= */}
      <section id="integrity-features" className="frontpage-section">
        <div className="section-head">
          <div className="section-eyebrow">SCIENTIFIC ACCURACY • HEALTH INTEGRITY</div>
          <h2 className="section-title">Built with Scientific and Data Rigor</h2>
          <p className="section-subtitle">
            Most fitness applications fabricate zeros when data is missing or mix units arbitrarily.
            Nutricious Goals enforces rigorous nutritional integrity so you can trust every macro calculation.
          </p>
        </div>

        <div className="principles-grid">
          <div className="principle-card">
            <div className="principle-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <h3 className="principle-title">Accurate Portion Scaling</h3>
            <p className="principle-body">
              Nutrient calculations strictly enforce unit compatibility. We never perform arbitrary conversions
              between volume and weight without verified density, preventing deceptive calorie counts.
            </p>
          </div>

          <div className="principle-card">
            <div className="principle-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </div>
            <h3 className="principle-title">Transparent Nutrient Data</h3>
            <p className="principle-body">
              When a food catalog entry lacks specific micronutrient figures like fiber, we show an honest indicator
              rather than misleading you into believing the food contains zero content.
            </p>
          </div>

          <div className="principle-card">
            <div className="principle-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3 className="principle-title">Reliable History Tracking</h3>
            <p className="principle-body">
              Every time you log a meal, your daily intake is recorded at that exact moment. Updating a recipe
              next month will never rewrite or distort your past nutritional progress.
            </p>
          </div>

          <div className="principle-card">
            <div className="principle-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3 className="principle-title">Private &amp; Isolated Diary</h3>
            <p className="principle-body">
              Your diet diary, custom foods, and meal plans are strictly encrypted and private to your account.
              Your personal health data is completely shielded and never shared.
            </p>
          </div>
        </div>
      </section>


      {/* =========================================================================
          BOTTOM CALL TO ACTION & SAFETY DISCLAIMER
          ========================================================================= */}
      <section id="science-philosophy" className="frontpage-bottom-cta">
        <div className="bottom-cta-card">
          <div className="bottom-cta-content">
            <span className="badge-cta">START YOUR MINDFUL JOURNEY</span>
            <h2 className="bottom-cta-heading">Ready to plan and log with purpose?</h2>
            <p className="bottom-cta-desc">
              Create your account in seconds and unlock personalized meal planning calibrated to your dietary rhythm and goals.
            </p>
            <div className="bottom-cta-buttons">
              <button
                type="button"
                onClick={() => setAuthMode("register")}
                className="btn-cta-primary"
              >
                Create Free Account
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className="btn-cta-secondary"
              >
                Sign In to Your Space
              </button>
            </div>
          </div>
        </div>

        <div className="safety-disclaimer-box">
          <strong className="block text-on-surface mb-1">Informational Guidance Notice</strong>
          <p className="text-xs text-muted m-0 leading-relaxed">
            Nutricious Goals System is an educational dietary self-monitoring platform designed to cultivate nutritional
            awareness and personal self-efficacy. This software strictly excludes clinical medical advice, disease diagnosis,
            or therapeutic treatment regimens. Always consult a licensed healthcare practitioner or registered dietitian
            regarding individual clinical needs.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="frontpage-footer">
        <div className="footer-inner">
          <div className="footer-left">
            <span className="font-semibold text-on-surface">Nutricious Goals System</span>
            <span className="text-muted text-xs">• Botanical Wellness &amp; Vitality</span>
          </div>
          <div className="footer-right flex items-center gap-3">
            <ThemeToggle showLabel className="has-label" />
            <span className="hidden sm:inline text-muted text-xs">• Course Baseline Delivery</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
