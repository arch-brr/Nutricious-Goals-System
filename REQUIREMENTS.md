# Requirements

These requirements translate the supplied proposal into an implementation-ready baseline. They describe intended product behavior, not a mandate to use a particular framework.

## Functional requirements

### Accounts and profile
- **FR-01:** A visitor can register and sign in securely.
- **FR-02:** A registered user can view and update their profile and sign out.
- **FR-03:** The system restricts each user's plans, food records, logs, and summaries to that user, except for explicitly authorized administrative functions.

### Food information
- **FR-04:** A user can search an external food/nutrition catalog and inspect returned nutrition data.
- **FR-05:** Food detail displays available calories, protein, carbohydrates, fats, fiber, serving information, and data source; unavailable nutrients are not fabricated.
- **FR-06:** A user can create and manage a custom food entry with a name, quantity/serving basis, and nutrition values.
- **FR-07:** External API credentials remain server-side. Provider errors, rate limits, and unavailable data are handled with useful messages.

### Meal planning and food logging
- **FR-08:** A user can create, view, edit, and delete daily meal plans.
- **FR-09:** A user can organize a weekly plan across dates, with meal slots such as breakfast, lunch, dinner, and other.
- **FR-10:** Planned meals can include selected food items and quantities.
- **FR-11:** A user can log food actually consumed, with date/time, meal slot, and quantity, independently of whether it was planned.
- **FR-12:** A user can review and manage their meal and consumption history.
- **FR-13:** A user can create a basic ingredient/shopping list associated with planned meals.

### Nutrition dashboard and summaries
- **FR-14:** The system calculates nutrition totals from recorded quantities using consistent serving/unit conversions and available source data.
- **FR-15:** A dashboard shows daily calorie and available macronutrient totals and a summary of plans/logs.
- **FR-16:** A user can review summaries over a selected period, including the underlying recorded entries.
- **FR-17:** Visualizations include labels, units, date range, and an accessible text equivalent.

### Administration
- **FR-18:** An authorized administrator can manage user accounts, review appropriate system activity, and manage system settings.
- **FR-19:** Administrative actions are access-controlled and auditable. The exact administrator capabilities and retention policy require a product decision.

## Non-functional requirements
- **NFR-01 Privacy:** Collect only data needed for the product; protect account and nutrition records in transit and at rest through the chosen hosting/database controls.
- **NFR-02 Authorization:** Enforce access control on the server and in the data layer for every user-owned resource.
- **NFR-03 Data integrity:** Store quantity, unit, serving basis, nutrient amount, and source as structured data; preserve enough information to explain calculated totals.
- **NFR-04 Reliability:** Handle external API failure without losing user-entered plans or logs.
- **NFR-05 Usability:** Responsive layout, keyboard accessible controls, validation, and clear loading/empty/error states.
- **NFR-06 Maintainability:** Keep provider integration, nutrition calculations, authentication, and UI concerns separated and documented.
- **NFR-07 Configuration:** Keep credentials and environment-specific values out of committed source.
- **NFR-08 Safety:** Present tracking as informational organization, not diagnosis or personalized clinical guidance.

## Acceptance flow
1. A user can register and sign in.
2. The user can search food and view its serving and source details, or create a custom food.
3. The user can add food and quantities to a dated meal plan.
4. The user can record actual consumed quantities and view history.
5. The dashboard totals match the recorded quantities and nutrient basis.
6. Another ordinary user cannot access those records by changing an identifier or URL.
7. The experience remains usable on a narrow mobile screen and through keyboard navigation.

## Open details
Provider selection, supported units/conversions, goals/targets, timezone/date rollover, editing historical entries after source data changes, export/delete workflows, admin permissions, and deployment are unresolved. Track these in `DECISIONS.md` before they affect data design or user expectations.
