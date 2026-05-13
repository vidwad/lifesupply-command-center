"""Streaming CSV writer.

Rows are written as they're produced so a crash mid-export still leaves a
valid partial CSV. UTF-8 + newline="" so Excel opens it cleanly on Windows
without doubled blank rows.
"""
from __future__ import annotations

from pathlib import Path
from types import TracebackType
from typing import IO, Any
import csv


class StreamingCsvWriter:
    """Context manager wrapping csv.DictWriter with streaming semantics."""

    def __init__(self, path: Path, columns: list[str]) -> None:
        self._path = path
        self._columns = columns
        self._file: IO[str] | None = None
        self._writer: csv.DictWriter[str] | None = None
        self._rows_written = 0

    def __enter__(self) -> "StreamingCsvWriter":
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._file = self._path.open("w", newline="", encoding="utf-8")
        self._writer = csv.DictWriter(self._file, fieldnames=self._columns)
        self._writer.writeheader()
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        if self._file is not None:
            self._file.close()
            self._file = None

    def write_row(self, row: dict[str, Any]) -> None:
        if self._writer is None:
            raise RuntimeError("write_row called outside of context manager")
        # csv.DictWriter writes None as 'None' — we want empty string.
        cleaned = {k: ("" if v is None else v) for k, v in row.items()}
        self._writer.writerow(cleaned)
        self._rows_written += 1

    @property
    def rows_written(self) -> int:
        return self._rows_written

    @property
    def path(self) -> Path:
        return self._path
