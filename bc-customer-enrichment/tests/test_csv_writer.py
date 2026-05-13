"""Tests for the streaming CSV writer."""
from __future__ import annotations

import csv
from pathlib import Path

from bc_enrichment.csv_writer import StreamingCsvWriter


def test_writes_header_and_rows(tmp_path: Path) -> None:
    out = tmp_path / "out.csv"
    cols = ["a", "b", "c"]

    with StreamingCsvWriter(out, cols) as w:
        w.write_row({"a": 1, "b": "two", "c": None})
        w.write_row({"a": 2, "b": "comma,inside", "c": 'quote"inside'})

    rows = list(csv.DictReader(out.open(encoding="utf-8")))
    assert len(rows) == 2
    assert rows[0] == {"a": "1", "b": "two", "c": ""}
    assert rows[1] == {"a": "2", "b": "comma,inside", "c": 'quote"inside'}


def test_creates_parent_directories(tmp_path: Path) -> None:
    out = tmp_path / "deeply" / "nested" / "dir" / "out.csv"
    with StreamingCsvWriter(out, ["x"]) as w:
        w.write_row({"x": "hi"})
    assert out.exists()


def test_rows_written_counter(tmp_path: Path) -> None:
    out = tmp_path / "out.csv"
    with StreamingCsvWriter(out, ["x"]) as w:
        for i in range(7):
            w.write_row({"x": i})
        assert w.rows_written == 7
