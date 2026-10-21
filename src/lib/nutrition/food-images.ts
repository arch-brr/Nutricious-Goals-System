/**
 * Food image resolution utility
 * Maps culinary items, staple foods, and course slots to curated high-resolution photography.
 */

export const FOOD_IMAGES = {
  eggs: "/images/foods/eggs.jpg",
  rice: "/images/foods/rice.jpg",
  bread: "/images/foods/bread.jpg",
  banana: "/images/foods/banana.jpg",
  mango: "/images/foods/mango.jpg",
  chicken: "/images/foods/chicken.jpg",
  salmon: "/images/foods/salmon.jpg",
  salad: "/images/foods/salad.jpg",
  water: "/images/foods/water.jpg",
  oatmeal: "/images/foods/oatmeal.jpg",
} as const;

export function getFoodImage(name: string, slot?: string): string | null {
  if (!name) return null;
  const lower = name.toLowerCase();

  // 1. Eggs / Breakfast protein
  if (
    lower.includes("egg") ||
    lower.includes("itlog") ||
    lower.includes("omelet") ||
    lower.includes("scrambled") ||
    lower.includes("pinakuluan")
  ) {
    return FOOD_IMAGES.eggs;
  }

  // 2. Rice / Sinangag
  if (
    lower.includes("rice") ||
    lower.includes("kanin") ||
    lower.includes("sinangag") ||
    lower.includes("arroz")
  ) {
    return FOOD_IMAGES.rice;
  }

  // 3. Wheat Bread / Toast / Sandwiches
  if (
    lower.includes("bread") ||
    lower.includes("wheat") ||
    lower.includes("toast") ||
    lower.includes("pandesal") ||
    lower.includes("sandwich")
  ) {
    return FOOD_IMAGES.bread;
  }

  // 4. Banana / Saging
  if (lower.includes("banana") || lower.includes("saging") || lower.includes("latundan") || lower.includes("saba")) {
    return FOOD_IMAGES.banana;
  }

  // 5. Mango / Mangga
  if (lower.includes("mango") || lower.includes("mangga") || lower.includes("carabao")) {
    return FOOD_IMAGES.mango;
  }

  // 6. Chicken / Poultry
  if (
    lower.includes("chicken") ||
    lower.includes("manok") ||
    lower.includes("tinola") ||
    lower.includes("adobo") ||
    lower.includes("inasal")
  ) {
    return FOOD_IMAGES.chicken;
  }

  // 7. Fish / Salmon / Seafood
  if (
    lower.includes("salmon") ||
    lower.includes("fish") ||
    lower.includes("isda") ||
    lower.includes("bangus") ||
    lower.includes("tilapia") ||
    lower.includes("tuna")
  ) {
    return FOOD_IMAGES.salmon;
  }

  // 8. Salads / Greens / Vegetables
  if (
    lower.includes("salad") ||
    lower.includes("gulay") ||
    lower.includes("vegetable") ||
    lower.includes("greens") ||
    lower.includes("pinakbet") ||
    lower.includes("chop suey") ||
    lower.includes("avocado")
  ) {
    return FOOD_IMAGES.salad;
  }

  // 9. Oatmeal / Cereals / Oats
  if (
    lower.includes("oat") ||
    lower.includes("oatmeal") ||
    lower.includes("cereal") ||
    lower.includes("porridge") ||
    lower.includes("champorado")
  ) {
    return FOOD_IMAGES.oatmeal;
  }

  // 10. Water / Hydration
  if (lower.includes("water") || lower.includes("tubig") || lower.includes("hydration")) {
    return FOOD_IMAGES.water;
  }

  // Fallback by slot if meal course matches
  if (slot === "breakfast") return FOOD_IMAGES.eggs;
  if (slot === "lunch") return FOOD_IMAGES.chicken;
  if (slot === "dinner") return FOOD_IMAGES.salmon;
  if (slot === "snack") return FOOD_IMAGES.banana;

  return null;
}
