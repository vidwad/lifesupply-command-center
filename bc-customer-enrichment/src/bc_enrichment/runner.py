"""End-to-end export runner.

Phases:
  1.   /v2/orders → per-customer + per-guest aggregates (Group B)
  1.5. Bulk shipping fetch for last_order_id of each owner (Group C)
  1.6. (optional) Bulk product fetch for every order (Group D)
  1.7. (optional) Bulk transactions fetch for every order (Group E)
  1.8. (optional) Walk /v3/wishlists + /v3/carts grouped by customer (Group G)
  2.   /v3/customers → emit row per registered customer (A + B + C + D + E + F + G + H)
       — with --since: customers whose date_modified < cutoff are read from
         the per-customer JSON cache instead of being re-enriched
  3.   Iterate guest aggregates → emit guest rows (B + C + D + E + F + H)
       — guests aren't cached
  4.   Cache write happens inside phase 2 for every freshly-enriched customer
"""
from __future__ import annotations

import time
from dataclasses import asdict, dataclass, field
from datetime import date, datetime
from pathlib import Path

from bc_enrichment.cache import CustomerCache
from bc_enrichment.client import BcClient
from bc_enrichment.config import StoreConfig
from bc_enrichment.csv_writer import StreamingCsvWriter
from bc_enrichment.dates import parse_bc_date
from bc_enrichment.enrichers.customer_groups import fetch_customer_groups
from bc_enrichment.enrichers.group_a_customer import from_customer_row
from bc_enrichment.enrichers.group_b_orders import (
    OrderAggregator,
    apply_b_to_row,
    build_guest_row,
)
from bc_enrichment.enrichers.group_c_geography import (
    apply_c_to_row,
    fetch_shipping_for_orders,
)
from bc_enrichment.enrichers.group_d_products import (
    ProductAggregator,
    apply_d_to_row,
    fetch_and_aggregate_products,
    fetch_category_lookup,
    fetch_product_categories,
)
from bc_enrichment.enrichers.group_e_refunds import (
    RefundAggregator,
    apply_e_to_row,
    fetch_and_aggregate_refunds,
)
from bc_enrichment.enrichers.group_f_b2b import apply_f_to_row
from bc_enrichment.enrichers.group_g_engagement import (
    EngagementAggregator,
    apply_g_to_row,
    collect_engagement,
)
from bc_enrichment.models import RunStats, csv_columns


@dataclass
class RunOptions:
    include_products: bool = False
    include_refunds: bool = False
    include_engagement: bool = False
    subscription_skus: set[str] = field(default_factory=set)
    since: datetime | None = None
    cache_dir: Path | None = None  # None disables caching


