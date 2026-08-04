"use client";

/**
 * Manual performance-metrics entry (Phase 5 §14). A Mailchimp metric read
 * sync can supersede this later; manual load keeps tracking usable now.
 */
import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { recordMetricsAction, type CampaignActionState } from "./actions";

const FIELDS = [
  { name: "sentCount", label: "Sent" },
  { name: "openCount", label: "Opens" },
  { name: "clickCount", label: "Clicks" },
  { name: "conversionCount", label: "Conversions" },
  { name: "attributedRevenue", label: "Attributed $" },
  { name: "unsubscribeCount", label: "Unsubs" },
  { name: "bounceCount", label: "Bounces" },
] as const;

export function MetricsForm({ campaignId }: { campaignId: string }): React.JSX.Element {
  const [state, formAction, pending] = useActionState<CampaignActionState, FormData>(
    recordMetricsAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="campaignId" value={campaignId} />
      <div className="grid grid-cols-2 gap-2">
        {FIELDS.map((f) => (
          <label key={f.name} className="text-xs">
            {f.label}
            <Input
              name={f.name}
              type="number"
              min={0}
              step={f.name === "attributedRevenue" ? "0.01" : "1"}
              defaultValue={0}
              className="mt-1 h-8"
            />
          </label>
        ))}
      </div>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
      {state?.ok && <p className="text-xs text-success">{state.ok}</p>}
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
        Record metrics
      </Button>
    </form>
  );
}
