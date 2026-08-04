/**
 * Campaign audience streams for the LifeSupply reactivation program
 * (Phase 5 — docs/19). Pure, so stream assignment is unit-tested.
 *
 * The six streams from the roadmap, with treatment:
 *   high_value        — LTV ≥ $5k → MANUAL outreach tasks, never generic blasts
 *   b2b_institutional — B2B / clinic / institutional → separated B2B email track
 *   recent_buyers     — consumers, last order 0–90 days   → consumer email track
 *   warm_lapsing      — consumers, last order 91–365 days → consumer email track
 *   deep_lapsed       — consumers, 366–730 days → consumer track AFTER consent
 *                       review (flagged requiresReview)
 *   dormant_research  — >730 days or never ordered → NO email; suppression +
 *                       research only
 *
 * Precedence: high_value → b2b_institutional → recency windows → dormant.
 * A $10k B2B account is a high-value manual workflow, not a B2B blast.
 */

export type CampaignStreamKey =
  | "high_value"
  | "b2b_institutional"
  | "recent_buyers"
  | "warm_lapsing"
  | "deep_lapsed"
  | "dormant_research";

export type StreamTreatment = "manual_outreach" | "email_b2b" | "email_consumer" | "no_email";

export type StreamDefinition = {
  key: CampaignStreamKey;
  label: string;
  description: string;
  treatment: StreamTreatment;
  /** Deep-lapsed audiences need an explicit consent review before sending. */
  requiresReview: boolean;
};

export const HIGH_VALUE_LTV_THRESHOLD = 5_000;
export const B2B_CUSTOMER_TYPES = new Set(["b2b", "clinic", "institutional"]);

export const STREAM_DEFINITIONS: Record<CampaignStreamKey, StreamDefinition> = {
  high_value: {
    key: "high_value",
    label: "High-value accounts",
    description: `Lifetime value ≥ $${HIGH_VALUE_LTV_THRESHOLD.toLocaleString()}. Personal outreach tasks — never generic blasts.`,
    treatment: "manual_outreach",
    requiresReview: false,
  },
  b2b_institutional: {
    key: "b2b_institutional",
    label: "B2B / institutional",
    description: "Clinics, institutions, and B2B accounts. Separate B2B email sequence.",
    treatment: "email_b2b",
    requiresReview: false,
  },
  recent_buyers: {
    key: "recent_buyers",
    label: "Recent buyers (0–90d)",
    description: "Replenishment reminders while the relationship is fresh.",
    treatment: "email_consumer",
    requiresReview: false,
  },
  warm_lapsing: {
    key: "warm_lapsing",
    label: "Warm / lapsing (91–365d)",
    description: "Core reactivation window — best odds of winning the customer back.",
    treatment: "email_consumer",
    requiresReview: false,
  },
  deep_lapsed: {
    key: "deep_lapsed",
    label: "Deep lapsed (366–730d)",
    description:
      "Approaching the end of the implied-consent window. Requires consent review before send.",
    treatment: "email_consumer",
    requiresReview: true,
  },
  dormant_research: {
    key: "dormant_research",
    label: "Dormant / no purchase (>730d)",
    description:
      "Outside the implied-consent window or never purchased. No email — suppression + research only.",
    treatment: "no_email",
    requiresReview: false,
  },
};

export const ALL_STREAM_KEYS = Object.keys(STREAM_DEFINITIONS) as CampaignStreamKey[];

export type StreamAssignmentInput = {
  customerType: string;
  lifetimeValue: number;
  daysSinceLastOrder: number | null;
};

export function assignStream(input: StreamAssignmentInput): CampaignStreamKey {
  if (input.lifetimeValue >= HIGH_VALUE_LTV_THRESHOLD) return "high_value";
  if (B2B_CUSTOMER_TYPES.has(input.customerType)) return "b2b_institutional";
  const days = input.daysSinceLastOrder;
  if (days == null) return "dormant_research";
  if (days <= 90) return "recent_buyers";
  if (days <= 365) return "warm_lapsing";
  if (days <= 730) return "deep_lapsed";
  return "dormant_research";
}

// ---------------------------------------------------------------------------
// Sequences — editable defaults the builder pre-fills.
// ---------------------------------------------------------------------------

export type SequenceStep = {
  /** Days after the program start date. */
  day: number;
  subject: string;
  purpose: string;
};

export const DEFAULT_CONSUMER_SEQUENCE: SequenceStep[] = [
  {
    day: 0,
    subject: "We miss you at LifeSupply — here's what's new",
    purpose: "Warm re-introduction + top products since their last order.",
  },
  {
    day: 4,
    subject: "Time to restock? Your replenishment reminder",
    purpose: "Replenishment nudge on their product categories + the offer.",
  },
  {
    day: 10,
    subject: "Last chance — your offer ends soon",
    purpose: "Urgency close on the offer; final touch of the sequence.",
  },
];

export const DEFAULT_B2B_SEQUENCE: SequenceStep[] = [
  {
    day: 0,
    subject: "A check-in from your LifeSupply account team",
    purpose: "Relationship-first check-in; volume/reorder support, no hard sell.",
  },
  {
    day: 7,
    subject: "Volume pricing + dedicated support for your organization",
    purpose: "Concrete B2B value: pricing tiers, invoicing, dedicated contact.",
  },
];

/** Assemble a plain-text body outline from a sequence (the track's bodyDraft). */
export function sequenceToBodyOutline(
  sequence: SequenceStep[],
  args: { offerStrategy: string; productFocus: string },
): string {
  const lines: string[] = [];
  lines.push(`Offer: ${args.offerStrategy || "(none specified)"}`);
  lines.push(`Product focus: ${args.productFocus || "(none specified)"}`);
  lines.push("");
  for (const [i, step] of sequence.entries()) {
    lines.push(`Email ${i + 1} (day ${step.day}): ${step.subject}`);
    lines.push(`  Purpose: ${step.purpose}`);
    lines.push("");
  }
  lines.push("(Draft outline generated by the Campaign Builder — edit before approval.)");
  return lines.join("\n");
}
