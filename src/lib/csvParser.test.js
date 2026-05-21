import { describe, it, expect } from "vitest";
import { parseUsageCSV } from "./csvParser.js";
import { UNIT_WEIGHTS } from "./theme.js";

const CSV = `Date,Application,Subsystem,Severity,Priority,Policy name/Parsing rule,type,GB sent
2026-05-01,app-alpha,svc-main,debug,Low,,Logs,1.015001893043518
2026-05-01,app-beta,svc-proxy,debug,Low,,Logs,0.0011147605255246162
2026-05-01,app-gamma,svc-audit:521d444c-16dd-49a0-89a7-546f0e1fa5d0,info,High,,Logs,0.00003721006214618683
2026-05-01,app-delta,svc-main,warning,High,,Logs,0.001740260049700737
2026-05-01,app-gamma,svc-audit:901b03c2-97a5-4483-a218-5301b0b81010,info,High,,Logs,0.001238168217241764
2026-05-01,app-gamma,svc-audit:02ef89e5-5059-4a24-abfe-751e0dbb4e74,info,High,,Logs,0.00020963698625564575
2026-05-01,app-gamma,svc-audit:64292480-39df-48de-9bbe-c5a5209ec41a,info,High,,Logs,0.0002523893490433693
2026-05-01,app-gamma,svc-audit:1ae516d9-e5ba-41ac-8aa3-36cf2d1851c3,info,High,,Logs,0.0002334117889404297
2026-05-01,app-gamma,svc-audit:17cf80c1-a188-4544-9d85-bf6bce3b3e2b,info,High,,Logs,0.00000504031777381897
2026-05-01,app-gamma,svc-audit:c4b228b2-6a03-4ab2-a16b-a511b44adc81,info,High,,Logs,0.000306764617562294
2026-05-01,app-gamma,svc-audit:c01bb6e2-8b8c-486d-8b28-b5a8df689a2b,info,High,,Logs,0.001637437380850315
2026-05-01,app-gamma,svc-audit:c887a3a5-9a3c-4736-bfea-5fccfaddf7da,info,High,,Logs,0.00012850388884544373
2026-05-01,app-gamma,svc-audit:5f4d7732-a6a3-4f4a-9878-444a1d211199,info,High,,Logs,0.21778497099876404
2026-05-01,app-gamma,svc-audit:ba0abd96-3104-46e7-b338-530ebed638c1,info,High,,Logs,0.000015849247574806213`;

describe("parseUsageCSV", () => {
  const rows = parseUsageCSV(CSV);

  it("returns one row per data line", () => {
    expect(rows).toHaveLength(14);
  });

  it("produces the canonical output shape on every row", () => {
    const EXPECTED_KEYS = ["date", "application", "subsystem", "severity", "priority", "amountGbSent", "billingUnits"];
    for (const row of rows) {
      expect(Object.keys(row)).toEqual(EXPECTED_KEYS);
    }
  });

  it("does not leak source-only columns (Policy name, type)", () => {
    for (const row of rows) {
      expect(row).not.toHaveProperty("policy_name");
      expect(row).not.toHaveProperty("type");
    }
  });

  it("parses the LOW-priority row correctly", () => {
    const row = rows[0];
    expect(row.date).toBe("2026-05-01");
    expect(row.application).toBe("app-alpha");
    expect(row.subsystem).toBe("svc-main");
    expect(row.severity).toBe("debug");
    expect(row.priority).toBe("LOW");
    expect(row.amountGbSent).toBeCloseTo(1.015001893043518, 10);
    expect(row.billingUnits).toBeCloseTo(1.015001893043518 * UNIT_WEIGHTS.LOW, 10);
  });

  it("parses the second LOW-priority row correctly", () => {
    const row = rows[1];
    expect(row.application).toBe("app-beta");
    expect(row.subsystem).toBe("svc-proxy");
    expect(row.severity).toBe("debug");
    expect(row.priority).toBe("LOW");
    expect(row.amountGbSent).toBeCloseTo(0.0011147605255246162, 15);
    expect(row.billingUnits).toBeCloseTo(0.0011147605255246162 * UNIT_WEIGHTS.LOW, 15);
  });

  it("parses a HIGH-priority row correctly", () => {
    const row = rows[3];
    expect(row.application).toBe("app-delta");
    expect(row.subsystem).toBe("svc-main");
    expect(row.severity).toBe("warning");
    expect(row.priority).toBe("HIGH");
    expect(row.amountGbSent).toBeCloseTo(0.001740260049700737, 15);
    expect(row.billingUnits).toBeCloseTo(0.001740260049700737 * UNIT_WEIGHTS.HIGH, 15);
  });

  it("normalises priority to uppercase regardless of CSV casing", () => {
    // CSV has "Low" and "High" (mixed case); parser must normalise to "LOW" / "HIGH"
    const priorities = rows.map((r) => r.priority);
    expect(priorities).toContain("LOW");
    expect(priorities).toContain("HIGH");
    for (const p of priorities) {
      expect(p).toBe(p.toUpperCase());
    }
  });

  it("always computes billingUnits as amountGbSent × UNIT_WEIGHTS[priority]", () => {
    for (const row of rows) {
      const expected = row.amountGbSent * UNIT_WEIGHTS[row.priority];
      expect(row.billingUnits).toBeCloseTo(expected, 10);
    }
  });

  it("captures subsystems with colons and UUIDs without truncation", () => {
    const auditRows = rows.filter((r) => r.application === "app-gamma");
    expect(auditRows.length).toBe(11);
    expect(auditRows[0].subsystem).toBe(
      "svc-audit:521d444c-16dd-49a0-89a7-546f0e1fa5d0"
    );
  });
});
