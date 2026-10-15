"use client";

import { useMemo, useState } from "react";
import { signOut } from "@/app/auth/actions";
import { Food, MealPlanItem, ConsumptionLog } from "@/lib/supabase/types";
import { CustomFoodsManager } from "./CustomFoodsManager";
import { MealPlannerView } from "./MealPlannerView";
import { InsightsView } from "./InsightsView";
import { SettingsView } from "./SettingsView";
import { AdminConsoleView } from "./AdminConsoleView";
import { ThemeToggle } from "./ThemeToggle";
import {
  calculateNutrientTotals,
  formatNutrient,
} from "@/lib/nutrition/calculator";
import {
  getMealPlanForDate,
  addMealPlanItem,
} from "@/app/actions/meal-plans";
import {
  getConsumptionLogsForDate,
  logPlannedItemAsConsumed,
  unlogPlannedItem,
} from "@/app/actions/consumption";
import { getCustomFoods } from "@/app/actions/foods";
import { getRecommendedFoods } from "@/lib/nutrition/recommendations";

type Props = {
  user: {
    id: string;
    email?: string;
    displayName?: string;
    timezone?: string;
    role?: "user" | "admin";
    dietaryPreference?: string;
    region?: string;
  } | null;
  configured: boolean;
  initialFoods: Food[];
  initialPlanItems: MealPlanItem[];
  initialConsumptionLogs: ConsumptionLog[];
};

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  const paths: Record<string, React.ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),
    chart: (
      <>
        <path d="M3 3v18h18" />
        <path d="m8 14 4-4 3 3 6-7" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="m19.4 15 .1.1 1.1.9-1.1 1.9-1.3-.5a8 8 0 0 1-1.5.9l-.2 1.4h-2.2l-.3-1.4a8 8 0 0 1-1.7 0L11 20h-2l-.3-1.4a8 8 0 0 1-1.5-.9l-1.3.5-1.1-1.9 1.1-.9a8 8 0 0 1-.2-1.7l-1.2-.7v-2.2l1.2-.7c0-.6.1-1.1.3-1.7L5 7.5l1.1-1.9 1.3.5c.5-.4 1-.7 1.5-.9L9.2 4h2.2l.3 1.4a8 8 0 0 1 1.7 0l.3-1.4h2.2l.2 1.4c.6.2 1.1.5 1.5.9l1.3-.5 1.1 1.9-1.1.9c.2.5.3 1.1.3 1.7l1.2.7v2.2l-1.2.7c0 .4-.1.8-.3 1.1Z" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </>
    ),
    check: (
      <>
        <path d="m5 12 4 4L19 6" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </>
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </>
    ),
    restaurant: (
      <>
        <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2M15 2v18M6 2v18M3 2v6a3 3 0 0 0 6 0V2" />
      </>
    ),
    fire: (
      <>
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" />
      </>
    ),
    pie: (
      <>
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z" />
      </>
    ),
    sparkle: (
      <>
        <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
      </>
    ),
    water: (
      <>
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </>
    ),
    shopping: (
      <>
        <path d="m5 11 4-7M19 11l-4-7M2 11h20M3.5 11 5 20h14l1.5-9" />
      </>
    ),
    refresh: (
      <>
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
        <path d="M16 21h5v-5" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
  };
  return <svg {...common}>{paths[name]}</svg>;
}



