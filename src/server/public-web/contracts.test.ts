import { describe, expect, it } from "vitest";

import { PUBLIC_SITE_KEY, publicSiteDtoSchema } from "@/server/public-web/contracts";

describe("public web contracts", () => {
  it("accepts only the explicit LifeSupply public DTO surface", () => {
    const result = publicSiteDtoSchema.parse({
      siteKey: PUBLIC_SITE_KEY,
      generatedAt: new Date().toISOString(),
      pages: [],
      leadership: [],
      news: [],
      investorUpdates: [],
      productCollections: [],
      documents: [],
      metrics: [],
      contacts: [],
    });
    expect(result.siteKey).toBe("lifesupply-health");
  });

  it("rejects a DTO carrying an internal operational field", () => {
    const result = publicSiteDtoSchema.safeParse({
      siteKey: PUBLIC_SITE_KEY,
      generatedAt: new Date().toISOString(),
      pages: [],
      leadership: [],
      news: [],
      investorUpdates: [],
      productCollections: [],
      documents: [],
      metrics: [],
      contacts: [],
      customerEmail: "must-not-leak@example.com",
    });
    expect(result.success).toBe(false);
  });
});
