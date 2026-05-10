import Link from "next/link";
import { Boxes, ImageOff, Star } from "lucide-react";

import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatCurrency, formatPercent } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import { listProducts, type ListProductsFilters } from "@/server/services/products";
import { requirePermission } from "@/server/permissions";

export const metadata = { title: "Products & Catalog" };
export const dynamic = "force-dynamic";

type SearchParams = { q?: string; flag?: "missing_image" | "needs_review" };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requirePermission(PERMISSIONS.PRODUCTS_VIEW);
  const params = await searchParams;

  const filters: ListProductsFilters = {
    search: params.q?.trim() || undefined,
    imageStatus:
      params.flag === "missing_image"
        ? "missing"
        : params.flag === "needs_review"
          ? "needs_review"
          : undefined,
  };

  const products = await listProducts(filters);

  return (
    <div>
      <PageHeader
        title="Products & Catalog"
        description="Catalog quality, supplier mapping, margin, and featured selection."
        breadcrumb={`${products.length} ${products.length === 1 ? "product" : "products"}`}
      />

      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <FilterPill href="/products" label="All" active={!params.flag} />
          <FilterPill
            href="/products?flag=missing_image"
            label="Missing images"
            active={params.flag === "missing_image"}
          />
          <FilterPill
            href="/products?flag=needs_review"
            label="Needs review"
            active={params.flag === "needs_review"}
          />
          <form action="/products" className="ml-auto flex items-center gap-2">
            {params.flag && <input type="hidden" name="flag" value={params.flag} />}
            <input
              type="search"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Search name, SKU, brand…"
              className="h-9 w-64 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </form>
        </div>

        {products.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title="No products match these filters"
            description="Adjust filters or run pnpm db:seed to populate sample products."
          />
        ) : (
          <DataTable>
            <THead>
              <tr>
                <TH>Product</TH>
                <TH>SKU</TH>
                <TH>Category</TH>
                <TH>Store</TH>
                <TH>Supplier</TH>
                <TH align="right">Price</TH>
                <TH align="right">Cost</TH>
                <TH align="right">Margin</TH>
                <TH align="right">Stock</TH>
                <TH>Quality</TH>
              </tr>
            </THead>
            <TBody>
              {products.map((p) => (
                <TR key={p.id}>
                  <TD>
                    <div className="flex items-center gap-2">
                      {p.isFeatured && <Star className="h-3 w-3 fill-warning text-warning" />}
                      <Link href={`/products/${p.id}`} className="font-medium hover:underline">
                        {p.name}
                      </Link>
                    </div>
                    {p.brand && <div className="text-xs text-muted-foreground">{p.brand}</div>}
                  </TD>
                  <TD className="font-mono text-xs text-muted-foreground">{p.sku ?? "—"}</TD>
                  <TD className="text-muted-foreground">{p.category?.name ?? "—"}</TD>
                  <TD className="text-muted-foreground">{p.store?.name ?? "—"}</TD>
                  <TD className="text-muted-foreground">
                    {p.primarySupplier ? p.primarySupplier.name : "—"}
                  </TD>
                  <TD align="right" className="tabular-nums">
                    {formatCurrency(p.price)}
                  </TD>
                  <TD align="right" className="tabular-nums text-muted-foreground">
                    {p.cost != null ? formatCurrency(p.cost) : "—"}
                  </TD>
                  <TD align="right" className="tabular-nums">
                    {p.margin != null ? (
                      <span
                        className={
                          p.margin < 0.25
                            ? "font-medium text-destructive"
                            : p.margin < 0.35
                              ? "text-warning"
                              : ""
                        }
                      >
                        {formatPercent(p.margin, 1)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TD>
                  <TD align="right" className="tabular-nums">
                    {p.stock}
                  </TD>
                  <TD>
                    <div className="flex flex-wrap gap-1">
                      {p.imageStatus === "missing" && (
                        <Badge variant="destructive" className="text-[10px]">
                          <ImageOff className="mr-0.5 h-2.5 w-2.5" /> No image
                        </Badge>
                      )}
                      {p.imageStatus === "needs_review" && (
                        <Badge variant="warning" className="text-[10px]">
                          Image review
                        </Badge>
                      )}
                      {p.descriptionStatus === "missing" && (
                        <Badge variant="destructive" className="text-[10px]">
                          No description
                        </Badge>
                      )}
                      {p.descriptionStatus === "needs_review" && (
                        <Badge variant="warning" className="text-[10px]">
                          Desc. review
                        </Badge>
                      )}
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </DataTable>
        )}
      </div>
    </div>
  );
}

function FilterPill({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
          : "rounded-md border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
      }
    >
      {label}
    </Link>
  );
}
