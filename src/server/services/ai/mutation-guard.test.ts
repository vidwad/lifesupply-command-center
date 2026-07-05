import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * Structural guardrail (docs/09 §1, CLAUDE.md §13): the AI service may read
 * freely and draft into `AiOutput`, but it must NOT mutate any other business
 * model unless the mutation is routed through `requireAiAction` (the
 * ai.actions flag + underlying-permission gate in ./actions.ts).
 *
 * Today no AI path mutates, so `requireAiAction` has no callers — which is
 * exactly why this canary exists: the day someone adds an AI-initiated write
 * (e.g. `prisma.campaign.update(...)`) to index.ts without wiring the gate,
 * this test fails and points them at the chokepoint, instead of the write
 * shipping silently ungated.
 */

const PRISMA_WRITE =
  /prisma\.(\w+)\.(create|createMany|update|updateMany|upsert|delete|deleteMany)\b/g;

// Writes to these models are always allowed — they are the AI service's own
// draft/output surface, which the docs permit without the actions gate.
const ALLOWED_MODELS = new Set(["aiOutput"]);

function read(relative: string): string {
  return readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");
}

describe("AI service mutation guard", () => {
  it("index.ts writes only to AiOutput unless requireAiAction gates it", () => {
    const source = read("./index.ts");

    const writtenModels = new Set<string>();
    for (const match of source.matchAll(PRISMA_WRITE)) {
      writtenModels.add(match[1]!);
    }

    const gatedModels = [...writtenModels].filter((m) => !ALLOWED_MODELS.has(m));

    // If the AI service ever writes to a non-AiOutput model, it must import the
    // gate. This is a coarse canary, not a proof — but it converts "silently
    // ungated" into a loud, actionable CI failure.
    if (gatedModels.length > 0) {
      expect(
        source.includes("requireAiAction"),
        `AI service writes to non-AiOutput model(s) [${gatedModels.join(", ")}] but does not ` +
          `import requireAiAction. Route AI-initiated mutations through requireAiAction ` +
          `(src/server/services/ai/actions.ts) so they pass the ai.actions flag + permission gate.`,
      ).toBe(true);
    } else {
      // No gated mutations today — the guardrail is correctly a ready chokepoint.
      expect(gatedModels).toEqual([]);
    }
  });
});
