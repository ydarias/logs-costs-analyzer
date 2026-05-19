import { useState, useCallback } from "react";
import { THEME, PRIORITY_COLORS, UNIT_WEIGHTS } from "./lib/theme.js";
import { parseUsageCSV } from "./lib/csvParser.js";
import { fmt, fmtGB } from "./lib/format.js";
import { useSummary, usePriorityBreakdown, useTimeSeries } from "./hooks/useSummary.js";
import { Card, Pill, Stat } from "./components/Primitives.jsx";
import DropZone from "./components/DropZone.jsx";
import { OverviewTab, ByAppTab, PriorityTab, TimelineTab } from "./components/Tabs.jsx";

export default function App() {
  const [rows, setRows]           = useState([]);
  const [fileNames, setFileNames] = useState([]);
  const [totalCost, setTotalCost] = useState("");
  const [tab, setTab]             = useState("overview");
  const [groupBy, setGroupBy]     = useState("application");

  // ── File loading ────────────────────────────────────────────────────────
  const handleFiles = useCallback(async (files) => {
    const parsed = [];
    const names  = [];
    for (const file of files) {
      const text = await file.text();
      parsed.push(...parseUsageCSV(text));
      names.push(file.name);
    }
    setRows((prev) => [...prev, ...parsed]);
    setFileNames((prev) => [...prev, ...names]);
  }, []);

  const reset = () => {
    setRows([]);
    setFileNames([]);
    setTotalCost("");
    setTab("overview");
  };

  // ── Derived data ────────────────────────────────────────────────────────
  // `cost` is used in render; derived from totalCost on every render.
  // The useMemo hooks receive totalCost (the state string) as a dep
  // so they recompute on every keystroke, not just on numeric changes.
  const cost = Number(totalCost) || 0;

  const summary          = useSummary({ rows, groupBy, totalCost });
  const priorityBreakdown = usePriorityBreakdown({ rows, PRIORITY_COLORS, THEME });
  const timeSeries       = useTimeSeries({ rows });

  const TABS = [
    "overview",
    "by_app",
    "priority",
    ...(timeSeries.length ? ["timeline"] : []),
  ];

  // ── Upload screen ────────────────────────────────────────────────────────
  if (!rows.length) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: THEME.bg,
          color: THEME.text,
          fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
          padding: "48px 32px",
        }}
      >
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          {/* Logo bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
            <div style={{ width: 6, height: 40, background: THEME.accent, borderRadius: 3 }} />
            <div>
              <div style={{ fontSize: 11, color: THEME.muted, letterSpacing: 3, textTransform: "uppercase" }}>
                IBM Cloud
              </div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>
                Logs Cost Correlator
              </h1>
            </div>
          </div>

          <p style={{ color: THEME.muted, marginBottom: 48, fontSize: 14, lineHeight: 1.7, maxWidth: 560 }}>
            Upload your Data Usage CSV exports from IBM Cloud Logs, enter your monthly invoice
            cost, and instantly see which applications and subsystems are driving your bill.
          </p>

          <DropZone onFiles={handleFiles} />

          {/* How-to cards */}
          <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { step: "01", title: "Export from IBM Cloud Logs", desc: "Settings → Data Usage → Export as CSV. You can export multiple months." },
              { step: "02", title: "Upload all CSV files",       desc: "Drop one or more files above. The app merges them automatically." },
              { step: "03", title: "Enter your invoice cost",    desc: "Find your Cloud Logs line item in the IBM Cloud invoice and type the monthly total." },
              { step: "04", title: "Analyse the report",         desc: "See cost breakdown by application, subsystem, and priority tier." },
            ].map(({ step, title, desc }) => (
              <Card key={step} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: THEME.accentSoft, lineHeight: 1 }}>
                  {step}
                </span>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 14 }}>{title}</div>
                  <div style={{ color: THEME.muted, fontSize: 13, lineHeight: 1.6 }}>{desc}</div>
                </div>
              </Card>
            ))}
          </div>

          {/* Expected columns */}
          <Card style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: THEME.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
              Expected CSV columns
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["application", "subsystem", "priority", "gb / gb_sent", "units / units_used", "date (optional)"].map(
                (c) => (
                  <code
                    key={c}
                    style={{
                      background: THEME.accentSoft + "55",
                      color: THEME.accent,
                      padding: "3px 10px",
                      borderRadius: 4,
                      fontSize: 12,
                    }}
                  >
                    {c}
                  </code>
                )
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        background: THEME.bg,
        color: THEME.text,
        fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          background: THEME.surface,
          borderBottom: `1px solid ${THEME.border}`,
          padding: "14px 28px",
          display: "flex",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
          <div style={{ width: 4, height: 28, background: THEME.accent, borderRadius: 2 }} />
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: -0.5 }}>
            Logs Cost Correlator
          </span>
          <span style={{ color: THEME.muted, fontSize: 12 }}>|</span>
          <span style={{ color: THEME.muted, fontSize: 12 }}>
            {fileNames.length} file{fileNames.length !== 1 ? "s" : ""} ·{" "}
            {rows.length.toLocaleString()} rows
          </span>
        </div>

        {/* Cost input */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: THEME.muted, fontSize: 12 }}>Monthly invoice cost (USD)</span>
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: THEME.accent,
                fontWeight: 700,
              }}
            >
              $
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={totalCost}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || /^\d*\.?\d*$/.test(val)) setTotalCost(val);
              }}
              placeholder="0.00"
              style={{
                background: THEME.bg,
                border: `1px solid ${THEME.border}`,
                borderRadius: 6,
                color: THEME.text,
                padding: "7px 12px 7px 22px",
                width: 130,
                fontSize: 14,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>
          <button
            onClick={reset}
            style={{
              background: "transparent",
              border: `1px solid ${THEME.border}`,
              color: THEME.muted,
              borderRadius: 6,
              padding: "7px 14px",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            ↺ Reset
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>
        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
          <Card><Stat label="Total Ingested" value={fmtGB(summary.totalGB)} sub="across all priorities" /></Card>
          <Card><Stat label="Total Units"    value={fmt(summary.totalUnits, 2)} sub="weighted by TCO tier" /></Card>
          <Card>
            <Stat
              label="Invoice Cost"
              value={cost ? "$" + fmt(cost, 2) : "—"}
              sub={cost ? "of monthly invoice" : "enter above to unlock"}
              accent={cost ? THEME.accent : THEME.muted}
            />
          </Card>
          <Card>
            <Stat
              label="Applications"
              value={new Set(rows.map((r) => r.application)).size}
              sub="distinct log sources"
            />
          </Card>
        </div>

        {/* TCO legend */}
        <Card style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: THEME.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
            TCO Priority — billing weight per GB
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {[
              ["HIGH",    "0.75 units"],
              ["MEDIUM",  "0.32 units"],
              ["LOW",     "0.12 units"],
              ["BLOCK",   "0.065 units"],
              ["METRICS", "~0.033 units"],
            ].map(([p, w]) => (
              <div key={p} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: PRIORITY_COLORS[p] }} />
                <Pill label={p} color={PRIORITY_COLORS[p]} />
                <span style={{ color: THEME.muted, fontSize: 12 }}>{w}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 20,
            borderBottom: `1px solid ${THEME.border}`,
          }}
        >
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: "transparent",
                border: "none",
                color: tab === t ? THEME.accent : THEME.muted,
                borderBottom: `2px solid ${tab === t ? THEME.accent : "transparent"}`,
                padding: "8px 20px",
                cursor: "pointer",
                fontSize: 13,
                fontFamily: "inherit",
                fontWeight: tab === t ? 700 : 400,
                textTransform: "capitalize",
                letterSpacing: 0.5,
                marginBottom: -1,
              }}
            >
              {t.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "overview" && (
          <OverviewTab summary={summary} priorityBreakdown={priorityBreakdown} cost={cost} />
        )}
        {tab === "by_app" && (
          <ByAppTab summary={summary} groupBy={groupBy} setGroupBy={setGroupBy} cost={cost} />
        )}
        {tab === "priority" && (
          <PriorityTab priorityBreakdown={priorityBreakdown} totalUnits={summary.totalUnits} cost={cost} />
        )}
        {tab === "timeline" && timeSeries.length > 0 && (
          <TimelineTab timeSeries={timeSeries} />
        )}

        {/* Footer */}
        <div
          style={{
            marginTop: 32,
            color: THEME.muted,
            fontSize: 11,
            lineHeight: 1.8,
            borderTop: `1px solid ${THEME.border}`,
            paddingTop: 20,
          }}
        >
          <strong style={{ color: THEME.text }}>Cost Allocation Method:</strong> Costs are
          allocated proportionally by <em>billing units</em> (not raw GB), because IBM Cloud
          Logs / Coralogix charges by weighted units — HIGH tier costs 0.75 units/GB vs 0.12
          for LOW. Formula:{" "}
          <code style={{ color: THEME.accent }}>
            app_cost = (app_units / total_units) × invoice_cost
          </code>
          . This matches the TCO weighting applied by the platform. COS archive storage costs
          are billed separately.
        </div>
      </div>
    </div>
  );
}
