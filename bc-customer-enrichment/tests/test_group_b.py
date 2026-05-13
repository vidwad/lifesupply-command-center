"""Tests for Group B order aggregation + the refactored two-phase runner."""
from __future__ import annotations

import csv
from datetime import date, datetime, timezone
from pathlib import Path

import pytest
import respx

from bc_enrichment.client import BC_BASE
from bc_enrichment.config import StoreConfig
from bc_enrichment.enrichers.group_a_customer import from_customer_row
from bc_enrichment.enrichers.group_b_orders import (
    OrderAggregator,
    apply_b_to_row,
    build_guest_row,
)
from bc_enrichment.runner import run_export


def test_aggregator_counts_orders_and_sums_total() -> None:
    agg = OrderAggregator()
    agg.ingest({
        "id": 1, "customer_id": 7,
        "date_created": "Wed, 01 Jan 2025 12:00:00 +0000",
        "total_inc_tax": "100.00",
    })
    agg.ingest({
        "id": 2, "customer_id": 7,
        "date_created": "Tue, 01 Jul 2025 12:00:00 +0000",
        "total_inc_tax": "50.00",
    })

    a = agg.by_customer[7]
    assert a.total_orders == 2
    assert a.total_spend == 150.0
    assert a.first_order == datetime(2025, 1, 1, 12, 0, tzinfo=timezone.utc)
    assert a.last_order == datetime(2025, 7, 1, 12, 0, tzinfo=timezone.utc)
    assert a.last_order_id == 2


def test_aggregator_groups_guest_orders_case_insensitively() -> None:
    agg = OrderAggregator()
    agg.ingest({
        "id": 10, "customer_id": 0,
        "date_created": "Wed, 01 Jan 2025 12:00:00 +0000",
        "total_inc_tax": "75.00",
        "billing_address": {
            "email": "Guest@Example.COM",
            "first_name": "Guest",
            "last_name": "User",
            "phone": "555-1234",
        },
    })
    agg.ingest({
        "id": 11, "customer_id": 0,
        "date_created": "Mon, 03 Mar 2025 12:00:00 +0000",
        "total_inc_tax": "25.00",
        "billing_address": {"email": "guest@example.com"},
    })

    g = agg.by_guest_email["guest@example.com"]
    assert g.total_orders == 2
    assert g.total_spend == 100.0
    # Identity from first order persists since later order doesn't overwrite
    # empty fields.
    assert g.first_name == "Guest"
    assert g.last_name == "User"
    assert g.phone == "555-1234"


def test_aggregator_overwrites_guest_identity_with_more_recent_order() -> None:
    agg = OrderAggregator()
    agg.ingest({
        "id": 1, "customer_id": 0,
        "date_created": "Wed, 01 Jan 2025 12:00:00 +0000",
        "total_inc_tax": "10",
        "billing_address": {"email": "g@x.com", "first_name": "Old"},
    })
    agg.ingest({
        "id": 2, "customer_id": 0,
        "date_created": "Mon, 03 Mar 2025 12:00:00 +0000",
        "total_inc_tax": "10",
        "billing_address": {"email": "g@x.com", "first_name": "New"},
    })
    assert agg.by_guest_email["g@x.com"].first_name == "New"


def test_aggregator_skips_guest_orders_with_no_email() -> None:
    agg = OrderAggregator()
    agg.ingest({"id": 99, "customer_id": 0, "billing_address": {}, "total_inc_tax": "10"})
    agg.ingest({"id": 100, "customer_id": 0, "total_inc_tax": "10"})  # no billing
    assert agg.by_guest_email == {}


def test_apply_b_computes_aov_lifespan_recency_funnel() -> None:
    today = date(2026, 1, 1)
    row = from_customer_row("lifesupply", {
        "id": 7, "date_created": "2024-06-01T00:00:00+00:00",
    })
    agg = OrderAggregator()
    agg.ingest({"id": 1, "customer_id": 7, "date_created": "2024-12-01T00:00:00+00:00", "total_inc_tax": "100"})
    agg.ingest({"id": 2, "customer_id": 7, "date_created": "2025-12-01T00:00:00+00:00", "total_inc_tax": "300"})

    apply_b_to_row(row, agg.by_customer[7], today)

    assert row.total_lifetime_spend == 400.0
    assert row.total_lifetime_orders == 2
    assert row.average_order_value == 200.0
    assert row.first_order_date == "2024-12-01"
    assert row.last_order_date == "2025-12-01"
    assert row.days_since_last_order == 31
    assert row.recency_bucket == "31-90"
    assert row.customer_lifespan_days == 365
    assert row.order_frequency_days == 365.0
    # Registered Jun 2024, first order Dec 2024 → ~183 days
    assert row.funnel_gap_days is not None and row.funnel_gap_days >= 180


def test_apply_b_no_orders_keeps_defaults() -> None:
    row = from_customer_row("ls", {"id": 1, "date_created": "2024-01-01T00:00:00+00:00"})
    apply_b_to_row(row, None, date(2026, 1, 1))
    assert row.recency_bucket == "never"
    assert row.total_lifetime_spend == 0.0
    assert row.total_lifetime_orders == 0
    assert row.first_order_date is None


