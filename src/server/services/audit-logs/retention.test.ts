import { describe, expect, it } from "vitest";

import { isNeverPrune, getRetentionDays } from "./retention";

describe("isNeverPrune", () => {
  it("preserves auth + approval + financial actions", () => {
    expect(isNeverPrune("auth.login")).toBe(true);
    expect(isNeverPrune("approval.approved")).toBe(true);
    expect(isNeverPrune("financials.approve")).toBe(true);
    expect(isNeverPrune("financial_summary.imported")).toBe(true);
    expect(isNeverPrune("financial_adjustment.created")).toBe(true);
  });

  it("preserves report + investor + automation + integration actions", () => {
    expect(isNeverPrune("report.approved")).toBe(true);
    expect(isNeverPrune("investor_update.released")).toBe(true);
    expect(isNeverPrune("automation.run_started")).toBe(true);
    expect(isNeverPrune("automation.order_prepared")).toBe(true);
    expect(isNeverPrune("integration.field_set")).toBe(true);
  });

  it("preserves feature-flag + system-setting + export + import actions", () => {
    expect(isNeverPrune("feature_flag.enabled")).toBe(true);
    expect(isNeverPrune("feature_flag.kill_switch_tripped")).toBe(true);
    expect(isNeverPrune("system_setting.updated")).toBe(true);
    expect(isNeverPrune("export.orders.csv")).toBe(true);
    expect(isNeverPrune("import.bigcommerce.customers")).toBe(true);
  });

  it("preserves sensitive user-account actions", () => {
    expect(isNeverPrune("user.created")).toBe(true);
    expect(isNeverPrune("user.password_reset")).toBe(true);
    expect(isNeverPrune("user.suspended")).toBe(true);
    expect(isNeverPrune("user.archived")).toBe(true);
    expect(isNeverPrune("role.permissions_updated")).toBe(true);
  });

  it("does NOT preserve low-risk actions like task / exception updates", () => {
    expect(isNeverPrune("task.updated")).toBe(false);
    expect(isNeverPrune("exception.assigned")).toBe(false);
    expect(isNeverPrune("user.profile_updated")).toBe(false);
    expect(isNeverPrune("close_task.in_progress")).toBe(false);
  });
});

describe("getRetentionDays", () => {
  const original = process.env.AUDIT_RETENTION_DAYS;

  it("defaults to 365 when the env var is unset", () => {
    delete process.env.AUDIT_RETENTION_DAYS;
    expect(getRetentionDays()).toBe(365);
  });

  it("honours a valid override", () => {
    process.env.AUDIT_RETENTION_DAYS = "180";
    expect(getRetentionDays()).toBe(180);
  });

  it("rejects values below 30 (uses default)", () => {
    process.env.AUDIT_RETENTION_DAYS = "7";
    expect(getRetentionDays()).toBe(365);
  });

  it("rejects non-numeric values (uses default)", () => {
    process.env.AUDIT_RETENTION_DAYS = "forever";
    expect(getRetentionDays()).toBe(365);
  });

  it.afterEach(() => {
    if (original === undefined) {
      delete process.env.AUDIT_RETENTION_DAYS;
    } else {
      process.env.AUDIT_RETENTION_DAYS = original;
    }
  });
});
