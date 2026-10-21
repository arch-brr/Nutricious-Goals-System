# Implementation decisions (initial baseline)

These are accepted engineering defaults to unblock the first implementation. Revisit them if the course/project constraints require otherwise.

| ID | Decision | Status | Reason / follow-up |
|---|---|---|---|
| D-01 | Next.js App Router + TypeScript | Accepted | One codebase for responsive UI and server routes. |
| D-02 | Next.js server routes for backend API | Accepted | Avoid a separately deployed Express service for this project. |
| D-03 | PostgreSQL hosted by Supabase | Accepted | Relational data suits plans/logs; Supabase provides managed Postgres. Deployment details remain open. |
| D-04 | Supabase Auth with @supabase/ssr | Accepted | Implemented cookie-based server authentication with middleware session refresh and route protection. |
| D-05 | External food API | Accepted | Integrated USDA FoodData Central (via `FOOD_API_KEY` with `DEMO_KEY` fallback) as primary nutritional authority for raw and branded whole foods, with Open Food Facts v2 as secondary international catalog and barcode provider. Both maintain strict source attribution, explicit serving basis, honest null propagation for unprovided nutrients, and server-side secret protection. |
| D-06 | Admin model | Accepted | Separate `admin` and `user` roles enforced in `profiles` table and SSR server sessions. Least privilege guarantees user data isolation via Postgres RLS. Authorized administrators gain access to the Governance & Audit Console (FR-18, FR-19) for user account management, security health auditing, catalog integrity oversight, and immutable event streams. |
| D-07 | User-defined nutrition targets | Proposed | Let users set informational targets; no automatic medical recommendations. Confirm behavior and units before dashboard target comparisons. |
| D-08 | Units and calculation rules | Accepted | Strict unit matching enforced for proportional nutrient scaling. Cross-unit conversions without density are prohibited. Unprovided nutrients are preserved as `null` (not defaulted to zero) and displayed honestly. |
| D-09 | Timezone and historical snapshots | Accepted | Calendar dates are stored as local `YYYY-MM-DD` strings with user timezone context in `profiles`. `consumption_logs` records frozen nutrient snapshots on insert. Custom foods utilize soft-delete archiving (`is_archived: true`) so historical meal plans and consumption logs retain their provenance without data loss. |
| D-10 | Export, deletion, retention | Open | Decide before production launch. |
| D-11 | Repository location | Accepted | This folder is the project root to open in Antigravity IDE. |
| D-12 | Academic deliverables | Accepted | Keep diagrams, API documentation, screenshots, user guide, and presentation in final delivery plan. |
| D-13 | Initial Database Schema & RLS | Accepted | Created `profiles`, `foods`, `meal_plans`, `meal_plan_items`, and `consumption_logs` with per-user RLS policies and `ON CONFLICT` profile trigger. |
| D-14 | Custom Food & Plan Refinements | Accepted | Added migration `20260925000001_custom_foods_and_plans_refinements.sql` with `is_archived` on `foods`, `fiber` on `meal_plan_items`, and nullable nutrient columns to faithfully differentiate missing nutrients from 0. |
| D-15 | Honest UI Empty & Summary States | Accepted | Replaced sample meals, fake streak values, and mocked data with persisted records, honest zero/empty states, and explicit missing-nutrient indicators. |
| D-16 | Distinct Planned vs Consumed Logging | Accepted | Adding a planned item does not mark it as eaten. "Log as consumed" explicitly writes/deletes records in `consumption_logs` rather than flipping a plan item boolean. |
| D-17 | Interactive Public Landing Page & Auth Modal | Accepted | Transformed the direct login screen into an informative, interactive frontpage at `/` with a live Macro Balancer Sandbox, Meal Planning & Logging Simulator, and architectural integrity showcase. Authentication (Sign In & Sign Up) is accessible via embedded modals/drawers without forcing users away from interactive exploration. Unauthenticated visitors are permitted on `/`, while authenticated users access the personalized nutrition dashboard. |
| D-18 | Dedicated Admin Portal & Dietary Recommendations | Accepted | Removed live preview bypasses and demo test account shortcuts to secure dashboard access exclusively to authenticated users. Segregated administrative authentication to an unlinked, protected `/admin/login` route backed by strict server-side role verification (`profile.role === 'admin'`). Integrated user dietary preference and regional cuisine selection at sign-up to automatically calibrate and pre-fill meal item recommendations with calculated macronutrients (calories, protein, carbs, fat, fiber). Enforced high-contrast form input borders and legible typography across light and dark modes. |
| D-19 | Designated Administrator Access & Enhanced Governance Console | Accepted | Established designated administrator credentials (`admin@admin.com` / `admin123`) backed by secure HTTP-only session cookie management (`nutricious_admin_session`) recognized by Next.js SSR proxy and server components. Upgraded `/admin/login` with high-contrast inputs and quick autofill. Expanded `AdminConsoleView` with live user directory search, user dossier inspection modal, account suspension/reactivation actions, nutritional catalog audit baseline table, and event stream filtering with clean, professional typography. |

## Baseline stack

- Next.js App Router (v15/v16) + TypeScript
- Supabase Auth + PostgreSQL, with Row Level Security on user-owned rows (`@supabase/ssr` cookie-based session management)
- Server actions for secure CRUD operations with server-side authorization and input validation
- Pure TypeScript nutrition calculation engine enforcing exact unit matching and honest missing data propagation
- Environment variables for public Supabase URL/anon key and server-only provider secrets; never commit actual secrets

## Prototype boundary

Authentication, custom foods management, dated meal planning with slots, and distinct consumption logging are now fully implemented and persisted. When live Supabase credentials (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) are supplied in `.env.local`, all operations persist directly to Supabase with Row Level Security.
