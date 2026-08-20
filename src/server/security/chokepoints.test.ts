/**
 * High-risk action chokepoint canaries (Phase 11C — row 11C-14).
 *
 * Source-level guard that each high-risk capability keeps its layered
 * controls wired: feature-flag gate (requireFeature / isFeatureOn), and —
 * where the control model demands it — approval and audit references.
 * These complement the live combined-control tests that run in staging;
 * their job is to make silently removing a gate a CI failure.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SRC = join(__dirname, "..", "..");
const read = (rel: string) => readFileSync(join(SRC, rel), "utf8");

type Chokepoint = {
  capability: string;
  file: string;
  mustContain: string[];
};

const CHOKEPOINTS: Chokepoint[] = [
  {
    capability: "Mailchimp campaign export/send",
    file: "server/services/marketing/campaigns.ts",
    // partitionSnapshotByCurrentConsent = export-time suppression re-check
    // (11D-08): suppression must win at the last egress point too.
    mustContain: [
      "FEATURE_FLAGS.MAILCHIMP_SEND",
      "writeAudit",
      "partitionSnapshotByCurrentConsent",
    ],
  },
  {
    capability: "Supplier order submission",
    file: "server/services/automation/runs.ts",
    mustContain: [
      "FEATURE_FLAGS.SUPPLIER_ORDER_SUBMIT",
      "FEATURE_FLAGS.SUPPLIER_AUTOMATION",
      'approval.status !== "approved"',
    ],
  },
  {
    capability: "Supplier portal checks",
    file: "server/services/automation/checks.ts",
    mustContain: ["requireFeature(FEATURE_FLAGS.SUPPLIER_AUTOMATION)", "writeAudit"],
  },
  {
    capability: "Investor material release",
    file: "server/services/strategic/investor-updates.ts",
    mustContain: ["FEATURE_FLAGS.INVESTOR_DISTRIBUTION", "writeAudit"],
  },
  {
    capability: "Forecast scenario generation",
    file: "server/services/financials/forecast-scenarios.ts",
    mustContain: ["requireFeature(FEATURE_FLAGS.FORECASTING)", "writeAudit"],
  },
  {
    capability: "AI-initiated mutations",
    file: "server/services/ai/actions.ts",
    mustContain: ["FEATURE_FLAGS.AI_ACTIONS"],
  },
  {
    capability: "Product Studio image generation",
    file: "server/services/product-studio/index.ts",
    mustContain: [
      "FEATURE_FLAGS.PRODUCT_STUDIO_IMAGE_GENERATION",
      "requireFeature",
      "writeAudit",
    ],
  },
];

describe("high-risk chokepoints stay wired", () => {
  for (const point of CHOKEPOINTS) {
    it(point.capability, () => {
      const src = read(point.file);
      for (const needle of point.mustContain) {
        expect(src, `${point.file} must contain: ${needle}`).toContain(needle);
      }
    });
  }

  it("the Mailchimp export never auto-sends — campaigns land as drafts", () => {
    // Export creates the campaign in Mailchimp DRAFT state; the operator
    // sends from inside Mailchimp after final review (CLAUDE.md §13). An
    // actual `campaignsApi.send(...)` call appearing here is a CI failure.
    const src = read("server/services/marketing/campaigns.ts");
    expect(src).not.toContain("campaignsApi.send(");
    expect(src, "the deliberate no-send decision comment must stay").toContain(
      "deliberately do NOT",
    );
  });

  it("the kill switch covers every external-action flag", () => {
    const killSwitch = read("server/services/feature-flags/kill-switch.ts");
    for (const flag of [
      "SUPPLIER_AUTOMATION",
      "SUPPLIER_ORDER_SUBMIT",
      "EXTERNAL_WRITEBACKS",
      "QUICKBOOKS_WRITEBACKS",
      "AI_ACTIONS",
      "MAILCHIMP_SEND",
      "INVESTOR_DISTRIBUTION",
      "PRODUCT_STUDIO_IMAGE_GENERATION",
    ]) {
      expect(killSwitch, `kill switch must include ${flag}`).toContain(flag);
    }
  });

  it("feature flags default OFF when no row exists", () => {
    const service = read("server/services/feature-flags/index.ts");
    // The absent-row path must resolve to false — flags are opt-in.
    expect(service).toMatch(/\?\?\s*false|return false/);
  });
});