def test_build_guest_row_populates_b_and_h() -> None:
    today = date(2026, 1, 1)
    agg = OrderAggregator()
    agg.ingest({
        "id": 50, "customer_id": 0,
        "date_created": "2025-09-01T00:00:00+00:00",
        "total_inc_tax": "200",
        "billing_address": {"email": "guest@x.com", "first_name": "Pat", "company": "Acme"},
    })

    row = build_guest_row("wellmart", agg.by_guest_email["guest@x.com"], today)

    assert row.store == "wellmart"
    assert row.store_customer_id == 0
    assert row.unified_customer_key == "wellmart:guest:guest@x.com"
    assert row.customer_id is None  # no Group A for guests
    assert row.email == "guest@x.com"
    assert row.first_name == "Pat"
    assert row.company == "Acme"
    assert row.total_lifetime_spend == 200.0
    assert row.total_lifetime_orders == 1
    assert row.recency_bucket == "91-180"  # Sep 2025 → Jan 2026 = 122 days


@pytest.mark.asyncio
async def test_run_export_two_phase_emits_customers_and_guests(
    tmp_path: Path,
) -> None:
    store = StoreConfig(
        slug="lifesupply",
        label="LS",
        store_hash="testhash",
        access_token="tok",
    )
    csv_path = tmp_path / "out.csv"

    orders = [
        {"id": 100, "customer_id": 1, "date_created": "2025-01-01T00:00:00+00:00", "total_inc_tax": "50"},
        {"id": 101, "customer_id": 1, "date_created": "2025-06-01T00:00:00+00:00", "total_inc_tax": "75"},
        {
            "id": 200, "customer_id": 0,
            "date_created": "2025-03-15T00:00:00+00:00",
            "total_inc_tax": "30",
            "billing_address": {"email": "guest@x.com", "first_name": "G"},
        },
    ]
    customers = {
        "data": [
            {"id": 1, "email": "alice@x.com"},
            {"id": 2, "email": "bob@x.com"},
        ],
        "meta": {},
    }

    with respx.mock(assert_all_called=True) as mock:
        mock.get(f"{BC_BASE}/stores/testhash/v2/customer_groups").respond(
            200, json=[]
        )
        mock.get(
            f"{BC_BASE}/stores/testhash/v2/orders?limit=250&page=1"
        ).respond(200, json=orders)
        mock.get(
            f"{BC_BASE}/stores/testhash/v3/customers?limit=250&page=1"
        ).respond(200, json=customers)
        # Phase 1.5 shipping fetches (Group C). Last orders: cust1=101, guest=200.
        mock.get(
            f"{BC_BASE}/stores/testhash/v2/orders/101/shipping_addresses"
        ).respond(200, json=[])
        mock.get(
            f"{BC_BASE}/stores/testhash/v2/orders/200/shipping_addresses"
        ).respond(200, json=[])

        stats = await run_export(store, csv_path)

    assert stats.customers_emitted == 2
    assert stats.guests_emitted == 1
    assert stats.orders_scanned == 3

    rows = list(csv.DictReader(csv_path.open(encoding="utf-8")))
    assert len(rows) == 3

    cust1 = next(r for r in rows if r["unified_customer_key"] == "lifesupply:1")
    assert cust1["total_lifetime_spend"] == "125.0"
    assert cust1["total_lifetime_orders"] == "2"
    assert cust1["average_order_value"] == "62.5"
    assert cust1["first_order_date"] == "2025-01-01"
    assert cust1["last_order_date"] == "2025-06-01"

    cust2 = next(r for r in rows if r["unified_customer_key"] == "lifesupply:2")
    assert cust2["total_lifetime_orders"] == "0"
    assert cust2["recency_bucket"] == "never"

    guest = next(r for r in rows if "guest" in r["unified_customer_key"])
    assert guest["email"] == "guest@x.com"
    assert guest["total_lifetime_spend"] == "30.0"


@pytest.mark.asyncio
async def test_guest_email_matching_registered_is_skipped(tmp_path: Path) -> None:
    """If a guest order's billing email matches a registered customer's email,
    we don't emit a duplicate guest row — the registered customer's aggregate
    is the canonical record."""
    store = StoreConfig(slug="ls", label="LS", store_hash="h", access_token="t")
    csv_path = tmp_path / "out.csv"

    orders = [
        # Guest order whose email belongs to a registered customer
        {
            "id": 1, "customer_id": 0,
            "date_created": "2025-01-01T00:00:00+00:00",
            "total_inc_tax": "10",
            "billing_address": {"email": "alice@x.com"},
        },
    ]
    customers = {
        "data": [{"id": 1, "email": "ALICE@x.com"}],  # case-insensitive match
        "meta": {},
    }

    with respx.mock(assert_all_called=True) as mock:
        mock.get(f"{BC_BASE}/stores/h/v2/customer_groups").respond(200, json=[])
        mock.get(f"{BC_BASE}/stores/h/v2/orders?limit=250&page=1").respond(
            200, json=orders
        )
        mock.get(f"{BC_BASE}/stores/h/v3/customers?limit=250&page=1").respond(
            200, json=customers
        )
        # Phase 1.5: shipping fetched for guest's order (id=1) even though
        # phase 3 will skip the guest row due to email dedup.
        mock.get(
            f"{BC_BASE}/stores/h/v2/orders/1/shipping_addresses"
        ).respond(200, json=[])

        stats = await run_export(store, csv_path)

    assert stats.customers_emitted == 1
    assert stats.guests_emitted == 0  # deduped
    rows = list(csv.DictReader(csv_path.open(encoding="utf-8")))
    assert len(rows) == 1
    assert rows[0]["unified_customer_key"] == "ls:1"
