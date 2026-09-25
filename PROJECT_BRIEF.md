# Project brief

## Product
**Nutricious Goals System** is a web application that centralizes food lookup, meal planning, food-consumption logging, and personal nutrition summaries.

## Problem
People may need to gather nutritional information from multiple sources and manually calculate intake. Repeated manual tracking can take time and discourage consistent recording.

## Goal
Enable a registered user to search for food, organize daily and weekly meals, record what they consume, and review calculated calories and available nutrients in a single responsive application.

## Users
- **Registered user:** manages their profile, food records, meal plans, logs, and personal summaries.
- **Administrator:** manages users and application settings and monitors system activity. Administrative access must be explicitly separated from normal user access.

## Project boundaries
Included: registration/login, profile management, external food/nutrition lookup, custom food entries, daily and weekly meal planning, food logging and history, calorie and macronutrient tracking, dashboard and period summaries, and a basic ingredient list.

Excluded: diagnosis, treatment, prescriptions, disease-specific plans, automated medical assessment, and professional consultation.

## Product principles
- A user's private records are visible only to that user and appropriately authorized administrators.
- Nutrition figures show their source and serving/quantity basis where available.
- Users can correct or remove their own entries.
- Nutrition information supports personal organization and is not medical advice.
- The interface works on mobile and desktop and remains usable with keyboard and assistive technology.

## Success criteria
A user can create an account, find or create a food item, plan meals for a day or week, log consumed quantities, and see understandable nutrition totals and history. Core flows provide clear validation, loading, empty, and error states.

## Source and interpretation
The supplied *Nutricious Goals System.docx.pdf* is a project proposal and reference for intended features. It lists React/Next.js, Node/Express, PostgreSQL, a food API, JWT, charting, and hosting options, but does not settle implementation choices or define provider, deployment, privacy, retention, or detailed business rules. Those remain decisions to confirm in `DECISIONS.md`.
