"""Tests for Group E: refunds from /v2/orders/{id}/transactions."""
from __future__ import annotations

import pytest
import respx

from bc_enrichment.client import BC_BASE, BcClient
from bc_enrichment.enrichers.group_b_orders import OrderAggregator
from bc_enrichment.enrichers.group_e_refunds import (
    RefundAggregator,
    apply_e_to_row,
    fetch_and_aggregate_refunds,
)
from bc_enrichment.models import CustomerRow


def _row() -> CustomerRow:
    return CustomerRow(store="ls", store_customer_id=1, unified_customer_key="ls:1")


def test_refund_aggregator_skips_non_refund_events() -> None:
    ra = RefundAggregator()
    ra.ingest_for_customer(7, 100, [
        {"event": "sale", "amount": 100, "date_created": "2025-01-01T00:00:00+00:00"},
        {"event": "void", "amount": -50, "date_created": "2025-01-02T00:00:00+00:00"},
    ])
    # No refunds → no aggregate update
    assert 7 not in ra.by_customer or not ra.by_customer[7].refunded_order_ids


def test_refund_aggregator_sums_refund_amounts() -> None:
    ra = RefundAggregator()
    ra.ingest_for_customer(7, 100, [
        {"event": "refund", "amount": -25, "date_created": "2025-02-01T00:00:00+00:00"},
        {"event": "refund", "amount": -10, "date_created": "2025-03-15T00:00:00+00:00"},
    ])
    ra.ingest_for_customer(7, 200, [
        {"event": "refund", "amount": -50, "date_created": "2025-04-01T00:00:00+00:00"},
    ])
    agg = ra.by_customer[7]
    assert agg.refunded_order_ids == {100, 200}
    assert agg.refunded_amount == 85.0
    assert agg.last_refund is not None
    assert agg.last_refund.date().isoformat() == "2025-04-01"


def test_apply_e_computes_refund_rate_against_total_orders() -> None:
    order_agg = OrderAggregator()
    for i, oid in enumerate((1, 2, 3, 4), start=1):
        order_agg.ingest({
            "id": oid, "customer_id": 7,
            "date_created": f"2025-0{i}-01T00:00:00+00:00",
            "total_inc_tax": "100",
        })

    ra = RefundAggregator()
    ra.ingest_for_customer(7, 1, [
        {"event": "refund", "amount": -100, "date_created": "2025-02-01T00:00:00+00:00"},
    ])

    row = _row()
    apply_e_to_row(row, ra.by_customer[7], order_agg.by_customer[7])
    assert row.refunded_order_count == 1
    assert row.refunded_amount_total == 100.0
    assert row.refund_rate == 0.25  # 1 of 4 orders refunded


def test_apply_e_with_no_refunds_keeps_defaults() -> None:
    row = _row()
    apply_e_to_row(row, None, None)
    assert row.refunded_order_count == 0
    assert row.refunded_amount_total == 0.0
    assert row.last_refund_date is None


@pytest.mark.asyncio
async def test_fetch_and_aggregate_refunds_routes_by_owner() -> None:
    aggregator = OrderAggregator()
    aggregator.ingest({
        "id": 1, "customer_id": 7,
        "date_created": "2025-01-01T00:00:00+00:00", "total_inc_tax": "10",
    })

    async with BcClient("h", "tok") as client, respx.mock(
        assert_all_called=True
    ) as mock:
        mock.get(f"{BC_BASE}/stores/h/v2/orders/1/transactions").respond(
            200, json=[
                {"event": "sale", "amount": 10, "date_created": "2025-01-01T00:00:00+00:00"},
                {"event": "refund", "amount": -5, "date_created": "2025-02-01T00:00:00+00:00"},
            ],
        )

        result = await fetch_and_aggregate_refunds(client, aggregator)

    agg = result.by_customer[7]
    assert agg.refunded_order_ids == {1}
    assert agg.refunded_amount == 5.0
