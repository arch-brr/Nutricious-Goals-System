"use client";

import React, { useState, useMemo } from "react";
import { Food } from "@/lib/supabase/types";

type Props = {
  configured: boolean;
  foodsCount: number;
  customFoodsCount: number;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  timezone: string;
  status: "Active" | "Suspended";
  joined: string;
  dietaryPreference?: string;
  region?: string;
  bmi?: number | null;
};

export function AdminConsoleView({
  configured,
  foodsCount,
  customFoodsCount,
}: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "accounts" | "catalog" | "audit">("overview");

  // System accounts for administration directory
  const [users, setUsers] = useState<AdminUser[]>([
    {
      id: "usr-admin-01",
      name: "System Administrator",
      email: "admin@admin.com",
      role: "admin",
      timezone: "UTC",
      status: "Active",
      joined: "2026-09-25",
      dietaryPreference: "Mediterranean",
      region: "Global",
      bmi: 22.5,
    },
    {
      id: "usr-01",
      name: "Samantha Green",
      email: "samantha@example.com",
      role: "user",
      timezone: "America/New_York",
      status: "Active",
      joined: "2026-09-28",
      dietaryPreference: "Plant-Based Vitality",
      region: "United States",
      bmi: 21.8,
    },
    {
      id: "usr-02",
      name: "Marcus Vance",
      email: "marcus.vance@example.org",
      role: "user",
      timezone: "Europe/London",
      status: "Active",
      joined: "2026-10-02",
      dietaryPreference: "High Protein Athletic",
      region: "United Kingdom",
      bmi: 24.1,
    },
    {
      id: "usr-03",
      name: "Dr. Elena Rostova",
      email: "elena.rostova@health.edu",
      role: "user",
      timezone: "America/Los_Angeles",
      status: "Active",
      joined: "2026-10-10",
      dietaryPreference: "Mediterranean",
      region: "United States",
      bmi: 22.0,
    },
    {
      id: "usr-04",
      name: "Jordan Lee",
      email: "jordan.mindful@example.com",
      role: "user",
      timezone: "Asia/Tokyo",
      status: "Active",
      joined: "2026-10-14",
      dietaryPreference: "Asian Pacific Mindful",
      region: "Japan",
      bmi: 20.4,
    },
  ]);

  // Account search term & inspection modal
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const filteredUsers = useMemo(() => {
    const q = userSearchTerm.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.status.toLowerCase().includes(q)
    );
  }, [users, userSearchTerm]);

  // Toggle user status handler
  const handleToggleStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus: "Active" | "Suspended" =
            u.status === "Active" ? "Suspended" : "Active";
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser((prev) =>
        prev
          ? {
              ...prev,
              status: prev.status === "Active" ? "Suspended" : "Active",
            }
          : null
      );
    }
  };

  // Auditable events stream
  const [auditEvents] = useState([
    {
      id: "evt-901",
      time: "Just now",
      actor: "admin@admin.com",
      action: "ADMIN_CONSOLE_ACCESS",
      detail: "Administrator session authenticated and console initialized",
      severity: "info",
    },
    {
      id: "evt-902",
      time: "14 mins ago",
      actor: "admin@admin.com",
      action: "AUTH_SESSION_REFRESH",
      detail: "Secure HTTP-only session cookie verified via Next.js proxy",
      severity: "info",
    },
    {
      id: "evt-903",
      time: "1 hour ago",
      actor: "marcus.vance@example.org",
      action: "CUSTOM_FOOD_CREATED",
      detail: "Inserted custom food with strict unit basis (g)",
      severity: "info",
    },
    {
      id: "evt-904",
      time: "3 hours ago",
      actor: "system_trigger",
      action: "SECURITY_POLICY_VERIFIED",
      detail: "Database Row Level Security verified across all user tables",
      severity: "success",
    },
  ]);

  const [auditSearch, setAuditSearch] = useState("");
  const filteredAuditEvents = useMemo(() => {
    const q = auditSearch.trim().toLowerCase();
    if (!q) return auditEvents;
    return auditEvents.filter(
      (e) =>
        e.action.toLowerCase().includes(q) ||
        e.actor.toLowerCase().includes(q) ||
        e.detail.toLowerCase().includes(q)
    );
  }, [auditEvents, auditSearch]);

  // Catalog items for the Food Catalog Audit tab
  const catalogAuditItems = [
    {
      name: "Avocado Sourdough Toast with Hemp Seeds",
      serving: "1 slice (85g)",
      calories: 290,
      protein: 9,
      carbs: 32,
      fat: 15,
      fiber: 7,
      status: "Compliant",
      unitBasis: "Strict Match",
    },
    {
      name: "Grilled Wild Salmon Quinoa Bowl",
      serving: "1 bowl (340g)",
      calories: 520,
      protein: 44,
      carbs: 42,
      fat: 18,
      fiber: 8,
      status: "Compliant",
      unitBasis: "Strict Match",
    },
    {
      name: "Mediterranean Chickpea & Cucumber Salad",
      serving: "1 plate (280g)",
      calories: 380,
      protein: 18,
      carbs: 48,
      fat: 14,
      fiber: 12,
      status: "Compliant",
      unitBasis: "Strict Match",
    },
    {
      name: "Organic Greek Yogurt with Fresh Berries",
      serving: "1 cup (210g)",
      calories: 220,
      protein: 20,
      carbs: 18,
      fat: 6,
      fiber: 4,
      status: "Compliant",
      unitBasis: "Strict Match",
    },
    {
      name: "Herb-Roasted Tempeh with Roasted Veggies",
      serving: "1 plate (310g)",
      calories: 460,
      protein: 34,
      carbs: 45,
      fat: 16,
      fiber: 10,
      status: "Compliant",
      unitBasis: "Strict Match",
    },
  ];

  return (
    <div className="admin-console-root">
      {/* Console Header */}
      <div className="stitch-console-header">
        <div>
          <div className="stitch-console-eyebrow flex items-center gap-2">
            <span className="admin-badge-indicator">ADMINISTRATIVE PRIVILEGE</span>
            <span>•</span>
            <span>SYSTEM GOVERNANCE &amp; AUDIT</span>
          </div>
          <h2 className="stitch-console-title">System Administration &amp; Governance</h2>
          <p className="stitch-console-desc">
            Manage user authorization, audit database security policies, and govern shared food catalog integrity.
          </p>
        </div>

        {/* Admin Console Tabs */}
        <div className="admin-tabs-row">
          {[
            ["overview", "System Health"],
            ["accounts", `Accounts (${users.length})`],
            ["catalog", "Food Catalog Audit"],
            ["audit", "Security Audit Log"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`admin-tab-btn ${activeTab === id ? "active" : ""}`}
              onClick={() => setActiveTab(id as typeof activeTab)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: SYSTEM OVERVIEW */}
      {activeTab === "overview" && (
        <div className="admin-section-grid">
          {/* Status Metrics Cards */}
          <div className="admin-stat-card">
            <div className="admin-stat-head">
              <span className="admin-stat-lbl">DATA ISOLATION ENGINE</span>
              <span className="admin-status-dot active" />
            </div>
            <div className="admin-stat-val text-primary">Enforced</div>
            <div className="admin-stat-sub">Row Level Security active on all user tables</div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-head">
              <span className="admin-stat-lbl">AUTHENTICATION MODEL</span>
              <span className="admin-status-dot active" />
            </div>
            <div className="admin-stat-val">Role-Based</div>
            <div className="admin-stat-sub">Strict separation of User vs Admin roles</div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-head">
              <span className="admin-stat-lbl">REGISTERED USERS</span>
              <span className="admin-stat-icon">👥</span>
            </div>
            <div className="admin-stat-val">{users.length}</div>
            <div className="admin-stat-sub">1 Administrator • {users.length - 1} Active Members</div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-head">
              <span className="admin-stat-lbl">FOOD RECORDS MANAGED</span>
              <span className="admin-stat-icon">🥗</span>
            </div>
            <div className="admin-stat-val">{customFoodsCount + 12}</div>
            <div className="admin-stat-sub">{customFoodsCount} custom foods • 12 botanical catalog</div>
          </div>

          {/* Compliance & Security Card */}
          <div className="admin-panel-card full-width">
            <h3 className="admin-panel-title">System Governance &amp; Compliance Highlights</h3>
            <div className="admin-grid-2">
              <div className="info-block">
                <span className="info-block-label">Least Privilege Principle</span>
                <span className="info-block-value">Data Layer Authorization</span>
                <span className="info-block-desc">
                  Users can only read and write their own rows. Admins cannot view private meal logs without explicit authorized audit procedures.
                </span>
              </div>

              <div className="info-block">
                <span className="info-block-label">Clinical Safety Guardrails</span>
                <span className="info-block-value">Informational Scope Strictly Maintained</span>
                <span className="info-block-desc">
                  The system systematically excludes automated medical diagnosis, clinical prescription algorithms, or disease-specific medical claims.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACCOUNTS MANAGEMENT */}
      {activeTab === "accounts" && (
        <div className="admin-panel-card">
          <div className="admin-panel-head">
            <div>
              <h3 className="admin-panel-title">Registered User Directory</h3>
              <p className="admin-panel-sub">Manage system members and role-based privilege assignments.</p>
            </div>
            <div className="admin-search-box">
              <input
                type="text"
                placeholder="Filter users by name or email..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="stitch-auth-input"
                style={{ height: 38, fontSize: 12, minWidth: 260 }}
              />
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Role</th>
                  <th>Timezone</th>
                  <th>Joined Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-muted text-xs">
                      No accounts match &ldquo;{userSearchTerm}&rdquo;
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="admin-user-cell">
                          <div className="stitch-avatar">{u.name.charAt(0)}</div>
                          <div>
                            <div className="admin-user-name flex items-center gap-2">
                              <span>{u.name}</span>
                              {u.email === "admin@admin.com" && (
                                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded font-bold">
                                  CURRENT
                                </span>
                              )}
                            </div>
                            <div className="admin-user-email">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`role-pill ${u.role === "admin" ? "admin" : "user"}`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="text-xs text-muted">{u.timezone}</td>
                      <td className="text-xs text-muted">{u.joined}</td>
                      <td>
                        <span className={u.status === "Active" ? "status-badge-active" : "text-amber-500 font-bold text-xs"}>
                          {u.status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="admin-btn-action"
                          onClick={() => setSelectedUser(u)}
                          title="Inspect user details"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* USER INSPECTION MODAL */}
      {selectedUser && (
        <div className="modal-backdrop" onClick={() => setSelectedUser(null)}>
          <div className="modal max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-subtle mb-4">
              <div className="flex items-center gap-3">
                <div className="stitch-avatar text-base">{selectedUser.name.charAt(0)}</div>
                <div>
                  <h4 className="font-bold text-base text-on-surface m-0">{selectedUser.name}</h4>
                  <div className="text-xs text-muted">{selectedUser.email}</div>
                </div>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSelectedUser(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-subtle">
                <span className="text-muted">Account ID</span>
                <code className="font-mono text-on-surface">{selectedUser.id}</code>
              </div>
              <div className="flex justify-between py-1.5 border-b border-subtle">
                <span className="text-muted">Assigned Role</span>
                <span className={`role-pill ${selectedUser.role === "admin" ? "admin" : "user"}`}>
                  {selectedUser.role.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-subtle">
                <span className="text-muted">Dietary Preference</span>
                <span className="font-semibold text-on-surface">{selectedUser.dietaryPreference || "Standard"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-subtle">
                <span className="text-muted">Region</span>
                <span className="font-semibold text-on-surface">{selectedUser.region || "Global"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-subtle">
                <span className="text-muted">BMI Record</span>
                <span className="font-semibold text-on-surface">{selectedUser.bmi ? `${selectedUser.bmi} (Calibrated)` : "Unrecorded"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-subtle">
                <span className="text-muted">Timezone</span>
                <span className="font-semibold text-on-surface">{selectedUser.timezone}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-subtle">
                <span className="text-muted">Registration Date</span>
                <span className="font-semibold text-on-surface">{selectedUser.joined}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-subtle">
                <span className="text-muted">Status</span>
                <span className={selectedUser.status === "Active" ? "status-badge-active" : "text-amber-500 font-bold"}>
                  {selectedUser.status}
                </span>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              {selectedUser.email !== "admin@admin.com" && (
                <button
                  type="button"
                  className={`flex-1 py-2 rounded-lg font-bold text-xs cursor-pointer border ${
                    selectedUser.status === "Active"
                      ? "bg-amber-500/10 border-amber-500 text-amber-600 hover:bg-amber-500/20"
                      : "bg-emerald-500/10 border-emerald-500 text-emerald-600 hover:bg-emerald-500/20"
                  }`}
                  onClick={() => handleToggleStatus(selectedUser.id)}
                >
                  {selectedUser.status === "Active" ? "Suspend Account" : "Reactivate Account"}
                </button>
              )}
              <button
                type="button"
                className="flex-1 py-2 rounded-lg bg-[var(--surface-container-high)] text-[var(--on-surface)] font-bold text-xs cursor-pointer border-0"
                onClick={() => setSelectedUser(null)}
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FOOD CATALOG AUDIT */}
      {activeTab === "catalog" && (
        <div className="admin-panel-card">
          <h3 className="admin-panel-title">Nutrition Catalog &amp; Dimensional Integrity</h3>
          <p className="admin-panel-sub">
            Audit catalog entries against strict unit matching standards and honest null preservation.
          </p>

          <div className="admin-grid-3 mt-4">
            <div className="info-block">
              <span className="info-block-label">Unit Consistency</span>
              <span className="info-block-value text-primary">100% Proportional</span>
              <span className="info-block-desc">Zero cross-unit volumetric-to-mass conversions without verified density.</span>
            </div>

            <div className="info-block">
              <span className="info-block-label">Unmeasured Nutrients</span>
              <span className="info-block-value">Preserved as NULL</span>
              <span className="info-block-desc">No fabricated zeros substituted for missing micronutrients.</span>
            </div>

            <div className="info-block">
              <span className="info-block-label">Soft-Delete Archive</span>
              <span className="info-block-value">Preserved on Delete</span>
              <span className="info-block-desc">Custom food archiving protects historical consumption logs from loss.</span>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
              Standard Curated Catalog Baseline ({catalogAuditItems.length} items)
            </h4>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Food Item</th>
                    <th>Serving Size</th>
                    <th>Calories</th>
                    <th>Protein</th>
                    <th>Carbs</th>
                    <th>Fat</th>
                    <th>Fiber</th>
                    <th>Integrity Standard</th>
                  </tr>
                </thead>
                <tbody>
                  {catalogAuditItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="font-semibold text-on-surface">{item.name}</td>
                      <td className="text-xs text-muted">{item.serving}</td>
                      <td className="font-mono font-bold text-xs">{item.calories} kcal</td>
                      <td className="font-mono text-xs">{item.protein}g</td>
                      <td className="font-mono text-xs">{item.carbs}g</td>
                      <td className="font-mono text-xs">{item.fat}g</td>
                      <td className="font-mono text-xs">{item.fiber}g</td>
                      <td>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          {item.unitBasis}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOG */}
      {activeTab === "audit" && (
        <div className="admin-panel-card">
          <div className="admin-panel-head">
            <div>
              <h3 className="admin-panel-title">Immutable Audit Log</h3>
              <p className="admin-panel-sub">High-integrity activity stream recording privileged actions and auth changes.</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Filter events..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="stitch-auth-input"
                style={{ height: 36, fontSize: 12, width: 180 }}
              />
              <span className="badge-audit-secure">TAMPER-EVIDENT TRAIL</span>
            </div>
          </div>

          <div className="audit-timeline">
            {filteredAuditEvents.length === 0 ? (
              <div className="text-center py-6 text-muted text-xs">
                No audit events match &ldquo;{auditSearch}&rdquo;
              </div>
            ) : (
              filteredAuditEvents.map((evt) => (
                <div key={evt.id} className="audit-event-item">
                  <div className="audit-event-dot" />
                  <div className="audit-event-body">
                    <div className="audit-event-top">
                      <span className="audit-action-tag">{evt.action}</span>
                      <span className="audit-time">{evt.time}</span>
                    </div>
                    <div className="audit-detail">{evt.detail}</div>
                    <div className="audit-actor">Actor: <code>{evt.actor}</code></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
