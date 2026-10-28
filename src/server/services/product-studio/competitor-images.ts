/**
 * A seller's image as the reference when a project has no photograph
 * (product owner, 2026-10-28).
 *
 * Research and every generated draft are grounded in the project's
 * authoritative photographs, so a product the store has no image of could
 * not start. The owner asked for a way out: search other sellers of the same
 * product for their listing image, show one thumbnail per seller, and let the
 * operator choose one as the replacement authoritative image.
 *
 * How it stays honest:
 * - The search is the same OpenAI web-search call research uses, and a seller
 *   is kept only when its listing domain appears in the web-search evidence;
 *   a seller the model named from memory is dropped before anything is
 *   fetched. The operator's own stores are never candidates.
 * - Each candidate image is fetched once, bounded in host, type, size and
 *   time, hashed, and kept only as a small thumbnail for choosing. The full
 *   image is fetched again when the operator selects it, and is accepted only
 *   if its hash still matches what was shown, so what was chosen is what is
 *   stored.
 * - The chosen image becomes an ordinary source asset, with the candidate
 *   linked to it, so the page can say which seller it came from and research
 *   is told it is a listing image rather than a photograph of the operator's
 *   stock (jobs.ts).
 * - Nothing here publishes, generates or writes to a store, and every step is
 *   refused while an unattended run owns the project or once research has
 *   locked the photographs.
 */
import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import type { Prisma } from "@prisma/client";
import sharp from "sharp";

import { FEATURE_FLAGS } from "@/lib/feature-flags";
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db/client";
import { inngest } from "@/server/inngest/client";
import { requireFeature } from "@/server/services/feature-flags";

import { assertNotUnderAutopilot, ProductStudioInputError } from "./index";
import { searchSellerProductImages } from "./openai";
import { shrinkForReport } from "./report-images";
import { reportThumbnailFor } from "./report-thumbnails";
import { MAX_SOURCE_PHOTOS, sourcePhotosLocked } from "./source-photos";
import type { SellerImageCandidate } from "./types";

/** At most this many sellers are kept and fetched per search. */
export const MAX_IMAGE_CANDIDATES = 8;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 20_000;

/** The operator's own storefronts. Their images are the catalogue's, never a competitor's. */
export const OWN_STORE_HOSTS = [
  "lifesupply.ca",
  "wellmartmedical.com",
  "lifesupplyclinics.com",
  "balkowitsch.com",
];

export function hostOf(url: string): string {
  return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
}

export function isOwnStoreHost(host: string): boolean {
  const h = host.replace(/^www\./i, "").toLowerCase();
  return OWN_STORE_HOSTS.some((own) => h === own || h.endsWith("." + own));
}

const SOURCE_RANK: Record<SellerImageCandidate["sourceType"], number> = {
  manufacturer: 0,
  distributor: 1,
  retailer: 2,
  marketplace: 3,
};

export type CandidateReconciliation = {
  kept: SellerImageCandidate[];
  /** Why each dropped candidate was dropped, by listing host. */
  dropped: { host: string; reason: string }[];
};

/**
 * Keeps the candidates the evidence supports, one per seller, the
 * manufacturer first. Pure.
 *
 * - A listing whose domain is not in the web-search evidence is dropped: the
 *   model may have named the seller from memory.
 * - The operator's own stores are dropped.
 * - A listing or image URL this module would refuse to fetch is dropped.
 * - One candidate per listing host, the most confident; then ordered by
 *   source type (manufacturer, distributor, retailer, marketplace) and
 *   confidence, capped at MAX_IMAGE_CANDIDATES.
 */
export function reconcileCandidatesWithEvidence(
  candidates: readonly SellerImageCandidate[],
  evidenceUrls: readonly string[],
): CandidateReconciliation {
  const verified = new Set(evidenceUrls.map(hostOf));
  const dropped: CandidateReconciliation["dropped"] = [];
  const byHost = new Map<string, SellerImageCandidate>();
  for (const candidate of candidates) {
    const host = hostOf(candidate.pageUrl);
    if (isOwnStoreHost(host)) {
      dropped.push({ host, reason: "the operator's own store" });
      continue;
    }
    if (!verified.has(host)) {
      dropped.push({ host, reason: "not in the web-search evidence" });
      continue;
    }
    const problem = imageUrlProblem(candidate.imageUrl) ?? imageUrlProblem(candidate.pageUrl);
    if (problem) {
      dropped.push({ host, reason: problem });
      continue;
    }
    const current = byHost.get(host);
    if (!current || candidate.matchConfidence > current.matchConfidence) {
      byHost.set(host, candidate);
    }
  }
  const kept = [...byHost.values()]
    .sort(
      (a, b) =>
        SOURCE_RANK[a.sourceType] - SOURCE_RANK[b.sourceType] ||
        b.matchConfidence - a.matchConfidence,
    )
    .slice(0, MAX_IMAGE_CANDIDATES);
  return { kept, dropped };
}

