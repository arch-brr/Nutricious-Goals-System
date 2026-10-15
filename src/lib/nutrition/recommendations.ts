import { MealSlot } from "@/lib/supabase/types";

export type DietaryPreferenceId =
  | "mediterranean"
  | "high_protein"
  | "plant_based"
  | "low_carb"
  | "asian_pacific";

export type CountryPreferenceId =
  | "philippines"
  | "united_states"
  | "japan"
  | "italy"
  | "mexico"
  | "india"
  | "united_kingdom"
  | "global";

export type RecommendedFood = {
  id: string;
  name: string;
  diet: DietaryPreferenceId;
  dietLabel: string;
  country: CountryPreferenceId;
  countryLabel: string;
  slot: MealSlot;
  servingSize: number;
  servingUnit: string;
  portionDesc: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  emoji: string;
  highlight: string;
};

export const DIETARY_PREFERENCES: {
  id: DietaryPreferenceId;
  label: string;
  description: string;
  defaultCalories: number;
  macroRatios: { protein: number; carbs: number; fat: number };
}[] = [
  {
    id: "mediterranean",
    label: "Mediterranean & Balanced",
    description: "Heart-healthy fats, unrefined grains, seafood & seasonal produce",
    defaultCalories: 2000,
    macroRatios: { protein: 25, carbs: 50, fat: 25 },
  },
  {
    id: "high_protein",
    label: "High Protein & Active",
    description: "Optimized amino acid density for muscle recovery, strength & satiety",
    defaultCalories: 2250,
    macroRatios: { protein: 35, carbs: 40, fat: 25 },
  },
  {
    id: "plant_based",
    label: "Plant-Based & Vegan",
    description: "Whole botanical foods, fiber-rich legumes, tempeh & leafy greens",
    defaultCalories: 1950,
    macroRatios: { protein: 25, carbs: 55, fat: 20 },
  },
  {
    id: "low_carb",
    label: "Mindful Low-Carb",
    description: "Healthy fats, lean proteins, nutrient vegetables & sustained satiety",
    defaultCalories: 1850,
    macroRatios: { protein: 30, carbs: 20, fat: 50 },
  },
  {
    id: "asian_pacific",
    label: "Asian-Pacific Whole Foods",
    description: "Umami broths, steamed greens, tofu, miso, brown rice & seafood",
    defaultCalories: 2050,
    macroRatios: { protein: 28, carbs: 52, fat: 20 },
  },
];

export const COUNTRY_OPTIONS: {
  id: CountryPreferenceId;
  label: string;
  flag: string;
  defaultDiet: DietaryPreferenceId;
  description: string;
}[] = [
  {
    id: "philippines",
    label: "Philippines (Southeast Asian)",
    flag: "🇵🇭",
    defaultDiet: "asian_pacific",
    description: "Rich local broths, fresh leafy malunggay, grilled seafood & tropical fruits",
  },
  {
    id: "united_states",
    label: "United States (North American)",
    flag: "🇺🇸",
    defaultDiet: "high_protein",
    description: "Lean poultry, wild salmon, wholesome oats & active protein staples",
  },
  {
    id: "japan",
    label: "Japan (East Asian Washoku)",
    flag: "🇯🇵",
    defaultDiet: "asian_pacific",
    description: "Miso-glazed seafood, silken tofu, fermented seaweed & steamed brown grains",
  },
  {
    id: "italy",
    label: "Italy & Mediterranean Basin",
    flag: "🇮🇹",
    defaultDiet: "mediterranean",
    description: "Extra virgin olive oil, wild sea bass, legume stews & antioxidant tomatoes",
  },
  {
    id: "mexico",
    label: "Mexico & Latin America",
    flag: "🇲🇽",
    defaultDiet: "low_carb",
    description: "Fiber-packed black beans, ripe avocado, roasted nopales & grilled proteins",
  },
  {
    id: "india",
    label: "India & South Asia",
    flag: "🇮🇳",
    defaultDiet: "plant_based",
    description: "Ayurvedic lentils, turmeric curries, paneer/tofu & whole grain rotis",
  },
  {
    id: "united_kingdom",
    label: "United Kingdom & Western Europe",
    flag: "🇬🇧",
    defaultDiet: "mediterranean",
    description: "Wholesome oats, poached eggs, steamed greens & cold-water fish",
  },
  {
    id: "global",
    label: "Global / International Cuisine",
    flag: "🌍",
    defaultDiet: "mediterranean",
    description: "A well-rounded baseline of internationally accessible whole foods",
  },
];

