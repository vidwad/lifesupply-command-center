import { ChevronDown } from "lucide-react";

import { ActionLink } from "@/components/public-site/action-link";
import { DiagramIcon } from "@/components/public-site/connected-care/icons";
import { StatusBadge } from "@/components/public-site/connected-care/status-badge";
import type {
  ConnectedCareDiagram,
  DiagramNode,
} from "@/components/public-site/connected-care/types";
import type { ActionKey } from "@/lib/public-site/actions";

/**
 * One of the four nodes around the patient: a business that operates today
 * or a capability that is proposed, with its written status, its one-line
 * description, the relationship it has to the patient's needs, and a native
 * disclosure for the supporting detail and the link onward.
 *
 * Two controls, each doing one thing: the heading is a button that selects
 * the node (highlighting its connection and the capabilities that could
 * support it), and the disclosure is a `details` element, so the detail
 * opens with JavaScript unavailable and closes the same way.
 */
export function BusinessNode({
  node,
  labels,
  selected,
  highlighted,
  onSelect,
  ref,
}: {
  node: DiagramNode;
  labels: ConnectedCareDiagram["labels"];
  selected: boolean;
  highlighted: boolean;
  onSelect: (key: DiagramNode["key"]) => void;
  ref: React.Ref<HTMLElement>;
}) {
  const state = selected ? "selected" : highlighted ? "highlighted" : undefined;
  return (
    <article
      ref={ref}
      data-key={node.key}
      data-side={node.side}
      data-state={state}
      className="lsh-cc-node relative flex flex-col border border-[var(--lsh-rule-strong)] bg-[var(--lsh-paper)] p-5 shadow-sm transition-shadow data-[state=highlighted]:shadow-[0_0_0_2px_var(--lsh-brand-red)] data-[state=selected]:shadow-[0_0_0_3px_var(--lsh-brand-red)] lg:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center border border-[var(--lsh-rule-strong)] text-[var(--lsh-charcoal)]">
          <DiagramIcon name={node.icon} size={22} />
        </span>
        <StatusBadge label={node.status} kind={node.statusKind} />
      </div>
      <h3 className="mt-4">
        <button
          type="button"
          aria-pressed={selected}
          onClick={() => onSelect(node.key)}
          className="lsh-display min-h-11 text-left text-lg leading-tight text-[var(--lsh-charcoal)] underline-offset-4 transition-colors hover:text-[var(--lsh-brand-red)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--lsh-brand-red)]"
        >
          {node.title}
          <span className="sr-only">: {labels.select}</span>
        </button>
      </h3>
      {node.businesses ? (
        <ul aria-label={labels.businesses} className="mt-2 flex flex-wrap gap-1.5">
          {node.businesses.map((business) => (
            <li
              key={business}
              className="lsh-display border border-[var(--lsh-rule)] bg-[var(--lsh-surface)] px-2 py-1 text-[9px] text-[var(--lsh-charcoal)]"
            >
              {business}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 text-sm leading-6 text-[var(--lsh-muted)]">{node.text}</p>
      <dl className="mt-4 grid gap-1 border-t border-[var(--lsh-rule)] pt-3 text-[11px]">
        <div className="flex flex-wrap gap-x-2">
          <dt className="lsh-display text-[10px] text-[var(--lsh-muted)]">{labels.relationship}</dt>
          <dd className="lsh-display m-0 text-[10px] text-[var(--lsh-charcoal)]">
            {node.relationship}
          </dd>
        </div>
        {node.incoming ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="sr-only">{labels.relationship}</dt>
            <dd className="lsh-display m-0 text-[10px] text-[var(--lsh-brand-red)]">
              {node.incoming}
            </dd>
          </div>
        ) : null}
      </dl>
      <details className="lsh-cc-details group mt-auto pt-4">
        <summary className="lsh-display inline-flex min-h-11 cursor-pointer list-none items-center gap-2 text-[11px] text-[var(--lsh-brand-red)] transition-colors hover:text-[var(--lsh-red-hover)] [&::-webkit-details-marker]:hidden">
          {labels.viewRole}
          <ChevronDown
            size={14}
            aria-hidden="true"
            className="transition-transform group-open:rotate-180 motion-reduce:transition-none"
          />
        </summary>
        <p className="mt-2 text-sm leading-6 text-[var(--lsh-charcoal)]">{node.detail}</p>
        <div className="mt-4">
          <ActionLink action={node.link.action as ActionKey} variant="onLight">
            {node.link.label}
          </ActionLink>
        </div>
      </details>
    </article>
  );
}