/**
 * Why a URL must not be fetched, or null when it may be. The URLs come from
 * a model reading the web, so the fetch is bounded to public HTTP(S) hosts by
 * name: no credentials, no odd ports, no IP literals, no local names.
 */
export function imageUrlProblem(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "not a valid URL";
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "not an HTTP(S) URL";
  if (parsed.username || parsed.password) return "URL carries credentials";
  if (parsed.port && parsed.port !== "80" && parsed.port !== "443") return "non-standard port";
  const host = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (isIP(host)) return "IP address rather than a host name";
  if (!host.includes(".")) return "not a public host name";
  if (/\.(local|localhost|internal|lan|home|arpa)$/.test(host) || host === "localhost") {
    return "local host name";
  }
  return null;
}

/** Loopback, link-local, private and unspecified ranges, v4 and v6. */
export function isPrivateAddress(address: string): boolean {
  const ip = address.toLowerCase();
  if (ip.startsWith("::ffff:")) return isPrivateAddress(ip.slice(7));
  if (isIP(ip) === 6) {
    return (
      ip === "::" ||
      ip === "::1" ||
      ip.startsWith("fe80:") ||
      ip.startsWith("fc") ||
      ip.startsWith("fd") ||
      ip.startsWith("fec0:")
    );
  }
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts as [number, number, number, number];
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a >= 224
  );
}

async function resolvesPublicly(host: string): Promise<boolean> {
  try {
    const addresses = await lookup(host, { all: true, verbatim: true });
    return addresses.length > 0 && addresses.every((entry) => !isPrivateAddress(entry.address));
  } catch {
    return false;
  }
}

export type FetchedImage = {
  contentType: string;
  data: Buffer<ArrayBuffer>;
  bytes: number;
  width: number | null;
  height: number | null;
  contentHash: string;
};

export type FetchOutcome = { ok: true; image: FetchedImage } | { ok: false; reason: string };

function extensionFor(contentType: string): string {
  return contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
}

/**
 * Fetches one candidate image, bounded in host, type, size and time. The
 * host is checked by name and by the addresses it resolves to, and again by
 * name after redirects. The bytes must decode as a JPEG, PNG or WebP
 * whatever the server said they were.
 */
export async function fetchCandidateImage(url: string): Promise<FetchOutcome> {
  const problem = imageUrlProblem(url);
  if (problem) return { ok: false, reason: "Image URL refused: " + problem + "." };
  if (!(await resolvesPublicly(new URL(url).hostname))) {
    return { ok: false, reason: "Image host does not resolve to a public address." };
  }
  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
      cache: "no-store",
      headers: { Accept: "image/jpeg,image/png,image/webp,image/*;q=0.8" },
    });
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : "Image fetch failed." };
  }
  if (response.url && imageUrlProblem(response.url)) {
    return { ok: false, reason: "Image redirected to a host that is not fetched." };
  }
  if (!response.ok) return { ok: false, reason: "Image fetch returned HTTP " + response.status };
  const declaredLength = Number(response.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_IMAGE_BYTES) return { ok: false, reason: "Image exceeds 8 MiB." };
  const buffer = Buffer.from(await response.arrayBuffer()) as Buffer<ArrayBuffer>;
  if (buffer.byteLength === 0) return { ok: false, reason: "Image is empty." };
  if (buffer.byteLength > MAX_IMAGE_BYTES) return { ok: false, reason: "Image exceeds 8 MiB." };
  let metadata: sharp.Metadata;
  try {
    metadata = await sharp(buffer, { limitInputPixels: 64_000_000 }).metadata();
  } catch {
    return { ok: false, reason: "The bytes are not an image this tool can read." };
  }
  const contentType =
    metadata.format === "jpeg"
      ? "image/jpeg"
      : metadata.format === "png"
        ? "image/png"
        : metadata.format === "webp"
          ? "image/webp"
          : null;
  if (!contentType || !ALLOWED_IMAGE_TYPES.has(contentType)) {
    return { ok: false, reason: "Image is " + (metadata.format ?? "an unknown format") + "." };
  }
  return {
    ok: true,
    image: {
      contentType,
      data: buffer,
      bytes: buffer.byteLength,
      width: metadata.width ?? null,
      height: metadata.height ?? null,
      contentHash: createHash("sha256").update(buffer).digest("hex"),
    },
  };
}

