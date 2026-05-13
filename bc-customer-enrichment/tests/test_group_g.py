"""Tests for Group G: engagement (wishlists + carts)."""
from __future__ import annotations

import pytest
import respx

from bc_enrichment.client import BC_BASE, BcClient
from bc_enrichment.enrichers.group_g_engagement import (
    EngagementAggregator,
    apply_g_to_row,
    collect_engagement,
)
from bc_enrichment.models import CustomerRow


def _row() -> CustomerRow:
    return CustomerRow(store="ls", store_customer_id=1, unified_customer_key="ls:1")


def test_apply_g_writes_engagement_fields() -> None:
    eng = EngagementAggregator()
    slot = eng._slot(7)
    slot.wishlist_items = 5
    slot.cart_count = 2
    slot.cart_value_total = 123.456

    row = _row()
    apply_g_to_row(row, eng.by_customer[7])
    assert row.wishlist_item_count == 5
    assert row.abandoned_cart_count == 2
    assert row.abandoned_cart_value_total == 123.46  # rounded


def test_apply_g_none_is_noop() -> None:
    row = _row()
    apply_g_to_row(row, None)
    assert row.wishlist_item_count == 0
    assert row.abandoned_cart_count == 0


@pytest.mark.asyncio
async def test_collect_engagement_groups_by_customer() -> None:
    async with BcClient("h", "tok") as client, respx.mock(
        assert_all_called=True
    ) as mock:
        mock.get(f"{BC_BASE}/stores/h/v3/wishlists?limit=250&page=1").respond(
            200,
            json={
                "data": [
                    {"customer_id": 1, "items": [{}, {}, {}]},
                    {"customer_id": 2, "items": [{}]},
                    {"customer_id": 1, "items": [{}, {}]},  # second wishlist for cust 1
                ],
                "meta": {},
            },
        )
        mock.get(f"{BC_BASE}/stores/h/v3/carts?limit=250&page=1").respond(
            200,
            json={
                "data": [
                    {"customer_id": 1, "cart_amount": 50.0},
                    {"customer_id": 3, "cart_amount": 99.99},
                ],
                "meta": {},
            },
        )

        eng = await collect_engagement(client)

    assert eng.by_customer[1].wishlist_items == 5  # 3 + 2
    assert eng.by_customer[1].cart_count == 1
    assert eng.by_customer[1].cart_value_total == 50.0
    assert eng.by_customer[2].wishlist_items == 1
    assert eng.by_customer[3].cart_count == 1
    assert eng.by_customer[3].cart_value_total == 99.99
