import ExcelJS from "exceljs";

export type XlsxColumn<Row> = {
  header: string;
  key: string;
  width?: number;
  /** Numeric format string (e.g. "$#,##0.00") for currency / percentage cells. */
  numFmt?: string;
  get: (row: Row) => string | number | Date | boolean | null | undefined;
};

/**
 * Build an XLSX workbook with a single styled sheet. Returns a Node buffer
 * suitable for a fetch Response.
 *
 * Header row is bold, frozen, and uses a light fill. Columns honor the
 * requested width + numFmt; cells with null/undefined become empty strings.
 */
export async function buildXlsxWorkbook<Row>(args: {
  sheetName: string;
  columns: XlsxColumn<Row>[];
  rows: Iterable<Row>;
}): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "LifeSupply Command Center";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(args.sheetName);

  sheet.columns = args.columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width ?? 16,
    style: c.numFmt ? { numFmt: c.numFmt } : undefined,
  }));

  // Style + freeze the header.
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEFEFEF" },
  };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  for (const row of args.rows) {
    const obj: Record<string, string | number | Date | boolean | null> = {};
    for (const col of args.columns) {
      const v = col.get(row);
      obj[col.key] = v == null ? null : (v as string | number | Date | boolean);
    }
    sheet.addRow(obj);
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export function xlsxResponse(filename: string, buffer: Buffer): Response {
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