type SearchableProject = {
  id: string;
  status: string;
  autopilotRunId: string | null;
  _count: { compositions: number };
};

async function loadSearchableProject(projectId: string): Promise<SearchableProject> {
  const project = await prisma.productStudioProject.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      status: true,
      autopilotRunId: true,
      _count: { select: { compositions: true } },
    },
  });
  if (!project) throw new ProductStudioInputError("Project not found.");
  return project;
}

function assertPhotosChangeable(project: SearchableProject): void {
  if (
    sourcePhotosLocked({ status: project.status, compositionCount: project._count.compositions })
  ) {
    throw new ProductStudioInputError(
      "Photographs are locked once research has run, because the identity analysis and every " +
        "prompt were derived from them. Start a new project to use a different image.",
    );
  }
}

/**
 * Queues a seller-image search for a project whose photographs may still
 * change. One search at a time per project; the worker runs it.
 */
export async function queueCompetitorImageSearch(args: {
  projectId: string;
  actorUserId: string;
}): Promise<string> {
  await requireFeature(FEATURE_FLAGS.PRODUCT_STUDIO);
  const project = await loadSearchableProject(args.projectId);
  await assertNotUnderAutopilot(project, "Searching sellers");
  assertPhotosChangeable(project);
  const live = await prisma.productStudioImageSearch.count({
    where: { projectId: project.id, status: { in: ["queued", "running"] } },
  });
  if (live > 0) throw new ProductStudioInputError("A seller-image search is already running.");
  const detail = await prisma.productStudioProject.findUniqueOrThrow({
    where: { id: project.id },
    select: {
      title: true,
      shortDescription: true,
      product: { select: { name: true, sku: true, brand: true } },
    },
  });
  const identifiers = [
    detail.product?.brand ? "Brand: " + detail.product.brand : null,
    detail.product?.sku ? "SKU: " + detail.product.sku : null,
    detail.product?.name && detail.product.name !== detail.title
      ? "Catalogue name: " + detail.product.name
      : null,
  ].filter((item): item is string => item != null);
  const search = await prisma.productStudioImageSearch.create({
    data: {
      projectId: project.id,
      requestedById: args.actorUserId,
      status: "queued",
      query: [detail.title, detail.shortDescription, ...identifiers].join("\n"),
    },
    select: { id: true },
  });
  await inngest.send({
    id: `product-studio-image-search-${search.id}`,
    name: "product-studio/image-search.requested",
    data: { searchId: search.id, projectId: project.id, actorUserId: args.actorUserId },
  });
  await writeAudit({
    actorUserId: args.actorUserId,
    action: "product_studio.image_search_queued",
    entityType: "ProductStudioProject",
    entityId: project.id,
    afterData: { searchId: search.id, identifiers },
  });
  return search.id;
}

export type ImageSearchJobResult = {
  searchId: string;
  candidates: number;
  fetched: number;
};

/**
 * Runs one queued search on the worker: the web-search call, the evidence
 * check, then one bounded fetch per kept seller, sequentially so memory
 * stays flat. Records the AI output, the candidates with their thumbnails
 * and the outcome; throws after recording a failure.
 */
