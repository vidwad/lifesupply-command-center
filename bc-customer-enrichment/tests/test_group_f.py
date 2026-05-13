"""Tests for Group F: B2B detection + largest_single_order."""
from __future__ import annotations

from bc_enrichment.enrichers.group_b_orders import OrderAggregator
from bc_enrichment.enrichers.group_f_b2b import apply_f_to_row
from bc_enrichment.models import CustomerRow


def _row_with(**kwargs: object) -> CustomerRow:
    base = {"store": "ls", "store_customer_id": 1, "unified_customer_key": "ls:1"}
    base.update(kwargs)
    return CustomerRow(**base)  # type: ignore[arg-type]


def test_is_b2b_true_when_company_present() -> None:
    row = _row_with(company="Acme Corp")
    apply_f_to_row(row, None)
    assert row.is_b2b is True


def test_is_b2b_true_when_in_b2b_customer_group() -> None:
    row = _row_with(customer_group_id=4)
    apply_f_to_row(row, None)
    assert row.is_b2b is True


def test_is_b2b_false_for_consumer() -> None:
    row = _row_with(customer_group_id=1)
    apply_f_to_row(row, None)
    assert row.is_b2b is False


def test_tax_exempt_reflects_category() -> None:
    row = _row_with(tax_exempt_category="non-profit")
    apply_f_to_row(row, None)
    assert row.tax_exempt is True

    row2 = _row_with(tax_exempt_category=None)
    apply_f_to_row(row2, None)
    assert row2.tax_exempt is False


def test_largest_single_order_from_aggregator() -> None:
    agg = OrderAggregator()
    agg.ingest({"id": 1, "customer_id": 7, "date_created": "2025-01-01T00:00:00+00:00", "total_inc_tax": "100"})
    agg.ingest({"id": 2, "customer_id": 7, "date_created": "2025-02-01T00:00:00+00:00", "total_inc_tax": "350.50"})
    agg.ingest({"id": 3, "customer_id": 7, "date_created": "2025-03-01T00:00:00+00:00", "total_inc_tax": "75"})

    row = _row_with()
    apply_f_to_row(row, agg.by_customer[7])
    assert row.largest_single_order == 350.5


def test_largest_single_order_zero_when_no_orders() -> None:
    row = _row_with()
    apply_f_to_row(row, None)
    assert row.largest_single_order == 0.0
