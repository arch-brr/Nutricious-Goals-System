/**
 * Nutrition calculation and unit scaling utilities.
 *
 * Rules:
 * 1. Proportional nutrient scaling is ONLY allowed when the entered quantity and food
 *    serving basis use the exact same unit. Cross-unit conversions (e.g., g to oz or ml to g)
 *    are explicitly rejected unless an unambiguous conversion factor is provided.
 * 2. Missing/unprovided nutrients (null) are NEVER defaulted to zero. They are retained as null
 *    and reported as unknown/incomplete.
 */

export const SUPPORTED_SERVING_UNITS = [
  "g",
  "ml",
  "serving",
  "piece",
  "oz",
  "cup",
  "tbsp",
  "tsp",
] as const;

export type SupportedServingUnit = (typeof SUPPORTED_SERVING_UNITS)[number];

export type NutrientScalingResult = {
  value: number | null;
  calculated: boolean;
  reason?: string;
};

/**
 * Normalizes unit strings for exact case-insensitive comparison.
 */
export function normalizeUnit(unit: string): string {
  return unit.trim().toLowerCase();
}

/**
 * Checks if two units are matching for proportional scaling.
 */
export function areUnitsCompatible(foodUnit: string, enteredUnit: string): boolean {
  return normalizeUnit(foodUnit) === normalizeUnit(enteredUnit);
}

/**
 * Scales a single nutrient value proportionally given the food's base serving and entered quantity.
 */
export function scaleNutrient(
  nutrientValue: number | null | undefined,
  foodServingSize: number,
  foodServingUnit: string,
  enteredQuantity: number,
  enteredUnit: string
): NutrientScalingResult {
  // 1. If the base nutrient value is unknown/unprovided, preserve as null
  if (nutrientValue === null || nutrientValue === undefined) {
    return {
      value: null,
      calculated: false,
      reason: "Nutrient value not provided by source",
    };
  }

  // 2. Validate valid numerical quantities
  if (foodServingSize <= 0 || enteredQuantity <= 0) {
    return {
      value: null,
      calculated: false,
      reason: "Serving size and quantity must be greater than zero",
    };
  }

  // 3. Reject scaling if units do not match
  if (!areUnitsCompatible(foodServingUnit, enteredUnit)) {
    return {
      value: null,
      calculated: false,
      reason: `Cannot scale proportionally between '${foodServingUnit}' and '${enteredUnit}' without density conversion`,
    };
  }

  // 4. Proportional scaling with 2 decimal precision
  const ratio = enteredQuantity / foodServingSize;
  const scaled = Math.round(nutrientValue * ratio * 100) / 100;

  return {
    value: scaled,
    calculated: true,
  };
}

export type ScaledNutrientSet = {
  calories: NutrientScalingResult;
  protein: NutrientScalingResult;
  carbs: NutrientScalingResult;
  fat: NutrientScalingResult;
  fiber: NutrientScalingResult;
};

/**
 * Scales all macro and micro nutrients for a food item given an entered quantity and unit.
 */
export function scaleAllNutrients(
  food: {
    serving_size: number;
    serving_unit: string;
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
    fiber: number | null;
  },
  enteredQuantity: number,
  enteredUnit: string
): ScaledNutrientSet {
  return {
    calories: scaleNutrient(food.calories, food.serving_size, food.serving_unit, enteredQuantity, enteredUnit),
    protein: scaleNutrient(food.protein, food.serving_size, food.serving_unit, enteredQuantity, enteredUnit),
    carbs: scaleNutrient(food.carbs, food.serving_size, food.serving_unit, enteredQuantity, enteredUnit),
    fat: scaleNutrient(food.fat, food.serving_size, food.serving_unit, enteredQuantity, enteredUnit),
    fiber: scaleNutrient(food.fiber, food.serving_size, food.serving_unit, enteredQuantity, enteredUnit),
  };
}

export type NutrientSum = {
  total: number;
  complete: boolean;
  missingCount: number;
  knownCount: number;
};

export type NutrientTotals = {
  calories: NutrientSum;
  protein: NutrientSum;
  carbs: NutrientSum;
  fat: NutrientSum;
  fiber: NutrientSum;
};

/**
 * Sums an array of nutrient values, keeping honest track of missing vs known items.
 */
export function calculateNutrientTotals(
  items: Array<{
    calories?: number | null;
    protein?: number | null;
    carbs?: number | null;
    fat?: number | null;
    fiber?: number | null;
  }>
): NutrientTotals {
  const sumSingle = (key: "calories" | "protein" | "carbs" | "fat" | "fiber"): NutrientSum => {
    let total = 0;
    let missingCount = 0;
    let knownCount = 0;

    for (const item of items) {
      const val = item[key];
      if (val === null || val === undefined) {
        missingCount++;
      } else {
        total += Number(val);
        knownCount++;
      }
    }

    return {
      total: Math.round(total * 100) / 100,
      complete: missingCount === 0,
      missingCount,
      knownCount,
    };
  };

  return {
    calories: sumSingle("calories"),
    protein: sumSingle("protein"),
    carbs: sumSingle("carbs"),
    fat: sumSingle("fat"),
    fiber: sumSingle("fiber"),
  };
}

/**
 * Formats a nutrient value for display. Returns '—' when value is null/unknown.
 */
export function formatNutrient(val: number | null | undefined, unit: string = "g"): string {
  if (val === null || val === undefined) {
    return "—";
  }
  return `${val}${unit ? ` ${unit}` : ""}`;
}
