import { describe, it, expect } from "vitest";
import {
  SUPPORTED_SERVING_UNITS,
  normalizeUnit,
  areUnitsCompatible,
  scaleNutrient,
  scaleAllNutrients,
  calculateNutrientTotals,
  formatNutrient,
} from "@/lib/nutrition/calculator";

describe("Nutrition Calculator Unit Tests", () => {
  describe("Unit Normalization & Compatibility", () => {
    it("normalizes units with whitespace and mixed casing", () => {
      expect(normalizeUnit("  G  ")).toBe("g");
      expect(normalizeUnit("Serving")).toBe("serving");
      expect(normalizeUnit("ML")).toBe("ml");
    });

    it("verifies compatible units when casing or whitespace differs", () => {
      expect(areUnitsCompatible("g", "G")).toBe(true);
      expect(areUnitsCompatible(" serving ", "serving")).toBe(true);
      expect(areUnitsCompatible("oz", "OZ")).toBe(true);
    });

    it("rejects incompatible cross-units", () => {
      expect(areUnitsCompatible("g", "oz")).toBe(false);
      expect(areUnitsCompatible("ml", "g")).toBe(false);
      expect(areUnitsCompatible("serving", "piece")).toBe(false);
    });

    it("defines the expected list of supported serving units", () => {
      expect(SUPPORTED_SERVING_UNITS).toContain("g");
      expect(SUPPORTED_SERVING_UNITS).toContain("ml");
      expect(SUPPORTED_SERVING_UNITS).toContain("serving");
      expect(SUPPORTED_SERVING_UNITS).toContain("piece");
      expect(SUPPORTED_SERVING_UNITS).toContain("oz");
      expect(SUPPORTED_SERVING_UNITS).toContain("cup");
      expect(SUPPORTED_SERVING_UNITS).toContain("tbsp");
      expect(SUPPORTED_SERVING_UNITS).toContain("tsp");
    });
  });

  describe("Single Nutrient Scaling (scaleNutrient)", () => {
    it("correctly scales nutrient proportionally when units match", () => {
      // 200g of food with 25g protein per 100g base = 50g protein
      const result = scaleNutrient(25, 100, "g", 200, "g");
      expect(result.calculated).toBe(true);
      expect(result.value).toBe(50);
      expect(result.reason).toBeUndefined();
    });

    it("handles fractional and decimal scaling accurately with 2 decimal precision", () => {
      // 75g of food with 13.33g protein per 100g base = 10g protein
      const result = scaleNutrient(13.333, 100, "g", 75, "g");
      expect(result.calculated).toBe(true);
      expect(result.value).toBe(10);
    });

    it("preserves null and undefined values honestly without defaulting to zero", () => {
      const nullResult = scaleNutrient(null, 100, "g", 200, "g");
      expect(nullResult.calculated).toBe(false);
      expect(nullResult.value).toBeNull();
      expect(nullResult.reason).toContain("not provided");

      const undefinedResult = scaleNutrient(undefined, 100, "g", 200, "g");
      expect(undefinedResult.calculated).toBe(false);
      expect(undefinedResult.value).toBeNull();
    });

    it("rejects scaling when units are mismatched", () => {
      const mismatch = scaleNutrient(100, 1, "serving", 150, "g");
      expect(mismatch.calculated).toBe(false);
      expect(mismatch.value).toBeNull();
      expect(mismatch.reason).toContain("Cannot scale proportionally between 'serving' and 'g'");
    });

    it("rejects invalid quantities (zero or negative serving size / quantity)", () => {
      expect(scaleNutrient(50, 0, "g", 100, "g").calculated).toBe(false);
      expect(scaleNutrient(50, -10, "g", 100, "g").calculated).toBe(false);
      expect(scaleNutrient(50, 100, "g", 0, "g").calculated).toBe(false);
      expect(scaleNutrient(50, 100, "g", -50, "g").calculated).toBe(false);
    });
  });

  describe("Full Food Scaling (scaleAllNutrients)", () => {
    const mockFood = {
      serving_size: 100,
      serving_unit: "g",
      calories: 250,
      protein: 20,
      carbs: 30,
      fat: 5,
      fiber: null, // intentionally unprovided
    };

    it("scales all available nutrients and maintains unprovided nutrients as null", () => {
      const scaled = scaleAllNutrients(mockFood, 150, "g");

      expect(scaled.calories.calculated).toBe(true);
      expect(scaled.calories.value).toBe(375);

      expect(scaled.protein.calculated).toBe(true);
      expect(scaled.protein.value).toBe(30);

      expect(scaled.carbs.calculated).toBe(true);
      expect(scaled.carbs.value).toBe(45);

      expect(scaled.fat.calculated).toBe(true);
      expect(scaled.fat.value).toBe(7.5);

      expect(scaled.fiber.calculated).toBe(false);
      expect(scaled.fiber.value).toBeNull();
    });

    it("fails all calculations if entered unit does not match food serving unit", () => {
      const scaled = scaleAllNutrients(mockFood, 1, "cup");

      expect(scaled.calories.calculated).toBe(false);
      expect(scaled.calories.value).toBeNull();
      expect(scaled.protein.calculated).toBe(false);
      expect(scaled.carbs.calculated).toBe(false);
      expect(scaled.fat.calculated).toBe(false);
    });
  });

  describe("Nutrient Totals Calculation (calculateNutrientTotals)", () => {
    it("sums multiple items with complete data accurately", () => {
      const items = [
        { calories: 300, protein: 20, carbs: 40, fat: 10, fiber: 5 },
        { calories: 250.5, protein: 15.2, carbs: 30.1, fat: 8.3, fiber: 2.1 },
      ];

      const totals = calculateNutrientTotals(items);

      expect(totals.calories.total).toBe(550.5);
      expect(totals.calories.complete).toBe(true);
      expect(totals.calories.missingCount).toBe(0);
      expect(totals.calories.knownCount).toBe(2);

      expect(totals.protein.total).toBe(35.2);
      expect(totals.carbs.total).toBe(70.1);
      expect(totals.fat.total).toBe(18.3);
      expect(totals.fiber.total).toBe(7.1);
    });

    it("tracks missing vs known nutrients without defaulting missing values to zero", () => {
      const items = [
        { calories: 400, protein: 30, carbs: null, fat: 12, fiber: null },
        { calories: 200, protein: null, carbs: 25, fat: 5, fiber: 4 },
      ];

      const totals = calculateNutrientTotals(items);

      expect(totals.calories.total).toBe(600);
      expect(totals.calories.complete).toBe(true);

      // Carbs has 1 missing, 1 known
      expect(totals.carbs.total).toBe(25);
      expect(totals.carbs.complete).toBe(false);
      expect(totals.carbs.missingCount).toBe(1);
      expect(totals.carbs.knownCount).toBe(1);

      // Protein has 1 missing, 1 known
      expect(totals.protein.total).toBe(30);
      expect(totals.protein.complete).toBe(false);
      expect(totals.protein.missingCount).toBe(1);

      // Fiber has 1 missing, 1 known
      expect(totals.fiber.total).toBe(4);
      expect(totals.fiber.complete).toBe(false);
      expect(totals.fiber.missingCount).toBe(1);
    });

    it("returns zero totals and empty counts for empty array", () => {
      const totals = calculateNutrientTotals([]);

      expect(totals.calories.total).toBe(0);
      expect(totals.calories.complete).toBe(true);
      expect(totals.calories.knownCount).toBe(0);
      expect(totals.calories.missingCount).toBe(0);
    });
  });

  describe("Nutrient Display Formatting (formatNutrient)", () => {
    it("returns dash symbol for null or undefined values", () => {
      expect(formatNutrient(null)).toBe("—");
      expect(formatNutrient(undefined)).toBe("—");
    });

    it("formats numerical values with unit suffix", () => {
      expect(formatNutrient(150, "g")).toBe("150 g");
      expect(formatNutrient(2500, "kcal")).toBe("2500 kcal");
      expect(formatNutrient(0, "g")).toBe("0 g");
    });

    it("formats value without unit when unit is empty string", () => {
      expect(formatNutrient(42, "")).toBe("42");
    });
  });
});
