/**
 * DP-3 price extraction from a fetched competitor product page.
 *
 * Deliberately conservative. Structured data first (JSON-LD offers, then
 * OpenGraph/meta), and nothing else: no DOM heuristics that guess which number
 * on a page is "the price". An ambiguous page produces a low_confidence or
 * failed observation, never a confident wrong one — a wrong competitor price
 * feeds a wrong recommendation later, while a missing one merely feeds none.
 *
 * Pure: takes HTML text, returns a result. No network, no Prisma.
 */

export type ExtractionMethod = "direct_url" | "search_template" | "manual" | "ai_assisted";

export type ObservationStatus = "valid" | "invalid" | "unavailable" | "low_confidence" | "failed";

export type ExtractedPrice = {
  regularPrice: number | null;
  salePrice: number | null;
  effectivePrice: number | null;
  currency: string | null;
  availability: string | null;
  source: "json_ld" | "opengraph" | "meta_itemprop" | "none";
  evidenceText: string | null;
  pageTitle: string | null;
  confidence: number;
  status: ObservationStatus;
  notes: string[];
};

const MAX_EVIDENCE_CHARS = 500;

const toNumber = (value: unknown): number | null => {
  if (value == null) return null;
  const raw = String(value)
    .replace(/[^\d.,-]/g, "")
    .replace(/,(?=\d{3}\b)/g, "");
  const normalised = raw.includes(",") && !raw.includes(".") ? raw.replace(",", ".") : raw;
  const n = Number(normalised);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
};

const CURRENCY = /^[A-Z]{3}$/;

function snippet(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > MAX_EVIDENCE_CHARS ? clean.slice(0, MAX_EVIDENCE_CHARS) + "…" : clean;
}

export function extractPageTitle(html: string): string | null {
  const match = /<title[^>]*>([\s\S]{0,300}?)<\/title>/i.exec(html);
  return match?.[1] ? snippet(match[1]) : null;
}

function jsonLdBlocks(html: string): unknown[] {
  const out: unknown[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const body = match[1];
    if (!body) continue;
    try {
      out.push(JSON.parse(body));
    } catch {
      // A malformed block is skipped rather than failing the whole extraction:
      // pages routinely ship one broken block alongside good ones.
    }
  }
  return out;
}

function flatten(node: unknown, depth = 0): Record<string, unknown>[] {
  if (depth > 6 || node == null) return [];
  if (Array.isArray(node)) return node.flatMap((child) => flatten(child, depth + 1));
  if (typeof node !== "object") return [];
  const record = node as Record<string, unknown>;
  const nested = ["@graph", "offers", "hasVariant", "itemListElement"].flatMap((key) =>
    key in record ? flatten(record[key], depth + 1) : [],
  );
  return [record, ...nested];
}

function fromJsonLd(html: string): Partial<ExtractedPrice> | null {
  const nodes = jsonLdBlocks(html).flatMap((block) => flatten(block));
  const offer = nodes.find((node) => {
    const type = String(node["@type"] ?? "");
    return /Offer/i.test(type) && (node.price != null || node.lowPrice != null);
  });
  if (!offer) return null;

  const price = toNumber(offer.price ?? offer.lowPrice);
  if (price == null) return null;
  const currencyRaw = String(offer.priceCurrency ?? "").toUpperCase();

  return {
    salePrice: price,
    regularPrice: toNumber(offer.highPrice) ?? null,
    effectivePrice: price,
    currency: CURRENCY.test(currencyRaw) ? currencyRaw : null,
    availability: offer.availability ? String(offer.availability) : null,
    source: "json_ld",
    evidenceText: snippet(JSON.stringify(offer).slice(0, MAX_EVIDENCE_CHARS * 2)),
  };
}

function metaContent(html: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (match?.[1]) return match[1];
  }
  return null;
}

