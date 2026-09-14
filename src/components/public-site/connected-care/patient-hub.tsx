import { DiagramIcon } from "@/components/public-site/connected-care/icons";
import type { ConnectedCareDiagram } from "@/components/public-site/connected-care/types";

/**
 * The centre of the Connected Care diagram: the patient's needs, set on
 * charcoal so it is the most prominent element in every layout. It is the
 * first thing read on a phone and the middle of the network on a desktop.
 */
export function PatientHub({
  hub,
  highlighted,
  ref,
}: {
  hub: ConnectedCareDiagram["hub"];
  highlighted: boolean;
  ref: React.Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={ref}
      data-key="hub"
      data-state={highlighted ? "highlighted" : undefined}
      className="lsh-cc-hub relative flex flex-col items-center justify-center bg-[var(--lsh-charcoal)] px-7 py-10 text-center text-white transition-shadow data-[state=highlighted]:shadow-[0_0_0_3px_var(--lsh-brand-red)]"
    >
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-[var(--lsh-red-on-ink)] text-[var(--lsh-red-on-ink)]">
        <DiagramIcon name={hub.icon} size={30} />
      </span>
      <h3 className="lsh-display mt-5 text-2xl leading-tight">{hub.title}</h3>
      <p className="lsh-display mt-2 text-[11px] tracking-wide text-[var(--lsh-red-on-ink)]">
        {hub.tagline}
      </p>
      <p className="mt-4 max-w-xs text-sm leading-6 text-white/80">{hub.text}</p>
    </div>
  );
}
