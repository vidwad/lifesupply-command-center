"""CSV → XLSX converter.

Runs after streaming CSV completes — preserves the partial-output safety
of the streaming path while still producing a styled workbook for ops use.

Numeric strings are coerced back to numbers so Excel sorts and filters
correctly (otherwise '125.0' sorts as text — '1000' < '2' < '300').
"""
from __future__ import annotations

import csv
from pathlib import Path

import xlsxwriter


def _coerce_cell(value: str) -> str | int | float | bool:
    if value == "":
        return ""
    if value in ("True", "False"):
        return value == "True"
    try:
        if "." in value:
            return float(value)
        return int(value)
    except ValueError:
        return value


def csv_to_xlsx(csv_path: Path, xlsx_path: Path) -> None:
    """Convert a streaming-CSV output to a styled XLSX. Header row is bold,
    light-grey, frozen; column widths sized to header length."""
    with xlsx_path.open("wb") as binfile:
        wb = xlsxwriter.Workbook(binfile)
        try:
            sheet = wb.add_worksheet("customers_enriched")
            header_fmt = wb.add_format(
                {"bold": True, "bg_color": "#EFEFEF", "border": 1}
            )
            sheet.freeze_panes(1, 0)

            with csv_path.open(encoding="utf-8") as csv_file:
                reader = csv.reader(csv_file)
                header = next(reader, None)
                if header is None:
                    return
                for col_idx, name in enumerate(header):
                    sheet.write(0, col_idx, name, header_fmt)
                    width = max(12, min(40, len(name) + 4))
                    sheet.set_column(col_idx, col_idx, width)
                for row_idx, row in enumerate(reader, start=1):
                    for col_idx, value in enumerate(row):
                        sheet.write(row_idx, col_idx, _coerce_cell(value))
        finally:
            wb.close()
