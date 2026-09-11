import { ChevronDown } from "lucide-react";

/**
 * The summary line of a native `details`: a label and a chevron that turns
 * when the fold is open. Pages may not reach into lucide for a glyph, so the
 * one interface affordance a fold needs lives here.
 */
export function FoldSummary({ label }: { label: string }) {
  return (
    <summary className="lsh-display flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[11px] text-[var(--lsh-charcoal)] transition-colors hover:text-[var(--lsh-brand-red)] [&::-webkit-details-marker]:hidden">
      {label}
      <ChevronDown
        size={16}
        aria-hidden="true"
        className="shrink-0 text-[var(--lsh-brand-red)] transition-transform duration-300 group-open:rotate-180 motion-reduce:transition-none"
      />
    </summary>
  );
}
