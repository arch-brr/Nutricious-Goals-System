import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/DashboardClient";
import { InteractiveFrontpage } from "@/components/InteractiveFrontpage";
import { Food, MealPlanItem, ConsumptionLog } from "@/lib/supabase/types";

export default async function HomePage(props: {
  searchParams?: Promise<{ preview?: string; demo?: string }>;
}) {
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
      },
      {
        id: "preview-item-2",
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
