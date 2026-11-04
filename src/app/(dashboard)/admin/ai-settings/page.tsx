import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/PageHeader";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { PERMISSIONS } from "@/lib/permissions";
import {
  DEFAULT_OPENAI_IMAGE_MODEL,
  DEFAULT_OPENAI_MODEL,
  DEFAULT_OPENAI_REALTIME_MODEL,
  DEFAULT_OPENAI_REALTIME_VOICE,
  DEFAULT_OPENAI_TRANSCRIBE_MODEL,
  OPENAI_REALTIME_VOICES,
} from "@/server/integrations/openai/client";
import { listOpenAiModels } from "@/server/integrations/openai/models";
import { getAiBudgetStatus, type AiBudgetStatus } from "@/server/services/ai/budget";
import { PRICES_AS_OF } from "@/server/services/ai/pricing";
import { isFeatureOn } from "@/server/services/feature-flags";
import { resolveCredential } from "@/server/services/integrations";
import { getSettings } from "@/server/services/system-settings";
import { requirePermission } from "@/server/permissions";

import { AiSettingsForm, type AiSettingsValues } from "./ai-settings-form";

export const metadata = { title: "AI Settings" };
export const dynamic = "force-dynamic";

const PROMPT_TEMPLATES = [
  {
    key: "dashboard_briefing",
    label: "Daily management briefing",
    location: "src/server/services/ai/index.ts",
    description: "OBSERVATIONS / EXCEPTIONS / RECOMMENDED ACTIONS format from dashboard data.",
  },
  {
    key: "analyst_query",
    label: "AI Analyst chat",
    location: "src/server/services/ai/index.ts",
    description: "Natural-language Q&A against the executive snapshot.",
  },
  {
    key: "opportunity_analysis",
    label: "M&A opportunity memo",
    location: "src/server/services/ai/index.ts",
    description: "Structured strategic memo for an opportunity record.",
  },
];

const SETTING_KEYS = [
  "ai.default_model",
  "ai.max_output_tokens",
  "ai.temperature",
  "ai.openai_model",
  "ai.openai_image_model",
  "ai.openai_realtime_model",
  "ai.openai_realtime_voice",
  "ai.openai_transcribe_model",
  "ai.budget.daily_usd",
  "ai.budget.daily_usd_per_user",
  "ai.budget.daily_voice_minutes",
  "ai.budget.daily_voice_minutes_per_user",
  "ai.budget.voice_session_max_minutes",
] as const;

const usd = (n: number) => `$${n.toFixed(2)}`;
const minutes = (n: number) => `${n < 10 ? n.toFixed(1) : Math.round(n)} min`;

