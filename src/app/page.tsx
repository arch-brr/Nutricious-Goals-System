import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/DashboardClient";
import { InteractiveFrontpage } from "@/components/InteractiveFrontpage";
import { Food, MealPlanItem, ConsumptionLog } from "@/lib/supabase/types";

type PageProps = {
  searchParams?: Promise<{ preview?: string }>;
};

export default async function HomePage({ searchParams }: PageProps) {
  const supabase = await createClient();
  let user = null;
  let configured = false;
  let initialFoods: Food[] = [];
  let initialPlanItems: MealPlanItem[] = [];
  let initialConsumptionLogs: ConsumptionLog[] = [];

  const resolvedParams = searchParams ? await searchParams : {};
  const isPreview = Boolean(resolvedParams.preview);

  if (supabase) {
    configured = true;
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, timezone")
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

  // If authenticated user or explicit preview mode, render full application dashboard
  if (user || isPreview) {
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
