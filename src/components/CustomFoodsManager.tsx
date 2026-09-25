"use client";

import { useState } from "react";
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

  const closeModal = () => {
    setModalMode(null);
    setActiveFood(null);
    setFormError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
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
    <div className="food-lib-container">
      <div className="food-lib-header">
        <div>
          <div className="section-kicker">FOOD LIBRARY</div>
          <h2>Custom Foods Catalog</h2>
          <p style={{ color: "#8a928c", fontSize: 12, margin: "4px 0 0" }}>
            Create and maintain your own foods with explicit serving sizes and nutrition profiles.
          </p>
        </div>

        <div className="food-lib-actions">
          <div className="search-row" style={{ margin: 0, width: 220 }}>
            <input
              placeholder="Search custom foods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} aria-label="Clear search">
                ×
              </button>
            )}
          </div>
          <button className="add-button" onClick={openCreateModal}>
            + New Custom Food
          </button>
        </div>
      </div>

      {filteredFoods.length === 0 ? (
        <div className="empty-state-wrap" style={{ background: "#fff", borderRadius: 12, border: "1px solid #edeee9" }}>
          <div className="empty-state-icon">🥗</div>
          <h3 className="empty-state-title">
            {foods.length === 0 ? "Your food library is empty" : `No foods match “${searchQuery}”`}
          </h3>
          <p className="empty-state-desc">
            {foods.length === 0
              ? "Add your favorite ingredients or homemade recipes to quickly assign them to your meal plans."
              : "Try searching with a different name or clear your search query."}
          </p>
          {foods.length === 0 && (
            <button className="add-button" style={{ marginTop: 8 }} onClick={openCreateModal}>
              + Add your first custom food
            </button>
          )}
        </div>
      ) : (
        <div className="food-grid">
          {filteredFoods.map((food) => (
            <div className="food-card" key={food.id}>
              <div>
                <div className="food-card-top">
                  <div>
                    <h3 className="food-card-title">{food.name}</h3>
                    {food.brand && <div className="food-card-brand">{food.brand}</div>}
                  </div>
                  <span className="food-card-serving">
                    {food.serving_size} {food.serving_unit}
                  </span>
                </div>

                <div className="food-macro-grid" style={{ marginTop: 12 }}>
                  <div className="food-macro-cell">
                    <span className="food-macro-label">Kcal</span>
                    <span className={`food-macro-val ${food.calories === null ? "unknown" : ""}`}>
                      {formatNutrient(food.calories, "")}
                    </span>
                  </div>
                  <div className="food-macro-cell">
                    <span className="food-macro-label">Protein</span>
                    <span className={`food-macro-val ${food.protein === null ? "unknown" : ""}`}>
                      {formatNutrient(food.protein, "g")}
                    </span>
                  </div>
                  <div className="food-macro-cell">
                    <span className="food-macro-label">Carbs</span>
                    <span className={`food-macro-val ${food.carbs === null ? "unknown" : ""}`}>
                      {formatNutrient(food.carbs, "g")}
                    </span>
                  </div>
                  <div className="food-macro-cell">
                    <span className="food-macro-label">Fat</span>
                    <span className={`food-macro-val ${food.fat === null ? "unknown" : ""}`}>
                      {formatNutrient(food.fat, "g")}
                    </span>
                  </div>
                </div>

                {food.fiber !== null && (
                  <div style={{ marginTop: 8, fontSize: 10, color: "#7a857c" }}>
                    Fiber: <b>{food.fiber} g</b> per {food.serving_size} {food.serving_unit}
                  </div>
                )}
              </div>

              <div className="food-card-actions">
                <button
                  className="btn-sm btn-ghost"
                  onClick={() => openEditModal(food)}
                  aria-label={`Edit ${food.name}`}
                >
                  Edit
                </button>
                <button
                  className="btn-sm btn-danger-ghost"
                  onClick={() => openDeleteModal(food)}
                  aria-label={`Delete ${food.name}`}
                >
                  Archive
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {(modalMode === "create" || modalMode === "edit") && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal} aria-label="Close modal">
              ×
            </button>
            <span className="section-kicker">
              {modalMode === "create" ? "NEW CUSTOM FOOD" : "EDIT CUSTOM FOOD"}
            </span>
            <h2>{modalMode === "create" ? "Add Custom Food" : `Edit ${activeFood?.name}`}</h2>
            <p style={{ margin: "2px 0 16px" }}>
              Define serving portion and nutrient content. Leave unknown nutrient fields empty
              to avoid false zeros.
            </p>

            {formError && (
              <div className="alert-box alert-error" style={{ marginBottom: 14 }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="auth-form" style={{ gap: 14 }}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="food-name">Food Name *</label>
                  <input
                    id="food-name"
                    required
                    className="form-input"
                    placeholder="e.g. Rolled Oats"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="food-brand">Brand / Source (Optional)</label>
                  <input
                    id="food-brand"
                    className="form-input"
                    placeholder="e.g. Quaker / Homemade"
                    value={formData.brand || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="food-serving-size">Serving Size *</label>
                  <input
                    id="food-serving-size"
                    type="number"
                    step="0.1"
                    min="0.01"
                    required
                    className="form-input"
                    value={formData.serving_size}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        serving_size: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="food-serving-unit">Serving Unit *</label>
                  <select
                    id="food-serving-unit"
                    className="form-select"
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
                  <span className="field-hint">
                    Units must match when scaling planned portions.
                  </span>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #f0f2ee", paddingTop: 10 }}>
                <div className="eyebrow" style={{ marginBottom: 10 }}>
                  NUTRITION PER {formData.serving_size} {formData.serving_unit.toUpperCase()} (LEAVE EMPTY IF UNKNOWN)
                </div>

                <div className="form-row-3">
                  <div className="form-group">
                    <label htmlFor="food-calories">Calories (kcal)</label>
                    <input
                      id="food-calories"
                      type="number"
                      step="0.1"
                      min="0"
                      className="form-input"
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
                  <div className="form-group">
                    <label htmlFor="food-protein">Protein (g)</label>
                    <input
                      id="food-protein"
                      type="number"
                      step="0.1"
                      min="0"
                      className="form-input"
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
                  <div className="form-group">
                    <label htmlFor="food-carbs">Carbs (g)</label>
                    <input
                      id="food-carbs"
                      type="number"
                      step="0.1"
                      min="0"
                      className="form-input"
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

                <div className="form-row" style={{ marginTop: 10 }}>
                  <div className="form-group">
                    <label htmlFor="food-fat">Total Fat (g)</label>
                    <input
                      id="food-fat"
                      type="number"
                      step="0.1"
                      min="0"
                      className="form-input"
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
                  <div className="form-group">
                    <label htmlFor="food-fiber">Dietary Fiber (g)</label>
                    <input
                      id="food-fiber"
                      type="number"
                      step="0.1"
                      min="0"
                      className="form-input"
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

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn-sm btn-ghost"
                  style={{ height: 38, padding: "0 16px" }}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-sm btn-primary"
                  style={{ height: 38, padding: "0 18px" }}
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
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal} aria-label="Close modal">
              ×
            </button>
            <span className="section-kicker" style={{ color: "#b25745" }}>
              ARCHIVE FOOD
            </span>
            <h2>Archive “{activeFood.name}”?</h2>
            <p style={{ margin: "6px 0 16px", color: "#6a766e" }}>
              Archiving removes this item from your active custom foods list. Past meal plans
              and consumption logs that used this food will retain their historical snapshots
              without loss of data.
            </p>

            {formError && (
              <div className="alert-box alert-error" style={{ marginBottom: 14 }}>
                {formError}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                className="btn-sm btn-ghost"
                style={{ height: 36, padding: "0 14px" }}
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                className="btn-sm btn-danger-ghost"
                style={{ height: 36, padding: "0 16px", background: "#fdf2f0" }}
                onClick={handleDelete}
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
