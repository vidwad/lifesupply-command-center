"""Group D: product mix from /v2/orders/{id}/products.

Walks the products endpoint for every order and aggregates per customer:
  distinct_skus_purchased  — unique SKUs across all of the customer's orders
  total_units_purchased    — sum of line-item quantities
  has_subscription_skus    — True if any SKU is in the configured subscription set
  categories_purchased     — pipe-delimited category NAMES (top 10 by frequency)
  top_category             — most-frequently-occurring category NAME

Category resolution flow (because BC's /v2/orders/{id}/products line items
do NOT include category IDs):
  1. Capture product_id per customer during Group D ingest.
  2. Fetch /v3/catalog/products?id:in=... in batches → product_id → category_ids[]
  3. Walk /v3/catalog/categories paginated → category_id → name
  4. apply_d_to_row joins (product_ids per customer) → categories → names

Heavy: one /v2/orders/{id}/products call per order PLUS catalog fetches.
Gate behind --include-products.
"""
from __future__ import annotations

import asyncio
import logging
from collections import Counter
from dataclasses import dataclass, field
from typing import Any

from bc_enrichment.client import BcClient
from bc_enrichment.enrichers.group_b_orders import OrderAggregator
from bc_enrichment.models import CustomerRow

logger = logging.getLogger(__name__)

CATALOG_BATCH_SIZE = 50  # max product_ids per /v3/catalog/products?id:in=... call


@dataclass
class _ProductAggregate:
    sku_set: set[str] = field(default_factory=set)
    units_total: int = 0
    has_subscription: bool = False
    product_ids: set[int] = field(default_factory=set)  # for category resolution


class ProductAggregator:
    def __init__(self) -> None:
        self.by_customer: dict[int, _ProductAggregate] = {}
        self.by_guest_email: dict[str, _ProductAggregate] = {}

    def all_product_ids(self) -> set[int]:
        out: set[int] = set()
        for a in self.by_customer.values():
            out |= a.product_ids
        for a in self.by_guest_email.values():
            out |= a.product_ids
        return out

    def ingest_for_customer(
        self,
        customer_id: int,
        products: list[dict[str, Any]],
        subscription_skus: set[str],
    ) -> None:
        agg = self.by_customer.setdefault(customer_id, _ProductAggregate())
        _ingest_products(agg, products, subscription_skus)

    def ingest_for_guest(
        self,
        email: str,
        products: list[dict[str, Any]],
        subscription_skus: set[str],
    ) -> None:
        agg = self.by_guest_email.setdefault(email, _ProductAggregate())
        _ingest_products(agg, products, subscription_skus)


def _ingest_products(
    agg: _ProductAggregate,
    products: list[dict[str, Any]],
    subscription_skus: set[str],
) -> None:
    for p in products:
        sku_raw = p.get("sku")
        if isinstance(sku_raw, str):
            sku = sku_raw.strip()
            if sku:
                agg.sku_set.add(sku)
                if sku in subscription_skus:
                    agg.has_subscription = True
        qty_raw = p.get("quantity", 0)
        try:
            agg.units_total += int(qty_raw or 0)
        except (TypeError, ValueError):
            pass
        pid = p.get("product_id")
        if isinstance(pid, int) and pid > 0:
            agg.product_ids.add(pid)


async def fetch_and_aggregate_products(
    client: BcClient,
    aggregator: OrderAggregator,
    subscription_skus: set[str],
) -> ProductAggregator:
    """For every tracked order_id, fetch its products and route them to the
    right per-customer / per-guest ProductAggregate."""
    products = ProductAggregator()

    async def fetch_one(order_id: int) -> None:
        try:
            result = await client.get(f"/v2/orders/{order_id}/products")
        except Exception as e:  # pragma: no cover (real-API only)
            logger.warning("products fetch failed for order %d: %s", order_id, e)
            return
        if not isinstance(result, list):
            return
        owner_customer = aggregator.order_to_customer_id.get(order_id)
        owner_guest = aggregator.order_to_guest_email.get(order_id)
        if owner_customer:
            products.ingest_for_customer(owner_customer, result, subscription_skus)
        elif owner_guest:
            products.ingest_for_guest(owner_guest, result, subscription_skus)

    all_order_ids = list(aggregator.order_to_customer_id.keys()) + list(
        aggregator.order_to_guest_email.keys()
    )
    if not all_order_ids:
        return products
    await asyncio.gather(*(fetch_one(oid) for oid in all_order_ids))
    return products


