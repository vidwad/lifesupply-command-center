/**
 * DP-2 upload parsing for the Product List Builder.
 *
 * Header-tolerant by design: operators export from BigCommerce, a supplier
 * portal, or a spreadsheet someone maintains by hand, and rejecting a file
 * because a column is called "Cost" rather than "cost_price" wastes their time
 * without protecting anything. What is NOT tolerated is a missing cost basis or
 * an unparseable price — those become blocked rows the operator can see.
 */
import { pick, pickNumber, parseCsv, type CsvRow } from "@/server/services/imports/csv";

export type UploadRow = {
  /** 1-based row number as it appears in the operator's file, header included. */
  line: number;
  sku: string | null;
  productName: string | null;
  currentRegularPrice: number | null;
  currentSalePrice: number | null;
  costPrice: number | null;
  competitorUrl: string | null;
  productId: string | null;
  variantId: string | null;
  store: string | null;
  supplierSku: string | null;
  notes: string | null;
  /** Problems that make the row unusable as written. */
  errors: string[];
};

export type UploadParseResult = {
  rows: UploadRow[];
  headers: string[];
  warnings: string[];
};

const SKU = ["sku", "SKU", "Sku", "product_sku", "Product SKU", "item_sku"];
const NAME = ["product_name", "Product Name", "name", "Name", "title", "Title", "description"];
const PRICE = [
  "current_price",
  "Current Price",
  "price",
  "Price",
  "regular_price",
  "Regular Price",
];
const SALE = ["current_sale_price", "Current Sale Price", "sale_price", "Sale Price", "sale"];
const COST = [
  "cost_price",
  "Cost Price",
  "cost",
  "Cost",
  "unit_cost",
  "Unit Cost",
  "supplier_cost",
];
const COMPETITOR = ["competitor_url_optional", "competitor_url", "Competitor URL", "competitor"];
const PRODUCT_ID = ["product_id", "Product ID", "productId"];
const VARIANT_ID = ["variant_id", "Variant ID", "variantId", "product_variant_id"];
const STORE = ["store", "Store", "store_name", "Store Name"];
const SUPPLIER_SKU = ["supplier_sku", "Supplier SKU", "supplierSku", "vendor_sku"];
const NOTES = ["notes", "Notes", "note", "comment", "Comment"];

function validUrl(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function readRow(row: CsvRow, line: number): UploadRow {
  const errors: string[] = [];

  const sku = pick(row, SKU);
  if (!sku) errors.push("Missing SKU.");

  const currentRegularPrice = pickNumber(row, PRICE);
  const currentSalePrice = pickNumber(row, SALE);
  const costPrice = pickNumber(row, COST);

  // Negative or zero is treated as absent rather than as a value: a zero cost
  // would compute a zero floor and silently permit any price.
  for (const [label, value] of [
    ["Current price", currentRegularPrice],
    ["Sale price", currentSalePrice],
    ["Cost price", costPrice],
  ] as const) {
    if (value != null && (!Number.isFinite(value) || value < 0)) {
      errors.push(`${label} must be a positive number.`);
    }
  }
  if (currentRegularPrice == null && currentSalePrice == null) {
    errors.push("No usable price — provide current_price or current_sale_price.");
  }

  const rawCompetitor = pick(row, COMPETITOR);
  const competitorUrl = validUrl(rawCompetitor);
  if (rawCompetitor && !competitorUrl) {
    errors.push("Competitor URL is not a valid http(s) URL.");
  }

  return {
    line,
    sku,
    productName: pick(row, NAME),
    currentRegularPrice:
      currentRegularPrice != null && currentRegularPrice > 0 ? currentRegularPrice : null,
    currentSalePrice: currentSalePrice != null && currentSalePrice > 0 ? currentSalePrice : null,
    costPrice: costPrice != null && costPrice > 0 ? costPrice : null,
    competitorUrl,
    productId: pick(row, PRODUCT_ID),
    variantId: pick(row, VARIANT_ID),
    store: pick(row, STORE),
    supplierSku: pick(row, SUPPLIER_SKU),
    notes: pick(row, NOTES),
    errors,
  };
}

export function parseUpload(text: string): UploadParseResult {
  const parsed = parseCsv(text);
  return {
    // +2: one for the header line, one because operators count from 1.
    rows: parsed.rows.map((row, index) => readRow(row, index + 2)),
    headers: parsed.headers,
    warnings: parsed.warnings,
  };
}

export type UploadPreview = {
  total: number;
  usable: number;
  withErrors: number;
  missingCost: number;
  duplicateSkus: string[];
};

/** Counts for the mapping preview shown before any run row is written. */
export function previewUpload(rows: readonly UploadRow[]): UploadPreview {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!row.sku) continue;
    const key = row.sku.trim().toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return {
    total: rows.length,
    usable: rows.filter((row) => row.errors.length === 0).length,
    withErrors: rows.filter((row) => row.errors.length > 0).length,
    missingCost: rows.filter((row) => row.costPrice == null).length,
    duplicateSkus: [...counts.entries()].filter(([, n]) => n > 1).map(([sku]) => sku),
  };
}
