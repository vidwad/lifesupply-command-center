import { describe, expect, it } from "vitest";

import { ALL_PERMISSION_KEYS, PERMISSIONS } from "./permissions";

describe("PERMISSIONS catalog", () => {
  it("exposes a complete catalog with no duplicates", () => {
    const values = Object.values(PERMISSIONS);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
    expect(values.length).toBeGreaterThan(50);
  });

  it("uses module.action key shape for every permission", () => {
    // module + action are lowercase, may include digits and underscores (e.g. analytics.manage_ga4_settings)
    for (const key of Object.values(PERMISSIONS)) {
      expect(key).toMatch(/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/);
    }
  });

  it("ALL_PERMISSION_KEYS matches the PERMISSIONS values exactly", () => {
    const fromObject = new Set(Object.values(PERMISSIONS));
    const fromExport = new Set(ALL_PERMISSION_KEYS);
    expect(fromExport.size).toBe(fromObject.size);
    for (const k of fromObject) expect(fromExport.has(k)).toBe(true);
  });

  it("includes the audit-critical permission keys", () => {
    expect(PERMISSIONS.ADMIN_VIEW_AUDIT_LOGS).toBe("admin.view_audit_logs");
    expect(PERMISSIONS.FINANCIALS_APPROVE).toBe("financials.approve");
    expect(PERMISSIONS.SUPPLIERS_APPROVE_ORDER_AUTOMATION).toBe(
      "suppliers.approve_order_automation",
    );
    expect(PERMISSIONS.AI_APPROVE_OUTPUT).toBe("ai.approve_output");
    expect(PERMISSIONS.REPORTS_APPROVE).toBe("reports.approve");
  });
});
