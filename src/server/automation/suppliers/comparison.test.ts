import { describe, expect, it } from "vitest";

import {
  comparePrice,
  compareSku,
  compareStock,
  evaluateSupplierCheck,
  normalizeAvailabilityStatus,
  normalizeStockText,
  PRICE_MISMATCH_PCT,
  PRICE_WARN_PCT,
  worstVerdict,
} from "./comparison";

describe("comparePrice — docs/10 §8.2 tolerance bands", () => {
  it("pins the published thresholds", () => {
    expect(PRICE_WARN_PCT).toBe(0.02);
    expect(PRICE_MISMATCH_PCT).toBe(0.05);
  });

  it("accepts within 2%", () => {
    expect(comparePrice({ portalPrice: 101.5, expectedCost: 100 }).verdict).toBe("ok");
    expect(comparePrice({ portalPrice: 100, expectedCost: 100 }).verdict).toBe("ok");
    expect(comparePrice({ portalPrice: 98.0, expectedCost: 100 }).verdict).toBe("ok");
  });

  it("warns between 2% and 5%", () => {
    expect(comparePrice({ portalPrice: 103.5, expectedCost: 100 }).verdict).toBe("warn");
    expect(comparePrice({ portalPrice: 95.0, expectedCost: 100 }).verdict).toBe("warn");
  });

  it("mismatches above 5%", () => {
    expect(comparePrice({ portalPrice: 106, expectedCost: 100 }).verdict).toBe("mismatch");
    expect(comparePrice({ portalPrice: 50, expectedCost: 100 }).verdict).toBe("mismatch");
  });

  it("ignores sub-cent formatting noise", () => {
    expect(comparePrice({ portalPrice: 0.204, expectedCost: 0.2 }).verdict).toBe("ok");
  });

  it("is unknown when either side is missing", () => {
    expect(comparePrice({ portalPrice: null, expectedCost: 100 }).verdict).toBe("unknown");
    expect(comparePrice({ portalPrice: 100, expectedCost: null }).verdict).toBe("unknown");
    expect(comparePrice({ portalPrice: 100, expectedCost: 0 }).verdict).toBe("unknown");
  });
});

describe("normalizeStockText", () => {
  it("classifies common portal strings", () => {
    expect(normalizeStockText("In Stock")).toBe("in_stock");
    expect(normalizeStockText("Available")).toBe("in_stock");
    expect(normalizeStockText("Out of Stock")).toBe("out_of_stock");
    expect(normalizeStockText("Backordered")).toBe("out_of_stock");
    expect(normalizeStockText("Discontinued")).toBe("out_of_stock");
    expect(normalizeStockText("Low — 2 left")).toBe("low_stock");
    expect(normalizeStockText("3 units")).toBe("low_stock");
    expect(normalizeStockText("120 units")).toBe("in_stock");
    expect(normalizeStockText("0 available")).toBe("out_of_stock");
    expect(normalizeStockText(null)).toBe("unknown");
    expect(normalizeStockText("¯\\_(ツ)_/¯")).toBe("unknown");
  });
});

describe("normalizeAvailabilityStatus", () => {
  it("maps SupplierProduct availability values", () => {
    expect(normalizeAvailabilityStatus("in_stock")).toBe("in_stock");
    expect(normalizeAvailabilityStatus("low_stock")).toBe("low_stock");
    expect(normalizeAvailabilityStatus("out_of_stock")).toBe("out_of_stock");
    expect(normalizeAvailabilityStatus("discontinued")).toBe("out_of_stock");
    expect(normalizeAvailabilityStatus(null)).toBe("unknown");
  });
});

