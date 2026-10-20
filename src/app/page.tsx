import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/DashboardClient";
import { InteractiveFrontpage } from "@/components/InteractiveFrontpage";
import { Food, MealPlanItem, ConsumptionLog } from "@/lib/supabase/types";

export default async function HomePage(props: {
  searchParams?: Promise<{ preview?: string; demo?: string }>;
}) {
  const cookieStore = await cookies();
  const hasAdminSession =
    cookieStore.get("nutricious_admin_session")?.value ===
    "authenticated_admin";

  const supabase = await createClient();
  const searchParams = props.searchParams ? await props.searchParams : {};
  const isPreview = searchParams.preview === "1" || searchParams.demo === "1";

  let user: {
    id: string;
    email?: string;
    displayName?: string;
    timezone?: string;
    role: "user" | "admin";
    dietaryPreference?: string;
    country?: string;
    region?: string;
    healthCondition?: string;
    bmi?: number | null;
    heightCm?: number | null;
    weightKg?: number | null;
  } | null = null;
  let configured = false;
  let initialFoods: Food[] = [];
  let initialPlanItems: MealPlanItem[] = [];
  let initialConsumptionLogs: ConsumptionLog[] = [];

  if (supabase) {
    configured = true;
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, timezone, role")
        .eq("id", authUser.id)
        .single();

      user = {
        id: authUser.id,
        email: authUser.email,
        displayName:
          profile?.display_name ||
          (authUser.user_metadata?.display_name as string) ||
          authUser.email?.split("@")[0],
        timezone: profile?.timezone || "UTC",
        role: (profile?.role as "user" | "admin") || "user",
        dietaryPreference:
          (authUser.user_metadata?.dietary_preference as string) ||
          "mediterranean",
        country:
          (authUser.user_metadata?.country as string) ||
          (authUser.user_metadata?.dietary_region as string) ||
          "global",
        region:
          (authUser.user_metadata?.country as string) ||
          (authUser.user_metadata?.dietary_region as string) ||
          "global",
        healthCondition:
          (authUser.user_metadata?.health_condition as string) ||
          "proper_diet",
        bmi:
          typeof authUser.user_metadata?.bmi === "number"
            ? authUser.user_metadata.bmi
            : null,
        heightCm:
          typeof authUser.user_metadata?.height_cm === "number"
            ? authUser.user_metadata.height_cm
            : null,
        weightKg:
          typeof authUser.user_metadata?.weight_kg === "number"
            ? authUser.user_metadata.weight_kg
            : null,
      };

      // Today's UTC/local date representation in YYYY-MM-DD
      const todayStr = new Date().toISOString().split("T")[0];

      // Fetch custom foods
      const { data: foodsData } = await supabase
        .from("foods")
        .select("*")
        .eq("user_id", authUser.id)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });

      if (foodsData) {
        initialFoods = foodsData as Food[];
      }

      // Fetch today's meal plan and items
      const { data: planData } = await supabase
        .from("meal_plans")
        .select("id")
        .eq("user_id", authUser.id)
        .eq("plan_date", todayStr)
        .maybeSingle();

      if (planData) {
        const { data: itemsData } = await supabase
          .from("meal_plan_items")
          .select("*")
          .eq("meal_plan_id", planData.id)
          .eq("user_id", authUser.id)
          .order("order_index", { ascending: true })
          .order("created_at", { ascending: true });

        if (itemsData) {
          initialPlanItems = itemsData as MealPlanItem[];
        }
      }

      // Fetch today's consumption logs
      const { data: logsData } = await supabase
        .from("consumption_logs")
        .select("*")
        .eq("user_id", authUser.id)
        .eq("log_date", todayStr)
        .order("consumed_at", { ascending: true });

      if (logsData) {
        initialConsumptionLogs = logsData as ConsumptionLog[];
      }
    }
  }

  // Active administrator session handling
  if (hasAdminSession && !user) {
    const todayStr = new Date().toISOString().split("T")[0];
    user = {
      id: "admin-system-id",
      email: "admin@admin.com",
      displayName: "System Administrator",
      timezone: "UTC",
      role: "admin",
      dietaryPreference: "mediterranean",
      country: "global",
      region: "global",
      bmi: 22.5,
      heightCm: 175,
      weightKg: 69,
      healthCondition: "proper_diet",
    };
    configured = true;

    // Curated botanical foods baseline for administration review
    initialFoods = [
      {
        id: "cat-01",
        user_id: null,
        name: "Avocado Sourdough Toast with Hemp Seeds",
        brand: "Whole Foods Deli",
        serving_size: 1,
        serving_unit: "slice",
        calories: 290,
        protein: 9,
        carbs: 32,
        fat: 15,
        fiber: 7,
        source: "curated_catalog",
        source_id: "CAT-TOAST-01",
        source_attribution: "Botanical Nutrition Baseline",
        is_custom: false,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "cat-02",
        user_id: null,
        name: "Grilled Wild Salmon Quinoa Bowl",
        brand: "Coastal Harvest",
        serving_size: 1,
        serving_unit: "bowl",
        calories: 520,
        protein: 44,
        carbs: 42,
        fat: 18,
        fiber: 8,
        source: "curated_catalog",
        source_id: "CAT-SALMON-02",
        source_attribution: "Botanical Nutrition Baseline",
        is_custom: false,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "cat-03",
        user_id: null,
        name: "Mediterranean Chickpea & Cucumber Salad",
        brand: "Aegean Garden",
        serving_size: 1,
        serving_unit: "plate",
        calories: 380,
        protein: 18,
        carbs: 48,
        fat: 14,
        fiber: 12,
        source: "curated_catalog",
        source_id: "CAT-CHICKPEA-03",
        source_attribution: "Botanical Nutrition Baseline",
        is_custom: false,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "cat-04",
        user_id: null,
        name: "Organic Greek Yogurt with Fresh Berries",
        brand: "Pasture Pure",
        serving_size: 1,
        serving_unit: "cup",
        calories: 220,
        protein: 20,
        carbs: 18,
        fat: 6,
        fiber: 4,
        source: "curated_catalog",
        source_id: "CAT-YOGURT-04",
        source_attribution: "Botanical Nutrition Baseline",
        is_custom: false,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "cat-05",
        user_id: null,
        name: "Herb-Roasted Tempeh with Roasted Veggies",
        brand: "Mindful Greens",
        serving_size: 1,
        serving_unit: "plate",
        calories: 460,
        protein: 34,
        carbs: 45,
        fat: 16,
        fiber: 10,
        source: "curated_catalog",
        source_id: "CAT-TEMPEH-05",
        source_attribution: "Botanical Nutrition Baseline",
        is_custom: false,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    initialPlanItems = [
      {
        id: "admin-plan-1",
        user_id: "admin-system-id",
        meal_plan_id: "admin-plan-today",
        slot: "breakfast",
        name: "Avocado Sourdough Toast with Hemp Seeds",
        food_id: "cat-01",
        quantity: 1,
        unit: "slice",
        calories: 290,
        protein: 9,
        carbs: 32,
        fat: 15,
        fiber: 7,
        order_index: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "admin-plan-2",
        user_id: "admin-system-id",
        meal_plan_id: "admin-plan-today",
        slot: "lunch",
        name: "Grilled Wild Salmon Quinoa Bowl",
        food_id: "cat-02",
        quantity: 1,
        unit: "bowl",
        calories: 520,
        protein: 44,
        carbs: 42,
        fat: 18,
        fiber: 8,
        order_index: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "admin-plan-3",
        user_id: "admin-system-id",
        meal_plan_id: "admin-plan-today",
        slot: "dinner",
        name: "Mediterranean Chickpea & Cucumber Salad",
        food_id: "cat-03",
        quantity: 1,
        unit: "plate",
        calories: 380,
        protein: 18,
        carbs: 48,
        fat: 14,
        fiber: 12,
        order_index: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "admin-plan-4",
        user_id: "admin-system-id",
        meal_plan_id: "admin-plan-today",
        slot: "snack",
        name: "Organic Greek Yogurt with Fresh Berries",
        food_id: "cat-04",
        quantity: 1,
        unit: "cup",
        calories: 220,
        protein: 20,
        carbs: 18,
        fat: 6,
        fiber: 4,
        order_index: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    initialConsumptionLogs = [
      {
        id: "admin-log-1",
        user_id: "admin-system-id",
        meal_plan_item_id: "admin-plan-1",
        food_id: "cat-01",
        food_name: "Avocado Sourdough Toast with Hemp Seeds",
        slot: "breakfast",
        quantity: 1,
        unit: "slice",
        calories: 290,
        protein: 9,
        carbs: 32,
        fat: 15,
        fiber: 7,
        consumed_at: new Date().toISOString(),
        log_date: todayStr,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "admin-log-2",
        user_id: "admin-system-id",
        meal_plan_item_id: "admin-plan-2",
        food_id: "cat-02",
        food_name: "Grilled Wild Salmon Quinoa Bowl",
        slot: "lunch",
        quantity: 1,
        unit: "bowl",
        calories: 520,
        protein: 44,
        carbs: 42,
        fat: 18,
        fiber: 8,
        consumed_at: new Date().toISOString(),
        log_date: todayStr,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }

  // Fallback preview mode for evaluating/inspecting the dashboard directly
  if (!user && isPreview) {
    user = {
      id: "preview-user",
      email: "maria.santos@example.com",
      displayName: "Maria Santos",
      timezone: "Asia/Manila",
      role: "user",
      dietaryPreference: "asian_pacific",
      country: "philippines",
      region: "philippines",
      bmi: 20.6,
      heightCm: 162,
      weightKg: 54,
    };
    initialPlanItems = [
      {
        id: "preview-item-1",
        user_id: "preview-user",
        meal_plan_id: "preview-plan",
        slot: "breakfast",
        name: "Wholesome Oatmeal with Berries",
        food_id: null,
        quantity: 1,
        unit: "bowl",
        calories: 280,
        protein: 10,
        carbs: 45,
        fat: 6,
        fiber: 7,
        order_index: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "preview-item-2",
        user_id: "preview-user",
        meal_plan_id: "preview-plan",
        slot: "lunch",
        name: "Salmon Sinigang with Kangkong",
        food_id: null,
        quantity: 1,
        unit: "bowl",
        calories: 380,
        protein: 36,
        carbs: 18,
        fat: 14,
        fiber: 6,
        order_index: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }

  // Only authenticated or preview users access the full application dashboard
  if (user) {
    return (
      <DashboardClient
        user={user}
        configured={configured}
        initialFoods={initialFoods}
        initialPlanItems={initialPlanItems}
        initialConsumptionLogs={initialConsumptionLogs}
      />
    );
  }

  // Unauthenticated visitors see the rich, informative, interactive frontpage
  return <InteractiveFrontpage configured={configured} />;
}
