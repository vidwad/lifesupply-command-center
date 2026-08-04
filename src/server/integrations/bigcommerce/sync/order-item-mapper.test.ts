import { describe, expect, it } from "vitest";

import { mapBcOrderProductToUpsert, SOURCE_SYSTEM, type BcOrderProduct } from "./order-item-mapper";

const base: BcOrderProduct = {
  id: 555,
  product_id: 10,
  variant_id: 20,
  name: "N95 Respirator",
  sku: "N95-BOX",
  quantity: 3,
  price_inc_tax: "12.50",
  price_ex_tax: "11.00",
  total_inc_tax: "37.50",
  total_ex_tax: "33.00",
  total_tax: "4.50",
  cost_price_inc_tax: "6.00",
  quantity_refunded: 0,
  is_refunded: false,
  is_bundled_product: false,
};

function build(over: Partial<BcOrderProduct> = {}, link = {}) {
  return mapBcOrderProductToUpsert(
    { ...base, ...over },
    { orderId: "order_1", productId: null, productVariantId: null, ...link },
  );
}

describe("mapBcOrderProductToUpsert", () => {
  it("keys the item on (bigcommerce, order-product id) for idempotent upsert", () => {
    const { create } = build();
    expect(create.sourceSystem).toBe(SOURCE_SYSTEM);
    expect(create.sourceId).toBe("555");
    expect(create.orderId).toBe("order_1");
  });

  it("maps BC-owned line fields on both create and update", () => {
    const { create, update } = build();
    for (const p of [create, update]) {
      expect(p.sku).toBe("N95-BOX");
      expect(p.productName).toBe("N95 Respirator");
      expect(p.quantity).toBe(3);
      expect(p.unitPrice).toBe(12.5);
      expect(p.lineSubtotal).toBe(33);
      expect(p.lineTax).toBe(4.5);
      expect(p.lineTotal).toBe(37.5);
    }
  });

  it("derives lineTax from totals when total_tax is absent", () => {
    const { create } = build({ total_tax: null });
    expect(create.lineTax).toBe(4.5); // 37.50 - 33.00
  });

  it("never returns a negative derived lineTax", () => {
    const { create } = build({ total_tax: null, total_ex_tax: "40.00", total_inc_tax: "37.50" });
    expect(create.lineTax).toBe(0);
  });

  it("falls back for missing sku / name", () => {
    const { create } = build({ sku: "  ", name: null });
    expect(create.sku).toBe("");
    expect(create.productName).toBe("(unnamed item)");
  });

  it("passes through resolved product / variant links", () => {
    const { create, update } = build({}, { productId: "prod_1", productVariantId: "var_1" });
    expect(create.productId).toBe("prod_1");
    expect(create.productVariantId).toBe("var_1");
    expect(update.productId).toBe("prod_1");
  });

  it("seeds unitCost from BC cost on create only; omits CC-owned on update", () => {
    const { create, update } = build();
    expect(create.unitCost).toBe(6);
    expect(update).not.toHaveProperty("unitCost");
    expect(update).not.toHaveProperty("estimatedGrossProfit");
    expect(update).not.toHaveProperty("supplierId");
    expect(update).not.toHaveProperty("sourceSystem");
  });

  it("leaves unitCost null when BC provides no cost", () => {
    const { create } = build({ cost_price_inc_tax: null });
    expect(create.unitCost).toBeNull();
  });

  it("captures BC ids + refund/bundle signals in metadata", () => {
    const meta = build({ quantity_refunded: 1, is_refunded: true, is_bundled_product: true }).create
      .metadata as Record<string, unknown>;
    expect(meta.bcProductId).toBe(10);
    expect(meta.bcVariantId).toBe(20);
    expect(meta.bcQuantityRefunded).toBe(1);
    expect(meta.bcIsRefunded).toBe(true);
    expect(meta.bcIsBundled).toBe(true);
  });
});
