import { useMemo } from "react";

/**
 * Derive all dashboard data from raw rows, grouping dimension, and invoice cost.
 *
 * Cost is prorated by billing *units* (not raw GB) because IBM Cloud Logs /
 * Coralogix applies TCO-tier multipliers before billing.
 *
 * Formula:  app_cost = (app_units / total_units) × invoice_cost
 *
 * @param {object} params
 * @param {Array}  params.rows       - Parsed CSV rows
 * @param {string} params.groupBy    - "application" | "subsystem" | "priority"
 * @param {string} params.totalCost  - Raw input string (e.g. "1234.56")
 *
 * @returns {{
 *   totalGB:    number,
 *   totalUnits: number,
 *   groups:     Array,
 * }}
 */
export function useSummary({ rows, groupBy, totalCost }) {
  return useMemo(() => {
    // Re-derive inside the memo so every keystroke on the cost input
    // triggers a recompute. totalCost (state string) is in the dep array
    // rather than the derived `cost` number to avoid float-equality misses
    // (e.g. "100." and "100" both parse to 100 but are different strings).
    const resolvedCost = Number(totalCost) || 0;

    const totalGB    = rows.reduce((s, r) => s + r.gb, 0);
    const totalUnits = rows.reduce((s, r) => s + r.units, 0);

    const map = {};
    for (const r of rows) {
      const key =
        groupBy === "application" ? r.application
        : groupBy === "subsystem" ? `${r.application} / ${r.subsystem}`
        : r.priority;

      if (!map[key]) map[key] = { name: key, gb: 0, units: 0, byPriority: {} };
      map[key].gb    += r.gb;
      map[key].units += r.units;
      map[key].byPriority[r.priority] =
        (map[key].byPriority[r.priority] || 0) + r.gb;
    }

    const groups = Object.values(map)
      .sort((a, b) => b.gb - a.gb)
      .map((g) => ({
        ...g,
        gbShare:   totalGB    ? g.gb    / totalGB    : 0,
        unitShare: totalUnits ? g.units / totalUnits : 0,
        cost:      totalUnits ? (g.units / totalUnits) * resolvedCost : 0,
      }));

    return { totalGB, totalUnits, groups };
  }, [rows, groupBy, totalCost]);
}

/**
 * Aggregate rows by priority tier for the Priority tab.
 *
 * @param {object} params
 * @param {Array}  params.rows
 * @param {object} params.PRIORITY_COLORS
 * @param {object} params.THEME
 */
export function usePriorityBreakdown({ rows, PRIORITY_COLORS, THEME }) {
  return useMemo(() => {
    const map = {};
    for (const r of rows) {
      if (!map[r.priority])
        map[r.priority] = { name: r.priority, gb: 0, units: 0 };
      map[r.priority].gb    += r.gb;
      map[r.priority].units += r.units;
    }
    return Object.values(map)
      .sort((a, b) => b.gb - a.gb)
      .map((p) => ({ ...p, color: PRIORITY_COLORS[p.name] || THEME.muted }));
  }, [rows, PRIORITY_COLORS, THEME]);
}

/**
 * Build a daily time-series from rows that have a `date` field.
 * Returns an empty array when no dated rows are present.
 *
 * @param {object} params
 * @param {Array}  params.rows
 */
export function useTimeSeries({ rows }) {
  return useMemo(() => {
    const dated = rows.filter((r) => r.date);
    if (!dated.length) return [];

    const map = {};
    for (const r of dated) {
      const d = String(r.date).slice(0, 10);
      if (!map[d]) map[d] = { date: d, gb: 0, units: 0 };
      map[d].gb    += r.gb;
      map[d].units += r.units;
    }
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [rows]);
}
