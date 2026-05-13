"""Tests for the async BC client.

Uses respx to intercept httpx calls. Coverage:
  - v2 pagination terminates on a short page
  - v3 pagination terminates on empty data envelope
  - Proactive cooldown when X-Rate-Limit-Requests-Left < threshold
  - 429 retry path: sleeps server-provided reset, succeeds on retry
"""
from __future__ import annotations

from typing import Any

import httpx
import pytest
import respx

from bc_enrichment.client import BC_BASE, BcClient


def _store_url(store_hash: str, path: str) -> str:
    return f"{BC_BASE}/stores/{store_hash}{path}"


@pytest.mark.asyncio
async def test_v2_pagination_terminates_on_short_page() -> None:
    store = "abc123"
    page1 = [{"id": i} for i in (1, 2)]  # full page (== page_size)
    page2 = [{"id": 3}]  # short page → terminator

    async with BcClient(store, "tok") as client, respx.mock(
        assert_all_called=True
    ) as mock:
        mock.get(_store_url(store, "/v2/orders?limit=2&page=1")).respond(
            200, json=page1
        )
        mock.get(_store_url(store, "/v2/orders?limit=2&page=2")).respond(
            200, json=page2
        )

        all_rows: list[dict[str, Any]] = []
        async for batch in client.list_paginated_v2("/v2/orders", page_size=2):
            all_rows.extend(batch)

        assert len(all_rows) == 3
        assert client.stats.requests == 2


@pytest.mark.asyncio
async def test_v3_pagination_terminates_on_empty_data() -> None:
    store = "abc123"
    page1 = {"data": [{"id": 1}, {"id": 2}], "meta": {}}
    page2: dict[str, Any] = {"data": [], "meta": {}}

    async with BcClient(store, "tok") as client, respx.mock(
        assert_all_called=True
    ) as mock:
        mock.get(_store_url(store, "/v3/customers?limit=2&page=1")).respond(
            200, json=page1
        )
        mock.get(_store_url(store, "/v3/customers?limit=2&page=2")).respond(
            200, json=page2
        )

        all_rows: list[dict[str, Any]] = []
        async for batch in client.list_paginated_v3("/v3/customers", page_size=2):
            all_rows.extend(batch)

        assert len(all_rows) == 2
        assert client.stats.requests == 2


@pytest.mark.asyncio
async def test_proactive_cooldown_when_requests_left_below_threshold() -> None:
    store = "abc123"
    async with BcClient(store, "tok") as client, respx.mock(
        assert_all_called=True
    ) as mock:
        mock.get(_store_url(store, "/v2/orders?limit=250&page=1")).respond(
            200,
            json=[],
            headers={
                "X-Rate-Limit-Requests-Left": "2",
                "X-Rate-Limit-Time-Reset-Ms": "20",
            },
        )

        async for _ in client.list_paginated_v2("/v2/orders"):
            pass

        assert client.stats.rate_limit_sleeps == 1
        assert client.stats.rate_limit_sleep_ms_total >= 20


@pytest.mark.asyncio
async def test_429_retry_then_success() -> None:
    """First call returns 429 with reset header; client sleeps and retries
    once. Second call succeeds. Stats track the retry."""
    store = "abc123"
    async with BcClient(store, "tok") as client, respx.mock(
        assert_all_called=True
    ) as mock:
        responses = iter(
            [
                httpx.Response(
                    429,
                    json={"error": "rate limited"},
                    headers={"X-Rate-Limit-Time-Reset-Ms": "20"},
                ),
                httpx.Response(
                    200, json={"data": [{"id": 12345, "email": "x@y.com"}]}
                ),
            ]
        )

        def handler(request: httpx.Request) -> httpx.Response:
            return next(responses)

        mock.get(_store_url(store, "/v3/customers/12345")).mock(
            side_effect=handler
        )

        result = await client.get("/v3/customers/12345")

        assert result == {"data": [{"id": 12345, "email": "x@y.com"}]}
        assert client.stats.retries_after_429 == 1
        assert client.stats.requests == 2
