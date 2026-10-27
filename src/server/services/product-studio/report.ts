/**
 * Product Studio summary report (product owner, 2026-10-26): one page per
 * selected project with everything material the detail page shows, as a
 * PDF for review away from the screen.
 *
 * `summarizeProject` is pure and builds a plain snapshot from the loaded
 * rows; `buildProductStudioReport` loads the projects and attaches image
 * bytes for the latest draft of each composition and the first source
 * photographs. Nothing here writes anything.
 */
import { getProductStudioAsset, getProductStudioProject, summarizeProjectAssets } from "./index";
import { stripListingLinks } from "./listing-copy";
import { parseListingBlocks, type ListingBlock } from "./listing-format";
import { latestGeneratedBySlot } from "./publish-eligibility";
import { listPublishLogs } from "./publish-read";
import { storePriceContext, type StorePriceContext } from "./store-price";

export const MAX_REPORT_PROJECTS = 50;

type Loaded = NonNullable<Awaited<ReturnType<typeof getProductStudioProject>>>;
type Logs = Awaited<ReturnType<typeof listPublishLogs>>;

export type ReportImage = {
  /** JPEG or PNG bytes; WebP cannot be embedded and is left out. */
  data: Uint8Array;
  format: "jpg" | "png";
};

export type ReportComposition = {
  slot: number;
  name: string;
  purpose: string | null;
  reviewStatus: string;
  revision: number | null;
  qaVerdict: string | null;
  qaConfidence: number | null;
  requiredCorrections: string[];
  uploadApproved: boolean;
  publishedAt: Date | null;
  bigCommerceImageId: number | null;
  isMainImage: boolean;
  image: ReportImage | null;
};

export type ProjectReport = {
  id: string;
  title: string;
  shortDescription: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  batchId: string | null;
  product: {
    name: string;
    sku: string | null;
    store: string | null;
    bigCommerceId: string | null;
  } | null;
  identity: {
    brand: string | null;
    model: string | null;
    confidence: number | null;
    mode: string | null;
    identifiers: string[];
    conditionNotes: string[];
  };
  description: ListingBlock[];
  keyDetails: string[];
  market: {
    currency: string;
    low: number | null;
    high: number | null;
    median: number | null;
    basis: string | null;
    observationCount: number;
    observations: { seller: string; price: number; currency: string; condition: string | null }[];
    /** The store's own listed price against the range; null when unlinked or unpriced. */
    store: StorePriceContext | null;
  };
  sources: { seller: string; title: string | null; url: string }[];
  sourcePhotos: ReportImage[];
  sourcePhotoCount: number;
  compositions: ReportComposition[];
  publishing: {
    descriptionUploadApproved: boolean;
    descriptionPublishedAt: Date | null;
    history: { at: Date; label: string; status: string; error: string | null }[];
  };
  warnings: string[];
  counts: { sourceCount: number; approvedSlots: number; publishedSlots: number };
};

export type ProductStudioReport = {
  generatedAt: Date;
  preparedBy: string;
  projects: ProjectReport[];
  /** Ids that were requested but not found. */
  missing: string[];
};

const record = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
const str = (value: unknown): string | null => (typeof value === "string" ? value : null);
const num = (value: unknown): number | null => {
  const parsed = Number(value);
  return value != null && Number.isFinite(parsed) ? parsed : null;
};
const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

/**
 * The store's listed price and cost from the linked product, as the products
 * list reads them, against this project's researched range.
 */
export function storePriceFor(project: Loaded): StorePriceContext | null {
  const product = project.product;
  if (!product) return null;
  const variant = product.variants[0];
  // A zero variant cost means "not known", so the preferred supplier's cost
  // is the fallback, as on the products list.
  const variantCost = num(variant?.costPrice);
  return storePriceContext({
    storeName: product.store?.name ?? null,
    currency: project.currency,
    price: variant ? num(variant.price) : null,
    cost:
      variantCost != null && variantCost > 0 ? variantCost : num(product.supplierProducts[0]?.cost),
    market: {
      currency: project.currency,
      low: num(project.marketLow),
      high: num(project.marketHigh),
      median: num(project.marketMedian),
      observations: project.priceObservations.map((item) => ({
        price: Number(item.price),
        currency: item.currency,
      })),
    },
  });
}

