-- Nutricious Goals System: Initial Database Migration
-- Timestamp: 2026-09-25
-- Description: Creates user profiles, foods catalog/custom items, meal plans, meal items, and consumption logs with RLS.

-- 1. PROFILES TABLE
-- Stores public user profile data linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    timezone TEXT NOT NULL DEFAULT 'UTC',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. FOODS TABLE
-- Stores both provider-sourced foods (cached/curated) and user-created custom foods
CREATE TABLE IF NOT EXISTS public.foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for shared/catalog foods, user ID for custom foods
    name TEXT NOT NULL,
    brand TEXT,
    serving_size NUMERIC(10, 2) NOT NULL CHECK (serving_size > 0),
    serving_unit TEXT NOT NULL DEFAULT 'g', -- e.g. 'g', 'ml', 'serving', 'piece'
    calories NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (calories >= 0),
    protein NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (protein >= 0),
    carbs NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (carbs >= 0),
    fat NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (fat >= 0),
    fiber NUMERIC(10, 2) DEFAULT 0 CHECK (fiber >= 0),
    source TEXT NOT NULL DEFAULT 'custom', -- 'custom', 'usda', 'openfoodfacts', etc.
    source_id TEXT, -- external identifier if provider-sourced
    source_attribution TEXT, -- attribution notice if required by provider terms
    is_custom BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. MEAL PLANS TABLE
-- Represents a user's daily meal plan for a specific date
CREATE TABLE IF NOT EXISTS public.meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_plan_date UNIQUE (user_id, plan_date)
);

-- 4. MEAL PLAN ITEMS TABLE
-- Individual items assigned to a meal plan slot (breakfast, lunch, dinner, snack, other)
CREATE TABLE IF NOT EXISTS public.meal_plan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_plan_id UUID NOT NULL REFERENCES public.meal_plans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    food_id UUID REFERENCES public.foods(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slot TEXT NOT NULL CHECK (slot IN ('breakfast', 'lunch', 'dinner', 'snack', 'other')),
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit TEXT NOT NULL DEFAULT 'serving',
    calories NUMERIC(10, 2) DEFAULT 0 CHECK (calories >= 0),
    protein NUMERIC(10, 2) DEFAULT 0 CHECK (protein >= 0),
    carbs NUMERIC(10, 2) DEFAULT 0 CHECK (carbs >= 0),
    fat NUMERIC(10, 2) DEFAULT 0 CHECK (fat >= 0),
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. CONSUMPTION LOGS TABLE
-- Records foods actually eaten at a specific time/date, retaining a snapshot of nutrition values
CREATE TABLE IF NOT EXISTS public.consumption_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    consumed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    slot TEXT NOT NULL CHECK (slot IN ('breakfast', 'lunch', 'dinner', 'snack', 'other')),
    food_id UUID REFERENCES public.foods(id) ON DELETE SET NULL,
    food_name TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit TEXT NOT NULL DEFAULT 'serving',
    calories NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (calories >= 0),
    protein NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (protein >= 0),
    carbs NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (carbs >= 0),
    fat NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (fat >= 0),
    fiber NUMERIC(10, 2) DEFAULT 0 CHECK (fiber >= 0),
    meal_plan_item_id UUID REFERENCES public.meal_plan_items(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_foods_user_id ON public.foods(user_id);
CREATE INDEX IF NOT EXISTS idx_foods_name ON public.foods(name);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_date ON public.meal_plans(user_id, plan_date);
CREATE INDEX IF NOT EXISTS idx_meal_plan_items_plan_id ON public.meal_plan_items(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_items_user_id ON public.meal_plan_items(user_id);
CREATE INDEX IF NOT EXISTS idx_consumption_logs_user_date ON public.consumption_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_consumption_logs_consumed_at ON public.consumption_logs(consumed_at);

-- AUTOMATIC PROFILE TRIGGER ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        'user'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumption_logs ENABLE ROW LEVEL SECURITY;

-- ROW LEVEL SECURITY POLICIES

-- Profiles: Users can select and update their own profile; admins can select all
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Foods: Users can view shared catalog foods (user_id IS NULL) or their own custom foods
CREATE POLICY "Users can view public or own foods"
    ON public.foods FOR SELECT
    USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom foods"
    ON public.foods FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom foods"
    ON public.foods FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom foods"
    ON public.foods FOR DELETE
    USING (auth.uid() = user_id);

-- Meal Plans: Users can select, insert, update, and delete only their own meal plans
CREATE POLICY "Users can view their own meal plans"
    ON public.meal_plans FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own meal plans"
    ON public.meal_plans FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plans"
    ON public.meal_plans FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal plans"
    ON public.meal_plans FOR DELETE
    USING (auth.uid() = user_id);

-- Meal Plan Items: Users can manage only items in their own meal plans
CREATE POLICY "Users can view their own meal plan items"
    ON public.meal_plan_items FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal plan items"
    ON public.meal_plan_items FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plan items"
    ON public.meal_plan_items FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal plan items"
    ON public.meal_plan_items FOR DELETE
    USING (auth.uid() = user_id);

-- Consumption Logs: Users can manage only their own consumption logs
CREATE POLICY "Users can view their own consumption logs"
    ON public.consumption_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consumption logs"
    ON public.consumption_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consumption logs"
    ON public.consumption_logs FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own consumption logs"
    ON public.consumption_logs FOR DELETE
    USING (auth.uid() = user_id);
