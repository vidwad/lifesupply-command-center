"""Tests for Group C: geography from most recent shipping address."""
from __future__ import annotations

import pytest
import respx

from bc_enrichment.client import BC_BASE, BcClient
from bc_enrichment.enrichers.group_c_geography import (
    apply_c_to_row,
    fetch_shipping_for_orders,
)
from bc_enrichment.models import CustomerRow


def _bare_row() -> CustomerRow:
    return CustomerRow(
        store="ls", store_customer_id=1, unified_customer_key="ls:1"
    )


def test_apply_c_populates_canadian_shipping_with_fsa_prefix() -> None:
    row = _bare_row()
    apply_c_to_row(
        row,
        {
            "city": "Toronto",
            "state": "Ontario",
            "country": "Canada",
            "country_iso2": "ca",
            "zip": "M5V 3A8",  # Canadian postal code with FSA prefix M5V
        },
    )
    assert row.ship_city == "Toronto"
    assert row.ship_state == "Ontario"
    assert row.ship_country == "Canada"
    assert row.geoip_country_code == "CA"
    assert row.ship_postal_code_full == "M5V 3A8"
    assert row.ship_postal_code_prefix == "M5V"


def test_apply_c_handles_missing_and_empty_fields() -> None:
    row = _bare_row()
    apply_c_to_row(row, {"city": "", "state": None, "zip": "  "})
    assert row.ship_city is None
    assert row.ship_state is None
    assert row.ship_postal_code_full is None


def test_apply_c_with_none_shipping_is_noop() -> None:
    row = _bare_row()
    apply_c_to_row(row, None)
    assert row.ship_city is None
    assert row.ship_postal_code_prefix is None


@pytest.mark.asyncio
async def test_fetch_shipping_returns_empty_for_empty_input() -> None:
    async with BcClient("h", "tok") as client:
        result = await fetch_shipping_for_orders(client, set())
    assert result == {}


@pytest.mark.asyncio
async def test_fetch_shipping_concurrently_for_multiple_orders() -> None:
    async with BcClient("h", "tok") as client, respx.mock(
        assert_all_called=True
    ) as mock:
        mock.get(f"{BC_BASE}/stores/h/v2/orders/1/shipping_addresses").respond(
            200, json=[{"city": "Toronto", "zip": "M5V 3A8"}]
        )
        mock.get(f"{BC_BASE}/stores/h/v2/orders/2/shipping_addresses").respond(
            200, json=[{"city": "Vancouver", "zip": "V6B 1A1"}]
        )

        result = await fetch_shipping_for_orders(client, {1, 2})

    assert result[1]["city"] == "Toronto"
    assert result[2]["city"] == "Vancouver"


@pytest.mark.asyncio
async def test_fetch_shipping_skips_orders_with_no_address() -> None:
    async with BcClient("h", "tok") as client, respx.mock(
        assert_all_called=True
    ) as mock:
        mock.get(f"{BC_BASE}/stores/h/v2/orders/99/shipping_addresses").respond(
            200, json=[]
        )

        result = await fetch_shipping_for_orders(client, {99})

    assert 99 not in result
