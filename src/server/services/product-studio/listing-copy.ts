/**
 * Listing copy hygiene (product owner, 2026-10-26).
 *
 * The research model is told to cite its sources, and it did so inside the
 * buyer-facing description as well: "([emerdepot.com](https://emerdepot.com/
 * products/...))". A description with a link to another seller's product
 * page cannot go on a LifeSupply listing. Sources belong in the research
 * sources and price observations, which keep them; the copy a buyer reads
 * carries none.
 *
 * The prompt now says so, and this strip is applied regardless: when the
 * research result is stored, and again when a description is published, so
 * a project researched before the rule is covered too.
 */

/** A markdown link, with or without the citation parentheses around it. */
const CITATION = /\(\s*\[[^\]]*\]\(\s*[^)\s]+\s*\)\s*\)/g;
const MARKDOWN_LINK = /\[([^\]]*)\]\(\s*[^)\s]+\s*\)/g;
/** A bare URL or a www. host, with any trailing punctuation left in place. */
const BARE_URL = /\b(?:https?:\/\/|www\.)[^\s<>()\]]*[^\s<>()\].,;:!?]/gi;
/** An empty or whitespace-only parenthetical left behind by a removal. */
const EMPTY_PARENS = /\(\s*\)/g;

export function listingCopyHasLinks(text: string): boolean {
  return /\[[^\]]*\]\(\s*[^)\s]+\s*\)|https?:\/\/|\bwww\./i.test(text);
}

/**
 * Removes every link and citation from buyer-facing copy. A citation in its
 * own parentheses disappears entirely; a link that is part of a sentence
 * keeps its label text; a bare URL is removed. Spacing before punctuation is
 * then repaired so the sentence still reads.
 */
export function stripListingLinks(text: string): string {
  return text
    .replace(CITATION, "")
    .replace(MARKDOWN_LINK, "$1")
    .replace(BARE_URL, "")
    .replace(EMPTY_PARENS, "")
    .replace(/[ \t]+([.,;:!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+$/gm, "")
    .trim();
}

/** The listing fields a buyer reads, cleaned together. */
export function stripListingCopyLinks<
  T extends {
    title: string;
    shortDescription: string;
    longDescription: string;
    keyDetails: string[];
  },
>(listing: T): T {
  return {
    ...listing,
    title: stripListingLinks(listing.title),
    shortDescription: stripListingLinks(listing.shortDescription),
    longDescription: stripListingLinks(listing.longDescription),
    keyDetails: listing.keyDetails.map(stripListingLinks).filter(Boolean),
  };
}
