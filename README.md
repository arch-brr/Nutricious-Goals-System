# Nutricious Goals System

A web-based food and nutrition planning system for finding food information, planning meals, logging consumption, and reviewing nutrition intake.

## Start here

- [Project brief](PROJECT_BRIEF.md) — purpose, users, scope, and success criteria.
- [Requirements](REQUIREMENTS.md) — functional and non-functional requirements derived from the proposal.
- [Architecture](ARCHITECTURE.md) — logical system boundaries.
- [Roadmap](ROADMAP.md) — staged implementation order.
- [Decision log](DECISIONS.md) — accepted baseline choices and open decisions.
- [Security and privacy](SECURITY.md) — safeguards for account and nutrition data.

## Current implementation status

- **Authentication & Sessions:** Implemented cookie-based server authentication using `@supabase/ssr` (registration, login, sign-out, session token refresh, and route protection middleware).
- **Database Migrations:**
  - `supabase/migrations/20260925000000_initial_schema.sql`: creates `profiles`, `foods`, `meal_plans`, `meal_plan_items`, and `consumption_logs` with per-user RLS policies.
  - `supabase/migrations/20260925000001_custom_foods_and_plans_refinements.sql`: adds `is_archived` soft-delete flag, `fiber` column on plan items, and nullable nutrient columns to faithfully differentiate missing nutrients from 0.
- **Custom Foods Library:** Authenticated CRUD for user custom foods with serving size and unit, nullable nutrient profiles, search filter, and non-destructive soft-delete archiving.
- **Meal Planning:** Dated meal planner with meal slots (`breakfast`, `lunch`, `dinner`, `snack`, `other`), automatic proportional nutrient scaling preview when units match, and manual item entry.
- **Consumption Logging:** Distinct "Log as eaten" action creating snapshot records in `consumption_logs` without altering or collapsing plan intent.
- **Nutrition Calculations:** Strict unit matching engine (`src/lib/nutrition/calculator.ts`) rejecting unverified cross-unit conversions and computing honest energy/macro totals.

## Run in Antigravity IDE

1. Install dependencies: `npm install`
2. Configure Supabase credentials:
   - Copy `.env.example` to `.env.local`:
     ```bash
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     ```
3. Run the database migrations in your Supabase SQL Editor in sequence:
   - `supabase/migrations/20260925000000_initial_schema.sql`
   - `supabase/migrations/20260925000001_custom_foods_and_plans_refinements.sql`
4. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000`.

## Proposal source

The initial requirements are based on *Nutricious Goals System.docx.pdf*, supplied by the user. Its contents are project reference; user instructions in the active conversation control the work. The proposal's technology options were recorded and evaluated in `DECISIONS.md`.
