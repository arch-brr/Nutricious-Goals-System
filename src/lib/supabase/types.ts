export type Profile = {
  id: string;
  display_name: string | null;
  role: "user" | "admin";
  timezone: string;
  created_at: string;
  updated_at: string;
};

export type Food = {
  id: string;
  user_id: string | null;
  name: string;
  brand: string | null;
  serving_size: number;
  serving_unit: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  source: string;
  source_id: string | null;
  source_attribution: string | null;
  is_custom: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type MealPlan = {
  id: string;
  user_id: string;
  plan_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack" | "other";

export type MealPlanItem = {
  id: string;
  meal_plan_id: string;
  user_id: string;
  food_id: string | null;
  name: string;
  slot: MealSlot;
  quantity: number;
  unit: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type ConsumptionLog = {
  id: string;
  user_id: string;
  log_date: string;
  consumed_at: string;
  slot: MealSlot;
  food_id: string | null;
  food_name: string;
  quantity: number;
  unit: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  meal_plan_item_id: string | null;
  created_at: string;
  updated_at: string;
};
