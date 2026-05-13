"""Date parsing + recency-bucket helpers.

BC v2 endpoints return dates in RFC 2822 format ('Wed, 13 Mar 2024 ...');
v3 endpoints return ISO 8601. We try RFC 2822 first, then ISO.
"""
from __future__ import annotations

from datetime import datetime, timezone
from email.utils import parsedate_to_datetime


def parse_bc_date(s: str | None) -> datetime | None:
    """Parse a BC date string (either RFC 2822 or ISO 8601) into an aware
    datetime. Returns None for empty / unparseable input."""
    if not s:
        return None
    try:
        dt = parsedate_to_datetime(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except (TypeError, ValueError):
        pass
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except ValueError:
        return None


def recency_bucket(days_since_last: int | None) -> str:
    """Reactivation-cohort label. Buckets per spec:
    0-30 | 31-90 | 91-180 | 181-365 | 365+ | never.
    """
    if days_since_last is None:
        return "never"
    if days_since_last <= 30:
        return "0-30"
    if days_since_last <= 90:
        return "31-90"
    if days_since_last <= 180:
        return "91-180"
    if days_since_last <= 365:
        return "181-365"
    return "365+"
