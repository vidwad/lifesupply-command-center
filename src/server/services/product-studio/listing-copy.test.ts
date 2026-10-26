import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { listingCopyHasLinks, stripListingCopyLinks, stripListingLinks } from "./listing-copy";

/** The shape the research model produced on 2026-10-26: cited inline. */
const SAMPLE = `This listing is for one new, boxed 92 g (3.25 oz) tube of 3M Cavilon Durable Barrier Cream (catalog/SKU 3392C) in the fragrance‑free formulation. These intended uses are stated by the manufacturer. ([multimedia.3m.com](https://multimedia.3m.com/mws/media/129096O/3m-cavilon-durable-barrier-cream.pdf))

What is included: one 92 g tube inside its retail carton. No additional applicators or kits are included unless a seller states otherwise. ([emerdepot.com](https://emerdepot.com/products/3m-cavilon-durable-barrier-cream))

See the datasheet at https://multimedia.3m.com/mws/media/129096O.pdf for details, or www.example.com.`;

describe("stripping links from listing copy", () => {
  it("removes parenthesised citations whole and keeps the prose intact", () => {
    const out = stripListingLinks(SAMPLE);
    expect(listingCopyHasLinks(out)).toBe(false);
    expect(out).toContain("These intended uses are stated by the manufacturer.");
    expect(out).toContain("unless a seller states otherwise.");
    expect(out).not.toContain("emerdepot");
    expect(out).not.toContain("multimedia.3m.com");
    expect(out).not.toContain("()");
    // The original parentheses the sentence had are untouched.
    expect(out).toContain("92 g (3.25 oz)");
    expect(out).toContain("(catalog/SKU 3392C)");
  });
  it("removes bare URLs and www hosts and repairs the spacing before punctuation", () => {
    expect(stripListingLinks("See https://a.example/x for details, or www.b.example.")).toBe(
      "See for details, or.",
    );
  });
  it("keeps the label of an inline markdown link", () => {
    expect(stripListingLinks("Made by [3M](https://3m.com) in Canada.")).toBe(
      "Made by 3M in Canada.",
    );
  });
  it("leaves clean copy exactly as it is", () => {
    const clean = "One 92 g tube.\n\nFragrance-free (parabens free).";
    expect(stripListingLinks(clean)).toBe(clean);
    expect(listingCopyHasLinks(clean)).toBe(false);
  });
  it("cleans every buyer-facing field together and drops details that were only a link", () => {
    const out = stripListingCopyLinks({
      title: "Cream [3M](https://x.y)",
      shortDescription: "Short ([a.b](https://a.b/p))",
      longDescription: SAMPLE,
      keyDetails: ["92 g tube", "https://a.b/spec", "CHG compatible ([a.b](https://a.b))"],
    });
    expect(out.title).toBe("Cream 3M");
    expect(out.shortDescription).toBe("Short");
    expect(out.keyDetails).toEqual(["92 g tube", "CHG compatible"]);
    expect(listingCopyHasLinks(out.longDescription)).toBe(false);
  });
});

describe("the strip is wired where copy is written, shown and published", () => {
  const ROOT = join(__dirname, "..", "..", "..", "..");
  const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8").replace(/\r\n/g, "\n");
  const stripComments = (source: string): string =>
    source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");

  it("the prompt forbids links in the buyer-facing fields", () => {
    const prompt = read("src/server/services/product-studio/prompts.ts");
    expect(prompt).toContain("must contain NO URLs, hyperlinks, markdown links, citations");
  });
  it("the research worker strips the listing before storing it", () => {
    const worker = stripComments(read("src/server/inngest/functions/product-studio/process.ts"));
    expect(worker).toContain("stripListingCopyLinks(research.optimizedListing)");
    expect(worker).toContain("longDescription: listing.longDescription");
    expect(worker).not.toContain("longDescription: research.optimizedListing.longDescription");
  });
  it("the description is stripped again when selected for publishing and when shown", () => {
    const rules = stripComments(read("src/server/services/product-studio/publish-eligibility.ts"));
    expect(rules).toContain("stripListingLinks(args.project.longDescription");
    const page = stripComments(read("src/app/(dashboard)/products/studio/[id]/page.tsx"));
    expect(page).toContain("stripListingLinks(project.longDescription)");
  });
});
