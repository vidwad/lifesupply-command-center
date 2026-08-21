import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";

import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission, userHasPermission } from "@/server/permissions";
import { listActiveStores } from "@/server/services/operations";
import { listPricingRules } from "@/server/services/pricing";

import { RowActions, RuleForm } from "../setup-forms";

export const metadata = { title: "Pricing Rules" };
export const dynamic = "force-dynamic";

export default async function PricingRulesPage() {
  const user = await requirePermission(PERMISSIONS.PRICING_VIEW);
  const canManage = userHasPermission(user, PERMISSIONS.PRICING_MANAGE_RULES);
  const [rules, stores] = await Promise.all([listPricingRules(), listActiveStores()]);
  const storeOptions = stores.map((store) => ({ id: store.id, name: store.name }));

  return (
    <div>
      <PageHeader
        title="Pricing rules"
        description="Guardrails for future recommendations. The minimum cost multiplier is the price floor — 1.40 means a sale price never drops below 140% of cost. Nothing is recommended or written back in this phase, and auto-approval is unavailable until a later product-owner-approved automation phase."
        breadcrumb={
          <Link href="/products/pricing" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Pricing Intelligence
          </Link>
        }
      />

      <div className="space-y-6 p-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Rules</CardTitle>
            <CardDescription>
              The most specific enabled rule wins (variant → product → category → store → global).
              The last enabled global rule cannot be removed — it is the default floor.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {rules.length === 0 ? (
              <EmptyState
                icon={Scale}
                title="No pricing rules yet"
                description="Seed the default global rule (pnpm db:seed) or create one below. This is setup only — no pricing runs exist yet."
                className="m-4 border-0 bg-transparent"
              />
            ) : (
              <DataTable className="rounded-none border-0">
                <THead>
                  <tr>
                    <TH>Name</TH>
                    <TH>Scope</TH>
                    <TH align="right">Floor ×</TH>
                    <TH align="right">Batch/day</TH>
                    <TH align="right">Min conf.</TH>
                    <TH>Approval</TH>
                    <TH>Status</TH>
                    {canManage ? <TH>Actions</TH> : null}
                  </tr>
                </THead>
                <TBody>
                  {rules.map((rule) => (
                    <TR key={rule.id}>
                      <TD className="font-medium">
                        {rule.name}
                        {canManage ? (
                          <details className="mt-1 text-xs font-normal">
                            <summary className="cursor-pointer text-primary">Edit</summary>
                            <div className="mt-3 max-w-4xl rounded-md border p-4">
                              <RuleForm
                                stores={storeOptions}
                                values={{
                                  id: rule.id,
                                  name: rule.name,
                                  storeId: rule.storeId,
                                  minCostMultiplier: Number(rule.minCostMultiplier),
                                  defaultUndercutAmount: Number(rule.defaultUndercutAmount),
                                  defaultUndercutPct:
                                    rule.defaultUndercutPct == null
                                      ? null
                                      : Number(rule.defaultUndercutPct),
                                  maxIncreasePct: Number(rule.maxIncreasePct),
                                  maxDecreasePct: Number(rule.maxDecreasePct),
                                  dailyBatchSize: rule.dailyBatchSize,
                                  minConfidence: Number(rule.minConfidence),
                                  evidenceFreshnessHours: rule.evidenceFreshnessHours,
                                  autoApproveEligible: rule.autoApproveEligible,
                                  enabled: rule.enabled,
                                  notes: rule.notes,
                                }}
                              />
                            </div>
                          </details>
                        ) : null}
                      </TD>
                      <TD className="text-muted-foreground">{rule.store?.name ?? "Global"}</TD>
                      <TD align="right" className="tabular-nums">
                        {Number(rule.minCostMultiplier).toFixed(2)}
                      </TD>
                      <TD align="right" className="tabular-nums">
                        {rule.dailyBatchSize}
                      </TD>
                      <TD align="right" className="tabular-nums">
                        {Number(rule.minConfidence).toFixed(2)}
                      </TD>
                      <TD>
                        <Badge variant={rule.requiresApproval ? "success" : "destructive"}>
                          {rule.requiresApproval ? "required" : "off"}
                        </Badge>
                      </TD>
                      <TD>
                        <Badge variant={rule.enabled ? "success" : "outline"}>
                          {rule.enabled ? "enabled" : "disabled"}
                        </Badge>
                      </TD>
                      {canManage ? (
                        <TD>
                          <RowActions id={rule.id} enabled={rule.enabled} kind="rule" />
                        </TD>
                      ) : null}
                    </TR>
                  ))}
                </TBody>
              </DataTable>
            )}
          </CardContent>
        </Card>

        {canManage ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add a rule</CardTitle>
              <CardDescription>
                Every rule keeps human approval mandatory in this phase.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RuleForm stores={storeOptions} />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
