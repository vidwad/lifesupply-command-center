import { describe, expect, it } from "vitest";

import { recomputeCustomerLifetimeMetricsSql } from "./lifetime-metrics";

const flatten = (sql: string) => sql.replace(/\s+/g, " ");

describe("recomputeCustomerLifetimeMetricsSql", () => {
  it("applies the shared sale rule on both status axes", () => {
    const text = flatten(recomputeCustomerLifetimeMetricsSql().sql);
    expect(text).toContain(`o.status NOT IN ('cancelled', 'refunded')`);
    expect(text).toContain(`o."paymentStatus" NOT IN ('failed', 'refunded')`);
  });

  it("resets customers with no qualifying order instead of leaving stale figures", () => {
    const text = flatten(recomputeCustomerLifetimeMetricsSql().sql);
    expect(text).toContain("LEFT JOIN sales s ON s.customer_id = c.id");
    expect(text).toContain("COALESCE(s.lifetime_value, 0)");
    expect(text).toContain("COALESCE(s.order_count, 0)");
  });

  it("touches only the customers whose figures change", () => {
    const text = flatten(recomputeCustomerLifetimeMetricsSql().sql);
    expect(text).toContain(`c."lifetimeValue" IS DISTINCT FROM t.lifetime_value`);
    expect(text).toContain(`c."lastOrderAt" IS DISTINCT FROM t.last_order_at`);
  });

  it("scopes both the orders and the customers to a store, as a bound parameter", () => {
    const scoped = recomputeCustomerLifetimeMetricsSql("store-1");
    expect(scoped.values).toEqual(["store-1", "store-1"]);
    // `.text` is the Postgres form with numbered placeholders.
    expect(flatten(scoped.text)).toContain(`AND o."storeId" = $1`);
    expect(flatten(scoped.text)).toContain(`AND c."storeId" = $2`);

    const unscoped = recomputeCustomerLifetimeMetricsSql();
    expect(unscoped.values).toEqual([]);
    expect(unscoped.sql).not.toContain("storeId");
  });
});
