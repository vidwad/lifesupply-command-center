import { ArrowRight } from "lucide-react";

import { IconBadge } from "@/components/public-site/sections";
import { iconForTitle } from "@/lib/public-site/icon-map";

/**
 * Starter equipment, consumables, occasional items: the three item roles as
 * a strip, read left to right in the order a program uses them.
 *
 * Typeset from the replenishment copy, with the same icons the pathway cards
 * use for the roles, so the strip and the cards agree. The arrows between
 * the three are decorative and hidden from assistive technology; the list
 * carries the meaning. No image is generated for this: a picture of a kit
 * would read as a kit that exists, and none does.
 */
export function SupplyRolesDiagram({
  roles,
}: {
  roles: readonly { role: string; title: string; when: string; text: string }[];
}) {
  return (
    <ol className="grid gap-6 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch md:gap-4">
      {roles.map((item, index) => (
        <li key={item.role} className="contents">
          <div className="flex flex-col border-t-4 border-[var(--lsh-brand-red)] bg-[var(--lsh-paper)] p-5">
            <div className="flex items-start justify-between gap-3">
              <IconBadge icon={iconForTitle(item.role)} size={18} />
              <span className="lsh-display border border-[var(--lsh-rule-strong)] px-2 py-1 text-[10px] text-[var(--lsh-muted)]">
                {item.when}
              </span>
            </div>
            <p className="lsh-display mt-4 text-lg leading-tight text-[var(--lsh-charcoal)]">
              {item.title}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--lsh-muted)]">{item.text}</p>
          </div>
          {index < roles.length - 1 ? (
            <span
              aria-hidden="true"
              className="hidden items-center justify-center text-[var(--lsh-brand-red)] md:flex"
            >
              <ArrowRight size={20} />
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
