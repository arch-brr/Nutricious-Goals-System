import { describe, it, expect } from "vitest";
import {
  DIETARY_PREFERENCES,
  COUNTRY_OPTIONS,
  REGION_OPTIONS,
  RECOMMENDED_FOODS_CATALOG,
  getRecommendedFoods,
  getAutomatedDietForCountry,
  calculateBMI,
  getBMICategory,
} from "@/lib/nutrition/recommendations";

describe("Dietary & Country Recommendations Engine Unit Tests", () => {
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

  it("exports country options with authentic national cuisine defaults", () => {
    expect(COUNTRY_OPTIONS.length).toBeGreaterThanOrEqual(8);
    const countryIds = COUNTRY_OPTIONS.map((c) => c.id);
    expect(countryIds).toContain("philippines");
    expect(countryIds).toContain("united_states");
    expect(countryIds).toContain("japan");
    expect(countryIds).toContain("italy");
    expect(countryIds).toContain("mexico");
    expect(countryIds).toContain("india");
  });

  it("exports backward-compatible region options", () => {
    expect(REGION_OPTIONS.length).toBeGreaterThanOrEqual(5);
    const ids = REGION_OPTIONS.map((r) => r.id);
    expect(ids).toContain("global");
    expect(ids).toContain("europe_mediterranean");
    expect(ids).toContain("asia_pacific");
  });

  it("automates dietary preference based on country selection", () => {
    expect(getAutomatedDietForCountry("philippines")).toBe("asian_pacific");
    expect(getAutomatedDietForCountry("japan")).toBe("asian_pacific");
    expect(getAutomatedDietForCountry("united_states")).toBe("high_protein");
    expect(getAutomatedDietForCountry("italy")).toBe("mediterranean");
    expect(getAutomatedDietForCountry("mexico")).toBe("low_carb");
    expect(getAutomatedDietForCountry("india")).toBe("plant_based");
    expect(getAutomatedDietForCountry(null)).toBe("mediterranean");
  });

  it("calculates and classifies BMI accurately", () => {
    // 70kg, 175cm -> 70 / (1.75 * 1.75) = 22.86 -> 22.9
    const bmiNormal = calculateBMI(175, 70);
    expect(bmiNormal).toBe(22.9);
    expect(getBMICategory(bmiNormal!).label).toBe("Normal Weight");

    // Underweight: 45kg, 170cm -> 45 / (1.70 * 1.70) = 15.6
    const bmiUnder = calculateBMI(170, 45);
    expect(bmiUnder).toBe(15.6);
    expect(getBMICategory(bmiUnder!).label).toBe("Underweight");

    // Overweight: 85kg, 175cm -> 85 / (1.75 * 1.75) = 27.8
    const bmiOver = calculateBMI(175, 85);
    expect(bmiOver).toBe(27.8);
    expect(getBMICategory(bmiOver!).label).toBe("Overweight");

    // Obesity: 105kg, 175cm -> 105 / (1.75 * 1.75) = 34.3
    const bmiObese = calculateBMI(175, 105);
    expect(bmiObese).toBe(34.3);
    expect(getBMICategory(bmiObese!).label).toBe("Obesity");

    // Invalid inputs return null
    expect(calculateBMI(0, 70)).toBeNull();
    expect(calculateBMI(175, 0)).toBeNull();
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

  it("filters recommendations by country preference", () => {
    const phFoods = getRecommendedFoods("philippines");
    expect(phFoods.length).toBeGreaterThan(0);
    expect(phFoods.every((f) => f.country === "philippines")).toBe(true);

    const jpFoods = getRecommendedFoods("japan");
    expect(jpFoods.length).toBeGreaterThan(0);
    expect(jpFoods.every((f) => f.country === "japan")).toBe(true);
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
