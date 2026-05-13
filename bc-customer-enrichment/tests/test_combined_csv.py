"""Tests for the --store all combined-CSV writer."""
from __future__ import annotations

import csv
from pathlib import Path

from bc_enrichment.cli import _write_combined_csv
from bc_enrichment.csv_writer import StreamingCsvWriter


def _write_csv(path: Path, header: list[str], rows: list[dict[str, object]]) -> None:
    with StreamingCsvWriter(path, header) as w:
        for r in rows:
            w.write_row(r)


def test_combined_csv_concats_and_dedups_header(tmp_path: Path) -> None:
    cols = ["store", "store_customer_id", "email"]
    p1 = tmp_path / "a.csv"
    p2 = tmp_path / "b.csv"
    _write_csv(p1, cols, [
        {"store": "lifesupply", "store_customer_id": 1, "email": "a@x.com"},
        {"store": "lifesupply", "store_customer_id": 2, "email": "b@x.com"},
    ])
    _write_csv(p2, cols, [
        {"store": "wellmart", "store_customer_id": 1, "email": "c@x.com"},
    ])

    combined = _write_combined_csv([p1, p2], tmp_path, "2026-05-13")

    assert combined is not None
    assert combined.exists()
    rows = list(csv.DictReader(combined.open(encoding="utf-8")))
    assert len(rows) == 3
    assert rows[0]["store"] == "lifesupply"
    assert rows[2]["store"] == "wellmart"


def test_combined_csv_returns_none_for_empty_input(tmp_path: Path) -> None:
    assert _write_combined_csv([], tmp_path, "2026-05-13") is None


def test_combined_csv_skips_missing_files(tmp_path: Path) -> None:
    p1 = tmp_path / "a.csv"
    _write_csv(p1, ["x"], [{"x": 1}])
    missing = tmp_path / "doesnt_exist.csv"

    combined = _write_combined_csv([p1, missing], tmp_path, "2026-05-13")

    assert combined is not None
    rows = list(csv.DictReader(combined.open(encoding="utf-8")))
    assert len(rows) == 1
