import { ActionLink } from "@/components/public-site/action-link";
import { LifeSupplyLayout } from "@/components/public-site/lifesupply-layout";
import { Container, Eyebrow, PublicHero } from "@/components/public-site/lifesupply-primitives";
import { Reveal } from "@/components/public-site/motion";
import { IconBadge } from "@/components/public-site/sections";
import type { ActionKey } from "@/lib/public-site/actions";
import { policies, type PolicyKey } from "@/lib/public-site/content/policies";

const POLICY_ICONS: Record<PolicyKey, string> = {
  privacy: "shield",
  terms: "scroll",
  accessibility: "users",
};

/** A stable in-page anchor from a section title. */
const anchor = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/** `/privacy/`, `/terms/`, `/accessibility/` — one template, three statements of current behaviour. */
export function PolicyPage({ policy }: { policy: PolicyKey }) {
  const p = policies[policy];
  return (
    <LifeSupplyLayout>
      <PublicHero eyebrow={p.eyebrow} title={p.title} description={p.intro} />
      <section className="py-20">
        <Container className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          {/* In-page contents, sticky on wide screens. */}
          <Reveal as="div" className="lg:sticky lg:top-28 lg:self-start">
            <div className="flex items-center gap-4">
              <IconBadge icon={POLICY_ICONS[policy]} />
              <p className="lsh-display text-[10px] text-[var(--lsh-muted)]">
                Effective {p.effective}
              </p>
            </div>
            <nav aria-label="On this page" className="mt-8">
              <Eyebrow as="h2">On this page</Eyebrow>
              <ol className="mt-4 grid gap-2 border-l-2 border-[var(--lsh-rule)]">
                {p.sections.map((section) => (
                  <li key={section.title}>
                    <a
                      href={`#${anchor(section.title)}`}
                      className="-ml-0.5 block border-l-2 border-transparent pl-4 text-sm leading-6 text-[var(--lsh-muted)] transition-colors hover:border-[var(--lsh-brand-red)] hover:text-[var(--lsh-charcoal)]"
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </Reveal>
          <div className="max-w-3xl">
            <div className="grid gap-12">
              {p.sections.map((section) => (
                <Reveal
                  key={section.title}
                  as="section"
                  className="scroll-mt-28 border-t border-[var(--lsh-rule)] pt-8"
                >
                  <h2
                    id={anchor(section.title)}
                    className="lsh-display text-2xl text-[var(--lsh-charcoal)]"
                  >
                    {section.title}
                  </h2>
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
          </div>
        </Container>
      </section>
    </LifeSupplyLayout>
  );
}
