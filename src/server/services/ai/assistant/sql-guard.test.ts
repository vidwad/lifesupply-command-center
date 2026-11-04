import { describe, expect, it } from "vitest";

import { BLOCKED_TABLES, guardReadOnlySql, MAX_ROWS, toJsonSafe } from "./sql-guard";

describe("guardReadOnlySql", () => {
  it("wraps a SELECT in a row cap and keeps the statement's own ordering", () => {
    const result = guardReadOnlySql(
      'SELECT "storeId", count(*) FROM orders GROUP BY 1 ORDER BY 2 DESC;',
    );
    expect(result).toEqual({
      ok: true,
      sql: `SELECT * FROM (SELECT "storeId", count(*) FROM orders GROUP BY 1 ORDER BY 2 DESC) AS assistant_query LIMIT ${MAX_ROWS}`,
    });
  });

  it("accepts a WITH query", () => {
    expect(guardReadOnlySql("WITH s AS (SELECT 1 AS n) SELECT n FROM s").ok).toBe(true);
  });

  it("refuses anything that is not a single SELECT", () => {
    for (const sql of [
      "UPDATE orders SET status = 'cancelled'",
      "DELETE FROM orders",
      "INSERT INTO tasks (title) VALUES ('x')",
      "SELECT 1; DROP TABLE orders",
      "DROP TABLE orders",
      "SELECT pg_sleep(10)",
      "SELECT * INTO backup FROM orders",
      "SELECT set_config('x', 'y', false)",
      "COPY orders TO '/tmp/x'",
      "",
    ]) {
      expect(guardReadOnlySql(sql).ok, sql).toBe(false);
    }
  });

  it("refuses the tables that hold credentials and password hashes", () => {
    for (const table of BLOCKED_TABLES) {
      expect(guardReadOnlySql(`SELECT * FROM ${table}`).ok, table).toBe(false);
      expect(guardReadOnlySql(`SELECT * FROM "${table}" u`).ok, table).toBe(false);
      expect(guardReadOnlySql(`SELECT * FROM public.${table}`).ok, table).toBe(false);
    }
    // A column or table that merely contains a blocked name is fine.
    expect(guardReadOnlySql('SELECT "updatedById" FROM system_settings').ok).toBe(true);
  });

  it("ignores forbidden words inside string literals and comments", () => {
    expect(guardReadOnlySql("SELECT * FROM tasks WHERE title = 'please delete me'").ok).toBe(true);
    expect(guardReadOnlySql("SELECT 1 -- update later\n").ok).toBe(true);
    expect(guardReadOnlySql("SELECT 1 /* drop */").ok).toBe(true);
  });
});

describe("toJsonSafe", () => {
  it("makes bigint counts, dates and decimals plain", () => {
    const decimal = { d: [1], e: 0, s: 1, toFixed: () => "12.50", toString: () => "12.5" };
    expect(toJsonSafe([{ n: 5n, at: new Date("2026-11-04T00:00:00Z"), amount: decimal }])).toEqual([
      { n: 5, at: "2026-11-04T00:00:00.000Z", amount: 12.5 },
    ]);
  });
});
