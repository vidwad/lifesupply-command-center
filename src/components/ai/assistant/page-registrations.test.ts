/**
 * Page registrations (docs/43 Stage 4, 2026-11-06): the main modules tell
 * the assistant what they show. Canaries hold each registration in place
 * and keep the figures to what the page renders.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..", "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8").replace(/\r\n/g, "\n");
const page = (rel: string) => read(join("src/app/(dashboard)", rel));

const REGISTERED: Record<string, { route: string; expects: string[] }> = {
  "dashboard/page.tsx": {
    route: "/dashboard",
    expects: ['label: "Revenue"', 'label: "Open orders"'],
  },
  "customers/page.tsx": { route: "/customers", expects: ['label: "Customers matching"'] },
  "customers/[id]/page.tsx": {
    route: "/customers/[id]",
    expects: ['entity: { type: "customer", id: customer.id', 'label: "Lifetime value"'],
  },
  "orders/page.tsx": {
    route: "/orders",
    expects: ['label: "Orders matching"', "divisionId: filters.divisionId"],
  },
  "orders/[id]/page.tsx": {
    route: "/orders/[id]",
    expects: [
      'entity: { type: "order", id: order.id',
      'label: "Total", value: formatCurrency(order.grandTotal)',
    ],
  },
  "products/page.tsx": {
    route: "/products",
    expects: ["performanceRange: range.description", 'label: "Products matching"'],
  },
  "products/[id]/page.tsx": {
    route: "/products/[id]",
    expects: ['entity: { type: "product", id: product.id', 'label: "Revenue, 90 days"'],
  },
  "analytics/page.tsx": {
    route: "/analytics",
    expects: ['label: "Sessions"', 'label: "Conversion"'],
  },
  "operations/page.tsx": {
    route: "/operations",
    expects: ["filters: { view: data.view", 'label: "Flagged exceptions"'],
  },
  "operations/exceptions/page.tsx": {
    route: "/operations/exceptions",
    expects: ['label: "Exceptions listed"'],
  },
  "financials/page.tsx": {
    route: "/financials",
    expects: ["from: data.period.startDate.slice(0, 10)", 'label: "Approval"'],
  },
};

describe("the main modules register what they show for the assistant", () => {
  for (const [rel, { route, expects }] of Object.entries(REGISTERED)) {
    it(`${rel} registers ${route}`, () => {
      const src = page(rel);
      expect(src).toContain(
        'import { AssistantPageContext } from "@/components/ai/assistant/page-context";',
      );
      expect(src).toContain("<AssistantPageContext");
      expect(src).toContain(`route: "${route}"`);
      for (const text of expects) expect(src).toContain(text);
      // Registered once, just before the header of the page's main branch, so
      // the drawer knows the page as soon as it renders. (Financials renders
      // an empty-state header first when there is nothing to show.)
      expect(src.match(/<AssistantPageContext/g)).toHaveLength(1);
      const at = src.indexOf("<AssistantPageContext");
      const nextHeader = src.indexOf("<PageHeader", at);
      expect(nextHeader).toBeGreaterThan(at);
      expect(src.slice(at, nextHeader)).not.toContain("</div>");
    });
  }
});

describe("draft_task reaches the drawer and creates only on confirmation", () => {
  it("the turn carries the drafts, the drawer shows a Create button, and Create posts to the tasks route", () => {
    expect(read("src/app/api/ai/assistant/chat/route.ts")).toContain(
      "drafts: draftsFromToolCalls(result.toolCalls)",
    );
    const drawer = read("src/components/ai/assistant/AssistantDrawer.tsx");
    expect(drawer).toContain("<DraftCards drafts={turn.drafts} aiOutputId={turn.aiOutputId} />");
    expect(drawer).toContain("<DraftCards drafts={state.drafts} aiOutputId={null} />");
    const cards = read("src/components/ai/assistant/DraftCards.tsx");
    expect(cards).toContain('TASKS_ROUTE = "/api/ai/assistant/tasks"');
    expect(cards).toContain("Create task");
    const route = read("src/app/api/ai/assistant/tasks/route.ts");
    expect(route).toContain("requirePermission(PERMISSIONS.TASKS_CREATE)");
    expect(route).toContain('sourceType: "ai_recommendation"');
    expect(route).toContain("createdById: user.id");
  });
});
