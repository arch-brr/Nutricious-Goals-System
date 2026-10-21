"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Food } from "@/lib/supabase/types";
import {
  searchFoodCatalog,
  ApiFoodItem,
  FoodSearchResult,
} from "@/lib/nutrition/food-api";

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Searches external food catalogs (USDA FoodData Central / Open Food Facts).
 * Server-side execution keeps any API credentials safe and avoids client CORS limitations.
 */
export async function searchExternalFoodsAction(
  query: string,
  provider: "all" | "usda" | "openfoodfacts" = "all"
): Promise<ActionResponse<FoodSearchResult>> {
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

  const trimmed = query?.trim();
  if (!trimmed) {
    return {
      success: true,
      data: { items: [], totalHits: 0, provider },
    };
  }

  try {
    const result = await searchFoodCatalog(trimmed, provider);
    return { success: true, data: result };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to search external food catalog.",
    };
  }
}

/**
 * Imports an external API food item into the user's food database.
 * Retains source, source_id, and provider attribution per AGENTS.md requirements.
 * Sets is_custom: false to clearly distinguish provider-sourced items from user-created foods.
 */
export async function importApiFoodAction(
  item: ApiFoodItem
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

  if (!item.name || !item.name.trim()) {
    return { success: false, error: "Food name is required." };
  }

  const servingSize = Number(item.servingSize);
  if (isNaN(servingSize) || servingSize <= 0) {
    return { success: false, error: "Valid serving size is required." };
  }

  const servingUnit = item.servingUnit?.trim() || "g";

  const foodPayload = {
    user_id: user.id,
    name: item.name.trim(),
    brand: item.brand?.trim() || null,
    serving_size: servingSize,
    serving_unit: servingUnit,
    calories: item.calories ?? null,
    protein: item.protein ?? null,
    carbs: item.carbs ?? null,
    fat: item.fat ?? null,
    fiber: item.fiber ?? null,
    source: item.source,
    source_id: item.id,
    source_attribution: item.sourceAttribution,
    is_custom: false, // Explicitly false for API-sourced catalog foods
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