export const REGION_OPTIONS = [
  ...COUNTRY_OPTIONS,
  {
    id: "europe_mediterranean" as CountryPreferenceId,
    label: "Europe & Mediterranean",
    flag: "🇪🇺",
    defaultDiet: "mediterranean" as DietaryPreferenceId,
    description: "Olive oil, legumes, seasonal produce & cold-water fish",
  },
  {
    id: "asia_pacific" as CountryPreferenceId,
    label: "Asia-Pacific",
    flag: "🌏",
    defaultDiet: "asian_pacific" as DietaryPreferenceId,
    description: "Wholesome broths, soy, steamed rice & fresh seafood",
  },
];

// --- BMI Calculation & Categorization Utilities ---
export type BMICategory = {
  label: "Underweight" | "Normal Weight" | "Overweight" | "Obesity";
  color: string;
  bgLight: string;
  desc: string;
};

export function calculateBMI(heightCm: number, weightKg: number): number | null {
  if (!heightCm || !weightKg || heightCm <= 40 || weightKg <= 20) return null;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10;
}

export function getBMICategory(bmi: number): BMICategory {
  if (bmi < 18.5) {
    return {
      label: "Underweight",
      color: "#0284c7",
      bgLight: "rgba(2, 132, 199, 0.12)",
      desc: "Below standard reference range; prioritize nutrient-dense balanced meals.",
    };
  }
  if (bmi < 25) {
    return {
      label: "Normal Weight",
      color: "#16a34a",
      bgLight: "rgba(22, 163, 74, 0.12)",
      desc: "Within standard healthy reference range; maintain active vitality balance.",
    };
  }
  if (bmi < 30) {
    return {
      label: "Overweight",
      color: "#d97706",
      bgLight: "rgba(217, 119, 6, 0.12)",
      desc: "Above standard reference range; cultivate mindful fiber and lean protein satiety.",
    };
  }
  return {
    label: "Obesity",
    color: "#dc2626",
    bgLight: "rgba(220, 38, 38, 0.12)",
    desc: "Higher reference range; focus on wholesome portions, steady hydration & daily movement.",
  };
}

export function getAutomatedDietForCountry(country?: string | null): DietaryPreferenceId {
  const norm = (country || "").toLowerCase();
  const match = COUNTRY_OPTIONS.find((c) => c.id === norm);
  return match ? match.defaultDiet : "mediterranean";
}

