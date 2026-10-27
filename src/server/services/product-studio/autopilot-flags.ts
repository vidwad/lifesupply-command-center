/**
 * The flags an unattended Product Studio run needs, shared by the write
 * service and the read-only queries so the two can never disagree.
 */
import { FEATURE_FLAGS, type FeatureFlagKey } from "@/lib/feature-flags";

/** All three must be on for a run to start or to take its next step. */
export const REQUIRED_AUTOPILOT_FLAGS: readonly FeatureFlagKey[] = [
  FEATURE_FLAGS.PRODUCT_STUDIO,
  FEATURE_FLAGS.PRODUCT_STUDIO_IMAGE_GENERATION,
  FEATURE_FLAGS.PRODUCT_STUDIO_AUTOPILOT,
];
