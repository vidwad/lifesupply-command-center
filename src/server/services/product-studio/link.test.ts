import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const here = (...parts: string[]) => readFileSync(join(__dirname, ...parts), "utf8");
const page = (...parts: string[]) =>
  readFileSync(join(__dirname, "..", "..", "..", "app", "(dashboard)", ...parts), "utf8");

/**
 * Linking a standalone project to a catalogue product (2026-10-28). These
 * canaries hold the shape of the feature: one-way, audited, offered only
 * where it is missing, and never a route to BigCommerce on its own.
 */
describe("linking a project to a catalogue product", () => {
  const link = here("link.ts");

  it("is refused on a project that already has a product, and under a live run", () => {
    expect(link).toContain("if (project.productId) {");
    expect(link).toContain("already linked to");
    expect(link).toContain('await assertNotUnderAutopilot(project, "Linking");');
  });

  it("links only to a product that still exists, and writes an audit row", () => {
    expect(link).toContain("where: { id: productId, deletedAt: null }");
    expect(link).toContain('action: "product_studio.project_linked"');
    expect(link).toContain("beforeData: { productId: null }");
  });

  it("spends nothing and sends nothing", () => {
    expect(link).not.toMatch(/inngest|openai|bigcommerce\/client|publishProductStudioProject/i);
  });

  it("tells the operator which candidates the publish service would refuse", () => {
    expect(link).toContain("unpublishableReason: resolvePublishTarget(product).reason");
    const panel = page("products", "studio", "[id]", "link-product-panel.tsx");
    expect(panel).toContain("disabled={candidate.unpublishableReason != null}");
  });

  it("the project page offers the panel only when there is no product", () => {
    const detail = page("products", "studio", "[id]", "page.tsx");
    expect(detail).toContain(
      "{project.product ? null : <LinkProductPanel projectId={project.id} query={linkQuery} />}",
    );
  });

  it("the intake page says whether the new project will be linked", () => {
    const intake = page("products", "studio", "new", "page.tsx");
    expect(intake).toContain("{productId && !product ? (");
    expect(intake).toContain("No catalogue product is linked.");
  });

  it("the run form warns before a publish mode is chosen for unlinked projects", () => {
    const form = page("automation", "product-studio", "new", "run-form.tsx");
    expect(form).toContain('{publishMode !== "none" && unlinkedCount > 0 ? (');
    const runPage = page("automation", "product-studio", "new", "page.tsx");
    expect(runPage).toContain(
      "unlinkedCount={eligible.filter((project) => !project.product).length}",
    );
  });
});
