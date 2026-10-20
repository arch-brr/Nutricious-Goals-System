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

export type HealthConditionId =
  | "proper_diet"
  | "low_carb"
  | "ckd_renal"
  | "chemo_soft"
  | "hypertension";

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

export const HEALTH_CONDITIONS: {
  id: HealthConditionId;
  label: string;
  tagline: string;
  description: string;
  defaultCalories: number;
  macroRatios: { protein: number; carbs: number; fat: number };
  badgeColor: string;
}[] = [
  {
    id: "proper_diet",
    label: "Proper Diet & General Health",
    tagline: "Balanced Standard Nutrition",
    description: "Wholesome macronutrient balance for daily energy, mental focus, and metabolic wellness.",
    defaultCalories: 2000,
    macroRatios: { protein: 25, carbs: 50, fat: 25 },
    badgeColor: "#16a34a",
  },
  {
    id: "low_carb",
    label: "Low-Carb & Diabetes Mindful",
    tagline: "Regulated Carbs, High Protein, Healthy Fats",
    description: "Limits fast carbohydrates (white rice, sugar) to moderate blood glucose spikes. Features controlled carbs, lean proteins, and nourishing fats.",
    defaultCalories: 1600,
    macroRatios: { protein: 35, carbs: 20, fat: 45 },
    badgeColor: "#0284c7",
  },
  {
    id: "ckd_renal",
    label: "CKD Renal Care (Non-Dialysis)",
    tagline: "Controlled Protein, Low Sodium & Leached Veggies",
    description: "Adapts dishes with controlled protein (0.6–0.8g/kg/day), low-sodium substitutes (calamansi, garlic), and double-boiled potassium vegetables.",
    defaultCalories: 1600,
    macroRatios: { protein: 18, carbs: 55, fat: 27 },
    badgeColor: "#d97706",
  },
  {
    id: "chemo_soft",
    label: "Chemo Support & Soothing Diet",
    tagline: "Soft, Neutropenic Safe & Anti-Nausea",
    description: "Gentle comfort meals (arroz caldo, lugaw, misua), fully cooked neutropenic ingredients, and natural ginger/salabat infusions for appetite support.",
    defaultCalories: 1650,
    macroRatios: { protein: 22, carbs: 53, fat: 25 },
    badgeColor: "#8b5cf6",
  },
  {
    id: "hypertension",
    label: "Hypertension & Heart Healthy",
    tagline: "Low Sodium & Potassium Rich",
    description: "Eliminates patis and bagoong; enhances savory flavors with fresh ginger, lemongrass, calamansi, and mineral-dense local greens.",
    defaultCalories: 1850,
    macroRatios: { protein: 25, carbs: 50, fat: 25 },
    badgeColor: "#e11d48",
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

// --- Target Calorie Scaler Helper ---
export function scaleFoodToTargetCalories<T extends {
  calories: number;
  servingSize: number;
  servingUnit: string;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  fiber?: number | null;
}>(food: T, targetCalories: number) {
  if (!food.calories || targetCalories <= 0) return { ...food, multiplier: 1 };
  const multiplier = Math.round((targetCalories / food.calories) * 100) / 100;
  return {
    ...food,
    multiplier,
    servingSize: Math.round(food.servingSize * multiplier * 100) / 100,
    calories: Math.round(targetCalories),
    protein: food.protein !== undefined && food.protein !== null ? Math.round(food.protein * multiplier * 10) / 10 : null,
    carbs: food.carbs !== undefined && food.carbs !== null ? Math.round(food.carbs * multiplier * 10) / 10 : null,
    fat: food.fat !== undefined && food.fat !== null ? Math.round(food.fat * multiplier * 10) / 10 : null,
    fiber: food.fiber !== undefined && food.fiber !== null ? Math.round(food.fiber * multiplier * 10) / 10 : null,
  };
}

// --- Pinoy Breakfast Combo Options ---
export const PINOY_BREAKFAST_COMBO_OPTIONS = {
  eggs: [
    {
      id: "eggs_boiled_2",
      name: "2 pirasong Itlog (Pinakuluan)",
      portionDesc: "2 large hard-boiled eggs (100g)",
      servingSize: 2,
      servingUnit: "pcs",
      calories: 140,
      protein: 12,
      carbs: 1,
      fat: 10,
      fiber: 0,
    },
    {
      id: "eggs_scrambled_2",
      name: "2 pirasong Itlog (Scrambled with tomato/oil)",
      portionDesc: "2 eggs lightly scrambled (110g)",
      servingSize: 2,
      servingUnit: "pcs",
      calories: 160,
      protein: 12,
      carbs: 2,
      fat: 12,
      fiber: 0.5,
    },
    {
      id: "eggs_boiled_1",
      name: "1 pirasong Itlog (Pinakuluan)",
      portionDesc: "1 hard-boiled egg (50g)",
      servingSize: 1,
      servingUnit: "pc",
      calories: 70,
      protein: 6,
      carbs: 0.5,
      fat: 5,
      fiber: 0,
    },
    {
      id: "eggs_none",
      name: "Walang Itlog",
      portionDesc: "None",
      servingSize: 0,
      servingUnit: "serving",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    },
  ],
  carbs: [
    {
      id: "carb_rice_1",
      name: "1 tasa ng Kanin (Cooked White Rice)",
      portionDesc: "1 cup cooked (150g)",
      servingSize: 1,
      servingUnit: "cup",
      calories: 200,
      protein: 4,
      carbs: 44,
      fat: 0.4,
      fiber: 0.6,
    },
    {
      id: "carb_garlic_rice_1",
      name: "1 tasa ng Sinangag (Garlic Fried Rice)",
      portionDesc: "1 cup toasted garlic rice (160g)",
      servingSize: 1,
      servingUnit: "cup",
      calories: 220,
      protein: 4,
      carbs: 45,
      fat: 3,
      fiber: 1,
    },
    {
      id: "carb_wheat_2",
      name: "2 hiwa ng Wheat Bread",
      portionDesc: "2 slices whole wheat toast (60g)",
      servingSize: 2,
      servingUnit: "slices",
      calories: 160,
      protein: 6,
      carbs: 28,
      fat: 2,
      fiber: 3,
    },
    {
      id: "carb_pandesal_3",
      name: "3 pirasong Pandesal",
      portionDesc: "3 traditional bakery pandesal (90g)",
      servingSize: 3,
      servingUnit: "pcs",
      calories: 240,
      protein: 7,
      carbs: 45,
      fat: 3,
      fiber: 1.5,
    },
    {
      id: "carb_none",
      name: "Walang Kanin / Tinapay",
      portionDesc: "None",
      servingSize: 0,
      servingUnit: "serving",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    },
  ],
  fruits: [
    {
      id: "fruit_saba_1",
      name: "1 saging (Nilagang Saba)",
      portionDesc: "1 boiled saba banana (80g)",
      servingSize: 1,
      servingUnit: "pc",
      calories: 90,
      protein: 1,
      carbs: 23,
      fat: 0,
      fiber: 2,
    },
    {
      id: "fruit_banana_1",
      name: "1 saging (Latundan / Cavendish)",
      portionDesc: "1 medium fresh banana (118g)",
      servingSize: 1,
      servingUnit: "pc",
      calories: 105,
      protein: 1.3,
      carbs: 27,
      fat: 0.3,
      fiber: 3.1,
    },
    {
      id: "fruit_mango_1",
      name: "1 kapirasong Mangga (Hinog na Carabao)",
      portionDesc: "1 cheek ripe mango (100g)",
      servingSize: 1,
      servingUnit: "serving",
      calories: 70,
      protein: 0.8,
      carbs: 17,
      fat: 0.4,
      fiber: 1.8,
    },
    {
      id: "fruit_none",
      name: "Walang Prutas",
      portionDesc: "None",
      servingSize: 0,
      servingUnit: "serving",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    },
  ],
  water: [
    {
      id: "water_1",
      name: "Tubig: 1 baso (250ml)",
      ml: 250,
      glasses: 1,
    },
    {
      id: "water_2",
      name: "Tubig: 2 baso (500ml)",
      ml: 500,
      glasses: 2,
    },
    {
      id: "water_salabat",
      name: "Warm Salabat / Ginger Tea (250ml)",
      ml: 250,
      glasses: 1,
    },
  ],
};

// --- Comprehensive Recommended Foods Catalog (Including PDF Datasets) ---
export const RECOMMENDED_FOODS_CATALOG: RecommendedFood[] = [
  // --- EVERYDAY PINOY NUTRITION LOG (PDF 1 DATASET) ---
  {
    id: "pinoy-tosilog",
    name: "Tosilog: 2 Slices Sweet Tocino, 1 Egg, 1 cup Garlic Rice",
    diet: "asian_pacific",
    dietLabel: "Asian-Pacific",
    country: "philippines",
    countryLabel: "Philippines",
    slot: "breakfast",
    servingSize: 1,
    servingUnit: "plate",
    portionDesc: "2 slices tocino, 1 fried egg, 1 cup garlic rice",
    calories: 480,
    protein: 20,
    carbs: 52,
    fat: 21,
    fiber: 1,
    emoji: "🍳",
    highlight: "Classic Pinoy breakfast staple with protein and garlic fried rice",
  },
  {
    id: "pinoy-munggo",
    name: "Ginisang Munggo with Dahon ng Sili & Pork strips + 1 cup White Rice",
    diet: "asian_pacific",
    dietLabel: "Asian-Pacific",
    country: "philippines",
    countryLabel: "Philippines",
    slot: "lunch",
    servingSize: 1,
    servingUnit: "bowl",
    portionDesc: "1 bowl munggo soup + 1 cup white rice",
    calories: 450,
    protein: 24,
    carbs: 62,
    fat: 11,
    fiber: 8,
    emoji: "🍲",
    highlight: "Fiber and iron-rich mung bean stew with native chili leaves",
  },
  {
    id: "pinoy-saba-snack",
    name: "Saba: 2 pcs Boiled Saba Banana",
    diet: "asian_pacific",
    dietLabel: "Asian-Pacific",
    country: "philippines",
    countryLabel: "Philippines",
    slot: "snack",
    servingSize: 2,
    servingUnit: "pcs",
    portionDesc: "2 boiled native saba bananas",
    calories: 180,
    protein: 2,
    carbs: 45,
    fat: 0,
    fiber: 4,
    emoji: "🍌",
    highlight: "Sustained carbohydrate snack with prebiotic dietary fiber",
  },
  {
    id: "pinoy-pork-adobo",
    name: "Pork Adobo: 2 cuts Pork with Adobo sauce + 1 cup White Rice",
    diet: "asian_pacific",
    dietLabel: "Asian-Pacific",
    country: "philippines",
    countryLabel: "Philippines",
    slot: "dinner",
    servingSize: 1,
    servingUnit: "plate",
    portionDesc: "2 cuts pork braised in garlic vinegar + 1 cup rice",
    calories: 540,
    protein: 30,
    carbs: 53,
    fat: 20,
    fiber: 2,
    emoji: "🍛",
    highlight: "Iconic Filipino braised savory pork with natural garlic and peppercorns",
  },
  {
    id: "pinoy-tapsilog",
    name: "Tapsilog: 80g Beef Tapa, 1 Fried Egg, 1 cup Garlic Rice",
    diet: "high_protein",
    dietLabel: "High Protein",
    country: "philippines",
    countryLabel: "Philippines",
    slot: "breakfast",
    servingSize: 1,
    servingUnit: "plate",
    portionDesc: "80g cured lean beef tapa, 1 egg, 1 cup garlic rice",
    calories: 460,
    protein: 28,
    carbs: 50,
    fat: 16,
    fiber: 1,
    emoji: "🥩",
    highlight: "High protein cured beef with garlic sinangag and sunny-side egg",
  },
  {
    id: "pinoy-chicken-tinola",
    name: "Chicken Tinola: 1 thigh/leg with Sayote & Dahon ng Sili + 1 cup Rice",
    diet: "asian_pacific",
    dietLabel: "Asian-Pacific",
    country: "philippines",
    countryLabel: "Philippines",
    slot: "lunch",
    servingSize: 1,
    servingUnit: "bowl",
    portionDesc: "1 hearty bowl chicken ginger broth + 1 cup rice",
    calories: 420,
    protein: 32,
    carbs: 52,
    fat: 10,
    fiber: 3,
    emoji: "🥣",
    highlight: "Warming ginger broth with fresh green sayote and moringa/chili greens",
  },
  {
    id: "pinoy-turon",
    name: "Turon: 1 pc Banana Turon with Jackfruit",
    diet: "asian_pacific",
    dietLabel: "Asian-Pacific",
    country: "philippines",
    countryLabel: "Philippines",
    slot: "snack",
    servingSize: 1,
    servingUnit: "pc",
    portionDesc: "1 crisp banana & langka spring roll",
    calories: 210,
    protein: 2,
    carbs: 36,
    fat: 7,
    fiber: 2,
    emoji: "🥟",
    highlight: "Traditional Filipino afternoon merienda snack",
  },
  {
    id: "pinoy-pritong-tilapia",
    name: "Pritong Tilapia: 1 medium Fried Tilapia, 1 cup Rice + Kangkong Sauté",
    diet: "high_protein",
    dietLabel: "High Protein",
    country: "philippines",
    countryLabel: "Philippines",
    slot: "dinner",
    servingSize: 1,
    servingUnit: "plate",
    portionDesc: "1 whole fried tilapia + 1 cup rice + sautéed kangkong",
    calories: 500,
    protein: 39,
    carbs: 60,
    fat: 19,
    fiber: 8,
    emoji: "🐟",
    highlight: "High protein freshwater fish paired with fiber-loaded sautéed greens",
  },
  {
    id: "pinoy-pandesal-egg",
    name: "Pandesal & Egg: 3 pcs Pan de Sal + Scrambled Egg with Tomatoes",
    diet: "asian_pacific",
    dietLabel: "Asian-Pacific",
    country: "philippines",
    countryLabel: "Philippines",
    slot: "breakfast",
    servingSize: 1,
    servingUnit: "plate",
    portionDesc: "3 warm pandesal + 1 scrambled egg with fresh native tomatoes",
    calories: 380,
    protein: 14,
    carbs: 52,
    fat: 13,
    fiber: 2,
    emoji: "🥖",
    highlight: "Light morning bread paired with antioxidant-rich tomato egg scramble",
  },
  {
    id: "pinoy-sinigang-baboy",
    name: "Sinigang na Baboy: 2 cuts Pork ribs with Kangkong, Radish, Gabi + Rice",
    diet: "asian_pacific",
    dietLabel: "Asian-Pacific",
    country: "philippines",
    countryLabel: "Philippines",
    slot: "lunch",
    servingSize: 1,
    servingUnit: "bowl",
    portionDesc: "Tamarind sour broth with pork ribs, kangkong, radish + 1 cup rice",
    calories: 520,
    protein: 26,
    carbs: 58,
    fat: 20,
    fiber: 6,
    emoji: "🍲",
    highlight: "Vitamin C packed sour soup loaded with fresh vegetables and taro",
  },
  {
    id: "pinoy-corned-beef-silog",
    name: "Corned Beef Silog: 1/2 cup Sautéed Corned Beef, 1 Egg, 1 cup Garlic Rice",
    diet: "high_protein",
    dietLabel: "High Protein",
    country: "philippines",
    countryLabel: "Philippines",
    slot: "breakfast",
    servingSize: 1,
    servingUnit: "plate",
    portionDesc: "Sautéed corned beef with onions, sunny-side egg, garlic rice",
    calories: 490,
    protein: 22,
    carbs: 50,
    fat: 22,
    fiber: 1,
    emoji: "🍳",
    highlight: "Hearty breakfast plate with high protein and caramelized onions",
  },
  {
    id: "pinoy-bangsilog",
    name: "Bangsilog: 1/2 Fried Boneless Bangus, 1 Egg, 1 cup Garlic Rice",
    diet: "high_protein",
    dietLabel: "High Protein",
    country: "philippines",
    countryLabel: "Philippines",
    slot: "breakfast",
    servingSize: 1,
    servingUnit: "plate",
    portionDesc: "1/2 marinated fried milkfish, 1 egg, garlic rice",
    calories: 470,
    protein: 27,
    carbs: 50,
    fat: 18,
    fiber: 1,
    emoji: "🐟",
    highlight: "Rich in omega-3 healthy fatty acids from native milkfish",
  },
  {
    id: "pinoy-hard-boiled-eggs",
    name: "Hard Boiled Eggs: 2 Whole Eggs with Pepper",
    diet: "low_carb",
    dietLabel: "Low-Carb",
    country: "philippines",
    countryLabel: "Philippines",
    slot: "snack",
    servingSize: 2,
    servingUnit: "pcs",
    portionDesc: "2 large eggs (100g)",
    calories: 140,
    protein: 12,
    carbs: 1,
    fat: 10,
    fiber: 0,
    emoji: "🥚",
    highlight: "Pure zero-carb protein snack with high bioavailable choline and lutein",
  },
  {
    id: "pinoy-chicken-inasal",
    name: "Chicken Inasal: 1 Grilled Leg/Thigh, 1 cup Rice + Calamansi Soy Dip",
    diet: "high_protein",
    dietLabel: "High Protein",
    country: "philippines",
    countryLabel: "Philippines",
    slot: "dinner",
    servingSize: 1,
    servingUnit: "plate",
    portionDesc: "1 lemongrass-marinated grilled chicken quarter + 1 cup rice",
    calories: 560,
    protein: 38,
    carbs: 93,
    fat: 10,
    fiber: 6,
    emoji: "🍗",
    highlight: "Bacolod style flame-grilled chicken marinated in calamansi and annatto",
  },
  {
    id: "pinoy-champorado",
    name: "Champorado: 1 bowl Cocoa Sticky Rice Porridge with 3 pcs Fried Tuyo",
    diet: "asian_pacific",
    dietLabel: "Asian-Pacific",
    country: "philippines",
    countryLabel: "Philippines",
    slot: "breakfast",
    servingSize: 1,
    servingUnit: "bowl",
    portionDesc: "1 bowl pure cocoa rice porridge + 3 dried herring fish",
    calories: 420,
    protein: 18,
    carbs: 68,
    fat: 8,
    fiber: 3,
    emoji: "🍫",
    highlight: "Traditional sweet and salty contrast with native tablea chocolate",
  },
  {
    id: "pinoy-tortang-talong",
    name: "Tortang Talong: Eggplant Omelet (1 whole eggplant + 1 egg) + 1 cup Rice",
    diet: "plant_based",
    dietLabel: "Plant-Based",
    country: "philippines",
    countryLabel: "Philippines",
    slot: "dinner",
    servingSize: 1,
    servingUnit: "plate",
    portionDesc: "1 grilled skinned eggplant dipped in egg + 1 cup rice",
    calories: 480,
    protein: 24,
    carbs: 68,
    fat: 11,
    fiber: 10,
    emoji: "🍆",
    highlight: "High fiber roasted eggplant pan-fried in wholesome egg batter",
  },
  {
    id: "pinoy-arroz-caldo",
    name: "Arroz Caldo: 1 bowl Chicken Rice Porridge with Boiled Egg & Toasted Garlic",
    diet: "asian_pacific",
    dietLabel: "Asian-Pacific",
    country: "philippines",
    countryLabel: "Philippines",
    slot: "breakfast",
    servingSize: 1,
    servingUnit: "bowl",
    portionDesc: "1 comforting bowl ginger chicken congee with egg and toasted garlic",
    calories: 390,
    protein: 19,
    carbs: 52,
    fat: 11,
    fiber: 2,
    emoji: "🍲",
    highlight: "Soothes digestion with anti-inflammatory ginger and restorative broth",
  },
  {
    id: "pinoy-mango-slice",
    name: "Fresh Mango Slices: 1 Cheek Sweet Philippine Mango",
    diet: "mediterranean",
    dietLabel: "Mediterranean",
    country: "philippines",
    countryLabel: "Philippines",
    slot: "snack",
    servingSize: 1,
    servingUnit: "serving",
    portionDesc: "1 cheek ripe Carabao mango (100g)",
    calories: 110,
    protein: 1,
    carbs: 27,
    fat: 0,
    fiber: 3,
    emoji: "🥭",
    highlight: "World-famous sweet Philippine Carabao mango loaded with Vitamin A & C",
  },
  {
    id: "pinoy-steamed-white-rice",
    name: "Kanin: 1 Tasa ng Cooked White Rice (150g)",
    diet: "asian_pacific",
    dietLabel: "Asian-Pacific",
    country: "philippines",
    countryLabel: "Philippines",
    slot: "other",
    servingSize: 1,
    servingUnit: "cup",
    portionDesc: "1 standard cooked cup (150g)",
    calories: 200,
    protein: 4,
    carbs: 44,
    fat: 0.4,
    fiber: 0.6,
    emoji: "🍚",
    highlight: "Standard Philippine staple baseline rice serving",
  },
  {
    id: "pinoy-wheat-bread-2",
    name: "2 Hiwa ng Wheat Bread",
    diet: "mediterranean",
    dietLabel: "Mediterranean",
    country: "philippines",
    countryLabel: "Philippines",
    slot: "other",
    servingSize: 2,
    servingUnit: "slices",
    portionDesc: "2 slices toasted whole wheat bread (60g)",
    calories: 160,
    protein: 6,
    carbs: 28,
    fat: 2,
    fiber: 3,
    emoji: "🍞",
    highlight: "Whole grain complex carbs with sustained digestive release",
  },

  // --- CLINICAL TRI-CONDITION DATASET (DIABETES, CKD, CHEMO - PDF 2) ---
  {
    id: "clin-arroz-caldo",
    name: "Clinical Arroz Caldo: 1 cup Lugaw with 2 oz Chicken Breast, Garlic & Ginger",
    diet: "asian_pacific",
    dietLabel: "Clinical Soft",
    country: "philippines",
    countryLabel: "Philippines",
    slot: "breakfast",
    servingSize: 1,
    servingUnit: "bowl",
    portionDesc: "1 cup soft lugaw with 2 oz lean chicken breast & ginger",
    calories: 320,
    protein: 24,
    carbs: 44,
    fat: 5,
    fiber: 2,
    emoji: "🥣",
    highlight: "Soothing on stomach lining; neutropenic safe fully cooked protein",
  },
  {
    id: "clin-upo-pork",
    name: "Ginisang Upo with 2 oz Lean Pork Loin + 1/2 cup Cooked Rice",
    diet: "low_carb",
    dietLabel: "Renal & Diabetic",
    country: "philippines",
    countryLabel: "Philippines",
    slot: "lunch",
    servingSize: 1,
    servingUnit: "plate",
    portionDesc: "Leached bottle gourd with 2 oz pork loin + 1/2 cup rice",
    calories: 280,
    protein: 22,
    carbs: 30,
    fat: 7,
    fiber: 3,
    emoji: "🥗",
    highlight: "Controlled protein and portioned 1/2 cup rice to protect kidneys and sugar",
  },
  {
    id: "clin-baked-tilapia",
    name: "Baked Tilapia Fillet (3 oz) with Calamansi & Steamed Repolyo + 1/2 cup Rice",
    diet: "high_protein",
    dietLabel: "Clinical Renal",
    country: "philippines",
    countryLabel: "Philippines",
    slot: "dinner",
    servingSize: 1,
    servingUnit: "plate",
    portionDesc: "3 oz unseasoned baked tilapia, calamansi drizzle, steamed cabbage + 1/2 c rice",
    calories: 260,
    protein: 26,
    carbs: 26,
    fat: 5,
    fiber: 3,
    emoji: "🐟",
    highlight: "Zero patis/bagoong low-sodium fish with citrus flavor enhancer",
  },
  {
    id: "clin-egg-whites-toast",
    name: "Scrambled Egg Whites (2) with Diced Kamatis + 1 slice Sourdough Toast",
    diet: "low_carb",
    dietLabel: "Renal & Diabetic",
    country: "philippines",
    countryLabel: "Philippines",
    slot: "breakfast",
    servingSize: 1,
    servingUnit: "plate",
    portionDesc: "2 egg whites scrambled with fresh tomatoes + 1 slice sourdough",
    calories: 160,
    protein: 12,
    carbs: 22,
    fat: 2,
    fiber: 2,
    emoji: "🍳",
    highlight: "Phosphorus-controlled egg white protein gentle on kidney filtration",
  },

  // --- WESTERN, ASIAN & MEDITERRANEAN COMPANIONS ---
  {
    id: "us-1",
    name: "Herb-Grilled Chicken Breast with Quinoa & Steamed Broccoli",
    diet: "high_protein",
    dietLabel: "High Protein",
    country: "united_states",
    countryLabel: "United States",
    slot: "dinner",
    servingSize: 1,
    servingUnit: "plate",
    portionDesc: "1 grilled breast, 1/2 cup quinoa, broccoli (320g)",
    calories: 420,
    protein: 48,
    carbs: 32,
    fat: 9,
    fiber: 6,
    emoji: "🍗",
    highlight: "Lean protein powerhouse with cruciferous sulforaphane vegetables",
  },
  {
    id: "it-med-breakfast-1",
    name: "Greek Yogurt Parfait with Wild Berries, Walnuts & Honey",
    diet: "mediterranean",
    dietLabel: "Mediterranean",
    country: "italy",
    countryLabel: "Italy",
    slot: "breakfast",
    servingSize: 1,
    servingUnit: "bowl",
    portionDesc: "200g Greek yogurt, 1/2 cup mixed berries, 1 tbsp walnuts & honey",
    calories: 280,
    protein: 20,
    carbs: 26,
    fat: 10,
    fiber: 4,
    emoji: "🫐",
    highlight: "Probiotic-rich morning parfait with heart-healthy omega-3 walnuts",
  },
  {
    id: "it-med-breakfast-2",
    name: "Mediterranean Olive Oil Toast with Smashed Avocado & Poached Egg",
    diet: "mediterranean",
    dietLabel: "Mediterranean",
    country: "italy",
    countryLabel: "Italy",
    slot: "breakfast",
    servingSize: 1,
    servingUnit: "plate",
    portionDesc: "1 slice crusty sourdough, 1/2 avocado, 1 poached egg, extra virgin olive oil drizzle",
    calories: 320,
    protein: 14,
    carbs: 24,
    fat: 18,
    fiber: 5,
    emoji: "🥑",
    highlight: "Monounsaturated fats with whole grain carbohydrates and high-bioavailability egg protein",
  },
  {
    id: "it-1",
    name: "Mediterranean Pan-Seared Sea Bass with Rosemary Potatoes",
    diet: "mediterranean",
    dietLabel: "Mediterranean",
    country: "italy",
    countryLabel: "Italy",
    slot: "dinner",
    servingSize: 1,
    servingUnit: "plate",
    portionDesc: "1 fillet with roasted fingerlings & cherry tomatoes (290g)",
    calories: 420,
    protein: 36,
    carbs: 28,
    fat: 18,
    fiber: 4,
    emoji: "🐟",
    highlight: "Extra virgin olive oil healthy fats with wild heart-healthy seafood",
  },
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
    protein: 10,
    carbs: 12,
    fat: 5,
    fiber: 3,
    emoji: "🍲",
    highlight: "Fermented prebiotic probiotic baseline broth for gut microflora",
  },
];

// --- 7-Day Cycle Data Presets (Everyday Pinoy & Clinical) ---
export type DayMealCycle = {
  dayNumber: number;
  dayLabel: string;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  targetFiber: number;
  meals: {
    slot: MealSlot;
    name: string;
    portion: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  }[];
};

export const PINOY_EVERYDAY_7DAY_CYCLE: DayMealCycle[] = [
  {
    dayNumber: 1,
    dayLabel: "Day 1 (Everyday Pinoy)",
    targetCalories: 1650,
    targetProtein: 76,
    targetCarbs: 212,
    targetFat: 52,
    targetFiber: 15,
    meals: [
      {
        slot: "breakfast",
        name: "Tosilog: 2 slices Sweet Tocino, 1 Sunny-side Egg, 1 cup Garlic Rice",
        portion: "1 plate",
        calories: 480,
        protein: 20,
        carbs: 52,
        fat: 21,
        fiber: 1,
      },
      {
        slot: "lunch",
        name: "Ginisang Munggo with Dahon ng Sili & Pork strips + 1 cup White Rice",
        portion: "1 bowl + 1 cup rice",
        calories: 450,
        protein: 24,
        carbs: 62,
        fat: 11,
        fiber: 8,
      },
      {
        slot: "snack",
        name: "Saba: 2 pcs Boiled Saba Banana",
        portion: "2 pcs",
        calories: 180,
        protein: 2,
        carbs: 45,
        fat: 0,
        fiber: 4,
      },
      {
        slot: "dinner",
        name: "Pork Adobo: 2 cuts Pork Belly/Pigue with Adobo sauce + 1 cup White Rice",
        portion: "1 plate",
        calories: 540,
        protein: 30,
        carbs: 53,
        fat: 20,
        fiber: 2,
      },
    ],
  },
  {
    dayNumber: 2,
    dayLabel: "Day 2 (Everyday Pinoy)",
    targetCalories: 1590,
    targetProtein: 81,
    targetCarbs: 198,
    targetFat: 52,
    targetFiber: 14,
    meals: [
      {
        slot: "breakfast",
        name: "Tapsilog: 80g Beef Tapa, 1 Fried Egg, 1 cup Garlic Rice",
        portion: "1 plate",
        calories: 460,
        protein: 28,
        carbs: 50,
        fat: 16,
        fiber: 1,
      },
      {
        slot: "lunch",
        name: "Chicken Tinola: 1 thigh/leg with Sayote & Dahon ng Sili + 1 cup Rice",
        portion: "1 bowl + 1 cup rice",
        calories: 420,
        protein: 32,
        carbs: 52,
        fat: 10,
        fiber: 3,
      },
      {
        slot: "snack",
        name: "Turon: 1 pc Banana Turon with Jackfruit",
        portion: "1 pc",
        calories: 210,
        protein: 2,
        carbs: 36,
        fat: 7,
        fiber: 2,
      },
      {
        slot: "dinner",
        name: "Pritong Tilapia: 1 medium Fried Tilapia, 1 cup White Rice + Kangkong Sauté",
        portion: "1 plate",
        calories: 500,
        protein: 39,
        carbs: 60,
        fat: 19,
        fiber: 8,
      },
    ],
  },
  {
    dayNumber: 3,
    dayLabel: "Day 3 (Everyday Pinoy)",
    targetCalories: 1620,
    targetProtein: 71,
    targetCarbs: 215,
    targetFat: 51,
    targetFiber: 16,
    meals: [
      {
        slot: "breakfast",
        name: "Pandesal & Egg: 3 pcs Pan de Sal + scrambled egg with tomatoes",
        portion: "3 pcs + egg",
        calories: 380,
        protein: 14,
        carbs: 52,
        fat: 13,
        fiber: 2,
      },
      {
        slot: "lunch",
        name: "Sinigang na Baboy: 2 cuts Pork ribs with Kangkong, Radish, Gabi + 1 cup Rice",
        portion: "1 bowl + 1 cup rice",
        calories: 520,
        protein: 26,
        carbs: 58,
        fat: 20,
        fiber: 6,
      },
      {
        slot: "snack",
        name: "Mais: 1 cob Boiled Sweet Corn",
        portion: "1 cob",
        calories: 150,
        protein: 5,
        carbs: 32,
        fat: 2,
        fiber: 4,
      },
      {
        slot: "dinner",
        name: "Ginisang Sayote: Sautéed Sayote with Ground Pork + 1 cup White Rice",
        portion: "1 plate",
        calories: 570,
        protein: 26,
        carbs: 73,
        fat: 16,
        fiber: 4,
      },
    ],
  },
  {
    dayNumber: 4,
    dayLabel: "Day 4 (Everyday Pinoy)",
    targetCalories: 1610,
    targetProtein: 74,
    targetCarbs: 205,
    targetFat: 54,
    targetFiber: 13,
    meals: [
      {
        slot: "breakfast",
        name: "Corned Beef Silog: 1/2 cup sautéed corned beef, 1 Egg, 1 cup Garlic Rice",
        portion: "1 plate",
        calories: 490,
        protein: 22,
        carbs: 50,
        fat: 22,
        fiber: 1,
      },
      {
        slot: "lunch",
        name: "Pork Menudo: 1 cup Menudo with potatoes, carrots, raisins + 1 cup Rice",
        portion: "1 bowl + 1 cup rice",
        calories: 530,
        protein: 27,
        carbs: 58,
        fat: 21,
        fiber: 5,
      },
      {
        slot: "snack",
        name: "Taho: 1 medium cup Taho (Sago, Arnibal, Soft Tofu)",
        portion: "1 medium cup",
        calories: 180,
        protein: 7,
        carbs: 32,
        fat: 3,
        fiber: 1,
      },
      {
        slot: "dinner",
        name: "Ginisang Repolyo: Sautéed Cabbage with Chicken breast slices + 1 cup Rice",
        portion: "1 plate",
        calories: 410,
        protein: 28,
        carbs: 65,
        fat: 8,
        fiber: 6,
      },
    ],
  },
  {
    dayNumber: 5,
    dayLabel: "Day 5 (Everyday Pinoy)",
    targetCalories: 1580,
    targetProtein: 79,
    targetCarbs: 202,
    targetFat: 48,
    targetFiber: 12,
    meals: [
      {
        slot: "breakfast",
        name: "Bangsilog: 1/2 Fried Boneless Bangus, 1 Egg, 1 cup Garlic Rice",
        portion: "1 plate",
        calories: 470,
        protein: 27,
        carbs: 50,
        fat: 18,
        fiber: 1,
      },
      {
        slot: "lunch",
        name: "Chicken Afritada: 1 portion Chicken in tomato sauce with potatoes + 1 cup Rice",
        portion: "1 plate",
        calories: 490,
        protein: 29,
        carbs: 56,
        fat: 16,
        fiber: 4,
      },
      {
        slot: "snack",
        name: "Kamote cue: 1 stick (2 slices Caramelized Sweet Potato)",
        portion: "1 stick",
        calories: 220,
        protein: 2,
        carbs: 46,
        fat: 4,
        fiber: 4,
      },
      {
        slot: "dinner",
        name: "Ginisang Pechay at Tokwa: Sautéed Tofu and Pechay + 1 cup White Rice",
        portion: "1 plate",
        calories: 400,
        protein: 21,
        carbs: 50,
        fat: 10,
        fiber: 3,
      },
    ],
  },
  {
    dayNumber: 6,
    dayLabel: "Day 6 (Everyday Pinoy)",
    targetCalories: 1640,
    targetProtein: 83,
    targetCarbs: 210,
    targetFat: 50,
    targetFiber: 15,
    meals: [
      {
        slot: "breakfast",
        name: "Longsilog: 2 pcs Skinless Longganisa, 1 Egg, 1 cup Garlic Rice",
        portion: "1 plate",
        calories: 510,
        protein: 19,
        carbs: 54,
        fat: 24,
        fiber: 1,
      },
      {
        slot: "lunch",
        name: "Ginataang Sitaw at Kalabasa: Squash & String beans in coconut milk + 1 cup Rice",
        portion: "1 bowl + 1 cup rice",
        calories: 430,
        protein: 14,
        carbs: 62,
        fat: 16,
        fiber: 8,
      },
      {
        slot: "snack",
        name: "Hard Boiled Eggs: 2 whole eggs with salt/pepper",
        portion: "2 eggs",
        calories: 140,
        protein: 12,
        carbs: 1,
        fat: 10,
        fiber: 0,
      },
      {
        slot: "dinner",
        name: "Chicken Inasal: 1 grilled Chicken leg/thigh, 1 cup Rice + soy sauce dip",
        portion: "1 plate",
        calories: 560,
        protein: 38,
        carbs: 93,
        fat: 10,
        fiber: 6,
      },
    ],
  },
  {
    dayNumber: 7,
    dayLabel: "Day 7 (Everyday Pinoy)",
    targetCalories: 1630,
    targetProtein: 78,
    targetCarbs: 218,
    targetFat: 48,
    targetFiber: 14,
    meals: [
      {
        slot: "breakfast",
        name: "Champorado: 1 bowl Cocoa Sticky Rice Porridge with 3 pcs Fried Tuyo",
        portion: "1 bowl + 3 tuyo",
        calories: 420,
        protein: 18,
        carbs: 68,
        fat: 8,
        fiber: 3,
      },
      {
        slot: "lunch",
        name: "Bicol Express: Pork cooked in coconut milk & chili + 1 cup White Rice",
        portion: "1 plate",
        calories: 550,
        protein: 24,
        carbs: 52,
        fat: 28,
        fiber: 3,
      },
      {
        slot: "snack",
        name: "Ginataan Bilo-Bilo: 1 small bowl with gabi, saba, sago",
        portion: "1 small bowl",
        calories: 240,
        protein: 3,
        carbs: 48,
        fat: 5,
        fiber: 3,
      },
      {
        slot: "dinner",
        name: "Inihaw na Liempo: 1 slice Grilled Pork belly + 1 cup Rice + Cucumber salad",
        portion: "1 plate",
        calories: 420,
        protein: 33,
        carbs: 50,
        fat: 7,
        fiber: 5,
      },
    ],
  },
];

// --- Ingredient Aggregation for Shopping List ---
export type IngredientItem = {
  id: string;
  name: string;
  category: "Produce & Greens" | "Meat & Seafood" | "Eggs & Dairy" | "Grains & Bakery" | "Pantry & Seasonings";
  quantity: string;
  checked: boolean;
};

export const COMMON_INGREDIENT_RULES: { match: RegExp; item: Omit<IngredientItem, "id" | "checked"> }[] = [
  { match: /itlog|egg/i, item: { name: "Eggs (Fresh Native / Farm)", category: "Eggs & Dairy", quantity: "2-4 pcs" } },
  { match: /kanin|rice|sinangag/i, item: { name: "White Rice / Sinangag grains", category: "Grains & Bakery", quantity: "1 cup (150g)" } },
  { match: /wheat bread/i, item: { name: "Whole Wheat Bread", category: "Grains & Bakery", quantity: "2 slices" } },
  { match: /pandesal/i, item: { name: "Fresh Bakery Pan de Sal", category: "Grains & Bakery", quantity: "3 pcs" } },
  { match: /saba|banana/i, item: { name: "Saba / Native Bananas", category: "Produce & Greens", quantity: "2 pcs" } },
  { match: /mangga|mango/i, item: { name: "Ripe Philippine Mango", category: "Produce & Greens", quantity: "1 pc" } },
  { match: /tinola|chicken.*breast|chicken.*thigh/i, item: { name: "Chicken (Bone-in or Breast)", category: "Meat & Seafood", quantity: "150-200g" } },
  { match: /sayote/i, item: { name: "Fresh Sayote (Chayote)", category: "Produce & Greens", quantity: "1 pc" } },
  { match: /malunggay|dahon ng sili/i, item: { name: "Malunggay / Sili Leaves", category: "Produce & Greens", quantity: "1 bunch" } },
  { match: /munggo/i, item: { name: "Dried Green Mung Beans (Munggo)", category: "Grains & Bakery", quantity: "1 cup" } },
  { match: /adobo|pork/i, item: { name: "Pork (Pigue / Ribs / Belly)", category: "Meat & Seafood", quantity: "200g" } },
  { match: /tilapia/i, item: { name: "Fresh Tilapia", category: "Meat & Seafood", quantity: "1 medium fish" } },
  { match: /bangus/i, item: { name: "Boneless Bangus (Milkfish)", category: "Meat & Seafood", quantity: "1/2 to 1 fish" } },
  { match: /kangkong/i, item: { name: "Fresh Kangkong (Water Spinach)", category: "Produce & Greens", quantity: "1 bundle" } },
  { match: /tapa|beef/i, item: { name: "Lean Beef (Tapa or Ribs)", category: "Meat & Seafood", quantity: "100-150g" } },
  { match: /upo/i, item: { name: "Fresh Upo (Bottle Gourd)", category: "Produce & Greens", quantity: "1/2 pc" } },
  { match: /tokwa|tofu/i, item: { name: "Firm Tofu (Tokwa)", category: "Eggs & Dairy", quantity: "1 block" } },
  { match: /repolyo|cabbage/i, item: { name: "Green Cabbage (Repolyo)", category: "Produce & Greens", quantity: "1/4 head" } },
  { match: /kamatis|tomato/i, item: { name: "Native Tomatoes (Kamatis)", category: "Produce & Greens", quantity: "2-3 pcs" } },
  { match: /garlic|bawang/i, item: { name: "Garlic (Bawang)", category: "Pantry & Seasonings", quantity: "1 head" } },
  { match: /ginger|luya/i, item: { name: "Fresh Ginger Root (Luya)", category: "Pantry & Seasonings", quantity: "1 small knob" } },
  { match: /calamansi/i, item: { name: "Fresh Calamansi", category: "Pantry & Seasonings", quantity: "4-5 pcs" } },
];

export function aggregateIngredientsFromMealNames(mealNames: string[]): IngredientItem[] {
  const map = new Map<string, IngredientItem>();

  for (const meal of mealNames) {
    let matchedAny = false;
    for (const rule of COMMON_INGREDIENT_RULES) {
      if (rule.match.test(meal)) {
        matchedAny = true;
        const key = rule.item.name;
        if (!map.has(key)) {
          map.set(key, {
            id: `ing-${Math.random().toString(36).substring(2, 9)}`,
            name: rule.item.name,
            category: rule.item.category,
            quantity: rule.item.quantity,
            checked: false,
          });
        }
      }
    }
    // Fallback if no specific rule matched: add the meal itself
    if (!matchedAny && meal.trim()) {
      const key = meal.trim();
      if (!map.has(key)) {
        map.set(key, {
          id: `ing-${Math.random().toString(36).substring(2, 9)}`,
          name: key,
          category: "Pantry & Seasonings",
          quantity: "1 serving portion",
          checked: false,
        });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.category.localeCompare(b.category));
}

const MEAL_SLOT_SET = new Set(["breakfast", "lunch", "dinner", "snack", "other", "all"]);

/**
 * Smart recommendation query based on Country, Diet Preference, and optional Meal Slot.
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
    return RECOMMENDED_FOODS_CATALOG.filter((f) => f.slot === slot);
  }

  return results;
}
