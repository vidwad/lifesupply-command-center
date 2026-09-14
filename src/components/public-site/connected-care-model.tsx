"use client";

import { useId, useState } from "react";

/**
 * The connected-care model on Connected Care Vision (product owner,
 * 2026-09-13): the person at the centre, six participants around them, and
 * for the selected participant what it would do, what it would need, who
 * remains responsible, and whether the capability exists today or is
 * proposed.
 *
 * Every participant's detail is in the document; selecting one sets `hidden`
 * on the others. With JavaScript disabled all six stack under the ring,
 * which is also a readable presentation. The four visual treatments
 * (clinical care, pharmacy services, supply operations, technology) are
 * border styles on the participant buttons and their panels, so the
 * distinction survives in black and white and in print. Nothing here is a
 * funnel: the participants sit in a ring, not a line, and the copy comes from
 * the content model.
 */
export interface Participant {
  key: string;
  group: string;
  title: string;
  role: string;
  needs: string;
  responsible: string;
  status: string;
  distinction: string;
}

/** Border treatments by participant group; access and support share the clinical and supply treatments respectively. */
const TREATMENT: Record<string, string> = {
  clinical: "border-l-4 border-[var(--lsh-brand-red)]",
  access: "border-l-4 border-[var(--lsh-brand-red)]",
  pharmacy: "border-l-4 border-[var(--lsh-charcoal)]",
  supply: "border-l-4 border-double border-[var(--lsh-charcoal)]",
  support: "border-l-4 border-double border-[var(--lsh-charcoal)]",
  technology: "border-l-4 border-dashed border-[var(--lsh-charcoal)]",
};

/** Grid placement on wide screens: a ring of six around the centre column. */
const PLACE = [
  "lg:col-start-1 lg:row-start-1",
  "lg:col-start-3 lg:row-start-1",
  "lg:col-start-1 lg:row-start-2",
  "lg:col-start-3 lg:row-start-2",
  "lg:col-start-1 lg:row-start-3",
  "lg:col-start-3 lg:row-start-3",
];

function StatusChip({ value }: { value: string }) {
  const proposed = /proposed|evaluation|development|independent/i.test(value);
  return (
    <span
      className={`lsh-display inline-block border px-2 py-1 text-[9px] leading-tight ${
        proposed
          ? "border-[var(--lsh-brand-red)] text-[var(--lsh-brand-red)]"
          : "border-[var(--lsh-rule-strong)] text-[var(--lsh-muted)]"
      }`}
    >
      {value}
    </span>
  );
}

export function ConnectedCareModel({
  selectLabel,
  centre,
  groups,
  labels,
  participants,
}: {
  selectLabel: string;
  centre: { title: string; text: string };
  groups: Readonly<Record<string, string>>;
  labels: { role: string; needs: string; responsible: string; status: string; distinction: string };
  participants: readonly Participant[];
}) {
  const [selected, setSelected] = useState(participants[0]?.key ?? "");
  const id = useId();
  return (
    <div data-connected-care className="grid gap-8">
      {/* The ring: the person in the centre column, six participants around them. */}
      <div
        role="group"
        aria-label={selectLabel}
        className="grid gap-3 lg:grid-cols-[1fr_minmax(14rem,0.8fr)_1fr] lg:grid-rows-3 lg:gap-4"
      >
        <div className="flex flex-col items-center justify-center border border-[var(--lsh-rule-strong)] bg-[var(--lsh-charcoal)] px-6 py-8 text-center text-white lg:col-start-2 lg:row-span-3 lg:row-start-1">
          <span
            aria-hidden="true"
            className="lsh-display inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-[var(--lsh-red-on-ink)] text-[var(--lsh-red-on-ink)]"
          >
            ●
          </span>
          <p className="lsh-display mt-4 text-lg">{centre.title}</p>
          <p className="mt-2 text-sm leading-6 text-white/75">{centre.text}</p>
        </div>
        {participants.map((participant, index) => {
          const pressed = participant.key === selected;
          return (
            <button
              key={participant.key}
              type="button"
              aria-pressed={pressed}
              aria-controls={`${id}-${participant.key}`}
              onClick={() => setSelected(participant.key)}
              className={`flex min-h-24 flex-col justify-center bg-[var(--lsh-paper)] px-5 py-4 text-left transition-colors ${TREATMENT[participant.group] ?? ""} ${
                pressed
                  ? "outline outline-2 outline-offset-0 outline-[var(--lsh-charcoal)]"
                  : "hover:bg-[var(--lsh-surface)]"
              } ${PLACE[index] ?? ""}`}
            >
              <span className="lsh-display text-[10px] text-[var(--lsh-muted)]">
                {groups[participant.group] ?? participant.group}
              </span>
              <span className="lsh-display mt-1 text-base leading-tight text-[var(--lsh-charcoal)]">
                {participant.title}
              </span>
              <span className="mt-2">
                <StatusChip value={participant.status} />
              </span>
            </button>
          );
        })}
      </div>

      {/* The selected participant's detail; every panel is in the document. */}
      <div aria-live="polite" className="grid gap-3">
        {participants.map((participant) => {
          const shown = participant.key === selected;
          return (
            <section
              key={participant.key}
              id={`${id}-${participant.key}`}
              hidden={!shown}
              className={`${shown ? "grid" : "hidden"} gap-6 bg-[var(--lsh-paper)] p-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12 lg:p-8 ${TREATMENT[participant.group] ?? ""}`}
            >
              <div>
                <p className="lsh-display text-[10px] text-[var(--lsh-muted)]">
                  {groups[participant.group] ?? participant.group}
                </p>
                <h3 className="lsh-display mt-2 text-2xl leading-tight text-[var(--lsh-charcoal)]">
                  {participant.title}
                </h3>
                <p className="lsh-display mt-4 text-[10px] text-[var(--lsh-brand-red)]">
                  {labels.status}
                </p>
                <p className="mt-2">
                  <StatusChip value={participant.status} />
                </p>
                <p className="lsh-display mt-5 text-[10px] text-[var(--lsh-brand-red)]">
                  {labels.distinction}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--lsh-charcoal)]">
                  {participant.distinction}
                </p>
              </div>
              <dl className="grid gap-4">
                {(
                  [
                    [labels.role, participant.role],
                    [labels.needs, participant.needs],
                    [labels.responsible, participant.responsible],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="border-t border-[var(--lsh-rule)] pt-3">
                    <dt className="lsh-display text-[10px] text-[var(--lsh-muted)]">{label}</dt>
                    <dd className="m-0 mt-1 leading-7 text-[var(--lsh-charcoal)]">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          );
        })}
      </div>
    </div>
  );
}