async def run_export(
    store: StoreConfig,
    csv_path: Path,
    options: RunOptions | None = None,
) -> RunStats:
    opts = options or RunOptions()
    started = time.monotonic()
    today = date.today()
    stats = RunStats(store=store.slug)
    cache = CustomerCache(opts.cache_dir) if opts.cache_dir else None

    async with BcClient(store.store_hash, store.access_token) as client:
        # ---- Phase 0: dump customer_groups for the run summary ----
        stats.customer_groups = await fetch_customer_groups(client)

        # ---- Phase 1: orders → aggregates ----
        aggregator = OrderAggregator()
        async for batch in client.list_paginated_v2("/v2/orders"):
            for raw_order in batch:
                aggregator.ingest(raw_order)
                stats.orders_scanned += 1

        # ---- Phase 1.5: shipping (Group C) ----
        last_order_ids: set[int] = {
            a.last_order_id
            for a in aggregator.by_customer.values()
            if a.last_order_id
        } | {
            g.last_order_id
            for g in aggregator.by_guest_email.values()
            if g.last_order_id
        }
        shipping_by_order = await fetch_shipping_for_orders(client, last_order_ids)

        # ---- Phase 1.6: products (Group D, optional) ----
        product_agg: ProductAggregator | None = None
        product_categories: dict[int, list[int]] | None = None
        category_names: dict[int, str] | None = None
        if opts.include_products:
            product_agg = await fetch_and_aggregate_products(
                client, aggregator, opts.subscription_skus
            )
            # Resolve product → categories → names so apply_d_to_row can
            # write human-readable category labels rather than bare IDs.
            all_pids = product_agg.all_product_ids()
            product_categories = await fetch_product_categories(client, all_pids)
            category_names = await fetch_category_lookup(client)

        # ---- Phase 1.7: refunds (Group E, optional) ----
        refund_agg: RefundAggregator | None = None
        if opts.include_refunds:
            refund_agg = await fetch_and_aggregate_refunds(client, aggregator)

        # ---- Phase 1.8: engagement (Group G, optional) ----
        engagement_agg: EngagementAggregator | None = None
        if opts.include_engagement:
            engagement_agg = await collect_engagement(client)

        # ---- Phase 2: registered customers → rows ----
        registered_emails: set[str] = set()
        with StreamingCsvWriter(csv_path, csv_columns()) as writer:
            async for batch in client.list_paginated_v3("/v3/customers"):
                for raw_customer in batch:
                    cust_id_raw = raw_customer.get("id")
                    cust_id = int(cust_id_raw) if isinstance(cust_id_raw, int) else 0
                    email_raw = raw_customer.get("email")
                    if isinstance(email_raw, str) and email_raw.strip():
                        registered_emails.add(email_raw.strip().lower())

                    # --since cache hit?
                    if (
                        cache is not None
                        and opts.since is not None
                        and cust_id > 0
                    ):
                        date_mod = raw_customer.get("date_modified")
                        date_mod_dt = (
                            parse_bc_date(date_mod)
                            if isinstance(date_mod, str)
                            else None
                        )
                        if (
                            date_mod_dt is not None
                            and date_mod_dt < opts.since
                        ):
                            cached = cache.read(store.slug, cust_id)
                            if cached is not None:
                                writer.write_row(asdict(cached))
                                stats.customers_emitted += 1
                                stats.cache_hits += 1
                                continue

                    # Full pipeline
                    row = from_customer_row(store.slug, raw_customer)
                    agg = aggregator.by_customer.get(row.store_customer_id)
                    apply_b_to_row(row, agg, today)
                    if agg is not None:
                        apply_c_to_row(
                            row, shipping_by_order.get(agg.last_order_id)
                        )
                    apply_f_to_row(row, agg)
                    if product_agg is not None:
                        apply_d_to_row(
                            row,
                            product_agg.by_customer.get(row.store_customer_id),
                            product_categories=product_categories,
                            category_names=category_names,
                        )
                    if refund_agg is not None:
                        apply_e_to_row(
                            row,
                            refund_agg.by_customer.get(row.store_customer_id),
                            agg,
                        )
                    if engagement_agg is not None:
                        apply_g_to_row(
                            row,
                            engagement_agg.by_customer.get(row.store_customer_id),
                        )
                    writer.write_row(asdict(row))
                    stats.customers_emitted += 1
                    if cache is not None:
                        cache.write(store.slug, row)

            # ---- Phase 3: unregistered guests ----
            for email, gagg in aggregator.by_guest_email.items():
                if email in registered_emails:
                    continue
                row = build_guest_row(store.slug, gagg, today)
                apply_c_to_row(row, shipping_by_order.get(gagg.last_order_id))
                apply_f_to_row(row, gagg)
                if product_agg is not None:
                    apply_d_to_row(
                        row,
                        product_agg.by_guest_email.get(email),
                        product_categories=product_categories,
                        category_names=category_names,
                    )
                if refund_agg is not None:
                    apply_e_to_row(
                        row, refund_agg.by_guest_email.get(email), gagg
                    )
                # Group G: guests have no customer_id, can't be matched. Skip.
                writer.write_row(asdict(row))
                stats.guests_emitted += 1

        stats.api_requests = client.stats.requests
        stats.rate_limit_sleeps = client.stats.rate_limit_sleeps
        stats.rate_limit_sleep_ms_total = client.stats.rate_limit_sleep_ms_total
        stats.retries_after_429 = client.stats.retries_after_429
        stats.errored_paths = list(client.stats.errored_paths)

    stats.duration_ms = int((time.monotonic() - started) * 1000)
    return stats
