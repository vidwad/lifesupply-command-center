"""CLI entry point. Wires up enricher Groups A-H, the disk cache, and
the per-group opt-in flags."""
from __future__ import annotations

import argparse
import asyncio
import json
import logging
import sys
from datetime import date
from pathlib import Path

from bc_enrichment.cache import parse_since
from bc_enrichment.config import all_store_slugs, load_store
from bc_enrichment.enrichers.group_d_products import load_subscription_skus
from bc_enrichment.runner import RunOptions, run_export
from bc_enrichment.xlsx_export import csv_to_xlsx


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="bc-enrichment",
        description="Export enriched per-customer dataset from BigCommerce.",
    )
    p.add_argument(
        "--store",
        required=True,
        choices=[*all_store_slugs(), "all"],
        help="Which store to export. 'all' runs each store sequentially.",
    )
    p.add_argument(
        "--since",
        default=None,
        help="YYYY-MM-DD. Customers whose date_modified < this date are read "
        "from the on-disk cache instead of being re-enriched. Requires "
        "--cache-dir (defaults to .cache/).",
    )
    p.add_argument(
        "--out-dir",
        default="out",
        type=Path,
        help="Output directory (default: ./out).",
    )
    p.add_argument(
        "--cache-dir",
        default=".cache",
        type=Path,
        help="Per-customer JSON cache root (default: ./.cache). Pass empty "
        "string to disable caching entirely.",
    )
    p.add_argument(
        "--subscription-skus",
        default=None,
        help="Path to a text file listing SKUs flagged as subscription "
        "(one per line, # comments ok). Used by Group D.",
    )
    p.add_argument(
        "--include-products",
        action="store_true",
        help="Enable Group D (product mix). Heavy: ~1 API call per order.",
    )
    p.add_argument(
        "--include-refunds",
        action="store_true",
        help="Enable Group E (refunds). Heavy: ~1 API call per order.",
    )
    p.add_argument(
        "--include-engagement",
        action="store_true",
        help="Enable Group G (wishlists + abandoned carts). Walks both "
        "endpoints paginated.",
    )
    p.add_argument(
        "--no-xlsx",
        action="store_true",
        help="Skip the post-CSV XLSX conversion (useful for very large runs).",
    )
    p.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Enable INFO-level logging (rate-limit cooldowns, page progress).",
    )
    return p


def _build_options(args: argparse.Namespace) -> RunOptions:
    cache_dir: Path | None = (
        args.cache_dir if args.cache_dir and str(args.cache_dir) else None
    )
    return RunOptions(
        include_products=bool(args.include_products),
        include_refunds=bool(args.include_refunds),
        include_engagement=bool(args.include_engagement),
        subscription_skus=load_subscription_skus(args.subscription_skus),
        since=parse_since(args.since),
        cache_dir=cache_dir,
    )


async def _run_one(
    store_slug: str, args: argparse.Namespace
) -> Path:
    store = load_store(store_slug)
    out_dir: Path = args.out_dir
    out_dir.mkdir(parents=True, exist_ok=True)
    today = date.today().isoformat()
    csv_path = out_dir / f"customers_enriched_{store_slug}_{today}.csv"
    xlsx_path = csv_path.with_suffix(".xlsx")
    summary_path = out_dir / f"run_summary_{store_slug}_{today}.json"

    print(f"[{store_slug}] starting → {csv_path}")
    options = _build_options(args)
    stats = await run_export(store, csv_path, options)

    if not args.no_xlsx:
        csv_to_xlsx(csv_path, xlsx_path)

    summary_path.write_text(
        json.dumps(stats.to_summary(), indent=2),
        encoding="utf-8",
    )
    cache_note = (
        f", {stats.cache_hits} cache hits"
        if options.cache_dir is not None and stats.cache_hits
        else ""
    )
    print(
        f"[{store_slug}] done: {stats.customers_emitted} customers, "
        f"{stats.guests_emitted} guests, "
        f"{stats.orders_scanned} orders, "
        f"{stats.api_requests} API calls, "
        f"{stats.rate_limit_sleeps} cooldowns{cache_note}, "
        f"{stats.duration_ms}ms\n"
        f"[{store_slug}] outputs:\n"
        f"  csv:     {csv_path}\n"
        + (f"  xlsx:    {xlsx_path}\n" if not args.no_xlsx else "")
        + f"  summary: {summary_path}"
    )
    return csv_path


def _write_combined_csv(
    csv_paths: list[Path], out_dir: Path, today: str
) -> Path | None:
    """Concatenate per-store CSVs into a single combined file. The first
    CSV's header is kept; subsequent CSVs' header rows are skipped."""
    csv_paths = [p for p in csv_paths if p.exists()]
    if not csv_paths:
        return None
    combined = out_dir / f"customers_enriched_combined_{today}.csv"
    with combined.open("w", newline="", encoding="utf-8") as out_f:
        first = True
        for src in csv_paths:
            with src.open("r", encoding="utf-8") as in_f:
                lines = in_f.readlines()
            if not lines:
                continue
            if first:
                out_f.writelines(lines)
                first = False
            else:
                out_f.writelines(lines[1:])  # drop duplicate header
    return combined


async def _main_async(args: argparse.Namespace) -> int:
    targets: list[str] = (
        all_store_slugs() if args.store == "all" else [args.store]
    )
    completed_csvs: list[Path] = []
    for slug in targets:
        try:
            csv_path = await _run_one(slug, args)
            completed_csvs.append(csv_path)
        except Exception as e:  # pragma: no cover (real-API errors)
            print(f"[{slug}] FAILED: {type(e).__name__}: {e}", file=sys.stderr)
            return 1
    if args.store == "all" and len(completed_csvs) > 1:
        today = date.today().isoformat()
        combined = _write_combined_csv(completed_csvs, args.out_dir, today)
        if combined:
            print(f"[combined] wrote {combined}")
    return 0


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    logging.basicConfig(
        level=logging.INFO if args.verbose else logging.WARNING,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    return asyncio.run(_main_async(args))


if __name__ == "__main__":
    sys.exit(main())
