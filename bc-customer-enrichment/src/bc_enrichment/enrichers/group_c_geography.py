"""Group C: geography from each customer's most recent shipping address.

Phase 1 of the runner gives us last_order_id per customer/guest. Here we
fetch /v2/orders/{id}/shipping_addresses for each unique last_order_id
concurrently (capped by the BcClient semaphore) so the bulk geographic
lookup happens once between phases rather than serialized into per-row
emission.

Output fields:
  ship_city, ship_state, ship_country, ship_postal_code_full,
  ship_postal_code_prefix (first 3 chars — Canadian FSA), geoip_country_code

Gotcha (per spec): BC's shipping address payload uses 'zip', not
'postal_code' — easy thing to miss when reading the docs.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any

from bc_enrichment.client import BcClient
from bc_enrichment.models import CustomerRow

logger = logging.getLogger(__name__)

ShippingByOrder = dict[int, dict[str, Any]]


async def fetch_shipping_for_orders(
    client: BcClient, order_ids: set[int]
) -> ShippingByOrder:
    """Fetch the first shipping address for each given order_id, in parallel
    (the BcClient semaphore caps in-flight requests). Orders with no shipping
    address are simply absent from the result map."""
    out: ShippingByOrder = {}

    async def fetch_one(oid: int) -> None:
        try:
            result = await client.get(f"/v2/orders/{oid}/shipping_addresses")
        except Exception as e:  # pragma: no cover (exercised only against real API)
            logger.warning("shipping fetch failed for order %d: %s", oid, e)
            return
        if isinstance(result, list) and result:
            first = result[0]
            if isinstance(first, dict):
                out[oid] = first

    if not order_ids:
        return out
    await asyncio.gather(*(fetch_one(oid) for oid in order_ids))
    return out


def apply_c_to_row(row: CustomerRow, shipping: dict[str, Any] | None) -> None:
    """Layer Group C fields onto an existing row in place."""
    if not shipping:
        return

    city = shipping.get("city")
    if isinstance(city, str) and city.strip():
        row.ship_city = city.strip()

    state = shipping.get("state")
    if isinstance(state, str) and state.strip():
        row.ship_state = state.strip()

    country = shipping.get("country")
    if isinstance(country, str) and country.strip():
        row.ship_country = country.strip()

    iso2 = shipping.get("country_iso2")
    if isinstance(iso2, str) and iso2.strip():
        row.geoip_country_code = iso2.strip().upper()

    # BC field is 'zip', not 'postal_code' (gotcha from spec)
    zip_raw = shipping.get("zip")
    if isinstance(zip_raw, str) and zip_raw.strip():
        zip_clean = zip_raw.strip()
        row.ship_postal_code_full = zip_clean
        row.ship_postal_code_prefix = zip_clean[:3].upper()
