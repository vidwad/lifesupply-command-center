"""Tests for the per-customer disk cache + --since round-trip via run_export."""
from __future__ import annotations

import csv as csv_mod
from datetime import datetime, timezone
from pathlib import Path

import pytest
import respx

from bc_enrichment.cache import CustomerCache, parse_since
from bc_enrichment.client import BC_BASE
from bc_enrichment.config import StoreConfig
from bc_enrichment.models import CustomerRow
from bc_enrichment.runner import RunOptions, run_export


def test_parse_since_accepts_iso_date() -> None:
    dt = parse_since("2025-06-01")
    assert dt is not None
    assert dt == datetime(2025, 6, 1, 0, 0, tzinfo=timezone.utc)


def test_parse_since_returns_none_when_unset() -> None:
    assert parse_since(None) is None
    assert parse_since("") is None


def test_parse_since_raises_on_garbage() -> None:
    with pytest.raises(ValueError):
        parse_since("not-a-date")


def test_cache_round_trips_a_customer_row(tmp_path: Path) -> None:
    cache = CustomerCache(tmp_path)
    original = CustomerRow(
        store="ls",
        store_customer_id=42,
        unified_customer_key="ls:42",
        email="alice@x.com",
        first_name="Alice",
        total_lifetime_spend=125.5,
        total_lifetime_orders=3,
        recency_bucket="0-30",
    )
    cache.write("ls", original)

    loaded = cache.read("ls", 42)
    assert loaded is not None
    assert loaded.email == "alice@x.com"
    assert loaded.total_lifetime_spend == 125.5
    assert loaded.recency_bucket == "0-30"


def test_cache_skips_guests_with_zero_id(tmp_path: Path) -> None:
    cache = CustomerCache(tmp_path)
    cache.write("ls", CustomerRow(
        store="ls", store_customer_id=0, unified_customer_key="ls:guest:x@y.com",
    ))
    # Cache file should not be created for store_customer_id=0
    assert not (tmp_path / "ls").exists() or list((tmp_path / "ls").glob("*")) == []


def test_cache_returns_none_for_missing_entry(tmp_path: Path) -> None:
    cache = CustomerCache(tmp_path)
    assert cache.read("ls", 999) is None


def test_cache_handles_corrupt_json(tmp_path: Path) -> None:
    cache = CustomerCache(tmp_path)
    p = tmp_path / "ls" / "customer_5.json"
    p.parent.mkdir(parents=True)
    p.write_text("not json", encoding="utf-8")
    assert cache.read("ls", 5) is None


def test_cache_invalidates_on_schema_mismatch(tmp_path: Path) -> None:
    """A cached row with a stale _schema hash should be auto-invalidated
    instead of returning a row with missing/extra fields."""
    cache = CustomerCache(tmp_path)
    p = tmp_path / "ls" / "customer_42.json"
    p.parent.mkdir(parents=True)
    # Write a payload claiming a different schema version
    import json
    p.write_text(
        json.dumps({
            "_schema": "deadbeef",  # bogus hash
            "store": "ls",
            "store_customer_id": 42,
            "unified_customer_key": "ls:42",
            "email": "a@x.com",
        }),
        encoding="utf-8",
    )
    assert cache.read("ls", 42) is None


def test_cache_writes_include_schema_hash(tmp_path: Path) -> None:
    import json
    cache = CustomerCache(tmp_path)
    cache.write("ls", CustomerRow(
        store="ls", store_customer_id=1, unified_customer_key="ls:1",
    ))
    p = tmp_path / "ls" / "customer_1.json"
    payload = json.loads(p.read_text(encoding="utf-8"))
    assert "_schema" in payload
    assert isinstance(payload["_schema"], str)
    assert len(payload["_schema"]) == 8


@pytest.mark.asyncio
async def test_since_uses_cache_for_unmodified_customers(tmp_path: Path) -> None:
    """First run: writes cache. Second run with --since: customer with old
    date_modified is read from cache (no re-enrichment needed)."""
    store = StoreConfig(slug="ls", label="LS", store_hash="h", access_token="t")
    cache_dir = tmp_path / "cache"
    csv_path = tmp_path / "out1.csv"

    customers_payload = {
        "data": [
            {"id": 1, "email": "alice@x.com", "first_name": "Alice",
             "date_modified": "2024-01-01T00:00:00+00:00"},
        ],
        "meta": {},
    }

    # First run — populates cache
    with respx.mock(assert_all_called=True) as mock:
        mock.get(f"{BC_BASE}/stores/h/v2/customer_groups").respond(200, json=[])
        mock.get(f"{BC_BASE}/stores/h/v2/orders?limit=250&page=1").respond(200, json=[])
        mock.get(f"{BC_BASE}/stores/h/v3/customers?limit=250&page=1").respond(200, json=customers_payload)

        opts1 = RunOptions(cache_dir=cache_dir)
        stats1 = await run_export(store, csv_path, opts1)

    assert stats1.customers_emitted == 1
    assert stats1.cache_hits == 0
    assert (cache_dir / "ls" / "customer_1.json").exists()

    # Modify the cached row so we can detect that the cache is what's read.
    cache = CustomerCache(cache_dir)
    cached = cache.read("ls", 1)
    assert cached is not None
    cached.first_name = "MarkedFromCache"
    cache.write("ls", cached)

    # Second run — --since 2025-01-01, customer's date_modified is 2024 → cache hit
    csv_path2 = tmp_path / "out2.csv"
    with respx.mock(assert_all_called=True) as mock:
        mock.get(f"{BC_BASE}/stores/h/v2/customer_groups").respond(200, json=[])
        mock.get(f"{BC_BASE}/stores/h/v2/orders?limit=250&page=1").respond(200, json=[])
        mock.get(f"{BC_BASE}/stores/h/v3/customers?limit=250&page=1").respond(200, json=customers_payload)

        opts2 = RunOptions(cache_dir=cache_dir, since=parse_since("2025-01-01"))
        stats2 = await run_export(store, csv_path2, opts2)

    assert stats2.customers_emitted == 1
    assert stats2.cache_hits == 1

    rows = list(csv_mod.DictReader(csv_path2.open(encoding="utf-8")))
    assert rows[0]["first_name"] == "MarkedFromCache"  # came from cache, not re-fetched
