import { describe, expect, it } from "vitest";

import {
  mapBcVariantToUpsert,
  mapInventoryTracking,
  optionSummary,
  SOURCE_SYSTEM,
  type BcVariant,
} from "./variant-mapper";

const fallback = { price: 9.99, salePrice: null, costPrice: 4 };

describe("optionSummary", () => {
  it("joins option display name + label", () => {
    expect(
      optionSummary({
        id: 1,
        option_values: [
          { option_display_name: "Size", label: "Large" },
          { option_display_name: "Color", label: "Blue" },
        ],
      }),
    ).toBe("Size: Large, Color: Blue");
  });
  it("returns null when there are no options (base variant)", () => {
    expect(optionSummary({ id: 1, option_values: [] })).toBeNull();
    expect(optionSummary({ id: 1 })).toBeNull();
  });
});

describe("mapInventoryTracking", () => {
  it("maps BC tracking to the schema field", () => {
    expect(mapInventoryTracking("none")).toBe("none");
    expect(mapInventoryTracking("product")).toBe("bigcommerce");
    expect(mapInventoryTracking("variant")).toBe("bigcommerce");
    expect(mapInventoryTracking(null)).toBe("none");
  });
});

describe("mapBcVariantToUpsert", () => {
  const bc: BcVariant = {
    id: 900,
    product_id: 100,
    sku: "GLV-NIT-L",
    price: "12.50",
    sale_price: null,
    cost_price: "6.00",
    inventory_level: 42,
    purchasing_disabled: false,
    option_values: [{ option_display_name: "Size", label: "Large" }],
  };

  it("keys on (bigcommerce, id) + maps fields", () => {
    const { create } = mapBcVariantToUpsert(bc, {
      productId: "prod_1",
      inventoryTrackingType: "bigcommerce",
      fallback,
    });
    expect(create.sourceSystem).toBe(SOURCE_SYSTEM);
    expect(create.sourceId).toBe("900");
    expect(create.productId).toBe("prod_1");
    expect(create.sku).toBe("GLV-NIT-L");
    expect(create.price).toBe(12.5);
    expect(create.costPrice).toBe(6);
    expect(create.stockLevel).toBe(42);
    expect(create.status).toBe("active");
    expect(create.optionSummary).toBe("Size: Large");
  });

  it("inherits the product's base price when the variant omits it", () => {
    const { create } = mapBcVariantToUpsert(
      { ...bc, price: null, cost_price: null },
      { productId: "prod_1", inventoryTrackingType: "none", fallback },
    );
    expect(create.price).toBe(9.99); // fallback.price
    expect(create.costPrice).toBe(4); // fallback.costPrice
  });

  it("defaults price to 0 when neither variant nor product has one", () => {
    const { create } = mapBcVariantToUpsert(
      { ...bc, price: null },
      {
        productId: "p",
        inventoryTrackingType: "none",
        fallback: { price: null, salePrice: null, costPrice: null },
      },
    );
    expect(create.price).toBe(0);
  });

  it("marks a purchasing-disabled variant inactive", () => {
    const { create } = mapBcVariantToUpsert(
      { ...bc, purchasing_disabled: true },
      { productId: "p", inventoryTrackingType: "none", fallback },
    );
    expect(create.status).toBe("inactive");
  });

  it("fully overwrites BC-owned fields on update", () => {
    const { update } = mapBcVariantToUpsert(bc, {
      productId: "prod_1",
      inventoryTrackingType: "bigcommerce",
      fallback,
    });
    expect(update.price).toBe(12.5);
    expect(update.sku).toBe("GLV-NIT-L");
    expect(update).not.toHaveProperty("sourceSystem");
  });
});