describe("compareStock", () => {
  it("ok when statuses agree", () => {
    expect(
      compareStock({ portalStockText: "In Stock", expectedAvailability: "in_stock" }).verdict,
    ).toBe("ok");
  });
  it("mismatch when one side is out of stock", () => {
    expect(
      compareStock({ portalStockText: "Out of stock", expectedAvailability: "in_stock" }).verdict,
    ).toBe("mismatch");
    expect(
      compareStock({ portalStockText: "In Stock", expectedAvailability: "out_of_stock" }).verdict,
    ).toBe("mismatch");
  });
  it("warn on low-vs-in drift", () => {
    expect(
      compareStock({ portalStockText: "2 units", expectedAvailability: "in_stock" }).verdict,
    ).toBe("warn");
  });
  it("unknown when unclassifiable", () => {
    expect(compareStock({ portalStockText: null, expectedAvailability: "in_stock" }).verdict).toBe(
      "unknown",
    );
    expect(compareStock({ portalStockText: "In Stock", expectedAvailability: null }).verdict).toBe(
      "unknown",
    );
  });
});

describe("compareSku", () => {
  it("mismatch when the SKU is not found", () => {
    const flag = compareSku({
      found: false,
      supplierSku: "BBM-123",
      portalName: null,
      mappedProductName: "Nitrile Gloves",
    });
    expect(flag.verdict).toBe("mismatch");
    expect(flag.detail).toMatch(/not found/);
  });

  it("ok when found and names align", () => {
    expect(
      compareSku({
        found: true,
        supplierSku: "BBM-123",
        portalName: "Nitrile Exam Gloves — Large",
        mappedProductName: "Nitrile Exam Gloves",
      }).verdict,
    ).toBe("ok");
  });

  it("warn when found but names are unrelated", () => {
    expect(
      compareSku({
        found: true,
        supplierSku: "BBM-123",
        portalName: "Wheelchair Cushion",
        mappedProductName: "Nitrile Exam Gloves",
      }).verdict,
    ).toBe("warn");
  });

  it("ok without a name comparison when a side is missing", () => {
    expect(
      compareSku({
        found: true,
        supplierSku: "BBM-123",
        portalName: null,
        mappedProductName: "Nitrile Exam Gloves",
      }).verdict,
    ).toBe("ok");
  });
});

describe("evaluateSupplierCheck", () => {
  const base = {
    found: true,
    supplierSku: "BBM-123",
    portalPrice: 89.5,
    portalStockText: "In Stock",
    portalName: "Nitrile Exam Gloves",
    expectedCost: 89.5,
    expectedAvailability: "in_stock",
    mappedProductName: "Nitrile Exam Gloves",
  };

  it("price check runs sku + price rules", () => {
    const flags = evaluateSupplierCheck({ ...base, workflow: "price_check" });
    expect(flags.map((f) => f.rule)).toEqual(["sku", "price"]);
    expect(worstVerdict(flags)).toBe("ok");
  });

  it("stock check runs sku + stock rules", () => {
    const flags = evaluateSupplierCheck({ ...base, workflow: "stock_check" });
    expect(flags.map((f) => f.rule)).toEqual(["sku", "stock"]);
  });

  it("sku check runs the sku rule only", () => {
    const flags = evaluateSupplierCheck({ ...base, workflow: "sku_check" });
    expect(flags.map((f) => f.rule)).toEqual(["sku"]);
  });

  it("stops at the sku rule when the SKU is missing", () => {
    const flags = evaluateSupplierCheck({ ...base, workflow: "price_check", found: false });
    expect(flags).toHaveLength(1);
    expect(worstVerdict(flags)).toBe("mismatch");
  });
});

describe("worstVerdict", () => {
  it("orders mismatch > warn > unknown > ok", () => {
    const mk = (verdict: "ok" | "warn" | "mismatch" | "unknown") => ({
      rule: "price" as const,
      verdict,
      detail: "",
      expected: null,
      captured: null,
    });
    expect(worstVerdict([mk("ok"), mk("warn"), mk("mismatch")])).toBe("mismatch");
    expect(worstVerdict([mk("ok"), mk("unknown"), mk("warn")])).toBe("warn");
    expect(worstVerdict([mk("ok"), mk("unknown")])).toBe("unknown");
    expect(worstVerdict([mk("ok")])).toBe("ok");
    expect(worstVerdict([])).toBe("ok");
  });
});
