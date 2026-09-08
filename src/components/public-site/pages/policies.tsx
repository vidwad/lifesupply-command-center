import { ActionLink } from "@/components/public-site/action-link";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import { PublicHero } from "@/components/public-site/lifesupply-primitives";
import { Reveal } from "@/components/public-site/motion";
import type { ActionKey } from "@/lib/public-site/actions";
import { policies, type PolicyKey } from "@/lib/public-site/content/policies";

/** `/privacy/`, `/terms/`, `/accessibility/` — one template, three statements of current behaviour. */
export function PolicyPage({ policy }: { policy: PolicyKey }) {
  const p = policies[policy];
  return (
    <LifeSupplyLayout>
      <PublicHero eyebrow={p.eyebrow} title={p.title} description={p.intro} />
      <section className="mx-auto max-w-3xl px-5 py-20 lg:px-8">
        <Reveal className="lsh-display border-l-4 border-[var(--lsh-brand-red)] pl-4 text-[10px] text-[var(--lsh-muted)]">
          Effective {p.effective}
        </Reveal>
        <div className="mt-10 grid gap-10">
          {p.sections.map((section) => (
            <Reveal key={section.title} as="section">
              <h2 className="lsh-display text-2xl text-[var(--lsh-charcoal)]">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-4 leading-7 text-[var(--lsh-muted)]">
                  {paragraph}
                </p>
              ))}
              {"items" in section && section.items ? (
                <ul className="mt-4 grid gap-2 text-sm leading-6 text-[var(--lsh-charcoal)]">
                  {section.items.map((item) => (
                    <li key={item} className="border-l-2 border-[var(--lsh-brand-red)] pl-3">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-12 border-t border-[var(--lsh-rule)] pt-8">
          <ActionLink action={p.action as ActionKey} />
        </Reveal>
      </section>
    </LifeSupplyLayout>
  );
}
