"""Group F: B2B block.

Derived from data we already have (Group A customer fields + Group B
order aggregates) — no extra API calls. Fields:
  - is_b2b: True if company is set OR customer_group_id is in the B2B set
  - tax_exempt: True if tax_exempt_category is non-empty
  - largest_single_order: max(order total) across the customer's orders
  - payment_methods_used: requires per-order payment_method (not currently
    captured by the order walk). Left at default until we extend the
    aggregator to record it. Worth doing once we confirm BC's payment_method
    field on /v2/orders.

B2B_GROUP_IDS defaults to {4, 8} per the spec hint that LifeSupply's groups
4 and 8 may correspond to wholesale / institutional tiers. Confirm against
the run_summary.json customer-groups dump and adjust as needed.
"""
from __future__ import annotations

from bc_enrichment.enrichers.group_b_orders import _Aggregate
from bc_enrichment.models import CustomerRow

B2B_GROUP_IDS: set[int] = {4, 8}


def apply_f_to_row(row: CustomerRow, agg: _Aggregate | None) -> None:
    has_company = bool(row.company)
    in_b2b_group = (
        row.customer_group_id is not None
        and row.customer_group_id in B2B_GROUP_IDS
    )
    row.is_b2b = has_company or in_b2b_group
    row.tax_exempt = bool(row.tax_exempt_category)
    if agg is not None:
        if agg.largest_order > 0:
            row.largest_single_order = round(agg.largest_order, 2)
        if agg.payment_methods:
            row.payment_methods_used = "|".join(sorted(agg.payment_methods))
