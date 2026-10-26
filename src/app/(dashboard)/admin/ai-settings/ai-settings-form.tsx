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

const OPENAI_IMAGE_MODELS = ["gpt-image-1.5", "gpt-image-1", "gpt-image-2"];

function EnvOverrideNote({ name, value }: { name: string; value: string | null }) {
  if (!value) return null;
  return (
    <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs">
      <strong>
        {name} is set in the environment ({value}).
      </strong>{" "}
      Env always wins. The saved setting is ignored until that env var is removed.
    </p>
  );
}

export function AiSettingsForm({
  values,
  envOverride,
  openAiEnv,
  openAiDefaults,
}: {
  values: {
    "ai.default_provider": string;
    "ai.default_model": string;
    "ai.max_output_tokens": string;
    "ai.temperature": string;
    "ai.openai_model": string;
    "ai.openai_image_model": string;
  };
  envOverride: string | null;
  /** The OpenAI env overrides, when set on the server. */
  openAiEnv: { model: string | null; imageModel: string | null };
  /** What each OpenAI field falls back to when left empty. */
  openAiDefaults: { model: string; imageModel: string };
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
              Anthropic is wired end-to-end for the analysis features. Product Studio always uses
              OpenAI, configured below.
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

      {/*
       * Product Studio's OpenAI models (product owner, 2026-10-26). Before
       * this the image model could only be set with an environment variable.
       */}
      <section className="space-y-4 rounded-md border bg-card p-4">
        <h2 className="text-sm font-medium">Product Studio (OpenAI)</h2>
        <p className="text-xs text-muted-foreground">
          The text model runs retailer research, image QA and description reformatting. The image
          model generates the drafts. Leave a field empty to fall back: the text model to the
          default model above when the provider is OpenAI, otherwise to {openAiDefaults.model}; the
          image model to {openAiDefaults.imageModel}.
        </p>
        <EnvOverrideNote name="OPENAI_MODEL" value={openAiEnv.model} />
        <EnvOverrideNote name="OPENAI_IMAGE_MODEL" value={openAiEnv.imageModel} />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ai.openai_model">Text model</Label>
            <Input
              id="ai.openai_model"
              name="ai.openai_model"
              defaultValue={values["ai.openai_model"]}
              placeholder={openAiDefaults.model}
              list="openai-model-suggestions"
              autoComplete="off"
            />
            <datalist id="openai-model-suggestions">
              {COMMON_MODELS.openai?.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
            <p className="text-xs text-muted-foreground">
              Must support the Responses API with web search and structured output.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ai.openai_image_model">Image model</Label>
            <Input
              id="ai.openai_image_model"
              name="ai.openai_image_model"
              defaultValue={values["ai.openai_image_model"]}
              placeholder={openAiDefaults.imageModel}
              list="openai-image-model-suggestions"
              autoComplete="off"
            />
            <datalist id="openai-image-model-suggestions">
              {OPENAI_IMAGE_MODELS.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
            <p className="text-xs text-muted-foreground">
              gpt-image-1 and gpt-image-1.5 hold the draft to your photographs (high input fidelity)
              at 1024 px. gpt-image-2 renders at 2048 px but cannot use that setting, so expect more
              QA rejections on used or non-standard items.
            </p>
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
