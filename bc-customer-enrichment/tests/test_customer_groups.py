"""Tests for /v2/customer_groups enumeration into the run summary."""
from __future__ import annotations

import csv as csv_mod
from pathlib import Path

import pytest
import respx

from bc_enrichment.client import BC_BASE, BcClient
from bc_enrichment.config import StoreConfig
from bc_enrichment.enrichers.customer_groups import fetch_customer_groups
from bc_enrichment.runner import run_export


@pytest.mark.asyncio
async def test_fetch_customer_groups_returns_normalized_list() -> None:
    async with BcClient("h", "tok") as client, respx.mock(
        assert_all_called=True
    ) as mock:
        mock.get(f"{BC_BASE}/stores/h/v2/customer_groups").respond(
            200,
            json=[
                {"id": 4, "name": "Wholesale", "is_default": False, "extra": "ignored"},
                {"id": 8, "name": "Institutional", "is_default": False},
            ],
        )

        groups = await fetch_customer_groups(client)

    assert groups == [
        {"id": 4, "name": "Wholesale", "is_default": False},
        {"id": 8, "name": "Institutional", "is_default": False},
    ]


@pytest.mark.asyncio
async def test_fetch_customer_groups_handles_non_list_response() -> None:
    async with BcClient("h", "tok") as client, respx.mock(
        assert_all_called=True
    ) as mock:
        mock.get(f"{BC_BASE}/stores/h/v2/customer_groups").respond(
            200, json={"unexpected": "shape"}
        )

        groups = await fetch_customer_groups(client)

    assert groups == []


@pytest.mark.asyncio
async def test_run_export_includes_customer_groups_in_stats(tmp_path: Path) -> None:
    store = StoreConfig(slug="ls", label="LS", store_hash="h", access_token="t")
    csv_path = tmp_path / "out.csv"

    with respx.mock(assert_all_called=True) as mock:
        mock.get(f"{BC_BASE}/stores/h/v2/customer_groups").respond(
            200, json=[{"id": 4, "name": "Wholesale", "is_default": False}],
        )
        mock.get(f"{BC_BASE}/stores/h/v2/orders?limit=250&page=1").respond(200, json=[])
        mock.get(f"{BC_BASE}/stores/h/v3/customers?limit=250&page=1").respond(
            200, json={"data": [{"id": 1, "email": "a@x.com"}], "meta": {}},
        )

        stats = await run_export(store, csv_path)

    assert len(stats.customer_groups) == 1
    assert stats.customer_groups[0]["id"] == 4
    assert stats.customer_groups[0]["name"] == "Wholesale"

    summary = stats.to_summary()
    assert "customer_groups" in summary
    assert summary["customer_groups"] == stats.customer_groups

    # Sanity: CSV still produced normally
    rows = list(csv_mod.DictReader(csv_path.open(encoding="utf-8")))
    assert len(rows) == 1
