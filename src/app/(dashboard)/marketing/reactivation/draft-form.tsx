"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { draftCampaignAction, type DraftActionState } from "./actions";

const BUCKETS = [
  { value: "hot", label: "Hot — best odds (score ≥ 70)" },
  { value: "warm", label: "Warm — strong candidates (50–69)" },
  { value: "cold", label: "Cold — long-shot (30–49)" },
  { value: "deep_freeze", label: "Deep freeze (< 30)" },
];

export function CampaignDraftForm({ initialBucket }: { initialBucket?: string }) {
  const [state, formAction, pending] = useActionState<DraftActionState, FormData>(
    draftCampaignAction,
    undefined,
  );
  return (
    <form action={formAction} className="space-y-4 rounded-md border bg-card p-4">
      <div>
        <h2 className="text-sm font-medium">Draft a reactivation campaign with AI</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          The AI drafts an email body from your brief + the chosen audience bucket. The draft is
          saved as a Campaign in <code>draft</code> status. Approval is required before the
          campaign can be exported to Mailchimp.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Campaign name</Label>
          <Input id="name" name="name" required placeholder="e.g. Spring lapsed clinics" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="subject">Subject (optional)</Label>
          <Input
            id="subject"
            name="subject"
            placeholder="Leave blank to let the AI propose one"
            maxLength={120}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bucket">Audience bucket</Label>
          <select
            id="bucket"
            name="bucket"
            required
            defaultValue={initialBucket ?? "warm"}
            className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            {BUCKETS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="maxRecipients">Max recipients (cap)</Label>
          <Input
            id="maxRecipients"
            name="maxRecipients"
            type="number"
            min={1}
            max={5000}
            defaultValue={200}
          />
          <p className="text-[11px] text-muted-foreground">
            Keeps first sends conservative. Approver still sees the full snapshot.
          </p>
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="brief">Brief</Label>
          <textarea
            id="brief"
            name="brief"
            required
            rows={4}
            placeholder="Tell the AI what you want this campaign to say. Examples: 'Tell lapsed clinic customers we have new mobility-aid stock arriving in May.' or 'Welcome lapsed Wellmart retail buyers back with a free shipping offer.'"
            className="flex w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
      {state?.error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Drafting…" : "Draft campaign"}
      </Button>
    </form>
  );
}
