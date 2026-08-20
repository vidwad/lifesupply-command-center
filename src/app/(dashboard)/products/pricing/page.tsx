import Link from "next/link";
import { ArrowLeft, Building2, Scale, ShieldAlert } from "lucide-react";

import { KpiCard } from "@/components/data/KpiCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { PERMISSIONS } from "@/lib/permissions";
import { PageHeader } from "@/components/shell/PageHeader";
import { requirePermission } from "@/server/permissions";
import { getFeatureFlags } from "@/server/services/feature-flags";
import { getPricingOverview } from "@/server/services/pricing";

export const metadata = { title: "Pricing Intelligence" };
export const dynamic = "force-dynamic";

export default async function PricingIntelligencePage() {
  await requirePermission(PERMISSIONS.PRICING_VIEW);
  const [overview, flags] = await Promise.all([
    getPricingOverview(),
    getFeatureFlags([FEATURE_FLAGS.PRICING_INTELLIGENCE, FEATURE_FLAGS.PRICING_WRITEBACKS]),
  ]);

  return (
    <div>
      <PageHeader
        title="Pricing Intelligence"
        description="Setup foundation for competitor-aware, approval-gated pricing. Read-only: no competitor website is contacted and no BigCommerce price is changed in this phase."
        breadcrumb={
          <Link href="/products" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Products &amp; Catalog
          </Link>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge variant={flags[FEATURE_FLAGS.PRICING_INTELLIGENCE] ? "success" : "outline"}>
              pricing.intelligence {flags[FEATURE_FLAGS.PRICING_INTELLIGENCE] ? "on" : "off"}
            </Badge>
            <Badge variant={flags[FEATURE_FLAGS.PRICING_WRITEBACKS] ? "destructive" : "outline"}>
              pricing.writebacks {flags[FEATURE_FLAGS.PRICING_WRITEBACKS] ? "ON" : "off"}
            </Badge>
          </div>
        }
      />

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Competitors"
            value={overview.competitorCount.toString()}
            caption={`${overview.enabledCompetitorCount} enabled`}
            icon={Building2}
          />
          <KpiCard
            label="Pricing rules"
            value={overview.ruleCount.toString()}
            caption={`${overview.enabledRuleCount} enabled`}
            icon={Scale}
          />
          <KpiCard label="Pricing runs" value="0" caption="arrives in a later phase" icon={Scale} />
          <KpiCard
            label="Recommendations"
            value="0"
            caption="arrives in a later phase"
            icon={Scale}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Competitor stores</CardTitle>
              <CardDescription>
                Register the stores to compare against. Stored as reference data only — nothing is
                crawled or fetched in this phase.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/products/pricing/competitors">Manage competitors</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pricing rules</CardTitle>
              <CardDescription>
                Guardrails for future recommendations: the 140% cost floor, undercut behaviour,
                batch size, confidence, and mandatory approval.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/products/pricing/rules">Manage rules</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-start gap-3 py-4 text-sm">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="space-y-1">
              <p className="font-medium">What this phase does — and deliberately does not — do</p>
              <p className="text-muted-foreground">
                This is the read-only setup foundation. Competitor price collection, product-list
                builders, recommendations, approvals, and BigCommerce sale-price updates arrive in
                later phases, each behind its own flag, permission, and human approval. Any future
                writeback additionally requires <code>pricing.writebacks</code> and{" "}
                <code>external.writebacks</code> to be enabled — both are OFF and covered by the
                kill switch.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
