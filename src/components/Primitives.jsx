import { THEME } from "../lib/theme.js";

/** Surface card with border and padding. */
export const Card = ({ children, style = {} }) => (
  <div
    style={{
      background: THEME.surface,
      border: `1px solid ${THEME.border}`,
      borderRadius: 12,
      padding: "20px 24px",
      ...style,
    }}
  >
    {children}
  </div>
);

/** Coloured badge for priority tiers. */
export const Pill = ({ label, color }) => (
  <span
    style={{
      background: color + "22",
      color,
      border: `1px solid ${color}55`,
      borderRadius: 4,
      padding: "2px 8px",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1,
      fontFamily: "monospace",
    }}
  >
    {label}
  </span>
);

/** KPI metric with label, large value, and optional subtitle. */
export const Stat = ({ label, value, sub, accent }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <span
      style={{
        fontSize: 12,
        color: THEME.muted,
        textTransform: "uppercase",
        letterSpacing: 1,
      }}
    >
      {label}
    </span>
    <span
      style={{
        fontSize: 28,
        fontWeight: 800,
        color: accent || THEME.text,
        lineHeight: 1,
      }}
    >
      {value}
    </span>
    {sub && (
      <span style={{ fontSize: 12, color: THEME.muted }}>{sub}</span>
    )}
  </div>
);

/** Recharts custom tooltip. */
export const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#0f1724",
        border: `1px solid ${THEME.border}`,
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 13,
      }}
    >
      <div style={{ color: THEME.muted, marginBottom: 6, fontSize: 12 }}>
        {label}
      </div>
      {payload.map((p, i) => (
        <div
          key={i}
          style={{
            color: p.color || THEME.text,
            display: "flex",
            gap: 10,
            justifyContent: "space-between",
          }}
        >
          <span>{p.name}</span>
          <strong>
            {typeof p.value === "number" ? p.value.toFixed(4) : p.value}
          </strong>
        </div>
      ))}
    </div>
  );
};
