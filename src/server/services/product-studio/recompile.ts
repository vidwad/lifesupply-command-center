/**
 * Rebuilds a stored composition prompt from the research already on disk.
 *
 * The image prompt is compiled once, at research time, and stored on the
 * composition row. Generation reads that stored text and only appends the QA
 * and operator blocks. So every later improvement to the prompt compiler —
 * depiction rules, frame aspect, honest degradation — reaches new projects
 * only, and existing projects keep their original prompt forever.
 *
 * Recompiling closes that gap. It is a pure rebuild from stored data: the brief
 * lives in `composition.attributes`, the identity and listing copy in
 * `project.researchSummary`. No provider call, no cost, and research itself is
 * untouched, so provenance is preserved.
 */
import type { ProductStudioCompositionBrief } from "./types";

type CompositionRow = {
  slot: number;
  name: string;
  rationale: string;
  sourceSeller: string | null;
  sourceUrl: string | null;
  referenceImageUrl: string | null;
  attributes: unknown;
};

export type RecompileIdentity = {
  brand: string;
  model: string;
  modelIdentifiers: string[];
  conditionNotes: string[];
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function str(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function strArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

/**
 * Reconstructs the brief the compiler expects. Every text field falls back to a
 * neutral placeholder rather than an empty string: the compiler interpolates
 * these directly, and a blank line in a prompt reads as an instruction to the
 * model to decide for itself.
 */
export function rebuildCompositionBrief(row: CompositionRow): ProductStudioCompositionBrief {
  const a = record(row.attributes);
  return {
    slot: row.slot,
    name: row.name,
    whyEffective: str(row.rationale, "not recorded"),
    sourceSeller: row.sourceSeller,
    sourceUrl: row.sourceUrl,
    referenceImageUrl: row.referenceImageUrl,
    purpose: str(a.purpose, "not recorded"),
    layout: str(a.layout, "not recorded"),
    background: str(a.background, "clean neutral studio background"),
    lighting: str(a.lighting, "soft, even studio lighting"),
    cameraAngle: str(a.cameraAngle, "not recorded"),
    productOrientation: str(a.productOrientation, "not recorded"),
    productPlacement: str(a.productPlacement, "not recorded"),
    shadowTreatment: str(a.shadowTreatment, "soft natural contact shadow"),
    cropAndNegativeSpace: str(a.cropAndNegativeSpace, "not recorded"),
    depthOfField: str(a.depthOfField, "deep depth of field, product fully sharp"),
    props: strArray(a.props),
    accessoriesExclude: strArray(a.accessoriesExclude),
    conditionMustShow: strArray(a.conditionMustShow),
    negativeConstraints: strArray(a.negativeConstraints),
  };
}

/** Identity block for the compiler, read defensively from stored research. */
export function rebuildIdentity(researchSummary: unknown): RecompileIdentity {
  const identity = record(record(researchSummary).identifiedProduct);
  return {
    brand: str(identity.brand, "as shown in the reference photographs"),
    model: str(identity.model, "as shown in the reference photographs"),
    modelIdentifiers: strArray(identity.modelIdentifiers),
    conditionNotes: strArray(identity.conditionNotes),
  };
}

/** Listing copy for the compiler, preferring confirmed values over intake. */
export function rebuildListing(
  researchSummary: unknown,
  fallback: { title: string; shortDescription: string },
): { title: string; shortDescription: string } {
  const listing = record(record(researchSummary).optimizedListing);
  return {
    title: str(listing.title, fallback.title),
    shortDescription: str(listing.shortDescription, fallback.shortDescription),
  };
}
