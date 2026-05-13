"""Async BigCommerce API client with rate-limit awareness.

BC sets these response headers on every API call:
  X-Rate-Limit-Requests-Left:  requests remaining in current window
  X-Rate-Limit-Time-Reset-Ms:  ms until window resets
  X-Rate-Limit-Time-Window-Ms: window size (informational)

Strategy:
  - PROACTIVE: when requests_left < SLOW_DOWN_THRESHOLD, sleep until the
    window resets BEFORE the next call. Way faster overall than waiting
    for a 429 and the resulting penalty.
  - REACTIVE: on 429, sleep the server-provided reset and retry once. If
    still 429, propagate so the caller can decide.

A semaphore caps in-flight requests per client (default 5) so we don't
saturate BC even when many asyncio tasks fan out work.
"""
from __future__ import annotations

import asyncio
import logging
from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from types import TracebackType
from typing import Any

import httpx

logger = logging.getLogger(__name__)

BC_BASE = "https://api.bigcommerce.com"
DEFAULT_PAGE_SIZE = 250
DEFAULT_TIMEOUT_S = 30.0
DEFAULT_SLOW_DOWN_THRESHOLD = 5
DEFAULT_MAX_CONCURRENT = 5


@dataclass
class ClientStats:
    requests: int = 0
    rate_limit_sleeps: int = 0
    rate_limit_sleep_ms_total: int = 0
    retries_after_429: int = 0
    errored_paths: list[str] = field(default_factory=list)


class BcApiError(Exception):
    def __init__(self, status: int, path: str, body_snippet: str) -> None:
        super().__init__(f"BC {status} on {path}: {body_snippet[:200]}")
        self.status = status
        self.path = path
        self.body_snippet = body_snippet


class BcClient:
    """One client per store. Reuse across many enrichers — cheap to create,
    expensive to repeatedly tear down (each rebuild loses keep-alive)."""

    def __init__(
        self,
        store_hash: str,
        access_token: str,
        *,
        timeout_s: float = DEFAULT_TIMEOUT_S,
        slow_down_threshold: int = DEFAULT_SLOW_DOWN_THRESHOLD,
        max_concurrent: int = DEFAULT_MAX_CONCURRENT,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self._store_root = f"{BC_BASE}/stores/{store_hash}"
        self._headers = {
            "X-Auth-Token": access_token,
            "Accept": "application/json",
        }
        self._timeout_s = timeout_s
        self._slow_down_threshold = slow_down_threshold
        self._semaphore = asyncio.Semaphore(max_concurrent)
        self._owned_client = client is None
        self._http: httpx.AsyncClient = client or httpx.AsyncClient(
            timeout=timeout_s,
            headers=self._headers,
        )
        self.stats = ClientStats()

    async def __aenter__(self) -> BcClient:
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        if self._owned_client:
            await self._http.aclose()

    async def get(self, path: str) -> Any:
        """Fetch one path (relative to store root) and return parsed JSON.

        Returns None for 204 / empty body / 404 (treated as 'no rows past
        the end' — many BC v2 endpoints terminate that way).
        """
        url = f"{self._store_root}{path}" if path.startswith("/") else path
        async with self._semaphore:
            return await self._get_with_retry(url, path)

    async def list_paginated_v2(
        self,
        path: str,
        *,
        page_size: int = DEFAULT_PAGE_SIZE,
    ) -> AsyncIterator[list[dict[str, Any]]]:
        """Iterate v2 collection endpoints (orders, transactions, products).

        v2 returns either a JSON array or 204/empty. We stop on empty, on a
        404 terminator, or on a short page.
        """
        page = 1
        sep = "&" if "?" in path else "?"
        while True:
            paged = f"{path}{sep}limit={page_size}&page={page}"
            data = await self.get(paged)
            if data is None:
                return
            if not isinstance(data, list):
                raise BcApiError(
                    200,
                    paged,
                    f"v2 endpoint returned non-list: {type(data).__name__}",
                )
            if not data:
                return
            yield data
            if len(data) < page_size:
                return
            page += 1

    async def list_paginated_v3(
        self,
        path: str,
        *,
        page_size: int = DEFAULT_PAGE_SIZE,
    ) -> AsyncIterator[list[dict[str, Any]]]:
        """Iterate v3 collection endpoints (customers, wishlists, carts).

        v3 returns {"data": [...], "meta": {"pagination": {...}}}.
        """
        page = 1
        sep = "&" if "?" in path else "?"
        while True:
            paged = f"{path}{sep}limit={page_size}&page={page}"
            payload = await self.get(paged)
            if payload is None:
                return
            if not isinstance(payload, dict):
                raise BcApiError(
                    200,
                    paged,
                    f"v3 endpoint returned non-object: {type(payload).__name__}",
                )
            data = payload.get("data") or []
            if not isinstance(data, list):
                raise BcApiError(200, paged, "v3 'data' is not a list")
            if not data:
                return
            yield data
            if len(data) < page_size:
                return
            page += 1

    # ---- internal ---- #

    async def _get_with_retry(self, url: str, path: str) -> Any:
        for attempt in (0, 1):
            res = await self._http.get(url)
            self.stats.requests += 1
            await self._maybe_proactive_sleep(res)

            if res.status_code == 204 or not res.content:
                return None
            if res.status_code == 200:
                return res.json()
            if res.status_code == 404:
                # BC v2 list endpoints often 404 instead of returning [] past
                # the last page. Caller's pagination loop expects this terminator.
                return None
            if res.status_code == 429 and attempt == 0:
                self.stats.retries_after_429 += 1
                await self._sleep_until_reset(res, fallback_ms=1000)
                continue
            self.stats.errored_paths.append(path)
            raise BcApiError(res.status_code, path, res.text)
        raise BcApiError(429, path, "exceeded retry budget after 429")

    async def _maybe_proactive_sleep(self, res: httpx.Response) -> None:
        try:
            left = int(res.headers.get("X-Rate-Limit-Requests-Left", ""))
        except ValueError:
            return
        if left >= self._slow_down_threshold:
            return
        await self._sleep_until_reset(res, fallback_ms=10)

    async def _sleep_until_reset(
        self, res: httpx.Response, *, fallback_ms: int
    ) -> None:
        try:
            ms = int(res.headers.get("X-Rate-Limit-Time-Reset-Ms", ""))
        except ValueError:
            ms = fallback_ms
        ms = max(ms, fallback_ms)
        self.stats.rate_limit_sleeps += 1
        self.stats.rate_limit_sleep_ms_total += ms
        logger.info("rate-limit cooldown: sleeping %dms", ms)
        await asyncio.sleep(ms / 1000.0)
