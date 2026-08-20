import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";

import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission, userHasPermission } from "@/server/permissions";
import { listPricingCompetitors } from "@/server/services/pricing";

import { CompetitorForm, RowActions } from "../setup-forms";

export const metadata = { title: "Pricing Competitors" };
export const dynamic = "force-dynamic";

export default async function PricingCompetitorsPage() {
  const user = await requirePermission(PERMISSIONS.PRICING_VIEW);
  const canManage = userHasPermission(user, PERMISSIONS.PRICING_MANAGE_COMPETITORS);
  const competitors = await listPricingCompetitors();

  return (
    <div>
      <PageHeader
        title="Competitor stores"
        description="Reference data for future price comparisons. Nothing on this page contacts a competitor website — checks arrive in a later phase, read-only and rate-limited."
        breadcrumb={
          <Link href="/products/pricing" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Pricing Intelligence
          </Link>
        }
      />

      <div className="space-y-6 p-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Registered competitors</CardTitle>
            <CardDescription>
              Terms-review status controls whether a competitor may ever be checked automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {competitors.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No competitors yet"
                description="Add the stores to compare against. This is setup only — no crawling or price collection is active."
                className="m-4 border-0 bg-transparent"
              />
            ) : (
              <DataTable className="rounded-none border-0">
                <THead>
                  <tr>
                    <TH>Name</TH>
                    <TH>Base URL</TH>
                    <TH>Currency</TH>
                    <TH>Terms review</TH>
                    <TH>Status</TH>
                    {canManage ? <TH>Actions</TH> : null}
                  </tr>
                </THead>
                <TBody>
                  {competitors.map((competitor) => (
                    <TR key={competitor.id}>
                      <TD className="font-medium">
                        {competitor.name}
                        {canManage ? (
                          <details className="mt-1 text-xs font-normal">
                            <summary className="cursor-pointer text-primary">Edit</summary>
                            <div className="mt-3 max-w-3xl rounded-md border p-4">
                              <CompetitorForm
                                values={{
                                  id: competitor.id,
                                  name: competitor.name,
                                  baseUrl: competitor.baseUrl,
                                  country: competitor.country,
                                  currency: competitor.currency,
                                  searchUrlTemplate: competitor.searchUrlTemplate,
                                  productUrlPattern: competitor.productUrlPattern,
                                  rateLimitPerHour: competitor.rateLimitPerHour,
                                  termsReviewStatus: competitor.termsReviewStatus,
                                  requiresManualUrlMapping: competitor.requiresManualUrlMapping,
                                  enabled: competitor.enabled,
                                  notes: competitor.notes,
                                }}
                              />
                            </div>
                          </details>
                        ) : null}
                      </TD>
                      <TD className="max-w-xs truncate text-muted-foreground">
                        {competitor.baseUrl}
                      </TD>
                      <TD>{competitor.currency}</TD>
                      <TD>
                        <Badge
                          variant={
                            competitor.termsReviewStatus === "reviewed_allowed"
                              ? "success"
                              : competitor.termsReviewStatus === "pending"
                                ? "outline"
                                : "warning"
                          }
                        >
                          {competitor.termsReviewStatus}
                        </Badge>
                      </TD>
                      <TD>
                        <Badge variant={competitor.enabled ? "success" : "outline"}>
                          {competitor.enabled ? "enabled" : "disabled"}
                        </Badge>
                      </TD>
                      {canManage ? (
                        <TD>
                          <RowActions
                            id={competitor.id}
                            enabled={competitor.enabled}
                            kind="competitor"
                          />
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
              <CardTitle className="text-base">Add a competitor</CardTitle>
              <CardDescription>
                URLs are stored for traceability and future read-only checks; adding a competitor
                does not contact its website.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompetitorForm />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
