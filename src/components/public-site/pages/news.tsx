import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

import { ActionLink } from "@/components/public-site/action-link";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import {
  Container,
  Eyebrow,
  PrimaryAction,
  PublicHero,
} from "@/components/public-site/lifesupply-primitives";
import { Reveal, SpotlightCard, Stagger, StaggerItem } from "@/components/public-site/motion";
import { IconBadge } from "@/components/public-site/sections";
import { ACTIONS, type ActionKey } from "@/lib/public-site/actions";
import { news } from "@/lib/public-site/content/news";
import { iconForTitle } from "@/lib/public-site/icon-map";
import { measurementAttributes } from "@/lib/public-site/measurement";
import { publishedDocumentUrl, type Published } from "@/lib/public-site/published";
import { LIFE_SUPPLY_ROUTES, newsItemRoute, resourceRoute } from "@/lib/public-site/routes";
import type {
  PublicNewsItemDto,
  PublicResourceDto,
  PublishedDocumentDto,
} from "@/server/public-web/contracts";

/**
 * A governed section is shown when it has records, and when it could not be
 * reached, where it says so. A section that fetched cleanly and returned
 * nothing is left out entirely rather than announcing that it is empty
 * (website improvement program, 2026-09-09).
 */
function isEmpty<T>(published: { ok: true; data: T[] } | { ok: false }): boolean {
  return published.ok && published.data.length === 0;
}

/** A section that says plainly when it is unreachable rather than filling itself. */
function Note({ text, tone = "empty" }: { text: string; tone?: "empty" | "unavailable" }) {
  return (
    <p
      className={`mt-4 border-l-2 pl-4 text-sm leading-6 text-[var(--lsh-muted)] ${
        tone === "unavailable" ? "border-[var(--lsh-brand-red)]" : "border-[var(--lsh-rule-strong)]"
      }`}
      role={tone === "unavailable" ? "status" : undefined}
    >
      {text}
    </p>
  );
}

