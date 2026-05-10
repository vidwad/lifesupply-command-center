import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Star } from "lucide-react";

import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatCurrency, formatPercent } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { getProductById } from "@/server/services/products";
import { requirePermission } from "@/server/permissions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const product = await getProductById(id);
  return { title: product ? product.name : "Product" };
}

export default async function ProductDetailPage({ params }: Props) {
  await requirePermission(PERMISSIONS.PRODUCTS_VIEW);
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const margin =
    product.sales90d.revenue > 0 ? product.sales90d.grossProfit / product.sales90d.revenue : null;

  return (
    <div>
      <PageHeader
        title={product.name}
        description={`${product.category?.name ?? "Uncategorized"} • ${product.store?.name ?? "—"}`}
        breadcrumb={
          <Link href="/products" className="inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Products
          </Link>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{product.status}</Badge>
            {product.isFeatured && (
              <Badge variant="warning">
                <Star className="mr-1 h-3 w-3" /> Featured
              </Badge>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Variants & inventory</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable className="rounded-none border-0">
                <THead>
                  <tr>
                    <TH>SKU</TH>
                    <TH>Option</TH>
                    <TH align="right">Price</TH>
                    <TH align="right">Cost</TH>
                    <TH align="right">Margin</TH>
                    <TH align="right">Stock</TH>
                  </tr>
                </THead>
                <TBody>
                  {product.variants.map((v) => {
                    const m =
                      v.costPrice != null && v.price > 0 ? (v.price - v.costPrice) / v.price : null;
                    return (
                      <TR key={v.id}>
                        <TD className="font-mono text-xs">{v.sku}</TD>
                        <TD>{v.optionSummary ?? "Default"}</TD>
                        <TD align="right" className="tabular-nums">
                          {formatCurrency(v.price)}
                        </TD>
                        <TD align="right" className="tabular-nums text-muted-foreground">
                          {v.costPrice != null ? formatCurrency(v.costPrice) : "—"}
                        </TD>
                        <TD align="right" className="tabular-nums">
                          {m != null ? formatPercent(m, 1) : "—"}
                        </TD>
                        <TD align="right" className="tabular-nums">
                          {v.stockLevel != null ? v.stockLevel : "—"}
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </DataTable>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Supplier mappings</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {product.supplierProducts.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">No suppliers mapped.</p>
              ) : (
                <DataTable className="rounded-none border-0">
                  <THead>
                    <tr>
                      <TH>Supplier</TH>
                      <TH>Supplier SKU</TH>
                      <TH align="right">Cost</TH>
                      <TH>Availability</TH>
                      <TH>Preferred</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {product.supplierProducts.map((sp) => (
                      <TR key={sp.id}>
                        <TD>
                          <span className="font-medium">{sp.supplier.name}</span>
                          <div className="text-xs text-muted-foreground">{sp.supplier.code}</div>
                        </TD>
                        <TD className="font-mono text-xs">{sp.supplierSku}</TD>
                        <TD align="right" className="tabular-nums">
                          {formatCurrency(sp.cost, sp.currency)}
                        </TD>
                        <TD className="text-muted-foreground">{sp.availabilityStatus}</TD>
                        <TD>
                          {sp.isPreferred ? (
                            <Badge variant="success">Preferred</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </DataTable>
              )}
            </CardContent>
          </Card>

          {product.description && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Sales — last 90 days</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <Row label="Revenue" value={formatCurrency(product.sales90d.revenue)} emphasis />
                <Row label="Units sold" value={String(product.sales90d.quantity)} />
                <Row label="Gross profit" value={formatCurrency(product.sales90d.grossProfit)} />
                <Row label="Margin" value={margin != null ? formatPercent(margin, 1) : "—"} />
                <Row label="Order lines" value={String(product.sales90d.orderLines)} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Catalog quality</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <Row label="Image" value={product.imageStatus.replace("_", " ")} />
                <Row label="Description" value={product.descriptionStatus.replace("_", " ")} />
                <Row label="Status" value={product.status} />
                <Row label="Featured" value={product.isFeatured ? "Yes" : "No"} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Source</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <Row label="Brand" value={product.brand ?? "—"} />
                <Row label="Source" value={product.sourceSystem ?? "—"} />
                <Row label="Source ID" value={product.sourceId ?? "—"} />
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd
        className={emphasis ? "text-base font-semibold tabular-nums" : "font-medium tabular-nums"}
      >
        {value}
      </dd>
    </div>
  );
}
