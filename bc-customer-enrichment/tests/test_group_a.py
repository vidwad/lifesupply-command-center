"""End-to-end Group A test.

Mocks /v3/customers and asserts the runner emits one CSV row per customer
with the right Group A + H values, in the right column order, with empty
strings (not 'None') for missing fields.
"""
from __future__ import annotations

import csv
from pathlib import Path

import pytest
import respx

from bc_enrichment.client import BC_BASE
from bc_enrichment.config import StoreConfig
from bc_enrichment.enrichers.group_a_customer import from_customer_row
from bc_enrichment.runner import run_export


def test_from_customer_row_populates_group_a_and_h() -> None:
    raw = {
        "id": 42,
        "email": "alice@example.com",
        "first_name": "Alice",
        "last_name": "Anders",
        "company": "Acme",
        "phone": "555-1212",
        "customer_group_id": 8,
        "tax_exempt_category": None,
        "registration_ip_address": "203.0.113.7",
        "date_created": "2024-01-15T00:00:00+00:00",
        "date_modified": "2025-09-09T12:00:00+00:00",
    }
    row = from_customer_row("lifesupply", raw)

    assert row.store == "lifesupply"
    assert row.store_customer_id == 42
    assert row.unified_customer_key == "lifesupply:42"
    assert row.customer_id == 42
    assert row.email == "alice@example.com"
    assert row.first_name == "Alice"
    assert row.company == "Acme"
    assert row.customer_group_id == 8
    assert row.tax_exempt_category is None
    # Defaults for un-enriched groups
    assert row.total_lifetime_spend == 0.0
    assert row.recency_bucket == "never"
    assert row.is_b2b is False


def test_from_customer_row_handles_blank_strings() -> None:
    raw = {"id": 7, "email": "", "first_name": "  ", "company": "x"}
    row = from_customer_row("wellmart", raw)
    assert row.email is None
    assert row.first_name is None
    assert row.company == "x"


@pytest.mark.asyncio
async def test_run_export_writes_one_row_per_customer(tmp_path: Path) -> None:
    store = StoreConfig(
        slug="lifesupply",
        label="LifeSupply.ca",
        store_hash="testhash",
        access_token="testtoken",
    )
    # Single short page → pagination terminates after page 1, no page 2 call.
    page1 = {
        "data": [
            {"id": 1, "email": "a@x.com", "first_name": "A"},
            {"id": 2, "email": "b@x.com", "first_name": "B", "company": "BizCo"},
        ],
        "meta": {},
    }
    csv_path = tmp_path / "out.csv"

    with respx.mock(assert_all_called=True) as mock:
        # Phase 0 (customer_groups), Phase 1 (orders), Phase 2 (customers).
        mock.get(f"{BC_BASE}/stores/testhash/v2/customer_groups").respond(
            200, json=[]
        )
        mock.get(
            f"{BC_BASE}/stores/testhash/v2/orders?limit=250&page=1"
        ).respond(200, json=[])
        mock.get(
            f"{BC_BASE}/stores/testhash/v3/customers?limit=250&page=1"
        ).respond(200, json=page1)

        stats = await run_export(store, csv_path)

    assert stats.customers_emitted == 2
    # 3 API calls: customer_groups, orders page 1, customers page 1.
    assert stats.api_requests == 3

    rows = list(csv.DictReader(csv_path.open(encoding="utf-8")))
    assert len(rows) == 2
    assert rows[0]["store"] == "lifesupply"
    assert rows[0]["unified_customer_key"] == "lifesupply:1"
    assert rows[0]["email"] == "a@x.com"
    assert rows[0]["company"] == ""  # missing → empty string, not 'None'
    assert rows[1]["company"] == "BizCo"
    # Defaulted Group B fields are written
    assert rows[0]["recency_bucket"] == "never"
    assert rows[0]["total_lifetime_spend"] == "0.0"
