/**
 * Read-only product projection contract (Stage 8, WB-804). Recorded, not
 * built: no store feed is approved and no defined need exists yet. When a
 * channel owner approves one, a projection maps a store listing to this
 * shape and the corporate site renders it under the rules below. Nothing
 * here fetches, caches, or renders.
 *
 * Rules (guide §5 commerce contract):
 * - The store owns price, stock, checkout, and policy; a projection only
 *   points at the listing. Price is optional and is never shown when the
 *   projection is stale or the currency is missing.
 * - Staleness is explicit: past `maxAgeMinutes` the entry renders as a
 *   link with no price or availability, and never invents either.
 * - Region and currency come from the store, never from the visitor.
 */
import { z } from "zod";

export const productProjectionSchema = z
  .object({
    /** Brand registry key of the store that owns the listing. */
    store: z.enum(["lifesupply", "wellmart", "balkowitsch"]),
    sku: z.string().min(1).max(64),
    /** Variant or pack description as the store states it; null for a single listing. */
    variant: z.string().min(1).max(120).nullable(),
    /** Manufacturer part or catalogue reference, if published by the store. */
    manufacturerRef: z.string().min(1).max(120).nullable(),
    currency: z.enum(["CAD", "USD"]),
    region: z.enum(["CA", "US"]),
    availability: z.enum(["in_stock", "backorder", "unavailable", "unknown"]),
    /** Store price in the store's currency; optional, and unused when stale. */
    price: z.number().nonnegative().nullable(),
    /** The listing on the store; must be on the store's own host. */
    destinationUrl: z.string().url(),
    /** When the store last confirmed this row. */
    updatedAt: z.string().datetime(),
  })
  .strict();

export type ProductProjection = z.infer<typeof productProjectionSchema>;

export const PROJECTION_MAX_AGE_MINUTES = 60;

export function isStaleProjection(
  projection: Pick<ProductProjection, "updatedAt">,
  now = new Date(),
  maxAgeMinutes = PROJECTION_MAX_AGE_MINUTES,
) {
  return now.getTime() - new Date(projection.updatedAt).getTime() > maxAgeMinutes * 60_000;
}

/** What a page may show for a projection: never a stale price or stock claim. */
export function projectionDisplay(projection: ProductProjection, now = new Date()) {
  const stale = isStaleProjection(projection, now);
  return {
    stale,
    showPrice: !stale && projection.price !== null,
    showAvailability: !stale && projection.availability !== "unknown",
    destinationUrl: projection.destinationUrl,
  };
}