/** Format an ISO calendar date for display without a timezone shift. */
export function displayDate(iso: string) {
  const parts = iso.split("-").map(Number);
  const year = parts[0] ?? 1970;
  const month = parts[1] ?? 1;
  const day = parts[2] ?? 1;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Governed public documents from the published read model; fails closed when unreachable. */
function PublishedDocuments({ published }: { published: Published<PublishedDocumentDto[]> }) {
  const copy = news.documents.published;
  if (isEmpty(published)) return null;
  return (
    <Reveal className="mt-12">
      <Eyebrow as="h3">{copy.title}</Eyebrow>
      {!published.ok ? (
        <Note text={copy.unavailable} tone="unavailable" />
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {published.data.map((doc) => (
            <li
              key={doc.id}
              className="border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-6"
            >
              <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                {doc.documentType.replace("_", " ")}
                {doc.periodLabel ? ` · ${doc.periodLabel}` : ""}
              </p>
              <h4 className="lsh-display mt-2 text-xl text-[var(--lsh-charcoal)]">{doc.title}</h4>
              {doc.disclosureText ? (
                <p className="mt-2 text-sm leading-6 text-[var(--lsh-muted)]">
                  {doc.disclosureText}
                </p>
              ) : null}
              <p className="mt-4">
                {doc.downloadPath ? (
                  <a
                    {...measurementAttributes("public_document_download", {
                      documentType: doc.documentType,
                    })}
                    href={publishedDocumentUrl(doc.downloadPath)}
                    className="lsh-display inline-flex items-center gap-2 border border-[var(--lsh-rule-strong)] px-4 py-2 text-[11px] text-[var(--lsh-charcoal)] transition-colors hover:border-black hover:bg-black hover:text-white"
                  >
                    {copy.download} <ArrowRight size={14} aria-hidden="true" />
                  </a>
                ) : (
                  <span className="text-xs text-[var(--lsh-muted)]">On request</span>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Reveal>
  );
}

/** The record's fields after its title, in one place for the phone list and the table. */
const DOCUMENT_FIELDS = ["Date", "Access", "Version", "Status"] as const;

function documentFields(record: (typeof news.documents.records)[number]) {
  return [
    record.date,
    record.category,
    record.version ?? "Not stated",
    record.href ? "Available" : "On request",
  ];
}

/**
 * The investor documents index, merged into this page on 2026-09-09: access
 * classes, the dated records at a request step, the governed published list,
 * and the request note. No file is ever linked by literal.
 *
 * The records are a five-column table from md up. On a phone that table
 * needed 40rem and pushed the whole page sideways (product owner,
 * 2026-09-09), so below md each record is a stacked card with its fields as
 * a definition list instead. `min-w-0` keeps this block shrinkable inside
 * the page's grid, so the table's scroller can contain it rather than the
 * page widening around it.
 */
function InvestorDocuments({ published }: { published: Published<PublishedDocumentDto[]> }) {
  const d = news.documents;
  return (
    <div className="min-w-0">
      <Reveal>
        <div className="flex items-center gap-4">
          <IconBadge icon="landmark" size={18} />
          <Eyebrow as="h2">{d.eyebrow}</Eyebrow>
        </div>
        <p className="lsh-display mt-4 max-w-3xl text-2xl leading-tight text-[var(--lsh-charcoal)]">
          {d.title}
        </p>
        <p className="mt-3 max-w-3xl leading-7 text-[var(--lsh-muted)]">{d.intro}</p>
      </Reveal>
      <Stagger className="mt-8 grid gap-px bg-[var(--lsh-rule)] md:grid-cols-3">
        {d.classes.map((entry) => (
          <StaggerItem key={entry.title} className="flex gap-4 bg-[var(--lsh-surface)] p-6">
            <IconBadge icon={iconForTitle(entry.title)} size={18} />
            <div>
              <Eyebrow as="h3">{entry.title}</Eyebrow>
              <p className="mt-2 text-sm leading-6 text-[var(--lsh-muted)]">{entry.text}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
      {/* Phones: one stacked card per record. */}
      <Stagger as="ul" className="mt-8 grid gap-4 md:hidden">
        {d.records.map((record) => (
          <StaggerItem
            key={record.title}
            as="li"
            className="border-t-2 border-[var(--lsh-rule-strong)] bg-[var(--lsh-surface)] p-5"
          >
            <p className="font-medium leading-6 text-[var(--lsh-charcoal)]">{record.title}</p>
            <p className="mt-1 text-xs leading-5 text-[var(--lsh-muted)]">{record.note}</p>
            <dl className="mt-4 grid grid-cols-[5rem_minmax(0,1fr)] gap-x-4 gap-y-2 text-xs leading-5">
              {documentFields(record).map((value, index) => (
                <div key={DOCUMENT_FIELDS[index]} className="contents">
                  <dt className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                    {DOCUMENT_FIELDS[index]}
                  </dt>
                  <dd className="text-[var(--lsh-muted)]">{value}</dd>
                </div>
              ))}
            </dl>
          </StaggerItem>
        ))}
      </Stagger>
      {/* Tablet and desktop: the same records as a table. */}
      <Reveal className="mt-10 hidden min-w-0 overflow-x-auto md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
              <th scope="col" className="border-b border-[var(--lsh-rule-strong)] py-3 pr-4">
                Title
              </th>
              {DOCUMENT_FIELDS.map((field) => (
                <th
                  key={field}
                  scope="col"
                  className="border-b border-[var(--lsh-rule-strong)] py-3 pr-4"
                >
                  {field}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {d.records.map((record) => (
              <tr key={record.title} className="align-top">
                <th
                  scope="row"
                  className="border-b border-[var(--lsh-rule)] py-4 pr-4 font-medium text-[var(--lsh-charcoal)]"
                >
                  {record.title}
                  <span className="mt-1 block text-xs font-normal leading-5 text-[var(--lsh-muted)]">
                    {record.note}
                  </span>
                </th>
                {documentFields(record).map((value, index) => (
                  <td
                    key={DOCUMENT_FIELDS[index]}
                    className="border-b border-[var(--lsh-rule)] py-4 pr-4 text-[var(--lsh-muted)]"
                  >
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Reveal>
      <PublishedDocuments published={published} />
      <Reveal className="mt-10 flex gap-5 border-l-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-surface)] p-6">
        <IconBadge icon="mail" />
        <p className="leading-7 text-[var(--lsh-muted)]">{d.requestNote}</p>
      </Reveal>
      <Reveal className="mt-8 flex flex-wrap gap-3">
        {d.actions.map((action, index) => (
          <ActionLink
            key={action}
            action={action as ActionKey}
            variant={index === 0 ? "primary" : "onLight"}
          />
        ))}
      </Reveal>
    </div>
  );
}

/**
 * `/news/` — governed current news, the investor documents index, the static
 * historical releases, and governed resources.
 */
export function NewsPage({
  current,
  documents,
  resources,
}: {
  current: Published<PublicNewsItemDto[]>;
  documents: Published<PublishedDocumentDto[]>;
  resources: Published<PublicResourceDto[]>;
}) {
  const { hero, sections, historical } = news;
  return (
    <LifeSupplyLayout>
      <PublicHero eyebrow={hero.eyebrow} title={hero.title} description={hero.description} />
      <section className="px-5 py-20 lg:px-8">
        <Container className="grid gap-16">
          {isEmpty(current) ? null : (
            <Reveal>
              <div className="flex items-center gap-4">
                <IconBadge icon="file" size={18} />
                <Eyebrow as="h2">{sections.current.title}</Eyebrow>
              </div>
              {!current.ok ? (
                <Note text={sections.current.unavailable} tone="unavailable" />
              ) : (
                <ul className="mt-6 grid gap-4">
                  {current.data.map((item) => (
                    <li key={item.slug}>
                      <SpotlightCard className="lsh-lift border border-[var(--lsh-rule)] bg-[var(--lsh-paper)]">
                        <Link href={newsItemRoute(item.slug)} className="group grid gap-3 p-7">
                          <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                            {displayDate(item.date)}
                          </p>
                          <h3 className="lsh-display text-2xl text-[var(--lsh-charcoal)]">
                            {item.title}
                          </h3>
                          <p className="leading-7 text-[var(--lsh-muted)]">{item.summary}</p>
                          <span className="lsh-display inline-flex items-center gap-2 text-[11px] text-[var(--lsh-brand-red)]">
                            Read <ArrowRight size={15} aria-hidden="true" />
                          </span>
                        </Link>
                      </SpotlightCard>
                    </li>
                  ))}
                </ul>
              )}
            </Reveal>
          )}

          <InvestorDocuments published={documents} />

          <div>
            <Reveal className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex items-center gap-4">
                <IconBadge icon="scroll" size={18} />
                <Eyebrow as="h2">{sections.historical.title}</Eyebrow>
              </div>
              <p className="text-xs text-[var(--lsh-muted)]">{sections.historical.note}</p>
            </Reveal>
            <Stagger className="mt-6 grid gap-4">
              {historical.map((item) => (
                <StaggerItem key={item.href}>
                  <SpotlightCard className="lsh-lift border border-[var(--lsh-rule)] bg-[var(--lsh-paper)]">
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group grid gap-4 p-7 sm:grid-cols-[1fr_auto] sm:items-end"
                    >
                      <div>
                        <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                          {item.date} · {item.source}
                        </p>
                        <h3 className="lsh-display mt-3 text-2xl text-[var(--lsh-charcoal)]">
                          {item.title}
                        </h3>
                      </div>
                      <span className="lsh-display inline-flex items-center gap-2 text-[11px] text-[var(--lsh-brand-red)]">
                        Read source{" "}
                        <ExternalLink
                          size={15}
                          aria-hidden="true"
                          className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
                        />
                      </span>
                    </a>
                  </SpotlightCard>
                </StaggerItem>
              ))}
            </Stagger>
          </div>

          {isEmpty(resources) ? null : (
            <Reveal>
              <div className="flex items-center gap-4">
                <IconBadge icon="clipboardList" size={18} />
                <Eyebrow as="h2">{sections.resources.title}</Eyebrow>
              </div>
              {!resources.ok ? (
                <Note text={sections.resources.unavailable} tone="unavailable" />
              ) : (
                <ul className="mt-6 grid gap-4 md:grid-cols-2">
                  {resources.data.map((item) => (
                    <li key={item.slug}>
                      <SpotlightCard className="lsh-lift h-full border border-[var(--lsh-rule)] bg-[var(--lsh-paper)]">
                        <Link href={resourceRoute(item.slug)} className="group grid gap-3 p-7">
                          <p className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                            Reviewed {displayDate(item.reviewed)}
                          </p>
                          <h3 className="lsh-display text-xl text-[var(--lsh-charcoal)]">
                            {item.title}
                          </h3>
                          <p className="text-sm leading-6 text-[var(--lsh-muted)]">
                            {item.summary}
                          </p>
                        </Link>
                      </SpotlightCard>
                    </li>
                  ))}
                </ul>
              )}
            </Reveal>
          )}
        </Container>
      </section>
    </LifeSupplyLayout>
  );
}

/** Rendered when a governed page cannot be fetched: the section fails closed, never blank. */
export function PublishedUnavailablePage() {
  const copy = news.itemUnavailable;
  return (
    <LifeSupplyLayout>
      <PublicHero eyebrow={copy.eyebrow} title={copy.title} description={copy.text} />
      <section className="mx-auto max-w-3xl px-5 py-20 lg:px-8">
        <PrimaryAction href={LIFE_SUPPLY_ROUTES.news}>Back to news</PrimaryAction>
      </section>
    </LifeSupplyLayout>
  );
}

/** `/news/[slug]/` — a dated announcement from the published read model. */
export function NewsItemView({ item }: { item: PublicNewsItemDto }) {
  return (
    <LifeSupplyLayout>
      <PublicHero
        eyebrow={`Company news · ${displayDate(item.date)}`}
        title={item.title}
        description={item.summary}
      />
      <section className="mx-auto max-w-3xl px-5 py-20 lg:px-8">
        <Reveal className="grid gap-5 text-lg leading-8 text-[var(--lsh-muted)]">
          {item.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Reveal>
        {item.source ? (
          <Reveal className="mt-8 border-t border-[var(--lsh-rule)] pt-6 text-sm text-[var(--lsh-muted)]">
            Source:{" "}
            <a href={item.source.href} target="_blank" rel="noreferrer" className="underline">
              {item.source.label}
            </a>
          </Reveal>
        ) : null}
        <Reveal className="mt-8 flex flex-wrap gap-3">
          <PrimaryAction href={LIFE_SUPPLY_ROUTES.news}>All news</PrimaryAction>
          <ActionLink action="general_inquiry" variant="onLight" />
        </Reveal>
      </section>
    </LifeSupplyLayout>
  );
}

/** `/resources/[slug]/` — practical guidance with its author, reviewer, and dates. */
export function ResourceView({ item }: { item: PublicResourceDto }) {
  // The action key is authored in the Command Center; an unknown key falls back to the general channel.
  const action: ActionKey = item.action in ACTIONS ? (item.action as ActionKey) : "general_inquiry";
  return (
    <LifeSupplyLayout>
      <PublicHero eyebrow="Resource" title={item.title} description={item.summary} />
      <section className="mx-auto max-w-3xl px-5 py-20 lg:px-8">
        <Reveal className="mb-8 grid gap-1 border-l-4 border-[var(--lsh-brand-red)] pl-4 text-xs text-[var(--lsh-muted)]">
          <span>Author: {item.author}</span>
          <span>Reviewer: {item.reviewer}</span>
          <span>
            Published {displayDate(item.published)} · Reviewed {displayDate(item.reviewed)}
          </span>
        </Reveal>
        <Reveal className="grid gap-5 text-lg leading-8 text-[var(--lsh-muted)]">
          {item.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Reveal>
        <Reveal className="mt-8 flex flex-wrap gap-3">
          <ActionLink action={action} />
          <PrimaryAction href={LIFE_SUPPLY_ROUTES.news}>All resources</PrimaryAction>
        </Reveal>
      </section>
    </LifeSupplyLayout>
  );
}
