"use client";

import { useState, useEffect } from "react";
import { Food } from "@/lib/supabase/types";
import {
  createCustomFood,
  updateCustomFood,
  deleteCustomFood,
  CustomFoodInput,
} from "@/app/actions/foods";
import {
  SUPPORTED_SERVING_UNITS,
  formatNutrient,
} from "@/lib/nutrition/calculator";

type Props = {
  initialFoods: Food[];
  onFoodsChanged?: () => void;
};

export function CustomFoodsManager({ initialFoods, onFoodsChanged }: Props) {
  const [foods, setFoods] = useState<Food[]>(initialFoods);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit" | "delete" | null>(null);
  const [activeFood, setActiveFood] = useState<Food | null>(null);

  const [prevInitialFoods, setPrevInitialFoods] = useState(initialFoods);
  if (initialFoods !== prevInitialFoods) {
    setPrevInitialFoods(initialFoods);
    setFoods(initialFoods);
  }

  // Form states
  const [formData, setFormData] = useState<CustomFoodInput>({
    name: "",
    brand: "",
    serving_size: 100,
    serving_unit: "g",
    calories: null,
    protein: null,
    carbs: null,
    fat: null,
    fiber: null,
  });

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const closeModal = () => {
    setModalMode(null);
    setActiveFood(null);
    setFormError(null);
  };

  // Close modals on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && modalMode) {
        closeModal();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalMode]);

  const filteredFoods = foods.filter((f) =>
    `${f.name} ${f.brand || ""}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openCreateModal = () => {
    setActiveFood(null);
    setFormData({
      name: "",
      brand: "",
      serving_size: 100,
      serving_unit: "g",
      calories: null,
      protein: null,
      carbs: null,
      fat: null,
      fiber: null,
    });
    setFormError(null);
    setModalMode("create");
  };

  const openEditModal = (food: Food) => {
    setActiveFood(food);
    setFormData({
      name: food.name,
      brand: food.brand || "",
      serving_size: food.serving_size,
      serving_unit: food.serving_unit,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fiber: food.fiber,
    });
    setFormError(null);
    setModalMode("edit");
  };

  const openDeleteModal = (food: Food) => {
    setActiveFood(food);
    setFormError(null);
    setModalMode("delete");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name?.trim()) {
      setFormError("Food name is required.");
      return;
    }

    if (!formData.serving_size || formData.serving_size <= 0) {
      setFormError("Serving size must be greater than zero.");
      return;
    }

    setLoading(true);

    try {
      if (modalMode === "create") {
        const res = await createCustomFood(formData);
        if (!res.success || !res.data) {
          setFormError(res.error || "Failed to create custom food.");
        } else {
          setFoods((prev) => [res.data!, ...prev]);
          closeModal();
          onFoodsChanged?.();
        }
      } else if (modalMode === "edit" && activeFood) {
        const res = await updateCustomFood(activeFood.id, formData);
        if (!res.success || !res.data) {
          setFormError(res.error || "Failed to update custom food.");
        } else {
          setFoods((prev) =>
            prev.map((f) => (f.id === activeFood.id ? res.data! : f))
          );
          closeModal();
          onFoodsChanged?.();
        }
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!activeFood) return;
    setLoading(true);
    setFormError(null);

    try {
      const res = await deleteCustomFood(activeFood.id);
      if (!res.success) {
        setFormError(res.error || "Failed to archive custom food.");
      } else {
        setFoods((prev) => prev.filter((f) => f.id !== activeFood.id));
        closeModal();
        onFoodsChanged?.();
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stitch-food-page">
      {/* Hero Header */}
      <div className="stitch-food-hero">
        <div className="stitch-food-hero-curve" aria-hidden="true" />
        <div className="stitch-food-hero-content">
          <div className="stitch-food-hero-kicker">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
            Food Catalog &amp; Custom Ingredients
          </div>
          <h2 className="stitch-food-hero-title">Custom Foods Collection</h2>
          <p className="stitch-food-hero-desc">
            Define individualized ingredients, recipes, and portion units. All entries strictly preserve honest macronutrient data and seamlessly scale across daily meal plans.
          </p>
        </div>

        <div className="stitch-food-hero-cta">
          <button
            className="stitch-food-primary-btn"
            onClick={openCreateModal}
            id="add-custom-food-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>+ New Custom Food</span>
          </button>
        </div>
      </div>

      {/* Toolbar / Search & Count */}
      <div className="stitch-food-toolbar">
        <div className="stitch-food-search-wrap">
          <svg className="stitch-food-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="stitch-food-search-input"
            placeholder="Search by food or brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="food-search-input"
          />
          {searchQuery && (
            <button
              className="stitch-food-search-clear"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className="stitch-food-count-badge">
          {filteredFoods.length} {filteredFoods.length === 1 ? "Food Item" : "Food Items"} Available
        </div>
      </div>

      {/* Food Collection Grid or Empty State */}
      {filteredFoods.length === 0 ? (
        <div className="stitch-food-empty-card">
          <div className="stitch-food-empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          </div>
          <h3 className="stitch-food-empty-title">
            {foods.length === 0 ? "Your Custom Food Library is Empty" : `No foods match “${searchQuery}”`}
          </h3>
          <p className="stitch-food-empty-desc">
            {foods.length === 0
              ? "Add your favorite homemade dishes, pantry staples, or whole foods to quickly assign them to your daily meal plans."
              : "Try searching with a different ingredient name or clear your search filter."}
          </p>
          {foods.length === 0 && (
            <button
              className="stitch-food-primary-btn"
              style={{ background: "var(--primary)", color: "#ffffff", marginTop: 6 }}
              onClick={openCreateModal}
            >
              + Create Your First Custom Food
            </button>
          )}
        </div>
      ) : (
        <div className="stitch-food-grid" id="custom-foods-grid">
          {filteredFoods.map((food) => (
            <div className="stitch-food-card" key={food.id} data-food-id={food.id}>
              <div>
                <div className="stitch-food-card-top">
                  <div>
                    <h3 className="stitch-food-card-title">{food.name}</h3>
                    {food.brand && <div className="stitch-food-card-brand">{food.brand}</div>}
                  </div>
                  <span className="stitch-food-portion-badge">
                    {food.serving_size} {food.serving_unit}
                  </span>
                </div>

                {/* 4-Cell Macro Grid */}
                <div className="stitch-food-macro-grid">
                  <div className="stitch-food-macro-cell">
                    <span className="stitch-food-macro-label">Energy</span>
                    <span className={`stitch-food-macro-val calories ${food.calories === null ? "unknown" : ""}`}>
                      {food.calories !== null ? `${food.calories} kcal` : "—"}
                    </span>
                  </div>
                  <div className="stitch-food-macro-cell">
                    <span className="stitch-food-macro-label">Protein</span>
                    <span className={`stitch-food-macro-val protein ${food.protein === null ? "unknown" : ""}`}>
                      {formatNutrient(food.protein, "g")}
                    </span>
                  </div>
                  <div className="stitch-food-macro-cell">
                    <span className="stitch-food-macro-label">Carbs</span>
                    <span className={`stitch-food-macro-val carbs ${food.carbs === null ? "unknown" : ""}`}>
                      {formatNutrient(food.carbs, "g")}
                    </span>
                  </div>
                  <div className="stitch-food-macro-cell">
                    <span className="stitch-food-macro-label">Fat</span>
                    <span className={`stitch-food-macro-val fat ${food.fat === null ? "unknown" : ""}`}>
                      {formatNutrient(food.fat, "g")}
                    </span>
                  </div>
                </div>

                {/* Fiber Row if present */}
                {food.fiber !== null && (
                  <div className="stitch-food-fiber-row">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                    <span>
                      Dietary Fiber: <strong className="stitch-food-fiber-badge">{food.fiber} g</strong> per serving
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="stitch-food-card-actions">
                <button
                  className="stitch-food-action-btn edit-btn"
                  onClick={() => openEditModal(food)}
                  aria-label={`Edit ${food.name}`}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  <span>Edit</span>
                </button>
                <button
                  className="stitch-food-action-btn archive archive-btn"
                  onClick={() => openDeleteModal(food)}
                  aria-label={`Archive ${food.name}`}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span>Archive</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {(modalMode === "create" || modalMode === "edit") && (
        <div className="stitch-modal-backdrop" onClick={closeModal} role="dialog" aria-modal="true">
          <div
            className="stitch-modal-card"
            style={{ maxWidth: 620 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="stitch-modal-close-btn" onClick={closeModal} aria-label="Close modal">
              ×
            </button>
            <span className="stitch-modal-kicker">
              {modalMode === "create" ? "NEW CUSTOM FOOD" : "EDIT CUSTOM FOOD"}
            </span>
            <h2 className="stitch-modal-title">
              {modalMode === "create" ? "Add Custom Food" : `Edit ${activeFood?.name}`}
            </h2>
            <p style={{ margin: "-12px 0 20px", fontSize: 13, color: "var(--on-surface-variant)" }}>
              Define portion units and accurate macronutrient metrics. Leave unknown fields blank to honestly display unprovided data.
            </p>

            {formError && (
              <div className="stitch-alert stitch-alert-error" style={{ marginBottom: 16 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div>{formError}</div>
              </div>
            )}

            <form onSubmit={handleSave} className="stitch-form" noValidate>
              {/* Row 1: Name & Brand */}
              <div className="stitch-form-row-2">
                <div className="stitch-field-group">
                  <label className="stitch-field-label" htmlFor="food-name">
                    Food / Recipe Name *
                  </label>
                  <input
                    id="food-name"
                    required
                    className="stitch-auth-input"
                    style={{ paddingLeft: 14 }}
                    placeholder="e.g. Wild Salmon Poke Bowl"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="stitch-field-group">
                  <label className="stitch-field-label" htmlFor="food-brand">
                    Brand or Source (Optional)
                  </label>
                  <input
                    id="food-brand"
                    className="stitch-auth-input"
                    style={{ paddingLeft: 14 }}
                    placeholder="e.g. Homemade / Local Market"
                    value={formData.brand || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Row 2: Serving Size & Unit */}
              <div className="stitch-form-row-2">
                <div className="stitch-field-group">
                  <label className="stitch-field-label" htmlFor="food-serving-size">
                    Base Serving Size *
                  </label>
                  <input
                    id="food-serving-size"
                    type="number"
                    step="0.1"
                    min="0.01"
                    required
                    className="stitch-auth-input"
                    style={{ paddingLeft: 14 }}
                    value={formData.serving_size}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        serving_size: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="stitch-field-group">
                  <label className="stitch-field-label" htmlFor="food-serving-unit">
                    Serving Unit *
                  </label>
                  <select
                    id="food-serving-unit"
                    className="stitch-auth-input"
                    style={{ paddingLeft: 14, cursor: "pointer" }}
                    value={formData.serving_unit}
                    onChange={(e) =>
                      setFormData({ ...formData, serving_unit: e.target.value })
                    }
                  >
                    {SUPPORTED_SERVING_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nutrition Details Section */}
              <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 16, marginTop: 4 }}>
                <div className="stitch-modal-kicker" style={{ marginBottom: 12 }}>
                  NUTRITION PER {formData.serving_size} {formData.serving_unit.toUpperCase()} (LEAVE EMPTY IF UNKNOWN)
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  <div className="stitch-field-group">
                    <label className="stitch-field-label" htmlFor="food-calories">
                      Calories (kcal)
                    </label>
                    <input
                      id="food-calories"
                      type="number"
                      step="0.1"
                      min="0"
                      className="stitch-auth-input"
                      style={{ paddingLeft: 14 }}
                      placeholder="—"
                      value={formData.calories ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          calories: e.target.value === "" ? null : parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="stitch-field-group">
                    <label className="stitch-field-label" htmlFor="food-protein">
                      Protein (g)
                    </label>
                    <input
                      id="food-protein"
                      type="number"
                      step="0.1"
                      min="0"
                      className="stitch-auth-input"
                      style={{ paddingLeft: 14 }}
                      placeholder="—"
                      value={formData.protein ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          protein: e.target.value === "" ? null : parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="stitch-field-group">
                    <label className="stitch-field-label" htmlFor="food-carbs">
                      Carbs (g)
                    </label>
                    <input
                      id="food-carbs"
                      type="number"
                      step="0.1"
                      min="0"
                      className="stitch-auth-input"
                      style={{ paddingLeft: 14 }}
                      placeholder="—"
                      value={formData.carbs ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          carbs: e.target.value === "" ? null : parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="stitch-form-row-2" style={{ marginTop: 12 }}>
                  <div className="stitch-field-group">
                    <label className="stitch-field-label" htmlFor="food-fat">
                      Total Fat (g)
                    </label>
                    <input
                      id="food-fat"
                      type="number"
                      step="0.1"
                      min="0"
                      className="stitch-auth-input"
                      style={{ paddingLeft: 14 }}
                      placeholder="—"
                      value={formData.fat ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fat: e.target.value === "" ? null : parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="stitch-field-group">
                    <label className="stitch-field-label" htmlFor="food-fiber">
                      Dietary Fiber (g)
                    </label>
                    <input
                      id="food-fiber"
                      type="number"
                      step="0.1"
                      min="0"
                      className="stitch-auth-input"
                      style={{ paddingLeft: 14 }}
                      placeholder="—"
                      value={formData.fiber ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fiber: e.target.value === "" ? null : parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  className="stitch-food-action-btn"
                  style={{ height: 42, padding: "0 18px", borderRadius: 9999 }}
                  onClick={closeModal}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="stitch-food-primary-btn"
                  style={{ height: 42, padding: "0 22px", background: "var(--primary)", color: "#ffffff" }}
                  id="submit-food-form-btn"
                >
                  {loading ? "Saving..." : modalMode === "create" ? "Save Custom Food" : "Update Food"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE / ARCHIVE CONFIRMATION MODAL */}
      {modalMode === "delete" && activeFood && (
        <div className="stitch-modal-backdrop" onClick={closeModal} role="dialog" aria-modal="true">
          <div className="stitch-modal-card" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <button className="stitch-modal-close-btn" onClick={closeModal} aria-label="Close modal">
              ×
            </button>
            <span className="stitch-modal-kicker" style={{ color: "var(--error)" }}>
              ARCHIVE FOOD
            </span>
            <h2 className="stitch-modal-title">Archive “{activeFood.name}”?</h2>
            <p style={{ margin: "-10px 0 20px", fontSize: 13, color: "var(--on-surface-variant)", lineHeight: 1.5 }}>
              Archiving removes this item from your active custom food list. Past meal plans and consumption logs that used this food will retain their historical snapshots without loss of data.
            </p>

            {formError && (
              <div className="stitch-alert stitch-alert-error" style={{ marginBottom: 16 }}>
                <div>{formError}</div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                type="button"
                className="stitch-food-action-btn"
                style={{ height: 40, padding: "0 18px", borderRadius: 9999 }}
                onClick={closeModal}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                className="stitch-food-action-btn archive"
                style={{ height: 40, padding: "0 20px", borderRadius: 9999, background: "#fdf2f2", color: "var(--error)", borderColor: "#f8d7da" }}
                onClick={handleDelete}
                id="confirm-archive-food-btn"
              >
                {loading ? "Archiving..." : "Archive Food"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