/** A used-of-limit line, coloured as the limit approaches. */
function UsageRow({
  label,
  used,
  limit,
  format,
}: {
  label: string;
  used: number;
  limit: number;
  format: (n: number) => string;
}) {
  const fraction = limit > 0 ? used / limit : 0;
  const tone =
    limit > 0 && fraction >= 1
      ? "text-destructive"
      : limit > 0 && fraction >= 0.8
        ? "text-warning"
        : "text-foreground";
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className={`font-medium tabular-nums ${tone}`}>
          {format(used)}
          <span className="text-muted-foreground"> / {limit > 0 ? format(limit) : "no cap"}</span>
        </span>
      </div>
      {limit > 0 ? (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full ${fraction >= 1 ? "bg-destructive" : fraction >= 0.8 ? "bg-warning" : "bg-primary"}`}
            style={{ width: `${Math.min(100, Math.round(fraction * 100))}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

function TodayCard({ status, liveVoiceOn }: { status: AiBudgetStatus; liveVoiceOn: boolean }) {
  const dayLabel = status.dayStart.toLocaleDateString("en-CA", {
    timeZone: status.timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Today&apos;s AI use</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="text-xs text-muted-foreground">
          {dayLabel}, {status.timezone}. Estimated from list prices as of {PRICES_AS_OF}; the OpenAI
          invoice is the billed amount.
        </p>
        <UsageRow
          label="Spend, everyone"
          used={status.spent.usd}
          limit={status.limits.dailyUsd}
          format={usd}
        />
        <UsageRow
          label="Live dialog, everyone"
          used={status.spent.voiceMinutes}
          limit={status.limits.dailyVoiceMinutes}
          format={minutes}
        />
        {status.spendBlocked ? (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {status.spendBlocked}
          </p>
        ) : null}
        {!status.spendBlocked && status.voiceBlocked ? (
          <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs">
            {status.voiceBlocked}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Live voice is{" "}
          {liveVoiceOn ? (
            <span className="text-success">on</span>
          ) : (
            <span>
              off; turn on{" "}
              <Link href="/admin/feature-flags" className="underline">
                {FEATURE_FLAGS.AI_LIVE_VOICE}
              </Link>{" "}
              to allow sessions
            </span>
          )}
          .
        </p>
        {status.byFeature.length > 0 ? (
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">By feature</p>
            <ul className="divide-y">
              {status.byFeature.slice(0, 8).map((f) => (
                <li
                  key={f.feature}
                  className="flex items-baseline justify-between gap-2 py-1 text-xs"
                >
                  <span className="truncate font-mono">{f.feature}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {usd(f.usd)} · {f.calls} {f.calls === 1 ? "call" : "calls"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No metered calls yet today.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default async function AiSettingsPage() {
  const user = await requirePermission(PERMISSIONS.ADMIN_MANAGE_SYSTEM_SETTINGS);

  const [values, openAiKey, openAiModels, budget, liveVoiceOn] = await Promise.all([
    getSettings([...SETTING_KEYS]),
    resolveCredential("openai", "apiKey"),
    // The models the configured key can use, listed under the fields.
    listOpenAiModels(),
    getAiBudgetStatus(user.id),
    isFeatureOn(FEATURE_FLAGS.AI_LIVE_VOICE),
  ]);

  const formValues: AiSettingsValues = {
    "ai.default_model": values["ai.default_model"] ?? DEFAULT_OPENAI_MODEL,
    "ai.max_output_tokens": values["ai.max_output_tokens"] ?? "4096",
    "ai.temperature": values["ai.temperature"] ?? "0.3",
    "ai.openai_model": values["ai.openai_model"] ?? "",
    "ai.openai_image_model": values["ai.openai_image_model"] ?? "",
    "ai.openai_realtime_model": values["ai.openai_realtime_model"] ?? "",
    "ai.openai_realtime_voice": values["ai.openai_realtime_voice"] ?? "",
    "ai.openai_transcribe_model": values["ai.openai_transcribe_model"] ?? "",
    "ai.budget.daily_usd": values["ai.budget.daily_usd"] ?? "0",
    "ai.budget.daily_usd_per_user": values["ai.budget.daily_usd_per_user"] ?? "0",
    "ai.budget.daily_voice_minutes": values["ai.budget.daily_voice_minutes"] ?? "60",
    "ai.budget.daily_voice_minutes_per_user":
      values["ai.budget.daily_voice_minutes_per_user"] ?? "20",
    "ai.budget.voice_session_max_minutes": values["ai.budget.voice_session_max_minutes"] ?? "15",
  };

  return (
    <div>
      <PageHeader
        title="AI Settings"
        description="Models, live dialog, daily budgets and the prompt template inventory."
        breadcrumb={
          <Link href="/admin" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Admin
          </Link>
        }
      />

      <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <AiSettingsForm
            values={formValues}
            openAiEnv={{
              model: process.env.OPENAI_MODEL?.trim() || null,
              imageModel: process.env.OPENAI_IMAGE_MODEL?.trim() || null,
              realtimeModel: process.env.OPENAI_REALTIME_MODEL?.trim() || null,
              realtimeVoice: process.env.OPENAI_REALTIME_VOICE?.trim() || null,
              transcribeModel: process.env.OPENAI_TRANSCRIBE_MODEL?.trim() || null,
            }}
            openAiDefaults={{
              model: DEFAULT_OPENAI_MODEL,
              imageModel: DEFAULT_OPENAI_IMAGE_MODEL,
              realtimeModel: DEFAULT_OPENAI_REALTIME_MODEL,
              realtimeVoice: DEFAULT_OPENAI_REALTIME_VOICE,
              transcribeModel: DEFAULT_OPENAI_TRANSCRIBE_MODEL,
            }}
            openAiModels={openAiModels}
            voices={OPENAI_REALTIME_VOICES}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Prompt templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-xs text-muted-foreground">
                Prompt templates currently live in the AI service. A versioned `prompt_templates`
                table is on the Phase 2 roadmap (docs/17 §15 #6).
              </p>
              <ul className="space-y-2">
                {PROMPT_TEMPLATES.map((t) => (
                  <li key={t.key} className="flex items-start gap-3 rounded-md border p-3">
                    <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">{t.label}</div>
                      <div className="text-xs text-muted-foreground">{t.description}</div>
                      <code className="mt-1 block text-[11px] text-muted-foreground">
                        {t.location}
                      </code>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <TodayCard status={budget} liveVoiceOn={liveVoiceOn} />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">OpenAI credential</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {openAiKey ? (
                <p className="rounded-md border border-success/40 bg-success/10 px-3 py-2 text-success">
                  Configured.{" "}
                  <Link href="/admin/integrations" className="underline">
                    Manage credentials
                  </Link>
                  .
                </p>
              ) : (
                <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2">
                  No API key configured. Product Studio will fail until you{" "}
                  <Link href="/admin/integrations" className="underline">
                    add a credential
                  </Link>
                  .
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Resolution order: process.env.OPENAI_API_KEY then encrypted vault.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Guardrails</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="list-disc space-y-1 pl-4 text-xs">
                <li>All AI calls run server-side through one wrapper.</li>
                <li>Every call is metered and checked against the daily budgets above.</li>
                <li>Outputs are persisted as draft AiOutput records.</li>
                <li>Approval is required before financial / investor outputs are released.</li>
                <li>AI cannot execute external actions directly (per docs/06 §15).</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
