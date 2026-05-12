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

import { IntegrationFieldForm } from "./integration-secret-form";
import { TestConnectionButton } from "./test-connection-button";

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
  env: "env",
  vault: "vault",
  none: "—",
};

const SOURCE_TONE: Record<string, string> = {
  env: "text-success",
  vault: "text-primary",
  none: "text-muted-foreground",
};

export default async function IntegrationsSettingsPage() {
  await requirePermission(PERMISSIONS.ADMIN_MANAGE_INTEGRATIONS);
  const integrations = await listIntegrationSettings();
  const isVaultEnabled = vaultEnabled();

  return (
    <div>
      <PageHeader
        title="API & Integrations"
        description="Manage credential fields per integration. Encrypted at rest with the master key from MASTER_ENCRYPTION_KEY."
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
                Until then, integrations fall back to env vars only.
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-start gap-3 py-4 text-sm">
            <Key className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="font-medium text-foreground">How resolution works</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Each integration may have multiple credential fields (e.g. BigCommerce needs both
                store hash and API token). For each field, env wins over vault. Per{" "}
                <a className="underline" href="/docs/06" target="_blank" rel="noreferrer">
                  docs/06 §8
                </a>
                , every set / clear is audit-logged. Plaintext is never returned by the API or
                rendered after save — only the last 4 characters are shown.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
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
                  <div className="flex items-center gap-2">
                    {i.fields.length > 0 && (
                      <Badge variant={i.fullyConfigured ? "success" : "outline"}>
                        {i.fields.filter((f) => f.effectiveSource !== "none").length} of{" "}
                        {i.fields.length} set
                      </Badge>
                    )}
                    <Badge variant={STATUS_BADGE[i.status] ?? "outline"}>
                      {i.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
                {i.notes && <CardDescription className="text-xs italic">{i.notes}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <TestConnectionButton integrationId={i.id} />
                {i.fields.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    This integration has no credential fields.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {i.fields.map((f) => (
                      <div key={f.name} className="rounded-md border p-3">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <div>
                            <span className="text-sm font-medium">{f.label}</span>
                            <span
                              className={
                                "ml-2 text-[10px] font-medium uppercase tracking-wide " +
                                (SOURCE_TONE[f.effectiveSource] ?? "text-muted-foreground")
                              }
                            >
                              {SOURCE_LABEL[f.effectiveSource]}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {f.envVarName && (
                              <span>
                                env: <code className="font-mono">{f.envVarName}</code>{" "}
                                <span className={f.envVarPresent ? "text-success" : ""}>
                                  {f.envVarPresent ? "✓" : "—"}
                                </span>
                              </span>
                            )}
                            {f.vaultLastFour && (
                              <span className="ml-3 font-mono text-success">
                                vault: ••••{f.vaultLastFour}
                              </span>
                            )}
                          </div>
                        </div>
                        {f.hint && <p className="mt-1 text-xs text-muted-foreground">{f.hint}</p>}
                        {f.vaultLastFour && f.vaultSetAt && (
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            Set by {f.vaultSetByName ?? "unknown"} on {formatDateTime(f.vaultSetAt)}
                          </p>
                        )}
                        <div className="mt-2">
                          <IntegrationFieldForm
                            integrationId={i.id}
                            integrationName={i.name}
                            fieldName={f.name}
                            fieldLabel={f.label}
                            isSet={!!f.vaultLastFour}
                            isSecret={f.secret}
                            isMultiline={f.multiline}
                            placeholder={f.placeholder}
                            vaultEnabled={isVaultEnabled}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
