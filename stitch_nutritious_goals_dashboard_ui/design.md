# DESIGN.md — Nutricious Goals System Design Language

## 1. Visual Philosophy: "Botanical Wellness & Vitality"
The visual identity is anchored in restorative health, cellular vitality, and botanical balance. It eschews sterile, cold clinical interfaces in favor of warm, biophilic tones: deep evergreen leaves, morning dew turquoise, earthy sage, and crisp porcelain containers.

### Design Principles:
1. **Calm Clarity**: High-density health and macro metrics presented without visual clutter through generous whitespace and structured card elevation.
2. **Organic Precision**: Rounded container geometry (8px–16px border radii) paired with crisp numerical typography.
3. **Semantic Hierarchy**: Functional color coding for macro categories and dietary archetypes to minimize cognitive strain during logging.

---

## 2. Color Palette & Design Tokens

### 2.1 Primary & Brand Colors
| Token Name | Hex Code | Purpose / Usage |
|---|---|---|
| `--color-primary-dark` | `#134e3e` | Brand headers, primary buttons, hero emphasis, dark accents |
| `--color-primary` | `#1b6b52` | Main brand tone, active navigation tabs, completion states |
| `--color-primary-light` | `#288b6c` | Hover states, secondary CTA backgrounds |
| `--color-primary-subtle` | `#e8f5f0` | Tag backgrounds, subtle pill highlights, active card borders |

### 2.2 Accent & Macro Color Palette
| Token Name | Hex Code | Category / Macro |
|---|---|---|
| `--macro-protein` | `#1b6b52` | Protein metrics & high-protein food badges (Emerald) |
| `--macro-carbs` | `#0284c7` | Carbohydrates & fiber metrics (Ocean/Sky Blue) |
| `--macro-fats` | `#d97706` | Dietary fats & essential fatty acid profile (Warm Amber) |
| `--macro-fiber` | `#059669` | Prebiotic and soluble fiber metrics (Forest Mint) |
| `--accent-sky` | `#38bdf8` | Hydration trackers, energy burn bars |
| `--accent-coral` | `#f97316` | Caloric expenditure indicators, target deficit alerts |
| `--accent-violet` | `#8b5cf6` | Micronutrient synthesis, vitamin spectrum highlights |

### 2.3 Surface & Neutral Foundation
| Token Name | Hex Code | Usage |
|---|---|---|
| `--surface-canvas` | `#f4f8f6` | Application canvas background (soft biophilic tint) |
| `--surface-card` | `#ffffff` | Primary container cards, modal dialogs, log tables |
| `--surface-card-muted`| `#edf5f2` | Input background fields, nested list rows, inactive states |
| `--border-subtle` | `#e2ece7` | Structural card borders and dividers |
| `--text-main` | `#0f1f1a` | High-contrast body text, primary values, metric numbers |
| `--text-muted` | `#52665e` | Secondary labels, timestamps, metadata, unit indicators |

---

## 3. Typography Hierarchy

- **Primary Font Family**: `Plus Jakarta Sans`, sans-serif (Google Fonts)
- **Monospace Font Family (Metrics/Values)**: `JetBrains Mono` or `Inter`, tabular numbers enabled (`font-variant-numeric: tabular-nums`).

| Style Level | Size / Line Height | Weight | Usage |
|---|---|---|---|
| **Display Heading** | 36px / 44px (`2.25rem`) | SemiBold / Bold (700) | Hero login welcome, main dashboard greeting |
| **Section Heading (H1)** | 28px / 36px (`1.75rem`) | Bold (700) | Main page titles (e.g., "Daily Meal Planning") |
| **Card Title (H2)** | 18px / 24px (`1.125rem`) | SemiBold (600) | Modular card headers, meal slot titles |
| **Metric Value** | 32px / 38px (`2.0rem`) | ExtraBold (800) | Caloric totals, macronutrient grams, percentage benchmarks |
| **Body (Default)** | 14px / 20px (`0.875rem`) | Regular / Medium (400/500)| Table rows, input field values, descriptions |
| **Caption / Badge** | 12px / 16px (`0.75rem`) | SemiBold / Medium (600)| Micro-tags, clinical target badges, timestamp indicators |

---

## 4. Component Patterns & UI Library

### 4.1 Global Desktop Header (App Shell)
- **Brand Wordmark**: Emerald sprout & droplet SVG logo (`{{DATA:IMAGE:IMAGE_14}}`) with "Nutricious Goals" bold typography.
- **Top Navigation Menu**: Clean pill-shaped active state (`bg-[#1b6b52] text-white rounded-full px-4 py-1.5`) covering:
  - `Dashboard`
  - `Meal Planning`
  - `Food Log`
  - `Macro Tracking`
  - `Summaries`
  - `About`
- **Global Actions**: Global food search input trigger, quick "+ Log Meal" modal button, and user profile avatar with role badge ("Mindful Member" / "Administrator").

### 4.2 Modular Dashboard Grid Cards (8 Core Modules)
- **Grid Layout**: 4 columns × 2 rows responsive CSS Grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5`).
- **Card Anatomy**:
  - Icon container with subtle tinted background matching module category.
  - Top status tag (e.g. "3 of 4 Ready", "Live Scan", "-420 Burned", "Score 94%").
  - Title and descriptive subtext.
  - Micro-data visualization (mini bar sparklines, checkbox list, or target gauges).
  - Bottom action link or button with subtle hover elevation.

### 4.3 Radial Macro Gauges
- Circular SVG progress meters representing consumed vs. ceiling targets.
- Interior value: Current grams logged.
- Exterior label: Bioavailability quality grade (e.g., Leucine Bioavailability Optimal, Anti-inflammatory ratio balanced).

### 4.4 Form Controls & Input Styling
- Inputs feature soft tinted background (`#edf5f2`), subtle border (`#e2ece7`), and focus ring (`ring-2 ring-[#1b6b52]/20 border-[#1b6b52]`).
- Clean inline icons for search, lock, email, location, and cuisine archetype dropdowns.
