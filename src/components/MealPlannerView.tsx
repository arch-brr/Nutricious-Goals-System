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
import {
  getRecommendedFoods,
  RecommendedFood,
  DIETARY_PREFERENCES,
  PINOY_BREAKFAST_COMBO_OPTIONS,
  PINOY_EVERYDAY_7DAY_CYCLE,
  scaleFoodToTargetCalories,
  aggregateIngredientsFromMealNames,
  IngredientItem,
} from "@/lib/nutrition/recommendations";

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
  dietaryPreference?: string;
  country?: string;
  onLogWater?: (glasses: number) => void;
};

export function MealPlannerView({
  customFoods,
  initialDate,
  onDataChanged,
  dietaryPreference = "mediterranean",
  country,
  onLogWater,
}: Props) {
  // Navigation / View state
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || new Date().toISOString().split("T")[0]
  );
  const [activeSubView, setActiveSubView] = useState<"day" | "cycle" | "history" | "groceries">("day");

  // Items for the selected day
  const [items, setItems] = useState<MealPlanItem[]>([]);
  const [consumptionLogs, setConsumptionLogs] = useState<ConsumptionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Week-wide meal plan items & logs for 7-day cycle tracking & grocery aggregation
  const [weekItemsMap, setWeekItemsMap] = useState<Record<string, MealPlanItem[]>>({});
  const [weekLogsMap, setWeekLogsMap] = useState<Record<string, ConsumptionLog[]>>({});
  const [loadingWeek, setLoadingWeek] = useState(false);

  // Add Item Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalTab, setAddModalTab] = useState<"recommendations" | "library" | "custom">("recommendations");
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
  const [appliedRecId, setAppliedRecId] = useState<string | null>(null);

  // Calorie Calibrator / Target Scaler state
  const [targetCaloriesInput, setTargetCaloriesInput] = useState<string>("");

  // Edit Item Modal state
  const [editingItem, setEditingItem] = useState<MealPlanItem | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(1);
  const [editUnit, setEditUnit] = useState<string>("serving");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Quick Pinoy Combo Builder Modal state
  const [showPinoyComboModal, setShowPinoyComboModal] = useState(false);
  const [comboEggId, setComboEggId] = useState(PINOY_BREAKFAST_COMBO_OPTIONS.eggs[0].id);
  const [comboCarbId, setComboCarbId] = useState(PINOY_BREAKFAST_COMBO_OPTIONS.carbs[0].id);
  const [comboFruitId, setComboFruitId] = useState(PINOY_BREAKFAST_COMBO_OPTIONS.fruits[0].id);
  const [comboWaterId, setComboWaterId] = useState(PINOY_BREAKFAST_COMBO_OPTIONS.water[0].id);
  const [comboAddSeparately, setComboAddSeparately] = useState(true);
  const [comboAdding, setComboAdding] = useState(false);

  // Shopping / Grocery List state
  const [customGroceries, setCustomGroceries] = useState<IngredientItem[]>([]);
  const [grocerySearchQuery, setGrocerySearchQuery] = useState("");
  const [newGroceryCat, setNewGroceryCat] = useState<IngredientItem["category"]>("Produce & Greens");
  const [newGroceryQty, setNewGroceryQty] = useState("1 portion");
  const [checkedIngredientIds, setCheckedIngredientIds] = useState<Set<string>>(new Set());
  const [copiedNotification, setCopiedNotification] = useState(false);

  // 7-Day Cycle Loading status
  const [cycleLoading, setCycleLoading] = useState(false);
  const [cycleSuccess, setCycleSuccess] = useState<string | null>(null);

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

  // Fetch plan and consumption logs for selectedDate
  useEffect(() => {
    let active = true;

    const fetchDay = async () => {
      await Promise.resolve();
      if (!active) return;
      setLoading(true);
      setErrorMsg(null);
      try {
        const [planRes, logRes] = await Promise.all([
          getMealPlanForDate(selectedDate),
          getConsumptionLogsForDate(selectedDate),
        ]);

        if (!active) return;

        if (planRes.success) {
          const dayItems = planRes.data?.items || [];
          setItems(dayItems);
          setWeekItemsMap((prev) => ({ ...prev, [selectedDate]: dayItems }));
          setErrorMsg(null);
        } else if (planRes.error === "Unauthorized") {
          setItems([]);
        } else {
          setErrorMsg(planRes.error || "Failed to load meal plan.");
        }

        if (logRes.success) {
          const dayLogs = logRes.data || [];
          setConsumptionLogs(dayLogs);
          setWeekLogsMap((prev) => ({ ...prev, [selectedDate]: dayLogs }));
        } else if (logRes.error === "Unauthorized") {
          setConsumptionLogs([]);
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

  // Fetch week-wide items for 7-day cycle & grocery aggregation
  useEffect(() => {
    let active = true;

    const fetchWeek = async () => {
      setLoadingWeek(true);
      try {
        const promises = weekDays.map((wd) =>
          Promise.all([getMealPlanForDate(wd.iso), getConsumptionLogsForDate(wd.iso)])
        );
        const results = await Promise.all(promises);
        if (!active) return;

        const newItemsMap: Record<string, MealPlanItem[]> = {};
        const newLogsMap: Record<string, ConsumptionLog[]> = {};

        results.forEach(([planRes, logRes], idx) => {
          const iso = weekDays[idx].iso;
          if (planRes.success && planRes.data) {
            newItemsMap[iso] = planRes.data.items || [];
          } else {
            newItemsMap[iso] = [];
          }
          if (logRes.success && logRes.data) {
            newLogsMap[iso] = logRes.data;
          } else {
            newLogsMap[iso] = [];
          }
        });

        setWeekItemsMap(newItemsMap);
        setWeekLogsMap(newLogsMap);
      } catch (err) {
        console.error("Failed to load week data", err);
      } finally {
        if (active) setLoadingWeek(false);
      }
    };

    fetchWeek();

    return () => {
      active = false;
    };
  }, [weekDays]);

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
    setAddModalTab("recommendations");
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
    setAppliedRecId(null);
    setTargetCaloriesInput("");
    setShowAddModal(true);
  };

  const dietLabel = useMemo(() => {
    const pref = DIETARY_PREFERENCES.find(
      (p) => p.id === (dietaryPreference || "mediterranean")
    );
    return pref?.label || "Mediterranean";
  }, [dietaryPreference]);

  const slotRecommendations = useMemo(() => {
    return getRecommendedFoods(country || dietaryPreference, dietaryPreference, activeSlot);
  }, [country, dietaryPreference, activeSlot]);

  // Calorie Scaler application
  const handleApplyCalorieTarget = (targetKcal: number) => {
    if (targetKcal <= 0) return;
    setTargetCaloriesInput(String(targetKcal));

    if (activeSelectedFood) {
      const scaled = scaleFoodToTargetCalories(
        {
          calories: activeSelectedFood.calories ?? 0,
          servingSize: activeSelectedFood.serving_size,
          servingUnit: activeSelectedFood.serving_unit,
          protein: activeSelectedFood.protein,
          carbs: activeSelectedFood.carbs,
          fat: activeSelectedFood.fat,
          fiber: activeSelectedFood.fiber,
        },
        targetKcal
      );
      setItemQuantity(scaled.servingSize);
      setItemUnit(scaled.servingUnit);
      setManualCalories(scaled.calories);
      setManualProtein(scaled.protein ?? null);
      setManualCarbs(scaled.carbs ?? null);
      setManualFat(scaled.fat ?? null);
      setManualFiber(scaled.fiber ?? null);
    } else if (manualCalories && manualCalories > 0) {
      const multiplier = targetKcal / manualCalories;
      setItemQuantity(Math.round(itemQuantity * multiplier * 100) / 100);
      setManualCalories(Math.round(targetKcal));
      if (manualProtein) setManualProtein(Math.round(manualProtein * multiplier * 10) / 10);
      if (manualCarbs) setManualCarbs(Math.round(manualCarbs * multiplier * 10) / 10);
      if (manualFat) setManualFat(Math.round(manualFat * multiplier * 10) / 10);
      if (manualFiber) setManualFiber(Math.round(manualFiber * multiplier * 10) / 10);
    }
  };

  const applyRecommendation = (rec: RecommendedFood) => {
    setAppliedRecId(rec.id);
    setSelectedFoodId("");
    setCustomItemName(rec.name);
    setItemQuantity(rec.servingSize);
    setItemUnit(rec.servingUnit);
    setManualCalories(rec.calories);
    setManualProtein(rec.protein);
    setManualCarbs(rec.carbs);
    setManualFat(rec.fat);
    setManualFiber(rec.fiber);
    if (targetCaloriesInput && parseFloat(targetCaloriesInput) > 0) {
      handleApplyCalorieTarget(parseFloat(targetCaloriesInput));
    }
  };

  const handleQuickAddRecommendation = async (rec: RecommendedFood) => {
    setAddError(null);
    setAddLoading(true);
    try {
      const payload = {
        dateStr: selectedDate,
        slot: activeSlot,
        name: rec.name,
        foodId: null,
        quantity: rec.servingSize,
        unit: rec.servingUnit,
        calories: rec.calories,
        protein: rec.protein,
        carbs: rec.carbs,
        fat: rec.fat,
        fiber: rec.fiber,
      };

      const res = await addMealPlanItem(payload);
      if (res.success && res.data) {
        setItems((prev) => [...prev, res.data!]);
        setWeekItemsMap((prev) => ({
          ...prev,
          [selectedDate]: [...(prev[selectedDate] || []), res.data!],
        }));
        setShowAddModal(false);
        onDataChanged?.();
      } else {
        setAddError(res.error || "Failed to add recommended food.");
      }
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : "Error saving meal plan item.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleQuickAddLibraryFood = async (food: Food) => {
    setAddError(null);
    setAddLoading(true);
    try {
      const payload = {
        dateStr: selectedDate,
        slot: activeSlot,
        name: food.name,
        foodId: food.id,
        quantity: food.serving_size,
        unit: food.serving_unit,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        fiber: food.fiber,
      };

      const res = await addMealPlanItem(payload);
      if (res.success && res.data) {
        setItems((prev) => [...prev, res.data!]);
        setWeekItemsMap((prev) => ({
          ...prev,
          [selectedDate]: [...(prev[selectedDate] || []), res.data!],
        }));
        setShowAddModal(false);
        onDataChanged?.();
      } else {
        setAddError(res.error || "Failed to add food.");
      }
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : "Error saving meal plan item.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleFoodSelect = (foodId: string) => {
    setSelectedFoodId(foodId);
    const food = customFoods.find((f) => f.id === foodId);
    if (food) {
      setCustomItemName(food.name);
      setItemQuantity(food.serving_size);
      setItemUnit(food.serving_unit);
      setManualCalories(food.calories);
      setManualProtein(food.protein);
      setManualCarbs(food.carbs);
      setManualFat(food.fat);
      setManualFiber(food.fiber);
      if (targetCaloriesInput && parseFloat(targetCaloriesInput) > 0) {
        handleApplyCalorieTarget(parseFloat(targetCaloriesInput));
      }
    }
  };

  const handleSaveItem = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    setAddError(null);
    if (!customItemName.trim()) {
      setAddError("Please provide a name for the planned item.");
      return;
    }

    setAddLoading(true);
    try {
      const caloriesVal = (activeSelectedFood && scaledPreview && scaledPreview.calories.value !== null) ? scaledPreview.calories.value : manualCalories;
      const proteinVal = (activeSelectedFood && scaledPreview && scaledPreview.protein.value !== null) ? scaledPreview.protein.value : manualProtein;
      const carbsVal = (activeSelectedFood && scaledPreview && scaledPreview.carbs.value !== null) ? scaledPreview.carbs.value : manualCarbs;
      const fatVal = (activeSelectedFood && scaledPreview && scaledPreview.fat.value !== null) ? scaledPreview.fat.value : manualFat;
      const fiberVal = (activeSelectedFood && scaledPreview && scaledPreview.fiber?.value != null) ? scaledPreview.fiber.value : manualFiber;

      const payload = {
        dateStr: selectedDate,
        slot: activeSlot,
        name: customItemName.trim(),
        foodId: selectedFoodId || null,
        quantity: itemQuantity,
        unit: itemUnit,
        calories: caloriesVal,
        protein: proteinVal,
        carbs: carbsVal,
        fat: fatVal,
        fiber: fiberVal,
      };

      const res = await addMealPlanItem(payload);
      if (res.success && res.data) {
        setItems((prev) => [...prev, res.data!]);
        setWeekItemsMap((prev) => ({
          ...prev,
          [selectedDate]: [...(prev[selectedDate] || []), res.data!],
        }));
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
        setWeekItemsMap((prev) => ({
          ...prev,
          [selectedDate]: (prev[selectedDate] || []).filter((it) => it.id !== itemId),
        }));
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

  const handleToggleConsumed = async (item: MealPlanItem) => {
    const isConsumed = consumptionLogs.some(
      (l) => l.meal_plan_item_id === item.id
    );

    try {
      if (isConsumed) {
        const res = await unlogPlannedItem(item.id, selectedDate);
        if (res.success) {
          setConsumptionLogs((prev) =>
            prev.filter((l) => l.meal_plan_item_id !== item.id)
          );
          setWeekLogsMap((prev) => ({
            ...prev,
            [selectedDate]: (prev[selectedDate] || []).filter((l) => l.meal_plan_item_id !== item.id),
          }));
          onDataChanged?.();
        }
      } else {
        const res = await logPlannedItemAsConsumed(item.id, selectedDate);
        if (res.success && res.data) {
          setConsumptionLogs((prev) => [...prev, res.data!]);
          setWeekLogsMap((prev) => ({
            ...prev,
            [selectedDate]: [...(prev[selectedDate] || []), res.data!],
          }));
          onDataChanged?.();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Edit Modal
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
      const res = await updateMealPlanItem({
        id: editingItem.id,
        quantity: editQuantity,
        unit: editUnit,
      });

      if (res.success && res.data) {
        setItems((prev) =>
          prev.map((it) => (it.id === editingItem.id ? res.data! : it))
        );
        setWeekItemsMap((prev) => ({
          ...prev,
          [selectedDate]: (prev[selectedDate] || []).map((it) => (it.id === editingItem.id ? res.data! : it)),
        }));
        setEditingItem(null);
        onDataChanged?.();
      } else {
        setEditError(res.error || "Failed to update item.");
      }
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Error saving changes.");
    } finally {
      setEditLoading(false);
    }
  };

  // --- 1-Click Load 7-Day Pinoy Everyday Cycle ---
  const handleLoadPinoy7DayCycle = async () => {
    setCycleLoading(true);
    setCycleSuccess(null);
    setErrorMsg(null);

    try {
      for (let i = 0; i < 7; i++) {
        const targetDay = weekDays[i];
        const cyclePreset = PINOY_EVERYDAY_7DAY_CYCLE[i];
        if (!targetDay || !cyclePreset) continue;

        for (const meal of cyclePreset.meals) {
          await addMealPlanItem({
            dateStr: targetDay.iso,
            slot: meal.slot,
            name: meal.name,
            foodId: null,
            quantity: 1,
            unit: "serving",
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fat: meal.fat,
            fiber: meal.fiber,
          });
        }
      }

      setCycleSuccess("✓ Loaded 7-Day Pinoy Everyday Cycle across your week!");
      onDataChanged?.();
      // Refetch current day
      const planRes = await getMealPlanForDate(selectedDate);
      if (planRes.success && planRes.data) {
        setItems(planRes.data.items);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error loading 7-day cycle.");
    } finally {
      setCycleLoading(false);
    }
  };

  // --- Quick Pinoy Combo Builder Submission ---
  const selectedComboEgg = PINOY_BREAKFAST_COMBO_OPTIONS.eggs.find((e) => e.id === comboEggId) || PINOY_BREAKFAST_COMBO_OPTIONS.eggs[0];
  const selectedComboCarb = PINOY_BREAKFAST_COMBO_OPTIONS.carbs.find((c) => c.id === comboCarbId) || PINOY_BREAKFAST_COMBO_OPTIONS.carbs[0];
  const selectedComboFruit = PINOY_BREAKFAST_COMBO_OPTIONS.fruits.find((f) => f.id === comboFruitId) || PINOY_BREAKFAST_COMBO_OPTIONS.fruits[0];
  const selectedComboWater = PINOY_BREAKFAST_COMBO_OPTIONS.water.find((w) => w.id === comboWaterId) || PINOY_BREAKFAST_COMBO_OPTIONS.water[0];

  const comboTotals = useMemo(() => {
    return {
      calories: selectedComboEgg.calories + selectedComboCarb.calories + selectedComboFruit.calories,
      protein: selectedComboEgg.protein + selectedComboCarb.protein + selectedComboFruit.protein,
      carbs: selectedComboEgg.carbs + selectedComboCarb.carbs + selectedComboFruit.carbs,
      fat: selectedComboEgg.fat + selectedComboCarb.fat + selectedComboFruit.fat,
      fiber: selectedComboEgg.fiber + selectedComboCarb.fiber + selectedComboFruit.fiber,
      waterGlasses: selectedComboWater.glasses,
      waterMl: selectedComboWater.ml,
    };
  }, [selectedComboEgg, selectedComboCarb, selectedComboFruit, selectedComboWater]);

  const handleAddPinoyCombo = async () => {
    setComboAdding(true);
    try {
      if (comboAddSeparately) {
        // Add each chosen component as its own individual planned item for per-food tracking
        const addedItems: MealPlanItem[] = [];

        // 1. Egg item
        const eggRes = await addMealPlanItem({
          dateStr: selectedDate,
          slot: "breakfast",
          name: selectedComboEgg.name,
          foodId: null,
          quantity: selectedComboEgg.servingSize,
          unit: selectedComboEgg.servingUnit,
          calories: selectedComboEgg.calories,
          protein: selectedComboEgg.protein,
          carbs: selectedComboEgg.carbs,
          fat: selectedComboEgg.fat,
          fiber: selectedComboEgg.fiber,
        });
        if (eggRes.success && eggRes.data) addedItems.push(eggRes.data);

        // 2. Carb item
        const carbRes = await addMealPlanItem({
          dateStr: selectedDate,
          slot: "breakfast",
          name: selectedComboCarb.name,
          foodId: null,
          quantity: selectedComboCarb.servingSize,
          unit: selectedComboCarb.servingUnit,
          calories: selectedComboCarb.calories,
          protein: selectedComboCarb.protein,
          carbs: selectedComboCarb.carbs,
          fat: selectedComboCarb.fat,
          fiber: selectedComboCarb.fiber,
        });
        if (carbRes.success && carbRes.data) addedItems.push(carbRes.data);

        // 3. Fruit item
        const fruitRes = await addMealPlanItem({
          dateStr: selectedDate,
          slot: "breakfast",
          name: selectedComboFruit.name,
          foodId: null,
          quantity: selectedComboFruit.servingSize,
          unit: selectedComboFruit.servingUnit,
          calories: selectedComboFruit.calories,
          protein: selectedComboFruit.protein,
          carbs: selectedComboFruit.carbs,
          fat: selectedComboFruit.fat,
          fiber: selectedComboFruit.fiber,
        });
        if (fruitRes.success && fruitRes.data) addedItems.push(fruitRes.data);

        setItems((prev) => [...prev, ...addedItems]);
        setWeekItemsMap((prev) => ({
          ...prev,
          [selectedDate]: [...(prev[selectedDate] || []), ...addedItems],
        }));
      } else {
        const comboName = `Pinoy Breakfast: ${selectedComboEgg.name} + ${selectedComboCarb.name} + ${selectedComboFruit.name}`;
        const res = await addMealPlanItem({
          dateStr: selectedDate,
          slot: "breakfast",
          name: comboName,
          foodId: null,
          quantity: 1,
          unit: "serving",
          calories: comboTotals.calories,
          protein: comboTotals.protein,
          carbs: comboTotals.carbs,
          fat: comboTotals.fat,
          fiber: comboTotals.fiber,
        });

        if (res.success && res.data) {
          setItems((prev) => [...prev, res.data!]);
          setWeekItemsMap((prev) => ({
            ...prev,
            [selectedDate]: [...(prev[selectedDate] || []), res.data!],
          }));
        }
      }

      // Trigger water intake callback if provided
      if (onLogWater && comboTotals.waterGlasses > 0) {
        onLogWater(comboTotals.waterGlasses);
      }
      setShowPinoyComboModal(false);
      onDataChanged?.();
    } catch (err) {
      console.error("Failed to add combo", err);
    } finally {
      setComboAdding(false);
    }
  };

  // --- Shopping / Ingredient List Extraction ---
  const allWeekMealNames = useMemo(() => {
    const names: string[] = [];
    Object.values(weekItemsMap).forEach((dayItems) => {
      dayItems.forEach((it) => {
        if (it.name) names.push(it.name);
      });
    });
    // Fallback to active day items if week map is still empty
    if (names.length === 0) {
      items.forEach((it) => {
        if (it.name) names.push(it.name);
      });
    }
    return names;
  }, [weekItemsMap, items]);

  const autoIngredients = useMemo(() => {
    return aggregateIngredientsFromMealNames(allWeekMealNames);
  }, [allWeekMealNames]);

  const combinedGroceryList = useMemo(() => {
    const list = [...autoIngredients, ...customGroceries];
    if (!grocerySearchQuery.trim()) return list;
    const q = grocerySearchQuery.toLowerCase();
    return list.filter(
      (it) => it.name.toLowerCase().includes(q) || it.category.toLowerCase().includes(q)
    );
  }, [autoIngredients, customGroceries, grocerySearchQuery]);

  const handleAddCustomGrocery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grocerySearchQuery.trim()) return;
    const newItem: IngredientItem = {
      id: `custom-gro-${Date.now()}`,
      name: grocerySearchQuery.trim(),
      category: newGroceryCat,
      quantity: newGroceryQty.trim() || "1 portion",
      checked: false,
    };
    setCustomGroceries((prev) => [...prev, newItem]);
    setGrocerySearchQuery("");
  };

  const toggleIngredientChecked = (id: string) => {
    setCheckedIngredientIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyGroceryListToClipboard = () => {
    const lines = ["🛒 NUTRICIOUS GOALS - AGGREGATED GROCERY LIST", ""];
    const categories = ["Produce & Greens", "Meat & Seafood", "Eggs & Dairy", "Grains & Bakery", "Pantry & Seasonings"] as const;

    categories.forEach((cat) => {
      const inCat = combinedGroceryList.filter((it) => it.category === cat);
      if (inCat.length > 0) {
        lines.push(`--- ${cat.toUpperCase()} ---`);
        inCat.forEach((it) => {
          const mark = checkedIngredientIds.has(it.id) ? "[x]" : "[ ]";
          lines.push(`${mark} ${it.name} (${it.quantity})`);
        });
        lines.push("");
      }
    });

    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  // Planned totals for selected day
  const plannedTotals = useMemo(() => {
    const logMocks: ConsumptionLog[] = items.map((it) => ({
      id: it.id,
      user_id: it.user_id,
      food_name: it.name,
      food_id: it.food_id,
      meal_plan_item_id: it.id,
      log_date: selectedDate,
      slot: it.slot,
      consumed_at: selectedDate,
      quantity: it.quantity,
      unit: it.unit,
      calories: it.calories,
      protein: it.protein,
      carbs: it.carbs,
      fat: it.fat,
      fiber: it.fiber,
      created_at: it.created_at,
      updated_at: it.updated_at,
    }));
    return calculateNutrientTotals(logMocks);
  }, [items, selectedDate]);

  // Consumed totals for selected day
  const consumedTotals = useMemo(() => {
    return calculateNutrientTotals(consumptionLogs);
  }, [consumptionLogs]);

  // Macro percentages for visual distribution bar
  const plannedMacroGrams =
    plannedTotals.protein.total +
    plannedTotals.carbs.total +
    plannedTotals.fat.total;

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
      {/* 1. Ambient Hero Header with Date Controls & Top View Switcher */}
      <section className="stitch-planner-hero">
        <div className="stitch-planner-glow-1" />
        <div className="stitch-planner-glow-2" />

        <div className="stitch-planner-hero-inner">
          <div className="stitch-planner-top-meta">
            <span className="stitch-planner-cycle-pill">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
              7-Day Cycle • Pinoy &amp; Clinical Nutrition
            </span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                type="button"
                onClick={() => setShowPinoyComboModal(true)}
                className="stitch-card-btn"
                style={{
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  backgroundColor: "rgba(22, 163, 74, 0.15)",
                  color: "var(--primary)",
                  borderColor: "rgba(22, 163, 74, 0.3)",
                }}
              >
                🇵🇭 Quick Pinoy Combo Builder
              </button>
            </div>
          </div>

          <div className="stitch-planner-hero-row">
            <div>
              <h2 className="stitch-planner-title">Weekly &amp; Daily Meal Planning</h2>
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

          {/* Subview Navigation Pills */}
          <div style={{ display: "flex", gap: 8, marginTop: 14, overflowX: "auto", paddingBottom: 4 }}>
            {[
              { id: "day", label: "📅 Daily Planner", desc: "Detailed slots & meals" },
              { id: "cycle", label: "🗓️ 7-Day Cycle & Weekly Plan", desc: "Full 7 days schedule" },
              { id: "history", label: "📜 Weekly Meal History", desc: "Logged macros & compliance" },
              { id: "groceries", label: "🛒 Shopping & Ingredient List", desc: "Direct meal aggregation" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubView(tab.id as typeof activeSubView)}
                className={`stitch-nav-pill ${activeSubView === tab.id ? "active" : ""}`}
                style={{ padding: "8px 14px", fontSize: 13, height: "auto" }}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* 7-Day Date Carousel Strip */}
          {(activeSubView === "day" || activeSubView === "cycle") && (
            <div className="stitch-planner-day-strip" role="tablist" aria-label="7-day week schedule" style={{ marginTop: 12 }}>
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
          )}
        </div>
      </section>

      {/* Notifications */}
      {cycleSuccess && (
        <div className="stitch-alert stitch-alert-success" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <div>{cycleSuccess}</div>
        </div>
      )}

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

      {/* ============================================================== */}
      {/* SUBVIEW 1: DAILY PLANNER                                       */}
      {/* ============================================================== */}
      {activeSubView === "day" && (
        <>
          {/* Macro Distribution Target vs. Planned Banner */}
          <section className="stitch-planner-macro-banner">
            <div className="stitch-planner-macro-header">
              <div>
                <h3 className="stitch-planner-macro-title">Daily Macro Distribution • Target vs. Planned</h3>
                <div className="stitch-planner-macro-subtitle">
                  Planned: {plannedTotals.calories.total.toLocaleString()} kcal • Consumed: {consumedTotals.calories.total.toLocaleString()} kcal
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--primary)] bg-[var(--surface-container-low)] px-3 py-1 rounded-full">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {items.length} Planned Meals
              </span>
            </div>

            {/* Visual Macro Bar */}
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
                  <div className="stitch-planner-legend-label">Healthy Fats</div>
                  <div className="stitch-planner-legend-val">
                    {formatNutrient(plannedTotals.fat.total)}
                    <span className="stitch-planner-legend-pct">({fatPct}%)</span>
                  </div>
                </div>
              </div>
              <div className="stitch-planner-legend-item">
                <div className="stitch-planner-legend-dot bg-[var(--outline)]" />
                <div>
                  <div className="stitch-planner-legend-label">Dietary Fiber</div>
                  <div className="stitch-planner-legend-val">
                    {formatNutrient(plannedTotals.fiber?.total || 0)}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Meal Slot Timeline Sections */}
          <div className="stitch-planner-slots-stack">
            {MEAL_SLOTS.map((slot) => {
              const slotItems = items.filter((it) => it.slot === slot.id);
              const slotCalories = slotItems.reduce((acc, it) => acc + (it.calories || 0), 0);

              return (
                <section key={slot.id} className="stitch-slot-card">
                  <div className="stitch-slot-card-header">
                    <div className="stitch-slot-title-wrap">
                      <span className="stitch-slot-emoji" role="img" aria-label={slot.title}>
                        {slot.emoji}
                      </span>
                      <div>
                        <h4 className="stitch-slot-title">{slot.title}</h4>
                        <span className="stitch-slot-cal-badge">
                          {slotCalories > 0 ? `${slotCalories} kcal` : "Unscheduled"}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="stitch-slot-add-btn"
                      onClick={() => openAddModal(slot.id)}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span>Add Item</span>
                    </button>
                  </div>

                  {slotItems.length === 0 ? (
                    <div className="stitch-slot-empty">
                      <span>No meals planned for {slot.title.toLowerCase()}.</span>
                    </div>
                  ) : (
                    <div className="stitch-slot-items-list">
                      {slotItems.map((item) => {
                        const isConsumed = consumptionLogs.some(
                          (l) => l.meal_plan_item_id === item.id
                        );

                        return (
                          <div
                            key={item.id}
                            className={`stitch-planned-item-row ${isConsumed ? "is-consumed" : ""}`}
                          >
                            <div className="stitch-item-main-col">
                              <button
                                type="button"
                                className={`stitch-checkbox-btn ${isConsumed ? "checked" : ""}`}
                                onClick={() => handleToggleConsumed(item)}
                                aria-label={isConsumed ? "Mark as unconsumed" : "Mark as consumed"}
                              >
                                {isConsumed && (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </button>

                              <div className="stitch-item-title-block">
                                <span className={`stitch-item-name ${isConsumed ? "line-through text-muted" : ""}`}>
                                  {item.name}
                                </span>
                                <span className="stitch-item-portion">
                                  {item.quantity} {item.unit}
                                </span>
                              </div>
                            </div>

                            <div className="stitch-item-macros-col">
                              <span className="stitch-item-macro-chip cal">
                                {item.calories !== null ? `${item.calories} kcal` : "—"}
                              </span>
                              <span className="stitch-item-macro-chip p">
                                P: {item.protein !== null ? `${item.protein}g` : "—"}
                              </span>
                              <span className="stitch-item-macro-chip c">
                                C: {item.carbs !== null ? `${item.carbs}g` : "—"}
                              </span>
                              <span className="stitch-item-macro-chip f">
                                F: {item.fat !== null ? `${item.fat}g` : "—"}
                              </span>
                            </div>

                            <div className="stitch-item-actions-col">
                              <button
                                type="button"
                                className="stitch-icon-btn edit"
                                onClick={() => openEditModal(item)}
                                aria-label="Edit item portion"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M12 20h9" />
                                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                className="stitch-icon-btn delete"
                                onClick={() => handleDeleteItem(item.id)}
                                aria-label="Remove item"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* SUBVIEW 2: 7-DAY CYCLE & WEEKLY PLAN                           */}
      {/* ============================================================== */}
      {activeSubView === "cycle" && (
        <section className="stitch-module-card" style={{ padding: "24px", marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
            <div>
              <span className="stitch-console-eyebrow">
                <span>7-DAY ROTATION</span> • <span>Pinoy Daily Nutrition Standards</span>
              </span>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: "4px 0" }}>
                7-Day Weekly Cycle Planner
              </h3>
              <p style={{ fontSize: 13, color: "var(--on-surface-variant)" }}>
                Track complete weekly rotations with balanced macro baselines.
              </p>
            </div>

            <button
              type="button"
              disabled={cycleLoading}
              onClick={handleLoadPinoy7DayCycle}
              className="add-button"
              style={{ height: 40, padding: "0 18px", fontSize: 13 }}
            >
              {cycleLoading ? "Loading Schedule..." : "🇵🇭 Load 7-Day Pinoy Everyday Cycle"}
            </button>
          </div>

          {/* 7-Day Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
            {weekDays.map((day, idx) => {
              const dayItems = weekItemsMap[day.iso] || [];
              const dayLogs = weekLogsMap[day.iso] || [];
              const dayCalories = dayItems.reduce((acc, it) => acc + (it.calories || 0), 0);

              const preset = PINOY_EVERYDAY_7DAY_CYCLE[idx];

              return (
                <div
                  key={day.iso}
                  style={{
                    borderRadius: 14,
                    padding: 14,
                    backgroundColor: day.isSelected ? "var(--surface-container-high)" : "var(--surface-container-low)",
                    border: day.isSelected ? "2px solid var(--primary)" : "1px solid var(--border-subtle)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--primary)" }}>
                        Day {idx + 1}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--on-surface)" }}>
                        {day.dayName} ({day.dayNum})
                      </span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "monospace", color: "var(--primary)" }}>
                      {dayCalories} kcal
                    </span>
                  </div>

                  {preset && (
                    <div style={{ fontSize: 11, color: "var(--on-surface-variant)", marginBottom: 8 }}>
                      Reference Target: {preset.targetCalories} kcal • P: {preset.targetProtein}g • C: {preset.targetCarbs}g • F: {preset.targetFat}g
                    </div>
                  )}

                  {/* Meal Pills */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, minHeight: 90 }}>
                    {dayItems.length === 0 ? (
                      <div style={{ fontSize: 12, color: "var(--on-surface-variant)", fontStyle: "italic", padding: "12px 0" }}>
                        No meals scheduled for this day.
                      </div>
                    ) : (
                      dayItems.map((it) => {
                        const isDone = dayLogs.some((l) => l.meal_plan_item_id === it.id);
                        return (
                          <div
                            key={it.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "6px 8px",
                              borderRadius: 8,
                              backgroundColor: "var(--surface-container)",
                              fontSize: 12,
                            }}
                          >
                            <span style={{ fontWeight: 600, textDecoration: isDone ? "line-through" : "none", color: isDone ? "var(--on-surface-variant)" : "var(--on-surface)" }}>
                              {it.name.split(":")[0]}
                            </span>
                            <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--primary)" }}>
                              {it.calories ? `${it.calories} kcal` : ""}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(day.iso);
                      setActiveSubView("day");
                    }}
                    className="stitch-card-btn"
                    style={{ width: "100%", justifyContent: "center", marginTop: 10, fontSize: 11, padding: "6px 0" }}
                  >
                    Open Daily Details →
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* SUBVIEW 3: WEEKLY MEAL HISTORY                                 */}
      {/* ============================================================== */}
      {activeSubView === "history" && (
        <section className="stitch-module-card" style={{ padding: "24px", marginTop: 16 }}>
          <div style={{ marginBottom: 16 }}>
            <span className="stitch-console-eyebrow">
              <span>WEEKLY SUMMARY</span> • <span>Compliance &amp; History Log</span>
            </span>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: "4px 0" }}>
              7-Day Meal History &amp; Macro Audit
            </h3>
            <p style={{ fontSize: 13, color: "var(--on-surface-variant)" }}>
              Historical review of consumed whole foods versus baseline dietary targets.
            </p>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-subtle)", color: "var(--on-surface-variant)" }}>
                  <th style={{ padding: "10px 8px" }}>Day &amp; Date</th>
                  <th style={{ padding: "10px 8px" }}>Planned / Consumed</th>
                  <th style={{ padding: "10px 8px" }}>Calories Logged</th>
                  <th style={{ padding: "10px 8px" }}>Protein</th>
                  <th style={{ padding: "10px 8px" }}>Carbs</th>
                  <th style={{ padding: "10px 8px" }}>Fats</th>
                  <th style={{ padding: "10px 8px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {weekDays.map((day) => {
                  const dayItems = weekItemsMap[day.iso] || [];
                  const dayLogs = weekLogsMap[day.iso] || [];
                  const consumedCalories = dayLogs.reduce((acc, l) => acc + (l.calories || 0), 0);
                  const consumedProtein = dayLogs.reduce((acc, l) => acc + (l.protein || 0), 0);
                  const consumedCarbs = dayLogs.reduce((acc, l) => acc + (l.carbs || 0), 0);
                  const consumedFat = dayLogs.reduce((acc, l) => acc + (l.fat || 0), 0);

                  const isComplete = dayItems.length > 0 && dayLogs.length >= dayItems.length;
                  const isPartial = dayLogs.length > 0 && dayLogs.length < dayItems.length;

                  return (
                    <tr
                      key={day.iso}
                      style={{
                        borderBottom: "1px solid var(--border-subtle)",
                        backgroundColor: day.isSelected ? "var(--surface-container-low)" : "transparent",
                      }}
                    >
                      <td style={{ padding: "12px 8px", fontWeight: 700 }}>
                        {day.dayName}, {day.dayNum}
                        {day.isToday && (
                          <span style={{ marginLeft: 6, fontSize: 10, padding: "2px 6px", borderRadius: 4, backgroundColor: "var(--primary-container)", color: "var(--on-primary-container)" }}>
                            Today
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 8px" }}>
                        {dayLogs.length} of {dayItems.length} meals logged
                      </td>
                      <td style={{ padding: "12px 8px", fontFamily: "monospace", fontWeight: 700, color: "var(--primary)" }}>
                        {consumedCalories.toLocaleString()} kcal
                      </td>
                      <td style={{ padding: "12px 8px", fontFamily: "monospace" }}>
                        {consumedProtein.toFixed(1)}g
                      </td>
                      <td style={{ padding: "12px 8px", fontFamily: "monospace" }}>
                        {consumedCarbs.toFixed(1)}g
                      </td>
                      <td style={{ padding: "12px 8px", fontFamily: "monospace" }}>
                        {consumedFat.toFixed(1)}g
                      </td>
                      <td style={{ padding: "12px 8px" }}>
                        {isComplete ? (
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999, backgroundColor: "rgba(22, 163, 74, 0.15)", color: "#16a34a" }}>
                            ✓ 100% Done
                          </span>
                        ) : isPartial ? (
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999, backgroundColor: "rgba(217, 119, 6, 0.15)", color: "#d97706" }}>
                            Active
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: "var(--on-surface-variant)" }}>
                            Scheduled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* SUBVIEW 4: SMART INGREDIENT & SHOPPING LIST                    */}
      {/* ============================================================== */}
      {activeSubView === "groceries" && (
        <section className="stitch-module-card" style={{ padding: "24px", marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
            <div>
              <span className="stitch-console-eyebrow">
                <span>GROCERY &amp; PANTRY</span> • <span>Direct Meal Aggregation</span>
              </span>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: "4px 0" }}>
                Aggregated Ingredient &amp; Shopping List
              </h3>
              <p style={{ fontSize: 13, color: "var(--on-surface-variant)" }}>
                Automatically calculated from your planned meals across the 7-day cycle.
              </p>
            </div>

            <button
              type="button"
              onClick={copyGroceryListToClipboard}
              className="stitch-card-btn"
              style={{
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 700,
                backgroundColor: "var(--surface-container-high)",
              }}
            >
              {copiedNotification ? "✓ Copied to Clipboard!" : "📋 Copy Shopping List"}
            </button>
          </div>

          {/* Search & Add Custom Ingredient Bar */}
          <form onSubmit={handleAddCustomGrocery} style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search or add ingredient (e.g. Bawang, Sibuyas, Kamatis, Patis substitute)..."
              value={grocerySearchQuery}
              onChange={(e) => setGrocerySearchQuery(e.target.value)}
              style={{ flex: "2 1 240px" }}
            />
            <select
              className="form-select"
              value={newGroceryCat}
              onChange={(e) => setNewGroceryCat(e.target.value as IngredientItem["category"])}
              style={{ flex: "1 1 140px" }}
            >
              <option value="Produce & Greens">🥬 Produce &amp; Greens</option>
              <option value="Meat & Seafood">🥩 Meat &amp; Seafood</option>
              <option value="Eggs & Dairy">🥚 Eggs &amp; Dairy</option>
              <option value="Grains & Bakery">🌾 Grains &amp; Bakery</option>
              <option value="Pantry & Seasonings">🧂 Pantry &amp; Seasonings</option>
            </select>
            <input
              type="text"
              className="form-input"
              placeholder="Qty (e.g. 2 pcs, 500g)"
              value={newGroceryQty}
              onChange={(e) => setNewGroceryQty(e.target.value)}
              style={{ flex: "1 1 100px" }}
            />
            <button type="submit" className="add-button" style={{ height: 42, padding: "0 16px" }}>
              + Add to List
            </button>
          </form>

          {/* Categorized Grocery List */}
          {combinedGroceryList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: "var(--on-surface-variant)", fontSize: 13 }}>
              No ingredients aggregated yet. Add meals to your weekly planner or type an ingredient above.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {(
                [
                  "Produce & Greens",
                  "Meat & Seafood",
                  "Eggs & Dairy",
                  "Grains & Bakery",
                  "Pantry & Seasonings",
                ] as const
              ).map((category) => {
                const categoryItems = combinedGroceryList.filter((it) => it.category === category);
                if (categoryItems.length === 0) return null;

                const categoryIcons: Record<string, string> = {
                  "Produce & Greens": "🥬",
                  "Meat & Seafood": "🥩",
                  "Eggs & Dairy": "🥚",
                  "Grains & Bakery": "🌾",
                  "Pantry & Seasonings": "🧂",
                };

                return (
                  <div
                    key={category}
                    style={{
                      borderRadius: 12,
                      padding: 14,
                      backgroundColor: "var(--surface-container-low)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                      <span>{categoryIcons[category]}</span>
                      <span>{category}</span>
                      <span style={{ fontSize: 11, color: "var(--on-surface-variant)", marginLeft: "auto" }}>
                        ({categoryItems.length})
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {categoryItems.map((ing) => {
                        const isChecked = checkedIngredientIds.has(ing.id);
                        return (
                          <div
                            key={ing.id}
                            onClick={() => toggleIngredientChecked(ing.id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "6px 8px",
                              borderRadius: 8,
                              backgroundColor: isChecked ? "transparent" : "var(--surface-container)",
                              cursor: "pointer",
                              userSelect: "none",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleIngredientChecked(ing.id)}
                              style={{ width: 15, height: 15, cursor: "pointer" }}
                            />
                            <div style={{ flex: 1, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                              <span style={{ textDecoration: isChecked ? "line-through" : "none", color: isChecked ? "var(--on-surface-variant)" : "var(--on-surface)", fontWeight: 600 }}>
                                {ing.name}
                              </span>
                              <span style={{ color: "var(--on-surface-variant)", fontSize: 11 }}>
                                {ing.quantity}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ============================================================== */}
      {/* QUICK PINOY COMBO BUILDER MODAL                                */}
      {/* ============================================================== */}
      {showPinoyComboModal && (
        <div className="modal-backdrop" onClick={() => setShowPinoyComboModal(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 640,
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
                onClick={() => setShowPinoyComboModal(false)}
                aria-label="Close modal"
              >
                ×
              </button>
              <span className="section-kicker">🇵🇭 PINOY BREAKFAST BUILDER</span>
              <h2>Custom Pinoy Meal &amp; Water Combo</h2>
              <p style={{ fontSize: 13, color: "var(--on-surface-variant)", margin: "4px 0 12px" }}>
                Configure your classic morning staples with automatic per-food calories, macronutrients, and water logging.
              </p>
            </div>

            {/* Scrollable Content for Option Cards */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                paddingRight: 6,
                margin: "4px 0 10px",
              }}
            >
              {/* Individual vs Combo Mode Checkbox */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, padding: "10px 14px", borderRadius: 10, backgroundColor: "var(--surface-container-high)", border: "1px solid var(--border-subtle)" }}>
                <input
                  type="checkbox"
                  id="combo-separate-check"
                  checked={comboAddSeparately}
                  onChange={(e) => setComboAddSeparately(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: "pointer", accentColor: "var(--primary)" }}
                />
                <label htmlFor="combo-separate-check" style={{ fontSize: 12, fontWeight: 700, cursor: "pointer", color: "var(--on-surface)" }}>
                  ✓ Add as separate food items (Automatic per-food &amp; per-serving tracking)
                </label>
              </div>

              {/* Step 1: Itlog Options Cards */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--on-surface)", display: "block", marginBottom: 6 }}>
                  🥚 1. Itlog (Pinakuluan o Scrambled)
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {PINOY_BREAKFAST_COMBO_OPTIONS.eggs.map((opt) => {
                    const isSelected = comboEggId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setComboEggId(opt.id)}
                        style={{
                          padding: 12,
                          borderRadius: 12,
                          textAlign: "left",
                          backgroundColor: isSelected ? "var(--surface-container-high)" : "var(--surface-container-low)",
                          border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border-subtle)",
                          cursor: "pointer",
                          position: "relative",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--on-surface)" }}>{opt.name}</div>
                          {isSelected && (
                            <span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 800 }}>✓</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--on-surface-variant)", marginTop: 2 }}>{opt.portionDesc}</div>
                        <div style={{ fontSize: 11, color: "var(--primary)", fontWeight: 700, fontFamily: "monospace", marginTop: 4 }}>
                          {opt.calories} kcal • {opt.protein}g P • {opt.fat}g F
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Kanin o Wheat Bread Cards */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--on-surface)", display: "block", marginBottom: 6 }}>
                  🍚 2. Kanin o Wheat Bread / Pan de Sal
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
                  {PINOY_BREAKFAST_COMBO_OPTIONS.carbs.map((opt) => {
                    const isSelected = comboCarbId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setComboCarbId(opt.id)}
                        style={{
                          padding: 12,
                          borderRadius: 12,
                          textAlign: "left",
                          backgroundColor: isSelected ? "var(--surface-container-high)" : "var(--surface-container-low)",
                          border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border-subtle)",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--on-surface)" }}>{opt.name}</div>
                          {isSelected && (
                            <span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 800 }}>✓</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--on-surface-variant)", marginTop: 2 }}>{opt.portionDesc}</div>
                        <div style={{ fontSize: 11, color: "var(--primary)", fontWeight: 700, fontFamily: "monospace", marginTop: 4 }}>
                          {opt.calories} kcal • {opt.carbs}g C
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Saging o Kapirasong Mangga Cards */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--on-surface)", display: "block", marginBottom: 6 }}>
                  🍌 3. Saging o Kapirasong Mangga
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {PINOY_BREAKFAST_COMBO_OPTIONS.fruits.map((opt) => {
                    const isSelected = comboFruitId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setComboFruitId(opt.id)}
                        style={{
                          padding: 12,
                          borderRadius: 12,
                          textAlign: "left",
                          backgroundColor: isSelected ? "var(--surface-container-high)" : "var(--surface-container-low)",
                          border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border-subtle)",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--on-surface)" }}>{opt.name}</div>
                          {isSelected && (
                            <span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 800 }}>✓</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--on-surface-variant)", marginTop: 2 }}>{opt.portionDesc}</div>
                        <div style={{ fontSize: 11, color: "var(--primary)", fontWeight: 700, fontFamily: "monospace", marginTop: 4 }}>
                          {opt.calories} kcal • {opt.carbs}g C
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 4: Tubig Cards */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--on-surface)", display: "block", marginBottom: 6 }}>
                  💧 4. Tubig (Automated Hydration Logging)
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {PINOY_BREAKFAST_COMBO_OPTIONS.water.map((opt) => {
                    const isSelected = comboWaterId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setComboWaterId(opt.id)}
                        style={{
                          padding: 12,
                          borderRadius: 12,
                          textAlign: "left",
                          backgroundColor: isSelected ? "var(--surface-container-high)" : "var(--surface-container-low)",
                          border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border-subtle)",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--on-surface)" }}>{opt.name}</div>
                          {isSelected && (
                            <span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 800 }}>✓</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--primary)", fontWeight: 700, fontFamily: "monospace", marginTop: 4 }}>
                          {opt.ml} ml • 0 kcal
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Calculated Totals Card */}
              <div style={{ padding: 14, borderRadius: 12, backgroundColor: "var(--surface-container-high)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--on-surface-variant)", marginBottom: 6 }}>
                  CALCULATED NUTRITION &amp; HYDRATION TOTAL
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "monospace", color: "var(--primary)" }}>
                    {comboTotals.calories} kcal
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--on-surface)" }}>
                    P: {comboTotals.protein}g • C: {comboTotals.carbs}g • F: {comboTotals.fat}g • Fib: {comboTotals.fiber}g
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0284c7" }}>
                    💧 {comboTotals.waterMl} ml ({comboTotals.waterGlasses} {comboTotals.waterGlasses === 1 ? "glass" : "glasses"})
                  </span>
                </div>
              </div>
            </div>

            {/* Dedicated Fixed Footer with Confirm Button */}
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
                onClick={() => setShowPinoyComboModal(false)}
                style={{ padding: "0 18px", height: 42, fontSize: 13, justifyContent: "center" }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={comboAdding}
                onClick={handleAddPinoyCombo}
                className="add-button"
                style={{ flex: 1, height: 42, justifyContent: "center", fontSize: 14, fontWeight: 700 }}
              >
                {comboAdding
                  ? "Adding Items to Plan..."
                  : `✓ Confirm & Add (${comboTotals.calories} kcal) to Breakfast`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ADD ITEM MODAL WITH CARDS & CALORIE CALIBRATOR                  */}
      {/* ============================================================== */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 700,
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
                onClick={() => setShowAddModal(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            <span className="section-kicker">ADD PLANNED MEAL</span>
            <h2>
              Add to {MEAL_SLOTS.find((s) => s.id === activeSlot)?.title}
            </h2>

            {addError && (
              <div className="stitch-alert stitch-alert-error my-3" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div>{addError}</div>
              </div>
            )}

            {/* TAB SELECTOR INSIDE MODAL */}
            <div style={{ display: "flex", gap: 8, margin: "14px 0 16px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: 10, overflowX: "auto" }}>
              <button
                type="button"
                onClick={() => setAddModalTab("recommendations")}
                className={`stitch-nav-pill ${addModalTab === "recommendations" ? "active" : ""}`}
                style={{ padding: "6px 14px", fontSize: 12 }}
              >
                🌟 Recommended Dishes ({slotRecommendations.length})
              </button>
              <button
                type="button"
                onClick={() => setAddModalTab("library")}
                className={`stitch-nav-pill ${addModalTab === "library" ? "active" : ""}`}
                style={{ padding: "6px 14px", fontSize: 12 }}
              >
                📚 Food Library ({customFoods.length})
              </button>
              <button
                type="button"
                onClick={() => setAddModalTab("custom")}
                className={`stitch-nav-pill ${addModalTab === "custom" ? "active" : ""}`}
                style={{ padding: "6px 14px", fontSize: 12 }}
              >
                🎯 Calorie Scaler &amp; Custom Entry
              </button>
            </div>
          </div>

          {/* Scrollable Content Area for Cards & Forms */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              paddingRight: 6,
              margin: "4px 0 10px",
            }}
          >
            {/* TAB 1: RECOMMENDED DISHES CARDS */}
            {addModalTab === "recommendations" && (
              <div>
                <div style={{ fontSize: 12, color: "var(--on-surface-variant)", marginBottom: 12 }}>
                  Authentic whole dishes calibrated for {dietLabel}. Click any card to select, then confirm below, or click <strong>+ Quick Add</strong> to add immediately.
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                  {slotRecommendations.map((rec) => {
                    const isSelected = appliedRecId === rec.id || customItemName === rec.name;
                    return (
                      <div
                        key={rec.id}
                        onClick={() => applyRecommendation(rec)}
                        style={{
                          borderRadius: 14,
                          padding: 14,
                          backgroundColor: isSelected ? "var(--surface-container-high)" : "var(--surface-container-low)",
                          border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border-subtle)",
                          transition: "all 0.15s ease",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          cursor: "pointer",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                            <span style={{ fontSize: 22 }}>{rec.emoji}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--on-surface)", lineHeight: 1.3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span>{rec.name}</span>
                                {isSelected && (
                                  <span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 800 }}>✓</span>
                                )}
                              </div>
                              <div style={{ fontSize: 11, color: "var(--on-surface-variant)", marginTop: 2 }}>
                                {rec.portionDesc}
                              </div>
                            </div>
                          </div>

                          {/* Nutrition Tags Grid */}
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "10px 0 12px" }}>
                            <span style={{ fontSize: 11, fontWeight: 800, fontFamily: "monospace", padding: "2px 8px", borderRadius: 6, backgroundColor: "var(--surface-container)", color: "var(--primary)" }}>
                              🔥 {rec.calories} kcal
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 6px", borderRadius: 6, backgroundColor: "var(--surface-container)", color: "var(--on-surface)" }}>
                              P: {rec.protein}g
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 6px", borderRadius: 6, backgroundColor: "var(--surface-container)", color: "var(--on-surface)" }}>
                              C: {rec.carbs}g
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 6px", borderRadius: 6, backgroundColor: "var(--surface-container)", color: "var(--on-surface)" }}>
                              F: {rec.fat}g
                            </span>
                          </div>
                        </div>

                        {/* Card Actions Row */}
                        <div style={{ display: "flex", gap: 8, paddingTop: 8, borderTop: "1px solid var(--border-subtle)" }}>
                          <button
                            type="button"
                            disabled={addLoading}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickAddRecommendation(rec);
                            }}
                            className="add-button"
                            style={{ flex: 1, height: 34, fontSize: 12, justifyContent: "center" }}
                          >
                            + Quick Add
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              applyRecommendation(rec);
                              setAddModalTab("custom");
                            }}
                            className="stitch-card-btn"
                            style={{ flex: 1, height: 34, fontSize: 11, justifyContent: "center" }}
                          >
                            ⚙️ Calibrate
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: FOOD LIBRARY CARDS */}
            {addModalTab === "library" && (
              <div>
                <div style={{ fontSize: 12, color: "var(--on-surface-variant)", marginBottom: 12 }}>
                  Foods saved in your personal library. Click <strong>+ Add to Slot</strong> or customize portion.
                </div>

                {customFoods.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--on-surface-variant)", fontSize: 13 }}>
                    No custom foods saved yet. You can add new recipes under the <strong>Food library</strong> tab, or pick from our recommended dishes.
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                    {customFoods.map((food) => {
                      const isSelected = selectedFoodId === food.id || customItemName === food.name;
                      return (
                        <div
                          key={food.id}
                          onClick={() => handleFoodSelect(food.id)}
                          style={{
                            borderRadius: 14,
                            padding: 14,
                            backgroundColor: isSelected ? "var(--surface-container-high)" : "var(--surface-container-low)",
                            border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border-subtle)",
                            transition: "all 0.15s ease",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            cursor: "pointer",
                          }}
                        >
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--on-surface)", display: "flex", alignItems: "center", gap: 6 }}>
                                  <span>{food.name}</span>
                                  {isSelected && (
                                    <span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 800 }}>✓</span>
                                  )}
                                </div>
                                {food.brand && (
                                  <div style={{ fontSize: 11, color: "var(--on-surface-variant)" }}>{food.brand}</div>
                                )}
                              </div>
                              <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 6, backgroundColor: "var(--surface-container)", color: "var(--on-surface)" }}>
                                {food.serving_size} {food.serving_unit}
                              </span>
                            </div>

                            {/* Macro Badges */}
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "10px 0 12px" }}>
                              <span style={{ fontSize: 11, fontWeight: 800, fontFamily: "monospace", padding: "2px 8px", borderRadius: 6, backgroundColor: "var(--surface-container)", color: "var(--primary)" }}>
                                🔥 {food.calories !== null ? `${food.calories} kcal` : "—"}
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 6px", borderRadius: 6, backgroundColor: "var(--surface-container)", color: "var(--on-surface)" }}>
                                P: {food.protein !== null ? `${food.protein}g` : "—"}
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 6px", borderRadius: 6, backgroundColor: "var(--surface-container)", color: "var(--on-surface)" }}>
                                C: {food.carbs !== null ? `${food.carbs}g` : "—"}
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 6px", borderRadius: 6, backgroundColor: "var(--surface-container)", color: "var(--on-surface)" }}>
                                F: {food.fat !== null ? `${food.fat}g` : "—"}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: 8, paddingTop: 8, borderTop: "1px solid var(--border-subtle)" }}>
                            <button
                              type="button"
                              disabled={addLoading}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickAddLibraryFood(food);
                              }}
                              className="add-button"
                              style={{ flex: 1, height: 34, fontSize: 12, justifyContent: "center" }}
                            >
                              + Add to Slot
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFoodSelect(food.id);
                                setAddModalTab("custom");
                              }}
                              className="stitch-card-btn"
                              style={{ flex: 1, height: 34, fontSize: 11, justifyContent: "center" }}
                            >
                              ⚙️ Calibrate
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CALORIE SCALER & CUSTOM ENTRY */}
            {addModalTab === "custom" && (
              <div>
                {/* TARGET / NEEDED CALORIE CALIBRATOR BOX */}
                <div style={{ padding: 14, borderRadius: 14, backgroundColor: "var(--surface-container)", border: "1px solid var(--border-subtle)", marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label htmlFor="modal-target-cal" style={{ fontSize: 12, fontWeight: 700, color: "var(--on-surface)" }}>
                      🎯 Target / Needed Calories (Auto-Portion Scaler)
                    </label>
                    <span style={{ fontSize: 11, color: "var(--primary)", fontWeight: 700 }}>
                      Type needed kcal to scale portion
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <input
                      id="modal-target-cal"
                      type="number"
                      className="form-input"
                      placeholder="e.g. 400"
                      value={targetCaloriesInput}
                      onChange={(e) => {
                        setTargetCaloriesInput(e.target.value);
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) handleApplyCalorieTarget(val);
                      }}
                      style={{ width: 130, fontFamily: "monospace", fontWeight: 700, fontSize: 15 }}
                    />
                    <div style={{ display: "flex", gap: 6 }}>
                      {[300, 400, 500, 600].map((kc) => (
                        <button
                          key={kc}
                          type="button"
                          onClick={() => handleApplyCalorieTarget(kc)}
                          className="stitch-card-btn"
                          style={{ fontSize: 11, padding: "5px 10px", height: "auto" }}
                        >
                          {kc} kcal
                        </button>
                      ))}
                    </div>
                  </div>

                  {targetCaloriesInput && (
                    <div style={{ fontSize: 11, color: "var(--on-surface-variant)", marginTop: 6 }}>
                      Active target: <strong>{targetCaloriesInput} kcal</strong> • Automatically scales serving quantity and macronutrients.
                    </div>
                  )}
                </div>

                <form onSubmit={handleSaveItem} className="auth-form">
                  <div className="form-group">
                    <label htmlFor="item-name">Planned Item Name *</label>
                    <input
                      id="item-name"
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. 2 pirasong Itlog + 1 tasa ng Kanin"
                      value={customItemName}
                      onChange={(e) => setCustomItemName(e.target.value)}
                    />
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label htmlFor="item-qty">Quantity</label>
                      <input
                        id="item-qty"
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        className="form-input"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(parseFloat(e.target.value) || 1)}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="item-unit">Unit</label>
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

                  {/* Macro Inputs / Scaled Indicators */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(95px, 1fr))", gap: 10, marginTop: 4 }}>
                    <div className="form-group">
                      <label style={{ fontSize: 11, color: "var(--on-surface-variant)" }}>Calories</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="kcal"
                        value={activeSelectedFood && scaledPreview?.calories.value !== null ? scaledPreview?.calories.value : (manualCalories !== null ? manualCalories : "")}
                        onChange={(e) => setManualCalories(e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: 11, color: "var(--on-surface-variant)" }}>Protein (g)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="form-input"
                        placeholder="g"
                        value={activeSelectedFood && scaledPreview?.protein.value !== null ? scaledPreview?.protein.value : (manualProtein !== null ? manualProtein : "")}
                        onChange={(e) => setManualProtein(e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: 11, color: "var(--on-surface-variant)" }}>Carbs (g)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="form-input"
                        placeholder="g"
                        value={activeSelectedFood && scaledPreview?.carbs.value !== null ? scaledPreview?.carbs.value : (manualCarbs !== null ? manualCarbs : "")}
                        onChange={(e) => setManualCarbs(e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: 11, color: "var(--on-surface-variant)" }}>Fat (g)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="form-input"
                        placeholder="g"
                        value={activeSelectedFood && scaledPreview?.fat.value !== null ? scaledPreview?.fat.value : (manualFat !== null ? manualFat : "")}
                        onChange={(e) => setManualFat(e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                  </div>

                  </form>
                </div>
              )}
            </div>

            {/* Dedicated Fixed Footer with Confirm Button Across All Tabs */}
            <div
              style={{
                flexShrink: 0,
                paddingTop: 12,
                borderTop: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: "1 1 200px" }}>
                {customItemName.trim() ? (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--on-surface)", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: "var(--primary)" }}>✓</span>
                      <span style={{ maxWidth: 260, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {customItemName}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--on-surface-variant)", marginTop: 2 }}>
                      <span style={{ color: "var(--primary)", fontWeight: 700, fontFamily: "monospace" }}>
                        {manualCalories !== null ? `${manualCalories} kcal` : "Custom kcal"}
                      </span>
                      {" • "}
                      <span>{itemQuantity} {itemUnit}</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>
                    Select a dish card above or enter custom item
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  type="button"
                  className="stitch-card-btn"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: "0 16px", height: 42, fontSize: 13, justifyContent: "center" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={addLoading || !customItemName.trim()}
                  onClick={() => handleSaveItem()}
                  className="add-button"
                  style={{ height: 42, padding: "0 22px", fontSize: 13, fontWeight: 700, justifyContent: "center" }}
                >
                  {addLoading
                    ? "Saving..."
                    : `✓ Confirm & Add to ${MEAL_SLOTS.find((s) => s.id === activeSlot)?.title}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* EDIT PORTION MODAL                                             */}
      {/* ============================================================== */}
      {editingItem && (
        <div className="modal-backdrop" onClick={() => setEditingItem(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setEditingItem(null)}
              aria-label="Close modal"
            >
              ×
            </button>
            <span className="section-kicker">ADJUST PORTION</span>
            <h2>{editingItem.name}</h2>

            {editError && (
              <div className="stitch-alert stitch-alert-error my-3" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div>{editError}</div>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="auth-form" style={{ marginTop: 14 }}>
              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="edit-qty">Serving Quantity</label>
                  <input
                    id="edit-qty"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    className="form-input"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(parseFloat(e.target.value) || 1)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-unit">Unit</label>
                  <select
                    id="edit-unit"
                    className="form-select"
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

              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button
                  type="button"
                  className="stitch-card-btn"
                  onClick={() => setEditingItem(null)}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="add-button"
                  style={{ flex: 2, justifyContent: "center" }}
                >
                  {editLoading ? "Updating..." : "✓ Update Portion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
