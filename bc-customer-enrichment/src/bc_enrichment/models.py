"""The output row + run-stats data model.

CustomerRow holds every column the enriched export emits. Each Group A-H
enricher fills its own slice; defaults represent the "this group hasn't
run yet / this customer has none" state. CSV column order follows the
field declaration order — keep that intentional.
"""
from __future__ import annotations

from dataclasses import dataclass, field, fields
from typing import Any


@dataclass
class CustomerRow:
    # ----- Group H: store identification (set first, always populated) -----
    store: str
    store_customer_id: int  # 0 for guest customers identified by email only
    unified_customer_key: str

    # ----- Group A: from /v3/customers (None for guests) -----
    customer_id: int | None = None
    email: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    company: str | None = None
    phone: str | None = None
    customer_group_id: int | None = None
    tax_exempt_category: str | None = None
    registration_ip: str | None = None
    date_created: str | None = None
    date_modified: str | None = None

    # ----- Group B: from order walk -----
    total_lifetime_spend: float = 0.0
    total_lifetime_orders: int = 0
    average_order_value: float = 0.0
    first_order_date: str | None = None
    last_order_date: str | None = None
    days_since_last_order: int | None = None
    customer_lifespan_days: int = 0
    order_frequency_days: float | None = None
    recency_bucket: str = "never"  # 0-30 | 31-90 | 91-180 | 181-365 | 365+ | never
    funnel_gap_days: int | None = None  # first_order_date - date_created

    # ----- Group C: geography from most recent order's shipping address -----
    ship_city: str | None = None
    ship_state: str | None = None
    ship_country: str | None = None
    ship_postal_code_full: str | None = None
    ship_postal_code_prefix: str | None = None  # first 3 chars (Canadian FSA)
    geoip_country_code: str | None = None

    # ----- Group D: product mix from /v2/orders/{id}/products -----
    top_category: str | None = None
    categories_purchased: str = ""  # pipe-delimited
    distinct_skus_purchased: int = 0
    total_units_purchased: int = 0
    has_subscription_skus: bool = False

    # ----- Group E: refunds from /v2/orders/{id}/transactions -----
    refunded_order_count: int = 0
    refunded_amount_total: float = 0.0
    refund_rate: float = 0.0
    last_refund_date: str | None = None

    # ----- Group F: B2B block -----
    is_b2b: bool = False
    tax_exempt: bool = False
    payment_methods_used: str = ""  # pipe-delimited
    largest_single_order: float = 0.0

    # ----- Group G: engagement -----
    wishlist_item_count: int = 0
    abandoned_cart_count: int = 0
    abandoned_cart_value_total: float = 0.0


def csv_columns() -> list[str]:
    """Output column order = dataclass field order. Single source of truth."""
    return [f.name for f in fields(CustomerRow)]


@dataclass
class RunStats:
    store: str
    customers_emitted: int = 0
    guests_emitted: int = 0
    orders_scanned: int = 0
    api_requests: int = 0
    rate_limit_sleeps: int = 0
    rate_limit_sleep_ms_total: int = 0
    retries_after_429: int = 0
    cache_hits: int = 0
    errored_paths: list[str] = field(default_factory=list)
    customer_groups: list[dict[str, Any]] = field(default_factory=list)
    duration_ms: int = 0

    def to_summary(self) -> dict[str, Any]:
        return {
            "store": self.store,
            "customers_emitted": self.customers_emitted,
            "guests_emitted": self.guests_emitted,
            "orders_scanned": self.orders_scanned,
            "api_requests": self.api_requests,
            "rate_limit_sleeps": self.rate_limit_sleeps,
            "rate_limit_sleep_ms_total": self.rate_limit_sleep_ms_total,
            "retries_after_429": self.retries_after_429,
            "cache_hits": self.cache_hits,
            "errored_paths": self.errored_paths,
            "customer_groups": self.customer_groups,
            "duration_ms": self.duration_ms,
        }
