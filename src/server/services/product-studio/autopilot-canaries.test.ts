/**
 * Unattended-run source-level canaries (2026-10-27).
 *
 * The run processor is the first code path that spends on research and
 * images, and approves drafts, without a person pressing a button each time.
 * These hold its controls in place: the Super Admin-only permission on
 * creation and cancellation, three flags re-checked at every step, an
 * Approval row and audit entries, no path to the store, and the manual
 * workflow refusing to touch a project the run owns.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..", "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8").replace(/\r\n/g, "\n");
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");

const SERVICE = "src/server/services/product-studio/autopilot.ts";
const READ_ONLY = "src/server/services/product-studio/autopilot-read.ts";
const POLICY = "src/server/services/product-studio/autopilot-policy.ts";
const SETTINGS = "src/server/services/product-studio/autopilot-settings.ts";
const FUNCTIONS = "src/server/inngest/functions/product-studio/autopilot.ts";
const ACTIONS = "src/app/(dashboard)/automation/product-studio/actions.ts";
const STUDIO = "src/server/services/product-studio/index.ts";

describe("unattended runs keep their controls", () => {
  it("creation and cancellation take the Super Admin-only publish permission, in the action and the service", () => {
    const service = stripComments(read(SERVICE));
    expect(service).toContain(
      "AUTOPILOT_PERMISSION = PERMISSIONS.PRODUCTS_APPROVE_BIGCOMMERCE_UPDATE",
    );
    expect(service.match(/requireAutopilotPermission\(args\.actorPermissions\)/g)?.length).toBe(2);
    const actions = stripComments(read(ACTIONS));
    expect(actions).toContain("requirePermission(PERMISSIONS.PRODUCTS_APPROVE_BIGCOMMERCE_UPDATE)");
    expect(actions.match(/await requireRunner\(\)/g)?.length).toBe(2);
  });

  it("re-checks all three flags before starting and before every step", () => {
    const flags = stripComments(read("src/server/services/product-studio/autopilot-flags.ts"));
    for (const flag of [
      "FEATURE_FLAGS.PRODUCT_STUDIO,",
      "FEATURE_FLAGS.PRODUCT_STUDIO_IMAGE_GENERATION,",
      "FEATURE_FLAGS.PRODUCT_STUDIO_AUTOPILOT,",
    ]) {
      expect(flags).toContain(flag);
    }
    const service = stripComments(read(SERVICE));
    // Creation, start, and the per-step checkpoint.
    expect(service.match(/await flagsBlockingAutopilot\(\)/g)?.length).toBe(3);
    expect(service).toContain('stage: { in: ["pending", "claimed"] }');
  });

  it("records an Approval row at creation and audits creation, cancellation, each product and completion", () => {
    const service = stripComments(read(SERVICE));
    expect(service).toContain('approvalType: "product_studio_autopilot"');
    for (const action of [
      "product_studio.autopilot_run_created",
      "product_studio.autopilot_run_cancel_requested",
      "product_studio.autopilot_item_completed",
      "product_studio.autopilot_item_needs_attention",
      "product_studio.autopilot_item_failed",
      "product_studio.autopilot_run_completed",
    ]) {
      expect(service, "must audit " + action).toContain(action);
    }
  });

  it("counts spend before each generation and stops at the ceiling and the failure rule", () => {
    const service = stripComments(read(SERVICE));
    expect(service.indexOf("imagesGenerated: { increment: 1 }")).toBeLessThan(
      service.indexOf("await runProductStudioGeneration({"),
    );
    expect(service).toContain("consecutiveFailures >= settings.stopAfterConsecutiveFailures");
    expect(stripComments(read(POLICY))).toContain("run.imagesGenerated >= settings.maxImagesTotal");
  });

  it("sends nothing to a store: no publish service, no BigCommerce client, publish mode fixed to none", () => {
    for (const file of [SERVICE, READ_ONLY, POLICY, SETTINGS, FUNCTIONS]) {
      const code = stripComments(read(file));
      expect(code, file).not.toMatch(/services\/product-studio\/publish["']/);
      expect(code, file).not.toContain("integrations/bigcommerce");
      expect(code, file).not.toContain("productStudioPublishLog");
    }
    expect(stripComments(read(SETTINGS))).toContain('PUBLISH_MODES = ["none"] as const');
  });

  it("marks automatic reviews as such and refuses manual steps on a project a live run owns", () => {
    const studio = stripComments(read(STUDIO));
    expect(studio).toContain("autoReviewedAt: args.automatic ? new Date() : null");
    expect(studio).toContain("automatic: true");
    // Research, generation, manual review, deletion and recompiling.
    expect(studio.match(/await assertNotUnderAutopilot\(/g)?.length).toBe(5);
    expect(stripComments(read(SERVICE))).toContain("automatic: {");
  });

  it("the worker functions are thin and serialise per item; the pages read only the read-only module", () => {
    const functions = stripComments(read(FUNCTIONS));
    expect(functions).toContain('concurrency: { limit: 1, key: "event.data.itemId" }');
    expect(functions).not.toMatch(/prisma|openai|generateProductImage|researchProduct/);
    const worker = stripComments(read("src/worker.ts"));
    expect(worker).toContain("startProductStudioAutopilotRun");
    expect(worker).toContain("processProductStudioAutopilotItem");
    for (const page of [
      "src/app/(dashboard)/automation/product-studio/page.tsx",
      "src/app/(dashboard)/automation/product-studio/new/page.tsx",
      "src/app/(dashboard)/automation/product-studio/[id]/page.tsx",
    ]) {
      const code = stripComments(read(page));
      expect(code, page).toContain("product-studio/autopilot-read");
      expect(code, page).not.toMatch(/services\/product-studio\/autopilot["']/);
    }
    expect(stripComments(read(READ_ONLY))).not.toMatch(/inngest|jobs|openai/);
  });

  it("the shared job services keep their flag checks, and the event functions still re-check too", () => {
    const jobs = stripComments(read("src/server/services/product-studio/jobs.ts"));
    expect(jobs).toContain("requireFeature(FEATURE_FLAGS.PRODUCT_STUDIO)");
    expect(jobs).toContain("requireFeature(FEATURE_FLAGS.PRODUCT_STUDIO_IMAGE_GENERATION)");
    expect(jobs).not.toMatch(/inngest/);
    const process = stripComments(read("src/server/inngest/functions/product-studio/process.ts"));
    expect(process).toContain("requireFeature(FEATURE_FLAGS.PRODUCT_STUDIO)");
    expect(process).toContain("runProductStudioResearch(");
    expect(process).toContain("runProductStudioGeneration({");
  });
});
