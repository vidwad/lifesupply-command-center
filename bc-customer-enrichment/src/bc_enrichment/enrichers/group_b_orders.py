"""Group B: per-customer order aggregates from /v2/orders.

Walks ALL orders for the store ONCE and accumulates two maps:
  - by_customer[customer_id]    → registered customer aggregates
  - by_guest_email[lower email] → guest-checkout aggregates (customer_id=0)

Per-customer aggregates are slim (~80 bytes each) so even 100k+ unique
customers stay well under the 512MB worker budget. The runner walks
orders ascending so first/last dates accumulate naturally.

Output fields populated by this group:
  total_lifetime_spend, total_lifetime_orders, average_order_value,
  first_order_date, last_order_date, days_since_last_order,
  customer_lifespan_days, order_frequency_days, recency_bucket,
  funnel_gap_days
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Any

from bc_enrichment.dates import parse_bc_date, recency_bucket
from bc_enrichment.models import CustomerRow


@dataclass
class _Aggregate:
    total_orders: int = 0
    total_spend: float = 0.0
    first_order: datetime | None = None
    last_order: datetime | None = None
    last_order_id: int = 0  # used by Group C to look up most-recent shipping
    largest_order: float = 0.0  # used by Group F
    order_ids: list[int] = field(default_factory=list)  # used by Group D/E walks
    payment_methods: set[str] = field(default_factory=set)  # used by Group F


@dataclass
class _GuestAggregate(_Aggregate):
    email: str = ""
    first_name: str | None = None
    last_name: str | None = None
    company: str | None = None
    phone: str | None = None


class OrderAggregator:
    """Accumulates per-customer + per-guest order aggregates from a stream
    of /v2/orders results. ingest() is idempotent against duplicates by
    (order_id) only via the underlying min/max/sum logic — BC pagination
    shouldn't yield duplicates, but if it did we'd over-count. Acceptable
    for Group B; address if it becomes a real concern."""

    def __init__(self) -> None:
        self.by_customer: dict[int, _Aggregate] = {}
        self.by_guest_email: dict[str, _GuestAggregate] = {}
        self.guest_orders_seen: int = 0
        # Reverse lookups for Group D/E: which owner does an order_id belong to?
        self.order_to_customer_id: dict[int, int] = {}
        self.order_to_guest_email: dict[int, str] = {}

    def ingest(self, order: dict[str, Any]) -> None:
        try:
            customer_id = int(order.get("customer_id", 0) or 0)
        except (TypeError, ValueError):
            customer_id = 0
        try:
            order_id = int(order.get("id", 0) or 0)
        except (TypeError, ValueError):
            order_id = 0
        date_raw = order.get("date_created")
        order_date = parse_bc_date(date_raw) if isinstance(date_raw, str) else None
        try:
            total = float(order.get("total_inc_tax", 0) or 0)
        except (TypeError, ValueError):
            total = 0.0

        payment_method = order.get("payment_method")
        pm_clean: str | None = (
            payment_method.strip()
            if isinstance(payment_method, str) and payment_method.strip()
            else None
        )

        if customer_id > 0:
            agg = self.by_customer.setdefault(customer_id, _Aggregate())
            self._update(agg, order_id, order_date, total)
            if pm_clean:
                agg.payment_methods.add(pm_clean)
            if order_id:
                self.order_to_customer_id[order_id] = customer_id
            return

        billing = order.get("billing_address")
        if not isinstance(billing, dict):
            return
        email_raw = billing.get("email")
        if not isinstance(email_raw, str):
            return
        email = email_raw.strip().lower()
        if not email:
            return

        self.guest_orders_seen += 1
        gagg = self.by_guest_email.setdefault(email, _GuestAggregate(email=email))
        was_most_recent = order_date is not None and (
            gagg.last_order is None or order_date >= gagg.last_order
        )
        self._update(gagg, order_id, order_date, total)
        if pm_clean:
            gagg.payment_methods.add(pm_clean)
        if order_id:
            self.order_to_guest_email[order_id] = email
        if was_most_recent:
            for src, dst in (
                ("first_name", "first_name"),
                ("last_name", "last_name"),
                ("company", "company"),
                ("phone", "phone"),
            ):
                v = billing.get(src)
                if isinstance(v, str) and v.strip():
                    setattr(gagg, dst, v.strip())

    @staticmethod
    def _update(
        agg: _Aggregate,
        order_id: int,
        order_date: datetime | None,
        total: float,
    ) -> None:
        agg.total_orders += 1
        agg.total_spend += total
        if total > agg.largest_order:
            agg.largest_order = total
        if order_id:
            agg.order_ids.append(order_id)
        if order_date is None:
            return
        if agg.first_order is None or order_date < agg.first_order:
            agg.first_order = order_date
        if agg.last_order is None or order_date >= agg.last_order:
            agg.last_order = order_date
            agg.last_order_id = order_id


def apply_b_to_row(
    row: CustomerRow,
    agg: _Aggregate | None,
    today: date,
) -> None:
    """Layer Group B fields onto an existing row in place. No-op when the
    customer has no orders (row keeps its 'never' / 0 defaults)."""
    if agg is None or agg.total_orders == 0:
        return
    row.total_lifetime_spend = round(agg.total_spend, 2)
    row.total_lifetime_orders = agg.total_orders
    row.average_order_value = round(agg.total_spend / agg.total_orders, 2)

    if agg.first_order is not None:
        row.first_order_date = agg.first_order.date().isoformat()
    if agg.last_order is not None:
        row.last_order_date = agg.last_order.date().isoformat()
        days_since = (today - agg.last_order.date()).days
        row.days_since_last_order = max(days_since, 0)
        row.recency_bucket = recency_bucket(row.days_since_last_order)
    if agg.first_order is not None and agg.last_order is not None:
        lifespan = (agg.last_order.date() - agg.first_order.date()).days
        row.customer_lifespan_days = max(lifespan, 0)
        if agg.total_orders > 1 and lifespan > 0:
            row.order_frequency_days = round(
                lifespan / (agg.total_orders - 1), 1
            )
    if (
        row.date_created
        and agg.first_order is not None
    ):
        registered = parse_bc_date(row.date_created)
        if registered is not None:
            row.funnel_gap_days = (
                agg.first_order.date() - registered.date()
            ).days


def build_guest_row(
    store_slug: str, gagg: _GuestAggregate, today: date
) -> CustomerRow:
    """Build a CustomerRow for an unregistered guest checkout. Group A
    fields stay None (no /v3/customers row for guests)."""
    row = CustomerRow(
        store=store_slug,
        store_customer_id=0,
        unified_customer_key=f"{store_slug}:guest:{gagg.email}",
        customer_id=None,
        email=gagg.email,
        first_name=gagg.first_name,
        last_name=gagg.last_name,
        company=gagg.company,
        phone=gagg.phone,
    )
    apply_b_to_row(row, gagg, today)
    return row
