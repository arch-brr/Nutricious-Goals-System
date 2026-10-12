"use client";

import { useEffect, useState, useMemo } from "react";
import { Food, MealPlanItem, MealSlot, ConsumptionLog } from "@/lib/supabase/types";
import {
  getMealPlanForDate,
  addMealPlanItem,
  updateMealPlanItem,
  deleteMealPlanItem,
} from "@/app/actions/meal-plans";
import {
  getConsumptionLogsForDate,
  logPlannedItemAsConsumed,
  unlogPlannedItem,
} from "@/app/actions/consumption";
import {
  SUPPORTED_SERVING_UNITS,
  formatNutrient,
  scaleAllNutrients,
  calculateNutrientTotals,
  areUnitsCompatible,
} from "@/lib/nutrition/calculator";

const MEAL_SLOTS: { id: MealSlot; title: string; emoji: string }[] = [
  { id: "breakfast", title: "Breakfast", emoji: "🥞" },
  { id: "lunch", title: "Lunch", emoji: "🥗" },
  { id: "dinner", title: "Dinner", emoji: "🍲" },
  { id: "snack", title: "Snacks", emoji: "🍎" },
  { id: "other", title: "Other", emoji: "🥪" },
];

type Props = {
  customFoods: Food[];
  initialDate?: string;
  onDataChanged?: () => void;
};

