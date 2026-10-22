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
import { searchExternalFoodsAction } from "@/app/actions/food-api";
import { type ApiFoodItem } from "@/lib/nutrition/food-api";
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
    zap: (
      <>
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
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

function getDefaultMealSlot(): "breakfast" | "lunch" | "dinner" | "snack" | "other" {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return "breakfast";
  if (h >= 11 && h < 15) return "lunch";
  if (h >= 15 && h < 18) return "snack";
  return "dinner";
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

  // Quick Log Modal State & Handlers
  const [quickItemName, setQuickItemName] = useState("");
  const [quickSlot, setQuickSlot] = useState<"breakfast" | "lunch" | "dinner" | "snack" | "other">("breakfast");
  const [quickMode, setQuickMode] = useState<"consumed" | "planned">("consumed");
  const [quickTab, setQuickTab] = useState<"recommendations" | "library" | "api" | "custom">("recommendations");
  const [quickFoodId, setQuickFoodId] = useState("");
  const [selectedQuickRecId, setSelectedQuickRecId] = useState<string | null>(null);
  const [quickPortionMultiplier, setQuickPortionMultiplier] = useState<number>(1);
  const [quickBaseServingSize, setQuickBaseServingSize] = useState<number>(1);
  const [quickBaseServingUnit, setQuickBaseServingUnit] = useState<string>("serving");
  const [quickBaseNutrients, setQuickBaseNutrients] = useState<{
    calories?: number | null;
    protein?: number | null;
    carbs?: number | null;
    fat?: number | null;
    fiber?: number | null;
  }>({});
  const [quickManualNutrients, setQuickManualNutrients] = useState<{
    calories?: number | null;
    protein?: number | null;
    carbs?: number | null;
    fat?: number | null;
    fiber?: number | null;
    quantity?: number;
    unit?: string;
  }>({ quantity: 1, unit: "serving" });
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [quickErrorMsg, setQuickErrorMsg] = useState<string | null>(null);

  // Live Food API search in quick modal
  const [quickApiQuery, setQuickApiQuery] = useState("");
  const [quickApiLoading, setQuickApiLoading] = useState(false);
  const [quickApiResults, setQuickApiResults] = useState<ApiFoodItem[]>([]);
  const [quickApiError, setQuickApiError] = useState<string | null>(null);

  // Food library search in quick modal
  const [quickLibSearch, setQuickLibSearch] = useState("");

  const openQuickAddModal = (initialSlot?: "breakfast" | "lunch" | "dinner" | "snack" | "other") => {
    const slot = initialSlot || getDefaultMealSlot();
    setQuickSlot(slot);
    setQuickMode("consumed");
    setQuickTab("recommendations");
    setQuickItemName("");
    setQuickFoodId("");
    setSelectedQuickRecId(null);
    setQuickPortionMultiplier(1);
    setQuickBaseServingSize(1);
    setQuickBaseServingUnit("serving");
    setQuickBaseNutrients({});
    setQuickManualNutrients({ quantity: 1, unit: "serving" });
    setQuickErrorMsg(null);
    setQuickApiResults([]);
    setQuickApiQuery("");
    setShowQuickAdd(true);
  };

  const selectQuickRecommendation = (rec: RecommendedFood) => {
    setSelectedQuickRecId(rec.id);
    setQuickFoodId("");
    setQuickItemName(rec.name);
    setQuickSlot(rec.slot);
    setQuickBaseServingSize(rec.servingSize);
    setQuickBaseServingUnit(rec.servingUnit);
    setQuickPortionMultiplier(1);
    setQuickBaseNutrients({
      calories: rec.calories,
      protein: rec.protein,
      carbs: rec.carbs,
      fat: rec.fat,
      fiber: rec.fiber,
    });
  };

  const selectQuickLibraryFood = (food: Food) => {
    setQuickFoodId(food.id);
    setSelectedQuickRecId(null);
    setQuickItemName(food.name);
    setQuickBaseServingSize(food.serving_size);
    setQuickBaseServingUnit(food.serving_unit);
    setQuickPortionMultiplier(1);
    setQuickBaseNutrients({
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fiber: food.fiber,
    });
  };

  const selectQuickApiFood = (item: ApiFoodItem) => {
    setQuickFoodId("");
    setSelectedQuickRecId(null);
    setQuickItemName(item.name);
    setQuickBaseServingSize(item.servingSize);
    setQuickBaseServingUnit(item.servingUnit);
    setQuickPortionMultiplier(1);
    setQuickBaseNutrients({
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      fiber: item.fiber,
    });
  };

  const handleQuickSearchApi = async (queryToSearch?: string) => {
    const q = (queryToSearch ?? quickApiQuery).trim();
    if (!q) return;
    setQuickApiLoading(true);
    setQuickApiError(null);
    try {
      const res = await searchExternalFoodsAction(q, "all");
      if (res.success && res.data) {
        setQuickApiResults(res.data.items);
        if (res.data.items.length === 0) {
          setQuickApiError(`No verified items found for "${q}". Try another term.`);
        }
      } else {
        setQuickApiError(res.error || "Failed to search external food catalog.");
      }
    } catch (err: any) {
      setQuickApiError(err?.message || "Catalog search error.");
    } finally {
      setQuickApiLoading(false);
    }
  };

  const handleDirectQuickLog = async (params: {
    name: string;
    slot: "breakfast" | "lunch" | "dinner" | "snack" | "other";
    foodId?: string | null;
    quantity: number;
    unit: string;
    calories?: number | null;
    protein?: number | null;
    carbs?: number | null;
    fat?: number | null;
    fiber?: number | null;
  }) => {
    setQuickAddLoading(true);
    setQuickErrorMsg(null);
    try {
      const planRes = await addMealPlanItem({
        dateStr: todayDateStr,
        slot: params.slot,
        name: params.name,
        foodId: params.foodId || null,
        quantity: params.quantity,
        unit: params.unit,
        calories: params.calories ?? null,
        protein: params.protein ?? null,
        carbs: params.carbs ?? null,
        fat: params.fat ?? null,
        fiber: params.fiber ?? null,
      });

      if (planRes.success && planRes.data) {
        if (quickMode === "consumed") {
          const logRes = await logPlannedItemAsConsumed(planRes.data.id, todayDateStr);
          if (logRes.success && logRes.data) {
            setTodayLogs((prev) => [...prev, logRes.data!]);
          }
        }
        setTodayPlanItems((prev) => [...prev, planRes.data!]);
        setShowQuickAdd(false);
        reloadData();
      } else {
        setQuickErrorMsg(planRes.error || "Failed to log meal.");
      }
    } catch (err: any) {
      setQuickErrorMsg(err?.message || "Failed to log meal.");
    } finally {
      setQuickAddLoading(false);
    }
  };

  const handleQuickAddSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickItemName.trim()) {
      setQuickErrorMsg("Please choose or enter a meal name.");
      return;
    }
    setQuickAddLoading(true);
    setQuickErrorMsg(null);

    const isCustom = quickTab === "custom";
    const finalQty = isCustom
      ? (quickManualNutrients.quantity || 1)
      : Math.round(quickBaseServingSize * quickPortionMultiplier * 100) / 100;
    const finalUnit = isCustom
      ? (quickManualNutrients.unit || "serving")
      : quickBaseServingUnit;

    const finalCal = isCustom
      ? quickManualNutrients.calories
      : (quickBaseNutrients.calories !== null && quickBaseNutrients.calories !== undefined
          ? Math.round(quickBaseNutrients.calories * quickPortionMultiplier)
          : null);
    const finalProt = isCustom
      ? quickManualNutrients.protein
      : (quickBaseNutrients.protein !== null && quickBaseNutrients.protein !== undefined
          ? Math.round(quickBaseNutrients.protein * quickPortionMultiplier * 10) / 10
          : null);
    const finalCarbs = isCustom
      ? quickManualNutrients.carbs
      : (quickBaseNutrients.carbs !== null && quickBaseNutrients.carbs !== undefined
          ? Math.round(quickBaseNutrients.carbs * quickPortionMultiplier * 10) / 10
          : null);
    const finalFat = isCustom
      ? quickManualNutrients.fat
      : (quickBaseNutrients.fat !== null && quickBaseNutrients.fat !== undefined
          ? Math.round(quickBaseNutrients.fat * quickPortionMultiplier * 10) / 10
          : null);
    const finalFiber = isCustom
      ? quickManualNutrients.fiber
      : (quickBaseNutrients.fiber !== null && quickBaseNutrients.fiber !== undefined
          ? Math.round(quickBaseNutrients.fiber * quickPortionMultiplier * 10) / 10
          : null);

    try {
      const planRes = await addMealPlanItem({
        dateStr: todayDateStr,
        slot: quickSlot,
        name: quickItemName.trim(),
        foodId: quickFoodId || null,
        quantity: finalQty,
        unit: finalUnit,
        calories: finalCal ?? null,
        protein: finalProt ?? null,
        carbs: finalCarbs ?? null,
        fat: finalFat ?? null,
        fiber: finalFiber ?? null,
      });

      if (planRes.success && planRes.data) {
        if (quickMode === "consumed") {
          const logRes = await logPlannedItemAsConsumed(planRes.data.id, todayDateStr);
          if (logRes.success && logRes.data) {
            setTodayLogs((prev) => [...prev, logRes.data!]);
          }
        }
        setTodayPlanItems((prev) => [...prev, planRes.data!]);
        setShowQuickAdd(false);
        reloadData();
      } else {
        setQuickErrorMsg(planRes.error || "Failed to log meal.");
      }
    } catch (err: any) {
      setQuickErrorMsg(err?.message || "Failed to log meal.");
    } finally {
      setQuickAddLoading(false);
    }
  };

  const slotRecommendations = useMemo(() => {
    return getRecommendedFoods(userCountry, userDietaryPreference, quickSlot);
  }, [userCountry, userDietaryPreference, quickSlot]);

  const filteredLibraryFoods = useMemo(() => {
    if (!quickLibSearch.trim()) return customFoods;
    const q = quickLibSearch.toLowerCase();
    return customFoods.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.brand && f.brand.toLowerCase().includes(q))
    );
  }, [customFoods, quickLibSearch]);

  const activeCalories = quickTab === "custom"
    ? (quickManualNutrients.calories || 0)
    : (quickBaseNutrients.calories !== null && quickBaseNutrients.calories !== undefined
        ? Math.round(quickBaseNutrients.calories * quickPortionMultiplier)
        : null);
  const activeProtein = quickTab === "custom"
    ? (quickManualNutrients.protein || 0)
    : (quickBaseNutrients.protein !== null && quickBaseNutrients.protein !== undefined
        ? Math.round(quickBaseNutrients.protein * quickPortionMultiplier * 10) / 10
        : null);
  const activeCarbs = quickTab === "custom"
    ? (quickManualNutrients.carbs || 0)
    : (quickBaseNutrients.carbs !== null && quickBaseNutrients.carbs !== undefined
        ? Math.round(quickBaseNutrients.carbs * quickPortionMultiplier * 10) / 10
        : null);
  const activeFat = quickTab === "custom"
    ? (quickManualNutrients.fat || 0)
    : (quickBaseNutrients.fat !== null && quickBaseNutrients.fat !== undefined
        ? Math.round(quickBaseNutrients.fat * quickPortionMultiplier * 10) / 10
        : null);
  const activeFiber = quickTab === "custom"
    ? (quickManualNutrients.fiber || 0)
    : (quickBaseNutrients.fiber !== null && quickBaseNutrients.fiber !== undefined
        ? Math.round(quickBaseNutrients.fiber * quickPortionMultiplier * 10) / 10
        : null);

  const newProjectedCalories = consumedCalories + (activeCalories || 0);
  const newCaloriePercentage = calorieGoal > 0 ? Math.min(100, Math.round((newProjectedCalories / calorieGoal) * 100)) : 0;

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
              className="stitch-action-btn"
              onClick={() => openQuickAddModal()}
              aria-label="Quick Log Meal"
            >
              <Icon name="zap" size={15} />
              <span>Quick Log</span>
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
              <button
                type="button"
                className="stitch-action-btn w-full mb-3 justify-center"
                style={{ height: 42, borderRadius: 12 }}
                onClick={() => {
                  setMobileMenuOpen(false);
                  openQuickAddModal();
                }}
              >
                <Icon name="zap" size={16} />
                <span>+ Quick Log Meal</span>
              </button>
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
                          className="track-circle"
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="var(--surface-container-highest)"
                          strokeWidth="8"
                        />
                        <circle
                          className="progress-circle"
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
                      className="stitch-action-btn"
                      onClick={() => openQuickAddModal()}
                      aria-label="Quick Log Meal"
                    >
                      <Icon name="zap" size={14} />
                      <span>+ Quick Log</span>
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
                                    className="stitch-food-thumb-mini"
                                    style={{
                                      width: 22,
                                      height: 22,
                                      minWidth: 22,
                                      minHeight: 22,
                                      maxWidth: 22,
                                      maxHeight: 22,
                                      borderRadius: 6,
                                      objectFit: "cover",
                                      flexShrink: 0,
                                      display: "inline-block",
                                    }}
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
                          <div style={{ fontSize: 11, color: "var(--on-surface)", fontWeight: 600, textAlign: "center", paddingTop: 4 }}>
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
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, padding: "6px 10px", borderRadius: 10, backgroundColor: "var(--surface-container-low)", border: "1px solid var(--border-subtle)" }}>
                          <span style={{ color: "var(--on-surface-variant)", fontWeight: 600 }}>Today&apos;s Total:</span>
                          <span style={{ fontFamily: "var(--font-mono, monospace)", fontWeight: 800, color: "var(--secondary)" }}>
                            {consumedCalories.toLocaleString()} kcal
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {customFoods.slice(0, 3).map((f) => (
                            <span
                              key={f.id}
                              className="stitch-card-quick-tag"
                              onClick={() => {
                                selectQuickLibraryFood(f);
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
                      onClick={() => openQuickAddModal()}
                    >
                      <Icon name="zap" size={15} />
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
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                            <span className="font-extrabold text-2xl text-on-surface font-mono" style={{ fontSize: 24, fontWeight: 800, color: "var(--on-surface)", fontFamily: "var(--font-mono, monospace)" }}>
                              {consumedCalories.toLocaleString()}
                            </span>
                            <span style={{ fontSize: 12, color: "var(--on-surface-variant)", fontFamily: "var(--font-mono, monospace)" }}>
                              / {calorieGoal.toLocaleString()} kcal
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: 9999,
                              backgroundColor: consumedCalories <= calorieGoal ? "rgba(0,82,60,0.12)" : "rgba(239,68,68,0.12)",
                              color: consumedCalories <= calorieGoal ? "var(--primary)" : "var(--error)",
                            }}
                          >
                            {consumedCalories <= calorieGoal ? "On Baseline" : "Surplus"}
                          </span>
                        </div>

                        {/* Progress Bar with vibrant gradient */}
                        <div style={{ width: "100%", height: 8, borderRadius: 9999, backgroundColor: "var(--surface-container-high)", overflow: "hidden", marginTop: 8 }}>
                          <div
                            style={{
                              height: "100%",
                              borderRadius: 9999,
                              width: `${caloriePercentage}%`,
                              background: "linear-gradient(90deg, #f59e0b, #ea580c)",
                              transition: "width 0.5s ease",
                            }}
                          />
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "var(--on-surface-variant)", marginTop: 8, fontFamily: "var(--font-mono, monospace)" }}>
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
                      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 4 }}>
                        {/* Protein */}
                        <div className="stitch-macro-row">
                          <div className="stitch-macro-header">
                            <span className="stitch-macro-name">
                              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--primary)", flexShrink: 0 }} />
                              Protein
                            </span>
                            <span className="stitch-macro-values">
                              {protein}g <span className="goal">/ 120g</span>
                            </span>
                          </div>
                          <div className="stitch-macro-meter">
                            <div
                              className="stitch-macro-fill"
                              style={{
                                width: `${Math.min(100, (protein / 120) * 100)}%`,
                                background: "linear-gradient(90deg, #10b981, #059669)",
                              }}
                            />
                          </div>
                        </div>

                        {/* Carbs */}
                        <div className="stitch-macro-row">
                          <div className="stitch-macro-header">
                            <span className="stitch-macro-name">
                              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#f59e0b", flexShrink: 0 }} />
                              Carbohydrates
                            </span>
                            <span className="stitch-macro-values">
                              {carbs}g <span className="goal">/ 220g</span>
                            </span>
                          </div>
                          <div className="stitch-macro-meter">
                            <div
                              className="stitch-macro-fill"
                              style={{
                                width: `${Math.min(100, (carbs / 220) * 100)}%`,
                                background: "linear-gradient(90deg, #fbbf24, #f59e0b)",
                              }}
                            />
                          </div>
                        </div>

                        {/* Fats */}
                        <div className="stitch-macro-row">
                          <div className="stitch-macro-header">
                            <span className="stitch-macro-name">
                              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#f43f5e", flexShrink: 0 }} />
                              Fats
                            </span>
                            <span className="stitch-macro-values">
                              {fat}g <span className="goal">/ 70g</span>
                            </span>
                          </div>
                          <div className="stitch-macro-meter">
                            <div
                              className="stitch-macro-fill"
                              style={{
                                width: `${Math.min(100, (fat / 70) * 100)}%`,
                                background: "linear-gradient(90deg, #fb7185, #f43f5e)",
                              }}
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
                      <div className="stitch-week-strip">
                        {weekDays.map((day, i) => {
                          const isToday = i === currentDayIndex;
                          const hasLog = isToday && todayLogs.length > 0;
                          return (
                            <div
                              key={day}
                              className={`stitch-week-day-col ${isToday ? "is-today" : ""} ${hasLog ? "has-log" : ""}`}
                            >
                              <span className="stitch-week-day-label">
                                {day.slice(0, 3)}
                              </span>
                              <div className="stitch-week-day-pill">
                                {hasLog ? "✓" : i + 1}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--on-surface-variant)", textAlign: "center", marginTop: 8 }}>
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
                              className="stitch-card-mini-item"
                              style={{ cursor: "pointer", width: "100%", boxSizing: "border-box" }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
                                <input
                                  type="checkbox"
                                  checked={isLogged}
                                  style={{ width: 15, height: 15, accentColor: "var(--primary)", flexShrink: 0, cursor: "pointer" }}
                                  onChange={() => handleToggleLog(item)}
                                />
                                {getFoodImage(item.name, item.slot) ? (
                                  <img
                                    src={getFoodImage(item.name, item.slot)!}
                                    alt={item.name}
                                    className="stitch-food-thumb-mini"
                                    style={{
                                      width: 22,
                                      height: 22,
                                      minWidth: 22,
                                      minHeight: 22,
                                      maxWidth: 22,
                                      maxHeight: 22,
                                      borderRadius: 6,
                                      objectFit: "cover",
                                      flexShrink: 0,
                                      display: "inline-block",
                                    }}
                                    loading="lazy"
                                  />
                                ) : (
                                  <span style={{ fontSize: 13, flexShrink: 0 }}>{getFoodEmoji(item.name, item.slot)}</span>
                                )}
                                <span
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: isLogged ? "var(--on-surface-variant)" : "var(--on-surface)",
                                    textDecoration: isLogged ? "line-through" : "none",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {item.name}
                                </span>
                              </div>
                              <span
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  fontFamily: "var(--font-mono, monospace)",
                                  color: "var(--on-surface-variant)",
                                  background: "var(--surface-container-high)",
                                  padding: "2px 6px",
                                  borderRadius: 6,
                                  flexShrink: 0,
                                  marginLeft: 6,
                                  whiteSpace: "nowrap",
                                }}
                              >
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
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 6 }}>
                        <div style={{ padding: "10px 12px", borderRadius: 12, backgroundColor: "var(--surface-container-low)", border: "1px solid var(--border-subtle)" }}>
                          <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--on-surface-variant)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block" }}>
                            DIETARY FIBER
                          </span>
                          <p style={{ fontSize: 16, fontWeight: 800, color: "var(--on-surface)", fontFamily: "var(--font-mono, monospace)", margin: "4px 0" }}>
                            {formatNutrient(fiber, "g")}
                          </p>
                          <div style={{ width: "100%", height: 5, borderRadius: 9999, backgroundColor: "var(--surface-container-high)", overflow: "hidden", margin: "6px 0" }}>
                            <div
                              style={{
                                width: `${Math.min(100, Math.round((fiber / 28) * 100))}%`,
                                height: "100%",
                                borderRadius: 9999,
                                background: "linear-gradient(90deg, #f59e0b, #d97706)",
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 10, color: "#d97706", fontWeight: 700 }}>
                            {Math.round((fiber / 28) * 100)}% of 28g RDI
                          </span>
                        </div>

                        <div style={{ padding: "10px 12px", borderRadius: 12, backgroundColor: "var(--surface-container-low)", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                          <div>
                            <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--on-surface-variant)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block" }}>
                              TOTAL DENSITY
                            </span>
                            <p style={{ fontSize: 16, fontWeight: 800, color: "var(--on-surface)", fontFamily: "var(--font-mono, monospace)", margin: "4px 0" }}>
                              {totalMacros}g
                            </p>
                          </div>
                          <span style={{ fontSize: 9.5, color: "var(--on-surface-variant)", fontFamily: "var(--font-mono, monospace)", fontWeight: 600 }}>
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
                            className={`stitch-bmi-badge ${
                              bmiCategory.label.toLowerCase().includes("under")
                                ? "underweight"
                                : bmiCategory.label.toLowerCase().includes("normal")
                                ? "normal"
                                : bmiCategory.label.toLowerCase().includes("over")
                                ? "overweight"
                                : "obesity"
                            }`}
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
                      <div style={{ backgroundColor: "var(--surface-container-low)", padding: "10px 12px", borderRadius: 14, border: "1px solid var(--border-subtle)", marginTop: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, fontSize: 12 }}>
                          <span style={{ color: "var(--on-surface)", fontWeight: 600 }}>💧 Fluid Intake</span>
                          <span style={{ fontWeight: 800, color: "#0284c7", fontFamily: "var(--font-mono, monospace)" }}>
                            {(waterGlasses * 0.25).toFixed(1)}L{" "}
                            <span style={{ fontWeight: 400, color: "var(--on-surface-variant)", fontSize: 10.5 }}>
                              / 2.0L ({waterGlasses}/8)
                            </span>
                          </span>
                        </div>
                        <div style={{ width: "100%", height: 7, borderRadius: 9999, backgroundColor: "var(--surface-container)", overflow: "hidden" }}>
                          <div
                            style={{
                              height: "100%",
                              borderRadius: 9999,
                              backgroundColor: "#0284c7",
                              width: `${Math.min(100, (waterGlasses / 8) * 100)}%`,
                              transition: "width 0.4s ease",
                            }}
                          />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                          <button
                            type="button"
                            className="stitch-water-quick-btn"
                            onClick={() => setWaterGlasses((prev) => Math.min(8, prev + 1))}
                            title="Add 1 glass of water"
                          >
                            +250ml
                          </button>
                          <button
                            type="button"
                            className="stitch-water-quick-btn"
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
                                  <div
                                    className="stitch-timeline-emoji"
                                    style={{
                                      overflow: "hidden",
                                      position: "relative",
                                      width: 38,
                                      height: 38,
                                      minWidth: 38,
                                      minHeight: 38,
                                      maxWidth: 38,
                                      maxHeight: 38,
                                      flexShrink: 0,
                                    }}
                                  >
                                    {foodImg ? (
                                      <img
                                        src={foodImg}
                                        alt={item.name}
                                        className="stitch-timeline-food-img"
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          maxWidth: 38,
                                          maxHeight: 38,
                                          borderRadius: 10,
                                          objectFit: "cover",
                                          display: "block",
                                        }}
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

      {/* QUICK ADD / QUICK LOG MODAL */}
      {showQuickAdd && (
        <div className="modal-backdrop" onClick={() => setShowQuickAdd(false)}>
          <div
            className="modal quick-log-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-log-title"
          >
            {/* Modal Header */}
            <div className="quick-log-header">
              <div>
                <div className="quick-log-badge-row">
                  <span className="quick-log-kicker">
                    <Icon name="zap" size={12} />
                    <span>Quick Add &amp; Log</span>
                  </span>
                  {userCountryObj && (
                    <span className="text-xs text-muted">
                      {userCountryObj.flag} {userCountryObj.label.split(" ")[0]}
                    </span>
                  )}
                </div>
                <h2 id="quick-log-title" className="quick-log-title">
                  {quickMode === "consumed" ? "Quick Log Meal (Consumed)" : "Add Meal to Today's Plan"}
                </h2>
                <p className="quick-log-subtitle">
                  {quickMode === "consumed"
                    ? "Instantly record what you ate to advance your calorie gauge & macro counts."
                    : "Add to today's meal schedule to organize your nutrition balance."}
                </p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowQuickAdd(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            {/* Mode Switcher: Eaten Now vs Plan for Later */}
            <div className="quick-log-mode-bar" role="tablist" aria-label="Logging Mode">
              <button
                type="button"
                className={`quick-log-mode-btn ${quickMode === "consumed" ? "active" : ""}`}
                onClick={() => setQuickMode("consumed")}
              >
                <Icon name="zap" size={14} />
                <span>⚡ Eaten Now (Log Consumed)</span>
              </button>
              <button
                type="button"
                className={`quick-log-mode-btn ${quickMode === "planned" ? "active" : ""}`}
                onClick={() => setQuickMode("planned")}
              >
                <Icon name="calendar" size={14} />
                <span>📅 Plan for Later</span>
              </button>
            </div>

            {/* Meal Slot Pills */}
            <div className="quick-log-slots-row" role="radiogroup" aria-label="Select Meal Slot">
              {[
                { id: "breakfast", label: "🍳 Breakfast" },
                { id: "lunch", label: "🥗 Lunch" },
                { id: "dinner", label: "🍽️ Dinner" },
                { id: "snack", label: "🍎 Snack" },
                { id: "other", label: "✨ Other" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`quick-log-slot-btn ${quickSlot === s.id ? "active" : ""}`}
                  onClick={() => setQuickSlot(s.id as any)}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Source Tabs */}
            <div className="quick-log-tabs-bar" role="tablist">
              <button
                type="button"
                className={`quick-log-tab-btn ${quickTab === "recommendations" ? "active" : ""}`}
                onClick={() => setQuickTab("recommendations")}
              >
                🌱 Recommended ({slotRecommendations.length})
              </button>
              <button
                type="button"
                className={`quick-log-tab-btn ${quickTab === "library" ? "active" : ""}`}
                onClick={() => setQuickTab("library")}
              >
                📚 Food Library ({customFoods.length})
              </button>
              <button
                type="button"
                className={`quick-log-tab-btn ${quickTab === "api" ? "active" : ""}`}
                onClick={() => setQuickTab("api")}
              >
                🌐 USDA &amp; Open Food Facts
              </button>
              <button
                type="button"
                className={`quick-log-tab-btn ${quickTab === "custom" ? "active" : ""}`}
                onClick={() => {
                  setQuickTab("custom");
                  setSelectedQuickRecId(null);
                  setQuickFoodId("");
                }}
              >
                ✍️ Custom Entry
              </button>
            </div>

            {/* Form & Scrollable Body */}
            <form
              onSubmit={handleQuickAddSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  paddingRight: 4,
                  margin: "4px 0 10px",
                }}
                className="custom-scroll"
              >
                {/* TAB 1: RECOMMENDATIONS */}
                {quickTab === "recommendations" && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
                      <span style={{ fontWeight: 700, color: "var(--on-surface)" }}>
                        Hand-picked for {quickSlot.toUpperCase()}:
                      </span>
                      <span style={{ fontSize: 11, color: "var(--on-surface-variant)" }}>
                        Click card to calibrate or tap <strong>+ Log</strong>
                      </span>
                    </div>

                    <div className="quick-log-card-grid">
                      {slotRecommendations.map((rec) => {
                        const isSelected = selectedQuickRecId === rec.id || quickItemName === rec.name;
                        const foodImg = getFoodImage(rec.name, rec.slot);
                        return (
                          <div
                            key={rec.id}
                            className={`quick-log-card ${isSelected ? "selected" : ""}`}
                            onClick={() => selectQuickRecommendation(rec)}
                          >
                            {foodImg ? (
                              <img
                                src={foodImg}
                                alt={rec.name}
                                className="quick-log-card-thumb"
                                loading="lazy"
                              />
                            ) : (
                              <div className="quick-log-card-emoji">{rec.emoji}</div>
                            )}

                            <div className="quick-log-card-info">
                              <div className="quick-log-card-title-row">
                                <span className="quick-log-card-name" title={rec.name}>
                                  {rec.name}
                                </span>
                                {isSelected && (
                                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", marginLeft: 4, flexShrink: 0 }}>
                                    ✓ Selected
                                  </span>
                                )}
                              </div>
                              <div className="quick-log-card-portion">{rec.portionDesc}</div>
                              <div className="quick-log-card-macros">
                                <span className="quick-log-macro-cal">{rec.calories} kcal</span>
                                <span className="text-muted">•</span>
                                <span className="quick-log-macro-item">{rec.protein}g P</span>
                                <span className="text-muted">•</span>
                                <span className="quick-log-macro-item">{rec.carbs}g C</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={quickAddLoading}
                              onClick={async (e) => {
                                e.stopPropagation();
                                await handleDirectQuickLog({
                                  name: rec.name,
                                  slot: quickSlot,
                                  quantity: rec.servingSize,
                                  unit: rec.servingUnit,
                                  calories: rec.calories,
                                  protein: rec.protein,
                                  carbs: rec.carbs,
                                  fat: rec.fat,
                                  fiber: rec.fiber,
                                });
                              }}
                              className="quick-log-1tap-btn"
                              title="Instant 1-tap log"
                            >
                              <Icon name="zap" size={11} />
                              <span>+ Log</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 2: PERSONAL LIBRARY */}
                {quickTab === "library" && (
                  <div>
                    <div style={{ marginBottom: 10 }}>
                      <input
                        type="search"
                        className="form-input text-xs"
                        placeholder="🔍 Search your food library..."
                        value={quickLibSearch}
                        onChange={(e) => setQuickLibSearch(e.target.value)}
                      />
                    </div>

                    {filteredLibraryFoods.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-[var(--surface-container-low)] text-center text-xs text-muted">
                        {customFoods.length === 0
                          ? "You haven't saved any foods in your Food Library yet. Create foods in the Food Library tab for instant access!"
                          : "No saved foods match your search filter."}
                      </div>
                    ) : (
                      <div className="quick-log-card-grid">
                        {filteredLibraryFoods.map((f) => {
                          const isSelected = quickFoodId === f.id || quickItemName === f.name;
                          const foodImg = getFoodImage(f.name, quickSlot);
                          return (
                            <div
                              key={f.id}
                              className={`quick-log-card ${isSelected ? "selected" : ""}`}
                              onClick={() => selectQuickLibraryFood(f)}
                            >
                              {foodImg ? (
                                <img
                                  src={foodImg}
                                  alt={f.name}
                                  className="quick-log-card-thumb"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="quick-log-card-emoji">{getFoodEmoji(f.name)}</div>
                              )}

                              <div className="quick-log-card-info">
                                <div className="quick-log-card-title-row">
                                  <span className="quick-log-card-name" title={f.name}>
                                    {f.name}
                                  </span>
                                  {isSelected && (
                                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", marginLeft: 4, flexShrink: 0 }}>
                                      ✓
                                    </span>
                                  )}
                                </div>
                                <div className="quick-log-card-portion">
                                  {f.brand ? `${f.brand} • ` : ""}{f.serving_size} {f.serving_unit}
                                </div>
                                <div className="quick-log-card-macros">
                                  <span className="quick-log-macro-cal">{f.calories ?? 0} kcal</span>
                                  <span className="text-muted">•</span>
                                  <span className="quick-log-macro-item">{f.protein ?? 0}g P</span>
                                  <span className="text-muted">•</span>
                                  <span className="quick-log-macro-item">{f.carbs ?? 0}g C</span>
                                </div>
                              </div>

                              <button
                                type="button"
                                disabled={quickAddLoading}
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await handleDirectQuickLog({
                                    name: f.name,
                                    slot: quickSlot,
                                    foodId: f.id,
                                    quantity: f.serving_size,
                                    unit: f.serving_unit,
                                    calories: f.calories,
                                    protein: f.protein,
                                    carbs: f.carbs,
                                    fat: f.fat,
                                    fiber: f.fiber,
                                  });
                                }}
                                className="quick-log-1tap-btn"
                                title="Instant 1-tap log"
                              >
                                <Icon name="zap" size={11} />
                                <span>+ Log</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: LIVE EXTERNAL API CATALOG */}
                {quickTab === "api" && (
                  <div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                      <input
                        type="search"
                        className="form-input text-xs"
                        style={{ flex: 1 }}
                        placeholder="Search USDA FoodData &amp; Open Food Facts..."
                        value={quickApiQuery}
                        onChange={(e) => setQuickApiQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleQuickSearchApi();
                          }
                        }}
                      />
                      <button
                        type="button"
                        disabled={quickApiLoading || !quickApiQuery.trim()}
                        onClick={() => handleQuickSearchApi()}
                        className="quick-log-1tap-btn"
                        style={{ padding: "0 14px", height: 38 }}
                      >
                        {quickApiLoading ? "Searching..." : "Search"}
                      </button>
                    </div>

                    {quickApiError && (
                      <div className="p-3 mb-3 rounded-xl bg-[var(--surface-container-low)] text-xs text-[var(--error,#ef4444)] border border-[var(--border-subtle)]">
                        {quickApiError}
                      </div>
                    )}

                    {quickApiResults.length > 0 && (
                      <div className="quick-log-card-grid">
                        {quickApiResults.map((item, idx) => {
                          const isSelected = quickItemName === item.name;
                          const foodImg = getFoodImage(item.name, quickSlot);
                          return (
                            <div
                              key={`${item.id || idx}`}
                              className={`quick-log-card ${isSelected ? "selected" : ""}`}
                              onClick={() => selectQuickApiFood(item)}
                            >
                              {foodImg ? (
                                <img
                                  src={foodImg}
                                  alt={item.name}
                                  className="quick-log-card-thumb"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="quick-log-card-emoji">{getFoodEmoji(item.name)}</div>
                              )}

                              <div className="quick-log-card-info">
                                <div className="quick-log-card-title-row">
                                  <span className="quick-log-card-name" title={item.name}>
                                    {item.name}
                                  </span>
                                  {isSelected && (
                                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", marginLeft: 4, flexShrink: 0 }}>
                                      ✓
                                    </span>
                                  )}
                                </div>
                                <div className="quick-log-card-portion">
                                  {item.source.toUpperCase()} {item.brand ? `• ${item.brand}` : ""} • {item.servingSize} {item.servingUnit}
                                </div>
                                <div className="quick-log-card-macros">
                                  <span className="quick-log-macro-cal">{item.calories ?? 0} kcal</span>
                                  <span className="text-muted">•</span>
                                  <span className="quick-log-macro-item">{item.protein ?? 0}g P</span>
                                  <span className="text-muted">•</span>
                                  <span className="quick-log-macro-item">{item.carbs ?? 0}g C</span>
                                </div>
                              </div>

                              <button
                                type="button"
                                disabled={quickAddLoading}
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await handleDirectQuickLog({
                                    name: item.name,
                                    slot: quickSlot,
                                    quantity: item.servingSize,
                                    unit: item.servingUnit,
                                    calories: item.calories,
                                    protein: item.protein,
                                    carbs: item.carbs,
                                    fat: item.fat,
                                    fiber: item.fiber,
                                  });
                                }}
                                className="quick-log-1tap-btn"
                                title="Instant 1-tap log"
                              >
                                <Icon name="zap" size={11} />
                                <span>+ Log</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {!quickApiLoading && quickApiResults.length === 0 && !quickApiError && (
                      <div className="p-6 rounded-2xl bg-[var(--surface-container-low)] text-center text-xs text-muted">
                        Type any whole food or grocery item (e.g. &quot;Greek yogurt&quot;, &quot;Avocado&quot;, &quot;Oatmeal&quot;) to query live databases.
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: MANUAL / CUSTOM ENTRY */}
                {quickTab === "custom" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label htmlFor="quick-custom-name">Meal or Food Name *</label>
                      <input
                        id="quick-custom-name"
                        required
                        className="form-input"
                        placeholder="e.g. Homemade Green Smoothie"
                        value={quickItemName}
                        onChange={(e) => setQuickItemName(e.target.value)}
                      />
                    </div>

                    <div className="quick-log-form-grid-2">
                      <div className="form-group" style={{ margin: 0 }}>
                        <label htmlFor="quick-qty">Portion Size</label>
                        <input
                          id="quick-qty"
                          type="number"
                          step="any"
                          min="0.1"
                          className="form-input"
                          value={quickManualNutrients.quantity || 1}
                          onChange={(e) =>
                            setQuickManualNutrients((prev) => ({
                              ...prev,
                              quantity: parseFloat(e.target.value) || 1,
                            }))
                          }
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label htmlFor="quick-unit">Serving Unit</label>
                        <input
                          id="quick-unit"
                          className="form-input"
                          placeholder="e.g. bowl, plate, cup"
                          value={quickManualNutrients.unit || "serving"}
                          onChange={(e) =>
                            setQuickManualNutrients((prev) => ({
                              ...prev,
                              unit: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div style={{ padding: "12px 14px", borderRadius: 14, backgroundColor: "var(--surface-container-low)", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--on-surface)" }}>
                        Estimated Nutrition (Optional):
                      </span>
                      <div className="quick-log-form-grid-4">
                        <div>
                          <label style={{ fontSize: 10, color: "var(--on-surface-variant)", display: "block", marginBottom: 3 }}>Calories (kcal)</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            className="form-input text-xs font-mono"
                            value={quickManualNutrients.calories ?? ""}
                            onChange={(e) =>
                              setQuickManualNutrients((prev) => ({
                                ...prev,
                                calories: e.target.value ? parseFloat(e.target.value) : null,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 10, color: "var(--on-surface-variant)", display: "block", marginBottom: 3 }}>Protein (g)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder="0"
                            className="form-input text-xs font-mono"
                            value={quickManualNutrients.protein ?? ""}
                            onChange={(e) =>
                              setQuickManualNutrients((prev) => ({
                                ...prev,
                                protein: e.target.value ? parseFloat(e.target.value) : null,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 10, color: "var(--on-surface-variant)", display: "block", marginBottom: 3 }}>Carbs (g)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder="0"
                            className="form-input text-xs font-mono"
                            value={quickManualNutrients.carbs ?? ""}
                            onChange={(e) =>
                              setQuickManualNutrients((prev) => ({
                                ...prev,
                                carbs: e.target.value ? parseFloat(e.target.value) : null,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 10, color: "var(--on-surface-variant)", display: "block", marginBottom: 3 }}>Fat (g)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder="0"
                            className="form-input text-xs font-mono"
                            value={quickManualNutrients.fat ?? ""}
                            onChange={(e) =>
                              setQuickManualNutrients((prev) => ({
                                ...prev,
                                fat: e.target.value ? parseFloat(e.target.value) : null,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* CALIBRATION TRAY & GOAL IMPACT PREVIEW (When an item is active/selected) */}
                {quickItemName.trim() && (
                  <div className="quick-log-calibration-tray">
                    <div className="quick-log-portion-row">
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--on-surface)", display: "flex", alignItems: "center", gap: 6 }}>
                          <span>Portion Multiplier:</span>
                          <span style={{ fontFamily: "var(--font-mono, monospace)", color: "var(--primary)", fontWeight: 800 }}>
                            {quickPortionMultiplier}x
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--on-surface-variant)" }}>
                          {quickTab === "custom"
                            ? `${quickManualNutrients.quantity || 1} ${quickManualNutrients.unit || "serving"}`
                            : `${Math.round(quickBaseServingSize * quickPortionMultiplier * 100) / 100} ${quickBaseServingUnit}`}
                        </div>
                      </div>

                      {/* Multiplier Chips */}
                      {quickTab !== "custom" && (
                        <div className="quick-log-mult-chips">
                          {[0.5, 1, 1.5, 2].map((m) => (
                            <button
                              key={m}
                              type="button"
                              className={`quick-log-mult-btn ${quickPortionMultiplier === m ? "active" : ""}`}
                              onClick={() => setQuickPortionMultiplier(m)}
                            >
                              {m}x
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Calculated Macro Summary */}
                    <div className="quick-log-macro-summary-pill">
                      <span className="quick-log-macro-cal">
                        {activeCalories !== null ? `${activeCalories} kcal` : "Calories n/a"}
                      </span>
                      {activeProtein !== null && (
                        <span className="quick-log-macro-item" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--primary)", flexShrink: 0 }} />
                          {activeProtein}g Protein
                        </span>
                      )}
                      {activeCarbs !== null && (
                        <span className="quick-log-macro-item" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#f59e0b", flexShrink: 0 }} />
                          {activeCarbs}g Carbs
                        </span>
                      )}
                      {activeFat !== null && (
                        <span className="quick-log-macro-item" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#f43f5e", flexShrink: 0 }} />
                          {activeFat}g Fat
                        </span>
                      )}
                    </div>

                    {/* Daily Goal Impact Meter */}
                    {calorieGoal > 0 && activeCalories !== null && (
                      <div className="quick-log-impact-box">
                        <div className="quick-log-impact-head">
                          <span>Daily Calorie Goal Impact:</span>
                          <span>
                            {consumedCalories} → <strong>{newProjectedCalories} kcal</strong> ({newCaloriePercentage}%)
                          </span>
                        </div>
                        <div className="quick-log-impact-track">
                          <div
                            className="quick-log-impact-fill"
                            style={{ width: `${Math.min(100, newCaloriePercentage)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {quickErrorMsg && (
                  <div className="mt-3 p-3 rounded-xl bg-[var(--surface-container-low)] text-xs text-[var(--error,#ef4444)] border border-[var(--border-subtle)]">
                    {quickErrorMsg}
                  </div>
                )}
              </div>

              {/* Dedicated Sticky Footer */}
              <div className="quick-log-footer">
                <button
                  type="button"
                  className="quick-log-cancel-btn"
                  onClick={() => setShowQuickAdd(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickAddLoading || !quickItemName.trim()}
                  className="quick-log-confirm-btn"
                >
                  {quickAddLoading ? (
                    "Logging..."
                  ) : quickMode === "consumed" ? (
                    `⚡ Confirm & Log Meal${activeCalories !== null ? ` (${activeCalories} kcal)` : ""}`
                  ) : (
                    `📅 Add to Today's Plan${activeCalories !== null ? ` (${activeCalories} kcal)` : ""}`
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
