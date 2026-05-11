import Link from "next/link";
import { ArrowLeft, Store as StoreIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { PERMISSIONS } from "@/lib/permissions";
import { listDivisions } from "@/server/services/divisions";
import { listStores } from "@/server/services/stores";
import { requirePermission } from "@/server/permissions";

import { CreateStoreForm, EditStoreForm } from "./store-forms";

export const metadata = { title: "Stores" };
export const dynamic = "force-dynamic";

export default async function StoresPage() {
  await requirePermission(PERMISSIONS.ADMIN_MANAGE_SYSTEM_SETTINGS);
  const [stores, divisions] = await Promise.all([listStores(), listDivisions()]);
  const divisionChoices = divisions
    .filter((d) => d.isActive)
    .map((d) => ({ id: d.id, name: d.name }));

  return (
    <div>
      <PageHeader
        title="Stores"
        description="Storefronts mapped to BigCommerce or other sales channels."
        breadcrumb={
          <Link href="/admin" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Admin
          </Link>
        }
        actions={<CreateStoreForm divisions={divisionChoices} />}
      />
      <div className="space-y-6 p-6">
        {stores.length === 0 ? (
          <EmptyState
            icon={StoreIcon}
            title="No stores yet"
            description="Add a store to associate orders, products, and customers with a sales channel."
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <DataTable className="border-0">
                <THead>
                  <tr>
                    <TH>Name</TH>
                    <TH>Division</TH>
                    <TH>Platform</TH>
                    <TH>External ID</TH>
                    <TH>URL</TH>
                    <TH>Status</TH>
                    <TH>{" "}</TH>
                  </tr>
                </THead>
                <TBody>
                  {stores.map((s) => (
                    <TR key={s.id}>
                      <TD className="font-medium">{s.name}</TD>
                      <TD className="text-muted-foreground">{s.divisionName}</TD>
                      <TD>
                        <Badge variant="outline">{s.platform}</Badge>
                      </TD>
                      <TD className="font-mono text-xs text-muted-foreground">
                        {s.externalStoreId ?? "—"}
                      </TD>
                      <TD>
                        {s.url ? (
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            {s.url.replace(/^https?:\/\//, "")}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TD>
                      <TD>
                        <StoreStatusBadge status={s.status} />
                      </TD>
                      <TD>
                        <EditStoreForm
                          store={{
                            id: s.id,
                            name: s.name,
                            platform: s.platform,
                            url: s.url,
                            sourceSystem: s.sourceSystem,
                            externalStoreId: s.externalStoreId,
                            status: s.status,
                            divisionId: s.divisionId,
                          }}
                          divisions={divisionChoices}
                        />
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </DataTable>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function StoreStatusBadge({ status }: { status: string }) {
  const variant =
    status === "active"
      ? "success"
      : status === "inactive"
        ? "secondary"
        : "outline";
  return <Badge variant={variant as "success" | "secondary" | "outline"}>{status}</Badge>;
}
