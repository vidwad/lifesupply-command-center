/**
 * Structured plain-text listing copy (product owner, 2026-10-26).
 *
 * The full description is stored as plain text, never HTML, so nothing in it
 * can become markup. It may carry structure in a small, fixed vocabulary:
 *
 *   - blocks are separated by a blank line;
 *   - a block that is one short line ending with ":" is a section title;
 *   - a block whose lines start with "- " (or "• " / "* ") is a bullet list;
 *   - anything else is a paragraph, its line breaks kept.
 *
 * One parser serves the project page, the BigCommerce HTML and the tests, so
 * what the owner reads is what the store gets.
 */

export type ListingBlock =
  | { type: "title"; text: string }
  | { type: "paragraph"; lines: string[] }
  | { type: "list"; items: string[] };

const BULLET = /^\s*(?:[-•*]|\d+[.)])\s+/;
const MAX_TITLE_LENGTH = 60;

/** A short line ending with a colon and containing no sentence punctuation. */
const isTitleLine = (line: string): boolean =>
  line.endsWith(":") && line.length <= MAX_TITLE_LENGTH && !/[.!?]/.test(line.slice(0, -1));

export function parseListingBlocks(text: string): ListingBlock[] {
  const blocks: ListingBlock[] = [];
  for (const chunk of text.replace(/\r\n/g, "\n").split(/\n\s*\n/)) {
    const lines = chunk
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) continue;
    if (lines.every((line) => BULLET.test(line))) {
      blocks.push({ type: "list", items: lines.map((line) => line.replace(BULLET, "")) });
      continue;
    }
    // A title may stand alone or head its own block, with the bullets or
    // prose that belong to it on the lines beneath.
    if (isTitleLine(lines[0]!)) {
      blocks.push({ type: "title", text: lines[0]!.slice(0, -1).trim() });
      const rest = lines.slice(1);
      if (rest.length === 0) continue;
      if (rest.every((line) => BULLET.test(line))) {
        blocks.push({ type: "list", items: rest.map((line) => line.replace(BULLET, "")) });
      } else {
        blocks.push({ type: "paragraph", lines: rest });
      }
      continue;
    }
    // A paragraph may end with a bullet run: "Includes:" style lead-ins on
    // the same block as their items. Split those so the items render as a list.
    const firstBullet = lines.findIndex((line) => BULLET.test(line));
    if (firstBullet > 0 && lines.slice(firstBullet).every((line) => BULLET.test(line))) {
      blocks.push({ type: "paragraph", lines: lines.slice(0, firstBullet) });
      blocks.push({
        type: "list",
        items: lines.slice(firstBullet).map((line) => line.replace(BULLET, "")),
      });
      continue;
    }
    blocks.push({ type: "paragraph", lines });
  }
  return blocks;
}

const escapeHtml = (text: string): string =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

/** The description as the store renders it: escaped, with real lists. */
export function listingToHtml(text: string): string {
  return parseListingBlocks(text)
    .map((block) => {
      switch (block.type) {
        case "title":
          return "<p><strong>" + escapeHtml(block.text) + "</strong></p>";
        case "list":
          return (
            "<ul>\n" +
            block.items.map((item) => "<li>" + escapeHtml(item) + "</li>").join("\n") +
            "\n</ul>"
          );
        case "paragraph":
          return "<p>" + block.lines.map(escapeHtml).join("<br>") + "</p>";
      }
    })
    .join("\n");
}

/**
 * The facts a rewrite must not lose: every number, code and measurement in
 * the original (model numbers, sizes, temperatures, counts, standards).
 * Compared loosely: digits and letters only, case-insensitive, so "2 in."
 * and "2in" match while "500 integrators" dropped entirely does not.
 */
export function factTokens(text: string): string[] {
  const tokens = text.match(/[A-Za-z]*\d[\w.\-/:%°×"']*/g) ?? [];
  return [...new Set(tokens.map(normalise).filter(Boolean))];
}

const normalise = (token: string): string => token.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Fact tokens present in `original` and absent from `candidate`. */
export function missingFacts(original: string, candidate: string): string[] {
  const haystack = normalise(candidate);
  return factTokens(original).filter((token) => !haystack.includes(token));
}
