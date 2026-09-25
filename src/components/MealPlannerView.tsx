"use client";

import { useEffect, useState, useMemo } from "react";
import { Food, MealPlanItem, MealSlot, ConsumptionLog } from "@/lib/supabase/types";
import {
  getMealPlanForDate,
  addMealPlanItem,
  updateMealPlanItem,
  deleteMealPlanItem,
  AddMealPlanItemInput,
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

  // Fetch plan and consumption logs whenever selectedDate changes
  const loadDayData = async (dateStr: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [planRes, logRes] = await Promise.all([
        getMealPlanForDate(dateStr),
        getConsumptionLogsForDate(dateStr),
      ]);

      if (planRes.success) {
        setItems(planRes.data?.items || []);
      } else {
        setErrorMsg(planRes.error || "Failed to load meal plan.");
      }

      if (logRes.success) {
        setConsumptionLogs(logRes.data || []);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error loading plan data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDayData(selectedDate);
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
    setAddLoading(true);

    try {
      const payload: AddMealPlanItemInput = {
        dateStr: selectedDate,
        slot: activeSlot,
        name: customItemName.trim(),
        foodId: selectedFoodId || null,
        quantity: itemQuantity,
        unit: itemUnit,
        calories: manualCalories,
        protein: manualProtein,
        carbs: manualCarbs,
        fat: manualFat,
        fiber: manualFiber,
      };

      const res = await addMealPlanItem(payload);
      if (!res.success || !res.data) {
        setAddError(res.error || "Failed to add meal plan item.");
      } else {
        setItems((prev) => [...prev, res.data!]);
        setShowAddModal(false);
        onDataChanged?.();
      }
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : "Error adding item.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const res = await deleteMealPlanItem(id);
      if (res.success) {
        setItems((prev) => prev.filter((it) => it.id !== id));
        onDataChanged?.();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleLog = async (item: MealPlanItem) => {
    const isLogged = consumptionLogs.some((l) => l.meal_plan_item_id === item.id);

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

  return (
    <div className="planner-container">
      {/* Topbar navigation */}
      <div className="planner-topbar">
        <div>
          <div className="section-kicker">MEAL PLANNER</div>
          <h2>Daily Nutrition Schedule</h2>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="date-stepper">
            <button
              className="date-step-btn"
              onClick={() => handleDateShift(-1)}
              aria-label="Previous day"
            >
              ‹
            </button>
            <input
              type="date"
              className="current-date-text"
              style={{ border: 0, outline: 0, background: "transparent", cursor: "pointer" }}
              value={selectedDate}
              onChange={handleDateChange}
            />
            <button
              className="date-step-btn"
              onClick={() => handleDateShift(1)}
              aria-label="Next day"
            >
              ›
            </button>
          </div>
          <button
            className="btn-sm btn-ghost"
            onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
          >
            Today
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="alert-box alert-error" style={{ marginBottom: 16 }}>
          {errorMsg}
        </div>
      )}

      {/* Daily Summary Comparison Cards */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card" style={{ minHeight: "auto", padding: 16 }}>
          <div className="card-head">
            <span>Planned Daily Total</span>
            <span className="macro-badge">{items.length} items</span>
          </div>
          <div className="calorie-row" style={{ margin: "8px 0" }}>
            <strong>{plannedTotals.calories.total.toLocaleString()}</strong>
            <span>kcal</span>
          </div>
          <div style={{ fontSize: 11, color: "#7a847c", display: "flex", gap: 10 }}>
            <span>P: <b>{formatNutrient(plannedTotals.protein.total)}</b></span>
            <span>C: <b>{formatNutrient(plannedTotals.carbs.total)}</b></span>
            <span>F: <b>{formatNutrient(plannedTotals.fat.total)}</b></span>
          </div>
          {!plannedTotals.calories.complete && (
            <div className="field-hint" style={{ color: "#b2762a", marginTop: 6 }}>
              ℹ️ {plannedTotals.calories.missingCount} planned item(s) have unprovided calories.
            </div>
          )}
        </div>

        <div className="stat-card" style={{ minHeight: "auto", padding: 16 }}>
          <div className="card-head">
            <span>Actually Consumed Total</span>
            <span className="macro-badge" style={{ background: "#edf4ed", color: "#4f7253" }}>
              {consumptionLogs.length} logged
            </span>
          </div>
          <div className="calorie-row" style={{ margin: "8px 0" }}>
            <strong style={{ color: "#54745c" }}>
              {consumedTotals.calories.total.toLocaleString()}
            </strong>
            <span>kcal</span>
          </div>
          <div style={{ fontSize: 11, color: "#7a847c", display: "flex", gap: 10 }}>
            <span>P: <b>{formatNutrient(consumedTotals.protein.total)}</b></span>
            <span>C: <b>{formatNutrient(consumedTotals.carbs.total)}</b></span>
            <span>F: <b>{formatNutrient(consumedTotals.fat.total)}</b></span>
          </div>
          {!consumedTotals.calories.complete && (
            <div className="field-hint" style={{ color: "#b2762a", marginTop: 6 }}>
              ℹ️ {consumedTotals.calories.missingCount} consumed item(s) have unprovided calories.
            </div>
          )}
        </div>
      </div>

      {/* Meal Slots List */}
      {MEAL_SLOTS.map((slot) => {
        const slotItems = items.filter((it) => it.slot === slot.id);
        const slotTotals = calculateNutrientTotals(slotItems);

        return (
          <div className="slot-group" key={slot.id}>
            <div className="slot-header">
              <div className="slot-title-wrap">
                <span style={{ fontSize: 18 }}>{slot.emoji}</span>
                <span className="slot-badge">{slot.title}</span>
                <span className="slot-summary">
                  <b>{slotTotals.calories.total}</b> kcal
                  {!slotTotals.calories.complete && (
                    <span style={{ color: "#b2762a", marginLeft: 4 }}>
                      (+{slotTotals.calories.missingCount} uncalculated)
                    </span>
                  )}
                </span>
              </div>

              <button
                className="btn-sm btn-ghost"
                onClick={() => openAddModal(slot.id)}
              >
                + Add item
              </button>
            </div>

            <div className="slot-items">
              {slotItems.length === 0 ? (
                <div style={{ padding: "14px 0", color: "#9ca59d", fontSize: 12 }}>
                  No meals planned for {slot.title.toLowerCase()}.
                </div>
              ) : (
                slotItems.map((item) => {
                  const isLogged = consumptionLogs.some(
                    (l) => l.meal_plan_item_id === item.id
                  );

                  return (
                    <div className="slot-item-row" key={item.id}>
                      <div className="slot-item-info">
                        <div className="slot-item-name">
                          {item.name}
                          {isLogged && (
                            <span className="logged-tag">✓ Consumed</span>
                          )}
                        </div>
                        <div className="slot-item-qty">
                          {item.quantity} {item.unit}
                        </div>
                      </div>

                      <div className="slot-item-macros">
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

                      <div className="slot-item-actions">
                        <button
                          className={`log-btn ${isLogged ? "logged" : ""}`}
                          onClick={() => handleToggleLog(item)}
                          title={isLogged ? "Unmark as consumed" : "Log as consumed into records"}
                        >
                          {isLogged ? "✓ Logged" : "Log as eaten"}
                        </button>
                        <button
                          className="btn-sm btn-danger-ghost"
                          style={{ padding: "0 6px", height: 26 }}
                          onClick={() => handleDeleteItem(item.id)}
                          title="Remove from plan"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}

      {/* ADD ITEM MODAL */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowAddModal(false)}
              aria-label="Close modal"
            >
              ×
            </button>
            <span className="section-kicker">ADD TO {activeSlot.toUpperCase()}</span>
            <h2>Plan a Meal Item</h2>

            {addError && (
              <div className="alert-box alert-error" style={{ marginBottom: 14 }}>
                {addError}
              </div>
            )}

            <form onSubmit={handleSaveItem} className="auth-form" style={{ gap: 14 }}>
              {customFoods.length > 0 && (
                <div className="form-group">
                  <label htmlFor="select-custom-food">Pick from your Food Library</label>
                  <select
                    id="select-custom-food"
                    className="form-select"
                    value={selectedFoodId}
                    onChange={(e) => handleFoodSelect(e.target.value)}
                  >
                    <option value="">-- Manual Entry / No Library Link --</option>
                    {customFoods.map((food) => (
                      <option key={food.id} value={food.id}>
                        {food.name} ({food.serving_size} {food.serving_unit})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="item-name">Meal / Item Name *</label>
                <input
                  id="item-name"
                  required
                  className="form-input"
                  placeholder="e.g. Scrambled Eggs & Toast"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="item-qty">Quantity *</label>
                  <input
                    id="item-qty"
                    type="number"
                    step="0.1"
                    min="0.01"
                    required
                    className="form-input"
                    value={itemQuantity}
                    onChange={(e) =>
                      setItemQuantity(parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="item-unit">Unit *</label>
                  <select
                    id="item-unit"
                    className="form-select"
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

              {/* Scaling feedback when food library item is selected */}
              {activeSelectedFood && (
                <div className="scaling-preview">
                  <div className="scaling-preview-title">
                    <span>Proportional Scaling</span>
                    {areUnitsCompatible(activeSelectedFood.serving_unit, itemUnit) ? (
                      <span style={{ color: "#597a61", fontSize: 11 }}>
                        ✓ Exact unit match ({activeSelectedFood.serving_unit})
                      </span>
                    ) : (
                      <span className="unit-warning">
                        ⚠️ Unit mismatch: cannot convert {itemUnit} to {activeSelectedFood.serving_unit}
                      </span>
                    )}
                  </div>

                  {scaledPreview && (
                    <div className="scaling-preview-macros">
                      <div>
                        <span className="food-macro-label">Kcal</span>
                        <div className="food-macro-val">
                          {formatNutrient(scaledPreview.calories.value, "")}
                        </div>
                      </div>
                      <div>
                        <span className="food-macro-label">Protein</span>
                        <div className="food-macro-val">
                          {formatNutrient(scaledPreview.protein.value, "g")}
                        </div>
                      </div>
                      <div>
                        <span className="food-macro-label">Carbs</span>
                        <div className="food-macro-val">
                          {formatNutrient(scaledPreview.carbs.value, "g")}
                        </div>
                      </div>
                      <div>
                        <span className="food-macro-label">Fat</span>
                        <div className="food-macro-val">
                          {formatNutrient(scaledPreview.fat.value, "g")}
                        </div>
                      </div>
                      <div>
                        <span className="food-macro-label">Fiber</span>
                        <div className="food-macro-val">
                          {formatNutrient(scaledPreview.fiber.value, "g")}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Manual nutrient inputs if not linked to food */}
              {!activeSelectedFood && (
                <div style={{ borderTop: "1px solid #f0f2ee", paddingTop: 10 }}>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>
                    ESTIMATED NUTRITION (OPTIONAL / LEAVE EMPTY IF UNKNOWN)
                  </div>
                  <div className="form-row-3">
                    <div className="form-group">
                      <label htmlFor="m-cal">Calories (kcal)</label>
                      <input
                        id="m-cal"
                        type="number"
                        step="0.1"
                        min="0"
                        className="form-input"
                        placeholder="—"
                        value={manualCalories ?? ""}
                        onChange={(e) =>
                          setManualCalories(
                            e.target.value === "" ? null : parseFloat(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="m-pro">Protein (g)</label>
                      <input
                        id="m-pro"
                        type="number"
                        step="0.1"
                        min="0"
                        className="form-input"
                        placeholder="—"
                        value={manualProtein ?? ""}
                        onChange={(e) =>
                          setManualProtein(
                            e.target.value === "" ? null : parseFloat(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="m-carb">Carbs (g)</label>
                      <input
                        id="m-carb"
                        type="number"
                        step="0.1"
                        min="0"
                        className="form-input"
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
                  <div className="form-row" style={{ marginTop: 8 }}>
                    <div className="form-group">
                      <label htmlFor="m-fat">Total Fat (g)</label>
                      <input
                        id="m-fat"
                        type="number"
                        step="0.1"
                        min="0"
                        className="form-input"
                        placeholder="—"
                        value={manualFat ?? ""}
                        onChange={(e) =>
                          setManualFat(
                            e.target.value === "" ? null : parseFloat(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="m-fib">Fiber (g)</label>
                      <input
                        id="m-fib"
                        type="number"
                        step="0.1"
                        min="0"
                        className="form-input"
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

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn-sm btn-ghost"
                  style={{ height: 38, padding: "0 16px" }}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="btn-sm btn-primary"
                  style={{ height: 38, padding: "0 18px" }}
                >
                  {addLoading ? "Adding..." : "Add to Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
