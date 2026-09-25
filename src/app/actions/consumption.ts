"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ConsumptionLog, MealSlot } from "@/lib/supabase/types";
import { scaleAllNutrients } from "@/lib/nutrition/calculator";
import { ActionResponse } from "./foods";

export type DirectConsumptionInput = {
  dateStr: string; // YYYY-MM-DD
  slot: MealSlot;
  foodName: string;
  foodId?: string | null;
  quantity: number;
  unit: string;
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
 * Fetches all consumption log entries for a user on a given date (YYYY-MM-DD).
 */
export async function getConsumptionLogsForDate(
  dateStr: string
): Promise<ActionResponse<ConsumptionLog[]>> {
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

  const { data, error } = await supabase
    .from("consumption_logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("log_date", dateStr)
    .order("consumed_at", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (data as ConsumptionLog[]) || [] };
}

/**
 * Logs a planned meal item as eaten/consumed by creating a snapshot record in consumption_logs.
 * This explicitly distinguishes planned intent from actual consumption records.
 */
export async function logPlannedItemAsConsumed(
  planItemId: string,
  dateStr: string
): Promise<ActionResponse<ConsumptionLog>> {
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

  // 1. Fetch the planned item and verify ownership
  const { data: planItem, error: itemError } = await supabase
    .from("meal_plan_items")
    .select("*")
    .eq("id", planItemId)
    .eq("user_id", user.id)
    .single();

  if (itemError || !planItem) {
    return { success: false, error: "Plan item not found or unauthorized." };
  }

  // 2. Check if a log already exists for this planned item on this date
  const { data: existingLog } = await supabase
    .from("consumption_logs")
    .select("*")
    .eq("meal_plan_item_id", planItemId)
    .eq("user_id", user.id)
    .eq("log_date", dateStr)
    .maybeSingle();

  if (existingLog) {
    return { success: true, data: existingLog as ConsumptionLog };
  }

  // 3. Create frozen consumption snapshot
  const logPayload = {
    user_id: user.id,
    log_date: dateStr,
    consumed_at: new Date().toISOString(),
    slot: planItem.slot,
    food_id: planItem.food_id,
    food_name: planItem.name,
    quantity: planItem.quantity,
    unit: planItem.unit,
    calories: planItem.calories,
    protein: planItem.protein,
    carbs: planItem.carbs,
    fat: planItem.fat,
    fiber: planItem.fiber,
    meal_plan_item_id: planItem.id,
  };

  const { data: createdLog, error: logError } = await supabase
    .from("consumption_logs")
    .insert(logPayload)
    .select()
    .single();

  if (logError) {
    return { success: false, error: logError.message };
  }

  revalidatePath("/", "layout");
  return { success: true, data: createdLog as ConsumptionLog };
}

/**
 * Removes the consumption log associated with a planned item (unmarks as eaten).
 */
export async function unlogPlannedItem(
  planItemId: string,
  dateStr: string
): Promise<ActionResponse<{ planItemId: string }>> {
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
    .from("consumption_logs")
    .delete()
    .eq("meal_plan_item_id", planItemId)
    .eq("user_id", user.id)
    .eq("log_date", dateStr);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true, data: { planItemId } };
}

/**
 * Directly logs a food consumed without needing a pre-existing plan item.
 */
export async function logDirectConsumption(
  input: DirectConsumptionInput
): Promise<ActionResponse<ConsumptionLog>> {
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

  const foodName = input.foodName?.trim();
  if (!foodName) {
    return { success: false, error: "Food name is required." };
  }

  const quantity = Number(input.quantity);
  if (isNaN(quantity) || quantity <= 0) {
    return { success: false, error: "Quantity must be greater than zero." };
  }

  const unit = input.unit?.trim() || "serving";

  let calories: number | null = parseNutrient(input.calories);
  let protein: number | null = parseNutrient(input.protein);
  let carbs: number | null = parseNutrient(input.carbs);
  let fat: number | null = parseNutrient(input.fat);
  let fiber: number | null = parseNutrient(input.fiber);

  if (input.foodId) {
    const { data: food } = await supabase
      .from("foods")
      .select("*")
      .eq("id", input.foodId)
      .single();

    if (food) {
      const scaled = scaleAllNutrients(food, quantity, unit);
      if (scaled.calories.calculated) calories = scaled.calories.value;
      if (scaled.protein.calculated) protein = scaled.protein.value;
      if (scaled.carbs.calculated) carbs = scaled.carbs.value;
      if (scaled.fat.calculated) fat = scaled.fat.value;
      if (scaled.fiber.calculated) fiber = scaled.fiber.value;
    }
  }

  const logPayload = {
    user_id: user.id,
    log_date: input.dateStr,
    consumed_at: new Date().toISOString(),
    slot: input.slot,
    food_id: input.foodId || null,
    food_name: foodName,
    quantity,
    unit,
    calories,
    protein,
    carbs,
    fat,
    fiber,
    meal_plan_item_id: null,
  };

  const { data, error } = await supabase
    .from("consumption_logs")
    .insert(logPayload)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true, data: data as ConsumptionLog };
}

/**
 * Deletes a consumption log entry.
 */
export async function deleteConsumptionLog(
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
    .from("consumption_logs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true, data: { id } };
}
