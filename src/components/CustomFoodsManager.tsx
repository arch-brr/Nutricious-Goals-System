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
  searchExternalFoodsAction,
  importApiFoodAction,
} from "@/app/actions/food-api";
import { ApiFoodItem } from "@/lib/nutrition/food-api";
import {
  SUPPORTED_SERVING_UNITS,
  formatNutrient,
} from "@/lib/nutrition/calculator";
import { getFoodImage } from "@/lib/nutrition/food-images";

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

  // External Food API search state
  const [activeTab, setActiveTab] = useState<"library" | "api">("library");
  const [apiQuery, setApiQuery] = useState("");
  const [apiProvider, setApiProvider] = useState<"all" | "usda" | "openfoodfacts">("all");
  const [apiResults, setApiResults] = useState<ApiFoodItem[]>([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [inspectingApiFood, setInspectingApiFood] = useState<ApiFoodItem | null>(null);

  const handleSearchApi = async (queryToSearch?: string) => {
    const q = (queryToSearch !== undefined ? queryToSearch : apiQuery).trim();
    if (!q) return;
    setApiLoading(true);
    setApiError(null);
    try {
      const res = await searchExternalFoodsAction(q, apiProvider);
      if (res.success && res.data) {
        setApiResults(res.data.items);
        if (res.data.items.length === 0) {
          setApiError(`No verified items found for "${q}". Try another keyword or brand name.`);
        }
      } else {
        setApiError(res.error || "Failed to query external food catalog.");
      }
    } catch (err: any) {
      setApiError(err?.message || "Network error while connecting to food API.");
    } finally {
      setApiLoading(false);
    }
  };

  const handleImportApiFood = async (item: ApiFoodItem) => {
    setImportingId(item.id);
    try {
      const res = await importApiFoodAction(item);
      if (res.success && res.data) {
        setFoods((prev) => [res.data!, ...prev]);
        setImportedIds((prev) => new Set(prev).add(item.id));
        onFoodsChanged?.();
      } else {
        alert(res.error || "Failed to import food.");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to import food.");
    } finally {
      setImportingId(null);
    }
  };

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

      {/* Sub-view Navigation Tabs */}
      <div style={{ display: "flex", gap: 10, margin: "20px 0 16px", flexWrap: "wrap", alignItems: "center" }}>
        <button
          type="button"
          className={`stitch-nav-pill ${activeTab === "library" ? "active" : ""}`}
          onClick={() => setActiveTab("library")}
          style={{ height: 42, padding: "0 20px", fontSize: 13, fontWeight: 700 }}
        >
          <span>📚 My Food Library</span>
          <span className="stitch-nav-badge">{foods.length}</span>
        </button>
        <button
          type="button"
          className={`stitch-nav-pill ${activeTab === "api" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("api");
            if (apiResults.length === 0 && !apiQuery) {
              setApiQuery("oatmeal");
              handleSearchApi("oatmeal");
            }
          }}
          style={{ height: 42, padding: "0 20px", fontSize: 13, fontWeight: 700 }}
        >
          <span>🌐 Search Live Food API</span>
          <span
            style={{
              fontSize: 10,
              padding: "2px 7px",
              borderRadius: 6,
              backgroundColor: "var(--primary)",
              color: "#ffffff",
              fontWeight: 800,
            }}
          >
            USDA + OFF
          </span>
        </button>
      </div>

      {/* VIEW 1: MY FOOD LIBRARY */}
      {activeTab === "library" && (
        <>
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
                placeholder="Search your library foods or brands..."
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
                  ? "Create custom recipes or browse the Live Food API tab to import millions of verified whole foods and branded items."
                  : "Try searching with a different ingredient name or clear your search filter."}
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 12, flexWrap: "wrap" }}>
                <button
                  className="stitch-food-primary-btn"
                  style={{ background: "var(--primary)", color: "#ffffff" }}
                  onClick={openCreateModal}
                >
                  + Create Custom Food
                </button>
                <button
                  type="button"
                  className="stitch-food-action-btn"
                  style={{ height: 42, padding: "0 18px", borderRadius: 9999 }}
                  onClick={() => {
                    setActiveTab("api");
                    if (apiResults.length === 0) {
                      setApiQuery("salmon");
                      handleSearchApi("salmon");
                    }
                  }}
                >
                  🌐 Browse Live Food API
                </button>
              </div>
            </div>
          ) : (
            <div className="stitch-food-grid" id="custom-foods-grid">
              {filteredFoods.map((food) => {
                const foodImg = getFoodImage(food.name);
                return (
                  <div className="stitch-food-card" key={food.id} data-food-id={food.id}>
                    <div>
                      <div className="stitch-food-card-top">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {foodImg && (
                            <img
                              src={foodImg}
                              alt={food.name}
                              className="stitch-library-food-img"
                              style={{
                                width: 42,
                                height: 42,
                                minWidth: 42,
                                minHeight: 42,
                                maxWidth: 42,
                                maxHeight: 42,
                                borderRadius: 10,
                                objectFit: "cover",
                                flexShrink: 0,
                                display: "block",
                              }}
                              loading="lazy"
                            />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="stitch-food-card-title truncate">{food.name}</h3>
                              {!food.is_custom && (
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    padding: "2px 6px",
                                    borderRadius: 6,
                                    backgroundColor: food.source === "usda" ? "rgba(16, 185, 129, 0.15)" : "rgba(59, 130, 246, 0.15)",
                                    color: food.source === "usda" ? "var(--primary)" : "var(--secondary)",
                                    border: "1px solid var(--border-subtle)",
                                  }}
                                >
                                  {food.source === "usda" ? "🏛️ USDA" : "📦 OFF"}
                                </span>
                              )}
                            </div>
                            {food.brand && <div className="stitch-food-card-brand truncate">{food.brand}</div>}
                            {food.source_attribution && (
                              <div style={{ fontSize: 10, color: "var(--on-surface-variant)", opacity: 0.85, marginTop: 1 }}>
                                {food.source_attribution}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="stitch-food-portion-badge shrink-0">
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
                );
              })}
            </div>
          )}
        </>
      )}

      {/* VIEW 2: LIVE EXTERNAL FOOD API SEARCH */}
      {activeTab === "api" && (
        <section className="stitch-module-card" style={{ padding: "24px", marginTop: 12 }}>
          {/* Header & Description */}
          <div style={{ marginBottom: 18 }}>
            <span className="stitch-console-eyebrow">
              <span>LIVE FOOD DATABASE</span> • <span>USDA FoodData Central &amp; Open Food Facts</span>
            </span>
            <h3 style={{ fontSize: 20, fontWeight: 700, margin: "6px 0 4px", color: "var(--on-surface)" }}>
              Search External Nutrition Catalog
            </h3>
            <p style={{ fontSize: 13, color: "var(--on-surface-variant)", lineHeight: 1.5 }}>
              Instant live lookup across over 3 million verified whole ingredients, commercial groceries, and branded foods. Import items to your library with one click for exact meal planning and logging.
            </p>
          </div>

          {/* Search Bar & Provider Controls */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
            <div style={{ flex: "1 1 280px", position: "relative" }}>
              <input
                type="text"
                className="stitch-auth-input"
                style={{ height: 44, paddingLeft: 14, fontSize: 14 }}
                placeholder="Search catalog (e.g. Greek yogurt, Chicken breast, Brown rice, Apple)..."
                value={apiQuery}
                onChange={(e) => setApiQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearchApi();
                  }
                }}
              />
              {apiQuery && (
                <button
                  type="button"
                  onClick={() => setApiQuery("")}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    fontSize: 16,
                    color: "var(--on-surface-variant)",
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              )}
            </div>

            {/* Provider Filter Select */}
            <select
              className="stitch-auth-input"
              style={{ width: "auto", minWidth: 160, height: 44, fontSize: 13, cursor: "pointer" }}
              value={apiProvider}
              onChange={(e) => setApiProvider(e.target.value as any)}
            >
              <option value="all">🌐 All Catalogs (USDA + OFF)</option>
              <option value="usda">🏛️ USDA FoodData Central</option>
              <option value="openfoodfacts">📦 Open Food Facts (ODbL)</option>
            </select>

            {/* Search Action Button */}
            <button
              type="button"
              disabled={apiLoading || !apiQuery.trim()}
              onClick={() => handleSearchApi()}
              className="add-button"
              style={{ height: 44, padding: "0 22px", fontSize: 13, fontWeight: 700 }}
            >
              {apiLoading ? "Searching..." : "🔍 Search Catalog"}
            </button>
          </div>

          {/* Quick Search Suggestions */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
            <span style={{ fontSize: 12, color: "var(--on-surface-variant)", fontWeight: 600 }}>
              Quick Suggestions:
            </span>
            {[
              "Apple",
              "Banana",
              "Oatmeal",
              "Chicken Breast",
              "Greek Yogurt",
              "Salmon",
              "Brown Rice",
              "Avocado",
              "Eggs",
            ].map((tag) => (
              <button
                key={tag}
                type="button"
                className="stitch-tag-btn"
                onClick={() => {
                  setApiQuery(tag);
                  handleSearchApi(tag);
                }}
                style={{
                  fontSize: 12,
                  padding: "4px 10px",
                  borderRadius: 8,
                  backgroundColor: "var(--surface-container)",
                  color: "var(--on-surface)",
                  border: "1px solid var(--border-subtle)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Error Message */}
          {apiError && (
            <div className="stitch-alert stitch-alert-error" style={{ marginBottom: 16 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>{apiError}</div>
            </div>
          )}

          {/* Loading Indicator */}
          {apiLoading && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--on-surface-variant)" }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                Querying external nutrition catalog...
              </div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                Fetching verified nutrient amounts from USDA &amp; Open Food Facts.
              </div>
            </div>
          )}

          {/* Results Grid */}
          {!apiLoading && apiResults.length > 0 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--on-surface)" }}>
                  Found {apiResults.length} Verified Food Results
                </span>
                <span style={{ fontSize: 11, color: "var(--on-surface-variant)" }}>
                  Source: {apiProvider === "usda" ? "USDA FDC" : apiProvider === "openfoodfacts" ? "Open Food Facts" : "Combined"}
                </span>
              </div>

              <div className="stitch-food-grid">
                {apiResults.map((item) => {
                  const isImported = importedIds.has(item.id) || foods.some((f) => f.name.toLowerCase() === item.name.toLowerCase());
                  const isImporting = importingId === item.id;
                  const itemImg = getFoodImage(item.name);

                  return (
                    <div
                      key={item.id}
                      className="stitch-food-card"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        {/* Top Card Row */}
                        <div className="stitch-food-card-top">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {itemImg && (
                              <img
                                src={itemImg}
                                alt={item.name}
                                className="stitch-library-food-img"
                                style={{
                                  width: 42,
                                  height: 42,
                                  minWidth: 42,
                                  minHeight: 42,
                                  maxWidth: 42,
                                  maxHeight: 42,
                                  borderRadius: 10,
                                  objectFit: "cover",
                                  flexShrink: 0,
                                  display: "block",
                                }}
                                loading="lazy"
                              />
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className="stitch-food-card-title truncate" title={item.name}>
                                  {item.name}
                                </h3>
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    padding: "2px 6px",
                                    borderRadius: 6,
                                    backgroundColor: item.source === "usda" ? "rgba(16, 185, 129, 0.15)" : "rgba(59, 130, 246, 0.15)",
                                    color: item.source === "usda" ? "var(--primary)" : "var(--secondary)",
                                    border: "1px solid var(--border-subtle)",
                                  }}
                                >
                                  {item.source === "usda" ? "🏛️ USDA" : "📦 OFF"}
                                </span>
                              </div>
                              {item.brand && (
                                <div className="stitch-food-card-brand truncate">{item.brand}</div>
                              )}
                              <div style={{ fontSize: 10, color: "var(--on-surface-variant)", opacity: 0.85, marginTop: 1 }}>
                                {item.sourceAttribution}
                              </div>
                            </div>
                          </div>
                          <span className="stitch-food-portion-badge shrink-0">
                            {item.servingSize} {item.servingUnit}
                          </span>
                        </div>

                        {/* Household Serving if present */}
                        {item.householdServing && (
                          <div style={{ fontSize: 11, color: "var(--on-surface-variant)", margin: "4px 0 8px", fontStyle: "italic" }}>
                            Serving basis: {item.householdServing}
                          </div>
                        )}

                        {/* 4-Cell Macro Grid */}
                        <div className="stitch-food-macro-grid">
                          <div className="stitch-food-macro-cell">
                            <span className="stitch-food-macro-label">Energy</span>
                            <span className={`stitch-food-macro-val calories ${item.calories === null ? "unknown" : ""}`}>
                              {item.calories !== null ? `${item.calories} kcal` : "—"}
                            </span>
                          </div>
                          <div className="stitch-food-macro-cell">
                            <span className="stitch-food-macro-label">Protein</span>
                            <span className={`stitch-food-macro-val protein ${item.protein === null ? "unknown" : ""}`}>
                              {formatNutrient(item.protein, "g")}
                            </span>
                          </div>
                          <div className="stitch-food-macro-cell">
                            <span className="stitch-food-macro-label">Carbs</span>
                            <span className={`stitch-food-macro-val carbs ${item.carbs === null ? "unknown" : ""}`}>
                              {formatNutrient(item.carbs, "g")}
                            </span>
                          </div>
                          <div className="stitch-food-macro-cell">
                            <span className="stitch-food-macro-label">Fat</span>
                            <span className={`stitch-food-macro-val fat ${item.fat === null ? "unknown" : ""}`}>
                              {formatNutrient(item.fat, "g")}
                            </span>
                          </div>
                        </div>

                        {/* Fiber Row if present */}
                        {item.fiber !== null && (
                          <div className="stitch-food-fiber-row">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                            <span>
                              Dietary Fiber: <strong className="stitch-food-fiber-badge">{item.fiber} g</strong> per serving
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Action Row */}
                      <div className="stitch-food-card-actions" style={{ marginTop: 12 }}>
                        <button
                          type="button"
                          className="stitch-food-action-btn edit-btn"
                          onClick={() => setInspectingApiFood(item)}
                          style={{ flex: "0 0 auto", padding: "0 12px" }}
                        >
                          <span>🔍 Details</span>
                        </button>
                        <button
                          type="button"
                          disabled={isImported || isImporting}
                          onClick={() => handleImportApiFood(item)}
                          className="stitch-food-primary-btn"
                          style={{
                            flex: 1,
                            height: 34,
                            fontSize: 12,
                            padding: "0 12px",
                            backgroundColor: isImported ? "var(--surface-container-high)" : "var(--primary)",
                            color: isImported ? "var(--on-surface-variant)" : "#ffffff",
                            border: isImported ? "1px solid var(--border-subtle)" : "none",
                            justifyContent: "center",
                          }}
                        >
                          {isImporting
                            ? "Saving..."
                            : isImported
                            ? "✓ In Library"
                            : "+ Save to Library"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty initial state */}
          {!apiLoading && apiResults.length === 0 && !apiError && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--on-surface-variant)" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🥑</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--on-surface)", marginBottom: 4 }}>
                Search Over 3 Million Food Items
              </div>
              <p style={{ fontSize: 13, maxWidth: 440, margin: "0 auto 16px", lineHeight: 1.5 }}>
                Type an ingredient or brand name above, or click one of the quick suggestions to explore nutritional data from USDA FoodData Central and Open Food Facts.
              </p>
            </div>
          )}
        </section>
      )}

      {/* INSPECT API FOOD MODAL */}
      {inspectingApiFood && (
        <div className="stitch-modal-backdrop" onClick={() => setInspectingApiFood(null)} role="dialog" aria-modal="true">
          <div
            className="stitch-modal-card"
            style={{ width: "100%", maxWidth: 540, boxSizing: "border-box" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="stitch-modal-close-btn" onClick={() => setInspectingApiFood(null)} aria-label="Close modal">
              ×
            </button>
            <span className="stitch-modal-kicker">
              {inspectingApiFood.source === "usda" ? "🏛️ USDA FOODDATA CENTRAL" : "📦 OPEN FOOD FACTS"}
            </span>
            <h2 className="stitch-modal-title">{inspectingApiFood.name}</h2>
            {inspectingApiFood.brand && (
              <p style={{ margin: "-12px 0 16px", fontSize: 13, color: "var(--on-surface-variant)" }}>
                Brand / Manufacturer: <strong>{inspectingApiFood.brand}</strong>
              </p>
            )}

            <div style={{ borderRadius: 12, padding: 14, backgroundColor: "var(--surface-container)", marginBottom: 16, border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: "var(--on-surface)" }}>
                Serving Details &amp; Attribution
              </div>
              <div style={{ fontSize: 12, color: "var(--on-surface-variant)", lineHeight: 1.6 }}>
                <div>• Base Portion: <strong>{inspectingApiFood.servingSize} {inspectingApiFood.servingUnit}</strong></div>
                {inspectingApiFood.householdServing && (
                  <div>• Household Serving: <strong>{inspectingApiFood.householdServing}</strong></div>
                )}
                <div>• Attribution Notice: <strong>{inspectingApiFood.sourceAttribution}</strong></div>
                <div>• Catalog Identifier: <code style={{ fontSize: 11 }}>{inspectingApiFood.id}</code></div>
              </div>
            </div>

            {/* Nutrition Breakdown Table */}
            <div style={{ borderRadius: 12, border: "1px solid var(--border-subtle)", overflow: "hidden", marginBottom: 18 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--surface-container-high)", textAlign: "left" }}>
                    <th style={{ padding: "8px 12px", color: "var(--on-surface)" }}>Nutrient</th>
                    <th style={{ padding: "8px 12px", textAlign: "right", color: "var(--on-surface)" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "8px 12px", color: "var(--on-surface)" }}>Calories (Energy)</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "var(--primary)" }}>
                      {inspectingApiFood.calories !== null ? `${inspectingApiFood.calories} kcal` : "Unknown"}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "8px 12px", color: "var(--on-surface)" }}>Protein</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "var(--on-surface)" }}>
                      {inspectingApiFood.protein !== null ? `${inspectingApiFood.protein} g` : "Unknown"}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "8px 12px", color: "var(--on-surface)" }}>Carbohydrates</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "var(--on-surface)" }}>
                      {inspectingApiFood.carbs !== null ? `${inspectingApiFood.carbs} g` : "Unknown"}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "8px 12px", color: "var(--on-surface)" }}>Total Fat</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "var(--on-surface)" }}>
                      {inspectingApiFood.fat !== null ? `${inspectingApiFood.fat} g` : "Unknown"}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 12px", color: "var(--on-surface)" }}>Dietary Fiber</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "var(--on-surface)" }}>
                      {inspectingApiFood.fiber !== null ? `${inspectingApiFood.fiber} g` : "Unknown"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                className="stitch-food-action-btn"
                style={{ height: 42, padding: "0 18px", borderRadius: 9999 }}
                onClick={() => setInspectingApiFood(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="stitch-food-primary-btn"
                style={{ height: 42, padding: "0 20px", background: "var(--primary)", color: "#ffffff" }}
                onClick={() => {
                  handleImportApiFood(inspectingApiFood);
                  setInspectingApiFood(null);
                }}
              >
                + Save to My Library
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {(modalMode === "create" || modalMode === "edit") && (
        <div className="stitch-modal-backdrop" onClick={closeModal} role="dialog" aria-modal="true">
          <div
            className="stitch-modal-card"
            style={{ width: "100%", maxWidth: 620, boxSizing: "border-box" }}
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
                    placeholder="e.g. Homemade, Local Market, Kirkland"
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
                    placeholder="e.g. 100"
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
                      placeholder="e.g. 210"
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
                      placeholder="e.g. 24"
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
                      placeholder="e.g. 15"
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
                      placeholder="e.g. 8"
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
                      placeholder="e.g. 4"
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
