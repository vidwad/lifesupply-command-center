import { Reveal } from "@/components/public-site/motion";

/**
 * Supplier onboarding, as four stages: Introduce, Review, Agree, List.
 *
 * Built from real HTML and CSS. Every stage's number, name and sentence is in
 * the document and visible without hover, without a click and without
 * JavaScript; the only thing motion adds is the order the four arrive in, and
 * `Reveal` collapses that under a reduced-motion preference.
 *
 * The connector is a decorative rule behind the numbers on desktop, drawn with
 * a background line rather than an image, and it is hidden from assistive
 * technology. On a narrow screen the stages stack and the rule runs down the
 * left of the numbers instead.
 *
 * It explains how an introduction is handled. It is not a tracker: nothing
 * here shows the state of a real submission, and reaching stage four is not
 * something a visitor's enquiry has done.
 */
export function SupplierProcess({
  title,
  steps,
}: {
  title: string;
  steps: readonly { index: string; title: string; text: string }[];
}) {
  return (
    <div>
      <h3 className="lsh-display text-2xl leading-tight text-[var(--lsh-charcoal)]">{title}</h3>
      <ol className="relative mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {/* The connector: one rule across the row of numbers on desktop. */}
        <span
          aria-hidden="true"
          className="absolute left-0 right-0 top-5 hidden h-px bg-[var(--lsh-rule-strong)] lg:block"
        />
        {steps.map((step, index) => (
          <Reveal
            key={step.index}
            as="li"
            delay={index * 0.06}
            className="relative flex flex-col pl-16 lg:pl-0"
          >
            {/* On mobile the rule runs down the left of the numbers. */}
            <span
              aria-hidden="true"
              className={`absolute left-5 top-10 w-px bg-[var(--lsh-rule-strong)] lg:hidden ${
                index === steps.length - 1 ? "h-0" : "h-[calc(100%+2.5rem)]"
              }`}
            />
            <span className="lsh-display absolute left-0 top-0 grid h-10 w-10 place-items-center rounded-full border-2 border-[var(--lsh-brand-red)] bg-[var(--lsh-paper)] text-[12px] text-[var(--lsh-brand-red)] lg:static lg:h-10 lg:w-10">
              {step.index}
            </span>
            <h4 className="lsh-display text-xl leading-tight text-[var(--lsh-charcoal)] lg:mt-6">
              {step.title}
            </h4>
            <p className="mt-2 text-sm leading-6 text-[var(--lsh-muted)]">{step.text}</p>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}
