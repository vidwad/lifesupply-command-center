import { describe, expect, it } from "vitest";

import { validateStoreMappingSelection } from "./index";

const bcStore = { id: "s1", platform: "bigcommerce" };
const amazonStore = { id: "s9", platform: "amazon" };

describe("validateStoreMappingSelection", () => {
  it("accepts mapping a BigCommerce connection to a BigCommerce store", () => {
    expect(
      validateStoreMappingSelection({ integrationType: "bigcommerce", store: bcStore }),
    ).toEqual({ ok: true });
  });

  it("accepts unmapping a BigCommerce connection (store null)", () => {
    expect(validateStoreMappingSelection({ integrationType: "bigcommerce", store: null })).toEqual({
      ok: true,
    });
  });

  it("rejects mapping a non-BigCommerce integration type", () => {
    const result = validateStoreMappingSelection({ integrationType: "mailchimp", store: bcStore });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/only bigcommerce/i);
  });

  it("rejects mapping to a non-BigCommerce store", () => {
    const result = validateStoreMappingSelection({
      integrationType: "bigcommerce",
      store: amazonStore,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/not a bigcommerce store/i);
  });

  it("rejects a non-BigCommerce type even when unmapping", () => {
    // Guards against clearing a mapping on a row that should never have one.
    const result = validateStoreMappingSelection({ integrationType: "ga4", store: null });
    expect(result.ok).toBe(false);
  });
});
