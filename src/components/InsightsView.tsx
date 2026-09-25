"use client";

import { Food, ConsumptionLog, MealPlanItem } from "@/lib/supabase/types";
import { calculateNutrientTotals, formatNutrient } from "@/lib/nutrition/calculator";

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
      <div className="planner-topbar">
        <div>
          <div className="section-kicker">NUTRITION INSIGHTS</div>
          <h2>Macronutrient & Energy Summary</h2>
          <p style={{ color: "#8a928c", fontSize: 12, margin: "4px 0 0" }}>
            Informational overview of your logged nutrition intake and custom food catalog.
          </p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <article className="stat-card">
          <div className="card-head">
            <span>Today's Energy Balance</span>
            <span className="stat-icon peach">✳</span>
          </div>
          <div className="calorie-row">
            <strong>{consumedTotals.calories.total.toLocaleString()}</strong>
            <span>kcal consumed</span>
          </div>
          <div style={{ fontSize: 11, color: "#8a948c", lineHeight: 1.5 }}>
            {plannedTotals.calories.total > 0 ? (
              <span>
                Planned intake for today: <b>{plannedTotals.calories.total} kcal</b> (
                {Math.round((consumedTotals.calories.total / plannedTotals.calories.total) * 100)}% consumed)
              </span>
            ) : (
              <span>No planned meals recorded for today yet.</span>
            )}
          </div>
          {!consumedTotals.calories.complete && (
            <div className="field-hint" style={{ color: "#b2762a", marginTop: 8 }}>
              ⚠️ {consumedTotals.calories.missingCount} logged item(s) do not have calorie data.
            </div>
          )}
        </article>

        <article className="stat-card">
          <div className="card-head">
            <span>Macronutrient Ratio</span>
            <span className="period-label">TODAY</span>
          </div>
          <div className="macro-total">
            <b>{totalMacroGrams}</b>
            <small>g</small>
            <span>total macros</span>
          </div>
          <div style={{ display: "flex", height: 12, borderRadius: 6, overflow: "hidden", background: "#f0f2ee", margin: "10px 0" }}>
            <div style={{ width: `${proteinPct}%`, background: "#759878" }} title={`Protein: ${proteinPct}%`} />
            <div style={{ width: `${carbsPct}%`, background: "#dfa876" }} title={`Carbs: ${carbsPct}%`} />
            <div style={{ width: `${fatPct}%`, background: "#ac8cb4" }} title={`Fats: ${fatPct}%`} />
          </div>
          <div className="macro-legend" style={{ fontSize: 10 }}>
            <span><i className="legend-green" /> Protein: {proteinPct}% ({consumedTotals.protein.total}g)</span>
            <span><i className="legend-orange" /> Carbs: {carbsPct}% ({consumedTotals.carbs.total}g)</span>
            <span><i className="legend-lilac" /> Fats: {fatPct}% ({consumedTotals.fat.total}g)</span>
          </div>
        </article>

        <article className="stat-card">
          <div className="card-head">
            <span>Custom Library Snapshot</span>
            <span className="streak-icon">🥗</span>
          </div>
          <div className="calorie-row">
            <strong>{customFoods.length}</strong>
            <span>custom foods</span>
          </div>
          <p style={{ fontSize: 11, color: "#8a948c", margin: "4px 0 0", lineHeight: 1.5 }}>
            Your personal catalog items are securely stored and referenced across all daily meal plans and consumption logs.
          </p>
        </article>
      </div>

      <article className="panel" style={{ padding: 20 }}>
        <div className="panel-header">
          <div>
            <div className="section-kicker">INFORMATIONAL NOTE</div>
            <h2>Nutritional Guidance Disclaimer</h2>
          </div>
        </div>
        <p style={{ fontSize: 12, color: "#748076", lineHeight: 1.6, margin: 0 }}>
          Nutricious provides informational tracking and planning tools. Summaries and calculations
          are based solely on the values entered by the user or food data source and do not constitute
          medical advice, diagnoses, or disease treatment recommendations.
        </p>
      </article>
    </div>
  );
}
