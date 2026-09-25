"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { MealPlan, MealPlanItem, MealSlot } from "@/lib/supabase/types";
import { scaleAllNutrients } from "@/lib/nutrition/calculator";
import { ActionResponse } from "./foods";

export type MealPlanWithItems = MealPlan & {
  items: MealPlanItem[];
};

export type AddMealPlanItemInput = {
  dateStr: string; // YYYY-MM-DD
  slot: MealSlot;
  name: string;
  foodId?: string | null;
  quantity: number;
  unit: string;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  fiber?: number | null;
};

export type UpdateMealPlanItemInput = {
  id: string;
  name?: string;
  slot?: MealSlot;
  quantity?: number;
  unit?: string;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  fiber?: number | null;
};

function parseNutrient(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const num = Number(val);
  return isNaN(num) ? null : Math.max(0, Math.round(num * 100) / 100);
}

/**
 * Retrieves a user's meal plan and all assigned items for a specific date (YYYY-MM-DD).
 */
export async function getMealPlanForDate(
  dateStr: string
): Promise<ActionResponse<MealPlanWithItems | null>> {
  const supabase = await createClient();
  if (!supabase) {
    return { success: false, error: "Database not configured" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // 1. Fetch meal plan for the given user and date
  const { data: plan, error: planError } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("plan_date", dateStr)
    .maybeSingle();

  if (planError) {
    return { success: false, error: planError.message };
  }

  if (!plan) {
    return { success: true, data: null };
  }

  // 2. Fetch items for this plan
  const { data: items, error: itemsError } = await supabase
    .from("meal_plan_items")
    .select("*")
    .eq("meal_plan_id", plan.id)
    .eq("user_id", user.id)
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: true });

  if (itemsError) {
    return { success: false, error: itemsError.message };
  }

  return {
    success: true,
    data: {
      ...(plan as MealPlan),
      items: (items as MealPlanItem[]) || [],
    },
  };
}

/**
 * Ensures a meal plan record exists for the given date and returns it.
 */
export async function getOrCreateMealPlan(
  dateStr: string
): Promise<ActionResponse<MealPlan>> {
  const supabase = await createClient();
  if (!supabase) {
    return { success: false, error: "Database not configured" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Check existing
  const { data: existing } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("plan_date", dateStr)
    .maybeSingle();

  if (existing) {
    return { success: true, data: existing as MealPlan };
  }

  // Insert new
  const { data: created, error: insertError } = await supabase
    .from("meal_plans")
    .insert({
      user_id: user.id,
      plan_date: dateStr,
    })
    .select()
    .single();

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  return { success: true, data: created as MealPlan };
}

/**
 * Adds an item to a meal plan for a given date and slot.
 * If foodId is provided, scales nutrients if matching unit; preserves unknown values if unprovided.
 */
export async function addMealPlanItem(
  input: AddMealPlanItemInput
): Promise<ActionResponse<MealPlanItem>> {
  const supabase = await createClient();
  if (!supabase) {
    return { success: false, error: "Database not configured" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const name = input.name?.trim();
  if (!name) {
    return { success: false, error: "Item name is required." };
  }

  const quantity = Number(input.quantity);
  if (isNaN(quantity) || quantity <= 0) {
    return { success: false, error: "Quantity must be greater than zero." };
  }

  const unit = input.unit?.trim() || "serving";

  // Ensure parent plan exists
  const planResult = await getOrCreateMealPlan(input.dateStr);
  if (!planResult.success || !planResult.data) {
    return { success: false, error: planResult.error || "Failed to find or create meal plan" };
  }

  const mealPlanId = planResult.data.id;

  let calories: number | null = parseNutrient(input.calories);
  let protein: number | null = parseNutrient(input.protein);
  let carbs: number | null = parseNutrient(input.carbs);
  let fat: number | null = parseNutrient(input.fat);
  let fiber: number | null = parseNutrient(input.fiber);

  // If linking to a food, calculate nutrients using scaling rules
  if (input.foodId) {
    const { data: food } = await supabase
      .from("foods")
      .select("*")
      .eq("id", input.foodId)
      .single();

    if (food) {
      const scaled = scaleAllNutrients(food, quantity, unit);
      // Only override if scaled successfully, otherwise keep input values or null
      if (scaled.calories.calculated) calories = scaled.calories.value;
      if (scaled.protein.calculated) protein = scaled.protein.value;
      if (scaled.carbs.calculated) carbs = scaled.carbs.value;
      if (scaled.fat.calculated) fat = scaled.fat.value;
      if (scaled.fiber.calculated) fiber = scaled.fiber.value;
    }
  }

  const itemPayload = {
    meal_plan_id: mealPlanId,
    user_id: user.id,
    food_id: input.foodId || null,
    name,
    slot: input.slot,
    quantity,
    unit,
    calories,
    protein,
    carbs,
    fat,
    fiber,
    order_index: 0,
  };

  const { data: item, error: itemError } = await supabase
    .from("meal_plan_items")
    .insert(itemPayload)
    .select()
    .single();

  if (itemError) {
    return { success: false, error: itemError.message };
  }

  revalidatePath("/", "layout");
  return { success: true, data: item as MealPlanItem };
}

/**
 * Updates an existing meal plan item. Enforces user ownership.
 */
export async function updateMealPlanItem(
  input: UpdateMealPlanItemInput
): Promise<ActionResponse<MealPlanItem>> {
  const supabase = await createClient();
  if (!supabase) {
    return { success: false, error: "Database not configured" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const updateFields: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) return { success: false, error: "Item name cannot be empty." };
    updateFields.name = name;
  }

  if (input.slot !== undefined) {
    updateFields.slot = input.slot;
  }

  if (input.quantity !== undefined) {
    const qty = Number(input.quantity);
    if (isNaN(qty) || qty <= 0) return { success: false, error: "Quantity must be greater than zero." };
    updateFields.quantity = qty;
  }

  if (input.unit !== undefined) {
    updateFields.unit = input.unit.trim();
  }

  if (input.calories !== undefined) updateFields.calories = parseNutrient(input.calories);
  if (input.protein !== undefined) updateFields.protein = parseNutrient(input.protein);
  if (input.carbs !== undefined) updateFields.carbs = parseNutrient(input.carbs);
  if (input.fat !== undefined) updateFields.fat = parseNutrient(input.fat);
  if (input.fiber !== undefined) updateFields.fiber = parseNutrient(input.fiber);

  const { data, error } = await supabase
    .from("meal_plan_items")
    .update(updateFields)
    .eq("id", input.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true, data: data as MealPlanItem };
}

/**
 * Deletes a meal plan item.
 */
export async function deleteMealPlanItem(
  id: string
): Promise<ActionResponse<{ id: string }>> {
  const supabase = await createClient();
  if (!supabase) {
    return { success: false, error: "Database not configured" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("meal_plan_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true, data: { id } };
}
