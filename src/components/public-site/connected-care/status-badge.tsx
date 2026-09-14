/**
 * A written status, with a treatment per kind so colour is never the only
 * signal: existing operations in charcoal, proposed in brand red, under
 * evaluation in a dashed red. Used on every node, the hub's foundation and
 * the technology band of the Connected Care diagram.
 */
export type StatusKind = "existing" | "proposed" | "evaluation";

const KIND: Record<StatusKind, string> = {
  existing: "border-[var(--lsh-charcoal)] text-[var(--lsh-charcoal)]",
  proposed: "border-[var(--lsh-brand-red)] text-[var(--lsh-brand-red)]",
  evaluation: "border-dashed border-[var(--lsh-brand-red)] text-[var(--lsh-brand-red)]",
};

export function StatusBadge({ label, kind }: { label: string; kind: StatusKind }) {
  return (
    <span
      className={`lsh-display inline-block border px-2 py-1 text-[9px] leading-tight ${KIND[kind]}`}
    >
      {label}
    </span>
  );
}
