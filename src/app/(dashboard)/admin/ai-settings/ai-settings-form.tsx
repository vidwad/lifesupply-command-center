"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { saveAiSettingsAction, type AiSettingsActionState } from "./actions";

const PROVIDERS = [
  { value: "anthropic", label: "Anthropic Claude" },
  { value: "openai", label: "OpenAI" },
] as const;

const COMMON_MODELS: Record<string, string[]> = {
  anthropic: ["claude-opus-4-7", "claude-sonnet-4-6", "claude-haiku-4-5-20251001"],
  openai: ["gpt-5", "gpt-5-mini", "gpt-4.1"],
};

export function AiSettingsForm({
  values,
  envOverride,
}: {
  values: {
    "ai.default_provider": string;
    "ai.default_model": string;
    "ai.max_output_tokens": string;
    "ai.temperature": string;
  };
  envOverride: string | null;
}) {
  const [state, formAction, pending] = useActionState<AiSettingsActionState, FormData>(
    saveAiSettingsAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-6">
      <section className="space-y-4 rounded-md border bg-card p-4">
        <h2 className="text-sm font-medium">Default model</h2>
        <p className="text-xs text-muted-foreground">
          Used by daily briefings, the AI Analyst, and opportunity analysis. Per-feature overrides
          are not exposed yet.
        </p>
        {envOverride && (
          <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs">
            <strong>ANTHROPIC_MODEL is set in the environment ({envOverride}).</strong> Env always
            wins. Saved settings here will be ignored until that env var is removed.
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ai.default_provider">Provider</Label>
            <select
              id="ai.default_provider"
              name="ai.default_provider"
              defaultValue={values["ai.default_provider"]}
              className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Today only Anthropic is wired end-to-end. OpenAI is reserved for Phase 2.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ai.default_model">Model name</Label>
            <Input
              id="ai.default_model"
              name="ai.default_model"
              defaultValue={values["ai.default_model"]}
              list="ai-model-suggestions"
              autoComplete="off"
            />
            <datalist id="ai-model-suggestions">
              {COMMON_MODELS[values["ai.default_provider"]]?.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
            <p className="text-xs text-muted-foreground">
              Use the exact model identifier from the provider (no auto-routing).
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ai.max_output_tokens">Max output tokens</Label>
            <Input
              id="ai.max_output_tokens"
              name="ai.max_output_tokens"
              type="number"
              min={64}
              max={32_000}
              defaultValue={values["ai.max_output_tokens"]}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ai.temperature">Temperature</Label>
            <Input
              id="ai.temperature"
              name="ai.temperature"
              type="number"
              min={0}
              max={2}
              step={0.1}
              defaultValue={values["ai.temperature"]}
            />
          </div>
        </div>
      </section>

      {state?.error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="text-sm text-success">
          {state.ok}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save AI settings"}
      </Button>
    </form>
  );
}