export function MealPlannerView({ customFoods, initialDate, onDataChanged }: Props) {
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || new Date().toISOString().split("T")[0]
  );
  const [items, setItems] = useState<MealPlanItem[]>([]);
  const [consumptionLogs, setConsumptionLogs] = useState<ConsumptionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Add Item Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeSlot, setActiveSlot] = useState<MealSlot>("breakfast");
  const [selectedFoodId, setSelectedFoodId] = useState<string>("");
  const [customItemName, setCustomItemName] = useState<string>("");
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemUnit, setItemUnit] = useState<string>("serving");
  const [manualCalories, setManualCalories] = useState<number | null>(null);
  const [manualProtein, setManualProtein] = useState<number | null>(null);
  const [manualCarbs, setManualCarbs] = useState<number | null>(null);
  const [manualFat, setManualFat] = useState<number | null>(null);
  const [manualFiber, setManualFiber] = useState<number | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit Item Modal state
  const [editingItem, setEditingItem] = useState<MealPlanItem | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(1);
  const [editUnit, setEditUnit] = useState<string>("serving");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Fetch plan and consumption logs whenever selectedDate changes
  useEffect(() => {
    let active = true;

    const fetchDay = async () => {
      await Promise.resolve();
      if (!active) return;
      setLoading(true);
      try {
        const [planRes, logRes] = await Promise.all([
          getMealPlanForDate(selectedDate),
          getConsumptionLogsForDate(selectedDate),
        ]);

        if (!active) return;

        if (planRes.success) {
          setItems(planRes.data?.items || []);
        } else {
          setErrorMsg(planRes.error || "Failed to load meal plan.");
        }

        if (logRes.success) {
          setConsumptionLogs(logRes.data || []);
        }
      } catch (err: unknown) {
        if (active) {
          setErrorMsg(err instanceof Error ? err.message : "Error loading plan data.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchDay();

    return () => {
      active = false;
    };
  }, [selectedDate]);

  // Date Navigation Helpers
  const handleDateShift = (deltaDays: number) => {
    const current = new Date(`${selectedDate}T12:00:00Z`);
    current.setDate(current.getDate() + deltaDays);
    setSelectedDate(current.toISOString().split("T")[0]);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setSelectedDate(e.target.value);
    }
  };

  // Build 7-day strip centered around the selected date's week (Monday to Sunday)
  const weekDays = useMemo(() => {
    const curr = new Date(`${selectedDate}T12:00:00Z`);
    const day = curr.getDay(); // 0 is Sunday, 1 is Monday...
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(curr.setDate(diff));

    const days = [];
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      days.push({
        iso,
        dayName: dayNames[i],
        dayNum: d.getDate(),
        isToday: iso === new Date().toISOString().split("T")[0],
        isSelected: iso === selectedDate,
      });
    }
    return days;
  }, [selectedDate]);

  const formattedDateTitle = useMemo(() => {
    const d = new Date(`${selectedDate}T12:00:00Z`);
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedDate]);

  // Selected food for scaling preview in Add modal
  const activeSelectedFood = useMemo(() => {
    return customFoods.find((f) => f.id === selectedFoodId) || null;
  }, [customFoods, selectedFoodId]);

  const scaledPreview = useMemo(() => {
    if (!activeSelectedFood) return null;
    return scaleAllNutrients(activeSelectedFood, itemQuantity, itemUnit);
  }, [activeSelectedFood, itemQuantity, itemUnit]);

  // Open add modal for slot
  const openAddModal = (slot: MealSlot) => {
    setActiveSlot(slot);
    setSelectedFoodId("");
    setCustomItemName("");
    setItemQuantity(1);
    setItemUnit("serving");
    setManualCalories(null);
    setManualProtein(null);
    setManualCarbs(null);
    setManualFat(null);
    setManualFiber(null);
    setAddError(null);
    setShowAddModal(true);
  };

  const handleFoodSelect = (foodId: string) => {
    setSelectedFoodId(foodId);
    const food = customFoods.find((f) => f.id === foodId);
    if (food) {
      setCustomItemName(food.name);
      setItemQuantity(food.serving_size);
      setItemUnit(food.serving_unit);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!customItemName.trim()) {
      setAddError("Please provide a name for the planned item.");
      return;
    }

    setAddLoading(true);
    try {
      const payload = {
        dateStr: selectedDate,
        slot: activeSlot,
        name: customItemName.trim(),
        foodId: selectedFoodId || null,
        quantity: itemQuantity,
        unit: itemUnit,
        calories: activeSelectedFood
          ? scaledPreview?.calories.value
          : manualCalories,
        protein: activeSelectedFood
          ? scaledPreview?.protein.value
          : manualProtein,
        carbs: activeSelectedFood
          ? scaledPreview?.carbs.value
          : manualCarbs,
        fat: activeSelectedFood
          ? scaledPreview?.fat.value
          : manualFat,
        fiber: activeSelectedFood
          ? scaledPreview?.fiber.value
          : manualFiber,
      };

      const res = await addMealPlanItem(payload);
      if (res.success && res.data) {
        setItems((prev) => [...prev, res.data!]);
        setShowAddModal(false);
        onDataChanged?.();
      } else {
        setAddError(res.error || "Failed to add meal plan item.");
      }
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : "Error saving meal plan item.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const res = await deleteMealPlanItem(itemId);
      if (res.success) {
        setItems((prev) => prev.filter((it) => it.id !== itemId));
        setConsumptionLogs((prev) =>
          prev.filter((l) => l.meal_plan_item_id !== itemId)
        );
        onDataChanged?.();
      } else {
        alert(res.error || "Could not delete item.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (item: MealPlanItem) => {
    setEditingItem(item);
    setEditQuantity(item.quantity);
    setEditUnit(item.unit);
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setEditLoading(true);
    setEditError(null);

    try {
      // Calculate scaled nutrients if linked to food
      let updatedCalories = editingItem.calories;
      let updatedProtein = editingItem.protein;
      let updatedCarbs = editingItem.carbs;
      let updatedFat = editingItem.fat;
      let updatedFiber = editingItem.fiber;

      if (editingItem.food_id) {
        const linkedFood = customFoods.find((f) => f.id === editingItem.food_id);
        if (linkedFood) {
          const scaled = scaleAllNutrients(linkedFood, editQuantity, editUnit);
          updatedCalories = scaled.calories.value;
          updatedProtein = scaled.protein.value;
          updatedCarbs = scaled.carbs.value;
          updatedFat = scaled.fat.value;
          updatedFiber = scaled.fiber.value;
        }
      }

      const res = await updateMealPlanItem({
        id: editingItem.id,
        quantity: editQuantity,
        unit: editUnit,
        calories: updatedCalories,
        protein: updatedProtein,
        carbs: updatedCarbs,
        fat: updatedFat,
        fiber: updatedFiber,
      });

      if (res.success && res.data) {
        setItems((prev) =>
          prev.map((it) => (it.id === editingItem.id ? res.data! : it))
        );
        setEditingItem(null);
        onDataChanged?.();
      } else {
        setEditError(res.error || "Failed to update item.");
      }
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Error updating item.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggleLog = async (item: MealPlanItem) => {
    const isLogged = consumptionLogs.some(
      (l) => l.meal_plan_item_id === item.id
    );

    try {
      if (isLogged) {
        const res = await unlogPlannedItem(item.id, selectedDate);
        if (res.success) {
          setConsumptionLogs((prev) =>
            prev.filter((l) => l.meal_plan_item_id !== item.id)
          );
          onDataChanged?.();
        }
      } else {
        const res = await logPlannedItemAsConsumed(item.id, selectedDate);
        if (res.success && res.data) {
          setConsumptionLogs((prev) => [...prev, res.data!]);
          onDataChanged?.();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Planned & Consumed totals calculations
  const plannedTotals = useMemo(() => calculateNutrientTotals(items), [items]);
  const consumedTotals = useMemo(
    () => calculateNutrientTotals(consumptionLogs),
    [consumptionLogs]
  );

  // Macro distribution percentages for multi-bar
  const plannedMacroGrams =
    plannedTotals.protein.total + plannedTotals.carbs.total + plannedTotals.fat.total;

  const proteinPct =
    plannedMacroGrams > 0
      ? Math.round((plannedTotals.protein.total / plannedMacroGrams) * 100)
      : 30;
  const carbsPct =
    plannedMacroGrams > 0
      ? Math.round((plannedTotals.carbs.total / plannedMacroGrams) * 100)
      : 45;
  const fatPct =
    plannedMacroGrams > 0
      ? Math.max(0, 100 - proteinPct - carbsPct)
      : 25;

  return (
    <div className="stitch-planner-shell">
      {/* 1. Ambient Hero Header with 7-Day Navigation Strip */}
      <section className="stitch-planner-hero">
        <div className="stitch-planner-glow-1" />
        <div className="stitch-planner-glow-2" />

        <div className="stitch-planner-hero-inner">
          <div className="stitch-planner-top-meta">
            <span className="stitch-planner-cycle-pill">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
              Weekly Cycle • Balanced Nutrition
            </span>
            <span className="text-[11px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider">
              Meal Schedule &amp; Log Orchestration
            </span>
          </div>

          <div className="stitch-planner-hero-row">
            <div>
              <h2 className="stitch-planner-title">Daily Meal Planning</h2>
              <div className="stitch-planner-subtitle">{formattedDateTitle}</div>
            </div>

            <div className="stitch-planner-controls">
              <div className="stitch-planner-stepper">
                <button
                  type="button"
                  className="stitch-planner-step-btn"
                  onClick={() => handleDateShift(-1)}
                  aria-label="Previous day"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <input
                  type="date"
                  className="stitch-planner-date-input"
                  value={selectedDate}
                  onChange={handleDateChange}
                  aria-label="Select date"
                />
                <button
                  type="button"
                  className="stitch-planner-step-btn"
                  onClick={() => handleDateShift(1)}
                  aria-label="Next day"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>

              <button
                type="button"
                className="stitch-planner-today-btn"
                onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
              >
                Today
              </button>
            </div>
          </div>

          {/* 7-Day Strip Carousel */}
          <div className="stitch-planner-day-strip" role="tablist" aria-label="7-day week schedule">
            {weekDays.map((day) => (
              <button
                key={day.iso}
                type="button"
                role="tab"
                aria-selected={day.isSelected}
                className={`stitch-planner-day-card ${day.isSelected ? "active" : ""}`}
                onClick={() => setSelectedDate(day.iso)}
              >
                <span className="stitch-planner-day-name">{day.dayName}</span>
                <span className="stitch-planner-day-num">{day.dayNum}</span>
                <span className="stitch-planner-day-dot" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {errorMsg && (
        <div className="stitch-alert stitch-alert-error" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>{errorMsg}</div>
        </div>
      )}

      {/* 2. Macro Distribution Target vs. Planned Banner */}
      <section className="stitch-planner-macro-banner">
        <div className="stitch-planner-macro-header">
          <div>
            <h3 className="stitch-planner-macro-title">Macro Distribution • Target vs. Planned</h3>
            <div className="stitch-planner-macro-subtitle">
              Planned Total: {plannedTotals.calories.total.toLocaleString()} kcal • Consumed: {consumedTotals.calories.total.toLocaleString()} kcal
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--primary)] bg-[var(--surface-container-low)] px-3 py-1 rounded-full">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {items.length} Planned Meals
          </span>
        </div>

        {/* Multi-tier Visual Bar */}
        <div className="stitch-planner-multi-bar" role="progressbar" aria-valuenow={plannedTotals.calories.total} aria-valuemin={0} aria-valuemax={2000}>
          <div
            className="stitch-planner-multi-segment bg-[var(--primary)] rounded-l-full"
            style={{ width: `${proteinPct}%` }}
            title={`Protein: ${proteinPct}%`}
          />
          <div
            className="stitch-planner-multi-segment bg-[var(--tertiary-container)]"
            style={{ width: `${carbsPct}%` }}
            title={`Carbohydrates: ${carbsPct}%`}
          />
          <div
            className="stitch-planner-multi-segment bg-[var(--secondary)] rounded-r-full"
            style={{ width: `${fatPct}%` }}
            title={`Healthy Fats: ${fatPct}%`}
          />
        </div>

        {/* Metric Legend Grid */}
        <div className="stitch-planner-legend-grid">
          <div className="stitch-planner-legend-item">
            <div className="stitch-planner-legend-dot bg-[var(--primary)]" />
            <div>
              <div className="stitch-planner-legend-label">Protein</div>
              <div className="stitch-planner-legend-val">
                {formatNutrient(plannedTotals.protein.total)}
                <span className="stitch-planner-legend-pct">({proteinPct}%)</span>
              </div>
            </div>
          </div>

          <div className="stitch-planner-legend-item">
            <div className="stitch-planner-legend-dot bg-[var(--tertiary-container)]" />
            <div>
              <div className="stitch-planner-legend-label">Carbs</div>
              <div className="stitch-planner-legend-val">
                {formatNutrient(plannedTotals.carbs.total)}
                <span className="stitch-planner-legend-pct">({carbsPct}%)</span>
              </div>
            </div>
          </div>

          <div className="stitch-planner-legend-item">
            <div className="stitch-planner-legend-dot bg-[var(--secondary)]" />
            <div>
              <div className="stitch-planner-legend-label">Fats</div>
              <div className="stitch-planner-legend-val">
                {formatNutrient(plannedTotals.fat.total)}
                <span className="stitch-planner-legend-pct">({fatPct}%)</span>
              </div>
            </div>
          </div>

          <div className="stitch-planner-legend-item">
            <div className="stitch-planner-legend-dot bg-[var(--secondary-container)]" />
            <div>
              <div className="stitch-planner-legend-label">Fiber</div>
              <div className="stitch-planner-legend-val">
                {formatNutrient(plannedTotals.fiber.total)}
              </div>
            </div>
          </div>
        </div>

        {!plannedTotals.calories.complete && (
          <div className="text-[11px] text-[#b2762a] mt-3 flex items-center gap-1">
            <span>ℹ️</span>
            <span>{plannedTotals.calories.missingCount} planned item(s) have unprovided calories.</span>
          </div>
        )}
      </section>

      {/* 3. Daily Summary Comparison 2-Column Grid */}
      <section className="stitch-planner-stats-grid">
        <div className="stitch-planner-stat-card">
          <div className="stitch-planner-stat-head">
            <span className="stitch-planner-stat-title">Planned Daily Total</span>
            <span className="stitch-planner-stat-badge">{items.length} items</span>
          </div>
          <div>
            <span className="stitch-planner-calorie-val">
              {plannedTotals.calories.total.toLocaleString()}
            </span>
            <span className="stitch-planner-calorie-unit">kcal</span>
          </div>
          <div className="stitch-planner-macro-pills-row">
            <span>P: <b>{formatNutrient(plannedTotals.protein.total)}</b></span>
            <span>•</span>
            <span>C: <b>{formatNutrient(plannedTotals.carbs.total)}</b></span>
            <span>•</span>
            <span>F: <b>{formatNutrient(plannedTotals.fat.total)}</b></span>
          </div>
        </div>

        <div className="stitch-planner-stat-card">
          <div className="stitch-planner-stat-head">
            <span className="stitch-planner-stat-title">Actually Consumed Total</span>
            <span className="stitch-planner-stat-badge consumed">
              {consumptionLogs.length} logged
            </span>
          </div>
          <div>
            <span className="stitch-planner-calorie-val text-[var(--primary)]">
              {consumedTotals.calories.total.toLocaleString()}
            </span>
            <span className="stitch-planner-calorie-unit">kcal</span>
          </div>
          <div className="stitch-planner-macro-pills-row">
            <span>P: <b>{formatNutrient(consumedTotals.protein.total)}</b></span>
            <span>•</span>
            <span>C: <b>{formatNutrient(consumedTotals.carbs.total)}</b></span>
            <span>•</span>
            <span>F: <b>{formatNutrient(consumedTotals.fat.total)}</b></span>
          </div>
        </div>
      </section>

      {/* 4. Meal Slot Category Cards */}
      <section className="flex flex-col gap-4" aria-label="Meal categories">
        {loading && items.length === 0 ? (
          <div className="stitch-planner-empty-slot">Loading daily meal schedule...</div>
        ) : (
          MEAL_SLOTS.map((slot) => {
            const slotItems = items.filter((it) => it.slot === slot.id);
            const slotTotals = calculateNutrientTotals(slotItems);

            return (
              <div className="stitch-planner-slot-group" key={slot.id}>
                <div className="stitch-planner-slot-header">
                  <div className="stitch-planner-slot-meta">
                    <span className="stitch-planner-slot-emoji">{slot.emoji}</span>
                    <div>
                      <span className="stitch-planner-slot-name">{slot.title}</span>
                    </div>
                    <span className="stitch-planner-slot-cals">
                      <b>{slotTotals.calories.total}</b> kcal
                    </span>
                  </div>

                  <button
                    type="button"
                    className="stitch-planner-add-btn"
                    onClick={() => openAddModal(slot.id)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="stitch-planner-items-list">
                  {slotItems.length === 0 ? (
                    <div className="stitch-planner-empty-slot">
                      No meals planned for {slot.title.toLowerCase()} yet.
                    </div>
                  ) : (
                    slotItems.map((item) => {
                      const isLogged = consumptionLogs.some(
                        (l) => l.meal_plan_item_id === item.id
                      );

                      return (
                        <div
                          className={`stitch-planner-item-row ${isLogged ? "logged" : ""}`}
                          key={item.id}
                        >
                          <div className="stitch-planner-item-main">
                            <div className="stitch-planner-item-title-row">
                              <span className="stitch-planner-item-name">{item.name}</span>
                              {isLogged && (
                                <span className="stitch-planner-logged-tag">
                                  ✓ Consumed
                                </span>
                              )}
                            </div>
                            <div className="stitch-planner-item-qty">
                              {item.quantity} {item.unit}
                            </div>
                          </div>

                          <div className="stitch-planner-item-macros">
                            <span>
                              <b>{formatNutrient(item.calories, "")}</b> kcal
                            </span>
                            <span>
                              P: <b>{formatNutrient(item.protein, "g")}</b>
                            </span>
                            <span>
                              C: <b>{formatNutrient(item.carbs, "g")}</b>
                            </span>
                            <span>
                              F: <b>{formatNutrient(item.fat, "g")}</b>
                            </span>
                          </div>

                          <div className="stitch-planner-item-actions">
                            <button
                              type="button"
                              className={`stitch-planner-log-toggle-btn ${isLogged ? "active" : ""}`}
                              onClick={() => handleToggleLog(item)}
                              title={isLogged ? "Unmark as consumed" : "Log as consumed into daily records"}
                            >
                              {isLogged ? "✓ Logged" : "Log as eaten"}
                            </button>

                            <button
                              type="button"
                              className="stitch-planner-icon-action-btn"
                              onClick={() => openEditModal(item)}
                              title="Edit quantity"
                              aria-label="Edit item quantity"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                              </svg>
                            </button>

                            <button
                              type="button"
                              className="stitch-planner-icon-action-btn delete"
                              onClick={() => handleDeleteItem(item.id)}
                              title="Remove from plan"
                              aria-label="Remove item"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6 6 18M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* 5. ADD ITEM MODAL */}
      {showAddModal && (
        <div className="stitch-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="stitch-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="stitch-modal-close-btn"
              onClick={() => setShowAddModal(false)}
              aria-label="Close modal"
            >
              ×
            </button>

            <span className="stitch-modal-kicker">ADD TO {activeSlot.toUpperCase()}</span>
            <h3 className="stitch-modal-title">Plan a Meal Item</h3>

            {addError && (
              <div className="stitch-alert stitch-alert-error" role="alert" style={{ marginBottom: 14 }}>
                <div>{addError}</div>
              </div>
            )}

            <form onSubmit={handleSaveItem} className="stitch-form">
              {customFoods.length > 0 && (
                <div className="stitch-field-group">
                  <label className="stitch-field-label" htmlFor="select-custom-food">
                    Pick from your Food Library
                  </label>
                  <select
                    id="select-custom-food"
                    className="stitch-auth-input"
                    value={selectedFoodId}
                    onChange={(e) => handleFoodSelect(e.target.value)}
                  >
                    <option value="">-- Manual Custom Name --</option>
                    {customFoods.map((food) => (
                      <option key={food.id} value={food.id}>
                        {food.name} ({food.serving_size} {food.serving_unit})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="stitch-field-group">
                <label className="stitch-field-label" htmlFor="item-name">
                  Meal / Item Name *
                </label>
                <input
                  id="item-name"
                  required
                  className="stitch-auth-input"
                  placeholder="e.g. Scrambled Eggs & Toast"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="stitch-field-group">
                  <label className="stitch-field-label" htmlFor="item-qty">
                    Quantity *
                  </label>
                  <input
                    id="item-qty"
                    type="number"
                    step="0.1"
                    min="0.01"
                    required
                    className="stitch-auth-input"
                    value={itemQuantity}
                    onChange={(e) =>
                      setItemQuantity(parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="stitch-field-group">
                  <label className="stitch-field-label" htmlFor="item-unit">
                    Unit *
                  </label>
                  <select
                    id="item-unit"
                    className="stitch-auth-input"
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                  >
                    {SUPPORTED_SERVING_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Scaling preview when food library item is selected */}
              {activeSelectedFood && (
                <div className="p-3.5 rounded-xl bg-[var(--surface-container-low)] border border-[var(--border-subtle)] my-2">
                  <div className="flex items-center justify-between text-[11px] font-bold mb-2">
                    <span className="text-[var(--on-surface-variant)] uppercase tracking-wider">
                      Proportional Scaling
                    </span>
                    {areUnitsCompatible(activeSelectedFood.serving_unit, itemUnit) ? (
                      <span className="text-[var(--primary)]">
                        ✓ Exact match ({activeSelectedFood.serving_unit})
                      </span>
                    ) : (
                      <span className="text-[var(--error)]">
                        ⚠️ Unit mismatch
                      </span>
                    )}
                  </div>

                  {scaledPreview && (
                    <div className="grid grid-cols-5 gap-2 text-center text-[11px]">
                      <div>
                        <div className="text-[var(--on-surface-variant)]">Kcal</div>
                        <div className="font-bold text-[var(--on-surface)]">
                          {formatNutrient(scaledPreview.calories.value, "")}
                        </div>
                      </div>
                      <div>
                        <div className="text-[var(--on-surface-variant)]">Protein</div>
                        <div className="font-bold text-[var(--on-surface)]">
                          {formatNutrient(scaledPreview.protein.value, "g")}
                        </div>
                      </div>
                      <div>
                        <div className="text-[var(--on-surface-variant)]">Carbs</div>
                        <div className="font-bold text-[var(--on-surface)]">
                          {formatNutrient(scaledPreview.carbs.value, "g")}
                        </div>
                      </div>
                      <div>
                        <div className="text-[var(--on-surface-variant)]">Fat</div>
                        <div className="font-bold text-[var(--on-surface)]">
                          {formatNutrient(scaledPreview.fat.value, "g")}
                        </div>
                      </div>
                      <div>
                        <div className="text-[var(--on-surface-variant)]">Fiber</div>
                        <div className="font-bold text-[var(--on-surface)]">
                          {formatNutrient(scaledPreview.fiber.value, "g")}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Manual nutrient inputs if not linked to library food */}
              {!activeSelectedFood && (
                <div className="pt-2 border-t border-[var(--border-subtle)]">
                  <div className="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-wider mb-2">
                    Estimated Nutrition (Optional)
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="stitch-field-group">
                      <label className="stitch-field-label" htmlFor="m-cal">
                        Calories (kcal)
                      </label>
                      <input
                        id="m-cal"
                        type="number"
                        step="0.1"
                        min="0"
                        className="stitch-auth-input"
                        placeholder="—"
                        value={manualCalories ?? ""}
                        onChange={(e) =>
                          setManualCalories(
                            e.target.value === "" ? null : parseFloat(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="stitch-field-group">
                      <label className="stitch-field-label" htmlFor="m-pro">
                        Protein (g)
                      </label>
                      <input
                        id="m-pro"
                        type="number"
                        step="0.1"
                        min="0"
                        className="stitch-auth-input"
                        placeholder="—"
                        value={manualProtein ?? ""}
                        onChange={(e) =>
                          setManualProtein(
                            e.target.value === "" ? null : parseFloat(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="stitch-field-group">
                      <label className="stitch-field-label" htmlFor="m-carb">
                        Carbs (g)
                      </label>
                      <input
                        id="m-carb"
                        type="number"
                        step="0.1"
                        min="0"
                        className="stitch-auth-input"
                        placeholder="—"
                        value={manualCarbs ?? ""}
                        onChange={(e) =>
                          setManualCarbs(
                            e.target.value === "" ? null : parseFloat(e.target.value)
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="stitch-field-group">
                      <label className="stitch-field-label" htmlFor="m-fat">
                        Total Fat (g)
                      </label>
                      <input
                        id="m-fat"
                        type="number"
                        step="0.1"
                        min="0"
                        className="stitch-auth-input"
                        placeholder="—"
                        value={manualFat ?? ""}
                        onChange={(e) =>
                          setManualFat(
                            e.target.value === "" ? null : parseFloat(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="stitch-field-group">
                      <label className="stitch-field-label" htmlFor="m-fib">
                        Fiber (g)
                      </label>
                      <input
                        id="m-fib"
                        type="number"
                        step="0.1"
                        min="0"
                        className="stitch-auth-input"
                        placeholder="—"
                        value={manualFiber ?? ""}
                        onChange={(e) =>
                          setManualFiber(
                            e.target.value === "" ? null : parseFloat(e.target.value)
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  className="stitch-planner-today-btn"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="stitch-auth-submit-btn"
                  style={{ width: "auto", padding: "0 24px" }}
                >
                  {addLoading ? "Adding..." : "Add to Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. EDIT ITEM MODAL */}
      {editingItem && (
        <div className="stitch-modal-backdrop" onClick={() => setEditingItem(null)}>
          <div className="stitch-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="stitch-modal-close-btn"
              onClick={() => setEditingItem(null)}
              aria-label="Close modal"
            >
              ×
            </button>

            <span className="stitch-modal-kicker">EDIT MEAL ITEM</span>
            <h3 className="stitch-modal-title">{editingItem.name}</h3>

            {editError && (
              <div className="stitch-alert stitch-alert-error" role="alert" style={{ marginBottom: 14 }}>
                <div>{editError}</div>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="stitch-form">
              <div className="grid grid-cols-2 gap-3">
                <div className="stitch-field-group">
                  <label className="stitch-field-label" htmlFor="edit-qty">
                    Quantity *
                  </label>
                  <input
                    id="edit-qty"
                    type="number"
                    step="0.1"
                    min="0.01"
                    required
                    className="stitch-auth-input"
                    value={editQuantity}
                    onChange={(e) =>
                      setEditQuantity(parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="stitch-field-group">
                  <label className="stitch-field-label" htmlFor="edit-unit">
                    Unit *
                  </label>
                  <select
                    id="edit-unit"
                    className="stitch-auth-input"
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                  >
                    {SUPPORTED_SERVING_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  className="stitch-planner-today-btn"
                  onClick={() => setEditingItem(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="stitch-auth-submit-btn"
                  style={{ width: "auto", padding: "0 24px" }}
                >
                  {editLoading ? "Updating..." : "Update Quantity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
