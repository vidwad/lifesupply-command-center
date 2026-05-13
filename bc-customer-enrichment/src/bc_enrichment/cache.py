"""Per-customer disk cache.

One JSON file per registered customer at .cache/{store}/customer_{id}.json
holding the full enriched CustomerRow. Used with --since to skip the
full enrichment pipeline for customers whose date_modified hasn't
advanced past the cutoff.

Guests aren't cached: they have no stable identity and no date_modified
to compare against — and they're a small fraction of rows anyway.

Cache invalidation is purely date-based (on the BC customer's
date_modified). Schema changes to CustomerRow are NOT versioned: when
you add fields, delete .cache/ to force a full rebuild.
"""
from __future__ import annotations

import hashlib
import json
import logging
from dataclasses import asdict, fields
from datetime import datetime
from pathlib import Path
from typing import Any

from bc_enrichment.dates import parse_bc_date
from bc_enrichment.models import CustomerRow

logger = logging.getLogger(__name__)


def _compute_schema_hash() -> str:
    """8-char hash of the CustomerRow field set. Changes when fields are
    added/removed so we can auto-invalidate stale cache entries instead of
    silently returning rows with missing columns."""
    sig = "|".join(sorted(f.name for f in fields(CustomerRow)))
    return hashlib.sha256(sig.encode("utf-8")).hexdigest()[:8]


_SCHEMA_HASH = _compute_schema_hash()
_SCHEMA_KEY = "_schema"


class CustomerCache:
    def __init__(self, root: Path) -> None:
        self.root = root
        self._valid_field_names: set[str] = {f.name for f in fields(CustomerRow)}

    def _path(self, store_slug: str, customer_id: int) -> Path:
        return self.root / store_slug / f"customer_{customer_id}.json"

    def read(self, store_slug: str, customer_id: int) -> CustomerRow | None:
        p = self._path(store_slug, customer_id)
        if not p.exists():
            return None
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError) as e:
            logger.warning("cache read failed for %s/%d: %s", store_slug, customer_id, e)
            return None
        if not isinstance(data, dict):
            return None
        if data.get(_SCHEMA_KEY) != _SCHEMA_HASH:
            logger.info(
                "cache schema mismatch for %s/%d (auto-invalidated)",
                store_slug, customer_id,
            )
            return None
        clean: dict[str, Any] = {
            k: v for k, v in data.items() if k in self._valid_field_names
        }
        try:
            return CustomerRow(**clean)
        except TypeError as e:
            logger.warning(
                "cache row construct failed for %s/%d: %s",
                store_slug, customer_id, e,
            )
            return None

    def write(self, store_slug: str, row: CustomerRow) -> None:
        if row.store_customer_id <= 0:
            return  # guests not cached
        p = self._path(store_slug, row.store_customer_id)
        p.parent.mkdir(parents=True, exist_ok=True)
        payload: dict[str, Any] = {_SCHEMA_KEY: _SCHEMA_HASH, **asdict(row)}
        p.write_text(
            json.dumps(payload, indent=2, default=str, sort_keys=True),
            encoding="utf-8",
        )


def parse_since(since_arg: str | None) -> datetime | None:
    """Parse the --since YYYY-MM-DD argument. Returns None if not supplied."""
    if not since_arg:
        return None
    parsed = parse_bc_date(since_arg + "T00:00:00+00:00")
    if parsed is None:
        raise ValueError(f"--since must be YYYY-MM-DD; got {since_arg!r}")
    return parsed