export const RECOMMENDED_FOODS_CATALOG: RecommendedFood[] = [
  // --- PHILIPPINES & SOUTHEAST ASIA ---
  {
    id: "ph-1",
    name: "Salmon Sinigang with Kangkong & Radish",
    diet: "asian_pacific",
    dietLabel: "Asian-Pacific",
    country: "philippines",
    countryLabel: "Philippines",
    slot: "lunch",
    servingSize: 1,
    servingUnit: "bowl",
    portionDesc: "1 large bowl with soup (340g)",
    calories: 380,
    protein: 36,
    carbs: 18,
    fat: 14,
    fiber: 6,
    emoji: "🍲",
    highlight: "Tamarind broth rich in vitamin C with water spinach and wild salmon",
  },
  {
    id: "ph-2",
    name: "Chicken Tinola with Malunggay & Green Papaya",
    diet: "asian_pacific",
    dietLabel: "Asian-Pacific",
    country: "philippines",
    countryLabel: "Philippines",
    slot: "dinner",
    servingSize: 1,
    servingUnit: "bowl",
    portionDesc: "1 hearty soup bowl (320g)",
    calories: 360,
    protein: 38,
    carbs: 14,
    fat: 12,
    fiber: 5,
    emoji: "🥣",
    highlight: "Ginger broth loaded with moringa (malunggay) super-leaf micronutrients",
  },
  {
    id: "ph-3",
    name: "Grilled Bangus with Tomato-Onion Ensalada",
    diet: "asian_pacific",
    dietLabel: "Asian-Pacific",
    country: "philippines",
    countryLabel: "Philippines",
    slot: "lunch",
    servingSize: 1,
    servingUnit: "plate",
    portionDesc: "1 fillet & ensalada (260g)",
    calories: 410,
    protein: 42,
    carbs: 12,
    fat: 20,
    fiber: 4,
    emoji: "🐟",
    highlight: "Flame-broiled milkfish with fresh native tomato & calamansi relish",
  },
  {
    id: "ph-4",
    name: "Garlic Brown Rice & Poached Egg (Light Sinangag)",
    diet: "asian_pacific",
    dietLabel: "Asian-Pacific",
    country: "philippines",
    countryLabel: "Philippines",
    slot: "breakfast",
    servingSize: 1,
    servingUnit: "plate",
    portionDesc: "1 bowl sinangag + egg (210g)",
    calories: 310,
    protein: 14,
    carbs: 42,
    fat: 10,
    fiber: 4,
    emoji: "🍳",
    highlight: "Slow-roasted garlic brown rice providing steady morning energy",
  },
  {
    id: "ph-5",
    name: "Adobong Kangkong & Organic Tofu",
    diet: "plant_based",
    dietLabel: "Plant-Based",
    country: "philippines",
    countryLabel: "Philippines",
    slot: "dinner",
    servingSize: 1,
    servingUnit: "plate",
    portionDesc: "1 vegetable plate (270g)",
    calories: 280,
    protein: 20,
    carbs: 22,
    fat: 12,
    fiber: 7,
    emoji: "🥬",
    highlight: "Iron-rich river spinach sautéed in coconut vinegar and braised tofu",
  },
  {
    id: "ph-6",
    name: "Fresh Papaya Slices with Calamansi Lime",
    diet: "mediterranean",
    dietLabel: "Mediterranean",
    country: "philippines",
    countryLabel: "Philippines",
    slot: "snack",
    servingSize: 1,
    servingUnit: "bowl",
    portionDesc: "1 cup sliced (180g)",
    calories: 120,
    protein: 2,
    carbs: 28,
    fat: 1,
    fiber: 5,
    emoji: "🥭",
    highlight: "Natural papain digestive enzymes with native Philippine citrus",
  },

  // --- JAPAN & EAST ASIA ---
  {
    id: "jp-1",
    name: "Miso Soup with Silken Tofu, Wakame & Scallions",
    diet: "asian_pacific",
    dietLabel: "Asian-Pacific",
    country: "japan",
    countryLabel: "Japan",
    slot: "breakfast",
    servingSize: 1,
    servingUnit: "bowl",
    portionDesc: "1 warm bowl (300ml)",
    calories: 140,
    protein: 12,
    carbs: 9,
    fat: 5,
    fiber: 3,
    emoji: "🥣",
    highlight: "Fermented barley miso offering gut probiotics and oceanic minerals",
  },
  {
    id: "jp-2",
    name: "Miso-Glazed Black Cod with Steamed Jasmine Brown Rice",
    diet: "asian_pacific",
    dietLabel: "Asian-Pacific",
    country: "japan",
    countryLabel: "Japan",
    slot: "lunch",
    servingSize: 1,
    servingUnit: "meal",
    portionDesc: "160g cod + 120g rice (300g)",
    calories: 480,
    protein: 36,
    carbs: 42,
    fat: 16,
    fiber: 4,
    emoji: "🐟",
    highlight: "Long-chain marine omega-3 cod with slow-digesting whole grain",
  },
  {
    id: "jp-3",
    name: "Wok-Seared Sesame Tofu with Bok Choy & Shiitake",
    diet: "plant_based",
    dietLabel: "Plant-Based",
    country: "japan",
    countryLabel: "Japan",
    slot: "dinner",
    servingSize: 1,
    servingUnit: "plate",
    portionDesc: "1 plate (310g)",
    calories: 380,
    protein: 26,
    carbs: 22,
    fat: 20,
    fiber: 7,
    emoji: "🥢",
    highlight: "Immune-supportive shiitake beta-glucans with crisp brassica greens",
  },
  {
    id: "jp-4",
    name: "Steamed Edamame Pods with Sea Salt",
    diet: "plant_based",
    dietLabel: "Plant-Based",
    country: "japan",
    countryLabel: "Japan",
    slot: "snack",
    servingSize: 1,
    servingUnit: "cup",
    portionDesc: "1 cup in pods (155g)",
    calories: 190,
    protein: 18,
    carbs: 14,
    fat: 8,
    fiber: 8,
    emoji: "🫛",
    highlight: "Complete botanical amino acids with clean dietary satiety",
  },

  // --- ITALY & MEDITERRANEAN ---
  {
    id: "it-1",
    name: "Avocado Sourdough with Poached Free-Range Egg",
    diet: "mediterranean",
    dietLabel: "Mediterranean",
    country: "italy",
    countryLabel: "Italy",
    slot: "breakfast",
    servingSize: 1,
    servingUnit: "serving",
    portionDesc: "1 artisan slice (185g)",
    calories: 360,
    protein: 15,
    carbs: 34,
    fat: 19,
    fiber: 7,
    emoji: "🥑",
    highlight: "Monounsaturated oleic acid paired with natural fermented sourdough",
  },
  {
    id: "it-2",
    name: "Greek Yogurt with Blueberries, Walnuts & Honey",
    diet: "mediterranean",
    dietLabel: "Mediterranean",
    country: "italy",
    countryLabel: "Italy",
    slot: "breakfast",
    servingSize: 1,
    servingUnit: "cup",
    portionDesc: "1 cup (220g)",
    calories: 270,
    protein: 22,
    carbs: 24,
    fat: 10,
    fiber: 4,
    emoji: "🫐",
    highlight: "Cultured bio-active protein with brain-supportive polyphenols",
  },
  {
    id: "it-3",
    name: "Wild Salmon & Quinoa Mediterranean Harvest Bowl",
    diet: "mediterranean",
    dietLabel: "Mediterranean",
    country: "italy",
    countryLabel: "Italy",
    slot: "lunch",
    servingSize: 1,
    servingUnit: "bowl",
    portionDesc: "1 bowl (340g)",
    calories: 540,
    protein: 42,
    carbs: 48,
    fat: 20,
    fiber: 8,
    emoji: "🥗",
    highlight: "Cold-water marine proteins with ancient Andean gluten-free grain",
  },
  {
    id: "it-4",
    name: "Grilled Sea Bass with Lemon, Roasted Asparagus & EVOO",
    diet: "mediterranean",
    dietLabel: "Mediterranean",
    country: "italy",
    countryLabel: "Italy",
    slot: "dinner",
    servingSize: 1,
    servingUnit: "fillet",
    portionDesc: "1 fillet & veg (290g)",
    calories: 390,
    protein: 38,
    carbs: 14,
    fat: 18,
    fiber: 5,
    emoji: "🐟",
    highlight: "Lean marine protein seasoned with cold-pressed olive oil & herbs",
  },
  {
    id: "it-5",
    name: "Caprese Salad with Basil, Mozzarella & Olive Oil",
    diet: "low_carb",
    dietLabel: "Low-Carb",
    country: "italy",
    countryLabel: "Italy",
    slot: "snack",
    servingSize: 1,
    servingUnit: "plate",
    portionDesc: "1 plate (190g)",
    calories: 240,
    protein: 14,
    carbs: 6,
    fat: 18,
    fiber: 2,
    emoji: "🍅",
    highlight: "Lycopene antioxidant pairing with whole milk dairy and fresh basil",
  },

  // --- MEXICO & LATIN AMERICA ---
  {
    id: "mx-1",
    name: "Huevos Rancheros with Black Beans on Corn Tortilla",
    diet: "mediterranean",
    dietLabel: "Mediterranean",
    country: "mexico",
    countryLabel: "Mexico",
    slot: "breakfast",
    servingSize: 1,
    servingUnit: "plate",
    portionDesc: "2 eggs + 1 tortilla & beans (260g)",
    calories: 350,
    protein: 19,
    carbs: 34,
    fat: 15,
    fiber: 8,
    emoji: "🍳",
    highlight: "Prebiotic black bean fiber with whole grain stoneground maize",
  },
  {
    id: "mx-2",
    name: "Chipotle Grilled Chicken & Roasted Corn Quinoa Bowl",
    diet: "high_protein",
    dietLabel: "High-Protein",
    country: "mexico",
    countryLabel: "Mexico",
    slot: "lunch",
    servingSize: 1,
    servingUnit: "bowl",
    portionDesc: "1 fiesta bowl (350g)",
    calories: 510,
    protein: 46,
    carbs: 48,
    fat: 14,
    fiber: 9,
    emoji: "🍗",
    highlight: "Chipotle-spiced lean chicken breast with antioxidant chili capsicum",
  },
  {
    id: "mx-3",
    name: "Carne Asada with Roasted Nopales & Pinto Beans",
    diet: "low_carb",
    dietLabel: "Low-Carb",
    country: "mexico",
    countryLabel: "Mexico",
    slot: "dinner",
    servingSize: 1,
    servingUnit: "plate",
    portionDesc: "180g flank + cactus & beans (310g)",
    calories: 490,
    protein: 44,
    carbs: 22,
    fat: 22,
    fiber: 8,
    emoji: "🥩",
    highlight: "Nopal cactus pads known for blood sugar stabilization and iron",
  },
  {
    id: "mx-4",
    name: "Fresh Guacamole with Crunchy Jicama & Cucumber Slices",
    diet: "low_carb",
    dietLabel: "Low-Carb",
    country: "mexico",
    countryLabel: "Mexico",
    slot: "snack",
    servingSize: 1,
    servingUnit: "bowl",
    portionDesc: "1 dip bowl (160g)",
    calories: 190,
    protein: 3,
    carbs: 12,
    fat: 16,
    fiber: 7,
    emoji: "🥑",
    highlight: "Heart-healthy potassium fat with hydrating crunchy root vegetable",
  },

  // --- INDIA & SOUTH ASIA ---
  {
    id: "in-1",
    name: "Spiced Moong Dal Chilla with Fresh Mint Chutney",
    diet: "plant_based",
    dietLabel: "Plant-Based",
    country: "india",
    countryLabel: "India",
    slot: "breakfast",
    servingSize: 1,
    servingUnit: "plate",
    portionDesc: "2 savory crepes (200g)",
    calories: 270,
    protein: 16,
    carbs: 36,
    fat: 7,
    fiber: 7,
    emoji: "🥞",
    highlight: "Easy-to-digest yellow split gram pancake with cooling herbal mint",
  },
  {
    id: "in-2",
    name: "Tandoori Spiced Chicken Breast with Brown Basmati & Raita",
    diet: "high_protein",
    dietLabel: "High-Protein",
    country: "india",
    countryLabel: "India",
    slot: "lunch",
    servingSize: 1,
    servingUnit: "meal",
    portionDesc: "1 meal plate (340g)",
    calories: 490,
    protein: 48,
    carbs: 44,
    fat: 12,
    fiber: 5,
    emoji: "🍗",
    highlight: "Turmeric, cumin & ginger spiced lean protein with probiotic yogurt",
  },
  {
    id: "in-3",
    name: "Palak Paneer with Yellow Lentil Tadka",
    diet: "mediterranean",
    dietLabel: "Mediterranean",
    country: "india",
    countryLabel: "India",
    slot: "dinner",
    servingSize: 1,
    servingUnit: "bowl",
    portionDesc: "1 curry bowl (320g)",
    calories: 420,
    protein: 24,
    carbs: 30,
    fat: 20,
    fiber: 8,
    emoji: "🍛",
    highlight: "Fresh spinach pureed with mineral-rich cottage cheese and cumin",
  },
  {
    id: "in-4",
    name: "Roasted Masala Makhana (Fox Nuts) with Turmeric",
    diet: "plant_based",
    dietLabel: "Plant-Based",
    country: "india",
    countryLabel: "India",
    slot: "snack",
    servingSize: 1,
    servingUnit: "bowl",
    portionDesc: "1 bowl (40g)",
    calories: 150,
    protein: 4,
    carbs: 24,
    fat: 5,
    fiber: 4,
    emoji: "🌰",
    highlight: "Light puffed lotus seeds roasted in cold-pressed oil with sea salt",
  },

  // --- UNITED STATES & NORTH AMERICA ---
  {
    id: "us-1",
    name: "Egg White, Spinach & Turkey Bacon Scramble",
    diet: "high_protein",
    dietLabel: "High-Protein",
    country: "united_states",
    countryLabel: "United States",
    slot: "breakfast",
    servingSize: 1,
    servingUnit: "plate",
    portionDesc: "1 scramble plate (240g)",
    calories: 310,
    protein: 36,
    carbs: 8,
    fat: 12,
    fiber: 3,
    emoji: "🍳",
    highlight: "High biological value protein with minimal saturated fat",
  },
  {
    id: "us-2",
    name: "Grilled Lemon Herb Chicken with Steamed Broccoli & Sweet Potato",
    diet: "high_protein",
    dietLabel: "High-Protein",
    country: "united_states",
    countryLabel: "United States",
    slot: "lunch",
    servingSize: 1,
    servingUnit: "meal",
    portionDesc: "200g chicken + veg (360g)",
    calories: 520,
    protein: 52,
    carbs: 45,
    fat: 11,
    fiber: 7,
    emoji: "🍗",
    highlight: "Ultra-lean poultry breast delivering full amino spectrum and beta-carotene",
  },
  {
    id: "us-3",
    name: "Seared Grass-Fed Flank Steak with Roasted Asparagus",
    diet: "low_carb",
    dietLabel: "Low-Carb",
    country: "united_states",
    countryLabel: "United States",
    slot: "dinner",
    servingSize: 1,
    servingUnit: "plate",
    portionDesc: "180g steak + veg (290g)",
    calories: 490,
    protein: 46,
    carbs: 8,
    fat: 28,
    fiber: 4,
    emoji: "🥩",
    highlight: "Natural bioavailable heme iron, zinc, and muscle recovery minerals",
  },
  {
    id: "us-4",
    name: "Low-Fat Cottage Cheese with Crushed Raw Almonds",
    diet: "high_protein",
    dietLabel: "High-Protein",
    country: "united_states",
    countryLabel: "United States",
    slot: "snack",
    servingSize: 1,
    servingUnit: "cup",
    portionDesc: "1 cup (220g)",
    calories: 220,
    protein: 26,
    carbs: 9,
    fat: 8,
    fiber: 2,
    emoji: "🧀",
    highlight: "Slow-release micellar casein protein for sustained amino delivery",
  },

  // --- UNITED KINGDOM & WESTERN EUROPE ---
  {
    id: "uk-1",
    name: "Scottish Rolled Oats with Chia, Berries & Cinnamon",
    diet: "plant_based",
    dietLabel: "Plant-Based",
    country: "united_kingdom",
    countryLabel: "United Kingdom",
    slot: "breakfast",
    servingSize: 1,
    servingUnit: "bowl",
    portionDesc: "1 porridge bowl (280g)",
    calories: 340,
    protein: 12,
    carbs: 58,
    fat: 7,
    fiber: 10,
    emoji: "🥣",
    highlight: "Beta-glucan soluble fiber supporting healthy blood lipids",
  },
  {
    id: "uk-2",
    name: "Poached Eggs on Sourdough with Wilted Spinach (Florentine)",
    diet: "mediterranean",
    dietLabel: "Mediterranean",
    country: "united_kingdom",
    countryLabel: "United Kingdom",
    slot: "breakfast",
    servingSize: 1,
    servingUnit: "plate",
    portionDesc: "2 eggs + 1 slice toast (220g)",
    calories: 320,
    protein: 18,
    carbs: 26,
    fat: 14,
    fiber: 4,
    emoji: "🍳",
    highlight: "Pasture-raised yolk choline for cognitive focus and satiety",
  },
  {
    id: "uk-3",
    name: "Roasted Scottish Salmon Fillet with Steamed Greens & New Potatoes",
    diet: "mediterranean",
    dietLabel: "Mediterranean",
    country: "united_kingdom",
    countryLabel: "United Kingdom",
    slot: "dinner",
    servingSize: 1,
    servingUnit: "plate",
    portionDesc: "1 plate (320g)",
    calories: 470,
    protein: 40,
    carbs: 32,
    fat: 18,
    fiber: 6,
    emoji: "🐟",
    highlight: "North Atlantic omega fats with potassium-rich unpeeled baby potatoes",
  },
];

