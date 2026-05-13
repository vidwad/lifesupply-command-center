"""Group E: refunds from /v2/orders/{id}/transactions.

Per the spec gotcha: 'partial refunds aren't on the order object — must
come from /v2/orders/{id}/transactions'. Each order has a list of
transactions; refund events are filtered by event=='refund'.

Aggregates per customer:
  refunded_order_count   — distinct orders with at least one refund
  refunded_amount_total  — sum of refund amounts (positive, in store currency)
  refund_rate            — refunded_order_count / total_lifetime_orders
  last_refund_date       — ISO date of most recent refund

Heavy: one API call per order. Gate behind --include-refunds.
"""
from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from bc_enrichment.client import BcClient
from bc_enrichment.dates import parse_bc_date
from bc_enrichment.enrichers.group_b_orders import OrderAggregator, _Aggregate
from bc_enrichment.models import CustomerRow

logger = logging.getLogger(__name__)


@dataclass
class _RefundAggregate:
    refunded_order_ids: set[int]
    refunded_amount: float = 0.0
    last_refund: datetime | None = None

    def __init__(self) -> None:
        self.refunded_order_ids = set()
        self.refunded_amount = 0.0
        self.last_refund = None


class RefundAggregator:
    def __init__(self) -> None:
        self.by_customer: dict[int, _RefundAggregate] = {}
        self.by_guest_email: dict[str, _RefundAggregate] = {}

    def ingest_for_customer(
        self, customer_id: int, order_id: int, txns: list[dict[str, Any]]
    ) -> None:
        agg = self.by_customer.setdefault(customer_id, _RefundAggregate())
        _ingest_txns(agg, order_id, txns)

    def ingest_for_guest(
        self, email: str, order_id: int, txns: list[dict[str, Any]]
    ) -> None:
        agg = self.by_guest_email.setdefault(email, _RefundAggregate())
        _ingest_txns(agg, order_id, txns)


def _ingest_txns(
    agg: _RefundAggregate, order_id: int, txns: list[dict[str, Any]]
) -> None:
    had_refund = False
    for t in txns:
        event = t.get("event")
        if event != "refund":
            continue
        had_refund = True
        amt_raw = t.get("amount", 0)
        try:
            amt = abs(float(amt_raw or 0))
        except (TypeError, ValueError):
            amt = 0.0
        agg.refunded_amount += amt
        date_raw = t.get("date_created")
        dt = parse_bc_date(date_raw) if isinstance(date_raw, str) else None
        if dt is not None and (agg.last_refund is None or dt > agg.last_refund):
            agg.last_refund = dt
    if had_refund:
        agg.refunded_order_ids.add(order_id)


async def fetch_and_aggregate_refunds(
    client: BcClient, aggregator: OrderAggregator
) -> RefundAggregator:
    """Fetch transactions for every tracked order_id; route refunds to the
    correct per-customer / per-guest aggregate."""
    refunds = RefundAggregator()

    async def fetch_one(order_id: int) -> None:
        try:
            result = await client.get(f"/v2/orders/{order_id}/transactions")
        except Exception as e:  # pragma: no cover (real-API only)
            logger.warning("transactions fetch failed for order %d: %s", order_id, e)
            return
        if not isinstance(result, list):
            return
        owner_customer = aggregator.order_to_customer_id.get(order_id)
        owner_guest = aggregator.order_to_guest_email.get(order_id)
        if owner_customer:
            refunds.ingest_for_customer(owner_customer, order_id, result)
        elif owner_guest:
            refunds.ingest_for_guest(owner_guest, order_id, result)

    all_order_ids = list(aggregator.order_to_customer_id.keys()) + list(
        aggregator.order_to_guest_email.keys()
    )
    if not all_order_ids:
        return refunds
    await asyncio.gather(*(fetch_one(oid) for oid in all_order_ids))
    return refunds


def apply_e_to_row(
    row: CustomerRow,
    refund_agg: _RefundAggregate | None,
    order_agg: _Aggregate | None,
) -> None:
    if refund_agg is None or not refund_agg.refunded_order_ids:
        return
    row.refunded_order_count = len(refund_agg.refunded_order_ids)
    row.refunded_amount_total = round(refund_agg.refunded_amount, 2)
    if order_agg is not None and order_agg.total_orders > 0:
        row.refund_rate = round(
            row.refunded_order_count / order_agg.total_orders, 4
        )
    if refund_agg.last_refund is not None:
        row.last_refund_date = refund_agg.last_refund.date().isoformat()
