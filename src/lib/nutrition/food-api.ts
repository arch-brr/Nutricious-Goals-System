/**
 * External Food API Client
 *
 * Integrates:
 * 1. USDA FoodData Central (FDC) - Primary nutrition database for whole and branded foods.
 *    Uses process.env.FOOD_API_KEY with DEMO_KEY fallback.
 * 2. Open Food Facts v2 - Secondary global and barcode catalog for international branded goods.
 *
 * Principles:
 * - Server-side execution only (credentials never exposed to client).
 * - Honest missing-data propagation (unreported nutrients are null, not fabricated as zero).
 * - Explicit source attribution on every item.
 * - Strict timeout (6s) and graceful fallback.
 */

export type ApiFoodItem = {
  id: string;
  name: string;
  brand: string | null;
  servingSize: number;
  servingUnit: string;
  householdServing?: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  source: "usda" | "openfoodfacts";
  sourceAttribution: string;
};

export type FoodSearchResult = {
  items: ApiFoodItem[];
  totalHits: number;
  provider: "usda" | "openfoodfacts" | "combined" | "all";
  error?: string;
};

function normalizeUnit(rawUnit?: string): string {
  if (!rawUnit) return "g";
  const u = rawUnit.toLowerCase().trim();
  if (u === "g" || u === "grm" || u === "grams" || u === "gram") return "g";
  if (u === "ml" || u === "milliliters" || u === "milliliter") return "ml";
  if (u === "oz" || u === "ounce" || u === "ounces") return "oz";
  if (u === "cup" || u === "cups") return "cup";
  if (u === "tbsp" || u === "tablespoon" || u === "tablespoons") return "tbsp";
  if (u === "tsp" || u === "teaspoon" || u === "teaspoons") return "tsp";
  if (u === "piece" || u === "pieces" || u === "item" || u === "unit") return "piece";
  if (u === "serving" || u === "servings") return "serving";
  return "g";
}

function roundNutrient(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const num = Number(val);
  return isNaN(num) || num < 0 ? null : Math.round(num * 10) / 10;
}

/**
 * Searches USDA FoodData Central
 */
