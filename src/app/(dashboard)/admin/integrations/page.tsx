import Link from "next/link";
import { ArrowLeft, Key, Lock, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { listIntegrationSettings } from "@/server/services/integrations";
import { vaultEnabled } from "@/server/security/secrets";
import { requirePermission } from "@/server/permissions";

import { IntegrationSecretForm } from "./integration-secret-form";

export const metadata = { title: "API & Integrations" };
export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  bigcommerce: "BigCommerce",
  quickbooks: "QuickBooks",
  mailchimp: "Mailchimp",
  ga4: "Google Analytics 4",
  openai: "OpenAI",
  anthropic: "Anthropic Claude",
  supplier_portal: "Supplier portal",
  manual_import: "Manual import",
};

const STATUS_BADGE: Record<string, "success" | "destructive" | "warning" | "outline"> = {
  configured: "success",
  not_configured: "outline",
  error: "destructive",
  disabled: "warning",
};

const SOURCE_LABEL: Record<string, string> = {
  env: "Environment variable",
  vault: "Encrypted vault",
  none: "Not configured",
};

export default async function IntegrationsSettingsPage() {
  await requirePermission(PERMISSIONS.ADMIN_MANAGE_INTEGRATIONS);
  const integrations = await listIntegrationSettings();
  const isVaultEnabled = vaultEnabled();

  return (
    <div>
      <PageHeader
        title="API & Integrations"
        description="Manage API keys per integration. Secrets are encrypted at rest with the master key from MASTER_ENCRYPTION_KEY."
        breadcrumb={
          <Link href="/admin" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Admin
          </Link>
        }
        actions={
          isVaultEnabled ? (
            <Badge variant="success">
              <ShieldCheck className="mr-1 h-3 w-3" /> Vault enabled
            </Badge>
          ) : (
            <Badge variant="warning">
              <Lock className="mr-1 h-3 w-3" /> Vault disabled
            </Badge>
          )
        }
      />

      <div className="space-y-6 p-6">
        {!isVaultEnabled && (
          <Card className="border-warning/50 bg-warning/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-warning">
                MASTER_ENCRYPTION_KEY is not configured
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                The encrypted credential vault requires a 32-byte master key in env. Generate and
                add it to your <code className="rounded bg-muted px-1">.env</code>:
              </p>
              <pre className="rounded-md border bg-muted/40 p-3 text-xs">
                {`MASTER_ENCRYPTION_KEY=$(openssl rand -base64 32)`}
              </pre>
              <p className="text-muted-foreground">
                Until then, integrations fall back to env vars only. See{" "}
                <code className="rounded bg-muted px-1">.env.example</code> for the per- integration
                env vars (ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.).
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-start gap-3 py-4 text-sm">
            <Key className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="font-medium text-foreground">How secrets resolve</p>
              <p className="mt-1 text-xs text-muted-foreground">
                <strong>Env wins.</strong> If the env var is set (e.g.{" "}
                <code className="rounded bg-muted px-1">ANTHROPIC_API_KEY</code>), it takes
                precedence over any value stored here. Otherwise the encrypted vault entry is used.
                Per{" "}
                <a className="underline" href="/docs/06" target="_blank" rel="noreferrer">
                  docs/06 §8
                </a>
                , every set / clear is audit-logged and the plaintext is never displayed after save.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {integrations.map((i) => (
            <Card key={i.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {TYPE_LABEL[i.integrationType] ?? i.integrationType}
                    </p>
                    <CardTitle className="text-base">{i.name}</CardTitle>
                  </div>
                  <Badge variant={STATUS_BADGE[i.status] ?? "outline"}>
                    {i.status.replace("_", " ")}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Source:{" "}
                  <span
                    className={
                      i.effectiveSource === "none"
                        ? "text-muted-foreground"
                        : "font-medium text-foreground"
                    }
                  >
                    {SOURCE_LABEL[i.effectiveSource]}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Env var status */}
                {i.envVarName && (
                  <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2 text-xs">
                    <code className="font-mono">{i.envVarName}</code>
                    <span className={i.envVarPresent ? "text-success" : "text-muted-foreground"}>
                      {i.envVarPresent ? "✓ set in env" : "not set"}
                    </span>
                  </div>
                )}

                {/* Vault status */}
                <div className="rounded-md border px-3 py-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">Vault entry</span>
                    {i.vaultSecretSet ? (
                      <span className="font-mono text-success">
                        ✓ ••••{i.secretLastFour ?? "????"}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">not set</span>
                    )}
                  </div>
                  {i.vaultSecretSet && i.secretSetAt && (
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Set by {i.secretSetByName ?? "unknown"} on {formatDateTime(i.secretSetAt)}
                    </p>
                  )}
                </div>

                {/* Form */}
                <IntegrationSecretForm
                  integrationId={i.id}
                  integrationName={i.name}
                  hasVaultSecret={i.vaultSecretSet}
                  vaultEnabled={isVaultEnabled}
                />

                {i.notes && (
                  <p className="border-t pt-2 text-xs italic text-muted-foreground">{i.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
