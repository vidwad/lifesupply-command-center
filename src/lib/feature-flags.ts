/**
 * Feature flag keys used by the application. Keep in sync with the
 * `FeatureFlag` table seed in prisma/seed/feature-flags.ts.
 *
 * Per docs/14 §16 + docs/16 §16, every high-risk capability must gate on a
 * flag so it can be disabled without a redeploy. Flags listed here default
 * to OFF when the row is absent.
 */
export const FEATURE_FLAGS = {
  /** Run any supplier portal automation (login, scrape, prepare). */
  SUPPLIER_AUTOMATION: "supplier.automation",
  /** Submit prepared supplier orders to the supplier portal. */
  SUPPLIER_ORDER_SUBMIT: "supplier.order_submit",
  /** Allow BigCommerce write-backs (price, inventory, fulfillment). */
  EXTERNAL_WRITEBACKS: "external.writebacks",
  /** Allow QuickBooks write-backs (journal entries, adjustments). */
  QUICKBOOKS_WRITEBACKS: "quickbooks.writebacks",
  /** Allow AI to initiate any mutation. AI may always read + draft. */
  AI_ACTIONS: "ai.actions",
  /** Allow outbound Mailchimp sends (campaigns, segments). */
  MAILCHIMP_SEND: "mailchimp.send",
  /** Generate and distribute investor-facing materials. */
  INVESTOR_DISTRIBUTION: "investor.distribution",
  /** Use forecasting / scenario planning routes. */
  FORECASTING: "forecasting.enabled",
} as const;

export type FeatureFlagKey = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

export const ALL_FEATURE_FLAG_KEYS: FeatureFlagKey[] = Object.values(FEATURE_FLAGS);

/**
 * Human descriptions for the admin UI. Keep concise — the admin column has
 * limited width.
 */
export const FEATURE_FLAG_DESCRIPTIONS: Record<FeatureFlagKey, string> = {
  [FEATURE_FLAGS.SUPPLIER_AUTOMATION]:
    "Run supplier portal automation (login, scrape, prepare). Read-only checks.",
  [FEATURE_FLAGS.SUPPLIER_ORDER_SUBMIT]:
    "Submit prepared supplier orders. Requires supplier.automation also on.",
  [FEATURE_FLAGS.EXTERNAL_WRITEBACKS]:
    "Push updates back to BigCommerce (prices, inventory, fulfillment).",
  [FEATURE_FLAGS.QUICKBOOKS_WRITEBACKS]:
    "Push journal entries / adjustments to QuickBooks.",
  [FEATURE_FLAGS.AI_ACTIONS]:
    "Allow AI to initiate any mutation. AI can always read and draft.",
  [FEATURE_FLAGS.MAILCHIMP_SEND]:
    "Send Mailchimp campaigns and export segments.",
  [FEATURE_FLAGS.INVESTOR_DISTRIBUTION]:
    "Generate + distribute investor-facing materials.",
  [FEATURE_FLAGS.FORECASTING]: "Enable forecasting / scenario routes.",
};
