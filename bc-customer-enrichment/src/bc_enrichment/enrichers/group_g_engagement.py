"""Group G: engagement signals from /v3/wishlists + /v3/carts.

Walks both endpoints (paginated, no per-customer filter) and groups by
customer_id. This is much cheaper than per-customer fetches: a store with
2000 wishlists is ~8 paginated calls, vs 10000 customer-id fetches.

Carts: every open cart is treated as 'abandoned' for the purposes of this
export — BC doesn't expose a separate 'abandoned' state, only 'open'.
Carts older than 24h that haven't been converted are conventionally what
ESPs treat as abandonment-candidate.

Output fields:
  wishlist_item_count, abandoned_cart_count, abandoned_cart_value_total
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

from bc_enrichment.client import BcClient
from bc_enrichment.models import CustomerRow

logger = logging.getLogger(__name__)


@dataclass
class _EngagementAggregate:
    wishlist_items: int = 0
    cart_count: int = 0
    cart_value_total: float = 0.0


class EngagementAggregator:
    def __init__(self) -> None:
        self.by_customer: dict[int, _EngagementAggregate] = {}

    def _slot(self, customer_id: int) -> _EngagementAggregate:
        return self.by_customer.setdefault(customer_id, _EngagementAggregate())


async def collect_engagement(
    client: BcClient,
) -> EngagementAggregator:
    """Walk /v3/wishlists and /v3/carts paginated, grouping by customer_id."""
    eng = EngagementAggregator()

    # ---- Wishlists ---- #
    try:
        async for batch in client.list_paginated_v3("/v3/wishlists"):
            for w in batch:
                cid = _to_int(w.get("customer_id"))
                if cid is None or cid <= 0:
                    continue
                items = w.get("items")
                count = len(items) if isinstance(items, list) else 0
                eng._slot(cid).wishlist_items += count
    except Exception as e:  # pragma: no cover (real-API only)
        logger.warning("wishlists walk failed: %s", e)

    # ---- Carts ---- #
    try:
        async for batch in client.list_paginated_v3("/v3/carts"):
            for c in batch:
                cid = _to_int(c.get("customer_id"))
                if cid is None or cid <= 0:
                    continue
                slot = eng._slot(cid)
                slot.cart_count += 1
                value_raw = c.get("cart_amount") or c.get("base_amount") or 0
                try:
                    slot.cart_value_total += float(value_raw)
                except (TypeError, ValueError):
                    pass
    except Exception as e:  # pragma: no cover (real-API only)
        logger.warning("carts walk failed: %s", e)

    return eng


def _to_int(v: object) -> int | None:
    if v is None or v == "":
        return None
    if isinstance(v, bool):
        return None
    if isinstance(v, int):
        return v
    if isinstance(v, str):
        try:
            return int(v)
        except ValueError:
            return None
    return None


def apply_g_to_row(row: CustomerRow, agg: _EngagementAggregate | None) -> None:
    if agg is None:
        return
    row.wishlist_item_count = agg.wishlist_items
    row.abandoned_cart_count = agg.cart_count
    row.abandoned_cart_value_total = round(agg.cart_value_total, 2)
