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
import {
  getRecommendedFoods,
  COUNTRY_OPTIONS,
  getBMICategory,
  type RecommendedFood,
} from "@/lib/nutrition/recommendations";
import { getFoodImage } from "@/lib/nutrition/food-images";

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
  return (
    <svg {...common}>
      {paths[name] || paths.grid}
    </svg>
  );
}

function getFoodEmoji(name: string, slot?: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("egg") || lower.includes("itlog") || lower.includes("omelet") || lower.includes("scrambled")) return "🍳";
  if (lower.includes("rice") || lower.includes("kanin") || lower.includes("sinangag") || lower.includes("arroz")) return "🍚";
  if (lower.includes("bread") || lower.includes("toast") || lower.includes("pandesal") || lower.includes("wheat") || lower.includes("sandwich")) return "🍞";
  if (lower.includes("banana") || lower.includes("saging")) return "🍌";
  if (lower.includes("mango") || lower.includes("mangga")) return "🥭";
  if (lower.includes("apple") || lower.includes("mansanas")) return "🍎";
  if (lower.includes("water") || lower.includes("tubig")) return "💧";
  if (lower.includes("coffee") || lower.includes("kape") || lower.includes("latte") || lower.includes("espresso")) return "☕";
  if (lower.includes("tea") || lower.includes("tsaa")) return "🍵";
  if (lower.includes("chicken") || lower.includes("manok") || lower.includes("tinola") || lower.includes("adobo") || lower.includes("inasal")) return "🍗";
  if (lower.includes("fish") || lower.includes("isda") || lower.includes("bangus") || lower.includes("tilapia") || lower.includes("salmon") || lower.includes("tuna")) return "🐟";
  if (lower.includes("pork") || lower.includes("baboy") || lower.includes("liempo") || lower.includes("sinigang") || lower.includes("lechon")) return "🥩";
  if (lower.includes("beef") || lower.includes("baka") || lower.includes("bistek") || lower.includes("bulalo") || lower.includes("steak")) return "🥩";
  if (lower.includes("salad") || lower.includes("gulay") || lower.includes("vegetable") || lower.includes("pinakbet") || lower.includes("chop suey")) return "🥗";
  if (lower.includes("soup") || lower.includes("sopas") || lower.includes("broth")) return "🍲";
  if (lower.includes("oat") || lower.includes("oatmeal") || lower.includes("cereal") || lower.includes("champorado")) return "🥣";
  if (lower.includes("milk") || lower.includes("gatas") || lower.includes("yogurt")) return "🥛";
  if (lower.includes("fruit") || lower.includes("prutas") || lower.includes("orange") || lower.includes("citrus")) return "🍊";
  if (lower.includes("avocado") || lower.includes("abokado")) return "🥑";
  if (lower.includes("cookie") || lower.includes("biscuit") || lower.includes("snack") || lower.includes("cracker")) return "🍪";

  if (slot === "breakfast") return "🥞";
  if (slot === "lunch") return "🥗";
  if (slot === "dinner") return "🍲";
  if (slot === "snack") return "🍎";
  return "🍽️";
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
  const userCountry = user?.country || "global";
  const userCountryObj = COUNTRY_OPTIONS.find((c) => c.id === userCountry.toLowerCase());
  const bmiValue = user?.bmi ? Number(user.bmi) : null;
  const bmiCategory = bmiValue ? getBMICategory(bmiValue) : null;

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
  const [selectedQuickRecId, setSelectedQuickRecId] = useState<string | null>(null);
  const [quickNutrients, setQuickNutrients] = useState<{
    calories?: number | null;
    protein?: number | null;
    carbs?: number | null;
    fat?: number | null;
    fiber?: number | null;
    quantity?: number;
    unit?: string;
  }>({});
  const [quickAddLoading, setQuickAddLoading] = useState(false);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickItemName.trim()) return;
    setQuickAddLoading(true);

    try {
      const res = await addMealPlanItem({
        dateStr: todayDateStr,
        slot: quickSlot,
        name: quickItemName.trim(),
        foodId: quickFoodId || null,
        quantity: quickNutrients.quantity || 1,
        unit: quickNutrients.unit || "serving",
        calories: quickNutrients.calories ?? null,
        protein: quickNutrients.protein ?? null,
        carbs: quickNutrients.carbs ?? null,
        fat: quickNutrients.fat ?? null,
        fiber: quickNutrients.fiber ?? null,
      });

      if (res.success && res.data) {
        setTodayPlanItems((prev) => [...prev, res.data!]);
        setShowQuickAdd(false);
        setQuickItemName("");
        setQuickFoodId("");
        setSelectedQuickRecId(null);
        setQuickNutrients({});
        reloadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setQuickAddLoading(false);
    }
  };

  const handleDirectQuickAdd = async (rec: RecommendedFood) => {
    setQuickAddLoading(true);
    try {
      const res = await addMealPlanItem({
        dateStr: todayDateStr,
        slot: rec.slot,
        name: rec.name,
        foodId: null,
        quantity: rec.servingSize,
        unit: rec.servingUnit,
        calories: rec.calories,
        protein: rec.protein,
        carbs: rec.carbs,
        fat: rec.fat,
        fiber: rec.fiber,
      });
      if (res.success && res.data) {
        setTodayPlanItems((prev) => [...prev, res.data!]);
        setShowQuickAdd(false);
        reloadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setQuickAddLoading(false);
    }
  };

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
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

        {/* Mobile Navigation Drawer & Backdrop */}
        {mobileMenuOpen && (
          <>
            <div
              className="stitch-mobile-backdrop"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div
              className="stitch-mobile-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile Navigation Menu"
            >
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
                  <div className="flex items-center gap-2.5">
                    <Icon name={icon} size={18} />
                    <span className="font-medium">{label}</span>
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
          </>
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
                      <div className="space-y-1.5 mt-1">
                        {todayPlanItems.slice(0, 2).map((item) => {
                          const isItemLogged = todayLogs.some((l) => l.meal_plan_item_id === item.id);
                          return (
                            <div key={item.id} className="stitch-card-mini-item">
                              <div className="flex items-center gap-2 min-w-0">
                                {getFoodImage(item.name, item.slot) ? (
                                  <img
                                    src={getFoodImage(item.name, item.slot)!}
                                    alt={item.name}
                                    className="w-5 h-5 rounded-md object-cover shrink-0 shadow-xs"
                                    loading="lazy"
                                  />
                                ) : (
                                  <span className="text-sm shrink-0">{getFoodEmoji(item.name, item.slot)}</span>
                                )}
                                <span className="font-semibold text-on-surface truncate text-xs">
                                  {item.name}
                                </span>
                              </div>
                              <span
                                className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full shrink-0 ${
                                  isItemLogged
                                    ? "bg-[rgba(0,82,60,0.12)] text-primary"
                                    : "bg-surface-container-high text-on-surface-variant"
                                }`}
                              >
                                {isItemLogged ? "✓ Logged" : `${item.calories || 0} kcal`}
                              </span>
                            </div>
                          );
                        })}
                        {todayPlanItems.length > 2 && (
                          <div className="text-[11px] text-muted font-medium text-center pt-0.5">
                            +{todayPlanItems.length - 2} more meals scheduled
                          </div>
                        )}
                        {todayPlanItems.length === 0 && (
                          <div className="p-3 rounded-xl bg-[var(--surface-container-low)] text-center text-xs text-muted">
                            🥗 No meals planned yet today.
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
                        {todayLogs.length > 0 ? `${todayLogs.length} Meals Logged` : "Live Diary"}
                      </span>
                    </div>
                    <div className="stitch-card-body">
                      <h3 className="stitch-card-title">Food Consumption Log</h3>
                      <p className="stitch-card-desc">
                        Instant diary capture &amp; mindful logging.
                      </p>
                      <div className="space-y-2 mt-1">
                        <div className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-[var(--surface-container-low)]">
                          <span className="text-muted">Today&apos;s Total:</span>
                          <span className="font-mono font-bold text-secondary">
                            {consumedCalories.toLocaleString()} kcal
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {customFoods.slice(0, 3).map((f) => (
                            <span
                              key={f.id}
                              className="stitch-card-quick-tag"
                              onClick={() => {
                                setQuickFoodId(f.id);
                                setQuickItemName(f.name);
                                setShowQuickAdd(true);
                              }}
                              title={`Quick log ${f.name}`}
                            >
                              <span>{getFoodEmoji(f.name)}</span>
                              <span>+ {f.name}</span>
                            </span>
                          ))}
                          {customFoods.length === 0 && (
                            <span className="text-[11px] text-muted italic">
                              Add foods in Library for 1-click logging.
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
                        {caloriePercentage}% Target
                      </span>
                    </div>
                    <div className="stitch-card-body">
                      <h3 className="stitch-card-title">Calorie &amp; Energy Tracker</h3>
                      <p className="stitch-card-desc">
                        Calibrated intake vs daily baseline.
                      </p>
                      <div className="mt-1">
                        <div className="flex items-baseline justify-between mb-1">
                          <div className="flex items-baseline gap-1">
                            <span className="font-extrabold text-2xl text-on-surface font-mono">
                              {consumedCalories.toLocaleString()}
                            </span>
                            <span className="text-xs text-muted font-mono">
                              / {calorieGoal.toLocaleString()} kcal
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              consumedCalories <= calorieGoal
                                ? "bg-[rgba(0,82,60,0.12)] text-primary"
                                : "bg-[rgba(239,68,68,0.12)] text-error"
                            }`}
                          >
                            {consumedCalories <= calorieGoal ? "On Baseline" : "Surplus"}
                          </span>
                        </div>

                        {/* Progress Bar with vibrant gradient */}
                        <div className="w-full bg-[var(--surface-container-high)] h-2 rounded-full overflow-hidden mt-2">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${caloriePercentage}%`,
                              background: "linear-gradient(90deg, #f59e0b, #ea580c)",
                            }}
                          />
                        </div>

                        <div className="flex justify-between items-center text-[11px] text-muted mt-2 font-mono">
                          <span>{calorieRemaining.toLocaleString()} kcal left</span>
                          <span>{caloriePercentage}% reached</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="stitch-card-btn"
                      onClick={() => setActiveNav("Insights")}
                    >
                      <Icon name="chart" size={15} />
                      <span>View Energy Insights</span>
                    </button>
                  </article>

                  {/* Card 4: Macronutrient Breakdown */}
                  <article className="stitch-module-card mod-macro-breakdown">
                    <div className="stitch-card-top">
                      <div className="stitch-card-icon">
                        <Icon name="pie" size={20} />
                      </div>
                      <span className="stitch-card-badge">Macro Ratios</span>
                    </div>
                    <div className="stitch-card-body space-y-2">
                      <h3 className="stitch-card-title">Macro Breakdown</h3>
                      <p className="stitch-card-desc">
                        Balanced daily macronutrient targets.
                      </p>
                      <div className="space-y-1.5 text-xs">
                        {/* Protein */}
                        <div>
                          <div className="flex justify-between text-on-surface mb-0.5">
                            <span className="flex items-center gap-1.5 font-medium">
                              <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                              Protein
                            </span>
                            <span className="font-mono font-bold text-xs">
                              {protein}g <span className="text-muted font-normal text-[10px]">/ 120g</span>
                            </span>
                          </div>
                          <div className="w-full bg-[var(--surface-container)] h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[var(--primary)] h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, (protein / 120) * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Carbs */}
                        <div>
                          <div className="flex justify-between text-on-surface mb-0.5">
                            <span className="flex items-center gap-1.5 font-medium">
                              <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                              Carbohydrates
                            </span>
                            <span className="font-mono font-bold text-xs">
                              {carbs}g <span className="text-muted font-normal text-[10px]">/ 220g</span>
                            </span>
                          </div>
                          <div className="w-full bg-[var(--surface-container)] h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#f59e0b] h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, (carbs / 220) * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Fats */}
                        <div>
                          <div className="flex justify-between text-on-surface mb-0.5">
                            <span className="flex items-center gap-1.5 font-medium">
                              <span className="w-2 h-2 rounded-full bg-[#f43f5e]" />
                              Fats
                            </span>
                            <span className="font-mono font-bold text-xs">
                              {fat}g <span className="text-muted font-normal text-[10px]">/ 70g</span>
                            </span>
                          </div>
                          <div className="w-full bg-[var(--surface-container)] h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#f43f5e] h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, (fat / 70) * 100)}%` }}
                            />
                          </div>
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
                        {todayLogs.length > 0 ? "Logged Today" : "Active Week"}
                      </span>
                    </div>
                    <div className="stitch-card-body">
                      <h3 className="stitch-card-title">Weekly Meal History</h3>
                      <p className="stitch-card-desc">
                        Consistent nutrition across 7-day cycles.
                      </p>
                      <div className="mt-2 flex items-center justify-between px-1 gap-1 overflow-x-auto pb-0.5">
                        {weekDays.map((day, i) => {
                          const isToday = i === currentDayIndex;
                          const hasLog = isToday && todayLogs.length > 0;
                          return (
                            <div key={day} className="flex flex-col items-center gap-1 flex-1 min-w-[32px]">
                              <span
                                className={`text-[10px] font-bold ${
                                  isToday ? "text-[#ec4899]" : "text-muted"
                                }`}
                              >
                                {day}
                              </span>
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${
                                  hasLog
                                    ? "bg-[#ec4899] text-white shadow-xs"
                                    : isToday
                                    ? "bg-[rgba(236,72,153,0.12)] text-[#ec4899] ring-2 ring-[#ec4899]"
                                    : "bg-[var(--surface-container-low)] text-muted"
                                }`}
                              >
                                {hasLog ? "✓" : i + 1}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-[11px] text-muted text-center mt-2.5">
                        {todayLogs.length > 0 ? "✓ Daily streak recorded" : "Log today to maintain rhythm"}
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
                      <div className="space-y-1.5 mt-1 text-xs">
                        {todayPlanItems.slice(0, 3).map((item) => {
                          const isLogged = todayLogs.some((l) => l.meal_plan_item_id === item.id);
                          return (
                            <label
                              key={item.id}
                              className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[var(--surface-container-low)] cursor-pointer hover:bg-[var(--surface-container)] transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <input
                                  type="checkbox"
                                  checked={isLogged}
                                  className="rounded text-primary focus:ring-0 accent-primary w-4 h-4 shrink-0"
                                  onChange={() => handleToggleLog(item)}
                                />
                                {getFoodImage(item.name, item.slot) ? (
                                  <img
                                    src={getFoodImage(item.name, item.slot)!}
                                    alt={item.name}
                                    className="w-5 h-5 rounded-md object-cover shrink-0 shadow-xs"
                                    loading="lazy"
                                  />
                                ) : (
                                  <span className="text-sm shrink-0">{getFoodEmoji(item.name, item.slot)}</span>
                                )}
                                <span
                                  className={`truncate text-xs font-medium ${
                                    isLogged ? "line-through text-muted" : "text-on-surface"
                                  }`}
                                >
                                  {item.name}
                                </span>
                              </div>
                              <span className="text-[11px] font-mono text-muted bg-[var(--surface-container)] px-2 py-0.5 rounded-md shrink-0 ml-1.5">
                                {item.quantity} {item.unit}
                              </span>
                            </label>
                          );
                        })}
                        {todayPlanItems.length === 0 && (
                          <div className="p-3 rounded-xl bg-[var(--surface-container-low)] text-center text-xs text-muted">
                            🛒 Plan meals to auto-generate grocery items.
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
                      <span className="stitch-card-badge">Micro &amp; Macro Index</span>
                    </div>
                    <div className="stitch-card-body">
                      <h3 className="stitch-card-title">Nutrition Summary</h3>
                      <p className="stitch-card-desc">
                        Essential micronutrients &amp; daily fiber.
                      </p>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div className="p-2.5 rounded-xl bg-[var(--surface-container-low)] border border-subtle">
                          <span className="text-[10px] text-outline uppercase font-bold block">
                            DIETARY FIBER
                          </span>
                          <p className="text-base font-extrabold text-on-surface font-mono mt-0.5">
                            {formatNutrient(fiber, "g")}
                          </p>
                          <div className="w-full bg-[var(--surface-container)] h-1 rounded-full overflow-hidden my-1">
                            <div
                              className="bg-[#d97706] h-full rounded-full"
                              style={{ width: `${Math.min(100, Math.round((fiber / 28) * 100))}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-[#d97706] font-bold">
                            {Math.round((fiber / 28) * 100)}% of 28g RDI
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-[var(--surface-container-low)] border border-subtle">
                          <span className="text-[10px] text-outline uppercase font-bold block">
                            TOTAL DENSITY
                          </span>
                          <p className="text-base font-extrabold text-on-surface font-mono mt-0.5">
                            {totalMacros}g
                          </p>
                          <span className="text-[10px] text-muted block mt-2 font-mono">
                            P:{protein}g • C:{carbs}g • F:{fat}g
                          </span>
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

                  {/* Card 8: Health Profile, BMI & Hydration */}
                  <article className="stitch-module-card mod-health-profile">
                    <div className="stitch-card-top">
                      <div className="stitch-card-icon">
                        <Icon name="water" size={20} />
                      </div>
                      <span className="stitch-card-badge">
                        {userCountryObj ? `${userCountryObj.flag} ${userCountryObj.label.split(" ")[0]}` : "Health Baseline"}
                      </span>
                    </div>
                    <div className="stitch-card-body">
                      <h3 className="stitch-card-title">Health Profile &amp; Water</h3>
                      <p className="stitch-card-desc">
                        Body calibration &amp; fluid balance.
                      </p>

                      {/* Informational BMI badge */}
                      {bmiValue && bmiCategory ? (
                        <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-[var(--surface-container-low)] border border-subtle mt-1.5">
                          <div className="flex flex-col gap-0.5">
                            <div className="text-xs font-extrabold text-on-surface">
                              BMI <span className="font-mono text-primary">{bmiValue}</span>
                            </div>
                            <div className="text-[11px] text-muted font-medium">
                              {user?.heightCm && user?.weightKg ? `${user.heightCm} cm • ${user.weightKg} kg` : "Profile set"}
                            </div>
                          </div>
                          <span
                            className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0"
                            style={{ backgroundColor: bmiCategory.bgLight, color: bmiCategory.color }}
                          >
                            {bmiCategory.label}
                          </span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-muted italic mt-1 py-1 px-2 rounded-lg bg-[var(--surface-container-low)]">
                          {user?.heightCm && user?.weightKg
                            ? `${user.heightCm} cm • ${user.weightKg} kg`
                            : "Add BMI in Settings →"}
                        </div>
                      )}

                      {/* Hydration Widget */}
                      <div className="bg-[var(--surface-container-low)] p-2.5 rounded-xl border border-subtle mt-2">
                        <div className="flex justify-between items-center mb-1 text-xs">
                          <span className="text-muted font-medium">💧 Fluid Intake</span>
                          <span className="font-bold text-[#0284c7] font-mono">
                            {(waterGlasses * 0.25).toFixed(1)}L{" "}
                            <span className="font-normal text-muted">/ 2.0L ({waterGlasses}/8)</span>
                          </span>
                        </div>
                        <div className="w-full bg-[var(--surface-container)] h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#0284c7] h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, (waterGlasses / 8) * 100)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-2">
                          <button
                            type="button"
                            className="text-xs font-bold px-3 py-1.5 rounded-full bg-surface-container-lowest hover:bg-[#0284c7] hover:text-white text-[#0284c7] border border-subtle transition-all active:scale-95"
                            onClick={() => setWaterGlasses((prev) => Math.min(8, prev + 1))}
                            title="Add 1 glass of water"
                          >
                            +250ml
                          </button>
                          <button
                            type="button"
                            className="text-xs font-bold px-3 py-1.5 rounded-full bg-surface-container-lowest hover:bg-[#0284c7] hover:text-white text-[#0284c7] border border-subtle transition-all active:scale-95"
                            onClick={() => setWaterGlasses((prev) => Math.min(8, prev + 2))}
                            title="Add 2 glasses of water"
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
                      <span>Update Baseline</span>
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
                          const slotEmoji = getFoodEmoji(item.name, item.slot);
                          const foodImg = getFoodImage(item.name, item.slot);

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
                                  <div className="stitch-timeline-emoji overflow-hidden relative shadow-xs">
                                    {foodImg ? (
                                      <img
                                        src={foodImg}
                                        alt={item.name}
                                        className="w-full h-full object-cover rounded-xl"
                                        loading="lazy"
                                      />
                                    ) : (
                                      <span>{slotEmoji}</span>
                                    )}
                                  </div>
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
                          placeholder="Search food library (e.g. Salmon, Spinach)..."
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

              {/* NUTRITIONAL TRACKING INFORMATIONAL GUIDANCE */}
              <aside className="stitch-disclaimer-card" role="note">
                <div className="stitch-disclaimer-icon">
                  <Icon name="shield" size={20} />
                </div>
                <div>
                  <div className="stitch-disclaimer-title">
                    <span>Nutritional Self-Monitoring Baseline</span>
                    <span className="stitch-disclaimer-badge">Informational</span>
                  </div>
                  <p className="stitch-disclaimer-text">
                    Nutricious Goals is a self-monitoring tool designed to cultivate mindful eating habits. Summaries and metric calculations are strictly informational and do not constitute clinical diagnoses or medical advice.
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
              country={user?.country}
              onLogWater={(glasses) => setWaterGlasses((prev) => prev + glasses)}
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
            <span>Nutricious Goals • Personalized Nutrition &amp; Meal Planning</span>
            <span className="page-foot-separator">•</span>
            <span>Balanced living through mindful choices.</span>
          </footer>
        </div>
      </main>

      {/* QUICK ADD MODAL ON OVERVIEW */}
      {showQuickAdd && (
        <div className="modal-backdrop" onClick={() => setShowQuickAdd(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 540,
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              padding: "24px 28px 16px",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div style={{ flexShrink: 0 }}>
              <button
                className="modal-close"
                onClick={() => setShowQuickAdd(false)}
                aria-label="Close modal"
              >
                ×
              </button>
              <span className="section-kicker">QUICK ADD</span>
              <h2>Add meal to today&apos;s plan</h2>
            </div>

            <form
              onSubmit={handleQuickAdd}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              {/* Scrollable Content Body */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  paddingRight: 6,
                  margin: "8px 0 10px",
                }}
              >
                {/* Smart recommendations tray based on user country and diet */}
                <div className="p-3 rounded-xl bg-[var(--surface-container-low)] border border-[var(--border-subtle)] mb-3">
                  <div className="flex items-center justify-between text-xs font-bold text-[var(--on-surface)] mb-2">
                    <span>🌱 Recommended for you {userCountryObj ? `(${userCountryObj.flag} ${userCountryObj.label.split(" ")[0]})` : ""}:</span>
                    <span className="text-[10px] text-[var(--primary)] font-semibold">Click to select &amp; confirm</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 custom-scroll">
                    {getRecommendedFoods(userCountry, userDietaryPreference, quickSlot).slice(0, 8).map((rec) => {
                      const isSelected = selectedQuickRecId === rec.id || quickItemName === rec.name;
                      return (
                        <div
                          key={rec.id}
                          onClick={() => {
                            setSelectedQuickRecId(rec.id);
                            setQuickItemName(rec.name);
                            setQuickSlot(rec.slot);
                            setQuickFoodId("");
                            setQuickNutrients({
                              calories: rec.calories,
                              protein: rec.protein,
                              carbs: rec.carbs,
                              fat: rec.fat,
                              fiber: rec.fiber,
                              quantity: rec.servingSize,
                              unit: rec.servingUnit,
                            });
                          }}
                          className={`shrink-0 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? "border-[var(--primary)] bg-[var(--surface-container-high)] shadow-sm"
                              : "border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] hover:border-[var(--primary)]"
                          }`}
                          style={{ minWidth: 175, maxWidth: 210 }}
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-[var(--on-surface)]">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="text-base">{rec.emoji}</span>
                              <span className="truncate" title={rec.name}>{rec.name}</span>
                            </div>
                            {isSelected && (
                              <span className="text-xs text-[var(--primary)] font-extrabold ml-1">✓</span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted truncate mt-0.5">
                            {rec.portionDesc}
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[var(--border-subtle)]">
                            <span className="text-[11px] font-bold font-mono text-[var(--primary)]">
                              {rec.calories} kcal
                            </span>
                            <button
                              type="button"
                              disabled={quickAddLoading}
                              onClick={async (e) => {
                                e.stopPropagation();
                                await handleDirectQuickAdd(rec);
                              }}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--primary)] text-white hover:opacity-90 transition-opacity"
                            >
                              + Add
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="auth-form" style={{ marginTop: 0 }}>
                  {customFoods.length > 0 && (
                    <div className="form-group">
                      <label htmlFor="quick-food-select">Select from Food Library</label>
                      <select
                        id="quick-food-select"
                        className="form-select"
                        value={quickFoodId}
                        onChange={(e) => {
                          const fId = e.target.value;
                          setQuickFoodId(fId);
                          setSelectedQuickRecId(null);
                          const f = customFoods.find((x) => x.id === fId);
                          if (f) {
                            setQuickItemName(f.name);
                            setQuickNutrients({
                              calories: f.calories,
                              protein: f.protein,
                              carbs: f.carbs,
                              fat: f.fat,
                              fiber: f.fiber,
                              quantity: f.serving_size,
                              unit: f.serving_unit,
                            });
                          } else {
                            setQuickNutrients({});
                          }
                        }}
                      >
                        <option value="">-- Manual Custom Name --</option>
                        {customFoods.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.serving_size} {f.serving_unit} • {f.calories} kcal)
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
                      placeholder="e.g. Grilled Chicken & Wild Rice"
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
                </div>
              </div>

              {/* Dedicated Sticky Footer with Clear Confirmation */}
              <div
                style={{
                  flexShrink: 0,
                  paddingTop: 12,
                  borderTop: "1px solid var(--border-subtle)",
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <button
                  type="button"
                  className="stitch-card-btn"
                  onClick={() => setShowQuickAdd(false)}
                  style={{ padding: "0 18px", height: 42, fontSize: 13, justifyContent: "center" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickAddLoading || !quickItemName.trim()}
                  className="add-button"
                  style={{ flex: 1, height: 42, justifyContent: "center", fontSize: 13, fontWeight: 700 }}
                >
                  {quickAddLoading ? (
                    "Adding..."
                  ) : quickItemName ? (
                    `✓ Confirm & Add "${quickItemName}"`
                  ) : (
                    "✓ Confirm & Add to Plan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
