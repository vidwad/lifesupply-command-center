import Papa from "papaparse";

export type CsvRow = Record<string, string>;

export type CsvParseResult = {
  rows: CsvRow[];
  headers: string[];
  warnings: string[];
};

/**
 * Parse a CSV string into header-keyed row objects. Empty lines are skipped.
 * Trims whitespace from headers and values. Surfaces papaparse warnings as
 * caller-friendly strings so the import UI can present them.
 */
export function parseCsv(text: string): CsvParseResult {
  const result = Papa.parse<Record<string, string>>(text.trim(), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
    transform: (v) => (typeof v === "string" ? v.trim() : v),
  });

  const warnings = result.errors.map(
    (e) => `Row ${e.row != null ? e.row + 2 : "?"}: ${e.message}`,
  );
  const headers = (result.meta.fields ?? []).map((h) => h.trim()).filter(Boolean);

  return {
    rows: result.data.filter((r) => Object.keys(r).length > 0),
    headers,
    warnings,
  };
}

/** Pick the first non-empty column value from a row, given a list of header candidates. */
export function pick(row: CsvRow, candidates: string[]): string | null {
  for (const key of candidates) {
    const value = row[key];
    if (value != null && String(value).trim() !== "") return String(value).trim();
  }
  return null;
}

export function pickNumber(row: CsvRow, candidates: string[]): number | null {
  const raw = pick(row, candidates);
  if (raw == null) return null;
  // Strip $, commas, parens for negatives ("(123.45)" → -123.45).
  const cleaned = raw
    .replace(/[$\s]/g, "")
    .replace(/,/g, "")
    .replace(/^\((.+)\)$/, "-$1");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function pickDate(row: CsvRow, candidates: string[]): Date | null {
  const raw = pick(row, candidates);
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}
