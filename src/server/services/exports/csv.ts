/**
 * Tiny zero-dep CSV serializer. RFC-4180-ish: quote any field containing
 * a comma, quote, CR, or LF; escape inner quotes by doubling them. Decimal
 * values from Prisma serialize via toString() — callers should map them.
 */
export type CsvCell = string | number | boolean | Date | null | undefined;

function formatCell(value: CsvCell): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function escapeCell(value: CsvCell): string {
  const s = formatCell(value);
  if (s === "") return "";
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv<Row>(args: {
  headers: { key: string; label: string; get: (row: Row) => CsvCell }[];
  rows: Iterable<Row>;
}): string {
  const lines: string[] = [];
  lines.push(args.headers.map((h) => escapeCell(h.label)).join(","));
  for (const row of args.rows) {
    lines.push(args.headers.map((h) => escapeCell(h.get(row))).join(","));
  }
  return lines.join("\r\n") + "\r\n";
}

export function csvResponse(filename: string, body: string): Response {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
