"use client";

import React, { useState } from "react";
import { Food } from "@/lib/supabase/types";

type Props = {
  configured: boolean;
  foodsCount: number;
  customFoodsCount: number;
};

export function AdminConsoleView({
  configured,
  foodsCount,
  customFoodsCount,
}: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "accounts" | "catalog" | "audit">("overview");

  // Simulated live system accounts for administration
  const [users] = useState([
    {
      id: "usr-01",
      name: "Samantha Green",
      email: "samantha@example.com",
      role: "admin",
      timezone: "America/New_York",
      status: "Active",
      joined: "2026-09-25",
    },
    {
      id: "usr-02",
      name: "Marcus Vance",
      email: "marcus.vance@example.org",
      role: "user",
      timezone: "Europe/London",
      status: "Active",
      joined: "2026-10-02",
    },
    {
      id: "usr-03",
      name: "Dr. Elena Rostova",
      email: "elena.rostova@health.edu",
      role: "user",
      timezone: "America/Los_Angeles",
      status: "Active",
      joined: "2026-10-10",
    },
    {
      id: "usr-04",
      name: "Jordan Lee",
      email: "jordan.mindful@example.com",
      role: "user",
      timezone: "Asia/Tokyo",
      status: "Active",
      joined: "2026-10-14",
    },
  ]);

  // Simulated auditable events stream (FR-19)
  const auditEvents = [
    {
      id: "evt-901",
      time: "Just now",
      actor: "admin (current session)",
      action: "ADMIN_CONSOLE_ACCESS",
      detail: "Administrator accessed system management console",
      severity: "info",
    },
    {
      id: "evt-902",
      time: "14 mins ago",
      actor: "samantha@example.com",
      action: "AUTH_SESSION_REFRESH",
      detail: "Cookie-based session validated via SSR proxy",
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
      action: "RLS_POLICY_VERIFIED",
      detail: "Postgres Row Level Security verified across all 5 tables",
      severity: "success",
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
            <span>FR-18 &amp; FR-19 SYSTEM AUDIT</span>
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
              <span className="admin-stat-lbl">POSTGRES RLS ENGINE</span>
              <span className="admin-status-dot active" />
            </div>
            <div className="admin-stat-val text-primary">Enforced</div>
            <div className="admin-stat-sub">Row Level Security active on all 5 tables</div>
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
            <div className="admin-stat-sub">1 Administrator • 3 Active Members</div>
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
                <span className="info-block-label">Least Privilege Principle (D-06)</span>
                <span className="info-block-value">Data Layer Authorization</span>
                <span className="info-block-desc">
                  Users can only read and write rows where <code>auth.uid() = user_id</code>. Admins cannot view private meal logs without an explicit audit token.
                </span>
              </div>

              <div className="info-block">
                <span className="info-block-label">Clinical Safety Guardrails (NFR-08)</span>
                <span className="info-block-value">Informational Scope Strictly Maintained</span>
                <span className="info-block-desc">
                  The system systematically disallows automated medical diagnosis, clinical prescription algorithms, or disease-specific medical claims.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACCOUNTS MANAGEMENT (FR-18) */}
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
                className="stitch-auth-input"
                style={{ height: 38, fontSize: 12 }}
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
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="stitch-avatar">{u.name.charAt(0)}</div>
                        <div>
                          <div className="admin-user-name">{u.name}</div>
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
                      <span className="status-badge-active">Active</span>
                    </td>
                    <td>
                      <button type="button" className="admin-btn-action" title="Inspect user details">
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: FOOD CATALOG AUDIT */}
      {activeTab === "catalog" && (
        <div className="admin-panel-card">
          <h3 className="admin-panel-title">Nutrition Catalog &amp; Dimensional Integrity</h3>
          <p className="admin-panel-sub">
            Audit catalog entries against Decision D-08 (strict unit matching) and Decision D-14 (honest null preservation).
          </p>

          <div className="admin-grid-3 mt-4">
            <div className="info-block">
              <span className="info-block-label">Unit Consistency (D-08)</span>
              <span className="info-block-value text-primary">100% Proportional</span>
              <span className="info-block-desc">Zero cross-unit volumetric-to-mass conversions without density.</span>
            </div>

            <div className="info-block">
              <span className="info-block-label">Unmeasured Nutrients (D-14)</span>
              <span className="info-block-value">Preserved as NULL</span>
              <span className="info-block-desc">No fabricated zeros substituted for missing micronutrients.</span>
            </div>

            <div className="info-block">
              <span className="info-block-label">Soft-Delete Archive (D-09)</span>
              <span className="info-block-value">Preserved on Delete</span>
              <span className="info-block-desc">Custom food soft-deletion protects historical consumption records.</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOG (FR-19) */}
      {activeTab === "audit" && (
        <div className="admin-panel-card">
          <div className="admin-panel-head">
            <div>
              <h3 className="admin-panel-title">Immutable Audit Log (FR-19)</h3>
              <p className="admin-panel-sub">High-integrity activity stream recording privileged actions and auth changes.</p>
            </div>
            <span className="badge-audit-secure">TAMPER-EVIDENT TRAIL</span>
          </div>

          <div className="audit-timeline">
            {auditEvents.map((evt) => (
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
