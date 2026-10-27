/**
 * The criteria an unattended Product Studio run is created with (product
 * owner, 2026-10-27). Pure: parsing, bounds and defaults, no Prisma.
 *
 * A run freezes its settings as JSON at creation, so a run reads the same
 * criteria from its first product to its last whatever is changed later.
 */
import { z } from "zod";

import { MAX_BATCH_SIZE } from "./bulk";

/** Products in one run; the bulk batch size, so the two never disagree. */
export const MAX_RUN_PRODUCTS = MAX_BATCH_SIZE;
/** Hard ceiling on images in one run, whatever the form asks for. */
export const MAX_RUN_IMAGES = 400;
/** Lanes of products processed at the same time. */
export const MAX_PARALLEL_PRODUCTS = 4;

/**
 * What the run may send to the store. Publishing from a run is wired in a
 * later release; until then the only accepted value is "none", so a run
 * finishes with approved drafts for a Super Admin to publish by hand.
 */
export const PUBLISH_MODES = ["none"] as const;
export type PublishMode = (typeof PUBLISH_MODES)[number];

export const autopilotSettingsSchema = z.object({
  /**
   * The lowest of a draft's identity, condition and composition QA scores
   * must reach this for the draft to be approved automatically; below it the
   * draft is rejected and regenerated.
   */
  minImageScore: z.number().min(0.5).max(1),
  /** Extra attempts per slot after the first image, before the slot is left for a person. */
  maxRegenerationsPerSlot: z.number().int().min(0).max(4),
  /**
   * Research must be at least this sure it identified the exact product
   * before any image is generated; below it the product stops, unspent.
   */
  minIdentityConfidence: z.number().min(0.5).max(1),
  /** Compositions to generate per product, slots 1 to n. */
  imagesPerProduct: z.number().int().min(1).max(4),
  /** The most products a run may hold. Enforced at creation. */
  maxProducts: z.number().int().min(1).max(MAX_RUN_PRODUCTS),
  /** Spend ceiling: the run stops generating once this many images exist across its products. */
  maxImagesTotal: z.number().int().min(1).max(MAX_RUN_IMAGES),
  /** Products processed at the same time. */
  parallelProducts: z.number().int().min(1).max(MAX_PARALLEL_PRODUCTS),
  /** Stop the whole run after this many products fail one after another. */
  stopAfterConsecutiveFailures: z.number().int().min(1).max(10),
  publishMode: z.enum(PUBLISH_MODES),
  /** Open a Task for the creator listing products that need attention. */
  createTask: z.boolean(),
});

export type AutopilotSettings = z.infer<typeof autopilotSettingsSchema>;

export const DEFAULT_AUTOPILOT_SETTINGS: AutopilotSettings = {
  minImageScore: 0.8,
  maxRegenerationsPerSlot: 2,
  minIdentityConfidence: 0.8,
  imagesPerProduct: 4,
  maxProducts: 10,
  maxImagesTotal: 80,
  parallelProducts: 2,
  stopAfterConsecutiveFailures: 3,
  publishMode: "none",
  createTask: true,
};

export class AutopilotSettingsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AutopilotSettingsError";
  }
}

/** Validates stored or submitted settings; the message names the first bad field. */
export function parseAutopilotSettings(value: unknown): AutopilotSettings {
  const parsed = autopilotSettingsSchema.safeParse(value);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path.join(".") || "settings";
    throw new AutopilotSettingsError(`${field}: ${issue?.message ?? "invalid"}`);
  }
  return parsed.data;
}

function numberField(form: FormData, name: string, fallback: number, percent = false): number {
  const raw = String(form.get(name) ?? "").trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new AutopilotSettingsError(`${name}: enter a number.`);
  return percent ? value / 100 : value;
}

/**
 * Reads the run form. Scores are entered as whole percentages (80 for 0.8)
 * because that is how the QA scores are shown on the project page.
 */
export function autopilotSettingsFromForm(form: FormData): AutopilotSettings {
  const d = DEFAULT_AUTOPILOT_SETTINGS;
  const publishMode = String(form.get("publishMode") ?? d.publishMode);
  return parseAutopilotSettings({
    minImageScore: numberField(form, "minImageScore", d.minImageScore, true),
    maxRegenerationsPerSlot: numberField(
      form,
      "maxRegenerationsPerSlot",
      d.maxRegenerationsPerSlot,
    ),
    minIdentityConfidence: numberField(
      form,
      "minIdentityConfidence",
      d.minIdentityConfidence,
      true,
    ),
    imagesPerProduct: numberField(form, "imagesPerProduct", d.imagesPerProduct),
    maxProducts: numberField(form, "maxProducts", d.maxProducts),
    maxImagesTotal: numberField(form, "maxImagesTotal", d.maxImagesTotal),
    parallelProducts: numberField(form, "parallelProducts", d.parallelProducts),
    stopAfterConsecutiveFailures: numberField(
      form,
      "stopAfterConsecutiveFailures",
      d.stopAfterConsecutiveFailures,
    ),
    publishMode,
    createTask: form.get("createTask") === "1",
  });
}

/**
 * The most images the settings allow for a given number of products: every
 * slot generated once plus every permitted regeneration, capped by the
 * run's own ceiling. Shown on the form as the worst-case spend.
 */
export function estimateMaxImages(settings: AutopilotSettings, productCount: number): number {
  const perProduct = settings.imagesPerProduct * (1 + settings.maxRegenerationsPerSlot);
  return Math.min(settings.maxImagesTotal, perProduct * productCount);
}

/** One line per setting, for the run page and the audit record. */
export function describeAutopilotSettings(settings: AutopilotSettings): string[] {
  const pct = (value: number) => `${Math.round(value * 100)}%`;
  return [
    `Approve a draft when its lowest QA score is at least ${pct(settings.minImageScore)}; otherwise reject and regenerate.`,
    `Up to ${settings.maxRegenerationsPerSlot} regeneration${settings.maxRegenerationsPerSlot === 1 ? "" : "s"} per image before the slot is left for a person.`,
    `Stop a product before any image when research is less than ${pct(settings.minIdentityConfidence)} sure of the exact product.`,
    `${settings.imagesPerProduct} image${settings.imagesPerProduct === 1 ? "" : "s"} per product.`,
    `At most ${settings.maxProducts} products and ${settings.maxImagesTotal} images in the run.`,
    `${settings.parallelProducts} product${settings.parallelProducts === 1 ? "" : "s"} at a time.`,
    `Stop the run after ${settings.stopAfterConsecutiveFailures} consecutive product failures.`,
    settings.publishMode === "none"
      ? "Nothing is sent to BigCommerce; approved drafts wait for a Super Admin to publish."
      : `Publish mode: ${settings.publishMode}.`,
    settings.createTask
      ? "Open a Task for products that need attention."
      : "No Task is opened; the run page is the record.",
  ];
}
