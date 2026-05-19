import { useState, useEffect, memo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from "recharts";
import { THEME, PRIORITY_COLORS, UNIT_WEIGHTS } from "../lib/theme.js";
import { fmt, fmtUSD, fmtGB } from "../lib/format.js";
import { Card, Pill, ChartTip } from "./Primitives.jsx";

// ── Overview ────────────────────────────────────────────────────────────────

export function OverviewTab({ summary, priorityBreakdown, cost }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* GB by app — horizontal bar */}
      <Card>
        <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 14 }}>
          Data Ingested by Application
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={summary.groups.slice(0, 12)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
            <XAxis
              type="number"
              tick={{ fill: THEME.muted, fontSize: 11 }}
              tickFormatter={(v) => v.toFixed(1) + " GB"}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: THEME.muted, fontSize: 11 }}
              width={110}
            />
            <Tooltip content={<ChartTip />} />
            <Bar dataKey="gb" name="GB Ingested" fill={THEME.accent} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Priority pie */}
      <Card>
        <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 14 }}>
          Priority Tier Distribution (GB)
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={priorityBreakdown}
              dataKey="gb"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={110}
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(1)}%`
              }
              labelLine={{ stroke: THEME.border }}
            >
              {priorityBreakdown.map((p, i) => (
                <Cell key={i} fill={p.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTip />} />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Cost allocation table — always visible, shows "—" until cost is entered */}
      <Card style={{ gridColumn: "1 / -1" }}>
        <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 14 }}>
          Cost Allocation — Top Applications
          {!cost && (
            <span
              style={{
                marginLeft: 12,
                fontSize: 12,
                color: THEME.muted,
                fontWeight: 400,
              }}
            >
              ← enter invoice cost above to see USD values
            </span>
          )}
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${THEME.border}` }}>
              {["Application", "GB Ingested", "% of GB", "Units", "% of Cost", "Est. Cost (USD)"].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      color: THEME.muted,
                      fontWeight: 600,
                      fontSize: 11,
                      letterSpacing: 1,
                    }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {summary.groups.slice(0, 15).map((g, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${THEME.border}22` }}>
                <td style={{ padding: "10px 12px", fontWeight: 600 }}>{g.name}</td>
                <td style={{ padding: "10px 12px", color: THEME.muted }}>{fmtGB(g.gb)}</td>
                <td style={{ padding: "10px 12px" }}>
                  <MiniBar pct={g.gbShare} color={THEME.accent} />
                </td>
                <td style={{ padding: "10px 12px", color: THEME.muted }}>
                  {fmt(g.units, 3)}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  {cost
                    ? <MiniBar pct={g.unitShare} color={THEME.high} />
                    : <span style={{ color: THEME.muted }}>—</span>}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    fontWeight: 700,
                    color: cost ? THEME.accent : THEME.muted,
                  }}
                >
                  {cost ? fmtUSD(g.cost) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── By App ──────────────────────────────────────────────────────────────────

const CARD_STYLE = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
  gap: 16,
  alignItems: "center",
};

const PAGE_SIZE = 50;

const GroupCard = memo(function GroupCard({ g, cost }) {
  return (
    <Card style={CARD_STYLE}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
          {g.name}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {Object.entries(g.byPriority).map(([p, gb]) => (
            <Pill
              key={p}
              label={`${p} ${fmtGB(gb)}`}
              color={PRIORITY_COLORS[p] || THEME.muted}
            />
          ))}
        </div>
      </div>
      <StatCell label="GB Ingested" value={fmtGB(g.gb)} />
      <StatCell label="Share" value={`${(g.gbShare * 100).toFixed(2)}%`} />
      <StatCell label="Billing Units" value={fmt(g.units, 3)} />
      <div>
        <div style={{ fontSize: 11, color: THEME.muted, marginBottom: 2 }}>
          Est. Cost
        </div>
        <div
          style={{
            fontWeight: 800,
            color: cost ? THEME.accent : THEME.muted,
            fontSize: 16,
          }}
        >
          {cost ? fmtUSD(g.cost) : "—"}
        </div>
      </div>
    </Card>
  );
});

export const ByAppTab = memo(function ByAppTab({ summary, groupBy, setGroupBy, cost }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [groupBy]);

  const visible = summary.groups.slice(0, visibleCount);
  const remaining = summary.groups.length - visibleCount;

  return (
    <div>
      {/* Group-by toggle */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 20,
          alignItems: "center",
        }}
      >
        <span style={{ color: THEME.muted, fontSize: 12 }}>Group by:</span>
        {["application", "subsystem"].map((g) => (
          <button
            key={g}
            onClick={() => setGroupBy(g)}
            style={{
              background: groupBy === g ? THEME.accent : "transparent",
              border: `1px solid ${groupBy === g ? THEME.accent : THEME.border}`,
              color: groupBy === g ? "#fff" : THEME.muted,
              borderRadius: 6,
              padding: "5px 14px",
              cursor: "pointer",
              fontSize: 12,
              fontFamily: "inherit",
            }}
          >
            {g}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {visible.map((g) => (
          <GroupCard key={g.name} g={g} cost={cost} />
        ))}
      </div>

      {remaining > 0 && (
        <button
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          style={{
            marginTop: 16,
            width: "100%",
            padding: "10px 0",
            background: "transparent",
            border: `1px solid ${THEME.border}`,
            borderRadius: 8,
            color: THEME.muted,
            cursor: "pointer",
            fontSize: 13,
            fontFamily: "inherit",
          }}
        >
          Show {Math.min(remaining, PAGE_SIZE)} more ({remaining} remaining)
        </button>
      )}
    </div>
  );
});

// ── Priority ─────────────────────────────────────────────────────────────────

export function PriorityTab({ priorityBreakdown, totalUnits, cost }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <Card>
        <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 14 }}>
          GB per Priority Tier
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={priorityBreakdown}>
            <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
            <XAxis dataKey="name" tick={{ fill: THEME.muted, fontSize: 12 }} />
            <YAxis
              tick={{ fill: THEME.muted, fontSize: 11 }}
              tickFormatter={(v) => v.toFixed(1)}
            />
            <Tooltip content={<ChartTip />} />
            <Bar dataKey="gb" name="GB" radius={[4, 4, 0, 0]}>
              {priorityBreakdown.map((p, i) => (
                <Cell key={i} fill={p.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 14 }}>
          Billing Units per Priority Tier
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={priorityBreakdown}>
            <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
            <XAxis dataKey="name" tick={{ fill: THEME.muted, fontSize: 12 }} />
            <YAxis
              tick={{ fill: THEME.muted, fontSize: 11 }}
              tickFormatter={(v) => v.toFixed(2)}
            />
            <Tooltip content={<ChartTip />} />
            <Bar dataKey="units" name="Units" radius={[4, 4, 0, 0]}>
              {priorityBreakdown.map((p, i) => (
                <Cell key={i} fill={p.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card style={{ gridColumn: "1 / -1" }}>
        <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 14 }}>
          Priority Detail — Unit Multipliers Applied
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${THEME.border}` }}>
              {["Priority Tier", "GB Ingested", "Unit Weight (per GB)", "Weighted Units", "Billing Impact", "Est. Cost (USD)"].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      color: THEME.muted,
                      fontWeight: 600,
                      fontSize: 11,
                      letterSpacing: 1,
                    }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {priorityBreakdown.map((p, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${THEME.border}22` }}>
                <td style={{ padding: "10px 12px" }}>
                  <Pill label={p.name} color={p.color} />
                </td>
                <td style={{ padding: "10px 12px" }}>{fmtGB(p.gb)}</td>
                <td
                  style={{
                    padding: "10px 12px",
                    color: THEME.muted,
                    fontFamily: "monospace",
                  }}
                >
                  {UNIT_WEIGHTS[p.name] ?? "—"}
                </td>
                <td style={{ padding: "10px 12px", fontWeight: 700 }}>
                  {fmt(p.units, 3)}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 100,
                        height: 8,
                        background: THEME.border,
                        borderRadius: 4,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${totalUnits ? (p.units / totalUnits) * 100 : 0}%`,
                          height: "100%",
                          background: p.color,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 12 }}>
                      {totalUnits
                        ? ((p.units / totalUnits) * 100).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    fontWeight: 700,
                    color: cost ? THEME.accent : THEME.muted,
                  }}
                >
                  {totalUnits && cost ? fmtUSD((p.units / totalUnits) * cost) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── Timeline ─────────────────────────────────────────────────────────────────

export function TimelineTab({ timeSeries }) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card>
        <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 14 }}>
          Daily GB Ingested
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeSeries}>
            <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
            <XAxis dataKey="date" tick={{ fill: THEME.muted, fontSize: 11 }} />
            <YAxis
              tick={{ fill: THEME.muted, fontSize: 11 }}
              tickFormatter={(v) => v.toFixed(1)}
            />
            <Tooltip content={<ChartTip />} />
            <Line
              type="monotone"
              dataKey="gb"
              name="GB"
              stroke={THEME.accent}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 14 }}>
          Daily Billing Units
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={timeSeries}>
            <CartesianGrid strokeDasharray="3 3" stroke={THEME.border} />
            <XAxis dataKey="date" tick={{ fill: THEME.muted, fontSize: 11 }} />
            <YAxis
              tick={{ fill: THEME.muted, fontSize: 11 }}
              tickFormatter={(v) => v.toFixed(2)}
            />
            <Tooltip content={<ChartTip />} />
            <Line
              type="monotone"
              dataKey="units"
              name="Units"
              stroke={THEME.high}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function MiniBar({ pct, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: 60,
          height: 6,
          background: THEME.border,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct * 100}%`,
            height: "100%",
            background: color,
            borderRadius: 3,
          }}
        />
      </div>
      <span style={{ fontSize: 12 }}>{(pct * 100).toFixed(1)}%</span>
    </div>
  );
}

function StatCell({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: THEME.muted, marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 700 }}>{value}</div>
    </div>
  );
}
