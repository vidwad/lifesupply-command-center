import { DiagramIcon } from "@/components/public-site/connected-care/icons";
import { StatusBadge } from "@/components/public-site/connected-care/status-badge";
import type {
  ConnectedCareDiagram,
  DiagramCapability,
  Highlightable,
} from "@/components/public-site/connected-care/types";

/**
 * The technology foundation beneath the network: the proposed platform, its
 * status, and four capabilities as selectable functions. Selecting one
 * highlights the nodes it could support and shows one explanatory sentence.
 *
 * On a phone the wrapper dissolves (`display: contents`) so the header reads
 * directly after the patient hub and the capabilities after the four cards,
 * in the order the brief asks for; on wider screens it is one band.
 */
export function CapabilityDetails({
  id,
  capability,
  labels,
  names,
}: {
  id: string;
  capability: DiagramCapability | null;
  labels: ConnectedCareDiagram["labels"];
  names: (keys: readonly Highlightable[]) => string;
}) {
  return (
    <div
      id={id}
      aria-live="polite"
      className="mt-4 min-h-[4.5rem] border-t border-[var(--lsh-rule)] pt-4"
    >
      {capability ? (
        <>
          <p className="text-sm leading-6 text-[var(--lsh-charcoal)]">{capability.note}</p>
          <p className="lsh-display mt-2 text-[10px] text-[var(--lsh-muted)]">
            {labels.supports}{" "}
            <span className="text-[var(--lsh-charcoal)]">{names(capability.supports)}</span>
          </p>
        </>
      ) : (
        <p className="text-sm leading-6 text-[var(--lsh-muted)]">{labels.capabilitiesTitle}</p>
      )}
    </div>
  );
}

export function TechnologyFoundation({
  technology,
  labels,
  selectedCapability,
  highlightedCapabilities,
  onSelect,
  detailsId,
  names,
  ref,
}: {
  technology: ConnectedCareDiagram["technology"];
  labels: ConnectedCareDiagram["labels"];
  selectedCapability: string | null;
  highlightedCapabilities: ReadonlySet<string>;
  onSelect: (key: string) => void;
  detailsId: string;
  names: (keys: readonly Highlightable[]) => string;
  ref: React.Ref<HTMLDivElement>;
}) {
  const selected = technology.capabilities.find((c) => c.key === selectedCapability) ?? null;
  return (
    <div className="lsh-cc-tech">
      <div
        ref={ref}
        className="lsh-cc-techhead border-t-4 border-[var(--lsh-charcoal)] bg-[var(--lsh-surface)] p-5 lg:p-6"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center border border-[var(--lsh-rule-strong)] bg-[var(--lsh-paper)] text-[var(--lsh-charcoal)]">
            <DiagramIcon name={technology.icon} size={22} />
          </span>
          <StatusBadge label={technology.status} kind={technology.statusKind} />
        </div>
        <h3 className="lsh-display mt-4 text-xl leading-tight text-[var(--lsh-charcoal)]">
          {technology.title}
        </h3>
        <p className="mt-3 text-sm leading-6 text-[var(--lsh-muted)]">{technology.text}</p>
      </div>
      <div className="lsh-cc-caps bg-[var(--lsh-surface)] p-5 lg:p-6">
        <ul className="grid gap-px bg-[var(--lsh-rule-strong)] sm:grid-cols-2 xl:grid-cols-4">
          {technology.capabilities.map((capability, index) => {
            const pressed = capability.key === selectedCapability;
            const on = highlightedCapabilities.has(capability.key);
            return (
              <li key={capability.key}>
                <button
                  type="button"
                  aria-pressed={pressed}
                  aria-controls={detailsId}
                  data-state={pressed ? "selected" : on ? "highlighted" : undefined}
                  onClick={() => onSelect(capability.key)}
                  className="flex h-full min-h-11 w-full flex-col bg-[var(--lsh-paper)] p-4 text-left transition-shadow hover:bg-[var(--lsh-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--lsh-brand-red)] data-[state=highlighted]:shadow-[inset_0_0_0_2px_var(--lsh-brand-red)] data-[state=selected]:shadow-[inset_0_0_0_3px_var(--lsh-brand-red)]"
                >
                  <span className="lsh-display text-[10px] text-[var(--lsh-brand-red)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="lsh-display mt-2 text-base leading-tight text-[var(--lsh-charcoal)]">
                    {capability.title}
                  </span>
                  <span className="mt-2 text-sm leading-6 text-[var(--lsh-muted)]">
                    {capability.text}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <CapabilityDetails id={detailsId} capability={selected} labels={labels} names={names} />
      </div>
    </div>
  );
}
