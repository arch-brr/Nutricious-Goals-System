"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Food } from "@/lib/supabase/types";

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type CustomFoodInput = {
  name: string;
  brand?: string | null;
  serving_size: number;
  serving_unit: string;
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

export async function getCustomFoods(): Promise<ActionResponse<Food[]>> {
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
    .from("foods")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (data as Food[]) || [] };
}

export async function createCustomFood(
  input: CustomFoodInput
): Promise<ActionResponse<Food>> {
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
    return { success: false, error: "Food name is required." };
  }

  const servingSize = Number(input.serving_size);
  if (isNaN(servingSize) || servingSize <= 0) {
    return { success: false, error: "Serving size must be greater than zero." };
  }

  const servingUnit = input.serving_unit?.trim();
  if (!servingUnit) {
    return { success: false, error: "Serving unit is required." };
  }

  const foodPayload = {
    user_id: user.id,
    name,
    brand: input.brand?.trim() || null,
    serving_size: servingSize,
    serving_unit: servingUnit,
    calories: parseNutrient(input.calories),
    protein: parseNutrient(input.protein),
    carbs: parseNutrient(input.carbs),
    fat: parseNutrient(input.fat),
    fiber: parseNutrient(input.fiber),
    source: "custom",
    source_id: null,
    source_attribution: null,
    is_custom: true,
    is_archived: false,
  };

  const { data, error } = await supabase
    .from("foods")
    .insert(foodPayload)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true, data: data as Food };
}

export async function updateCustomFood(
  id: string,
  input: CustomFoodInput
): Promise<ActionResponse<Food>> {
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
    return { success: false, error: "Food name is required." };
  }

  const servingSize = Number(input.serving_size);
  if (isNaN(servingSize) || servingSize <= 0) {
    return { success: false, error: "Serving size must be greater than zero." };
  }

  const servingUnit = input.serving_unit?.trim();
  if (!servingUnit) {
    return { success: false, error: "Serving unit is required." };
  }

  const { data, error } = await supabase
    .from("foods")
    .update({
      name,
      brand: input.brand?.trim() || null,
      serving_size: servingSize,
      serving_unit: servingUnit,
      calories: parseNutrient(input.calories),
      protein: parseNutrient(input.protein),
      carbs: parseNutrient(input.carbs),
      fat: parseNutrient(input.fat),
      fiber: parseNutrient(input.fiber),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true, data: data as Food };
}

/**
 * Soft deletes a custom food by marking is_archived = true.
 * This preserves historical meal plans and consumption logs that reference this food.
 */
export async function deleteCustomFood(
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
    .from("foods")
    .update({ is_archived: true, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true, data: { id } };
}
