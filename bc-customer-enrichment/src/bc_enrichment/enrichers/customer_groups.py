"""Enumerate /v2/customer_groups for the store at startup.

Per the spec gotcha: '... the 53 in group 8 and 46 in group 4 might be
wholesale or institutional tiers — worth confirming what those groups
represent. Enumerate /v2/customer_groups once per store on startup and
dump to run summary.'

The dump goes into run_summary.json so you can confirm what each group
ID means without having to log into the BC admin.
"""
from __future__ import annotations

import logging
from typing import Any

from bc_enrichment.client import BcClient

logger = logging.getLogger(__name__)


async def fetch_customer_groups(client: BcClient) -> list[dict[str, Any]]:
    """Returns a list of {id, name, is_default, category_access} per group.
    Empty list if the call fails (logged) — never raises."""
    try:
        result = await client.get("/v2/customer_groups")
    except Exception as e:  # pragma: no cover (real-API only)
        logger.warning("customer_groups fetch failed: %s", e)
        return []
    if not isinstance(result, list):
        return []
    out: list[dict[str, Any]] = []
    for g in result:
        if not isinstance(g, dict):
            continue
        out.append({
            "id": g.get("id"),
            "name": g.get("name"),
            "is_default": g.get("is_default"),
        })
    return out
