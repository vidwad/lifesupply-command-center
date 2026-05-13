"""Tests for date parsing + recency-bucket helpers."""
from __future__ import annotations

from datetime import datetime, timezone

from bc_enrichment.dates import parse_bc_date, recency_bucket


def test_parse_rfc_2822_date_from_v2_endpoint() -> None:
    dt = parse_bc_date("Wed, 13 Mar 2024 10:00:00 +0000")
    assert dt == datetime(2024, 3, 13, 10, 0, tzinfo=timezone.utc)


def test_parse_iso_8601_date_from_v3_endpoint() -> None:
    dt = parse_bc_date("2025-09-09T12:00:00+00:00")
    assert dt == datetime(2025, 9, 9, 12, 0, tzinfo=timezone.utc)


def test_parse_iso_with_z_suffix() -> None:
    dt = parse_bc_date("2025-09-09T12:00:00Z")
    assert dt == datetime(2025, 9, 9, 12, 0, tzinfo=timezone.utc)


def test_parse_returns_none_for_empty_or_garbage() -> None:
    assert parse_bc_date(None) is None
    assert parse_bc_date("") is None
    assert parse_bc_date("not a date") is None


def test_recency_bucket_boundaries() -> None:
    assert recency_bucket(None) == "never"
    assert recency_bucket(0) == "0-30"
    assert recency_bucket(30) == "0-30"
    assert recency_bucket(31) == "31-90"
    assert recency_bucket(90) == "31-90"
    assert recency_bucket(91) == "91-180"
    assert recency_bucket(180) == "91-180"
    assert recency_bucket(181) == "181-365"
    assert recency_bucket(365) == "181-365"
    assert recency_bucket(366) == "365+"
    assert recency_bucket(99999) == "365+"
