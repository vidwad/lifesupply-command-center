"use client";

import { useId, useState } from "react";

/**
 * An illustrative supply portal on Medical Supply Solutions (product owner,
 * 2026-09-13): what a dedicated ordering portal for a clinic or healthcare
 * organization could show, as three views a visitor can switch between.
 *
 * It is a concept, and it says so. The label above it never leaves the
 * screen, the demonstration data is invented here rather than read from any
 * system, no person or patient appears, no amount of money is shown, and
 * there is no control that would act on an order. The location switch and
 * the view tabs are the only interaction, and both are real buttons that
 * change what the concept displays; nothing is a disabled or decorative
 * form control.
 *
 * Every view is in the document; the tabs set `hidden` on the two not
 * selected. With JavaScript disabled all three stack, which is also a
 * readable presentation.
 */
const VIEW_KEYS = ["catalogue", "purchasing", "reporting"] as const;
type ViewKey = (typeof VIEW_KEYS)[number];

const LOCATIONS = [
  { key: "north", label: "North clinic" },
  { key: "east", label: "East clinic" },
] as const;
type LocationKey = (typeof LOCATIONS)[number]["key"];

/** Fictional demonstration data, by location. Units, counts, and statuses only. */
const DEMO = {
  north: {
    catalogue: [
      { name: "Nitrile examination gloves, medium", unit: "Box of 100", status: "Approved" },
      { name: "Sterile gauze sponges, 10 × 10 cm", unit: "Pack of 50", status: "Approved" },
      { name: "Digital thermometer probe covers", unit: "Box of 500", status: "Approved" },
      { name: "Adhesive wound dressings, assorted", unit: "Box of 40", status: "Approved" },
      { name: "Alcohol prep pads", unit: "Box of 200", status: "Approved" },
      { name: "Rollator, standard", unit: "Each", status: "Needs approval" },
    ],
    lists: [
      { name: "Weekly consumables", items: "6 items" },
      { name: "Monthly wound care", items: "4 items" },
      { name: "Opening stock, treatment room 2", items: "18 items" },
    ],
    approvals: [
      { ref: "Request 118", by: "Front desk", items: "3 items", status: "Awaiting approval" },
      { ref: "Request 117", by: "Treatment room 2", items: "1 item", status: "Approved" },
    ],
    history: [
      { ref: "Order 1042", when: "Week 36", items: "6 items", status: "Delivered" },
      { ref: "Order 1039", when: "Week 35", items: "4 items", status: "Delivered" },
      { ref: "Order 1037", when: "Week 34", items: "5 items", status: "1 item backordered" },
    ],
    reminders: [
      { item: "Examination gloves, medium", note: "Review in 6 days" },
      { item: "Gauze sponges", note: "Review in 12 days" },
      { item: "Probe covers", note: "Reorder point reached" },
    ],
    totals: [
      { label: "Orders this quarter", value: "27" },
      { label: "Order lines", value: "164" },
      { label: "Lines backordered", value: "3" },
    ],
    byCategory: [
      { label: "Clinic consumables", share: 42 },
      { label: "Wound care", share: 23 },
      { label: "Monitoring accessories", share: 18 },
      { label: "Mobility", share: 11 },
      { label: "Other", share: 6 },
    ],
  },
  east: {
    catalogue: [
      { name: "Nitrile examination gloves, small", unit: "Box of 100", status: "Approved" },
      { name: "Sterile gauze sponges, 5 × 5 cm", unit: "Pack of 100", status: "Approved" },
      { name: "Blood-pressure cuff, adult", unit: "Each", status: "Approved" },
      { name: "Adhesive wound dressings, assorted", unit: "Box of 40", status: "Approved" },
      { name: "Paper cups", unit: "Sleeve of 100", status: "Approved" },
      { name: "Shower chair", unit: "Each", status: "Needs approval" },
    ],
    lists: [
      { name: "Weekly consumables", items: "5 items" },
      { name: "Monitoring accessories", items: "3 items" },
    ],
    approvals: [
      { ref: "Request 64", by: "Reception", items: "2 items", status: "Awaiting approval" },
    ],
    history: [
      { ref: "Order 611", when: "Week 36", items: "5 items", status: "Delivered" },
      { ref: "Order 608", when: "Week 34", items: "3 items", status: "Delivered" },
    ],
    reminders: [
      { item: "Examination gloves, small", note: "Review in 9 days" },
      { item: "Blood-pressure cuff", note: "No action needed" },
    ],
    totals: [
      { label: "Orders this quarter", value: "15" },
      { label: "Order lines", value: "71" },
      { label: "Lines backordered", value: "0" },
    ],
    byCategory: [
      { label: "Clinic consumables", share: 51 },
      { label: "Monitoring accessories", share: 24 },
      { label: "Wound care", share: 17 },
      { label: "Other", share: 8 },
    ],
  },
} as const;

