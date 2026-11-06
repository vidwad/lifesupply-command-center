"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OpenAiModelListing } from "@/server/integrations/openai/models";

import { saveAiSettingsAction, type AiSettingsActionState } from "./actions";

const COMMON_MODELS: Record<string, string[]> = {
  openai: ["gpt-5", "gpt-5-mini", "gpt-4.1"],
};

const OPENAI_IMAGE_MODELS = ["gpt-image-1.5", "gpt-image-1", "gpt-image-2"];
const OPENAI_REALTIME_MODELS = ["gpt-live-1"];
const OPENAI_TRANSCRIBE_MODELS = ["gpt-4o-mini-transcribe", "gpt-4o-transcribe", "whisper-1"];

export type AiSettingsValues = {
  "ai.default_model": string;
  "ai.max_output_tokens": string;
  "ai.temperature": string;
  "ai.openai_model": string;
  "ai.openai_image_model": string;
  "ai.openai_realtime_model": string;
  "ai.openai_realtime_voice": string;
  "ai.openai_transcribe_model": string;
  "ai.budget.daily_usd": string;
  "ai.budget.daily_usd_per_user": string;
  "ai.budget.daily_voice_minutes": string;
  "ai.budget.daily_voice_minutes_per_user": string;
  "ai.budget.voice_session_max_minutes": string;
};

/**
 * The models the configured key can use, under a field (2026-10-26). A
 * click fills the field; the current value is highlighted. When the list
 * could not be fetched, the static suggestions stand in and the reason is
 * shown, so the page never pretends to know what the account has.
 */
