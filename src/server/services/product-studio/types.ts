import { z } from "zod";

const httpUrl = z
  .string()
  .url()
  .refine((value) => /^https?:\/\//i.test(value), {
    message: "Only HTTP(S) source URLs are allowed.",
  });

export const retailerSourceSchema = z.object({
  sellerName: z.string().min(1),
  pageTitle: z.string().nullable(),
  url: httpUrl,
  heroImageUrl: httpUrl.nullable(),
  sourceType: z.enum(["manufacturer", "retailer", "used_specialist", "marketplace"]),
  notes: z.string().min(1),
});

export const priceObservationSchema = z.object({
  sellerName: z.string().min(1),
  url: httpUrl,
  price: z.number().nonnegative(),
  currency: z.string().length(3),
  condition: z.string().nullable(),
  includedAccessories: z.string().nullable(),
  notes: z.string().nullable(),
});

export const compositionSchema = z.object({
  slot: z.number().int().min(1).max(4),
  name: z.string().min(1),
  /** Role this image plays in the product gallery (hero, condition view, …). */
  purpose: z.string().min(1),
  sourceSeller: z.string().nullable(),
  sourceUrl: httpUrl.nullable(),
  referenceImageUrl: httpUrl.nullable(),
  whyEffective: z.string().min(1),
  layout: z.string().min(1),
  background: z.string().min(1),
  lighting: z.string().min(1),
  cameraAngle: z.string().min(1),
  productOrientation: z.string().min(1),
  productPlacement: z.string().min(1),
  shadowTreatment: z.string().min(1),
  cropAndNegativeSpace: z.string().min(1),
  depthOfField: z.string().min(1),
  /** Accessories from the source photos that must appear in this frame. */
  props: z.array(z.string()),
  /** Accessories that must be left out of this specific frame. */
  accessoriesExclude: z.array(z.string()),
  /** Genuine condition details that must stay visible in this frame. */
  conditionMustShow: z.array(z.string()),
  negativeConstraints: z.array(z.string()),
});

export const productStudioResearchSchema = z
  .object({
    identifiedProduct: z.object({
      brand: z.string().min(1),
      model: z.string().min(1),
      canonicalTitle: z.string().min(1),
      modelIdentifiers: z.array(z.string()),
      conditionNotes: z.array(z.string()),
      /** Whether the photograph is the only evidence (used) or the contents are
       *  published by the manufacturer and identical per unit (new_sealed). */
      productMode: z.enum(["new_sealed", "used"]),
      /** Manufacturer-specified physical attributes that may be depicted in
       *  new_sealed mode, each traceable to a cited source. */
      depictableSpec: z.array(z.string()),
      confidence: z.number().min(0).max(1),
    }),
    optimizedListing: z.object({
      title: z.string().min(1),
      shortDescription: z.string().min(1),
      keyDetails: z.array(z.string()).min(1),
    }),
    benchmarkListing: z.object({
      sellerName: z.string().min(1),
      url: httpUrl,
      heroImageUrl: httpUrl.nullable(),
      whyStrongDescription: z.string().min(1),
      whyStrongHero: z.string().min(1),
    }),
    market: z.object({
      currency: z.string().length(3),
      low: z.number().nonnegative(),
      high: z.number().nonnegative(),
      median: z.number().nonnegative().nullable(),
      basis: z.string().min(1),
      observations: z.array(priceObservationSchema).min(1),
    }),
    sources: z.array(retailerSourceSchema).min(1),
    compositions: z.array(compositionSchema).length(4),
    methodology: z.string().min(1),
    warnings: z.array(z.string()),
  })
  .superRefine((value, ctx) => {
    if (value.market.low > value.market.high) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["market", "low"],
        message: "Market low must not exceed market high.",
      });
    }
    const slots = new Set(value.compositions.map((item) => item.slot));
    if (slots.size !== 4 || ![1, 2, 3, 4].every((slot) => slots.has(slot))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["compositions"],
        message: "Exactly one composition is required for each slot 1 through 4.",
      });
    }
  });

export type ProductStudioResearch = z.infer<typeof productStudioResearchSchema>;
export type ProductStudioCompositionBrief = z.infer<typeof compositionSchema>;

export const productStudioQaSchema = z.object({
  identityScore: z.number().min(0).max(1),
  conditionFidelityScore: z.number().min(0).max(1),
  compositionScore: z.number().min(0).max(1),
  textIntegrity: z.enum(["pass", "not_applicable", "fail"]),
  verdict: z.enum(["pass", "needs_review", "reject"]),
  differences: z.array(z.string()),
  /** Concrete changes a regeneration must make before this image can pass. */
  requiredCorrections: z.array(z.string()),
  warnings: z.array(z.string()),
  /** QA model's confidence in its own verdict, 0–1. */
  confidence: z.number().min(0).max(1),
});

export type ProductStudioQa = z.infer<typeof productStudioQaSchema>;
