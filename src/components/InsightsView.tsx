"use client";

import { Food, ConsumptionLog, MealPlanItem } from "@/lib/supabase/types";
import { calculateNutrientTotals } from "@/lib/nutrition/calculator";

type Props = {
  customFoods: Food[];
  todayLogs: ConsumptionLog[];
  todayPlanItems: MealPlanItem[];
};

export function InsightsView({ customFoods, todayLogs, todayPlanItems }: Props) {
  const consumedTotals = calculateNutrientTotals(todayLogs);
  const plannedTotals = calculateNutrientTotals(todayPlanItems);

  const totalMacroGrams =
    consumedTotals.protein.total + consumedTotals.carbs.total + consumedTotals.fat.total;

  const proteinPct = totalMacroGrams > 0 ? Math.round((consumedTotals.protein.total / totalMacroGrams) * 100) : 0;
  const carbsPct = totalMacroGrams > 0 ? Math.round((consumedTotals.carbs.total / totalMacroGrams) * 100) : 0;
  const fatPct = totalMacroGrams > 0 ? Math.round((consumedTotals.fat.total / totalMacroGrams) * 100) : 0;

  return (
    <div>
      <div className="stitch-console-header">
        <div>
          <div className="stitch-console-eyebrow">
            <span>NUTRITION INSIGHTS</span>
            <span>•</span>
            <span>Daily Totals</span>
          </div>
          <h2 className="stitch-console-title">Macronutrient &amp; Energy Summary</h2>
          <p style={{ fontSize: 13, color: "var(--on-surface-variant)", marginTop: 4 }}>
            Informational overview of your logged nutrition intake and custom food catalog.
          </p>
        </div>
      </div>

      <div className="insights-grid">
        <article className="stitch-module-card" style={{ padding: "22px" }}>
          <div className="stitch-card-top" style={{ marginBottom: 12 }}>
            <div className="stitch-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="stitch-card-badge">Daily Energy</span>
          </div>

          <h3 className="stitch-card-title" style={{ fontSize: 13, color: "var(--on-surface-variant)", marginBottom: 4 }}>
            Energy Balance
          </h3>
          <div className="macro-stat-row">
            <span className="macro-stat-number">
              {consumedTotals.calories.total.toLocaleString()}
            </span>
            <span className="macro-stat-unit">kcal consumed</span>
          </div>

          <p style={{ fontSize: 12, color: "var(--on-surface-variant)", margin: "8px 0 0", lineHeight: 1.5 }}>
            {plannedTotals.calories.total > 0 ? (
              <span>
                Planned for today: <b style={{ color: "var(--on-surface)" }}>{plannedTotals.calories.total} kcal</b> (
                {Math.round((consumedTotals.calories.total / plannedTotals.calories.total) * 100)}% consumed)
              </span>
            ) : (
              <span>No planned meals recorded for today yet.</span>
            )}
          </p>

          {!consumedTotals.calories.complete && (
            <div style={{ fontSize: 11, color: "var(--on-surface)", background: "var(--surface-container-high)", border: "1px solid var(--border-subtle)", padding: "8px 10px", borderRadius: 8, marginTop: 12 }}>
              ⚠️ {consumedTotals.calories.missingCount} logged item(s) do not have calorie data.
            </div>
          )}
        </article>

        <article className="stitch-module-card" style={{ padding: "22px" }}>
          <div className="stitch-card-top" style={{ marginBottom: 12 }}>
            <div className="stitch-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a10 10 0 0 1 10 10h-10z" />
              </svg>
            </div>
            <span className="stitch-card-badge">Today</span>
          </div>

          <h3 className="stitch-card-title" style={{ fontSize: 13, color: "var(--on-surface-variant)", marginBottom: 4 }}>
            Macronutrient Ratio
          </h3>
          <div className="macro-stat-row">
            <span className="macro-stat-number">{totalMacroGrams}</span>
            <span className="macro-stat-unit">g total macros</span>
          </div>

          <div className="macro-progress-bar">
            <div style={{ width: `${proteinPct}%`, backgroundColor: "var(--primary)" }} title={`Protein: ${proteinPct}%`} />
            <div style={{ width: `${carbsPct}%`, backgroundColor: "var(--tertiary-container)" }} title={`Carbs: ${carbsPct}%`} />
            <div style={{ width: `${fatPct}%`, backgroundColor: "var(--secondary)" }} title={`Fats: ${fatPct}%`} />
          </div>

          <div className="macro-breakdown-legend">
            <span>
              <span className="macro-legend-dot" style={{ backgroundColor: "var(--primary)" }} />
              Protein: {proteinPct}%
            </span>
            <span>
              <span className="macro-legend-dot" style={{ backgroundColor: "var(--tertiary-container)" }} />
              Carbs: {carbsPct}%
            </span>
            <span>
              <span className="macro-legend-dot" style={{ backgroundColor: "var(--secondary)" }} />
              Fats: {fatPct}%
            </span>
          </div>
        </article>

        <article className="stitch-module-card" style={{ padding: "22px" }}>
          <div className="stitch-card-top" style={{ marginBottom: 12 }}>
            <div className="stitch-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <span className="stitch-card-badge">Custom Foods</span>
          </div>

          <h3 className="stitch-card-title" style={{ fontSize: 13, color: "var(--on-surface-variant)", marginBottom: 4 }}>
            Library Catalog
          </h3>
          <div className="macro-stat-row">
            <span className="macro-stat-number">{customFoods.length}</span>
            <span className="macro-stat-unit">custom entries</span>
          </div>

          <p style={{ fontSize: 12, color: "var(--on-surface-variant)", margin: "8px 0 0", lineHeight: 1.5 }}>
            Your personal catalog items are securely saved to your account and referenced across all daily meal plans and consumption logs.
          </p>
        </article>
      </div>

      <article className="stitch-module-card" style={{ padding: "22px", marginTop: 20 }}>
        <div className="stitch-console-eyebrow" style={{ marginBottom: 6 }}>
          <span>INFORMATIONAL NOTE</span>
          <span>•</span>
          <span>Disclaimer</span>
        </div>
        <h3 className="stitch-card-title" style={{ fontSize: 15, marginBottom: 8 }}>Nutritional Guidance Disclaimer</h3>
        <p style={{ fontSize: 12, color: "var(--on-surface-variant)", lineHeight: 1.6, margin: 0 }}>
          Nutricious provides informational tracking and planning tools. Summaries and calculations
          are based solely on the values entered by the user or food data source and do not constitute
          medical advice, diagnoses, or disease treatment recommendations.
        </p>
      </article>
    </div>
  );
}
