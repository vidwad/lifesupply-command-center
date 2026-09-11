import { Eyebrow } from "@/components/public-site/lifesupply-primitives";

/**
 * The proposed supply model as a diagram: two lanes, four parts.
 *
 * Typeset from the model's own copy, in the way the Pharmacy Solutions
 * care-pathway diagram is (docs/website-asset-manifest.md: precise business
 * information is drawn as HTML, never generated as a picture). The left lane
 * is store purchasing, which operates today and is drawn with a solid rule;
 * the right lane is the two proposed services, drawn with a dashed rule so
 * the eye separates what exists from what is in development before a word is
 * read. A red bar between them is the one plan the parts would be
 * coordinated under. It is decorative and hidden from assistive technology;
 * the two lists carry the meaning.
 *
 * No motion, no client code, no colour outside the tokens.
 */
type Kind = "store" | "service";

type Model = {
  kinds: Record<Kind, { title: string; status: string }>;
  items: readonly { key: string; kind: Kind; title: string; summary: string }[];
};

const LANES: readonly Kind[] = ["store", "service"];

export function SupplyModelDiagram({ model }: { model: Model }) {
  return (
    <div className="relative grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:gap-0">
      {LANES.map((kind, index) => {
        const lane = model.kinds[kind];
        const proposed = kind === "service";
        return (
          <div key={kind} className={index === 1 ? "lg:col-start-3" : ""}>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Eyebrow as="h3">{lane.title}</Eyebrow>
              <span
                className={`lsh-display px-2 py-1 text-[10px] ${
                  proposed
                    ? "border border-dashed border-[var(--lsh-rule-strong)] text-[var(--lsh-muted)]"
                    : "border border-[var(--lsh-charcoal)] text-[var(--lsh-charcoal)]"
                }`}
              >
                {lane.status}
              </span>
            </div>
            <ul className="mt-4 grid gap-4">
              {model.items
                .filter((item) => item.kind === kind)
                .map((item) => (
                  <li
                    key={item.key}
                    className={`bg-[var(--lsh-paper)] p-5 ${
                      proposed
                        ? "border-2 border-dashed border-[var(--lsh-rule-strong)]"
                        : "border-2 border-[var(--lsh-charcoal)]"
                    }`}
                  >
                    <p className="lsh-display text-lg leading-tight text-[var(--lsh-charcoal)]">
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--lsh-muted)]">{item.summary}</p>
                  </li>
                ))}
            </ul>
          </div>
        );
      })}

      {/* The one plan the parts are coordinated under, between the lanes. */}
      <div
        aria-hidden="true"
        className="hidden lg:col-start-2 lg:row-start-1 lg:flex lg:w-40 lg:flex-col lg:items-center lg:justify-center lg:px-6"
      >
        <span className="block h-full w-1 bg-[var(--lsh-brand-red)]" />
        <span className="lsh-display mt-4 text-center text-[10px] leading-relaxed text-[var(--lsh-brand-red)]">
          One supply plan,
          <br />
          separate arrangements
        </span>
        <span className="mt-4 block h-full w-1 bg-[var(--lsh-brand-red)]" />
      </div>
    </div>
  );
}
