import { describe, expect, it } from "vitest";

import { factTokens, listingToHtml, missingFacts, parseListingBlocks } from "./listing-format";

const STRUCTURED = `The 3M Attest Steam Chemical Integrator (REF 1243) is a Type 5 integrating indicator strip for steam sterilization packs.

Specifications:
- Type 5 integrating indicator (ISO 11140-1:2014)
- Strip size about 2" × 3/4" (5.1 × 1.9 cm)
- Steam cycles 121–135 °C (250–275 °F)

What is included:
- One strip, as photographed. Catalog 1243A is sold as 500 per bag.

Condition and packaging:
The photograph shows a single strip, so factory packaging cannot be confirmed from the image.
Check lot and expiry on delivery.`;

describe("parsing listing blocks", () => {
  it("reads titles, lists and paragraphs from the plain-text vocabulary", () => {
    const blocks = parseListingBlocks(STRUCTURED);
    expect(blocks.map((b) => b.type)).toEqual([
      "paragraph",
      "title",
      "list",
      "title",
      "list",
      "title",
      "paragraph",
    ]);
    expect(blocks[1]).toEqual({ type: "title", text: "Specifications" });
    expect(blocks[2]).toMatchObject({
      items: expect.arrayContaining(["Steam cycles 121–135 °C (250–275 °F)"]),
    });
    expect(blocks[6]).toEqual({
      type: "paragraph",
      lines: [
        "The photograph shows a single strip, so factory packaging cannot be confirmed from the image.",
        "Check lot and expiry on delivery.",
      ],
    });
  });
  it("splits a lead-in paragraph from the bullets under it, and accepts • and numbered bullets", () => {
    // A sentence ending in a colon is prose; only a short title-like line is a title.
    const blocks = parseListingBlocks(
      "The box is sealed. It includes the following items:\n• One strip\n2) One bag",
    );
    expect(blocks).toEqual([
      { type: "paragraph", lines: ["The box is sealed. It includes the following items:"] },
      { type: "list", items: ["One strip", "One bag"] },
    ]);
    expect(parseListingBlocks("Includes:\n- One strip")).toEqual([
      { type: "title", text: "Includes" },
      { type: "list", items: ["One strip"] },
    ]);
  });
  it("treats a sentence ending in a colon as a paragraph, not a title", () => {
    expect(parseListingBlocks("This is a long sentence. It ends with a colon:")[0]?.type).toBe(
      "paragraph",
    );
  });
});

describe("the description as HTML", () => {
  it("renders real lists and bold titles, escaped", () => {
    const html = listingToHtml('Specs & more:\n- 2" strip <new>\n\nPlain.');
    expect(html).toBe(
      "<p><strong>Specs &amp; more</strong></p>\n<ul>\n<li>2&quot; strip &lt;new&gt;</li>\n</ul>\n<p>Plain.</p>",
    );
  });
  it("still renders an unstructured description as paragraphs with line breaks", () => {
    expect(listingToHtml("One.\nTwo.\n\nThree.")).toBe("<p>One.<br>Two.</p>\n<p>Three.</p>");
  });
});

describe("facts that a rewrite must keep", () => {
  it("extracts numbers, codes and measurements", () => {
    expect(
      factTokens('REF 1243 / 1243A, 2" × 3/4", 121–135°C, ISO 11140-1:2014, 500 per bag'),
    ).toEqual(
      expect.arrayContaining(["1243", "1243a", "2", "34", "121", "135c", "1114012014", "500"]),
    );
  });
  it("reports what a rewrite dropped and nothing when it kept everything", () => {
    const original = "Catalog 1243A is sold as 500 per bag at 121–135 °C.";
    expect(
      missingFacts(original, "Sold as 500 per bag (catalog 1243A), for 121-135 °C cycles."),
    ).toEqual([]);
    expect(missingFacts(original, "Catalog 1243A, for 121–135 °C cycles.")).toEqual(["500"]);
  });
});
