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
  listProducts,
  loadProductPopulation,
  parseNonNegativeInt,
  parseProductSort,
  parseSortDirection,
  PRODUCTS_PAGE_SIZE,
  summarizeProductCounts,
  type ListProductsFilters,
} from "@/server/services/products";
import {
  buildPerformanceIndex,
  parsePerformanceSegment,
  parseTopSellerLimit,
  performanceDefinitions,
  PERFORMANCE_SEGMENTS,
  TOP_SELLER_DEFAULT,
  TOP_SELLER_MAX,
  WINDOW_DAYS,
} from "@/server/services/products/performance";
import { requirePermission, userHasPermission } from "@/server/permissions";
import { SyncButtons } from "@/components/sync/SyncButtons";

import { BULK_STUDIO_FORM_ID, BulkStudioBar } from "./bulk-studio-bar";

export const metadata = { title: "Products & Catalog" };
export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  flag?: "missing_image" | "needs_review";
  /** A sales performance segment (2026-10-26). */
  perf?: string;
  /** How many products count as top sellers (2026-10-28); absent means the default. */
  top?: string;
  /** Set by the shell's Division selector. */
  division?: string;
  /** At most this many store images (2026-10-27). */
  img?: string;
  /** Description text shorter than this many characters. */
  desc?: string;
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
  // The same two permissions Product Studio itself requires.
  const canStudio =
    userHasPermission(user, PERMISSIONS.PRODUCTS_UPDATE) &&
    userHasPermission(user, PERMISSIONS.AI_USE);
  // Unattended runs (2026-10-27) take the Super Admin-only publish permission.
  const canAutopilot =
    canStudio && userHasPermission(user, PERMISSIONS.PRODUCTS_APPROVE_BIGCOMMERCE_UPDATE);

  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  // Unknown sort keys fall back to the default ordering rather than erroring —
  // a hand-edited URL should not break the page.
  const sort = parseProductSort(params.sort);
  const dir = parseSortDirection(params.dir);
  const perf = parsePerformanceSegment(params.perf);
  const topLimit = parseTopSellerLimit(params.top);
  // Carried on links only when it differs from the default, so ordinary
  // addresses stay short and a bookmark made before the input existed still
  // means what it meant.
  const topParam = topLimit === TOP_SELLER_DEFAULT ? undefined : String(topLimit);
  const definitions = performanceDefinitions(topLimit);
  const maxImages = parseNonNegativeInt(params.img);
  const maxDescriptionChars = parseNonNegativeInt(params.desc);
  // The top sellers are a ranked list, so with that segment active and no
  // column chosen the whole segment is ordered by revenue across its pages
  // (listProductsByRevenue), never a page-local shuffle. A chosen column
  // takes precedence.
  const effectiveSort = sort ?? (perf === "top" ? "revenue" : undefined);
  const effectiveDir = sort ? dir : perf === "top" ? "desc" : dir;
  // Classified from the sales figures the process shares (loaded once,
  // fresh within ten minutes); the rows, the total and every pill count
  // read these same figures.
  const performanceIndex = await buildPerformanceIndex(new Date(), topLimit);
  const filters: ListProductsFilters = {
    performance: perf,
    performanceIndex,
    maxImages,
    maxDescriptionChars,
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
    sort: effectiveSort,
    dir: effectiveDir,
  };

  // The header total, the quality pills and the segment pills all come from
  // one scan of the products under the other filters, judged by the same
  // predicates the rows use, so the total can never disagree with what is
  // listed, and each pill reads as "what you would get if you clicked this".
  const [listed, population] = await Promise.all([
    listProducts(filters),
    loadProductPopulation(filters),
  ]);
  const counts = summarizeProductCounts(population, filters, performanceIndex);
  const totalProducts = counts.total;
  const qualityCounts = counts.quality;
  const performanceCounts = counts.performance;
  const salesFor = (id: string) => performanceIndex.stats.get(id);
  const products = listed;

  // Changing the flag resets to page 1 — staying on page 7 of a different
  // filter would usually land on an empty page. Sort is preserved: it is a
  // view preference, not a filter.
  const buildHref = (flag: SearchParams["flag"], segment: string | undefined): string => {
    const qs = new URLSearchParams();
    if (flag) qs.set("flag", flag);
    if (segment) qs.set("perf", segment);
    if (topParam) qs.set("top", topParam);
    if (params.q) qs.set("q", params.q);
    if (params.division) qs.set("division", params.division);
    if (maxImages != null) qs.set("img", String(maxImages));
    if (maxDescriptionChars != null) qs.set("desc", String(maxDescriptionChars));
    if (sort) qs.set("sort", sort);
    if (params.dir === "desc") qs.set("dir", "desc");
    const s = qs.toString();
    return `/products${s ? `?${s}` : ""}`;
  };
  const pillHref = (flag: SearchParams["flag"]): string => buildHref(flag, perf);
  const perfHref = (segment: string | undefined): string => buildHref(params.flag, segment);

  // Params every header link and the pagination footer must carry forward.
  const carried = {
    q: params.q,
    flag: params.flag,
    perf,
    top: topParam,
    division: params.division,
    img: maxImages != null ? String(maxImages) : undefined,
    desc: maxDescriptionChars != null ? String(maxDescriptionChars) : undefined,
  };
  const anyTextFilter = Boolean(params.q || maxImages != null || maxDescriptionChars != null);

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

      <div className="space-y-4 p-4 md:p-6">
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
        </div>

        {/*
         * Sales segments (2026-10-26), close equivalents of BigCommerce
         * Insights computed from the synced order lines. The definition of the
         * active segment is spelled out so "cold" means one stated thing here.
         */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Performance</span>
          <FilterPill href={perfHref(undefined)} label="Any" count={undefined} active={!perf} />
          {PERFORMANCE_SEGMENTS.map((segment) => (
            <FilterPill
              key={segment}
              href={perfHref(segment)}
              label={definitions[segment].label}
              count={performanceCounts[segment]}
              active={perf === segment}
            />
          ))}
          <span className="basis-full text-xs text-muted-foreground sm:basis-auto sm:pl-2">
            {perf
              ? definitions[perf].definition
              : `From orders synced from the stores, excluding cancelled and refunded orders; figures cover the last ${WINDOW_DAYS} days.`}
          </span>
        </div>

        {/*
         * Search and the catalogue thresholds (product owner, 2026-10-27) in
         * one form, so Apply keeps all three together. Both thresholds are
         * database filters on columns the sync maintains, so they apply to
         * the whole catalogue and the counts above honour them.
         */}
        <form action="/products" className="flex flex-wrap items-center gap-2">
          {params.flag && <input type="hidden" name="flag" value={params.flag} />}
          {params.division && <input type="hidden" name="division" value={params.division} />}
          {perf && <input type="hidden" name="perf" value={perf} />}
          {sort && <input type="hidden" name="sort" value={sort} />}
          {params.dir === "desc" && <input type="hidden" name="dir" value="desc" />}
          <input
            type="search"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search name, SKU, brand…"
            className="h-9 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-64"
          />
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Images at most
            <input
              type="number"
              name="img"
              min={0}
              step={1}
              defaultValue={maxImages ?? ""}
              aria-label="Maximum number of store images"
              className="h-9 w-16 rounded-md border bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Description under
            <input
              type="number"
              name="desc"
              min={1}
              step={1}
              defaultValue={maxDescriptionChars ?? ""}
              aria-label="Maximum description length in characters"
              className="h-9 w-20 rounded-md border bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            characters
          </label>
          {/* How many products the "Top sellers" segment holds (product
              owner, 2026-10-28). It changes the definition beside the
              filters and the pill count, not which rows the other
              segments return. */}
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Top sellers
            <input
              type="number"
              name="top"
              min={1}
              max={TOP_SELLER_MAX}
              step={1}
              defaultValue={topLimit}
              aria-label="Number of products counted as top sellers"
              className="h-9 w-20 rounded-md border bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            products
          </label>
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-md border bg-background px-3 text-xs font-medium hover:bg-accent"
          >
            Apply
          </button>
          {anyTextFilter ? (
            <Link
              href={buildHrefWithout(params, perf, topParam, sort)}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Clear
            </Link>
          ) : null}
          {maxImages != null || maxDescriptionChars != null ? (
            <span className="basis-full text-xs text-muted-foreground">
              {[
                maxImages != null
                  ? `at most ${maxImages} store ${maxImages === 1 ? "image" : "images"}`
                  : null,
                maxDescriptionChars != null
                  ? `description text under ${maxDescriptionChars.toLocaleString()} characters, markup excluded`
                  : null,
              ]
                .filter(Boolean)
                .join(" and ")}
              . Both read what the last sync stored.
            </span>
          ) : null}
        </form>

        {canStudio && products.length > 0 ? <BulkStudioBar canAutopilot={canAutopilot} /> : null}

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
                {canStudio ? (
                  <TH>
                    <span className="sr-only">Select for Product Studio</span>
                  </TH>
                ) : null}
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
                <TH align="right">Units {WINDOW_DAYS}d</TH>
                {/* Revenue orders the whole matching set from the sales index
                    (see listProductsByRevenue); first click is descending. */}
                <SortHeader
                  label={`Revenue ${WINDOW_DAYS}d`}
                  sortKey="revenue"
                  activeKey={effectiveSort}
                  activeDir={effectiveDir}
                  basePath="/products"
                  params={carried}
                  align="right"
                  defaultDir="desc"
                />
                {/* Images the store lists for the product, from the last sync,
                    kept on the product row so it sorts in the database. */}
                <SortHeader
                  label="Images"
                  sortKey="images"
                  activeKey={sort}
                  activeDir={dir}
                  basePath="/products"
                  params={carried}
                  align="right"
                />
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
                  {canStudio ? (
                    <TD>
                      <input
                        type="checkbox"
                        name="productId"
                        value={p.id}
                        form={BULK_STUDIO_FORM_ID}
                        aria-label={`Select ${p.name} for Product Studio`}
                        className="h-4 w-4 accent-primary"
                      />
                    </TD>
                  ) : null}
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
                  <TD align="right" className="tabular-nums">
                    {salesFor(p.id)?.units90 ?? 0}
                  </TD>
                  <TD align="right" className="tabular-nums">
                    {formatCurrency(salesFor(p.id)?.revenue90 ?? 0)}
                  </TD>
                  <TD
                    align="right"
                    className={
                      p.imageCount === 0 ? "tabular-nums text-destructive" : "tabular-nums"
                    }
                  >
                    {p.imageCount}
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

/** The list with search and both thresholds cleared, the rest kept. */
function buildHrefWithout(
  params: SearchParams,
  perf: string | undefined,
  top: string | undefined,
  sort: string | undefined,
): string {
  const qs = new URLSearchParams();
  if (params.flag) qs.set("flag", params.flag);
  if (perf) qs.set("perf", perf);
  if (top) qs.set("top", top);
  if (params.division) qs.set("division", params.division);
  if (sort) qs.set("sort", sort);
  if (params.dir === "desc") qs.set("dir", "desc");
  const s = qs.toString();
  return `/products${s ? `?${s}` : ""}`;
}

function FilterPill({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  /** How many products this filter would return under the other active filters; omitted for "Any". */
  count?: number;
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
      {count != null ? (
        <span
          className={
            active
              ? "rounded bg-primary-foreground/20 px-1.5 py-0.5 tabular-nums"
              : "rounded bg-muted px-1.5 py-0.5 tabular-nums text-foreground/70"
          }
        >
          {count.toLocaleString()}
        </span>
      ) : null}
    </Link>
  );
}
