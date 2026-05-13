"""Tests for Group D: product mix."""
from __future__ import annotations

from pathlib import Path

import pytest
import respx

from bc_enrichment.client import BC_BASE, BcClient
from bc_enrichment.enrichers.group_b_orders import OrderAggregator
from bc_enrichment.enrichers.group_d_products import (
    ProductAggregator,
    apply_d_to_row,
    fetch_and_aggregate_products,
    fetch_category_lookup,
    fetch_product_categories,
    load_subscription_skus,
)
from bc_enrichment.models import CustomerRow


def _row() -> CustomerRow:
    return CustomerRow(store="ls", store_customer_id=1, unified_customer_key="ls:1")


def test_product_aggregator_collects_skus_units_and_product_ids() -> None:
    pa = ProductAggregator()
    pa.ingest_for_customer(
        7,
        [
            {"sku": "A-1", "quantity": 2, "product_id": 100},
            {"sku": "B-1", "quantity": 5, "product_id": 200},
            {"sku": "A-1", "quantity": 1, "product_id": 100},  # dedup
        ],
        subscription_skus=set(),
    )
    agg = pa.by_customer[7]
    assert agg.sku_set == {"A-1", "B-1"}
    assert agg.units_total == 8
    assert agg.product_ids == {100, 200}
    assert agg.has_subscription is False


def test_subscription_flag_fires_on_known_sku() -> None:
    pa = ProductAggregator()
    pa.ingest_for_customer(
        1,
        [{"sku": "SUB-MONTHLY", "quantity": 1}],
        subscription_skus={"SUB-MONTHLY", "SUB-ANNUAL"},
    )
    assert pa.by_customer[1].has_subscription is True


def test_apply_d_resolves_categories_to_names_via_lookup_maps() -> None:
    pa = ProductAggregator()
    pa.ingest_for_customer(
        1,
        [
            {"sku": "X", "quantity": 1, "product_id": 100},
            {"sku": "Y", "quantity": 1, "product_id": 200},
            {"sku": "Z", "quantity": 1, "product_id": 300},
        ],
        subscription_skus=set(),
    )
    # Catalog maps: products → category IDs, IDs → names.
    # Category 5 ("Mobility") appears 3 times across the 3 products → top.
    product_categories: dict[int, list[int]] = {
        100: [99, 5],
        200: [5],
        300: [5, 7],
    }
    category_names = {5: "Mobility", 7: "PPE", 99: "Wound Care"}

    row = _row()
    apply_d_to_row(
        row, pa.by_customer[1],
        product_categories=product_categories,
        category_names=category_names,
    )
    assert row.distinct_skus_purchased == 3
    assert row.total_units_purchased == 3
    assert row.top_category == "Mobility"
    assert "Mobility" in row.categories_purchased
    assert "|" in row.categories_purchased


def test_apply_d_falls_back_to_category_id_when_name_missing() -> None:
    pa = ProductAggregator()
    pa.ingest_for_customer(1, [{"sku": "X", "product_id": 100}], subscription_skus=set())

    row = _row()
    apply_d_to_row(
        row, pa.by_customer[1],
        product_categories={100: [42]},
        category_names={},  # no name for cat 42
    )
    assert row.top_category == "42"


def test_apply_d_without_catalog_maps_skips_categories() -> None:
    pa = ProductAggregator()
    pa.ingest_for_customer(1, [{"sku": "X", "product_id": 100}], subscription_skus=set())

    row = _row()
    apply_d_to_row(row, pa.by_customer[1])
    assert row.distinct_skus_purchased == 1
    assert row.top_category is None  # no catalog → no resolution
    assert row.categories_purchased == ""


def test_apply_d_with_none_is_noop() -> None:
    row = _row()
    apply_d_to_row(row, None)
    assert row.distinct_skus_purchased == 0
    assert row.top_category is None


@pytest.mark.asyncio
async def test_fetch_and_aggregate_products_routes_by_owner() -> None:
    aggregator = OrderAggregator()
    aggregator.ingest({
        "id": 1, "customer_id": 7,
        "date_created": "2025-01-01T00:00:00+00:00", "total_inc_tax": "10",
    })
    aggregator.ingest({
        "id": 2, "customer_id": 0,
        "date_created": "2025-01-01T00:00:00+00:00", "total_inc_tax": "10",
        "billing_address": {"email": "g@x.com"},
    })

    async with BcClient("h", "tok") as client, respx.mock(
        assert_all_called=True
    ) as mock:
        mock.get(f"{BC_BASE}/stores/h/v2/orders/1/products").respond(
            200, json=[{"sku": "A", "quantity": 2, "categories": [1]}]
        )
        mock.get(f"{BC_BASE}/stores/h/v2/orders/2/products").respond(
            200, json=[{"sku": "B", "quantity": 3}]
        )

        result = await fetch_and_aggregate_products(
            client, aggregator, subscription_skus=set()
        )

    assert result.by_customer[7].sku_set == {"A"}
    assert result.by_customer[7].units_total == 2
    assert result.by_guest_email["g@x.com"].sku_set == {"B"}
    assert result.by_guest_email["g@x.com"].units_total == 3


def test_load_subscription_skus_skips_blank_and_comments(tmp_path: Path) -> None:
    f = tmp_path / "subs.txt"
    f.write_text("# header\nSUB-1\n\nSUB-2\n  # indented\nSUB-3\n", encoding="utf-8")
    assert load_subscription_skus(str(f)) == {"SUB-1", "SUB-2", "SUB-3"}


def test_load_subscription_skus_returns_empty_when_no_path() -> None:
    assert load_subscription_skus(None) == set()
    assert load_subscription_skus("") == set()


@pytest.mark.asyncio
async def test_fetch_category_lookup_walks_paginated_endpoint() -> None:
    async with BcClient("h", "tok") as client, respx.mock(
        assert_all_called=True
    ) as mock:
        mock.get(
            f"{BC_BASE}/stores/h/v3/catalog/categories?limit=250&page=1"
        ).respond(
            200,
            json={
                "data": [
                    {"id": 1, "name": "Mobility"},
                    {"id": 2, "name": "PPE"},
                ],
                "meta": {},
            },
        )

        result = await fetch_category_lookup(client)

    assert result == {1: "Mobility", 2: "PPE"}


@pytest.mark.asyncio
async def test_fetch_product_categories_batches_id_in_calls() -> None:
    async with BcClient("h", "tok") as client, respx.mock(
        assert_all_called=True
    ) as mock:
        # Single batch with 3 product IDs.
        mock.get(
            f"{BC_BASE}/stores/h/v3/catalog/products?id:in=100,200,300"
            "&limit=50&include_fields=categories"
        ).respond(
            200,
            json={
                "data": [
                    {"id": 100, "categories": [1, 2]},
                    {"id": 200, "categories": [1]},
                    {"id": 300, "categories": [3]},
                ],
                "meta": {},
            },
        )

        result = await fetch_product_categories(client, {100, 200, 300})

    assert result[100] == [1, 2]
    assert result[200] == [1]
    assert result[300] == [3]


@pytest.mark.asyncio
async def test_fetch_product_categories_returns_empty_for_empty_input() -> None:
    async with BcClient("h", "tok") as client:
        result = await fetch_product_categories(client, set())
    assert result == {}
