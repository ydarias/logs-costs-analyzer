// ── Colour tokens ──────────────────────────────────────────────────────────
export const THEME = {
  bg: "#0a0e1a",
  surface: "#111827",
  border: "#1e2d45",
  accent: "#0f62fe",       // IBM Blue
  accentSoft: "#1d3461",
  text: "#e8edf5",
  muted: "#8b96a8",
  high: "#ff6b35",
  medium: "#f7c948",
  low: "#4ac97e",
  block: "#6b7a99",
  metrics: "#a78bfa",
};

export const PRIORITY_COLORS = {
  HIGH: THEME.high,
  MEDIUM: THEME.medium,
  LOW: THEME.low,
  BLOCK: THEME.block,
  METRICS: THEME.metrics,
};

/**
 * TCO unit multipliers from IBM Cloud Logs / Coralogix billing engine.
 *
 * Priority | GB sent | Units consumed
 * ---------|---------|---------------
 * HIGH     | 1 GB    | 0.75
 * MEDIUM   | 1 GB    | 0.32
 * LOW      | 1 GB    | 0.12
 * BLOCK    | 1 GB    | 0.065
 * METRICS  | 30 GB   | 1  (≈ 0.0333/GB)
 */
export const UNIT_WEIGHTS = {
  HIGH: 0.75,
  MEDIUM: 0.32,
  LOW: 0.12,
  BLOCK: 0.065,
  METRICS: 1 / 30,
};
