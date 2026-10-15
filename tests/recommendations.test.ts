import { describe, it, expect } from "vitest";
import {
  DIETARY_PREFERENCES,
  REGION_OPTIONS,
  RECOMMENDED_FOODS_CATALOG,
  getRecommendedFoods,
} from "@/lib/nutrition/recommendations";

describe("Dietary Recommendations Engine Unit Tests", () => {
  it("exports supported dietary preferences with valid macro ratios", () => {
    expect(DIETARY_PREFERENCES.length).toBeGreaterThanOrEqual(5);
    for (const pref of DIETARY_PREFERENCES) {
      expect(pref.id).toBeDefined();
      expect(pref.label).toBeDefined();
      expect(pref.defaultCalories).toBeGreaterThan(0);
      const totalRatio =
        pref.macroRatios.protein +
        pref.macroRatios.carbs +
        pref.macroRatios.fat;
      expect(totalRatio).toBe(100);
    }
  });

  it("exports geographic regions with labels", () => {
    expect(REGION_OPTIONS.length).toBeGreaterThanOrEqual(5);
    const ids = REGION_OPTIONS.map((r) => r.id);
    expect(ids).toContain("global");
    expect(ids).toContain("europe_mediterranean");
    expect(ids).toContain("asia_pacific");
  });

  it("contains curated foods with complete, non-null nutrient values", () => {
    expect(RECOMMENDED_FOODS_CATALOG.length).toBeGreaterThanOrEqual(20);
    for (const food of RECOMMENDED_FOODS_CATALOG) {
      expect(food.name).toBeTruthy();
      expect(food.servingSize).toBeGreaterThan(0);
      expect(food.servingUnit).toBeTruthy();
      expect(food.calories).toBeGreaterThan(0);
      expect(food.protein).toBeGreaterThanOrEqual(0);
      expect(food.carbs).toBeGreaterThanOrEqual(0);
      expect(food.fat).toBeGreaterThanOrEqual(0);
      expect(food.fiber).toBeGreaterThanOrEqual(0);
    }
  });

  it("filters recommendations by dietary preference", () => {
    const medFoods = getRecommendedFoods("mediterranean");
    expect(medFoods.length).toBeGreaterThan(0);
    expect(medFoods.every((f) => f.diet === "mediterranean")).toBe(true);

    const plantFoods = getRecommendedFoods("plant_based");
    expect(plantFoods.length).toBeGreaterThan(0);
    expect(plantFoods.every((f) => f.diet === "plant_based")).toBe(true);

    const hpFoods = getRecommendedFoods("high_protein");
    expect(hpFoods.length).toBeGreaterThan(0);
    expect(hpFoods.every((f) => f.diet === "high_protein")).toBe(true);
  });

  it("filters recommendations by meal slot when available", () => {
    const breakfastFoods = getRecommendedFoods("mediterranean", "breakfast");
    expect(breakfastFoods.length).toBeGreaterThan(0);
    expect(breakfastFoods.every((f) => f.slot === "breakfast")).toBe(true);
  });

  it("falls back to mediterranean when preference is missing or unknown", () => {
    const fallback = getRecommendedFoods("unknown_diet_archetype");
    expect(fallback.length).toBeGreaterThan(0);
    expect(fallback.every((f) => f.diet === "mediterranean")).toBe(true);
  });
});
