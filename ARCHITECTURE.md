# Architecture

## Selected baseline

- **Web and server:** Next.js App Router with TypeScript. The application uses server actions and server components for backend operations and data validation.
- **Database and identity:** Supabase PostgreSQL + Supabase Auth, with Row Level Security on user-owned records.
- **Food data:** Custom food management with explicit serving unit scaling; external provider behind a server-side adapter remains open in `DECISIONS.md`.

## Logical components

1. **Web client:** responsive modular views for Dashboard Overview, Meal Planner, Custom Food Library, Insights, and Settings.
2. **Application/API layer:** authenticates requests via `@supabase/ssr`, enforces user ownership on all CRUD mutations, validates inputs, and executes unit-safe nutrition calculations.
3. **Relational data store:**
   - `profiles`: user metadata and timezone preference.
   - `foods`: user custom foods (and cached catalog items) with soft-delete archiving (`is_archived: true`).
   - `meal_plans`: daily planning root record partitioned by user and `plan_date`.
   - `meal_plan_items`: items assigned to meal slots (`breakfast`, `lunch`, `dinner`, `snack`, `other`) with quantity, unit, and scaled nutrient estimates.
   - `consumption_logs`: immutable snapshot records created when meals are logged as eaten.
4. **Nutrition calculation engine (`src/lib/nutrition/calculator.ts`):** pure functions enforcing strict unit matching, rejecting arbitrary density conversions, and propagating unknown/missing nutrients honestly without defaulting to zero.

## Conceptual data model

- `User` has a role, profile, and local timezone.
- `Food` represents a user custom food or catalog item with serving size, unit, source provenance, and nullable nutrient values.
- `MealPlan` belongs to a user and date; `MealPlanItem` associates a food, quantity/unit, meal slot, and scaled nutrients.
- `ConsumptionLog` belongs to a user and timestamp/date; it records a frozen nutrition snapshot and quantity basis so historical intake totals remain permanently explainable even if foods are edited or archived.

## Request flow

1. Client triggers a server action (`createCustomFood`, `addMealPlanItem`, `logPlannedItemAsConsumed`, etc.).
2. Action authenticates the user via `@supabase/ssr` cookies and validates all input payloads.
3. For custom foods, saves serving size and nullable nutrients with ownership check (`user_id = user.id`).
4. For meal plan items, validates matching units for proportional scaling and writes to `meal_plan_items`.
5. For consumption logging, writes/deletes a dedicated snapshot record in `consumption_logs`.
6. Client revalidates paths and updates local state without flickering.

## Implementation status

- **Authentication & Middleware:** Cookie-based session lifecycle, user authentication, and route protection.
- **Custom Foods Catalog:** Full CRUD operations with modal interfaces, unit validation, soft-delete archiving, and honest missing nutrient displays.
- **Meal Planning:** Dated meal plans with five slots, proportional nutrient scaling with unit-matching guards, and item management.
- **Consumption Logging:** Distinct "Log as consumed" action creating permanent snapshot records in `consumption_logs`.
- **Informational Insights:** Energy balance and macro breakdown with clear medical disclaimers.

## Quality attributes

Prioritize authorization at the data boundary, unit-safe nutrition calculations, responsive accessibility, and complete separation between planned intent and actual consumption history.
