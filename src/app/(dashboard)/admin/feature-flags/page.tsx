import Link from "next/link";
import { ArrowLeft, ToggleRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { listFeatureFlags } from "@/server/services/feature-flags";
import { requirePermission } from "@/server/permissions";

import { FlagToggle } from "./flag-toggle";

export const metadata = { title: "Feature Flags" };
export const dynamic = "force-dynamic";

export default async function FeatureFlagsPage() {
  await requirePermission(PERMISSIONS.ADMIN_MANAGE_SYSTEM_SETTINGS);
  const flags = await listFeatureFlags();
  const enabledCount = flags.filter((f) => f.enabled).length;

  return (
    <div>
      <PageHeader
        title="Feature Flags"
        description="Kill switches for high-risk capabilities. Default OFF. Toggling is audit-logged."
        breadcrumb={
          <Link href="/admin" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Admin
          </Link>
        }
        actions={
          <Badge variant={enabledCount === 0 ? "outline" : "secondary"}>
            <ToggleRight className="mr-1 h-3 w-3" />
            {enabledCount} of {flags.length} enabled
          </Badge>
        }
      />
      <div className="space-y-4 p-6">
        <Card>
          <CardContent className="p-0">
            <DataTable className="border-0">
              <THead>
                <tr>
                  <TH>Key</TH>
                  <TH>Description</TH>
                  <TH>Status</TH>
                  <TH>Last changed</TH>
                  <TH>{" "}</TH>
                </tr>
              </THead>
              <TBody>
                {flags.map((f) => (
                  <TR key={f.key}>
                    <TD>
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                        {f.key}
                      </code>
                    </TD>
                    <TD className="text-muted-foreground">{f.description}</TD>
                    <TD>
                      {f.enabled ? (
                        <Badge variant="success">Enabled</Badge>
                      ) : (
                        <Badge variant="outline">Disabled</Badge>
                      )}
                    </TD>
                    <TD className="text-muted-foreground">
                      {f.updatedAt ? formatDateTime(f.updatedAt) : "—"}
                    </TD>
                    <TD>
                      <FlagToggle flagKey={f.key} enabled={f.enabled} />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </DataTable>
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground">
          Flags governing supplier writes, AI mutations, BigCommerce/QuickBooks write-backs, and
          outbound Mailchimp campaigns must remain off until the related workflow has been
          reviewed and approved per docs/14 §16 and docs/16 §16.
        </p>
      </div>
    </div>
  );
}