export async function searchUSDA(query: string, pageSize = 15): Promise<ApiFoodItem[]> {
  const apiKey = process.env.FOOD_API_KEY || "DEMO_KEY";
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(
    query
  )}&pageSize=${pageSize}&api_key=${apiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.warn(`USDA API responded with status ${res.status}`);
      return [];
    }

    const data = await res.json();
    if (!data.foods || !Array.isArray(data.foods)) return [];

    return data.foods.map((food: any): ApiFoodItem => {
      const nutrients = Array.isArray(food.foodNutrients) ? food.foodNutrients : [];

      const findNutrient = (matcher: (n: any) => boolean) => {
        const found = nutrients.find(matcher);
        return found ? found.value : null;
      };

      // Calories (KCAL preferred; if kJ only, divide by 4.184)
      let calories = findNutrient(
        (n) =>
          n.nutrientId === 1008 ||
          (n.unitName?.toUpperCase() === "KCAL" && n.nutrientName?.toLowerCase().includes("energy"))
      );

      if (calories === null) {
        const kj = findNutrient(
          (n) =>
            n.nutrientId === 1062 ||
            (n.unitName?.toUpperCase() === "KJ" && n.nutrientName?.toLowerCase().includes("energy"))
        );
        if (kj !== null) {
          calories = kj / 4.184;
        }
      }

      // Protein (ID 1003)
      const protein = findNutrient(
        (n) => n.nutrientId === 1003 || n.nutrientName?.toLowerCase() === "protein"
      );

      // Carbohydrates (ID 1005)
      const carbs = findNutrient(
        (n) =>
          n.nutrientId === 1005 ||
          n.nutrientName?.toLowerCase().includes("carbohydrate, by difference") ||
          n.nutrientName?.toLowerCase() === "carbohydrates"
      );

      // Fat (ID 1004)
      const fat = findNutrient(
        (n) =>
          n.nutrientId === 1004 ||
          n.nutrientName?.toLowerCase().includes("total lipid (fat)") ||
          n.nutrientName?.toLowerCase() === "fat"
      );

      // Fiber (ID 1079)
      const fiber = findNutrient(
        (n) =>
          n.nutrientId === 1079 ||
          n.nutrientName?.toLowerCase().includes("fiber, total dietary") ||
          n.nutrientName?.toLowerCase() === "fiber"
      );

      const servingSize = food.servingSize ? Number(food.servingSize) : 100;
      const servingUnit = normalizeUnit(food.servingSizeUnit);

      return {
        id: `usda-${food.fdcId}`,
        name: food.description?.trim() || "Unknown Food",
        brand: food.brandName?.trim() || food.brandOwner?.trim() || null,
        servingSize: servingSize > 0 ? servingSize : 100,
        servingUnit,
        householdServing: food.householdServingFullText?.trim() || null,
        calories: roundNutrient(calories),
        protein: roundNutrient(protein),
        carbs: roundNutrient(carbs),
        fat: roundNutrient(fat),
        fiber: roundNutrient(fiber),
        source: "usda",
        sourceAttribution: "USDA FoodData Central",
      };
    });
  } catch (err: any) {
    console.error("USDA search error:", err?.message || err);
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Searches Open Food Facts v2
 */
export async function searchOpenFoodFacts(query: string, pageSize = 15): Promise<ApiFoodItem[]> {
  const url = `https://world.openfoodfacts.net/api/v2/search?fields=code,product_name,brands,serving_size,nutriments&page_size=${pageSize}&search_terms=${encodeURIComponent(
    query
  )}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "NutriciousGoalsSystem/1.0 (contact@nutricious.app)",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.warn(`Open Food Facts API responded with status ${res.status}`);
      return [];
    }

    const data = await res.json();
    if (!data.products || !Array.isArray(data.products)) return [];

    return data.products
      .filter((p: any) => p.product_name && p.product_name.trim().length > 0)
      .map((product: any): ApiFoodItem => {
        const nutriments = product.nutriments || {};

        const calories =
          nutriments["energy-kcal_100g"] ??
          nutriments["energy-kcal_serving"] ??
          nutriments["energy-kcal"];

        const protein = nutriments["proteins_100g"] ?? nutriments["proteins_serving"] ?? nutriments["proteins"];
        const carbs = nutriments["carbohydrates_100g"] ?? nutriments["carbohydrates_serving"] ?? nutriments["carbohydrates"];
        const fat = nutriments["fat_100g"] ?? nutriments["fat_serving"] ?? nutriments["fat"];
        const fiber = nutriments["fiber_100g"] ?? nutriments["fiber_serving"] ?? nutriments["fiber"];

        return {
          id: `off-${product.code || Math.random().toString(36).substring(7)}`,
          name: product.product_name.trim(),
          brand: product.brands?.trim() || null,
          servingSize: 100,
          servingUnit: "g",
          householdServing: product.serving_size?.trim() || null,
          calories: roundNutrient(calories),
          protein: roundNutrient(protein),
          carbs: roundNutrient(carbs),
          fat: roundNutrient(fat),
          fiber: roundNutrient(fiber),
          source: "openfoodfacts",
          sourceAttribution: "Open Food Facts (ODbL)",
        };
      });
  } catch (err: any) {
    console.error("Open Food Facts search error:", err?.message || err);
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Unified Catalog Search
 */
export async function searchFoodCatalog(
  query: string,
  provider: "all" | "usda" | "openfoodfacts" = "all"
): Promise<FoodSearchResult> {
  const q = query.trim();
  if (!q) {
    return { items: [], totalHits: 0, provider };
  }

  try {
    if (provider === "usda") {
      const usdaItems = await searchUSDA(q, 20);
      return {
        items: usdaItems,
        totalHits: usdaItems.length,
        provider: "usda",
      };
    }

    if (provider === "openfoodfacts") {
      const offItems = await searchOpenFoodFacts(q, 20);
      return {
        items: offItems,
        totalHits: offItems.length,
        provider: "openfoodfacts",
      };
    }

    // Default 'all': Query USDA first, augment with Open Food Facts
    const [usdaResults, offResults] = await Promise.all([
      searchUSDA(q, 15),
      searchOpenFoodFacts(q, 10),
    ]);

    const combined = [...usdaResults, ...offResults];
    return {
      items: combined,
      totalHits: combined.length,
      provider: "combined",
    };
  } catch (err: any) {
    return {
      items: [],
      totalHits: 0,
      provider,
      error: "Unable to retrieve food catalog results. Please check your internet connection.",
    };
  }
}