async def fetch_category_lookup(client: BcClient) -> dict[int, str]:
    """Walk /v3/catalog/categories paginated → id → name map."""
    out: dict[int, str] = {}
    try:
        async for batch in client.list_paginated_v3("/v3/catalog/categories"):
            for c in batch:
                cid = c.get("id")
                name = c.get("name")
                if (
                    isinstance(cid, int)
                    and isinstance(name, str)
                    and name.strip()
                ):
                    out[cid] = name.strip()
    except Exception as e:  # pragma: no cover (real-API only)
        logger.warning("catalog/categories walk failed: %s", e)
    return out


async def fetch_product_categories(
    client: BcClient, product_ids: set[int]
) -> dict[int, list[int]]:
    """Fetch /v3/catalog/products?id:in=... in batches → product_id → category_ids[]."""
    out: dict[int, list[int]] = {}
    if not product_ids:
        return out

    sorted_ids = sorted(product_ids)
    chunks = [
        sorted_ids[i : i + CATALOG_BATCH_SIZE]
        for i in range(0, len(sorted_ids), CATALOG_BATCH_SIZE)
    ]

    async def fetch_chunk(chunk: list[int]) -> None:
        ids_str = ",".join(str(x) for x in chunk)
        try:
            result = await client.get(
                f"/v3/catalog/products?id:in={ids_str}&limit={CATALOG_BATCH_SIZE}"
                "&include_fields=categories"
            )
        except Exception as e:  # pragma: no cover (real-API only)
            logger.warning("catalog/products batch fetch failed: %s", e)
            return
        if not isinstance(result, dict):
            return
        data = result.get("data")
        if not isinstance(data, list):
            return
        for p in data:
            if not isinstance(p, dict):
                continue
            pid = p.get("id")
            cats = p.get("categories")
            if isinstance(pid, int) and isinstance(cats, list):
                out[pid] = [c for c in cats if isinstance(c, int)]

    await asyncio.gather(*(fetch_chunk(c) for c in chunks))
    return out


def apply_d_to_row(
    row: CustomerRow,
    agg: _ProductAggregate | None,
    *,
    product_categories: dict[int, list[int]] | None = None,
    category_names: dict[int, str] | None = None,
) -> None:
    """Layer Group D fields onto an existing row.

    When `product_categories` and `category_names` maps are provided, the
    customer's category mix is computed by joining their product_ids set
    against the catalog. Without those maps, top_category /
    categories_purchased stay at defaults.
    """
    if agg is None:
        return
    row.distinct_skus_purchased = len(agg.sku_set)
    row.total_units_purchased = agg.units_total
    row.has_subscription_skus = agg.has_subscription

    if product_categories is None or not agg.product_ids:
        return

    per_customer_cats: Counter[int] = Counter()
    for pid in agg.product_ids:
        for cat_id in product_categories.get(pid, []):
            per_customer_cats[cat_id] += 1
    if not per_customer_cats:
        return
    top_ids = [c for c, _ in per_customer_cats.most_common(10)]
    if category_names:
        names = [category_names.get(c) or str(c) for c in top_ids]
    else:
        names = [str(c) for c in top_ids]
    row.categories_purchased = "|".join(names)
    row.top_category = names[0]


def load_subscription_skus(path: str | None) -> set[str]:
    """Load a SKU list from a text file (one per line; blank lines + lines
    starting with # are ignored). Returns empty set when path is None."""
    if not path:
        return set()
    from pathlib import Path
    p = Path(path)
    if not p.exists():
        logger.warning("subscription SKU file not found: %s", path)
        return set()
    out: set[str] = set()
    for line in p.read_text(encoding="utf-8").splitlines():
        s = line.strip()
        if s and not s.startswith("#"):
            out.add(s)
    return out
