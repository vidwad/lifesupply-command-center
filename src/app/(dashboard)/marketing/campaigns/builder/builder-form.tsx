"use client";

/**
 * Structured Campaign Builder form (Phase 5). The section numbering mirrors
 * the roadmap's 14 workflow sections; approval (12), Mailchimp export (13),
 * and performance tracking (14) happen on the created campaign records.
 */
import { useActionState } from "react";
import { Hammer, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { SequenceStep, StreamDefinition } from "@/server/services/marketing/campaign-streams";

import { buildProgramAction, type BuilderActionState } from "./actions";

type StreamPreview = StreamDefinition & { available: number };

type Props = {
  streams: StreamPreview[];
  defaultConsumerSequence: SequenceStep[];
  defaultB2bSequence: SequenceStep[];
};

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-md border bg-card p-4">
      <legend className="px-1 text-sm font-medium">
        {n}. {title}
      </legend>
      <div className="mt-1 space-y-2">{children}</div>
    </fieldset>
  );
}

function SequenceEditor({ prefix, steps }: { prefix: "consumer" | "b2b"; steps: SequenceStep[] }) {
  return (
    <div className="space-y-2">
      {steps.map((s, i) => (
        <div key={i} className="grid grid-cols-[70px_1fr] gap-2">
          <label className="text-xs">
            Day
            <Input
              name={`${prefix}Day${i}`}
              type="number"
              min={0}
              defaultValue={s.day}
              className="mt-1 h-8"
            />
          </label>
          <div className="space-y-1">
            <Input
              name={`${prefix}Subject${i}`}
              defaultValue={s.subject}
              placeholder="Subject (clear to drop this step)"
              className="h-8"
            />
            <Input
              name={`${prefix}Purpose${i}`}
              defaultValue={s.purpose}
              placeholder="Purpose"
              className="h-8 text-xs"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function BuilderForm({
  streams,
  defaultConsumerSequence,
  defaultB2bSequence,
}: Props): React.JSX.Element {
  const [state, formAction, pending] = useActionState<BuilderActionState, FormData>(
    buildProgramAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <Section n={1} title="Campaign objective">
        <Input name="name" placeholder="Program name — e.g. Fall Reactivation & Replenishment" />
        <textarea
          name="objective"
          rows={3}
          placeholder="What should this program achieve? (required)"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </Section>

      <Section n={2} title="Data source, cleanup & consent review (3–4)">
        <p className="text-xs text-muted-foreground">
          Audiences come from synced Command Center customers, filtered by the casl-v1 eligibility
          policy. Hard-suppressed customers are excluded before scanning; per-stream exclusion
          counts land in the program plan for the approver. Run the Mailchimp consent sync first so
          suppression is fresh.
        </p>
      </Section>

      <Section n={5} title="Audience streams">
        <div className="space-y-2">
          {streams.map((s) => (
            <label key={s.key} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                name={`stream_${s.key}`}
                defaultChecked={s.treatment !== "no_email" && s.available > 0}
                disabled={s.treatment === "no_email"}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium">{s.label}</span>{" "}
                <span className="tabular-nums text-muted-foreground">({s.available} eligible)</span>
                {s.requiresReview && (
                  <span className="ml-1 text-xs text-warning">consent review required</span>
                )}
                {s.treatment === "no_email" && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    never emailed — research only
                  </span>
                )}
                <span className="block text-xs text-muted-foreground">{s.description}</span>
              </span>
            </label>
          ))}
        </div>
        <label className="mt-2 flex items-center gap-2 text-xs">
          Max recipients per stream
          <Input
            name="maxPerStream"
            type="number"
            min={1}
            max={5000}
            defaultValue={500}
            className="h-8 w-24"
          />
        </label>
      </Section>

      <Section n={6} title="Product / category selection">
        <Input name="productFocus" placeholder="Product focus — e.g. wound care replenishment" />
        <Input name="categories" placeholder="Categories — e.g. Wound Care, PPE" />
      </Section>

      <Section n={7} title="Offer strategy">
        <Input name="offerStrategy" placeholder="e.g. 10% off reorders over $150, free shipping" />
        <Input name="offerCode" placeholder="Discount code (optional)" />
      </Section>

      <Section n={8} title="Consumer email sequence">
        <SequenceEditor prefix="consumer" steps={defaultConsumerSequence} />
      </Section>

      <Section n={9} title="B2B email sequence">
        <SequenceEditor prefix="b2b" steps={defaultB2bSequence} />
      </Section>

      <Section n={10} title="High-value account outreach">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="createHighValueTasks" defaultChecked />
          Create personal outreach tasks for high-value accounts (never bulk-emailed)
        </label>
      </Section>

      <Section n={11} title="Calendar & sequencing">
        <label className="text-xs">
          Program start date
          <Input name="startDate" type="date" className="mt-1 h-8 w-48" />
        </label>
        <p className="text-xs text-muted-foreground">
          Sequence day offsets are relative to this date. Approval (12), Mailchimp draft/export
          (13), and performance tracking (14) run on the created campaign records — export stays
          draft-only and approval-gated.
        </p>
      </Section>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? (
          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
        ) : (
          <Hammer className="mr-1 h-4 w-4" />
        )}
        Build program
      </Button>
    </form>
  );
}
