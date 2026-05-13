"""Tests for the CSV → XLSX converter."""
from __future__ import annotations

import zipfile
from pathlib import Path

from bc_enrichment.csv_writer import StreamingCsvWriter
from bc_enrichment.xlsx_export import _coerce_cell, csv_to_xlsx


def test_coerce_cell_handles_int_float_bool_str_empty() -> None:
    assert _coerce_cell("") == ""
    assert _coerce_cell("42") == 42
    assert _coerce_cell("3.14") == 3.14
    assert _coerce_cell("True") is True
    assert _coerce_cell("False") is False
    assert _coerce_cell("hello") == "hello"
    assert _coerce_cell("not-a-number") == "not-a-number"


def test_csv_to_xlsx_produces_a_valid_xlsx_zip(tmp_path: Path) -> None:
    csv_path = tmp_path / "src.csv"
    xlsx_path = tmp_path / "out.xlsx"
    cols = ["id", "name", "spend"]

    with StreamingCsvWriter(csv_path, cols) as w:
        w.write_row({"id": 1, "name": "Alice", "spend": 100.0})
        w.write_row({"id": 2, "name": "Bob, Jr.", "spend": 250.5})

    csv_to_xlsx(csv_path, xlsx_path)

    # XLSX is a ZIP archive — verify magic bytes + that it contains the
    # expected workbook part. Cheap sanity check that doesn't pull in openpyxl.
    assert xlsx_path.exists()
    assert xlsx_path.stat().st_size > 1000
    with zipfile.ZipFile(xlsx_path) as zf:
        names = zf.namelist()
        assert "xl/workbook.xml" in names
        assert any(n.startswith("xl/worksheets/sheet") for n in names)


def test_csv_to_xlsx_handles_empty_csv(tmp_path: Path) -> None:
    """A header-only CSV (no rows) should still produce a valid empty xlsx."""
    csv_path = tmp_path / "empty.csv"
    xlsx_path = tmp_path / "empty.xlsx"
    with StreamingCsvWriter(csv_path, ["a", "b"]):
        pass  # write nothing

    csv_to_xlsx(csv_path, xlsx_path)
    assert xlsx_path.exists()
    with zipfile.ZipFile(xlsx_path) as zf:
        assert "xl/workbook.xml" in zf.namelist()