function fromMeta(html: string): Partial<ExtractedPrice> | null {
  const amount = metaContent(html, [
    /<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']product:price:amount["']/i,
    /<meta[^>]+itemprop=["']price["'][^>]+content=["']([^"']+)["']/i,
  ]);
  const price = toNumber(amount);
  if (price == null) return null;

  const currencyRaw = (
    metaContent(html, [
      /<meta[^>]+property=["']product:price:currency["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+itemprop=["']priceCurrency["'][^>]+content=["']([^"']+)["']/i,
    ]) ?? ""
  ).toUpperCase();

  return {
    salePrice: price,
    regularPrice: null,
    effectivePrice: price,
    currency: CURRENCY.test(currencyRaw) ? currencyRaw : null,
    availability: metaContent(html, [
      /<meta[^>]+property=["']product:availability["'][^>]+content=["']([^"']+)["']/i,
    ]),
    source: /itemprop=["']price["']/i.test(html) ? "meta_itemprop" : "opengraph",
    evidenceText: snippet("price=" + String(amount) + " currency=" + (currencyRaw || "unknown")),
  };
}

/** Pages that are clearly not a single product page. */
function looksLikeListingPage(html: string, url: string): boolean {
  if (/[?&](q|query|search|s)=/i.test(url)) return true;
  if (/\/(search|category|categories|collections|cart|basket)(\/|\?|$)/i.test(url)) return true;
  const title = extractPageTitle(html) ?? "";
  return /search results|shopping cart|category/i.test(title);
}

const OUT_OF_STOCK = /OutOfStock|SoldOut|Discontinued|out of stock/i;

export function extractCompetitorPrice(args: {
  html: string;
  url: string;
  sku?: string | null;
  productName?: string | null;
  /** True when the URL came from a human-verified mapping. */
  urlVerified: boolean;
  fallbackCurrency?: string | null;
}): ExtractedPrice {
  const notes: string[] = [];
  const pageTitle = extractPageTitle(args.html);
  const base: ExtractedPrice = {
    regularPrice: null,
    salePrice: null,
    effectivePrice: null,
    currency: null,
    availability: null,
    source: "none",
    evidenceText: null,
    pageTitle,
    confidence: 0,
    status: "failed",
    notes,
  };

  const found = fromJsonLd(args.html) ?? fromMeta(args.html);
  if (!found) {
    notes.push("No structured price found (JSON-LD offer or product meta tags).");
    return base;
  }

  const merged: ExtractedPrice = { ...base, ...found, pageTitle, notes };

  if (merged.currency == null && args.fallbackCurrency) {
    merged.currency = args.fallbackCurrency;
    notes.push(
      "Currency not stated on the page; assumed " +
        args.fallbackCurrency +
        " from competitor setup.",
    );
  }
  if (merged.currency == null) {
    notes.push("Currency unknown and not inferable.");
    merged.status = "low_confidence";
    merged.confidence = 0.2;
    return merged;
  }

  // Corroboration: does the page actually mention this product?
  const haystack = args.html.toLowerCase();
  const skuHit = args.sku ? haystack.includes(args.sku.toLowerCase()) : false;
  const nameHit = args.productName
    ? args.productName
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 3)
        .slice(0, 6)
        .every((word) => haystack.includes(word))
    : false;

  let confidence = args.urlVerified ? 0.7 : 0.5;
  if (skuHit) confidence += 0.2;
  if (nameHit) confidence += 0.1;
  if (!skuHit && !nameHit) {
    notes.push("Neither SKU nor product name found on the page.");
    confidence -= 0.3;
  }
  confidence = Math.max(0, Math.min(1, Math.round(confidence * 100) / 100));
  merged.confidence = confidence;

  if (looksLikeListingPage(args.html, args.url)) {
    notes.push("URL or title looks like a search, category, or cart page rather than a product.");
    merged.status = "low_confidence";
    merged.confidence = Math.min(confidence, 0.3);
    return merged;
  }

  if (merged.availability && OUT_OF_STOCK.test(merged.availability)) {
    notes.push("Product is out of stock; the price is not a purchasable offer.");
    merged.status = "unavailable";
    return merged;
  }

  merged.status = confidence >= 0.7 ? "valid" : "low_confidence";
  return merged;
}
