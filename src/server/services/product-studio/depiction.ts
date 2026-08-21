/**
 * What a generated image is allowed to depict.
 *
 * The naive rule — "never show anything absent from the operator's photos" —
 * is right for one product class and wrong for another, and applying it to both
 * produces either misrepresentation or four near-identical photographs.
 *
 *   used / second-hand   Every unit is different. Wear, included accessories,
 *                        and serials vary per item, so the photograph IS the
 *                        evidence and nothing may be added to it.
 *
 *   new sealed retail    Every unit is identical and the contents are published
 *                        by the manufacturer. Depicting the specified contents
 *                        is illustration, not fabrication — provided the
 *                        depiction matches a cited specification.
 *
 * So the test is not "was it in the photo" but "is this attribute
 * unit-specific, or is it verifiable from specification". Three tiers:
 *
 *   1. NEVER          unit-specific and unverifiable: serials, lot codes,
 *                     expiry dates, regulatory identifiers, this-unit damage.
 *                     Prohibited in BOTH modes — a fabricated UDI on a medical
 *                     device is a different class of problem from a wrong
 *                     background.
 *   2. SPEC-BOUND     manufacturer-specified contents. Depictable in
 *                     new_sealed mode when a cited spec supports it, and then
 *                     required to match that spec exactly.
 *   3. FREE           staging: background, lighting, angle, surface, crop.
 */

export type ProductMode = "new_sealed" | "used";

/**
 * Conservative default. If research did not classify the product — including
 * every project researched before this field existed — treat it as a unique
 * item whose photograph is the only evidence.
 */
export const DEFAULT_PRODUCT_MODE: ProductMode = "used";

export function parseProductMode(value: unknown): ProductMode {
  return value === "new_sealed" ? "new_sealed" : DEFAULT_PRODUCT_MODE;
}

export function parseDepictableSpec(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

/** Identifiers that are unit-specific or regulatory, and never inferable. */
const NEVER_DEPICT =
  "serial numbers, lot or batch codes, expiry dates, NRC/NDC numbers, GS1/DI or UDI identifiers, barcodes, QR codes, regulatory registration marks, prices, or any damage, wear, dust, or defect";

/**
 * The depiction rules block for the image prompt, written for the given mode.
 */
export function buildDepictionRules(args: {
  mode: ProductMode;
  depictableSpec: readonly string[];
}): string {
  const never = `- NEVER render ${NEVER_DEPICT}. These are specific to an individual unit or are regulated identifiers; they cannot be inferred and must not be approximated, even if a composition brief or correction asks for them. Where the brief calls for such a panel, show it out of focus, cropped, or turned away rather than inventing legible characters.`;

  if (args.mode === "used") {
    return `DEPICTION RULES — SECOND-HAND ITEM
This is a used or second-hand item, so the attached photographs are the only evidence of what is being sold and what condition it is in.
- Depict only the item and accessories visible in the reference photographs.
- If this composition calls for an accessory, prop, packaging, or surface detail that is not visible in the references, OMIT it and compose the frame without it. Never substitute a stand-in. An incomplete but truthful frame is correct; a complete but invented one is not.
${never}`;
  }

  const spec = args.depictableSpec.length
    ? args.depictableSpec.map((line) => `  - ${line}`).join("\n")
    : "  - (none supplied — depict only what is visible in the reference photographs)";

  return `DEPICTION RULES — NEW, SEALED, MASS-PRODUCED RETAIL PRODUCT
Every unit of this product is identical and its contents are published by the manufacturer, so depicting the specified contents is illustration rather than fabrication. The reference photographs remain authoritative for the packaging itself.
- You MAY depict the manufacturer-specified contents and packaging listed below, even when they do not appear in the reference photographs.
- Anything you depict from this list MUST match the specification exactly. Depicting a plausible but incorrect variant is worse than omitting it: a wrong graduation scale, gauge, capacity, or colour misdescribes the product being sold.
- Anything NOT in this list and NOT visible in the reference photographs must be omitted, not invented.

VERIFIED SPECIFICATION — depictable, and must be drawn exactly as stated:
${spec}
${never}`;
}

const QA_IDENTIFIER_RULES = `IDENTIFIERS — how to report them
Legible serial numbers, lot or batch codes, expiry dates, NRC/NDC, GS1/DI, UDI, and barcodes must NOT be rendered at all. Image models cannot reproduce long digit strings reliably, so an attempted identifier is wrong by default.
- Report an attempted identifier as a defect whenever it is legible, whether or not it matches the packaging. The defect is the attempt, not the mismatch.
- The required correction for such a defect is ALWAYS to crop the panel out, throw it out of focus, or turn it away from camera. NEVER write a correction instructing the image to render a specific identifier, digit sequence, or spacing — that correction cannot be satisfied and sends the composition into an endless regeneration loop.
- The same applies to dense small print and fine measurement graduations: if numerals cannot be rendered cleanly, ask for them to be de-emphasised rather than corrected digit by digit.`;

/** The equivalent block for the QA prompt, so QA grades on the same rule. */
export function buildDepictionQaRules(args: {
  mode: ProductMode;
  depictableSpec: readonly string[];
}): string {
  if (args.mode === "used") {
    return `DEPICTION STANDARD — SECOND-HAND ITEM
Anything shown that is not present in the authoritative source photographs is a defect. Reject added accessories, packaging, or props.

${QA_IDENTIFIER_RULES}`;
  }
  const spec = args.depictableSpec.length
    ? args.depictableSpec.map((line) => `- ${line}`).join("\n")
    : "- (none supplied)";
  return `DEPICTION STANDARD — NEW, SEALED, MASS-PRODUCED RETAIL PRODUCT
Contents specified by the manufacturer MAY appear even if absent from the source photographs. Judge them against the specification below, not against the photographs.
Reject any depicted item that CONTRADICTS the specification (wrong scale, gauge, capacity, count, or colour), and reject any item that is neither specified below nor visible in the sources.

${QA_IDENTIFIER_RULES}

VERIFIED SPECIFICATION:
${spec}`;
}
