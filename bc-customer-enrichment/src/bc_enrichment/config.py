"""Store registry + credential loading.

Three BigCommerce stores are exported by this tool. Each is identified by a
short slug used in the --store CLI flag, output filenames, and the
unified_customer_key (Group H).

Store hashes are public (visible in BC control panel URLs); access tokens
come from .env via python-dotenv. Never hardcode tokens.
"""
from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class StoreConfig:
    slug: str
    label: str
    store_hash: str
    access_token: str


_STORES: dict[str, tuple[str, str, str]] = {
    "lifesupply": ("LifeSupply.ca", "76ccf", "BC_LIFESUPPLY_ACCESS_TOKEN"),
    "wellmart": ("WellmartMedical.com", "75wm96odq8", "BC_WELLMART_ACCESS_TOKEN"),
    "store3": ("Store3 (Balkowitsch)", "vkmglkp3b4", "BC_STORE3_ACCESS_TOKEN"),
}


def all_store_slugs() -> list[str]:
    return list(_STORES.keys())


def load_store(slug: str) -> StoreConfig:
    if slug not in _STORES:
        raise ValueError(
            f"Unknown store {slug!r}. Known: {', '.join(_STORES)}"
        )
    label, store_hash, env_var = _STORES[slug]
    token = os.environ.get(env_var, "").strip()
    if not token:
        raise RuntimeError(
            f"{env_var} is empty. Add it to bc-customer-enrichment/.env "
            f"(see .env.example)."
        )
    return StoreConfig(
        slug=slug, label=label, store_hash=store_hash, access_token=token
    )
