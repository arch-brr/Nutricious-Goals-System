"use client";

import { signOut } from "@/app/auth/actions";

type Props = {
  user: {
    id: string;
    email?: string;
    displayName?: string;
    timezone?: string;
  } | null;
  configured: boolean;
};

export function SettingsView({ user, configured }: Props) {
  return (
    <div>
      <div className="planner-topbar">
        <div>
          <div className="section-kicker">PREFERENCES</div>
          <h2>Account & App Settings</h2>
          <p style={{ color: "#8a928c", fontSize: 12, margin: "4px 0 0" }}>
            Manage your personal profile, local timezone, and data persistence preferences.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <article className="panel" style={{ padding: 22 }}>
          <div className="panel-header">
            <div>
              <div className="section-kicker">PROFILE</div>
              <h2 style={{ fontSize: 18 }}>Personal Account</h2>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
            <div>
              <span style={{ color: "#8a928c", fontSize: 11, display: "block" }}>Display Name</span>
              <b style={{ color: "#2d3c34" }}>{user?.displayName || "Not specified"}</b>
            </div>
            <div>
              <span style={{ color: "#8a928c", fontSize: 11, display: "block" }}>Email</span>
              <b style={{ color: "#2d3c34" }}>{user?.email || "Local account"}</b>
            </div>
            <div>
              <span style={{ color: "#8a928c", fontSize: 11, display: "block" }}>Timezone Basis</span>
              <b style={{ color: "#2d3c34" }}>
                {user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"}
              </b>
              <span className="field-hint">
                Plan dates and consumption logs use your local calendar day boundary.
              </span>
            </div>
          </div>

          <form action={signOut} style={{ marginTop: 20 }}>
            <button type="submit" className="btn-sm btn-danger-ghost" style={{ height: 36, padding: "0 14px" }}>
              Sign Out of Nutricious
            </button>
          </form>
        </article>

        <article className="panel" style={{ padding: 22 }}>
          <div className="panel-header">
            <div>
              <div className="section-kicker">SYSTEM STATUS</div>
              <h2 style={{ fontSize: 18 }}>Supabase Storage & Security</h2>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 12, lineHeight: 1.5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: configured ? "#587560" : "#d89b66",
                }}
              />
              <b style={{ color: "#2d3c34" }}>
                {configured ? "Supabase Database Connected" : "Local Prototype Mode"}
              </b>
            </div>
            <p style={{ margin: 0, color: "#6a766e" }}>
              Row Level Security (RLS) is active for all foods, meal plans, items, and consumption
              records. User records are strictly partitioned by authenticated user ID.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
