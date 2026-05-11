import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/PageHeader";
import { PERMISSIONS } from "@/lib/permissions";
import { resolveCredential } from "@/server/services/integrations";
import { getSettings } from "@/server/services/system-settings";
import { requirePermission } from "@/server/permissions";

import { AiSettingsForm } from "./ai-settings-form";

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

export default async function AiSettingsPage() {
  await requirePermission(PERMISSIONS.ADMIN_MANAGE_SYSTEM_SETTINGS);

  const [values, anthropicKey] = await Promise.all([
    getSettings([
      "ai.default_provider",
      "ai.default_model",
      "ai.max_output_tokens",
      "ai.temperature",
    ]),
    resolveCredential("anthropic", "apiKey"),
  ]);

  return (
    <div>
      <PageHeader
        title="AI Settings"
        description="Default model, temperature, and prompt template inventory."
        breadcrumb={
          <Link href="/admin" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Admin
          </Link>
        }
      />

      <div className="grid gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <AiSettingsForm
            values={{
              "ai.default_provider": values["ai.default_provider"] ?? "anthropic",
              "ai.default_model": values["ai.default_model"] ?? "claude-sonnet-4-6",
              "ai.max_output_tokens": values["ai.max_output_tokens"] ?? "4096",
              "ai.temperature": values["ai.temperature"] ?? "0.3",
            }}
            envOverride={process.env.ANTHROPIC_MODEL ?? null}
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
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Anthropic credential</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {anthropicKey ? (
                <p className="rounded-md border border-success/40 bg-success/10 px-3 py-2 text-success">
                  Configured.{" "}
                  <Link href="/admin/integrations" className="underline">
                    Manage credentials
                  </Link>
                  .
                </p>
              ) : (
                <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2">
                  No API key configured. AI features will fail until you{" "}
                  <Link href="/admin/integrations" className="underline">
                    add a credential
                  </Link>
                  .
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Resolution order: process.env.ANTHROPIC_API_KEY then encrypted vault.
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
