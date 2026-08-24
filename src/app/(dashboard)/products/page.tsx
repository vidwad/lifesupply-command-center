import Link from "next/link";
import { Boxes, ImageOff, Star } from "lucide-react";

import { DataTable, TBody, TD, TH, THead, TR } from "@/components/data/DataTable";
import { Pagination } from "@/components/data/Pagination";
import { SortHeader } from "@/components/data/SortHeader";
import { ExportButton } from "@/components/data/ExportButton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatCurrency, formatPercent } from "@/lib/format";
import { PERMISSIONS } from "@/lib/permissions";
import {
  countProducts,
  countProductsByQuality,
  listProducts,
  parseProductSort,
  parseSortDirection,
  PRODUCTS_PAGE_SIZE,
  type ListProductsFilters,
} from "@/server/services/products";
import { requirePermission, userHasPermission } from "@/server/permissions";
import { SyncButtons } from "@/components/sync/SyncButtons";

export const metadata = { title: "Products & Catalog" };
export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  flag?: "missing_image" | "needs_review";
  /** Set by the shell's Division selector. */
  division?: string;
  page?: string;
  sort?: string;
  dir?: string;
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requirePermission(PERMISSIONS.PRODUCTS_VIEW);
  const params = await searchParams;
  const canExport = userHasPermission(user, PERMISSIONS.PRODUCTS_EXPORT);
  const canSync = userHasPermission(user, PERMISSIONS.ADMIN_MANAGE_INTEGRATIONS);

  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  // Unknown sort keys fall back to the default ordering rather than erroring —
  // a hand-edited URL should not break the page.
  const sort = parseProductSort(params.sort);
  const dir = parseSortDirection(params.dir);
  const filters: ListProductsFilters = {
    search: params.q?.trim() || undefined,
    // Honours the Division selector in the app shell. Absent = all divisions.
    divisionId: params.division?.trim() || undefined,
    imageStatus:
      params.flag === "missing_image"
        ? "missing"
        : params.flag === "needs_review"
          ? "needs_review"
          : undefined,
    page,
    sort,
    dir,
  };

  // The count uses the same filters as the rows, so the header total and the
  // page count can never disagree with what is actually listed. The quality
  // counts ignore the quality filter itself, so each pill reads as "what you
  // would get if you clicked this".
  const [products, totalProducts, qualityCounts] = await Promise.all([
    listProducts(filters),
    countProducts(filters),
    countProductsByQuality(filters),
  ]);

  // Changing the flag resets to page 1 — staying on page 7 of a different
  // filter would usually land on an empty page. Sort is preserved: it is a
  // view preference, not a filter.
  const pillHref = (flag: SearchParams["flag"]): string => {
    const qs = new URLSearchParams();
    if (flag) qs.set("flag", flag);
    if (params.q) qs.set("q", params.q);
    if (params.division) qs.set("division", params.division);
    if (sort) qs.set("sort", sort);
    if (params.dir === "desc") qs.set("dir", "desc");
    const s = qs.toString();
    return `/products${s ? `?${s}` : ""}`;
  };

  // Params every header link and the pagination footer must carry forward.
  const carried = {
    q: params.q,
    flag: params.flag,
    division: params.division,
  };

  return (
    <div>
      <PageHeader
        title="Products & Catalog"
        description="Catalog quality, supplier mapping, margin, and featured selection."
        breadcrumb={`${totalProducts.toLocaleString()} ${totalProducts === 1 ? "product" : "products"}`}
        actions={
          <div className="flex items-center gap-3">
            {canSync ? <SyncButtons entity="products" /> : null}
            {canExport ? <ExportButton href="/api/exports/products" /> : null}
          </div>
        }
      />

      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <FilterPill
            href={pillHref(undefined)}
            label="All"
            count={qualityCounts.all}
            active={!params.flag}
          />
          <FilterPill
            href={pillHref("missing_image")}
            label="Missing images"
            count={qualityCounts.missingImage}
            active={params.flag === "missing_image"}
          />
          <FilterPill
            href={pillHref("needs_review")}
            label="Needs review"
            count={qualityCounts.needsReview}
            active={params.flag === "needs_review"}
          />
          <form action="/products" className="ml-auto flex items-center gap-2">
            {params.flag && <input type="hidden" name="flag" value={params.flag} />}
            {params.division && <input type="hidden" name="division" value={params.division} />}
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
            description="Adjust the filters above, or run a BigCommerce product sync to import the catalogue."
          />
        ) : (
          <DataTable>
            <THead>
              <tr>
                <SortHeader
                  label="Product"
                  sortKey="name"
                  activeKey={sort}
                  activeDir={dir}
                  basePath="/products"
                  params={carried}
                />
                <SortHeader
                  label="SKU"
                  sortKey="sku"
                  activeKey={sort}
                  activeDir={dir}
                  basePath="/products"
                  params={carried}
                />
                <SortHeader
                  label="Category"
                  sortKey="category"
                  activeKey={sort}
                  activeDir={dir}
                  basePath="/products"
                  params={carried}
                />
                <SortHeader
                  label="Store"
                  sortKey="store"
                  activeKey={sort}
                  activeDir={dir}
                  basePath="/products"
                  params={carried}
                />
                {/* Supplier, Price, Cost, Margin and Stock are derived from
                    variant and supplier rows after the query, so the database
                    cannot order by them. Sorting only the fetched page would
                    look like a catalogue-wide sort and would not be one, so
                    these headers stay inert. See PRODUCT_SORT_KEYS. */}
                <TH>Supplier</TH>
                <TH align="right">Price</TH>
                <TH align="right">Cost</TH>
                <TH align="right">Margin</TH>
                <TH align="right">Stock</TH>
                <SortHeader
                  label="Quality"
                  sortKey="quality"
                  activeKey={sort}
                  activeDir={dir}
                  basePath="/products"
                  params={carried}
                />
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

        <Pagination
          basePath="/products"
          page={page}
          pageSize={PRODUCTS_PAGE_SIZE}
          totalCount={totalProducts}
          params={{ ...carried, sort: params.sort, dir: params.dir }}
        />
      </div>
    </div>
  );
}

function FilterPill({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  /** How many products this filter would return under the other active filters. */
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
          : "inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
      }
    >
      {label}
      <span
        className={
          active
            ? "rounded bg-primary-foreground/20 px-1.5 py-0.5 tabular-nums"
            : "rounded bg-muted px-1.5 py-0.5 tabular-nums text-foreground/70"
        }
      >
        {count.toLocaleString()}
      </span>
    </Link>
  );
}
