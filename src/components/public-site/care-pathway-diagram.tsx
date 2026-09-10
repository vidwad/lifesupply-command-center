/**
 * Hub-and-spoke diagram for the Pharmacy Solutions value block, typeset from
 * the section's own copy (design and geometry drafted with Codex,
 * 2026-09-09; it replaced a generated raster whose text was pixels).
 *
 * Desktop: a brand-red hub in a fixed 14rem middle track, four cards in the
 * outer tracks of a two-row grid with equal rows, and straight connectors
 * in an SVG layer that shares the grid's area and the same 14rem track.
 * Equal rows put each card's centre at 25% and 75% of the grid height,
 * which is where each line starts; every line runs to the hub's centre and
 * the hub masks its inner part, so the joins hold however long the
 * descriptions grow. The 11rem hub has a radius of 5.5rem; its four
 * diagonal attachment points are offset 5.5 / sqrt(2), about 3.889rem, from
 * its centre. Keep the hub width, the middle track, and those offsets in
 * step. Below lg everything follows document flow: hub, a short red stem,
 * then the cards as a list beside a red rule.
 *
 * A semantic list keeps every description selectable and navigable; the
 * connectors and stem are decorative and hidden from assistive technology.
 * No motion, no client code, no colour outside the tokens.
 */
type CarePathwayDiagramProps = {
  centre: { title: string; subtitle: string };
  items: readonly { title: string; text: string }[];
};

const CARD_POSITIONS = [
  "lg:col-start-1 lg:row-start-1",
  "lg:col-start-3 lg:row-start-1",
  "lg:col-start-1 lg:row-start-2",
  "lg:col-start-3 lg:row-start-2",
] as const;

const CONNECTORS = [
  { from: [0, 25], dot: "left-[calc(50%-3.889rem)] top-[calc(50%-3.889rem)]" },
  { from: [100, 25], dot: "left-[calc(50%+3.889rem)] top-[calc(50%-3.889rem)]" },
  { from: [0, 75], dot: "left-[calc(50%-3.889rem)] top-[calc(50%+3.889rem)]" },
  { from: [100, 75], dot: "left-[calc(50%+3.889rem)] top-[calc(50%+3.889rem)]" },
] as const;

export function CarePathwayDiagram({ centre, items }: CarePathwayDiagramProps) {
  // The hub layout is drawn for exactly four cards; any other count flows as a plain list.
  const hub = items.length === 4;
  return (
    <div
      role="group"
      aria-label={`${centre.title}, connected to: ${items.map((item) => item.title).join(", ")}`}
      className={`min-w-0 border border-[var(--lsh-rule)] bg-[var(--lsh-surface)] p-5 [background-image:radial-gradient(rgba(29,29,29,0.08)_1px,transparent_1px)] [background-size:16px_16px] sm:p-8 ${
        hub ? "lg:grid lg:grid-cols-1" : ""
      }`}
    >
      <div
        className={`relative z-10 mx-auto flex aspect-square w-44 flex-col items-center justify-center rounded-full bg-[var(--lsh-brand-red)] px-5 text-center text-[var(--lsh-paper)] shadow-lg shadow-black/20 [overflow-wrap:anywhere] ${
          hub ? "lg:col-start-1 lg:row-start-1 lg:self-center lg:justify-self-center" : ""
        }`}
      >
        <p className="lsh-display text-lg leading-tight">{centre.title}</p>
        <p className="mt-2 text-xs leading-5 text-white/85">{centre.subtitle}</p>
      </div>

      <div
        aria-hidden="true"
        className={`mx-auto h-8 w-px bg-[var(--lsh-brand-red)] ${hub ? "lg:hidden" : ""}`}
      />

      {hub ? (
        <div
          aria-hidden="true"
          className="pointer-events-none relative z-0 hidden w-56 lg:col-start-1 lg:row-start-1 lg:block lg:self-stretch lg:justify-self-center"
        >
          <svg
            className="absolute inset-0 h-full w-full stroke-[var(--lsh-charcoal)] opacity-30"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            fill="none"
          >
            {CONNECTORS.map(({ from }) => (
              <line
                key={from.join()}
                x1={from[0]}
                y1={from[1]}
                x2={50}
                y2={50}
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
          {CONNECTORS.map(({ dot }) => (
            <span
              key={dot}
              className={`absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--lsh-brand-red)] ring-2 ring-[var(--lsh-surface)] ${dot}`}
            />
          ))}
        </div>
      ) : null}

      <ul
        className={`relative z-0 grid min-w-0 grid-cols-1 gap-4 border-l-2 border-[var(--lsh-brand-red)] py-2 pl-4 sm:grid-cols-2 sm:pl-5 ${
          hub
            ? "lg:col-start-1 lg:row-start-1 lg:grid-cols-[minmax(0,1fr)_14rem_minmax(0,1fr)] lg:grid-rows-[repeat(2,minmax(15rem,1fr))] lg:gap-0 lg:border-0 lg:p-0"
            : ""
        }`}
      >
        {items.map((item, index) => (
          <li
            key={item.title}
            className={`lsh-lift relative min-w-0 border border-t-4 border-[var(--lsh-rule)] border-t-[var(--lsh-brand-red)] bg-[var(--lsh-paper)] p-5 shadow-sm [overflow-wrap:anywhere] sm:p-6 ${
              hub ? `lg:my-4 lg:self-center ${CARD_POSITIONS[index] ?? ""}` : ""
            }`}
          >
            <h3 className="lsh-display text-lg leading-tight text-[var(--lsh-charcoal)]">
              {item.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-[var(--lsh-muted)]">{item.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