/** The plain snapshot of one project, without image bytes. */
export function summarizeProject(project: Loaded, logs: Logs): Omit<ProjectReport, "sourcePhotos"> {
  const summary = record(project.researchSummary);
  const identity = record(summary?.identifiedProduct);
  const latest = latestGeneratedBySlot(project.assets);
  const compositions: ReportComposition[] = project.compositions.map((composition) => {
    const asset = latest.find((item) => item.compositionSlot === composition.slot) ?? null;
    const qa = record(asset?.qaResult);
    const attributes = record(composition.attributes);
    return {
      slot: composition.slot,
      name: composition.name,
      purpose: str(attributes?.purpose),
      reviewStatus: asset?.status ?? composition.status,
      revision: asset?.revision ?? null,
      qaVerdict: str(qa?.verdict),
      qaConfidence: num(qa?.confidence),
      requiredCorrections: strings(qa?.requiredCorrections),
      uploadApproved: asset?.uploadApprovedAt != null,
      publishedAt: asset?.publishedAt ?? null,
      bigCommerceImageId: asset?.bigCommerceImageId ?? null,
      isMainImage: asset != null && asset.id === project.mainImageAssetId,
      image: null,
    };
  });
  const sorted = [...project.priceObservations].sort((a, b) => Number(a.price) - Number(b.price));
  return {
    id: project.id,
    title: stripListingLinks(project.confirmedTitle ?? project.title),
    shortDescription: stripListingLinks(project.finalDescription ?? project.shortDescription),
    status: project.status,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    createdBy: project.createdBy?.name ?? project.createdBy?.email ?? null,
    batchId: project.batchId,
    product: project.product
      ? {
          name: project.product.name,
          sku: project.product.sku,
          store: project.product.store?.name ?? null,
          bigCommerceId:
            project.product.sourceSystem?.toLowerCase() === "bigcommerce"
              ? (project.product.sourceId ?? null)
              : null,
        }
      : null,
    identity: {
      brand: str(identity?.brand),
      model: str(identity?.model),
      confidence: num(identity?.confidence),
      mode: str(identity?.productMode),
      identifiers: strings(identity?.modelIdentifiers),
      conditionNotes: strings(identity?.conditionNotes),
    },
    description: parseListingBlocks(stripListingLinks(project.longDescription ?? "")),
    keyDetails: strings(summary?.keyDetails).map(stripListingLinks),
    market: {
      currency: project.currency,
      low: num(project.marketLow),
      high: num(project.marketHigh),
      median: num(project.marketMedian),
      basis: str(summary?.marketBasis),
      observationCount: project.priceObservations.length,
      observations: sorted.slice(0, 8).map((item) => ({
        seller: item.sellerName,
        price: Number(item.price),
        currency: item.currency,
        condition: item.condition,
      })),
      store: storePriceFor(project),
    },
    sources: project.researchSources.map((source) => ({
      seller: source.sellerName,
      title: source.pageTitle,
      url: source.url,
    })),
    sourcePhotoCount: project.assets.filter((asset) => asset.kind === "source").length,
    compositions,
    publishing: {
      descriptionUploadApproved: project.descriptionUploadApprovedAt != null,
      descriptionPublishedAt: project.descriptionPublishedAt,
      history: logs.slice(0, 12).map((log) => ({
        at: log.writtenAt ?? log.createdAt,
        label:
          log.kind === "description"
            ? "Full description"
            : "Composition " +
              String(log.asset?.compositionSlot ?? "?") +
              (log.bigCommerceImageId != null ? " → image #" + String(log.bigCommerceImageId) : ""),
        status: log.status,
        error: log.errorMessage,
      })),
    },
    warnings: project.warnings,
    counts: summarizeProjectAssets(project.assets),
  };
}

function imageOf(asset: { contentType: string; data: Uint8Array } | null): ReportImage | null {
  if (!asset) return null;
  if (asset.contentType === "image/jpeg") return { data: asset.data, format: "jpg" };
  if (asset.contentType === "image/png") return { data: asset.data, format: "png" };
  return null;
}

export async function buildProductStudioReport(args: {
  ids: string[];
  preparedBy: string;
  now?: Date;
}): Promise<ProductStudioReport> {
  const ids = [...new Set(args.ids.map((id) => id.trim()).filter(Boolean))].slice(
    0,
    MAX_REPORT_PROJECTS,
  );
  const projects: ProjectReport[] = [];
  const missing: string[] = [];
  for (const id of ids) {
    const project = await getProductStudioProject(id);
    if (!project) {
      missing.push(id);
      continue;
    }
    const logs = await listPublishLogs(id);
    const snapshot = summarizeProject(project, logs);
    const latest = latestGeneratedBySlot(project.assets);
    for (const composition of snapshot.compositions) {
      const asset = latest.find((item) => item.compositionSlot === composition.slot);
      if (asset) composition.image = imageOf(await getProductStudioAsset(asset.id));
    }
    const sourcePhotos: ReportImage[] = [];
    for (const asset of project.assets.filter((item) => item.kind === "source").slice(0, 4)) {
      const image = imageOf(await getProductStudioAsset(asset.id));
      if (image) sourcePhotos.push(image);
    }
    projects.push({ ...snapshot, sourcePhotos });
  }
  return { generatedAt: args.now ?? new Date(), preparedBy: args.preparedBy, projects, missing };
}
