import { describe, expect, it } from "vitest";

import { parseUpload, previewUpload } from "./upload-parser";

const csv = (body: string) => parseUpload(body).rows;

describe("parseUpload", () => {
  it("reads the documented minimum fields", () => {
    const [row] = csv(
      "sku,product_name,current_price,current_sale_price,cost_price,competitor_url_optional\n" +
        "AM-1,Syringes,19.99,17.50,8.00,https://example.com/p",
    );
    expect(row?.sku).toBe("AM-1");
    expect(row?.productName).toBe("Syringes");
    expect(row?.currentRegularPrice).toBe(19.99);
    expect(row?.currentSalePrice).toBe(17.5);
    expect(row?.costPrice).toBe(8);
    expect(row?.competitorUrl).toBe("https://example.com/p");
    expect(row?.errors).toEqual([]);
  });

  it("reads the nice-to-have fields", () => {
    const [row] = csv(
      "sku,current_price,cost_price,product_id,variant_id,store,supplier_sku,notes\n" +
        "A,10,4,p1,v1,LifeSupply,SUP-9,check me",
    );
    expect(row?.productId).toBe("p1");
    expect(row?.variantId).toBe("v1");
    expect(row?.store).toBe("LifeSupply");
    expect(row?.supplierSku).toBe("SUP-9");
    expect(row?.notes).toBe("check me");
  });

  it("tolerates alternate header spellings operators actually export", () => {
    const [row] = csv("SKU,Price,Cost\nA,10.00,4.00");
    expect(row?.sku).toBe("A");
    expect(row?.currentRegularPrice).toBe(10);
    expect(row?.costPrice).toBe(4);
  });

  it("strips currency symbols and thousands separators", () => {
    const [row] = csv('sku,current_price,cost_price\nA,"$1,299.00","$500.00"');
    expect(row?.currentRegularPrice).toBe(1299);
    expect(row?.costPrice).toBe(500);
  });

  it("reports a row number an operator can find in their file", () => {
    const rows = csv("sku,current_price,cost_price\nA,10,4\nB,20,5");
    expect(rows[0]?.line).toBe(2);
    expect(rows[1]?.line).toBe(3);
  });

  it("flags a missing SKU", () => {
    const [row] = csv("sku,current_price,cost_price\n,10,4");
    expect(row?.errors).toContain("Missing SKU.");
  });

  it("flags a row with no usable price", () => {
    const [row] = csv("sku,cost_price\nA,4");
    expect(row?.errors.join(" ")).toMatch(/No usable price/);
  });

  it("rejects negative prices", () => {
    const [row] = csv("sku,current_price,cost_price\nA,-5,4");
    expect(row?.errors.join(" ")).toMatch(/must be a positive number/);
  });

  it("treats a zero cost as absent, never as a zero floor", () => {
    const [row] = csv("sku,current_price,cost_price\nA,10,0");
    expect(row?.costPrice).toBeNull();
  });

  it("rejects a malformed competitor URL but keeps the row readable", () => {
    const [row] = csv("sku,current_price,cost_price,competitor_url_optional\nA,10,4,not-a-url");
    expect(row?.competitorUrl).toBeNull();
    expect(row?.errors.join(" ")).toMatch(/valid http/);
  });

  it("rejects a non-http scheme", () => {
    const [row] = csv(
      "sku,current_price,cost_price,competitor_url_optional\nA,10,4,javascript:alert(1)",
    );
    expect(row?.competitorUrl).toBeNull();
  });
});

describe("previewUpload", () => {
  it("summarises what the operator will get before anything is written", () => {
    const rows = csv(
      "sku,current_price,cost_price\n" + "A,10,4\n" + "a,11,5\n" + "B,12,\n" + ",13,6\n",
    );
    const preview = previewUpload(rows);
    expect(preview.total).toBe(4);
    expect(preview.missingCost).toBe(1);
    expect(preview.duplicateSkus).toEqual(["a"]);
    expect(preview.withErrors).toBe(1);
    expect(preview.usable).toBe(3);
  });

  it("reports no duplicates for a clean file", () => {
    expect(
      previewUpload(csv("sku,current_price,cost_price\nA,10,4\nB,11,5")).duplicateSkus,
    ).toEqual([]);
  });
});
