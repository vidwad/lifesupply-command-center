"""Group A (customer base fields) + Group H (store identity).

Both come from the same /v3/customers row, so we populate them together
in one function. Subsequent groups (B-G) UPDATE the row with extra fields.
"""
from __future__ import annotations

from typing import Any

from bc_enrichment.models import CustomerRow


def _str_or_none(v: object) -> str | None:
    """Coerce to string, treating empty string and missing as None."""
    if v is None:
        return None
    s = str(v).strip()
    return s or None


def _int_or_none(v: object) -> int | None:
    if v is None or v == "":
        return None
    if isinstance(v, bool):  # bool is a subclass of int — exclude it
        return None
    if isinstance(v, int):
        return v
    if isinstance(v, str):
        try:
            return int(v)
        except ValueError:
            return None
    return None


def from_customer_row(store_slug: str, raw: dict[str, Any]) -> CustomerRow:
    """Build a CustomerRow from a single /v3/customers result.

    Populates Group A (customer profile) + Group H (store identity).
    Other groups' fields stay at dataclass defaults.
    """
    cid = _int_or_none(raw.get("id")) or 0
    return CustomerRow(
        # Group H
        store=store_slug,
        store_customer_id=cid,
        unified_customer_key=f"{store_slug}:{cid}",
        # Group A
        customer_id=cid if cid > 0 else None,
        email=_str_or_none(raw.get("email")),
        first_name=_str_or_none(raw.get("first_name")),
        last_name=_str_or_none(raw.get("last_name")),
        company=_str_or_none(raw.get("company")),
        phone=_str_or_none(raw.get("phone")),
        customer_group_id=_int_or_none(raw.get("customer_group_id")),
        tax_exempt_category=_str_or_none(raw.get("tax_exempt_category")),
        registration_ip=_str_or_none(raw.get("registration_ip_address")),
        date_created=_str_or_none(raw.get("date_created")),
        date_modified=_str_or_none(raw.get("date_modified")),
    )
