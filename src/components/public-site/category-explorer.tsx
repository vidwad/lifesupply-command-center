"use client";

import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { useId, useState } from "react";

import type { Graphic } from "@/lib/public-site/graphics";

/** One store that carries a category, with the verified category pages on that store. */
export interface ExplorerStore {
  key: string;
  name: string;
  /** "Canada · CAD" or "United States · USD", from the registry. */
  geography: string;
  links: readonly { label: string; url: string }[];
}

export interface ExplorerItem {
  slug: string;
  title: string;
  description: string;
  /** The filter groups the category belongs to; one category may be in several. */
  groups: readonly string[];
  picture: Graphic;
  stores: readonly ExplorerStore[];
}

/**
 * The category explorer on Medical Supply Solutions (product owner,
 * 2026-09-13): products organized by recognizable need rather than by store.
 *
 * Every tile is in the document whether or not the current filter shows it,
 * and every category link is a real anchor to the store's own category page,
 * so the whole grid reads and works with JavaScript disabled. The filter is
 * the one thing a script adds: it sets `hidden` on the tiles outside the
 * chosen group and announces the count, and nothing animates in or out.
 *
 * The links are resolved by the page from the brand registry, which lists
 * only category pages observed on the store; this component never assembles
 * a destination itself.
 */
export function CategoryExplorer({
  items,
  filters,
  filterLabel,
  storesLabel,
  countLabel,
  imageNote,
}: {
  items: readonly ExplorerItem[];
  filters: readonly { key: string; label: string }[];
  filterLabel: string;
  storesLabel: string;
  /** `{n}` is replaced with the number of categories shown. */
  countLabel: string;
  imageNote: string;
}) {
  const [filter, setFilter] = useState(filters[0]?.key ?? "all");
  const groupId = useId();
  const isShown = (item: ExplorerItem) => filter === "all" || item.groups.includes(filter);
  const shown = items.filter(isShown).length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-[var(--lsh-rule)] py-4">
        <span id={groupId} className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
          {filterLabel}
        </span>
        {/*
         * Toggle buttons, not tabs: the tiles are one grid whichever filter
         * is on, so the pressed state is the whole story for a screen reader.
         */}
        <div role="group" aria-labelledby={groupId} className="flex flex-wrap gap-x-2 gap-y-2">
          {filters.map((option) => {
            const pressed = option.key === filter;
            return (
              <button
                key={option.key}
                type="button"
                aria-pressed={pressed}
                onClick={() => setFilter(option.key)}
                className={`lsh-display min-h-11 border px-4 text-[11px] transition-colors ${
                  pressed
                    ? "border-[var(--lsh-charcoal)] bg-[var(--lsh-charcoal)] text-white"
                    : "border-[var(--lsh-rule-strong)] text-[var(--lsh-charcoal)] hover:border-[var(--lsh-charcoal)]"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <p aria-live="polite" className="text-xs text-[var(--lsh-muted)] sm:ml-auto">
          {countLabel.replace("{n}", String(shown))}
        </p>
      </div>

      <ul className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <li
            key={item.slug}
            hidden={!isShown(item)}
            className={isShown(item) ? "flex flex-col" : "hidden"}
          >
            <article className="flex h-full flex-col">
              <figure className="group relative aspect-[4/3] overflow-hidden bg-[var(--lsh-charcoal)]">
                <Image
                  src={item.picture.src}
                  alt={item.picture.alt}
                  fill
                  sizes="(min-width: 1280px) 300px, (min-width: 640px) 50vw, 100vw"
                  style={{ objectPosition: item.picture.position ?? "50% 50%" }}
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
              </figure>
              <span aria-hidden="true" className="block h-0.5 w-full bg-[var(--lsh-brand-red)]" />
              <h3 className="lsh-display mt-5 text-xl leading-tight text-[var(--lsh-charcoal)]">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--lsh-muted)]">{item.description}</p>

              {/*
               * Which stores carry it, and the store's own category pages.
               * The geography line is the registry's, so a Canadian and a
               * U.S. destination are always told apart.
               */}
              <div className="pt-5">
                <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">{storesLabel}</p>
                <ul className="mt-3 grid gap-3">
                  {item.stores.map((store) => (
                    <li key={store.key} className="border-t border-[var(--lsh-rule)] pt-3">
                      <p className="flex flex-wrap items-baseline gap-x-3 text-sm">
                        <span className="lsh-display text-[11px] text-[var(--lsh-charcoal)]">
                          {store.name}
                        </span>
                        <span className="text-xs text-[var(--lsh-muted)]">{store.geography}</span>
                      </p>
                      <ul className="mt-1 flex flex-wrap gap-x-4">
                        {store.links.map((link) => (
                          <li key={link.url}>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex min-h-9 items-center gap-1.5 text-sm leading-6 text-[var(--lsh-muted)] underline decoration-[var(--lsh-rule-strong)] underline-offset-4 transition-colors hover:text-[var(--lsh-brand-red)] hover:decoration-[var(--lsh-brand-red)]"
                            >
                              {link.label}
                              <ExternalLink size={12} aria-hidden="true" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </li>
        ))}
      </ul>

      <p className="mt-10 border-t border-[var(--lsh-rule)] pt-5 text-xs leading-5 text-[var(--lsh-muted)]">
        {imageNote}
      </p>
    </div>
  );
}
