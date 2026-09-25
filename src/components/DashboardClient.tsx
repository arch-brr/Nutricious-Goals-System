"use client";

import { useMemo, useState, useEffect } from "react";
import { signOut } from "@/app/auth/actions";
import { Food, MealPlanItem, ConsumptionLog } from "@/lib/supabase/types";
import { CustomFoodsManager } from "./CustomFoodsManager";
import { MealPlannerView } from "./MealPlannerView";
import { InsightsView } from "./InsightsView";
import { SettingsView } from "./SettingsView";
import {
  calculateNutrientTotals,
  formatNutrient,
} from "@/lib/nutrition/calculator";
import {
  getMealPlanForDate,
  addMealPlanItem,
  deleteMealPlanItem,
} from "@/app/actions/meal-plans";
import {
  getConsumptionLogsForDate,
  logPlannedItemAsConsumed,
  unlogPlannedItem,
} from "@/app/actions/consumption";
import { getCustomFoods } from "@/app/actions/foods";

type Props = {
  user: {
    id: string;
    email?: string;
    displayName?: string;
    timezone?: string;
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
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function Macro({
  label,
  amount,
  goal,
  color,
}: {
  label: string;
  amount: number;
  goal: number;
  color: string;
}) {
  const percentage = goal > 0 ? Math.min(100, (amount / goal) * 100) : 0;
  return (
    <div className="macro-item">
      <div className="macro-line">
        <span>{label}</span>
        <span>
          <b>{amount}g</b>
          <i> / {goal}g</i>
        </span>
      </div>
      <div className="track">
        <span style={{ width: `${percentage}%`, background: color }} />
      </div>
    </div>
  );
}

export function DashboardClient({
  user,
  configured,
  initialFoods,
  initialPlanItems,
  initialConsumptionLogs,
}: Props) {
  const [activeNav, setActiveNav] = useState("Overview");
  const [customFoods, setCustomFoods] = useState<Food[]>(initialFoods);
  const [todayPlanItems, setTodayPlanItems] = useState<MealPlanItem[]>(initialPlanItems);
  const [todayLogs, setTodayLogs] = useState<ConsumptionLog[]>(initialConsumptionLogs);

  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Today's local/formatted date
  const todayDateStr = new Date().toISOString().split("T")[0];
  const today = new Date();
  const dateFormatted = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const shortDateFormatted = today.toLocaleDateString("en-US", {
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

  const shownItems = todayPlanItems.filter((m) =>
    `${m.name} ${m.slot}`.toLowerCase().includes(query.toLowerCase())
  );

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

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home" aria-label="Nutricious home">
          <span className="brand-mark">n</span>
          <span>
            nutricious<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="side-label">MENU</div>
        <nav aria-label="Main navigation">
          {[
            ["Overview", "grid"],
            ["Meal planner", "calendar"],
            ["Food library", "search"],
            ["Insights", "chart"],
          ].map(([label, icon]) => (
            <button
              key={label}
              className={`nav-item ${activeNav === label ? "active" : ""}`}
              onClick={() => {
                setActiveNav(label);
                setShowSearch(false);
              }}
            >
              <Icon name={icon} />
              <span>{label}</span>
              {label === "Meal planner" && todayPlanItems.length > 0 && (
                <span className="nav-count">{todayPlanItems.length}</span>
              )}
              {label === "Food library" && customFoods.length > 0 && (
                <span className="nav-count">{customFoods.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="side-spacer" />
        <div className="coach-card">
          <div className="coach-orbit">✳</div>
          <b>
            A little progress
            <br />
            goes a long way.
          </b>
          <span>Mindful nutrition starts one step at a time.</span>
          <button onClick={() => setActiveNav("Insights")}>
            Your insights <Icon name="arrow" size={15} />
          </button>
        </div>
        <button
          className={`nav-item settings-link ${activeNav === "Settings" ? "active" : ""}`}
          onClick={() => setActiveNav("Settings")}
        >
          <Icon name="settings" />
          <span>Settings</span>
        </button>

        <div className="profile">
          <div className="avatar">{initials}</div>
          <div className="profile-copy">
            <b>{displayName}</b>
            <span>{user?.email || "Personal account"}</span>
          </div>
          <button
            className="more"
            aria-label="Profile options"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            ···
          </button>
        </div>

        {showUserMenu && (
          <div className="user-menu">
            <form action={signOut}>
              <button type="submit" className="sign-out-btn">
                <Icon name="logout" size={14} />
                <span>Sign out</span>
              </button>
            </form>
          </div>
        )}
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>Workspace</span>
            <span className="crumb-slash">/</span>
            <b>{activeNav}</b>
          </div>
          <div className="top-actions">
            <span className="today-pill">
              <span className="live-dot" /> {dateFormatted}
            </span>
            <button
              className="icon-button"
              aria-label="Notifications"
              onClick={() => setActiveNav("Insights")}
            >
              <Icon name="bell" size={19} />
              {todayPlanItems.length > 0 && <i className="notice-dot" />}
            </button>
            <div className="mini-avatar">{initials}</div>
          </div>
        </header>

        <div className="content">
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

          {/* TAB 1: OVERVIEW */}
          {activeNav === "Overview" && (
            <>
              <section className="welcome-row">
                <div>
                  <div className="eyebrow">
                    <span className="sparkle">✳</span> YOUR DAILY SPACE
                  </div>
                  <h1>
                    Welcome back, {displayName}.<br className="mobile-break" />{" "}
                    <em>A fresh start for your nutrition today.</em>
                  </h1>
                  <p>Check in with your planned meals and log your consumption.</p>
                </div>
                <button
                  className="date-button"
                  onClick={() => setActiveNav("Meal planner")}
                >
                  <Icon name="calendar" size={17} /> Today, {shortDateFormatted}{" "}
                  <span className="chevron">⌄</span>
                </button>
              </section>

              <section className="stats-grid" aria-label="Today's nutrition overview">
                <article className="stat-card calories-card">
                  <div className="card-head">
                    <span>Calories</span>
                    <span className="stat-icon peach">✳</span>
                  </div>
                  <div className="calorie-row">
                    <strong>{consumedCalories.toLocaleString()}</strong>
                    <span>kcal</span>
                  </div>
                  <div className="progress-wrap">
                    <div
                      className="progress-ring"
                      style={{
                        background:
                          consumedCalories > 0
                            ? `conic-gradient(#dd795e ${Math.min(
                                100,
                                (consumedCalories / 2000) * 100
                              )}%, #f4ebe3 0)`
                            : "#f4ebe3",
                      }}
                    >
                      <div>
                        <b>
                          {Math.round((consumedCalories / 2000) * 100)}
                          <small>%</small>
                        </b>
                      </div>
                    </div>
                    <div className="calorie-note">
                      <b>of 2,000 kcal baseline</b>
                      <span>
                        {consumedCalories === 0
                          ? "No meals logged yet today"
                          : `${Math.max(0, 2000 - consumedCalories).toLocaleString()} kcal remaining`}
                      </span>
                      <div className="tiny-avatars">
                        <small>
                          {todayLogs.length === 0
                            ? "0 meals logged"
                            : `${todayLogs.length} meal${todayLogs.length > 1 ? "s" : ""} logged`}
                        </small>
                      </div>
                    </div>
                  </div>
                  <div className="card-foot">
                    {todayLogs.length === 0 ? (
                      <span>Log your first meal below to calculate intake</span>
                    ) : (
                      <span className="positive">
                        Calculated from {todayLogs.length} logged record(s)
                      </span>
                    )}
                  </div>
                </article>

                <article className="stat-card macros-card">
                  <div className="card-head">
                    <span>Macronutrients</span>
                    <span className="period-label">TODAY</span>
                  </div>
                  <div className="macro-total">
                    <b>
                      {protein + carbs + fat}
                      <small>g</small>
                    </b>
                    <span>total consumed</span>
                  </div>
                  <div className="macro-bars">
                    <Macro label="Protein" amount={protein} goal={120} color="#759878" />
                    <Macro label="Carbs" amount={carbs} goal={220} color="#dfa876" />
                    <Macro label="Healthy fats" amount={fat} goal={70} color="#ac8cb4" />
                  </div>
                  <div className="macro-legend">
                    <span>
                      <i className="legend-green" /> Protein
                    </span>
                    <span>
                      <i className="legend-orange" /> Carbs
                    </span>
                    <span>
                      <i className="legend-lilac" /> Fats
                    </span>
                  </div>
                </article>

                <article className="stat-card streak-card">
                  <div className="card-head">
                    <span>Your rhythm</span>
                    <span className="streak-icon">✷</span>
                  </div>
                  <div className="streak-number">
                    {todayLogs.length > 0 ? "1" : "0"}{" "}
                    <span>{todayLogs.length > 0 ? "day active" : "days logged"}</span>
                  </div>
                  <p>
                    {todayLogs.length > 0
                      ? "Great start! Continue logging to build your weekly habit."
                      : "Start logging your daily meals to build a consistent habit."}
                  </p>
                  <div className="week-dots">
                    {weekDays.map((day, i) => (
                      <div
                        className={`day-dot ${
                          i === currentDayIndex && todayLogs.length > 0
                            ? "done"
                            : i === currentDayIndex
                            ? "current"
                            : ""
                        }`}
                        key={i}
                      >
                        <span>{day}</span>
                        <b>{i === currentDayIndex && todayLogs.length > 0 ? "✓" : i + 1}</b>
                      </div>
                    ))}
                  </div>
                  <div className="streak-footer">
                    <span>✦</span>{" "}
                    {todayLogs.length > 0 ? "1 day active this week" : "0 active days this week"}
                  </div>
                </article>
              </section>

              <section className="lower-grid">
                <article className="panel meals-panel">
                  <div className="panel-header">
                    <div>
                      <div className="section-kicker">YOUR PLAN</div>
                      <h2>
                        Today&apos;s meals{" "}
                        <span className="meal-count">{todayPlanItems.length}</span>
                      </h2>
                    </div>
                    <div className="panel-actions">
                      <button
                        className="search-button"
                        aria-label="Search meals"
                        onClick={() => setShowSearch(!showSearch)}
                      >
                        <Icon name="search" size={17} />
                      </button>
                      <button
                        className="add-button"
                        onClick={() => setShowQuickAdd(true)}
                      >
                        <Icon name="plus" size={17} /> Add meal
                      </button>
                    </div>
                  </div>

                  {showSearch && (
                    <div className="search-row">
                      <Icon name="search" size={16} />
                      <input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search today's meals..."
                      />
                      <button
                        onClick={() => {
                          setQuery("");
                          setShowSearch(false);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}

                  <div className="meal-list">
                    {todayPlanItems.length === 0 ? (
                      <div className="empty-state-wrap">
                        <div className="empty-state-icon">🥗</div>
                        <h3 className="empty-state-title">No planned meals for today</h3>
                        <p className="empty-state-desc">
                          Add a meal to your daily plan or record what you eat to see accurate
                          calculated totals.
                        </p>
                        <button
                          className="add-button"
                          style={{ marginTop: 8 }}
                          onClick={() => setShowQuickAdd(true)}
                        >
                          <Icon name="plus" size={16} /> Add your first meal
                        </button>
                      </div>
                    ) : (
                      shownItems.map((item) => {
                        const isLogged = todayLogs.some(
                          (l) => l.meal_plan_item_id === item.id
                        );

                        return (
                          <div
                            className={`meal-row ${isLogged ? "is-eaten" : ""}`}
                            key={item.id}
                          >
                            <div className="meal-emoji">
                              {item.slot === "breakfast"
                                ? "🥞"
                                : item.slot === "lunch"
                                ? "🥗"
                                : item.slot === "dinner"
                                ? "🍲"
                                : "🍎"}
                            </div>
                            <div className="meal-details">
                              <div className="meal-title-line">
                                <b>{item.name}</b>
                                {isLogged && (
                                  <span className="logged-tag">
                                    <Icon name="check" size={12} /> Logged
                                  </span>
                                )}
                              </div>
                              <span>
                                {item.slot.toUpperCase()} <i>·</i> {item.quantity} {item.unit}
                              </span>
                            </div>
                            <div className="meal-nutrition">
                              <b>{formatNutrient(item.calories, "")}</b>
                              <span>kcal</span>
                            </div>
                            <button
                              className={`meal-check ${isLogged ? "checked" : ""}`}
                              onClick={() => handleToggleLog(item)}
                              aria-label={`${isLogged ? "Unmark" : "Log"} ${item.name}`}
                            >
                              <Icon name="check" size={16} />
                            </button>
                          </div>
                        );
                      })
                    )}
                    {todayPlanItems.length > 0 && shownItems.length === 0 && (
                      <div className="empty-search">No meals match “{query}”.</div>
                    )}
                  </div>
                  <button
                    className="view-plan"
                    onClick={() => setActiveNav("Meal planner")}
                  >
                    View full meal plan <Icon name="arrow" size={16} />
                  </button>
                </article>

                <div className="right-column">
                  <article className="tip-card">
                    <div className="tip-top">
                      <span className="tip-icon">✳</span>
                      <span className="tip-label">A SMALL REMINDER</span>
                      <span className="tip-number">01 / 04</span>
                    </div>
                    <h3>
                      Progress isn&apos;t
                      <br />
                      always a straight line.
                    </h3>
                    <p>
                      Every mindful choice counts, even the small ones. Be kind to yourself
                      today as you track your nutrition.
                    </p>
                    <button onClick={() => setActiveNav("Insights")}>
                      A note for today <Icon name="arrow" size={15} />
                    </button>
                    <span className="tip-flower">✳</span>
                  </article>

                  <article className="water-card">
                    <div className="water-symbol">◒</div>
                    <div className="water-info">
                      <div>
                        <b>Water check-in</b>
                        <span>Hydration supports your wellbeing</span>
                      </div>
                      <div className="water-glasses">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                          <i key={i} className={i <= waterGlasses ? "filled" : ""}>
                            {i <= waterGlasses ? "▰" : "▱"}
                          </i>
                        ))}
                        <small>{waterGlasses} / 8 glasses</small>
                      </div>
                    </div>
                    <button
                      className="water-add"
                      onClick={() =>
                        setWaterGlasses((prev) => (prev < 8 ? prev + 1 : 0))
                      }
                      aria-label="Log a glass of water"
                    >
                      +
                    </button>
                  </article>
                </div>
              </section>
            </>
          )}

          {/* TAB 2: MEAL PLANNER */}
          {activeNav === "Meal planner" && (
            <MealPlannerView
              customFoods={customFoods}
              initialDate={todayDateStr}
              onDataChanged={reloadData}
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

          <footer className="page-foot">
            <span>
              Made for your wellbeing <i>♡</i>
            </span>
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
