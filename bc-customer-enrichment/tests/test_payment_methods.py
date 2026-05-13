"""Test payment_methods_used capture (Group F follow-up)."""
from __future__ import annotations

from bc_enrichment.enrichers.group_b_orders import OrderAggregator
from bc_enrichment.enrichers.group_f_b2b import apply_f_to_row
from bc_enrichment.models import CustomerRow


def _row() -> CustomerRow:
    return CustomerRow(store="ls", store_customer_id=1, unified_customer_key="ls:1")


def test_aggregator_collects_payment_methods_per_customer() -> None:
    agg = OrderAggregator()
    agg.ingest({
        "id": 1, "customer_id": 7,
        "date_created": "2025-01-01T00:00:00+00:00",
        "total_inc_tax": "10",
        "payment_method": "Credit Card",
    })
    agg.ingest({
        "id": 2, "customer_id": 7,
        "date_created": "2025-02-01T00:00:00+00:00",
        "total_inc_tax": "20",
        "payment_method": "Bank Transfer",
    })
    agg.ingest({
        "id": 3, "customer_id": 7,
        "date_created": "2025-03-01T00:00:00+00:00",
        "total_inc_tax": "30",
        "payment_method": "Credit Card",  # dedup
    })
    assert agg.by_customer[7].payment_methods == {"Credit Card", "Bank Transfer"}


def test_aggregator_collects_payment_methods_for_guests() -> None:
    agg = OrderAggregator()
    agg.ingest({
        "id": 10, "customer_id": 0,
        "date_created": "2025-01-01T00:00:00+00:00",
        "total_inc_tax": "10",
        "payment_method": "PayPal",
        "billing_address": {"email": "g@x.com"},
    })
    assert agg.by_guest_email["g@x.com"].payment_methods == {"PayPal"}


def test_apply_f_writes_pipe_delimited_payment_methods() -> None:
    agg = OrderAggregator()
    agg.ingest({"id": 1, "customer_id": 7, "date_created": "2025-01-01T00:00:00+00:00",
                "total_inc_tax": "10", "payment_method": "Stripe"})
    agg.ingest({"id": 2, "customer_id": 7, "date_created": "2025-02-01T00:00:00+00:00",
                "total_inc_tax": "20", "payment_method": "Bank Transfer"})

    row = _row()
    apply_f_to_row(row, agg.by_customer[7])
    # Sorted alphabetically for stability
    assert row.payment_methods_used == "Bank Transfer|Stripe"


def test_apply_f_handles_empty_payment_methods() -> None:
    agg = OrderAggregator()
    agg.ingest({"id": 1, "customer_id": 7, "date_created": "2025-01-01T00:00:00+00:00",
                "total_inc_tax": "10"})  # no payment_method field

    row = _row()
    apply_f_to_row(row, agg.by_customer[7])
    assert row.payment_methods_used == ""


def test_apply_f_skips_blank_payment_method_strings() -> None:
    agg = OrderAggregator()
    agg.ingest({"id": 1, "customer_id": 7, "date_created": "2025-01-01T00:00:00+00:00",
                "total_inc_tax": "10", "payment_method": "  "})

    row = _row()
    apply_f_to_row(row, agg.by_customer[7])
    assert row.payment_methods_used == ""