export async function runCompetitorImageSearch(args: {
  searchId: string;
  actorUserId: string;
}): Promise<ImageSearchJobResult> {
  await requireFeature(FEATURE_FLAGS.PRODUCT_STUDIO);
  const search = await prisma.productStudioImageSearch.update({
    where: { id: args.searchId },
    data: { status: "running", startedAt: new Date(), errorMessage: null },
    include: {
      project: {
        select: {
          id: true,
          title: true,
          shortDescription: true,
          product: { select: { name: true, sku: true, brand: true } },
        },
      },
    },
  });
  const project = search.project;
  try {
    const call = await searchSellerProductImages({
      title: project.title,
      shortDescription: project.shortDescription,
      identifiers: [
        project.product?.brand ? "Brand: " + project.product.brand : null,
        project.product?.sku ? "SKU: " + project.product.sku : null,
        project.product?.name ? "Catalogue name: " + project.product.name : null,
      ].filter((item): item is string => item != null),
    });
    const { kept, dropped } = reconcileCandidatesWithEvidence(
      call.result.candidates,
      call.evidenceUrls,
    );
    const warnings = [...call.result.warnings];
    if (dropped.length > 0) {
      warnings.push(
        "Dropped " +
          String(dropped.length) +
          " listing" +
          (dropped.length === 1 ? "" : "s") +
          ": " +
          dropped.map((item) => item.host + " (" + item.reason + ")").join(", ") +
          ".",
      );
    }

    // One fetch at a time: each image is up to 8 MiB and the thumbnail is
    // made before the next is read, so the worker holds one image at once.
    const rows: Prisma.ProductStudioImageCandidateCreateManyInput[] = [];
    let fetched = 0;
    for (const [index, candidate] of kept.entries()) {
      const outcome = await fetchCandidateImage(candidate.imageUrl);
      const base = {
        searchId: search.id,
        projectId: project.id,
        sellerName: candidate.sellerName,
        pageTitle: candidate.pageTitle,
        pageUrl: candidate.pageUrl,
        imageUrl: candidate.imageUrl,
        sourceType: candidate.sourceType,
        imageKind: candidate.imageKind,
        notes: candidate.whyMatch,
        matchConfidence: candidate.matchConfidence,
        sortOrder: index,
      };
      if (!outcome.ok) {
        rows.push({ ...base, fetchError: outcome.reason });
        continue;
      }
      const thumbnail = await shrinkForReport({
        contentType: outcome.image.contentType,
        data: outcome.image.data,
      });
      if (!thumbnail) {
        rows.push({ ...base, fetchError: "The image could not be decoded for a thumbnail." });
        continue;
      }
      fetched += 1;
      rows.push({
        ...base,
        contentType: outcome.image.contentType,
        bytes: outcome.image.bytes,
        width: outcome.image.width,
        height: outcome.image.height,
        contentHash: outcome.image.contentHash,
        thumbnail: Buffer.from(thumbnail.data),
      });
    }

    await prisma.$transaction(async (tx) => {
      if (rows.length > 0) {
        await tx.productStudioImageCandidate.createMany({ data: rows });
      }
      await tx.productStudioImageSearch.update({
        where: { id: search.id },
        data: {
          status: "succeeded",
          modelName: call.modelName,
          warnings,
          completedAt: new Date(),
        },
      });
      await tx.aiOutput.create({
        data: {
          userId: args.actorUserId,
          modelProvider: "openai",
          modelName: call.modelName,
          module: "product_studio_image_search",
          prompt: call.prompt,
          output: call.rawOutput,
          structuredOutput: call.result as Prisma.InputJsonValue,
          sourceReferences: {
            projectId: project.id,
            searchId: search.id,
            keptListingUrls: kept.map((item) => item.pageUrl),
            droppedListings: dropped,
            verifiedWebSearchUrls: call.evidenceUrls,
            fetchedImages: fetched,
            observedAt: new Date().toISOString(),
          },
          tokenUsage: call.usage,
          status: "generated",
          assumptions: [],
          warnings,
          confidence: null,
        },
      });
    });
    await writeAudit({
      actorUserId: args.actorUserId,
      action: "product_studio.image_search_completed",
      entityType: "ProductStudioProject",
      entityId: project.id,
      afterData: {
        searchId: search.id,
        model: call.modelName,
        productIdentified: call.result.productIdentified,
        candidates: rows.length,
        fetched,
        listingUrls: kept.map((item) => item.pageUrl),
        droppedListings: dropped,
      },
    });
    return { searchId: search.id, candidates: rows.length, fetched };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.productStudioImageSearch.update({
      where: { id: search.id },
      data: { status: "failed", errorMessage: message, completedAt: new Date() },
    });
    await writeAudit({
      actorUserId: args.actorUserId,
      action: "product_studio.image_search_failed",
      entityType: "ProductStudioProject",
      entityId: project.id,
      afterData: { searchId: search.id, error: message },
    });
    throw error;
  }
}

/**
 * Makes a found seller image the project's authoritative photograph. The
 * image is fetched again and kept only if its hash matches the one shown.
 */
