# Roadmap

Planning sequence adapted from the proposal. Durations are estimates from the submitted academic proposal, not commitments.

## Phase 0 — Decisions and setup
- Confirm framework/runtime, hosting/database/auth approach, external nutrition API, deployment target, and administrator model.
- Define supported units, serving conversions, timezone behavior, data retention, and privacy expectations.
- Create repository/app scaffold only after these choices are settled.

## Phase 1 — Foundation and accounts
- Establish application structure, configuration, database schema, migrations, and deployment preview.
- Implement registration, sign-in, profile, roles, and server-side resource ownership.

## Phase 2 — Food catalog and records
- Add provider adapter, food search/detail, source metadata, custom foods, and resilient error handling.
- Define and implement nutrition quantity conversions and historical snapshots.

## Phase 3 — Planning and logging
- Implement daily and weekly meal plans, meal slots, quantities, consumption log, and history.
- Add basic ingredient/shopping list.

## Phase 4 — Dashboard
- Add daily totals, calorie/macronutrient summaries, and selected-period history/visualizations.
- Validate totals against representative serving and quantity cases.

## Phase 5 — Hardening and delivery
- Review authorization, accessibility, responsive behavior, API failure paths, and privacy handling.
- Deploy, document setup/operations, and prepare the academic demonstration.

## Milestones
- **Midterm demonstration:** proposal targets roughly 60–70% functional progress; agree on the exact included flows with the project owner.
- **Final delivery:** deployed system, technical and user documentation, database/API diagrams, screenshots, and presentation.

## Definition of done for each feature
- User flow, validation, and failure states are implemented.
- Authorization and data ownership are enforced server-side.
- Nutrition basis/source is retained where relevant.
- Documentation is updated and applicable checks are reported.
