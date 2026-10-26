/**
 * Restructure an existing description into the plain-text listing format
 * (2026-10-26). Facts are the constraint: the service refuses the result if
 * any number, code or measurement from the original is missing, so the
 * prompt makes that rule explicit rather than relying on the guard alone.
 */
export function buildDescriptionReformatPrompt(args: {
  title: string;
  longDescription: string;
}): string {
  return `You are restructuring an existing product description for the listing "${args.title}" so it is easier to read. You are NOT researching or rewriting its substance.

RULES
- Keep every fact: every number, measurement, code, model or catalog number, standard, temperature, quantity, date, material, compatibility statement, caveat and warning in the original must appear in the result, with the same meaning and the same values. Do not add facts, do not remove facts, do not soften or strengthen any statement.
- Do not add URLs, links, citations, retailer names or "source" references.
- Plain text only: no markdown headings, bold, tables or links.
- Format: open with a short paragraph of two or three sentences saying what the product is and who it is for. Then sections, each a short title line ending with a colon (for example "Specifications:", "What is included:", "Condition and packaging:", "Usage notes:"), followed by bullet lines beginning with "- ", one fact per bullet. Use bullets for specifications, attributes, contents and compatibility. Keep prose, as short paragraphs, only for what reads better as sentences, such as condition observations or caveats. Separate every block with a blank line.
- Keep the length close to the original. Clear sentences, no marketing language.

ORIGINAL DESCRIPTION
${args.longDescription}

Return only JSON that conforms to the requested schema, with the restructured text in longDescription.`;
}
