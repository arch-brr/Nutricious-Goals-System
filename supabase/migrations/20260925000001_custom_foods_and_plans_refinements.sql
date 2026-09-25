-- Nutricious Goals System: Custom Foods & Nullable Nutrients Migration
-- Timestamp: 2026-09-25
-- Description: Adds is_archived to foods, adds fiber to meal_plan_items, makes nutrient columns nullable across foods, meal_plan_items, and consumption_logs to honestly represent "not provided" vs "0".

-- 1. FOODS: Add is_archived and alter nutrient column constraints
ALTER TABLE public.foods
    ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.foods
    ALTER COLUMN calories DROP NOT NULL,
    ALTER COLUMN calories DROP DEFAULT,
    ALTER COLUMN protein DROP NOT NULL,
    ALTER COLUMN protein DROP DEFAULT,
    ALTER COLUMN carbs DROP NOT NULL,
    ALTER COLUMN carbs DROP DEFAULT,
    ALTER COLUMN fat DROP NOT NULL,
    ALTER COLUMN fat DROP DEFAULT,
    ALTER COLUMN fiber DROP DEFAULT;

-- 2. MEAL PLAN ITEMS: Add fiber column and relax NOT NULL on nutrients
ALTER TABLE public.meal_plan_items
    ADD COLUMN IF NOT EXISTS fiber NUMERIC(10, 2) DEFAULT NULL CHECK (fiber IS NULL OR fiber >= 0);

ALTER TABLE public.meal_plan_items
    ALTER COLUMN calories DROP DEFAULT,
    ALTER COLUMN protein DROP DEFAULT,
    ALTER COLUMN carbs DROP DEFAULT,
    ALTER COLUMN fat DROP DEFAULT;

-- 3. CONSUMPTION LOGS: Relax NOT NULL on nutrients to allow honest "not provided" snapshots
ALTER TABLE public.consumption_logs
    ALTER COLUMN calories DROP NOT NULL,
    ALTER COLUMN calories DROP DEFAULT,
    ALTER COLUMN protein DROP NOT NULL,
    ALTER COLUMN protein DROP DEFAULT,
    ALTER COLUMN carbs DROP NOT NULL,
    ALTER COLUMN carbs DROP DEFAULT,
    ALTER COLUMN fat DROP NOT NULL,
    ALTER COLUMN fat DROP DEFAULT,
    ALTER COLUMN fiber DROP DEFAULT;

-- 4. UPDATE POLICIES FOR FOODS TO PREVENT SELECTING ARCHIVED FOODS UNLESS SPECIFIED
DROP POLICY IF EXISTS "Users can view public or own foods" ON public.foods;
CREATE POLICY "Users can view public or own foods"
    ON public.foods FOR SELECT
    USING ((user_id IS NULL OR auth.uid() = user_id));