export async function selectCompetitorImage(args: {
  projectId: string;
  candidateId: string;
  actorUserId: string;
}): Promise<string> {
  await requireFeature(FEATURE_FLAGS.PRODUCT_STUDIO);
  const project = await loadSearchableProject(args.projectId);
  await assertNotUnderAutopilot(project, "Choosing a seller image");
  assertPhotosChangeable(project);
  const sourceCount = await prisma.productStudioAsset.count({
    where: { projectId: project.id, kind: "source" },
  });
  if (sourceCount >= MAX_SOURCE_PHOTOS) {
    throw new ProductStudioInputError(
      "A project holds at most " + String(MAX_SOURCE_PHOTOS) + " photographs; this one is full.",
    );
  }
  const candidate = await prisma.productStudioImageCandidate.findFirst({
    where: { id: args.candidateId, projectId: project.id },
    select: {
      id: true,
      sellerName: true,
      pageUrl: true,
      imageUrl: true,
      contentHash: true,
      fetchError: true,
      selectedAt: true,
      assetId: true,
    },
  });
  if (!candidate) throw new ProductStudioInputError("That seller image is not on this project.");
  if (candidate.fetchError || !candidate.contentHash) {
    throw new ProductStudioInputError(
      "That seller image could not be fetched when it was found, so it cannot be chosen.",
    );
  }
  if (candidate.assetId) {
    throw new ProductStudioInputError("That seller image is already this project's photograph.");
  }
  const outcome = await fetchCandidateImage(candidate.imageUrl);
  if (!outcome.ok) {
    throw new ProductStudioInputError(
      "The image at " + hostOf(candidate.imageUrl) + " could not be fetched now: " + outcome.reason,
    );
  }
  if (outcome.image.contentHash !== candidate.contentHash) {
    throw new ProductStudioInputError(
      "The image at " +
        hostOf(candidate.imageUrl) +
        " has changed since it was found. Search again before choosing it.",
    );
  }
  const host = hostOf(candidate.pageUrl).replace(/[^a-z0-9.-]/g, "_");
  const fileName = ("seller-image-" + host + "." + extensionFor(outcome.image.contentType)).slice(
    0,
    120,
  );
  const assetId = await prisma.$transaction(async (tx) => {
    const asset = await tx.productStudioAsset.create({
      data: {
        projectId: project.id,
        kind: "source",
        status: "uploaded",
        fileName,
        contentType: outcome.image.contentType,
        bytes: outcome.image.bytes,
        data: outcome.image.data,
        width: outcome.image.width,
        height: outcome.image.height,
        contentHash: outcome.image.contentHash,
        reportThumbnail: await reportThumbnailFor(outcome.image.data, outcome.image.contentType),
      },
      select: { id: true },
    });
    await tx.productStudioImageCandidate.update({
      where: { id: candidate.id },
      data: { selectedAt: new Date(), assetId: asset.id },
    });
    return asset.id;
  });
  await writeAudit({
    actorUserId: args.actorUserId,
    action: "product_studio.seller_image_selected",
    entityType: "ProductStudioProject",
    entityId: project.id,
    beforeData: { sourceImageCount: sourceCount },
    afterData: {
      sourceImageCount: sourceCount + 1,
      assetId,
      candidateId: candidate.id,
      sellerName: candidate.sellerName,
      pageUrl: candidate.pageUrl,
      imageUrl: candidate.imageUrl,
      contentHash: outcome.image.contentHash,
    },
  });
  return assetId;
}

/** The latest search on a project with its candidates, thumbnails excluded. */
export async function latestImageSearch(projectId: string) {
  return prisma.productStudioImageSearch.findFirst({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      errorMessage: true,
      warnings: true,
      createdAt: true,
      completedAt: true,
      candidates: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          sellerName: true,
          pageTitle: true,
          pageUrl: true,
          imageUrl: true,
          sourceType: true,
          imageKind: true,
          notes: true,
          matchConfidence: true,
          contentType: true,
          bytes: true,
          width: true,
          height: true,
          fetchError: true,
          selectedAt: true,
          assetId: true,
        },
      },
    },
  });
}

export type SellerProvenance = { sellerName: string; pageUrl: string; imageUrl: string };

/** Which of a project's photographs came from a seller's listing, by asset id. */
export async function sellerProvenanceByAsset(
  projectId: string,
): Promise<Map<string, SellerProvenance>> {
  const rows = await prisma.productStudioImageCandidate.findMany({
    where: { projectId, assetId: { not: null } },
    select: { assetId: true, sellerName: true, pageUrl: true, imageUrl: true },
  });
  const map = new Map<string, SellerProvenance>();
  for (const row of rows) {
    if (row.assetId) {
      map.set(row.assetId, {
        sellerName: row.sellerName,
        pageUrl: row.pageUrl,
        imageUrl: row.imageUrl,
      });
    }
  }
  return map;
}

/** A candidate's thumbnail for the page, or null. */
export async function getImageCandidateThumbnail(id: string) {
  return prisma.productStudioImageCandidate.findUnique({
    where: { id },
    select: { id: true, thumbnail: true, contentHash: true },
  });
}