const CELL = "px-4 py-3 text-sm leading-6";
const HEAD = "lsh-display px-4 py-2 text-left text-[10px] text-[var(--lsh-muted)]";

function Status({ value }: { value: string }) {
  const attention = /awaiting|needs|backordered|reorder/i.test(value);
  return (
    <span
      className={`lsh-display inline-block whitespace-nowrap border px-2 py-1 text-[9px] ${
        attention
          ? "border-[var(--lsh-brand-red)] text-[var(--lsh-brand-red)]"
          : "border-[var(--lsh-rule-strong)] text-[var(--lsh-muted)]"
      }`}
    >
      {value}
    </span>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 border border-[var(--lsh-rule)] bg-white">
      <h4 className="lsh-display border-b border-[var(--lsh-rule)] px-4 py-3 text-[11px] text-[var(--lsh-charcoal)]">
        {title}
      </h4>
      {children}
    </section>
  );
}

export function PortalConcept({
  label,
  note,
  viewsLabel,
  views,
}: {
  label: string;
  note: string;
  viewsLabel: string;
  views: readonly { key: string; label: string }[];
}) {
  const [view, setView] = useState<ViewKey>("catalogue");
  const [location, setLocation] = useState<LocationKey>("north");
  const id = useId();
  const data = DEMO[location];
  const here = LOCATIONS.find((option) => option.key === location)?.label ?? "";

  const onTabKey = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: VIEW_KEYS.length - 1,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const target = VIEW_KEYS[(next + VIEW_KEYS.length) % VIEW_KEYS.length] ?? "catalogue";
    setView(target);
    document.getElementById(`${id}-tab-${target}`)?.focus();
  };

  return (
    <div
      data-portal-concept
      className="border border-[var(--lsh-rule-strong)] bg-[var(--lsh-surface)]"
    >
      {/* The label, always visible, above everything the concept shows. */}
      <div className="flex flex-col gap-2 border-b border-[var(--lsh-rule-strong)] bg-[var(--lsh-charcoal)] px-5 py-4 text-white sm:flex-row sm:items-baseline sm:justify-between">
        <p className="lsh-display text-[11px] text-[var(--lsh-red-on-ink)]">{label}</p>
        <p className="text-xs text-white/70">{note}</p>
      </div>

      {/* The portal's own chrome: the location switch and the three views. */}
      <div className="flex flex-col gap-4 border-b border-[var(--lsh-rule)] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="lsh-display text-[10px] text-[var(--lsh-muted)]">Location</span>
          <div role="group" aria-label="Location" className="flex flex-wrap gap-2">
            {LOCATIONS.map((option) => {
              const pressed = option.key === location;
              return (
                <button
                  key={option.key}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => setLocation(option.key)}
                  className={`lsh-display min-h-10 border px-3 text-[10px] transition-colors ${
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
        </div>
        <div role="tablist" aria-label={viewsLabel} className="flex flex-wrap gap-x-1">
          {views.map((option, index) => {
            const key = option.key as ViewKey;
            const selected = key === view;
            return (
              <button
                key={key}
                id={`${id}-tab-${key}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`${id}-panel-${key}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setView(key)}
                onKeyDown={(event) => onTabKey(event, index)}
                className={`lsh-display min-h-11 border-b-2 px-3 text-[11px] transition-colors sm:px-4 ${
                  selected
                    ? "border-[var(--lsh-brand-red)] text-[var(--lsh-charcoal)]"
                    : "border-transparent text-[var(--lsh-muted)] hover:text-[var(--lsh-charcoal)]"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-5">
        {/* Catalogue: the approved list for this location, and the saved lists. */}
        <div
          id={`${id}-panel-catalogue`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-catalogue`}
          hidden={view !== "catalogue"}
          className={view === "catalogue" ? "grid gap-5 lg:grid-cols-[1.5fr_1fr]" : "hidden"}
        >
          <Block title={`Approved catalogue · ${here}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--lsh-rule)]">
                    <th scope="col" className={HEAD}>
                      Product
                    </th>
                    <th scope="col" className={`${HEAD} hidden sm:table-cell`}>
                      Unit
                    </th>
                    <th scope="col" className={HEAD}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--lsh-rule)]">
                  {data.catalogue.map((row) => (
                    <tr key={row.name}>
                      <td className={`${CELL} text-[var(--lsh-charcoal)]`}>{row.name}</td>
                      <td className={`${CELL} hidden text-[var(--lsh-muted)] sm:table-cell`}>
                        {row.unit}
                      </td>
                      <td className={CELL}>
                        <Status value={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Block>
          <Block title="Saved order lists">
            <ul className="divide-y divide-[var(--lsh-rule)]">
              {data.lists.map((list) => (
                <li key={list.name} className={`${CELL} flex justify-between gap-4`}>
                  <span className="text-[var(--lsh-charcoal)]">{list.name}</span>
                  <span className="shrink-0 text-[var(--lsh-muted)]">{list.items}</span>
                </li>
              ))}
            </ul>
          </Block>
        </div>

        {/* Purchasing: what is waiting, what has happened, what is due. */}
        <div
          id={`${id}-panel-purchasing`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-purchasing`}
          hidden={view !== "purchasing"}
          className={view === "purchasing" ? "grid gap-5 lg:grid-cols-3" : "hidden"}
        >
          <Block title="Approval queue">
            <ul className="divide-y divide-[var(--lsh-rule)]">
              {data.approvals.map((row) => (
                <li key={row.ref} className={CELL}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="lsh-display text-[11px] text-[var(--lsh-charcoal)]">
                      {row.ref}
                    </span>
                    <Status value={row.status} />
                  </div>
                  <p className="mt-1 text-[var(--lsh-muted)]">
                    {row.by} · {row.items}
                  </p>
                </li>
              ))}
            </ul>
          </Block>
          <Block title="Order history">
            <ul className="divide-y divide-[var(--lsh-rule)]">
              {data.history.map((row) => (
                <li key={row.ref} className={CELL}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="lsh-display text-[11px] text-[var(--lsh-charcoal)]">
                      {row.ref}
                    </span>
                    <Status value={row.status} />
                  </div>
                  <p className="mt-1 text-[var(--lsh-muted)]">
                    {row.when} · {row.items}
                  </p>
                </li>
              ))}
            </ul>
          </Block>
          <Block title="Replenishment reminders">
            <ul className="divide-y divide-[var(--lsh-rule)]">
              {data.reminders.map((row) => (
                <li key={row.item} className={`${CELL} flex items-baseline justify-between gap-3`}>
                  <span className="text-[var(--lsh-charcoal)]">{row.item}</span>
                  <Status value={row.note} />
                </li>
              ))}
            </ul>
          </Block>
        </div>

        {/* Reporting: activity counts and the share of ordering by category. */}
        <div
          id={`${id}-panel-reporting`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-reporting`}
          hidden={view !== "reporting"}
          className={view === "reporting" ? "grid gap-5 lg:grid-cols-[1fr_1.5fr]" : "hidden"}
        >
          <Block title={`Activity · ${here}`}>
            <dl className="divide-y divide-[var(--lsh-rule)]">
              {data.totals.map((row) => (
                <div
                  key={row.label}
                  className={`${CELL} flex items-baseline justify-between gap-3`}
                >
                  <dt className="text-[var(--lsh-muted)]">{row.label}</dt>
                  <dd className="lsh-display m-0 text-lg text-[var(--lsh-charcoal)]">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Block>
          <Block title="Spending summary, share by category">
            <dl className="grid gap-3 px-4 py-4">
              {data.byCategory.map((row) => (
                <div key={row.label} className="grid grid-cols-[9rem_1fr_3rem] items-center gap-3">
                  <dt className="text-sm text-[var(--lsh-charcoal)]">{row.label}</dt>
                  <dd className="m-0">
                    <span
                      aria-hidden="true"
                      className="block h-3 bg-[var(--lsh-charcoal)]"
                      style={{ width: `${row.share}%` }}
                    />
                  </dd>
                  <dd className="lsh-display m-0 text-right text-sm tabular-nums text-[var(--lsh-charcoal)]">
                    {row.share}%
                  </dd>
                </div>
              ))}
            </dl>
          </Block>
        </div>
      </div>
    </div>
  );
}