export function DashboardClient({
  user,
  configured,
  initialFoods,
  initialPlanItems,
  initialConsumptionLogs,
}: Props) {
  const [activeNav, setActiveNav] = useState("Overview");
  const isAdmin = user?.role === "admin";
  const userDietaryPreference = user?.dietaryPreference || "mediterranean";
  const [customFoods, setCustomFoods] = useState<Food[]>(initialFoods);
  const [todayPlanItems, setTodayPlanItems] = useState<MealPlanItem[]>(initialPlanItems);
  const [todayLogs, setTodayLogs] = useState<ConsumptionLog[]>(initialConsumptionLogs);

  const [fastSearchTerm, setFastSearchTerm] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Today's local/formatted date
  const todayDateStr = new Date().toISOString().split("T")[0];
  const today = new Date();
  const shortDateFormatted = today.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";
  const initials = displayName.charAt(0).toUpperCase();

  // Reload data helper
  const reloadData = async () => {
    try {
      const [foodsRes, planRes, logRes] = await Promise.all([
        getCustomFoods(),
        getMealPlanForDate(todayDateStr),
        getConsumptionLogsForDate(todayDateStr),
      ]);
      if (foodsRes.success && foodsRes.data) setCustomFoods(foodsRes.data);
      if (planRes.success && planRes.data) setTodayPlanItems(planRes.data.items);
      if (logRes.success && logRes.data) setTodayLogs(logRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Consumed nutrients calculated honestly from consumption logs
  const consumedNutrients = useMemo(
    () => calculateNutrientTotals(todayLogs),
    [todayLogs]
  );

  const consumedCalories = consumedNutrients.calories.total;
  const protein = consumedNutrients.protein.total;
  const carbs = consumedNutrients.carbs.total;
  const fat = consumedNutrients.fat.total;
  const fiber = consumedNutrients.fiber?.total || 0;
  const totalMacros = protein + carbs + fat;

  // Calorie target calculations
  const calorieGoal = 2000;
  const caloriePercentage = Math.min(100, Math.round((consumedCalories / calorieGoal) * 100));
  const calorieRemaining = Math.max(0, calorieGoal - consumedCalories);
  const gaugeCircumference = 251.2;
  const gaugeOffset = gaugeCircumference - (gaugeCircumference * Math.min(100, (consumedCalories / calorieGoal) * 100)) / 100;

  // Meal plan logging progress
  const loggedPlannedCount = todayPlanItems.filter((p) =>
    todayLogs.some((l) => l.meal_plan_item_id === p.id)
  ).length;



  // Quick log toggle action
  const handleToggleLog = async (item: MealPlanItem) => {
    const isLogged = todayLogs.some((l) => l.meal_plan_item_id === item.id);
    try {
      if (isLogged) {
        const res = await unlogPlannedItem(item.id, todayDateStr);
        if (res.success) {
          setTodayLogs((prev) => prev.filter((l) => l.meal_plan_item_id !== item.id));
        }
      } else {
        const res = await logPlannedItemAsConsumed(item.id, todayDateStr);
        if (res.success && res.data) {
          setTodayLogs((prev) => [...prev, res.data!]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Quick add item state
  const [quickItemName, setQuickItemName] = useState("");
  const [quickSlot, setQuickSlot] = useState<"breakfast" | "lunch" | "dinner" | "snack" | "other">("snack");
  const [quickFoodId, setQuickFoodId] = useState("");

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickItemName.trim()) return;

    try {
      const res = await addMealPlanItem({
        dateStr: todayDateStr,
        slot: quickSlot,
        name: quickItemName.trim(),
        foodId: quickFoodId || null,
        quantity: 1,
        unit: "serving",
      });

      if (res.success && res.data) {
        setTodayPlanItems((prev) => [...prev, res.data!]);
        setShowQuickAdd(false);
        setQuickItemName("");
        setQuickFoodId("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const weekDays = ["M", "T", "W", "T", "F", "S", "S"];
  const currentDayIndex = (today.getDay() + 6) % 7;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="stitch-shell">
      {/* Stitch-inspired Sticky Top Header */}
      <header className="stitch-header">
        <div className="stitch-header-inner">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-4">
            <a
              className="stitch-brand"
              href="#home"
              aria-label="Nutricious Goals home"
              onClick={(e) => {
                e.preventDefault();
                setActiveNav("Overview");
              }}
            >
              <div className="stitch-brand-mark">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                </svg>
              </div>
              <div className="stitch-brand-text">
                <span className="stitch-brand-title">Nutricious Goals</span>
                <span className="stitch-brand-subtitle">Botanical Wellness & Vitality</span>
              </div>
            </a>

            {/* Desktop Nav Pills */}
            <nav className="stitch-nav" aria-label="Main navigation">
              {[
                ["Overview", "grid"],
                ["Meal planner", "calendar"],
                ["Food library", "search"],
                ["Insights", "chart"],
                ...(isAdmin ? [["Admin console", "shield"]] : []),
                ["Settings", "settings"],
              ].map(([label, icon]) => (
                <button
                  key={label}
                  type="button"
                  className={`stitch-nav-pill ${activeNav === label ? "active" : ""}`}
                  onClick={() => {
                    setActiveNav(label);
                  }}
                >
                  <Icon name={icon} size={16} />
                  <span>{label}</span>
                  {label === "Meal planner" && todayPlanItems.length > 0 && (
                    <span className="stitch-nav-badge">{todayPlanItems.length}</span>
                  )}
                  {label === "Food library" && customFoods.length > 0 && (
                    <span className="stitch-nav-badge">{customFoods.length}</span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Right Header Actions */}
          <div className="stitch-header-actions">
            {/* Quick Log Action */}
            <button
              type="button"
              className="stitch-action-btn hidden sm:inline-flex"
              onClick={() => setShowQuickAdd(true)}
            >
              <Icon name="plus" size={16} />
              <span>Log Meal</span>
            </button>

            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* Notification Indicator */}
            <button
              type="button"
              className="stitch-icon-btn"
              aria-label="Insights and updates"
              onClick={() => setActiveNav("Insights")}
            >
              <Icon name="bell" size={18} />
              {todayPlanItems.length > 0 && <span className="stitch-status-dot" />}
            </button>

            {/* Profile Dropdown Trigger */}
            <div className="relative">
              <button
                type="button"
                className="stitch-profile-btn"
                aria-label="User profile menu"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="stitch-avatar">{initials}</div>
                <div className="stitch-profile-info">
                  <span className="stitch-profile-name">{displayName}</span>
                  <span className={`stitch-profile-role ${isAdmin ? "admin" : ""}`}>
                    {isAdmin ? "Administrator" : "Mindful Member"}
                  </span>
                </div>
                <span className="text-xs text-muted ml-1">⌄</span>
              </button>

              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className="stitch-user-menu">
                  <div className="p-2 border-b border-subtle mb-1">
                    <div className="font-semibold text-xs text-on-surface truncate">{displayName}</div>
                    <div className="text-[10px] text-muted truncate">{user?.email || "Personal account"}</div>
                  </div>
                  <button
                    type="button"
                    className="stitch-user-menu-item"
                    onClick={() => {
                      setActiveNav("Settings");
                      setShowUserMenu(false);
                    }}
                  >
                    <Icon name="settings" size={15} />
                    <span>Profile Settings</span>
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      className="stitch-user-menu-item"
                      onClick={() => {
                        setActiveNav("Admin console");
                        setShowUserMenu(false);
                      }}
                    >
                      <Icon name="shield" size={15} />
                      <span>Admin Console</span>
                    </button>
                  )}
                  <form action={signOut}>
                    <button type="submit" className="stitch-user-menu-item danger">
                      <Icon name="logout" size={15} />
                      <span>Sign out</span>
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              className="stitch-icon-btn stitch-mobile-toggle"
              aria-label="Toggle mobile menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileMenuOpen ? (
                  <path d="M18 6 6 18M6 6l12 12" />
                ) : (
                  <path d="M4 12h16M4 6h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="stitch-mobile-drawer">
            {[
              ["Overview", "grid"],
              ["Meal planner", "calendar"],
              ["Food library", "search"],
              ["Insights", "chart"],
              ...(isAdmin ? [["Admin console", "shield"]] : []),
              ["Settings", "settings"],
            ].map(([label, icon]) => (
              <button
                key={label}
                type="button"
                className={`stitch-nav-pill ${activeNav === label ? "active" : ""}`}
                onClick={() => {
                  setActiveNav(label);
                  setMobileMenuOpen(false);
                }}
              >
                <div className="flex items-center gap-2">
                  <Icon name={icon} size={18} />
                  <span>{label}</span>
                </div>
                {label === "Meal planner" && todayPlanItems.length > 0 && (
                  <span className="stitch-nav-badge">{todayPlanItems.length}</span>
                )}
                {label === "Food library" && customFoods.length > 0 && (
                  <span className="stitch-nav-badge">{customFoods.length}</span>
                )}
              </button>
            ))}
            <div className="pt-2 border-t border-subtle flex items-center justify-between px-2">
              <span className="text-xs font-semibold text-muted">Theme</span>
              <ThemeToggle showLabel className="has-label" />
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="stitch-main">
        <div className="content p-0 max-w-full">
          {!configured && (
            <div className="config-banner" role="alert">
              <span>ℹ️</span>
              <div>
                <b>Supabase Connection Pending</b>
                To activate live database persistence and session auth, copy{" "}
                <code>.env.example</code> to <code>.env.local</code> and fill in your{" "}
                <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
              </div>
            </div>
          )}

          {/* TAB 1: OVERVIEW (STITCH UI-03) */}
          {activeNav === "Overview" && (
            <>
              {/* STITCH DYNAMIC GOAL HERO */}
              <section className="stitch-hero" aria-label="Daily Nutrition Goal Hero">
                <div className="stitch-hero-glow-1" />
                <div className="stitch-hero-glow-2" />

                <div className="stitch-hero-content">
                  {/* Left: Personalized Greeting & Mindful Context */}
                  <div className="stitch-hero-left">
                    <div className="stitch-hero-pill-row">
                      <span className="stitch-hero-date-pill">
                        <span className="stitch-hero-pulse" />
                        TODAY • {shortDateFormatted.toUpperCase()}
                      </span>
                      <span className="stitch-hero-rhythm-tag">
                        <Icon name="sparkle" size={15} />
                        Mindful Rhythm
                      </span>
                    </div>

                    <h1 className="stitch-hero-title">
                      Welcome back, <em>{displayName}</em>! 🌿
                    </h1>

                    <p className="stitch-hero-desc">
                      Take control of your health journey by organizing daily meals, logging mindful consumption, and monitoring macro vitality all in one harmonious space.
                    </p>
                  </div>

                  {/* Right: Circular Calorie Progress Gauge Card */}
                  <div className="stitch-hero-gauge-card">
                    <div className="stitch-gauge-svg-wrap">
                      <svg className="stitch-gauge-svg" viewBox="0 0 100 100" aria-hidden="true">
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
                          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
                        />
                      </svg>
                      <div className="stitch-gauge-text">
                        <span className="stitch-gauge-kicker">CONSUMED</span>
                        <span className="stitch-gauge-val">{consumedCalories.toLocaleString()}</span>
                        <span className="stitch-gauge-target">/ {calorieGoal.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="stitch-gauge-details">
                      <div className="stitch-gauge-header-row">
                        <span>Daily Target</span>
                        <strong>{caloriePercentage}%</strong>
                      </div>

                      <div className="stitch-gauge-linear-track">
                        <div
                          className="stitch-gauge-linear-bar"
                          style={{ width: `${caloriePercentage}%` }}
                        />
                      </div>

                      <div className="stitch-gauge-footer-row">
                        <span className="left-text">
                          <span className="dot" />
                          {calorieRemaining.toLocaleString()} kcal left
                        </span>
                        <span className="stitch-gauge-status-pill">
                          {consumedCalories > 0 ? "Active Track" : "Fresh Start"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* STITCH 8-MODULE CONSOLE */}
              <section className="stitch-console-section" aria-label="8 Modular Feature Console">
                <div className="stitch-console-header">
                  <div>
                    <div className="stitch-console-eyebrow">
                      <span>DAILY OVERVIEW</span>
                      <span>•</span>
                      <span>Nutrition Hub</span>
                    </div>
                    <h2 className="stitch-console-title">Daily Nutritional Console</h2>
                  </div>

                  <div className="stitch-console-actions">
                    <button
                      type="button"
                      className="stitch-console-btn"
                      onClick={() => setShowQuickAdd(true)}
                    >
                      <Icon name="plus" size={15} />
                      <span>Quick Add</span>
                    </button>
                    <button
                      type="button"
                      className="stitch-console-btn"
                      onClick={reloadData}
                      aria-label="Refresh and sync data"
                    >
                      <Icon name="refresh" size={15} />
                      <span>Sync Log</span>
                    </button>
                  </div>
                </div>

                {/* Grid of 8 Modular Cards */}
                <div className="stitch-module-grid">
                  {/* Card 1: Daily Meal Planner */}
                  <article className="stitch-module-card mod-meal-planner">
                    <div className="stitch-card-top">
                      <div className="stitch-card-icon">
                        <Icon name="calendar" size={20} />
                      </div>
                      <span className="stitch-card-badge">
                        {todayPlanItems.length > 0
                          ? `${loggedPlannedCount} of ${todayPlanItems.length} Logged`
                          : "No Meals Planned"}
                      </span>
                    </div>
                    <div className="stitch-card-body">
                      <h3 className="stitch-card-title">Daily Meal Planner</h3>
                      <p className="stitch-card-desc">
                        Schedule &amp; balance today&apos;s curated course.
                      </p>
                      <div className="space-y-1.5 mt-2">
                        {todayPlanItems.slice(0, 2).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-[var(--surface-container-low)]"
                          >
                            <span className="font-medium text-on-surface truncate max-w-[140px]">
                              {item.slot.toUpperCase()} • {item.name}
                            </span>
                            <span className="text-[10px] text-primary font-bold">
                              {todayLogs.some((l) => l.meal_plan_item_id === item.id)
                                ? "Logged"
                                : `${item.calories} kcal`}
                            </span>
                          </div>
                        ))}
                        {todayPlanItems.length === 0 && (
                          <div className="text-[11px] text-muted italic py-1">
                            No planned meals yet today.
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="stitch-card-btn"
                      onClick={() => setActiveNav("Meal planner")}
                    >
                      <Icon name="calendar" size={15} />
                      <span>Plan Today&apos;s Meals</span>
                    </button>
                  </article>

                  {/* Card 2: Food Consumption Log */}
                  <article className="stitch-module-card mod-food-log">
                    <div className="stitch-card-top">
                      <div className="stitch-card-icon">
                        <Icon name="restaurant" size={20} />
                      </div>
                      <span className="stitch-card-badge">
                        {todayLogs.length > 0 ? `${todayLogs.length} Logged` : "Live Tracker"}
                      </span>
                    </div>
                    <div className="stitch-card-body">
                      <h3 className="stitch-card-title">Food Consumption Log</h3>
                      <p className="stitch-card-desc">
                        Instant diary capture &amp; meal logging.
                      </p>
                      <div className="space-y-2 mt-2">
                        <div className="flex flex-wrap gap-1.5">
                          {customFoods.slice(0, 3).map((f) => (
                            <span
                              key={f.id}
                              className="text-[11px] px-2 py-0.5 rounded-md bg-[var(--surface-container)] text-on-surface-variant cursor-pointer hover:bg-[var(--secondary-fixed)]/40 transition-colors"
                              onClick={() => {
                                setQuickFoodId(f.id);
                                setQuickItemName(f.name);
                                setShowQuickAdd(true);
                              }}
                            >
                              + {f.name}
                            </span>
                          ))}
                          {customFoods.length === 0 && (
                            <span className="text-[11px] text-muted italic">
                              Add items in Food Library for 1-click logging.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="stitch-card-btn"
                      onClick={() => setShowQuickAdd(true)}
                    >
                      <Icon name="plus" size={15} />
                      <span>Quick Log Meal</span>
                    </button>
                  </article>

                  {/* Card 3: Calorie & Energy Tracker */}
                  <article className="stitch-module-card mod-energy-tracker">
                    <div className="stitch-card-top">
                      <div className="stitch-card-icon">
                        <Icon name="fire" size={20} />
                      </div>
                      <span className="stitch-card-badge">
                        {consumedCalories.toLocaleString()} kcal Intaked
                      </span>
                    </div>
                    <div className="stitch-card-body">
                      <h3 className="stitch-card-title">Calorie &amp; Energy Tracker</h3>
                      <p className="stitch-card-desc">
                        Calibrated intake vs daily baseline.
                      </p>
                      <div className="mt-2 flex items-baseline justify-between">
                        <div>
                          <span className="font-bold text-lg text-on-surface font-mono">
                            {calorieRemaining.toLocaleString()}
                          </span>
                          <span className="text-xs text-muted ml-1 font-mono">kcal left</span>
                        </div>
                        <span className="text-xs font-semibold text-primary">
                          {consumedCalories <= calorieGoal ? "On Baseline" : "Exceeded"}
                        </span>
                      </div>
                      {/* Mini Sparkline Pacer */}
                      <div className="h-6 w-full mt-2 flex items-end gap-1 pt-1">
                        <div className="w-1/6 bg-surface-container h-2 rounded-t-sm" />
                        <div className="w-1/6 bg-[#ffe5d9] h-3 rounded-t-sm" />
                        <div className="w-1/6 bg-[#ffe5d9] h-4 rounded-t-sm" />
                        <div className="w-1/6 bg-[#ffd8a8] h-5 rounded-t-sm" />
                        <div className="w-1/6 bg-[#e07a5f] h-6 rounded-t-sm" />
                        <div className="w-1/6 bg-surface-container h-2 rounded-t-sm" />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="stitch-card-btn"
                      onClick={() => setActiveNav("Insights")}
                    >
                      <Icon name="chart" size={15} />
                      <span>View Insights</span>
                    </button>
                  </article>

                  {/* Card 4: Macronutrient Breakdown */}
                  <article className="stitch-module-card mod-macro-breakdown">
                    <div className="stitch-card-top">
                      <div className="stitch-card-icon">
                        <Icon name="pie" size={20} />
                      </div>
                      <span className="stitch-card-badge">Macro Balance</span>
                    </div>
                    <div className="stitch-card-body space-y-2">
                      <h3 className="stitch-card-title">Macro Breakdown</h3>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-on-surface">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                            Protein
                          </span>
                          <span className="font-mono font-semibold">
                            {protein}g <span className="text-muted font-normal">/ 120g</span>
                          </span>
                        </div>
                        <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[var(--primary-container)] h-full rounded-full"
                            style={{ width: `${Math.min(100, (protein / 120) * 100)}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-on-surface pt-1">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#f59f00]" />
                            Carbs
                          </span>
                          <span className="font-mono font-semibold">
                            {carbs}g <span className="text-muted font-normal">/ 220g</span>
                          </span>
                        </div>
                        <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#fab005] h-full rounded-full"
                            style={{ width: `${Math.min(100, (carbs / 220) * 100)}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-on-surface pt-1">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[var(--secondary)]" />
                            Fats
                          </span>
                          <span className="font-mono font-semibold">
                            {fat}g <span className="text-muted font-normal">/ 70g</span>
                          </span>
                        </div>
                        <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[var(--secondary)] h-full rounded-full"
                            style={{ width: `${Math.min(100, (fat / 70) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="stitch-card-btn"
                      onClick={() => setActiveNav("Insights")}
                    >
                      <Icon name="chart" size={15} />
                      <span>Balance Macros</span>
                    </button>
                  </article>

                  {/* Card 5: Weekly History */}
                  <article className="stitch-module-card mod-weekly-history">
                    <div className="stitch-card-top">
                      <div className="stitch-card-icon">
                        <Icon name="calendar" size={20} />
                      </div>
                      <span className="stitch-card-badge">
                        {todayLogs.length > 0 ? "Active Day" : "Start Today"}
                      </span>
                    </div>
                    <div className="stitch-card-body">
                      <h3 className="stitch-card-title">Weekly Meal History</h3>
                      <p className="stitch-card-desc">
                        Consistent nutrition across 7-day cycles.
                      </p>
                      <div className="mt-3 flex items-center justify-between px-1">
                        {weekDays.map((day, i) => (
                          <div key={i} className="flex flex-col items-center gap-1">
                            <span
                              className={`text-[10px] font-bold ${
                                i === currentDayIndex ? "text-primary" : "text-outline"
                              }`}
                            >
                              {day}
                            </span>
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                                i === currentDayIndex && todayLogs.length > 0
                                  ? "bg-primary text-white ring-2 ring-primary-fixed"
                                  : i === currentDayIndex
                                  ? "bg-surface-container text-primary font-bold ring-1 ring-primary"
                                  : "bg-surface-container text-muted"
                              }`}
                            >
                              {i === currentDayIndex && todayLogs.length > 0 ? "✓" : i + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="stitch-card-btn"
                      onClick={() => setActiveNav("Insights")}
                    >
                      <Icon name="arrow" size={15} />
                      <span>Review Past Logs</span>
                    </button>
                  </article>

                  {/* Card 6: Smart Grocery List */}
                  <article className="stitch-module-card mod-smart-grocery">
                    <div className="stitch-card-top">
                      <div className="stitch-card-icon">
                        <Icon name="shopping" size={20} />
                      </div>
                      <span className="stitch-card-badge">
                        {todayPlanItems.length > 0
                          ? `${todayPlanItems.length} Ingredients`
                          : "Pantry Ready"}
                      </span>
                    </div>
                    <div className="stitch-card-body">
                      <h3 className="stitch-card-title">Smart Grocery List</h3>
                      <p className="stitch-card-desc">
                        Directly aggregated from planned meals.
                      </p>
                      <div className="space-y-1.5 mt-2 text-xs">
                        {todayPlanItems.slice(0, 3).map((item) => (
                          <label
                            key={item.id}
                            className="flex items-center gap-2 text-on-surface cursor-pointer hover:text-primary"
                          >
                            <input
                              type="checkbox"
                              defaultChecked={todayLogs.some((l) => l.meal_plan_item_id === item.id)}
                              className="rounded text-primary focus:ring-0 accent-primary w-3.5 h-3.5"
                              onChange={() => handleToggleLog(item)}
                            />
                            <span
                              className={`truncate ${
                                todayLogs.some((l) => l.meal_plan_item_id === item.id)
                                  ? "line-through text-outline"
                                  : ""
                              }`}
                            >
                              {item.name} ({item.quantity} {item.unit})
                            </span>
                          </label>
                        ))}
                        {todayPlanItems.length === 0 && (
                          <div className="text-[11px] text-muted italic">
                            Plan meals to generate your grocery items.
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="stitch-card-btn"
                      onClick={() => setActiveNav("Meal planner")}
                    >
                      <Icon name="shopping" size={15} />
                      <span>Open Meal Planner</span>
                    </button>
                  </article>

                  {/* Card 7: Nutrition Summary */}
                  <article className="stitch-module-card mod-nutrition-summary">
                    <div className="stitch-card-top">
                      <div className="stitch-card-icon">
                        <Icon name="sparkle" size={20} />
                      </div>
                      <span className="stitch-card-badge">Nutrition Index</span>
                    </div>
                    <div className="stitch-card-body">
                      <h3 className="stitch-card-title">Nutrition Summary</h3>
                      <p className="stitch-card-desc">
                        Essential micronutrients &amp; daily fiber.
                      </p>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="p-2 rounded-lg bg-[var(--surface-container-low)]">
                          <span className="text-[10px] text-outline uppercase font-bold block">
                            DIETARY FIBER
                          </span>
                          <p className="text-sm font-bold text-on-surface font-mono mt-0.5">
                            {formatNutrient(fiber, "g")}
                          </p>
                          <span className="text-[10px] text-primary font-semibold">
                            {Math.round((fiber / 28) * 100)}% RDI
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-[var(--surface-container-low)]">
                          <span className="text-[10px] text-outline uppercase font-bold block">
                            TOTAL MACROS
                          </span>
                          <p className="text-sm font-bold text-on-surface font-mono mt-0.5">
                            {totalMacros}g
                          </p>
                          <span className="text-[10px] text-muted">Density</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="stitch-card-btn"
                      onClick={() => setActiveNav("Insights")}
                    >
                      <Icon name="chart" size={15} />
                      <span>Explore Summaries</span>
                    </button>
                  </article>

                  {/* Card 8: Health Profile & Water Goals */}
                  <article className="stitch-module-card mod-health-profile">
                    <div className="stitch-card-top">
                      <div className="stitch-card-icon">
                        <Icon name="water" size={20} />
                      </div>
                      <span className="stitch-card-badge">Hydration</span>
                    </div>
                    <div className="stitch-card-body">
                      <h3 className="stitch-card-title">Health Profile &amp; Water</h3>
                      <p className="stitch-card-desc">
                        Hydration &amp; wellness calibration.
                      </p>
                      <div className="bg-[var(--surface-container-low)] p-2.5 rounded-xl mt-2">
                        <div className="flex justify-between items-center mb-1 text-xs">
                          <span className="text-muted">Water Intake</span>
                          <span className="font-bold text-secondary font-mono">
                            {(waterGlasses * 0.25).toFixed(1)}L{" "}
                            <span className="font-normal text-outline">/ 2.0L</span>
                          </span>
                        </div>
                        <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[var(--secondary-fixed-dim)] h-full rounded-full"
                            style={{ width: `${Math.min(100, (waterGlasses / 8) * 100)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-end gap-1.5 mt-2">
                          <button
                            type="button"
                            className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-surface-container-lowest hover:bg-[var(--secondary-fixed)] text-secondary shadow-xs"
                            onClick={() => setWaterGlasses((prev) => Math.min(8, prev + 1))}
                          >
                            +250ml
                          </button>
                          <button
                            type="button"
                            className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-surface-container-lowest hover:bg-[var(--secondary-fixed)] text-secondary shadow-xs"
                            onClick={() => setWaterGlasses((prev) => Math.min(8, prev + 2))}
                          >
                            +500ml
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="stitch-card-btn"
                      onClick={() => setActiveNav("Settings")}
                    >
                      <Icon name="settings" size={15} />
                      <span>Configure Targets</span>
                    </button>
                  </article>
                </div>
              </section>

              {/* TIMELINE & RIGHT-SIDE ACTION SPLIT SECTION */}
              <section className="stitch-split-section" aria-label="Meal progression and search">
                {/* Left: Today's Visual Meal Progression Timeline */}
                <div className="stitch-timeline-panel">
                  <div>
                    <div className="stitch-timeline-header">
                      <div>
                        <div className="stitch-timeline-kicker">SCHEDULED NUTRITION</div>
                        <h3 className="stitch-timeline-title">Today&apos;s Meal Progression</h3>
                      </div>
                      <span className="stitch-timeline-count-badge">
                        {todayPlanItems.length} Planned
                      </span>
                    </div>

                    <div className="stitch-timeline-list">
                      {todayPlanItems.length === 0 ? (
                        <div className="empty-state-wrap">
                          <div className="empty-state-icon">🥗</div>
                          <h4 className="empty-state-title">No planned meals for today</h4>
                          <p className="empty-state-desc">
                            Schedule breakfast, lunch, dinner, or snacks to follow your mindful routine.
                          </p>
                          <button
                            type="button"
                            className="stitch-action-btn mt-2"
                            onClick={() => setShowQuickAdd(true)}
                          >
                            <Icon name="plus" size={15} />
                            <span>Add your first meal</span>
                          </button>
                        </div>
                      ) : (
                        todayPlanItems.map((item) => {
                          const isLogged = todayLogs.some(
                            (l) => l.meal_plan_item_id === item.id
                          );
                          const slotEmoji =
                            item.slot === "breakfast"
                              ? "🥞"
                              : item.slot === "lunch"
                              ? "🥗"
                              : item.slot === "dinner"
                              ? "🍲"
                              : "🍎";

                          return (
                            <div key={item.id} className="stitch-timeline-row">
                              <div
                                className={`stitch-timeline-marker ${
                                  isLogged ? "done" : "scheduled"
                                }`}
                              >
                                <Icon name={isLogged ? "check" : "calendar"} size={14} />
                              </div>

                              <div className="stitch-timeline-card-content">
                                <div className="stitch-timeline-left-info">
                                  <div className="stitch-timeline-emoji">{slotEmoji}</div>
                                  <div className="stitch-timeline-meta">
                                    <h4 className="stitch-timeline-item-name">{item.name}</h4>
                                    <p className="stitch-timeline-item-sub">
                                      <span>{item.slot.toUpperCase()}</span>
                                      <span>•</span>
                                      <span>{item.quantity} {item.unit}</span>
                                      <span>•</span>
                                      <span className="font-mono font-semibold">
                                        {formatNutrient(item.calories, "")} kcal
                                      </span>
                                    </p>
                                  </div>
                                </div>

                                <div className="stitch-timeline-action-wrap">
                                  <span
                                    className={`stitch-timeline-tag ${
                                      isLogged ? "logged" : "scheduled"
                                    }`}
                                  >
                                    {isLogged ? "Logged" : "Scheduled"}
                                  </span>

                                  <button
                                    type="button"
                                    className={`stitch-timeline-toggle-btn ${
                                      isLogged ? "logged" : ""
                                    }`}
                                    onClick={() => handleToggleLog(item)}
                                    aria-label={`${isLogged ? "Unmark" : "Log"} ${item.name}`}
                                  >
                                    {isLogged ? "Logged ✓" : "Log Now"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="stitch-timeline-footer">
                    <span>
                      Daily confirmation:{" "}
                      <strong>
                        {loggedPlannedCount} of {todayPlanItems.length} meals confirmed
                      </strong>
                    </span>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-primary font-semibold text-xs hover:underline"
                      onClick={() => setActiveNav("Meal planner")}
                    >
                      <span>View Full Meal Plan</span>
                      <Icon name="arrow" size={14} />
                    </button>
                  </div>
                </div>

                {/* Right Side: Mindful Inspiration & Database Connector */}
                <div className="stitch-side-column">
                  {/* Curated Botanical Wellness Insight */}
                  <article className="stitch-insight-card">
                    <div className="stitch-insight-glow" />
                    <div>
                      <div className="stitch-insight-header">
                        <span className="stitch-insight-kicker">MINDFUL INSIGHT</span>
                        <Icon name="sparkle" size={18} />
                      </div>
                      <h4 className="stitch-insight-title">Prioritizing Whole Phytonutrients</h4>
                      <p className="stitch-insight-quote">
                        &ldquo;Eating the colors of the botanical spectrum elevates cellular vitality and supports natural energy rhythms.&rdquo;
                      </p>
                    </div>
                    <div className="stitch-insight-footer">
                      <span>Clinical Nutrition Guidance</span>
                      <button
                        type="button"
                        className="underline hover:text-white"
                        onClick={() => setActiveNav("Insights")}
                      >
                        Explore Research
                      </button>
                    </div>
                  </article>

                  {/* Fast Search Food Database Connector */}
                  <article className="stitch-search-connector-card">
                    <div>
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">
                        INSTANT LOOKUP
                      </span>
                      <h4 className="text-base font-bold text-on-surface mt-0.5">
                        Nutritional Database
                      </h4>
                      <p className="text-xs text-muted mt-1">
                        Search verified whole foods and curated botanical recipes.
                      </p>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          setActiveNav("Food library");
                        }}
                        className="stitch-search-input-wrap"
                      >
                        <span className="stitch-search-icon-left">
                          <Icon name="search" size={16} />
                        </span>
                        <input
                          type="text"
                          placeholder="Search food library..."
                          value={fastSearchTerm}
                          onChange={(e) => setFastSearchTerm(e.target.value)}
                        />
                        <button type="submit" className="stitch-search-btn-right">
                          Search
                        </button>
                      </form>

                      <div className="stitch-trending-tags">
                        <span className="text-[10px] font-bold text-outline mr-1">Quick:</span>
                        {["Matcha", "Quinoa", "Avocado", "Salmon"].map((tag) => (
                          <span
                            key={tag}
                            className="stitch-tag-pill"
                            onClick={() => {
                              setQuickItemName(tag);
                              setShowQuickAdd(true);
                            }}
                          >
                            + {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 p-2.5 rounded-xl bg-[var(--surface-container-low)] flex items-center justify-between text-xs">
                      <span className="text-muted">
                        Library Status: <b>{customFoods.length} items available</b>
                      </span>
                      <button
                        type="button"
                        className="text-primary font-bold hover:underline"
                        onClick={() => setActiveNav("Food library")}
                      >
                        Manage →
                      </button>
                    </div>
                  </article>
                </div>
              </section>

              {/* CLINICAL SCOPE & EDUCATIONAL DISCLAIMER BANNER */}
              <aside className="stitch-disclaimer-card" role="note">
                <div className="stitch-disclaimer-icon">
                  <Icon name="shield" size={20} />
                </div>
                <div>
                  <div className="stitch-disclaimer-title">
                    <span>Scope Boundary &amp; Educational Platform</span>
                    <span className="stitch-disclaimer-badge">Informational</span>
                  </div>
                  <p className="stitch-disclaimer-text">
                    The Nutricious Goals System is an educational self-monitoring platform designed to cultivate self-efficacy and dietary mindfulness. This application strictly excludes medical diagnoses, disease treatment, or formal clinical prescriptions. Always consult a licensed healthcare provider regarding clinical conditions.
                  </p>
                </div>
              </aside>
            </>
          )}

          {/* TAB 2: MEAL PLANNER */}
          {activeNav === "Meal planner" && (
            <MealPlannerView
              customFoods={customFoods}
              initialDate={todayDateStr}
              onDataChanged={reloadData}
              dietaryPreference={userDietaryPreference}
            />
          )}

          {/* TAB 3: FOOD LIBRARY */}
          {activeNav === "Food library" && (
            <CustomFoodsManager
              initialFoods={customFoods}
              onFoodsChanged={reloadData}
            />
          )}

          {/* TAB 4: INSIGHTS */}
          {activeNav === "Insights" && (
            <InsightsView
              customFoods={customFoods}
              todayLogs={todayLogs}
              todayPlanItems={todayPlanItems}
            />
          )}

          {/* TAB 5: SETTINGS */}
          {activeNav === "Settings" && (
            <SettingsView user={user} configured={configured} />
          )}

          {/* TAB 6: ADMIN CONSOLE (FR-18, FR-19) */}
          {activeNav === "Admin console" && (
            <AdminConsoleView
              configured={configured}
              foodsCount={customFoods.length + 12}
              customFoodsCount={customFoods.length}
            />
          )}

          <footer className="page-foot">
            <span>Made for your wellbeing <i>♡</i></span>
            <span className="page-foot-separator">•</span>
            <span>Small steps, steady progress.</span>
          </footer>
        </div>
      </main>

      {/* QUICK ADD MODAL ON OVERVIEW */}
      {showQuickAdd && (
        <div className="modal-backdrop" onClick={() => setShowQuickAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowQuickAdd(false)}
              aria-label="Close modal"
            >
              ×
            </button>
            <span className="section-kicker">QUICK ADD</span>
            <h2>Add meal to today&apos;s plan</h2>

            {/* Smart recommendations tray based on user diet */}
            <div className="mt-3 p-3 rounded-xl bg-[var(--surface-container-low)] border border-[var(--border-subtle)]">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--on-surface)] mb-2">
                <span>🌱 Recommended for your plan:</span>
                <span className="text-[10px] text-[var(--primary)] font-semibold">Click to autofill</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 custom-scroll">
                {getRecommendedFoods(userDietaryPreference).slice(0, 5).map((rec) => (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => {
                      setQuickItemName(rec.name);
                      setQuickSlot(rec.slot);
                      setQuickFoodId("");
                    }}
                    className="shrink-0 p-2 rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] text-left hover:border-[var(--primary)] transition-all"
                    style={{ minWidth: 150 }}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--on-surface)] truncate">
                      <span>{rec.emoji}</span>
                      <span className="truncate">{rec.name}</span>
                    </div>
                    <div className="text-[10px] text-[var(--primary)] font-mono font-bold mt-1">
                      {rec.calories} kcal • {rec.protein}g P
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleQuickAdd} className="auth-form" style={{ marginTop: 14 }}>
              {customFoods.length > 0 && (
                <div className="form-group">
                  <label htmlFor="quick-food-select">Select from Food Library</label>
                  <select
                    id="quick-food-select"
                    className="form-select"
                    value={quickFoodId}
                    onChange={(e) => {
                      setQuickFoodId(e.target.value);
                      const f = customFoods.find((x) => x.id === e.target.value);
                      if (f) setQuickItemName(f.name);
                    }}
                  >
                    <option value="">-- Manual Custom Name --</option>
                    {customFoods.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.serving_size} {f.serving_unit})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="quick-name">Meal Name *</label>
                <input
                  id="quick-name"
                  required
                  className="form-input"
                  placeholder="e.g. Oatmeal with Berries"
                  value={quickItemName}
                  onChange={(e) => setQuickItemName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="quick-slot">Meal Slot</label>
                <select
                  id="quick-slot"
                  className="form-select"
                  value={quickSlot}
                  onChange={(e) =>
                    setQuickSlot(
                      e.target.value as "breakfast" | "lunch" | "dinner" | "snack" | "other"
                    )
                  }
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <button
                type="submit"
                className="add-button"
                style={{ height: 40, marginTop: 8 }}
              >
                <Icon name="plus" size={16} /> Add to today&apos;s plan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