const MEAL_SLOT_SET = new Set(["breakfast", "lunch", "dinner", "snack", "other", "all"]);

/**
 * Smart recommendation query based on Country, Diet Preference, and optional Meal Slot.
 * Supports:
 * - getRecommendedFoods(country, diet, slot)
 * - getRecommendedFoods(diet, slot)
 * - getRecommendedFoods(countryOrDiet)
 */
export function getRecommendedFoods(
  firstArg?: string | null,
  secondArg?: string | null,
  thirdArg?: MealSlot | "all"
): RecommendedFood[] {
  let country: string | null = null;
  let diet: string | null = null;
  let slot: MealSlot | "all" | undefined = thirdArg;

  const firstNorm = (firstArg || "").toLowerCase();
  const secondNorm = (secondArg || "").toLowerCase();

  // Check if secondArg is a MealSlot
  if (secondNorm && MEAL_SLOT_SET.has(secondNorm)) {
    slot = secondNorm as MealSlot | "all";
  } else if (secondNorm) {
    diet = secondNorm;
  }

  // Check if firstArg is a country or diet
  const isCountry = COUNTRY_OPTIONS.some((c) => c.id === firstNorm);
  const isDiet = DIETARY_PREFERENCES.some((d) => d.id === firstNorm);

  if (isCountry && firstNorm !== "global") {
    country = firstNorm;
    if (!diet) {
      diet = getAutomatedDietForCountry(firstNorm);
    }
  } else if (isDiet) {
    diet = firstNorm;
  } else if (firstNorm === "global") {
    if (!diet) diet = "mediterranean";
  } else if (!diet) {
    // If firstArg is not recognized as country or diet, default to mediterranean
    diet = "mediterranean";
  }

  let results: RecommendedFood[] = [];

  // 1. If country specified and not filtered out, pick country foods
  if (country) {
    results = RECOMMENDED_FOODS_CATALOG.filter((f) => f.country === country);
  }

  // 2. If no country foods found or not country-specific, filter by diet
  if (results.length === 0 && diet) {
    results = RECOMMENDED_FOODS_CATALOG.filter((f) => f.diet === diet);
  }

  // 3. Fallback to mediterranean if still empty
  if (results.length === 0) {
    results = RECOMMENDED_FOODS_CATALOG.filter((f) => f.diet === "mediterranean");
  }

  // Filter by slot if requested
  if (slot && slot !== "all") {
    const slotMatches = results.filter((f) => f.slot === slot);
    if (slotMatches.length > 0) return slotMatches;
  }

  return results;
}