function ModelChoices({
  listing,
  kind,
  fallback,
  value,
  onPick,
}: {
  listing: OpenAiModelListing;
  kind: "text" | "image" | "realtime" | "transcription";
  fallback: readonly string[];
  value: string;
  onPick: (model: string) => void;
}) {
  const ids = listing.ok ? listing.choices[kind] : fallback;
  return (
    <div className="space-y-1">
      <p className="text-[11px] text-muted-foreground">
        {listing.ok
          ? ids.length > 0
            ? "Available on your OpenAI account:"
            : `No ${kind} models of a supported family are on this account.`
          : `Could not list the account's models (${listing.reason}). Common choices:`}
      </p>
      {ids.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {ids.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onPick(id)}
              aria-pressed={value === id}
              className={
                value === id
                  ? "rounded-md border border-primary bg-primary px-2 py-0.5 font-mono text-[11px] text-primary-foreground"
                  : "rounded-md border bg-background px-2 py-0.5 font-mono text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground"
              }
            >
              {id}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

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

function BudgetField({
  id,
  label,
  defaultValue,
  hint,
  min = 0,
  max = 1_000_000,
  step = 1,
}: {
  id: keyof AiSettingsValues;
  label: string;
  defaultValue: string;
  hint: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type="number"
        min={min}
        max={max}
        step={step}
        inputMode="decimal"
        defaultValue={defaultValue}
      />
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export function AiSettingsForm({
  values,
  openAiEnv,
  openAiDefaults,
  openAiModels,
  voices,
}: {
  values: AiSettingsValues;
  /** The OpenAI env overrides, when set on the server. */
  openAiEnv: {
    model: string | null;
    imageModel: string | null;
    realtimeModel: string | null;
    realtimeVoice: string | null;
    transcribeModel: string | null;
  };
  /** What each OpenAI field falls back to when left empty. */
  openAiDefaults: {
    model: string;
    imageModel: string;
    realtimeModel: string;
    realtimeVoice: string;
    transcribeModel: string;
  };
  /** The models the configured OpenAI key can use, or why they could not be listed. */
  openAiModels: OpenAiModelListing;
  /** The built-in Realtime voices. */
  voices: readonly string[];
}) {
  const [state, formAction, pending] = useActionState<AiSettingsActionState, FormData>(
    saveAiSettingsAction,
    undefined,
  );
  const [textModel, setTextModel] = useState(values["ai.openai_model"]);
  const [imageModel, setImageModel] = useState(values["ai.openai_image_model"]);
  const [realtimeModel, setRealtimeModel] = useState(values["ai.openai_realtime_model"]);
  const [transcribeModel, setTranscribeModel] = useState(values["ai.openai_transcribe_model"]);

  return (
    <form action={formAction} className="space-y-6">
      <section className="space-y-4 rounded-md border bg-card p-4">
        <h2 className="text-sm font-medium">Default model</h2>
        <p className="text-xs text-muted-foreground">
          OpenAI is the only provider. This model runs the daily briefing, the AI Analyst,
          opportunity analysis, campaign and investor-update drafts, the agents and the
          assistant&apos;s text replies. Product Studio and live dialog have their own fields below.
        </p>
        <EnvOverrideNote name="OPENAI_MODEL" value={openAiEnv.model} />
        <div className="grid gap-4 md:grid-cols-2">
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
              {COMMON_MODELS.openai?.map((m) => (
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
          default model above, then to {openAiDefaults.model}; the image model to{" "}
          {openAiDefaults.imageModel}.
        </p>
        <EnvOverrideNote name="OPENAI_MODEL" value={openAiEnv.model} />
        <EnvOverrideNote name="OPENAI_IMAGE_MODEL" value={openAiEnv.imageModel} />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ai.openai_model">Text model</Label>
            <Input
              id="ai.openai_model"
              name="ai.openai_model"
              value={textModel}
              onChange={(event) => setTextModel(event.target.value)}
              placeholder={openAiDefaults.model}
              list="openai-model-suggestions"
              autoComplete="off"
            />
            <datalist id="openai-model-suggestions">
              {COMMON_MODELS.openai?.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
            <ModelChoices
              listing={openAiModels}
              kind="text"
              fallback={COMMON_MODELS.openai ?? []}
              value={textModel}
              onPick={setTextModel}
            />
            <p className="text-xs text-muted-foreground">
              Must support the Responses API with web search and structured output.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ai.openai_image_model">Image model</Label>
            <Input
              id="ai.openai_image_model"
              name="ai.openai_image_model"
              value={imageModel}
              onChange={(event) => setImageModel(event.target.value)}
              placeholder={openAiDefaults.imageModel}
              list="openai-image-model-suggestions"
              autoComplete="off"
            />
            <datalist id="openai-image-model-suggestions">
              {OPENAI_IMAGE_MODELS.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
            <ModelChoices
              listing={openAiModels}
              kind="image"
              fallback={OPENAI_IMAGE_MODELS}
              value={imageModel}
              onPick={setImageModel}
            />
            <p className="text-xs text-muted-foreground">
              gpt-image-1 and gpt-image-1.5 hold the draft to your photographs (high input fidelity)
              at 1024 px. gpt-image-2 renders at 2048 px but cannot use that setting, so expect more
              QA rejections on used or non-standard items.
            </p>
          </div>
        </div>
      </section>

      {/*
       * Live dialog (product owner, 2026-11-03; GPT-Live 2026-11-06). The
       * assistant drawer's voice mode runs on OpenAI's GPT-Live: the voice
       * model holds the spoken conversation and hands every question to the
       * text model, which calls the same read-only tools as text mode. These
       * pick the voice model, the voice, and the model that transcribes
       * dictation. Voice sessions also need the ai.live_voice feature flag,
       * so a model choice here never turns spending on by itself.
       */}
      <section className="space-y-4 rounded-md border bg-card p-4">
        <h2 className="text-sm font-medium">Live dialog (OpenAI GPT-Live)</h2>
        <p className="text-xs text-muted-foreground">
          The assistant drawer&apos;s voice mode. The GPT-Live model holds the spoken conversation,
          billed by the second, and hands every question about the business to the text model above,
          which calls the same read-only data tools as text mode. The transcription model turns
          dictation into text in the composer. Leave a field empty to fall back to{" "}
          {openAiDefaults.realtimeModel}, the {openAiDefaults.realtimeVoice} voice and{" "}
          {openAiDefaults.transcribeModel}. Voice sessions start only while the{" "}
          <code className="font-mono text-[11px]">ai.live_voice</code> feature flag is on.
        </p>
        <EnvOverrideNote name="OPENAI_REALTIME_MODEL" value={openAiEnv.realtimeModel} />
        <EnvOverrideNote name="OPENAI_REALTIME_VOICE" value={openAiEnv.realtimeVoice} />
        <EnvOverrideNote name="OPENAI_TRANSCRIBE_MODEL" value={openAiEnv.transcribeModel} />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ai.openai_realtime_model">Live voice model</Label>
            <Input
              id="ai.openai_realtime_model"
              name="ai.openai_realtime_model"
              value={realtimeModel}
              onChange={(event) => setRealtimeModel(event.target.value)}
              placeholder={openAiDefaults.realtimeModel}
              list="openai-realtime-model-suggestions"
              autoComplete="off"
            />
            <datalist id="openai-realtime-model-suggestions">
              {OPENAI_REALTIME_MODELS.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
            <ModelChoices
              listing={openAiModels}
              kind="realtime"
              fallback={OPENAI_REALTIME_MODELS}
              value={realtimeModel}
              onPick={setRealtimeModel}
            />
            <p className="text-xs text-muted-foreground">
              gpt-live-1 is the GPT-Live model, about five cents a minute of conversation plus the
              text model&apos;s tokens. The older gpt-realtime models are deprecated by OpenAI and
              cannot open a live session.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ai.openai_realtime_voice">Voice</Label>
            <select
              id="ai.openai_realtime_voice"
              name="ai.openai_realtime_voice"
              defaultValue={values["ai.openai_realtime_voice"]}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Default ({openAiDefaults.realtimeVoice})</option>
              {voices.map((voice) => (
                <option key={voice} value={voice}>
                  {voice}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              marin is GPT-Live&apos;s default. A voice is fixed when a session starts, so the
              choice applies to the next session.
            </p>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="ai.openai_transcribe_model">Transcription model</Label>
            <Input
              id="ai.openai_transcribe_model"
              name="ai.openai_transcribe_model"
              value={transcribeModel}
              onChange={(event) => setTranscribeModel(event.target.value)}
              placeholder={openAiDefaults.transcribeModel}
              list="openai-transcribe-model-suggestions"
              autoComplete="off"
            />
            <datalist id="openai-transcribe-model-suggestions">
              {OPENAI_TRANSCRIBE_MODELS.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
            <ModelChoices
              listing={openAiModels}
              kind="transcription"
              fallback={OPENAI_TRANSCRIBE_MODELS}
              value={transcribeModel}
              onPick={setTranscribeModel}
            />
            <p className="text-xs text-muted-foreground">
              Transcribes hold-to-talk dictation in text mode; GPT-Live writes its own transcripts.
              gpt-4o-mini-transcribe is half the price of gpt-4o-transcribe and accurate enough for
              spoken questions about the business.
            </p>
          </div>
        </div>
      </section>

      {/*
       * Daily budgets (product owner, 2026-11-03). Enforced by the OpenAI
       * client wrapper against the usage ledger, so every feature is covered
       * without remembering to check. The figures are estimates from list
       * prices; the invoice is the only billed amount.
       */}
      <section className="space-y-4 rounded-md border bg-card p-4">
        <h2 className="text-sm font-medium">Daily budgets</h2>
        <p className="text-xs text-muted-foreground">
          Each day&apos;s use is estimated from OpenAI&apos;s list prices and compared with these
          caps before every call. When a cap is reached, the call is refused with a message that
          names the cap, and everything resumes at midnight America/Toronto. Enter 0 for no cap.
          Today&apos;s figures are in the panel to the right.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <BudgetField
            id="ai.budget.daily_usd"
            label="Daily AI spend, everyone (USD)"
            defaultValue={values["ai.budget.daily_usd"]}
            hint="Every OpenAI call counts: briefings, analyst, agents, Product Studio, the assistant and live dialog."
            step={0.5}
          />
          <BudgetField
            id="ai.budget.daily_usd_per_user"
            label="Daily AI spend, per user (USD)"
            defaultValue={values["ai.budget.daily_usd_per_user"]}
            hint="Unattended runs have no user and count only against the everyone cap."
            step={0.5}
          />
          <BudgetField
            id="ai.budget.daily_voice_minutes"
            label="Live dialog minutes per day, everyone"
            defaultValue={values["ai.budget.daily_voice_minutes"]}
            hint="Session wall time, counted when a session ends or is cut off."
          />
          <BudgetField
            id="ai.budget.daily_voice_minutes_per_user"
            label="Live dialog minutes per day, per user"
            defaultValue={values["ai.budget.daily_voice_minutes_per_user"]}
            hint="Keeps one open microphone from using the whole allowance."
          />
          <BudgetField
            id="ai.budget.voice_session_max_minutes"
            label="Longest live session (minutes)"
            defaultValue={values["ai.budget.voice_session_max_minutes"]}
            hint="Always enforced: the session's key expires and the drawer ends the call."
            min={1}
            max={120}
          />
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
